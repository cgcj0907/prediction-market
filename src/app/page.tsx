"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "../contexts/LanguageContext";

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
  "function markets(uint256) view returns (address creator, uint48 createdAt, uint48 expiresAt, uint48 settledAt, bool settled, uint8 outcome, uint256 totalYesPool, uint256 totalNoPool, string question)"
];

export default function Home() {
  const { t } = useLanguage();
  
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState("");
  const [markets, setMarkets] = useState<any[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("1");
  
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

  const createMarket = async () => {
    if (!signer) return alert("Please connect wallet first!");
    if (!newQuestion) return alert("Please enter a question!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const expiresAt = Math.floor(Date.now() / 1000) + Number(expiresInDays) * 86400;
    try {
      const tx = await contract.createMarket(newQuestion, expiresAt);
      await tx.wait();
      alert("Market Created!");
      setNewQuestion("");
      loadMarkets();
    } catch (e) {
      console.error(e);
      alert("Failed to create market");
    }
  };

  const predict = async (marketId: number, prediction: number) => {
    if (!signer) return alert("Please connect wallet first!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.predict(marketId, prediction, { value: ethers.parseEther("0.01") });
      await tx.wait();
      alert("Prediction submitted!");
      loadMarkets();
    } catch (e) {
      console.error(e);
      alert("Failed to predict");
    }
  };

  const requestSettlement = async (marketId: number) => {
    if (!signer) return alert("Please connect wallet first!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.requestSettlement(marketId);
      await tx.wait();
      alert("Settlement requested! DeepSeek node will process it.");
      loadMarkets();
    } catch (e) {
      console.error(e);
      alert("Failed to request settlement");
    }
  };

  const claim = async (marketId: number) => {
    if (!signer) return alert("Please connect wallet first!");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    try {
      const tx = await contract.claim(marketId);
      await tx.wait();
      alert("Claimed successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to claim");
    }
  };

  const liveMarkets = markets.filter(m => !m.settled);
  const settledMarkets = markets.filter(m => m.settled);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-blue-100 selection:text-blue-900">
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
            newQuestion={newQuestion}
            setNewQuestion={setNewQuestion}
            expiresInDays={expiresInDays}
            setExpiresInDays={setExpiresInDays}
            createMarket={createMarket}
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight">{t.marketsTitle}</h2>
            <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setActiveTab("live")}
                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === "live"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.tabLive} ({liveMarkets.length})
              </button>
              <button
                onClick={() => setActiveTab("settled")}
                className={`px-6 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeTab === "settled"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t.tabSettled} ({settledMarkets.length})
              </button>
            </div>
          </div>

          {!account && markets.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t.noMarkets}</h3>
              <p className="mt-1 text-sm text-gray-500">{t.connectToView}</p>
              <div className="mt-6">
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  {t.connectWallet}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {(activeTab === "live" ? liveMarkets : settledMarkets).map((m) => (
                <MarketCard
                  key={m.id}
                  market={m}
                  predict={predict}
                  requestSettlement={requestSettlement}
                  claim={claim}
                />
              ))}
            </div>
          )}

          {account && (activeTab === "live" ? liveMarkets : settledMarkets).length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-500">
              {t.noMarketsCategory}
            </div>
          )}
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-500">
            &copy; {new Date().getFullYear()} {t.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
