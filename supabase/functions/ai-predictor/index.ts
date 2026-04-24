// Supabase Edge Function: AI Predictor (Hourly Cron)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const SYSTEM_PROMPT = `
You are an expert market analyst forecasting the probability of an event occurring.
Based on the current date, news, and world events, estimate the probability that this event will resolve as "YES".
OUTPUT FORMAT: You MUST respond with a SINGLE JSON object with this exact structure:
{"probability_yes": <integer 0-100>}
Provide your best objective estimate.
`;

async function getAiProbability(question: string, apiKey: string): Promise<number> {
  console.log(`[DeepSeek Predictor] Estimating probability for: "${question}"`);
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
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);
    console.log(`[DeepSeek Predictor] Result for "${question}":`, parsed);

    return parsed.probability_yes || 50;
  } catch (error) {
    console.error("[DeepSeek Predictor] Error querying API:", error);
    return 50; // Fallback
  }
}

Deno.serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DEEPSEEK_API_KEY) {
      throw new Error("Missing required environment variables.");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Fetch all active (unsettled) markets
    const { data: activeMarkets, error: fetchError } = await supabase
      .from("markets")
      .select("id, question")
      .eq("settled", false);

    if (fetchError) {
      throw new Error(`Failed to fetch active markets: ${fetchError.message}`);
    }

    console.log(`[Predictor] Found ${activeMarkets?.length || 0} active markets to analyze.`);

    // 2. Iterate and get predictions
    const insertPromises = [];
    for (const market of activeMarkets || []) {
      const prob = await getAiProbability(market.question, DEEPSEEK_API_KEY);
      insertPromises.push(
        supabase.from("market_ai_probabilities").insert({
          market_id: market.id,
          probability_yes: prob
        })
      );
    }

    await Promise.all(insertPromises);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${activeMarkets?.length || 0} markets.` 
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("[Predictor Error]:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});