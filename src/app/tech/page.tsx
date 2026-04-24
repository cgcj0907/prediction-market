"use client";

import Navbar from "../../components/Navbar";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Tech() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={null}
        account={""}
        connectWallet={() => {}}
        loginWithGitHub={() => {}}
        loginWithGoogle={() => {}}
        logout={() => {}}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Technical Architecture</h1>
          
          <div className="prose prose-indigo max-w-none text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">The Stack</h2>
            <p>
              PredictMarket combines the security of Ethereum (Sepolia testnet) with the speed of Web2 databases (Supabase) 
              and the intelligence of Large Language Models (DeepSeek AI).
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. Smart Contracts (Solidity)</h2>
            <p>
              The core prediction logic resides in an immutable Solidity contract deployed on Sepolia. 
              It securely holds the user's staked ETH and only allows the designated AI Oracle address to resolve markets.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. The Off-chain Indexer (Supabase Edge Functions)</h2>
            <p>
              Instead of relying on slow RPC calls for every page load, our system uses a Serverless Edge Function triggered by 
              <code>pg_cron</code>. It periodically scans the blockchain for new <code>MarketCreated</code> and 
              <code>PredictionMade</code> events, synchronizing them directly into a fast PostgreSQL database.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. The AI Oracle (DeepSeek Integration)</h2>
            <p>
              When a market expires and settlement is requested, the Edge Function acts as the Oracle. It queries the 
              DeepSeek API with a strict system prompt to objectively evaluate the outcome of the question based on current knowledge. 
              The response is parsed and securely submitted back to the Ethereum smart contract via a transaction.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Hourly AI Probability Tracking</h2>
            <p>
              A separate <code>pg_cron</code> job triggers an AI Predictor function every hour. This function queries DeepSeek 
              to estimate the current probability (0-100%) of all active markets resolving as "YES". This data is stored 
              in the <code>market_ai_probabilities</code> table and served to the frontend via Recharts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}