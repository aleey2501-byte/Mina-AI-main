// app/layout.tsx
import type { Metadata } from "next";
import { Providers } from "./providers";
import TechBackground from "@/components/TechBackground";
import SplashScreen from "@/components/SplashScreen";
import "./globals.css";

export const metadata: Metadata = {
  title: "MinaAI",
  description: "Multi-Agent AI System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SplashScreen />          
        <TechBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}