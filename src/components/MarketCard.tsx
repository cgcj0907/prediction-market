"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface MarketCardProps {
  market: any;
  predict: (marketId: bigint, prediction: bigint, amount: string) => Promise<void>;
  requestSettlement: (marketId: bigint) => Promise<void>;
  claim: (marketId: bigint) => Promise<void>;
}

export default function MarketCard({ market, predict, requestSettlement, claim }: MarketCardProps) {
  const { t } = useLanguage();
  const [betAmount, setBetAmount] = useState("0.01");
  const [chartData, setChartData] = useState<any[]>([]);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const fetchChartData = async () => {
      const { data, error } = await supabase
        .from('market_ai_probabilities')
        .select('created_at, probability_yes')
        .eq('market_id', Number(market.id))
        .order('created_at', { ascending: true });
      
      if (data && !error) {
        const formatted = data.map(d => ({
          time: new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          probability: d.probability_yes
        }));
        setChartData(formatted);
      }
    };
    if (showChart) {
      fetchChartData();
    }
  }, [market.id, showChart]);

  const totalPool = market.totalYesPool + market.totalNoPool;
  const yesRatio = totalPool > 0 ? Number((market.totalYesPool * 100n) / totalPool) : 50;
  const noRatio = 100 - yesRatio;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= market.expiresAt;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-gray-900 leading-tight">{market.question}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ml-4
          ${
            market.settled
              ? market.outcome === BigInt(0)
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
              : isExpired
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {market.settled
            ? market.outcome === BigInt(0)
              ? "YES"
              : "NO"
            : isExpired
            ? t.awaiting
            : t.live}
        </span>
      </div>

      <div className="text-sm text-gray-500 mb-6 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {t.expiresIn}: {new Date(Number(market.expiresAt) * 1000).toLocaleString()}
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-green-600">YES {yesRatio}%</span>
          <span className="text-red-600">{noRatio}% NO</span>
        </div>
        <div className="h-3 w-full bg-red-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all duration-1000 ease-out"
            style={{ width: `${yesRatio}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">{t.ratioNote}</p>
      </div>

      {/* AI Probability Chart Toggle */}
      <button 
        onClick={() => setShowChart(!showChart)}
        className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 font-medium bg-indigo-50 py-2 rounded-xl hover:bg-indigo-100 transition-colors mb-6"
      >
        <TrendingUp className="w-4 h-4" />
        {showChart ? "Hide AI Forecast" : t.aiPredictionTitle}
      </button>

      {/* AI Probability Chart */}
      {showChart && (
        <div className="h-48 mb-6 bg-gray-50 rounded-xl p-4 border border-gray-100">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="probability" stroke="#4f46e5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-400">
              Gathering AI forecast data...
            </div>
          )}
        </div>
      )}

      {!market.settled && !isExpired && (
        <div className="space-y-3">
          <div className="relative">
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.01"
              min="0.001"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder={t.betAmountPlaceholder}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400 font-medium">
              ETH
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => predict(market.id, BigInt(0), betAmount)}
              className="w-full bg-green-50 text-green-700 font-bold py-3 px-4 rounded-xl hover:bg-green-500 hover:text-white border border-green-200 hover:border-transparent transition-all transform active:scale-95"
            >
              {t.predictYes}
            </button>
            <button
              onClick={() => predict(market.id, BigInt(1), betAmount)}
              className="w-full bg-red-50 text-red-700 font-bold py-3 px-4 rounded-xl hover:bg-red-500 hover:text-white border border-red-200 hover:border-transparent transition-all transform active:scale-95"
            >
              {t.predictNo}
            </button>
          </div>
        </div>
      )}

      {!market.settled && isExpired && (
        <button
          onClick={() => requestSettlement(market.id)}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all transform active:scale-95"
        >
          {t.triggerOracle}
        </button>
      )}

      {market.settled && (
        <button
          onClick={() => claim(market.id)}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all transform active:scale-95"
        >
          {t.claimWinnings}
        </button>
      )}
      
      {!market.settled && !isExpired && (
        <p className="text-xs text-gray-400 mt-4 text-center">
          {t.ruleNote}
        </p>
      )}
    </div>
  );
}
