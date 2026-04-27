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
  const yesRatio = totalPool > BigInt(0) ? Number((market.totalYesPool * BigInt(100)) / totalPool) : 50;
  const noRatio = 100 - yesRatio;

  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= market.expiresAt;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white hover:border-indigo-100 hover:shadow-xl transition-all duration-300 group">
      <div className="flex justify-between items-start mb-5 gap-4">
        <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-indigo-900 transition-colors">{market.question}</h3>
        <span
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap shadow-sm
          ${
            market.settled
              ? market.outcome === BigInt(0)
                ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-200"
                : "bg-gradient-to-r from-rose-100 to-red-100 text-rose-700 border border-rose-200"
              : isExpired
              ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-200"
              : "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-200"
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

      <div className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-2 bg-gray-50/80 p-2 rounded-lg w-fit">
        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        {t.expiresIn}: <span className="text-gray-700">{new Date(Number(market.expiresAt) * 1000).toLocaleString()}</span>
      </div>

      <div className="mb-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex justify-between text-sm font-bold mb-3">
          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">YES {yesRatio}%</span>
          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{noRatio}% NO</span>
        </div>
        <div className="h-4 w-full bg-rose-100 rounded-full overflow-hidden flex shadow-inner relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out relative"
            style={{ width: `${yesRatio}%` }}
          >
            <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 mt-3 text-center font-medium">{t.ratioNote}</p>
      </div>

      {/* AI Probability Chart Toggle */}
      <button 
        onClick={() => setShowChart(!showChart)}
        className="w-full flex items-center justify-center gap-2 text-sm text-indigo-700 font-bold bg-indigo-50/80 py-3 rounded-xl hover:bg-indigo-100 hover:text-indigo-800 transition-all mb-6 border border-indigo-100 shadow-sm"
      >
        <TrendingUp className="w-4 h-4" />
        {showChart ? "Hide AI Forecast" : t.aiPredictionTitle}
      </button>

      {/* AI Probability Chart */}
      {showChart && (
        <div className="h-48 mb-6 bg-gradient-to-b from-gray-50 to-white rounded-2xl p-4 border border-gray-100 shadow-inner">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="time" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#6b7280'}} />
                <YAxis domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(4px)'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="probability" 
                  stroke="url(#colorProb)" 
                  strokeWidth={3} 
                  dot={false} 
                  activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} 
                />
                <defs>
                  <linearGradient id="colorProb" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#6366f1" />
                    <stop offset="95%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gathering AI forecast data...
            </div>
          )}
        </div>
      )}

      {!market.settled && !isExpired && (
        <div className="space-y-4">
          <div className="relative group/input">
            <input 
              type="number" 
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              step="0.01"
              min="0.001"
              className="w-full px-5 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all focus:bg-white shadow-inner"
              placeholder={t.betAmountPlaceholder}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-gray-400 font-bold group-focus-within/input:text-indigo-500 transition-colors">
              ETH
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => predict(market.id, BigInt(0), betAmount)}
              className="w-full relative overflow-hidden bg-gradient-to-b from-emerald-400 to-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl hover:from-emerald-500 hover:to-emerald-600 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] hover:-translate-y-0.5 transition-all active:scale-95"
            >
              {t.predictYes}
            </button>
            <button
              onClick={() => predict(market.id, BigInt(1), betAmount)}
              className="w-full relative overflow-hidden bg-gradient-to-b from-rose-400 to-rose-500 text-white font-bold py-3.5 px-4 rounded-xl hover:from-rose-500 hover:to-rose-600 shadow-[0_4px_14px_0_rgba(244,63,94,0.39)] hover:shadow-[0_6px_20px_rgba(244,63,94,0.23)] hover:-translate-y-0.5 transition-all active:scale-95"
            >
              {t.predictNo}
            </button>
          </div>
        </div>
      )}

      {!market.settled && isExpired && (
        <button
          onClick={() => requestSettlement(market.id)}
          className="w-full relative overflow-hidden bg-gradient-to-b from-blue-500 to-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.23)] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          {t.triggerOracle}
        </button>
      )}

      {market.settled && (
        <button
          onClick={() => claim(market.id)}
          className="w-full relative overflow-hidden bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:from-indigo-600 hover:to-indigo-700 shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all active:scale-95"
        >
          {t.claimWinnings}
        </button>
      )}
      
      {!market.settled && !isExpired && (
        <p className="text-[11px] text-gray-400 mt-5 text-center font-medium bg-gray-50/50 py-2 rounded-lg">
          {t.ruleNote}
        </p>
      )}
    </div>
  );
}
