"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "framer-motion";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-transparent pb-16 pt-24 sm:pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl"
        >
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-4 py-1.5 text-sm font-medium leading-6 text-indigo-600 bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 shadow-sm transition-all hover:shadow hover:bg-indigo-50">
              🚀 Powered by DeepSeek AI & Supabase Edge Functions
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-7xl drop-shadow-sm">
            {t.heroTitle1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 animate-gradient-x">
              {t.heroTitle2}
            </span>
          </h1>
          <p className="mt-8 text-lg leading-8 text-gray-600 font-medium max-w-xl mx-auto">
            {t.heroSubtitle}
          </p>
        </motion.div>

        {/* Risk Warning Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-2xl mt-14 bg-rose-500/10 backdrop-blur-md rounded-3xl p-6 border border-rose-500/20 shadow-[0_8px_30px_rgb(225,29,72,0.04)]"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 pt-0.5 p-2 bg-rose-100 rounded-xl">
              <svg className="h-6 w-6 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-rose-900">{t.riskWarningTitle}</h3>
              <p className="mt-1.5 text-sm text-rose-700/90 leading-relaxed font-medium">
                {t.riskWarningText}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
