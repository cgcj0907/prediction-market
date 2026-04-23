"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "zh";

export const translations = {
  en: {
    // Navbar
    loginGithub: "GitHub",
    loginGoogle: "Google",
    logout: "Log out",
    connectWallet: "Connect Wallet",
    // Hero
    heroTitle1: "Decentralized",
    heroTitle2: "Truth & Markets",
    heroSubtitle: "Propose objective questions, stake your belief on future outcomes, and let a decentralized DeepSeek Oracle verify the truth.",
    riskWarningTitle: "Risk Warning:",
    riskWarningText: "This is an experimental prediction market. Smart contracts carry risks. Oracles may hallucinate or fail if questions are ambiguous. You may lose 100% of your staked funds if your prediction is incorrect or if the Oracle resolves unexpectedly.",
    // CreateMarket
    createMarketTitle: "Launch a Prediction Market",
    createMarketSubtitle: "Ask any clear yes/no question. DeepSeek Oracle will verify the truth.",
    questionLabel: "Objective Question",
    questionPlaceholder: "e.g. Will Ethereum price exceed $5000 on Binance at 2024-12-31 00:00 UTC?",
    expiresLabel: "Expires In",
    days: "days",
    createBtn: "Create Market",
    tipsTitle: "💡 Tips for a verifiable question:",
    tip1: "Must be objectively verifiable (e.g. clearly state the source of truth like 'on Binance').",
    tip2: "Must include an exact timezone or block number if it's time-sensitive.",
    tip3: "Vague questions ('Will AI be good?') may result in unpredictable or failed Oracle settlement.",
    // MarketCard
    live: "Live",
    awaiting: "Awaiting Settlement",
    settledYes: "Settled: YES",
    settledNo: "Settled: NO",
    expires: "Expires:",
    totalPool: "Total Pool:",
    yesPool: "Yes Pool",
    noPool: "No Pool",
    poolNote: "* Pool ratios reflect current liquidity, not precise probability.",
    predictYes: "Predict YES",
    predictNo: "Predict NO",
    predictNote: "Winning predictions split the losing pool proportionally. Losing predictions forfeit 100% of their stake.",
    triggerOracle: "Trigger Settlement Oracle",
    claimWinnings: "Claim Winnings",
    // Page
    marketsTitle: "Markets",
    tabLive: "Live",
    tabSettled: "Settled",
    noMarkets: "No markets found",
    connectToView: "Connect your wallet to view active predictions.",
    noMarketsCategory: "No markets in this category.",
    footer: "PredictMarket. Decentralized Truth Oracle with DeepSeek."
  },
  zh: {
    // Navbar
    loginGithub: "GitHub 登录",
    loginGoogle: "Google 登录",
    logout: "退出登录",
    connectWallet: "连接钱包",
    // Hero
    heroTitle1: "去中心化",
    heroTitle2: "真相与预测市场",
    heroSubtitle: "提出客观问题，为未来的结果质押你的信念，让去中心化的 DeepSeek 预言机来验证真相。",
    riskWarningTitle: "风险警告：",
    riskWarningText: "这是一个实验性的预测市场。智能合约存在风险。如果问题含糊不清，预言机可能会产生幻觉或失败。如果你的预测错误或预言机出现意外结算，你可能会损失 100% 的质押资金。",
    // CreateMarket
    createMarketTitle: "发起预测市场",
    createMarketSubtitle: "提出任何清晰的 Yes/No 问题。DeepSeek 预言机将验证真相。",
    questionLabel: "客观问题",
    questionPlaceholder: "例如：2024-12-31 00:00 UTC，以太坊在币安的价格会超过 5000 美元吗？",
    expiresLabel: "到期时间",
    days: "天",
    createBtn: "创建市场",
    tipsTitle: "💡 可验证问题的编写提示：",
    tip1: "必须客观可验证（例如明确指出数据源，如“在币安上”）。",
    tip2: "如果是时间敏感的问题，必须包含确切的时区或区块高度。",
    tip3: "模糊的问题（“AI 会变好吗？”）可能导致预言机结算失败或产生不可预测的结果。",
    // MarketCard
    live: "进行中",
    awaiting: "等待结算",
    settledYes: "已结算: YES",
    settledNo: "已结算: NO",
    expires: "到期时间:",
    totalPool: "总奖池:",
    yesPool: "Yes 池",
    noPool: "No 池",
    poolNote: "* 资金池比例反映当前的流动性，而非精确概率。",
    predictYes: "预测 YES",
    predictNo: "预测 NO",
    predictNote: "获胜的预测将按比例瓜分失败者的资金池。失败的预测将损失 100% 的质押本金。",
    triggerOracle: "触发预言机结算",
    claimWinnings: "提取奖金",
    // Page
    marketsTitle: "市场大厅",
    tabLive: "进行中",
    tabSettled: "已结算",
    noMarkets: "未找到市场",
    connectToView: "连接钱包以查看活跃的预测。",
    noMarketsCategory: "该分类下暂无市场。",
    footer: "PredictMarket. 基于 DeepSeek 的去中心化真相预言机。"
  }
};

type Translations = typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
