import Navbar from "../../components/Navbar";
import { useLanguage } from "../../contexts/LanguageContext";

export default function Docs() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={null}
        account={""}
        connectWallet={() => {}}
        loginWithGitHub={() => {}}
        loginWithGoogle={() => {}}
        loginWithEmail={async () => {}}
        signupWithEmail={async () => {}}
        logout={() => {}}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Documentation</h1>
          
          <div className="prose prose-blue max-w-none text-gray-600">
            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">1. How to create a market</h2>
            <p>
              Anyone can propose an objective, verifiable event by defining a question and setting an expiration date.
              Once the market is created, the AI oracle will automatically begin tracking its probability.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">2. Making a prediction</h2>
            <p>
              Users can stake ETH on their belief ("YES" or "NO") before the market expires.
              The smart contract locks the funds in the respective pool. Note: currently, only one prediction direction per user per market is allowed.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">3. AI Probability Forecast</h2>
            <p>
              Our system periodically queries DeepSeek to estimate the real-time probability of the event occurring. 
              This is displayed as a chart on the market card to help you make informed decisions.
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">4. Resolution and Winnings</h2>
            <p>
              After expiration, anyone can trigger the settlement. The decentralized AI oracle acts as the judge. 
              If the oracle resolves the market as YES, all YES predictors can claim their share of the total pool (including the NO predictors' stakes).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}