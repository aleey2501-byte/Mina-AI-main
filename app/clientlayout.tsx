"use client";

import TechBackground from "@/components/TechBackground";
import SplashScreen from "@/components/SplashScreen";
import { Providers } from "./providers";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SplashScreen />
      <TechBackground />
      <Providers>{children}</Providers>
    </>
  );
}