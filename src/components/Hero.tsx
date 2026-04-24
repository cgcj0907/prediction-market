"use client";

import { useLanguage } from "../contexts/LanguageContext";
import { motion } from "framer-motion";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <div className="relative overflow-hidden bg-white border-b border-gray-100 pb-16 pt-24 sm:pb-24 sm:pt-32">
      {/* Decorative background blobs */}
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]">
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0], 
            scale: [1, 1.05, 0.95, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl"
        >
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20 shadow-sm transition-all hover:shadow">
              Powered by DeepSeek AI & Supabase Edge Functions
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl drop-shadow-sm">
            {t.heroTitle1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
              {t.heroTitle2}
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 font-medium">
            {t.heroSubtitle}
          </p>
        </motion.div>

        {/* Risk Warning Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto max-w-2xl mt-12 bg-rose-50/50 backdrop-blur-sm rounded-2xl p-5 border border-rose-100 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-rose-800">{t.riskWarningTitle}</h3>
              <p className="mt-1 text-sm text-rose-600/90 leading-relaxed">
                {t.riskWarningText}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
