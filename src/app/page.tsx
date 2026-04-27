"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "../contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

// Components
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CreateMarket from "../components/CreateMarket";
import MarketCard from "../components/MarketCard";

const CONTRACT_ADDRESS = "0xbdA098d13e1e46ECf40e081E6013c4Dc19A21a0E"; // Deployed to Sepolia
const ABI = [
  "function nextMarketId() view returns (uint256)",
  "function createMarket(string question, uint48 expiresAt) returns (uint256)",
  "function predict(uint256 marketId, uint8 prediction) payable",
  "function requestSettlement(uint256 marketId)",
  "function claim(uint256 marketId)",
  "function markets(uint256) view returns (address creator, uint48 createdAt, uint48 expiresAt, uint48 settledAt, bool settled, uint8 outcome, uint256 totalYesPool, uint256 totalNoPool, string question)",
  "function predictions(uint256, address) view returns (uint256 amount, uint8 prediction, bool claimed)",
  "error MarketDoesNotExist()",
  "error MarketNotExpired()",
  "error MarketAlreadySettled()",
  "error MarketNotSettled()",
  "error AlreadyPredicted()",
  "error InvalidAmount()",
  "error NothingToClaim()",
  "error AlreadyClaimed()",
  "error TransferFailed()",
  "error OnlyOracle()"
];

