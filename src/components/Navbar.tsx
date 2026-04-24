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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                PredictMarket
              </span>
            </Link>

            {/* Enterprise Links */}
            <div className="hidden md:flex items-center gap-4 ml-4">
              <Link href="/docs" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                {t.docs}
              </Link>
              <Link href="/tech" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                {t.tech}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-200 px-2 py-1 rounded transition-colors"
            >
              {language === "en" ? "中/EN" : "EN/中"}
            </button>

            {/* Web2 Auth Section */}
            {!user ? (
              <div className="hidden sm:flex gap-2">
                <button
                  onClick={loginWithGitHub}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {t.loginGithub}
                </button>
                <button
                  onClick={loginWithGoogle}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {t.loginGoogle}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300" />
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={logout}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 ml-2"
                >
                  {t.logout}
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

            {/* Web3 Wallet Section */}
            {!account ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all"
              >
                {t.connectWallet}
              </button>
            ) : (
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
