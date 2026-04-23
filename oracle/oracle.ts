import { ethers } from "ethers";
import axios from "axios";
import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PRIVATE_KEY || !CONTRACT_ADDRESS || !DEEPSEEK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing required environment variables. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
    process.exit(1);
}

// Initialize Supabase Client with Service Role Key to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ABI = [
    "event MarketCreated(uint256 indexed marketId, string question, uint48 expiresAt, address creator)",
    "event PredictionMade(uint256 indexed marketId, address indexed predictor, uint8 prediction, uint256 amount)",
    "event SettlementRequested(uint256 indexed marketId, string question)",
    "event MarketSettled(uint256 indexed marketId, uint8 outcome)",
    "function settleMarket(uint256 marketId, uint8 outcome) external",
    "function markets(uint256) view returns (address creator, uint48 createdAt, uint48 expiresAt, uint48 settledAt, bool settled, uint8 outcome, uint256 totalYesPool, uint256 totalNoPool, string question)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

let lastBlockProcessed = 0; // State for polling

const SYSTEM_PROMPT = `
You are a fact-checking and event resolution system that determines the real-world outcome of prediction markets.
Your task: Verify whether a given event has occurred based on factual, publicly verifiable information.
OUTPUT FORMAT: You MUST respond with a SINGLE JSON object with this exact structure:
{"result": "YES" | "NO", "confidence": <integer 0-100>}
"YES" = the event happened as stated.
"NO" = the event did not happen as stated.
`;

async function queryDeepSeek(question: string): Promise<number> {
    console.log(`[DeepSeek] Querying outcome for: "${question}"`);
    try {
        const response = await axios.post(
            "https://api.deepseek.com/v1/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: `Market question: ${question}` }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
                }
            }
        );

        const content = response.data.choices[0].message.content;
        const parsed = JSON.parse(content);
        console.log(`[DeepSeek] Answer:`, parsed);

        return parsed.result === "YES" ? 0 : 1; // 0 for Yes, 1 for No in our enum
    } catch (error) {
        console.error("[DeepSeek] Error querying API:", error);
        return 1; // Default to No on error
    }
}

async function checkEvents() {
    try {
        const currentBlock = await provider.getBlockNumber();
        if (lastBlockProcessed === 0) {
            lastBlockProcessed = currentBlock - 100; // Look back a bit on startup
        }

        if (currentBlock <= lastBlockProcessed) return;

        console.log(`[Oracle] Crawling events from block ${lastBlockProcessed + 1} to ${currentBlock}`);

        // --- Handle MarketCreated ---
        const createFilter = contract.filters.MarketCreated();
        const createEvents = await contract.queryFilter(createFilter, lastBlockProcessed + 1, currentBlock);
        for (const event of createEvents) {
            if ("args" in event) {
                const [marketId, question, expiresAt, creator] = event.args;
                console.log(`[Supabase Sync] Syncing New Market ${marketId}`);
                await supabase.from('markets').upsert({
                    id: Number(marketId),
                    question,
                    creator,
                    expires_at: new Date(Number(expiresAt) * 1000).toISOString(),
                    settled: false,
                    total_yes_pool: 0,
                    total_no_pool: 0
                });
            }
        }

        // --- Handle PredictionMade ---
        const predictFilter = contract.filters.PredictionMade();
        const predictEvents = await contract.queryFilter(predictFilter, lastBlockProcessed + 1, currentBlock);
        for (const event of predictEvents) {
            if ("args" in event) {
                const [marketId, predictor, prediction, amount] = event.args;
                console.log(`[Supabase Sync] Syncing Prediction for Market ${marketId}`);
                
                // Fetch current pools from chain to ensure exact consistency
                const market = await contract.markets(marketId);
                
                await supabase.from('markets').update({
                    total_yes_pool: Number(market.totalYesPool),
                    total_no_pool: Number(market.totalNoPool)
                }).eq('id', Number(marketId));
            }
        }

        // --- Handle MarketSettled ---
        const settledFilter = contract.filters.MarketSettled();
        const settledEvents = await contract.queryFilter(settledFilter, lastBlockProcessed + 1, currentBlock);
        for (const event of settledEvents) {
            if ("args" in event) {
                const [marketId, outcome] = event.args;
                console.log(`[Supabase Sync] Syncing Settlement for Market ${marketId}`);
                
                await supabase.from('markets').update({
                    settled: true,
                    settled_at: new Date().toISOString(),
                    outcome: outcome === BigInt(0) ? 'YES' : 'NO'
                }).eq('id', Number(marketId));
            }
        }

        // --- Handle SettlementRequested (Oracle Job) ---
        const settleReqFilter = contract.filters.SettlementRequested();
        const settleReqEvents = await contract.queryFilter(settleReqFilter, lastBlockProcessed + 1, currentBlock);

        for (const event of settleReqEvents) {
            if ("args" in event) {
                const marketId = event.args[0];
                const question = event.args[1];

                const market = await contract.markets(marketId);
                if (market.settled) {
                    console.log(`[Oracle] Market ${marketId} already settled.`);
                    continue;
                }

                console.log(`[Oracle] Received SettlementRequested for Market ${marketId}: "${question}"`);
                
                const outcome = await queryDeepSeek(question);
                
                console.log(`[Oracle] Settling market ${marketId} with outcome: ${outcome === 0 ? 'YES' : 'NO'}`);
                try {
                    const tx = await contract.settleMarket(marketId, outcome);
                    console.log(`[Oracle] Tx sent: ${tx.hash}`);
                    await tx.wait();
                    console.log(`[Oracle] Market ${marketId} successfully settled.`);
                } catch (txError) {
                    console.error(`[Oracle] Failed to settle market ${marketId}:`, txError);
                }
            }
        }

        lastBlockProcessed = currentBlock;
    } catch (error) {
        console.error("[Oracle] Error checking events:", error);
    }
}

// Poll events every 15 seconds
const POLLING_INTERVAL = 15000;

console.log("[Oracle] Starting oracle node to crawl SettlementRequested events...");
setInterval(checkEvents, POLLING_INTERVAL);
checkEvents(); // Initial check
