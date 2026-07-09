"use client";

import Reveal from "@/components/Reveal";
import type { CoinMention } from "@/lib/crypto-briefing";
import BriefingRefsWidget from "./BriefingRefsWidget";
import CryptoProvider from "./CryptoProvider";
import PortfolioWidget from "./PortfolioWidget";
import PreislisteWidget from "./PreislisteWidget";

/**
 * Detailansicht des Krypto-Bereichs: mountet den CryptoProvider EINMAL (ein
 * gemeinsamer CoinGecko-Fetch alle 60 s) und ordnet die Widgets darunter an.
 * Die Briefing-Erwähnungen werden server-seitig ermittelt und durchgereicht.
 */
export default function KryptoDetail({ mentions }: { mentions: CoinMention[] }) {
  return (
    <CryptoProvider>
      <div className="space-y-4 sm:space-y-5">
        <PortfolioWidget />
        <Reveal delayMs={100}>
          <PreislisteWidget />
        </Reveal>
        <Reveal delayMs={150}>
          <BriefingRefsWidget mentions={mentions} />
        </Reveal>
      </div>
    </CryptoProvider>
  );
}
