"use client";

import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "framer-motion";
import { Lightbulb, Info } from "lucide-react";

interface CreateMarketProps {
  createMarket: (question: string, expiresAt: number) => Promise<void>;
  account: string;
}

export default function CreateMarket({ createMarket, account }: CreateMarketProps) {
  const { t } = useLanguage();
  const [question, setQuestion] = useState("");
  const [days, setDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || days <= 0) return;

    setIsSubmitting(true);
    const expiresAt = Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
    try {
      await createMarket(question, expiresAt);
      setQuestion("");
      setDays(7);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!account) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12 relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Lightbulb size={24} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{t.createMarketTitle}</h2>
      </div>
      <p className="text-gray-500 mb-8">{t.createMarketSubtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.questionLabel}
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
            placeholder={t.questionPlaceholder}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t.expiresLabel}
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min="1"
              max="365"
              className="w-32 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
            <span className="ml-3 text-gray-500 font-medium">Days</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !question}
          className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-md transition-all transform active:scale-[0.98] ${
            isSubmitting || !question
              ? "bg-gray-300 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t.creatingBtn}
            </span>
          ) : (
            t.createBtn
          )}
        </button>
      </form>

      <div className="mt-8 bg-amber-50/80 rounded-xl p-5 border border-amber-100">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-amber-800 mb-1">{t.tipsTitle}</h4>
            <div className="text-sm text-amber-700/90 leading-relaxed space-y-1">
              <p>• {t.tip1}</p>
              <p>• {t.tip2}</p>
              <p>• {t.tip3}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