export default function Home() {
  const { t } = useLanguage();
  
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState("");
  const [markets, setMarkets] = useState<any[]>([]);
  
  // Supabase Auth State
  const [user, setUser] = useState<User | null>(null);

  // Tabs State
  const [activeTab, setActiveTab] = useState<"live" | "settled">("live");

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const prov = new ethers.BrowserProvider((window as any).ethereum);
      setProvider(prov);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMarkets = async () => {
    try {
      const { data, error } = await supabase
        .from('markets')
        .select('*')
        .order('id', { ascending: false });
        
      if (error) throw error;
      
      // Format data to match component expectations
      const formattedMarkets = data.map(m => ({
        id: m.id,
        creator: m.creator,
        createdAt: Math.floor(new Date(m.created_at).getTime() / 1000),
        expiresAt: Math.floor(new Date(m.expires_at).getTime() / 1000),
        settledAt: m.settled_at ? Math.floor(new Date(m.settled_at).getTime() / 1000) : 0,
        settled: m.settled,
        outcome: m.outcome === 'YES' ? BigInt(0) : (m.outcome === 'NO' ? BigInt(1) : null),
        totalYesPool: BigInt(m.total_yes_pool || 0),
        totalNoPool: BigInt(m.total_no_pool || 0),
        question: m.question
      }));
      
      setMarkets(formattedMarkets);
    } catch (e) {
      console.error("Failed to load markets from Supabase", e);
    }
  };

  // 初始加载时不依赖 Provider，直接加载 Supabase 数据
  useEffect(() => {
    loadMarkets();
  }, []);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const prov = new ethers.BrowserProvider((window as any).ethereum);
        
        // 强制切换或添加到 Sepolia 网络 (Chain ID: 11155111 -> 0xaa36a7)
        const targetChainId = "0xaa36a7";
        const currentNetwork = await prov.getNetwork();
        
        if (currentNetwork.chainId !== BigInt(11155111)) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainId }],
            });
          } catch (switchError: any) {
            // 如果用户的钱包里没有添加 Sepolia，则请求添加
            if (switchError.code === 4902) {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: targetChainId,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: { name: 'Sepolia ETH', symbol: 'SEP', decimals: 18 },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  },
                ],
              });
            } else {
              throw switchError;
            }
          }
        }

        const accounts = await prov.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setProvider(prov);
        const sig = await prov.getSigner();
        setSigner(sig);
        // 连接钱包后也可以再刷新一次状态
        loadMarkets();
      } catch (error) {
        console.error("User rejected request or network switch failed", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const loginWithGitHub = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
  };

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const createMarket = async (question: string, expiresAt: number) => {
    if (!signer) {
      alert("Please connect wallet first!");
      return;
    }
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.createMarket(question, expiresAt);
      await tx.wait();
      alert("Market Created!");
      loadMarkets();
    } catch (e) {
      console.error(e);
      alert("Failed to create market");
      throw e;
    }
  };

  const predict = async (marketId: bigint, prediction: bigint, amount: string) => {
    if (!signer) return alert("Please connect wallet first!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.predict(marketId, prediction, { value: ethers.parseEther(amount) });
      await tx.wait();
      alert("Prediction submitted!");
      loadMarkets();
    } catch (err: any) {
      console.error(err);
      alert("Prediction failed: " + err.message);
    }
  };

  const requestSettlement = async (marketId: bigint) => {
    if (!signer) return alert("Please connect wallet first!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.requestSettlement(marketId);
      await tx.wait();
      alert("Settlement requested! The oracle will verify this shortly.");
      loadMarkets();
    } catch (err: any) {
      console.error(err);
      alert("Request failed: " + err.message);
    }
  };

  const claim = async (marketId: bigint) => {
    if (!signer) return alert("Please connect wallet first!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.claim(marketId);
      await tx.wait();
      alert("Winnings claimed successfully!");
      loadMarkets();
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("0x969bf728")) {
        alert("Claim failed: Nothing to claim (you didn't predict, or predicted incorrectly).");
      } else if (err.message && err.message.includes("0x646cf558")) {
        alert("Claim failed: Already claimed.");
      } else {
        // ethers v6 often parses custom errors into err.revert.name or err.info.error.name
        const errorName = err.revert?.name || err.info?.error?.name || err.reason;
        alert("Claim failed: " + (errorName ? errorName : err.message));
      }
    }
  };

  const liveMarkets = markets.filter(m => !m.settled);
  const settledMarkets = markets.filter(m => m.settled);

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Global Background Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply opacity-70 animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-multiply opacity-70"></div>
      </div>

      <div className="relative z-10">
        <Navbar
          user={user}
          account={account}
          connectWallet={connectWallet}
          loginWithGitHub={loginWithGitHub}
          loginWithGoogle={loginWithGoogle}
          logout={logout}
        />
        
        <Hero />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          <section>
            <CreateMarket
              account={account}
              createMarket={createMarket}
            />
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 drop-shadow-sm">{t.marketsTitle}</h2>
              <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-gray-200/50">
                <button
                  onClick={() => setActiveTab("live")}
                  className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === "live"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                  }`}
                >
                  {t.tabLive} ({liveMarkets.length})
                </button>
                <button
                  onClick={() => setActiveTab("settled")}
                  className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 ${
                    activeTab === "settled"
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
                  }`}
                >
                  {t.tabSettled} ({settledMarkets.length})
                </button>
              </div>
            </div>

            {!account && markets.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-indigo-200 shadow-sm"
              >
                <div className="mx-auto h-16 w-16 text-indigo-400 mb-6 bg-indigo-50 rounded-full flex items-center justify-center">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{t.noMarkets}</h3>
                <p className="mt-2 text-md text-gray-500">{t.connectToView}</p>
                <div className="mt-8">
                  <button
                    onClick={connectWallet}
                    className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg shadow-indigo-200 text-base font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none transition-all transform hover:scale-105 active:scale-95"
                  >
                    {t.connectWallet}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {(activeTab === "live" ? liveMarkets : settledMarkets).map((m, index) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <MarketCard
                        market={m}
                        predict={predict}
                        requestSettlement={requestSettlement}
                        claim={claim}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {account && (activeTab === "live" ? liveMarkets : settledMarkets).length === 0 && (
              <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 text-gray-500 font-medium">
                {t.noMarketsCategory}
              </div>
            )}
          </section>
        </main>

        <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-20">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-base text-gray-500 font-medium">
              &copy; {new Date().getFullYear()} {t.footer}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
