"use client";

import { useState } from "react";
import CountUp from "@/components/CountUp";
import TrendArrow from "@/components/TrendArrow";
import WidgetCard from "@/components/WidgetCard";
import { COIN_BY_ID, CURATED_COINS } from "@/lib/crypto-coins";
import { changeWeight, cryptoInt, fmtUsd, fmtUsdSum } from "@/lib/crypto-format";
import { addHolding, removeHolding, useHoldings } from "@/lib/crypto-store";
import { useCryptoMarkets } from "./CryptoProvider";

/**
 * Portfolio-Positionen (localStorage, geräteweit) bewertet mit den Live-Kursen
 * aus dem CryptoProvider: Gesamtwert, 24h-Entwicklung und je Position ihr Wert.
 * Eingabe: Coin + Menge hinzufügen, Position wieder entfernen. Monochrom.
 */
export default function PortfolioWidget() {
  const holdings = useHoldings();
  const { coins, status } = useCryptoMarkets();
  const [coinId, setCoinId] = useState<string>(CURATED_COINS[0].id);
  const [amount, setAmount] = useState("");

  const priced = holdings.map((h) => {
    const coin = coins[h.coin_id];
    const price = coin?.current_price ?? null;
    const change = coin?.price_change_percentage_24h ?? null;
    const value = price != null ? price * h.amount : null;
    // Wert vor 24h für die gewichtete Gesamtentwicklung.
    const valuePrev = price != null && change != null ? (price / (1 + change / 100)) * h.amount : null;
    return { ...h, meta: COIN_BY_ID[h.coin_id], price, change, value, valuePrev };
  });

  const total = priced.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const totalPrev = priced.reduce((sum, p) => sum + (p.valuePrev ?? 0), 0);
  const totalChange = totalPrev > 0 ? ((total - totalPrev) / totalPrev) * 100 : null;
  const totalUp = (totalChange ?? 0) >= 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) return;
    addHolding(coinId, value);
    setAmount("");
  }

  return (
    <WidgetCard
      title="Portfolio"
      badge={status === "live" ? "Live" : status === "loading" ? "Lädt …" : "Offline"}
      badgeTone={status === "live" ? "accent" : "neutral"}
    >
      {/* Gesamtwert */}
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Gesamtwert</p>
        <p className="mt-1 flex items-baseline gap-2 font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">
          <CountUp value={total} prefix="$ " minFractionDigits={2} maxFractionDigits={2} />
          {totalChange != null && (
            <span className={`flex items-center gap-1 text-xs ${changeWeight(totalUp)}`}>
              <TrendArrow up={totalUp} className="h-2 w-2" />
              {`${totalUp ? "+" : ""}${totalChange.toFixed(2)} %`}
            </span>
          )}
        </p>
      </div>

      {/* Positionen */}
      {priced.length > 0 ? (
        <ul className="divide-y divide-line">
          {priced.map((p) => {
            const up = (p.change ?? 0) >= 0;
            return (
              <li key={p.coin_id} className="group/pos flex items-center gap-3 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{p.meta?.symbol ?? p.coin_id}</p>
                  <p className="truncate font-mono text-xs tabular-nums text-muted">
                    {cryptoInt.format(p.amount)} {p.meta?.symbol ?? ""}
                    {p.price != null && ` · ${fmtUsd(p.price)}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                    {p.value != null ? fmtUsdSum(p.value) : "—"}
                  </p>
                  {p.change != null && (
                    <p className={`flex items-center justify-end gap-1 font-mono text-xs tabular-nums ${changeWeight(up)}`}>
                      <TrendArrow up={up} className="h-2 w-2" />
                      {`${up ? "+" : ""}${p.change.toFixed(2)} %`}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeHolding(p.coin_id)}
                  aria-label={`${p.meta?.symbol ?? p.coin_id} entfernen`}
                  className="shrink-0 rounded-md border border-line bg-raised px-2 py-1 text-xs text-muted opacity-0 transition-all hover:text-white focus-visible:opacity-100 group-hover/pos:opacity-100"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-line bg-white/[0.03] px-3.5 py-3 text-xs leading-relaxed text-muted">
          Noch keine Positionen — unten Coin und Menge eintragen. Die Daten liegen lokal in diesem Browser.
        </p>
      )}

      {/* Eingabe */}
      <form onSubmit={submit} className="mt-5 flex items-center gap-2 border-t border-line pt-4">
        <select
          value={coinId}
          onChange={(e) => setCoinId(e.target.value)}
          className="rounded-md border border-line bg-raised px-2 py-1.5 text-sm text-foreground outline-none focus:border-white/40"
        >
          {CURATED_COINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.symbol}
            </option>
          ))}
        </select>
        <input
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Menge"
          className="min-w-0 flex-1 rounded-md border border-line bg-raised px-2.5 py-1.5 font-mono text-sm tabular-nums text-foreground outline-none focus:border-white/40"
        />
        <button
          type="submit"
          className="rounded-md border border-line bg-raised px-3 py-1.5 text-sm text-muted transition-colors hover:text-white"
        >
          Hinzufügen
        </button>
      </form>
    </WidgetCard>
  );
}
