"use client";

import Link from "next/link";
import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { COIN_BY_ID } from "@/lib/crypto-coins";
import type { CoinMention } from "@/lib/crypto-briefing";
import { useHoldings } from "@/lib/crypto-store";

/**
 * Zeigt, welche kuratierten Coins im aktuellen Morgen-Briefing vorkommen
 * (server-seitig per Keyword-Match ermittelt) und verlinkt ins Briefing.
 * Eigene Portfolio-Coins werden hervorgehoben — so sieht man sofort, ob die
 * Nachrichtenlage die eigenen Positionen betrifft.
 */
export default function BriefingRefsWidget({ mentions }: { mentions: CoinMention[] }) {
  const holdings = useHoldings();
  const held = new Set(holdings.map((h) => h.coin_id));

  // Eigene Positionen zuerst.
  const sorted = [...mentions].sort((a, b) => Number(held.has(b.id)) - Number(held.has(a.id)));

  return (
    <WidgetCard
      title="Im Briefing erwähnt"
      badge={mentions.length > 0 ? `${mentions.length}` : "—"}
      badgeTone={mentions.length > 0 ? "accent" : "neutral"}
    >
      {sorted.length > 0 ? (
        <>
          <ul className="flex flex-col gap-2.5">
            {sorted.map((m) => {
              const meta = COIN_BY_ID[m.id];
              const isHeld = held.has(m.id);
              return (
                <li key={m.id}>
                  <Link
                    href="/briefing"
                    className="group/ref flex items-center gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/30"
                  >
                    <span className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-foreground">{meta?.symbol ?? m.symbol.toUpperCase()}</span>
                      <span className="truncate text-xs text-muted">{meta?.name ?? m.id}</span>
                      {isHeld && (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          im Portfolio
                        </span>
                      )}
                    </span>
                    <span className="ml-auto flex flex-wrap justify-end gap-1.5">
                      {m.categories.map((cat) => (
                        <span
                          key={cat}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted transition-colors group-hover/ref:text-foreground"
                        >
                          {cat}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Keyword-Abgleich mit dem neuesten Morgen-Briefing · Quelle:{" "}
            <span className="font-mono">dashboard.morning_briefing</span>
          </p>
        </>
      ) : (
        <ErrorNote>
          Aktuell wird kein kuratierter Coin im Morgen-Briefing erwähnt — sobald ein Thema Bitcoin, Ethereum & Co.
          betrifft, erscheint der Verweis hier.
        </ErrorNote>
      )}
    </WidgetCard>
  );
}
