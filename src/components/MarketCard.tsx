"use client";

import { ethers } from "ethers";
import { useLanguage } from "../contexts/LanguageContext";

interface MarketCardProps {
  market: any;
  predict: (marketId: number, prediction: number) => void;
  requestSettlement: (marketId: number) => void;
  claim: (marketId: number) => void;
}

export default function MarketCard({
  market,
  predict,
  requestSettlement,
  claim,
}: MarketCardProps) {
  const { t } = useLanguage();

  const yesPool = Number(ethers.formatEther(market.totalYesPool));
  const noPool = Number(ethers.formatEther(market.totalNoPool));
  const totalPool = yesPool + noPool;

  const yesPercent = totalPool === 0 ? 50 : Math.round((yesPool / totalPool) * 100);
  const noPercent = totalPool === 0 ? 50 : 100 - yesPercent;

  const isExpired = Date.now() > Number(market.expiresAt) * 1000;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="p-6 flex-1">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {market.question}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full border whitespace-nowrap ml-2 ${
              market.settled
                ? "bg-gray-100 text-gray-600 border-gray-200"
                : isExpired
                ? "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {market.settled
              ? (market.outcome === 0n ? t.settledYes : t.settledNo)
              : isExpired
              ? t.awaiting
              : t.live}
          </span>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.expires} {new Date(Number(market.expiresAt) * 1000).toLocaleString()}
          </div>

          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between text-sm font-semibold">
              <span className="text-blue-600">{t.yesPool} {yesPercent}%</span>
              <span className="text-gray-500 font-normal">
                {t.totalPool} {totalPool.toFixed(2)} ETH
              </span>
              <span className="text-red-600">{t.noPool} {noPercent}%</span>
            </div>
            <div className="flex h-3 mb-4 overflow-hidden rounded-full bg-gray-200 gap-1">
              <div style={{ width: `${yesPercent}%` }} className="bg-blue-500 shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"></div>
              <div style={{ width: `${noPercent}%` }} className="bg-red-500 shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center"></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              {t.poolNote}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          {!market.settled ? (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => predict(market.id, 0)}
                  disabled={isExpired}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-white shadow-sm transition-all ${
                    isExpired
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5"
                  }`}
                >
                  {t.predictYes} (0.01)
                </button>
                <button
                  onClick={() => predict(market.id, 1)}
                  disabled={isExpired}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-white shadow-sm transition-all ${
                    isExpired
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700 hover:-translate-y-0.5"
                  }`}
                >
                  {t.predictNo} (0.01)
                </button>
              </div>
              <p className="text-xs text-center text-gray-500">
                {t.predictNote}
              </p>

              {isExpired && (
                <button
                  onClick={() => requestSettlement(market.id)}
                  className="w-full py-2 bg-yellow-100 text-yellow-800 font-semibold rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-200 mt-2"
                >
                  {t.triggerOracle}
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => claim(market.id)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {t.claimWinnings}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
