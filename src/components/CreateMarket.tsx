"use client";

import { useLanguage } from "../contexts/LanguageContext";

interface CreateMarketProps {
  newQuestion: string;
  setNewQuestion: (q: string) => void;
  expiresInDays: string;
  setExpiresInDays: (d: string) => void;
  createMarket: () => void;
}

export default function CreateMarket({
  newQuestion,
  setNewQuestion,
  expiresInDays,
  setExpiresInDays,
  createMarket,
}: CreateMarketProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {t.createMarketTitle}
          </h2>
          <p className="mt-2 text-gray-500">
            {t.createMarketSubtitle}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.questionLabel}
            </label>
            <input
              type="text"
              placeholder={t.questionPlaceholder}
              className="w-full border-gray-300 border px-4 py-3 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.expiresLabel}
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 border px-4 py-3 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
              />
              <span className="absolute right-3 top-3 text-gray-500">{t.days}</span>
            </div>
          </div>

          <button
            onClick={createMarket}
            className="w-full md:w-auto px-8 py-3 bg-gray-900 text-white font-bold rounded-xl shadow hover:bg-gray-800 transition-all active:scale-95"
          >
            {t.createBtn}
          </button>
        </div>
        
        <div className="bg-yellow-50 text-yellow-800 text-xs md:text-sm p-4 rounded-xl border border-yellow-200">
          <p className="font-semibold mb-1">{t.tipsTitle}</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>{t.tip1}</li>
            <li>{t.tip2}</li>
            <li>{t.tip3}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
