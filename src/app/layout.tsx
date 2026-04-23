import "./globals.css";
import { LanguageProvider } from "../contexts/LanguageContext";

export const metadata = {
  title: "PredictMarket",
  description: "Decentralized Truth Oracle with DeepSeek",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
