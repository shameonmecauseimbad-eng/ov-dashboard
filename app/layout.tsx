import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import AlertOverlay from "@/components/AlertOverlay";
import BootIntro from "@/components/BootIntro";
import LightGradient from "@/components/LightGradient";
import ParticleField from "@/components/ParticleField";
import Sidebar from "@/components/Sidebar";
import YinYang from "@/components/YinYang";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Overview Dashboard",
  description: "Private Übersicht über alle laufenden Projekte und Datenquellen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${display.variable} ${geistSans.variable} ${geistMono.variable} animate-breathe-bg bg-background font-sans text-foreground antialiased motion-reduce:animate-none`}
      >
        <ParticleField />
        <LightGradient />
        <div className="grain-overlay" aria-hidden="true" />
        <Sidebar />
        <div className="relative z-10 flex min-h-dvh flex-col lg:pl-60">
          {children}
          <footer className="mx-auto flex w-full max-w-[1800px] items-center gap-2.5 border-t border-line px-5 py-5 text-xs text-muted sm:px-8">
            <YinYang size={14} />
            <span>ov-dashboard · lokal &amp; privat · read-only</span>
          </footer>
        </div>
        <AlertOverlay />
        <BootIntro />
      </body>
    </html>
  );
}
