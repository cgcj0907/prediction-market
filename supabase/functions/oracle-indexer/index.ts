// Supabase Edge Function: Oracle Indexer
// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { ethers } from "npm:ethers@6.13.2";

// Set up ABI
const ABI = [
  "event MarketCreated(uint256 indexed marketId, string question, uint48 expiresAt, address creator)",
  "event PredictionMade(uint256 indexed marketId, address indexed predictor, uint8 prediction, uint256 amount)",
  "event SettlementRequested(uint256 indexed marketId, string question)",
  "event MarketSettled(uint256 indexed marketId, uint8 outcome)",
  "function settleMarket(uint256 marketId, uint8 outcome) external",
  "function markets(uint256) view returns (address creator, uint48 createdAt, uint48 expiresAt, uint48 settledAt, bool settled, uint8 outcome, uint256 totalYesPool, uint256 totalNoPool, string question)"
];

const SYSTEM_PROMPT = `
You are a fact-checking and event resolution system that determines the real-world outcome of prediction markets.
Your task: Verify whether a given event has occurred based on factual, publicly verifiable information.
OUTPUT FORMAT: You MUST respond with a SINGLE JSON object with this exact structure:
{"result": "YES" | "NO", "confidence": <integer 0-100>}
"YES" = the event happened as stated.
"NO" = the event did not happen as stated.
`;

async function queryDeepSeek(question: string, apiKey: string): Promise<number> {
  console.log(`[DeepSeek] Querying outcome for: "${question}"`);
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Market question: ${question}` }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    console.log(`[DeepSeek] Answer:`, parsed);

    return parsed.result === "YES" ? 0 : 1; // 0 for Yes, 1 for No
  } catch (error) {
    console.error("[DeepSeek] Error querying API:", error);
    return 1; // Default to No on error
  }
}

Deno.serve(async (req) => {
  try {
    // 1. Load Environment Variables (Set these in Supabase Dashboard)
    const RPC_URL = Deno.env.get("RPC_URL");
    const PRIVATE_KEY = Deno.env.get("ORACLE_PRIVATE_KEY");
    const CONTRACT_ADDRESS = Deno.env.get("CONTRACT_ADDRESS");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !DEEPSEEK_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Missing required environment variables.");
    }

    // 2. Initialize Clients
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // 3. Get last processed block from Supabase `sync_state` table
    const { data: stateData, error: stateError } = await supabase
      .from('sync_state')
      .select('last_block')
      .eq('id', 'oracle')
      .single();

    let lastBlockProcessed = stateData?.last_block || 0;
    const currentBlock = await provider.getBlockNumber();

    // If it's the very first run, start from 100 blocks ago
    if (lastBlockProcessed === 0) {
      lastBlockProcessed = currentBlock - 100;
    }

    if (currentBlock <= lastBlockProcessed) {
      return new Response(JSON.stringify({ message: "Already up to date", currentBlock }), { status: 200 });
    }

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
        const [marketId] = event.args;
        console.log(`[Supabase Sync] Syncing Prediction for Market ${marketId}`);
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
        const outcome = await queryDeepSeek(question, DEEPSEEK_API_KEY);
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

    // 4. Update the sync state in Supabase
    await supabase.from('sync_state').upsert({ 
      id: 'oracle', 
      last_block: currentBlock,
      updated_at: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully processed blocks ${lastBlockProcessed + 1} to ${currentBlock}` 
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("[Oracle Edge Function Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});