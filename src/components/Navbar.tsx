"use client";

import Link from "next/link";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "../contexts/LanguageContext";

interface NavbarProps {
  user: User | null;
  account: string;
  connectWallet: () => void;
  loginWithGitHub: () => void;
  loginWithGoogle: () => void;
  logout: () => void;
}

export default function Navbar({
  user,
  account,
  connectWallet,
  loginWithGitHub,
  loginWithGoogle,
  logout,
}: NavbarProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 transform group-hover:rotate-12 transition-transform">
                <span className="text-white font-black text-xl">P</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
                PredictMarket
              </span>
            </Link>

            {/* Enterprise Links */}
            <div className="hidden md:flex items-center gap-6 ml-6">
              <Link href="/docs" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                {t.docs}
              </Link>
              <Link href="/tech" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                {t.tech}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 border border-transparent hover:border-gray-200 px-3 py-1.5 rounded-lg transition-all"
            >
              {language === "en" ? "中/EN" : "EN/中"}
            </button>

            {/* Web2 Auth Section */}
            {!user ? (
              <div className="hidden sm:flex gap-3">
                <button
                  onClick={loginWithGitHub}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all hover:shadow-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/></svg>
                  {t.loginGithub}
                </button>
                <button
                  onClick={loginWithGoogle}
                  className="px-5 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all hover:shadow-sm"
                >
                  {t.loginGoogle}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50/80 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full shadow-sm"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs" >
                    {user.email?.[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-bold text-gray-700 hidden sm:block">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 ml-2 px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  {t.logout}
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 hidden sm:block mx-1"></div>

            {/* Web3 Wallet Section */}
            {!account ? (
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
              >
                {t.connectWallet}
              </button>
            ) : (
              <div className="bg-indigo-50/80 text-indigo-700 px-5 py-2.5 rounded-xl text-sm font-bold border border-indigo-100 flex items-center gap-3 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="tracking-tight">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
