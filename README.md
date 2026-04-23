# 去中心化预测市场 (Decentralized Prediction Market)

这是一个基于以太坊 (Sepolia) 智能合约构建，结合 **Supabase** (数据缓存与用户认证) 和 **DeepSeek AI** (自动化预言机) 的全栈去中心化预测市场 DApp。

用户可以创建客观的、可验证的预测问题，其他用户通过质押原生代币 (ETH) 表达“是/否”的信念。当市场到期后，系统内置的 AI 预言机将自动进行事实核查，判定结果，赢家将按比例瓜分输家的质押资金。

---

## 🔄 核心业务流：从创建到获取奖励

整个系统的运作流程可分为以下五个核心步骤：

### 1. 市场创建 (Market Creation)
1. 用户在前端页面 (Next.js) 连接 MetaMask 钱包。
2. 用户提出一个客观且可验证的问题（例如："特朗普是否赢得了 2024 年美国大选？"）并设定一个到期时间。
3. 前端调用智能合约的 `createMarket` 方法，该笔交易上链。
4. 合约在链上抛出 `MarketCreated` 事件。
5. **[云端同步]**：Supabase 边缘函数 (Oracle Indexer) 通过 `pg_cron` 定时任务捕获到该事件，将新市场的数据（问题、创建者、到期时间）写入 Supabase 的 `markets` 数据库表中。前端通过查询该表，在页面上实现毫秒级的市场展示。

### 2. 用户质押与预测 (Prediction & Staking)
1. 市场处于“Live (进行中)”状态且未到期时，任何连接了钱包的用户都可以对该问题进行下注。
2. 用户选择 "YES" 或 "NO"，并输入质押金额 (ETH)，前端调用合约的 `predict` 方法。
3. 用户的资金被锁定在智能合约中，合约分别累计 `totalYesPool` (看好池) 和 `totalNoPool` (看衰池)，并抛出 `PredictionMade` 事件。
4. **[云端同步]**：Oracle Indexer 捕获到该事件，立即更新 Supabase 数据库中该市场的资金池占比，前端的资金比例进度条随之发生改变。

### 3. 触发结算请求 (Settlement Request)
1. 当市场到达预定的过期时间 (Expiration Time) 后，市场状态变为“Awaiting Settlement (等待结算)”。
2. 此时，系统不再接受新的质押。
3. 任何用户都可以点击页面上的 "Trigger Settlement" 按钮，调用合约的 `requestSettlement` 方法，合约在链上抛出 `SettlementRequested` 事件。*(注意：这一步不涉及资金转移，仅作为唤醒预言机的信号)*

### 4. AI 预言机自动核查 (Oracle Fact-Checking & Resolution)
1. **[自动唤醒]**：Oracle Indexer 在下一次轮询时捕获到了 `SettlementRequested` 事件。
2. 边缘函数提取该事件中的预测问题，并将其发送给 **DeepSeek 大语言模型 API**。
3. 边缘函数携带了一套严格的 `SYSTEM_PROMPT`，要求 DeepSeek 作为中立的“事实核查器 (Fact-checker)”，基于公共知识对问题进行判定，并严格返回 JSON 格式的结果（`YES` 或 `NO`）。
4. 拿到 AI 返回的判定结果后，边缘函数使用其内置的**管理员私钥**，自动调用智能合约受 `onlyOracle` 修饰符保护的 `settleMarket` 方法，将最终结果写死在区块链上，并抛出 `MarketSettled` 事件。
5. **[云端同步]**：Oracle Indexer 再次捕获事件，将 Supabase 中该市场的状态更新为“Settled (已结算)”，并在前端显示胜利的一方。

### 5. 赢家领取奖励 (Claim Winnings)
1. 市场被结算后，之前押对结果（预测与 Oracle 判定一致）的用户可以进入该市场。
2. 页面上会显示 **"Claim Winnings"** 按钮。
3. 用户点击该按钮，调用智能合约的 `claim` 方法。
4. 智能合约计算该用户应得的奖励：**公式为 `(用户质押金额 * 市场总资金池) / 胜利方总资金池`**。
   *(即：赢家不仅拿回本金，还按比例瓜分了输家池子里的所有资金)*
5. 合约将算好的 ETH 直接转入用户的钱包，流程完美闭环。

---

## 🛠️ 技术架构

- **前端**: Next.js 14 (App Router), TailwindCSS, ethers.js
- **智能合约**: Solidity, Foundry
- **后端 / 数据库 / 认证**: Supabase (PostgreSQL, Auth, Edge Functions, pg_cron)
- **AI 预言机**: DeepSeek API (deepseek-chat)

## 🛡️ 风险提示
1. **预言机中心化风险**：目前系统依赖单一的 Node.js/Edge Function 私钥作为唯一的 Oracle 进行结算。
2. **AI 幻觉风险**：DeepSeek 可能对模糊不清的问题产生误判，导致资金分配错误。用户在创建市场时必须提出极度客观的问题。
3. **资金风险**：输家的质押资金将被 100% 没收并分配给赢家。

*(本系统目前部署于 Sepolia 测试网，仅供学习与演示使用，请勿用于真实的主网资金交易。)*