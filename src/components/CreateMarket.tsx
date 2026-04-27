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
      className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex items-center gap-4 mb-3">
        <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
          <Lightbulb size={24} className="animate-pulse-slow" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t.createMarketTitle}</h2>
      </div>
      <p className="text-gray-500 mb-8 font-medium text-sm ml-14">{t.createMarketSubtitle}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="group/input">
          <label className="block text-sm font-bold text-gray-700 mb-2.5 group-focus-within/input:text-indigo-600 transition-colors">
            {t.questionLabel}
          </label>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder-gray-400 focus:bg-white shadow-inner"
            placeholder={t.questionPlaceholder}
            required
          />
        </div>

        <div className="group/input">
          <label className="block text-sm font-bold text-gray-700 mb-2.5 group-focus-within/input:text-indigo-600 transition-colors">
            {t.expiresLabel}
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              min="1"
              max="365"
              className="w-32 px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all focus:bg-white shadow-inner"
              required
            />
            <span className="ml-4 text-gray-500 font-bold tracking-wide uppercase text-sm">Days</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !question}
          className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-md transition-all transform active:scale-[0.98] relative overflow-hidden ${
            isSubmitting || !question
              ? "bg-gray-300 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:-translate-y-0.5"
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
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

      <div className="mt-10 bg-amber-50/80 rounded-2xl p-6 border border-amber-100 shadow-sm backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <Info className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-base font-bold text-amber-900 mb-2">{t.tipsTitle}</h4>
            <div className="text-sm text-amber-800/90 leading-relaxed space-y-1.5 font-medium">
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
