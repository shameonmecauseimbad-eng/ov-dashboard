"use client";

import { useState } from "react";
import AlertPulse from "@/components/AlertPulse";
import CountUp from "@/components/CountUp";
import ErrorNote from "@/components/ErrorNote";
import Flash from "@/components/Flash";
import TrendArrow from "@/components/TrendArrow";
import WidgetCard from "@/components/WidgetCard";
import YinYang from "@/components/YinYang";
import { CURATED_COINS } from "@/lib/crypto-coins";
import { changeWeight, fmtUsd } from "@/lib/crypto-format";
import { removeAlert, setAlert, useAlerts } from "@/lib/crypto-store";
import { useCryptoMarkets } from "./CryptoProvider";
import Sparkline from "./Sparkline";

/**
 * Preisliste aller kuratierten Coins aus dem zentralen CryptoProvider-Fetch:
 * Kurs, 24h-Sparkline und -Änderung plus je Coin ein optionaler Preisalarm
 * (localStorage). Monochrom — Richtung über Pfeil/Vorzeichen und Helligkeit.
 */
export default function PreislisteWidget() {
  const { coins, status, error, updatedAt } = useCryptoMarkets();
  const alerts = useAlerts();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const loading = status === "loading";
  const live = status === "live";

  function openEditor(coinId: string) {
    setEditing(coinId);
    setDraft(alerts[coinId] != null ? String(alerts[coinId]) : "");
  }

  function saveAlert(coinId: string) {
    const value = Number(draft.replace(",", "."));
    if (Number.isFinite(value) && value > 0) setAlert(coinId, value);
    else removeAlert(coinId);
    setEditing(null);
    setDraft("");
  }

  return (
    <WidgetCard
      title="Preisliste"
      badge={live ? "Live" : loading ? "Lädt …" : "Offline"}
      badgeTone={live ? "accent" : "neutral"}
    >
      {loading && (
        <div className="flex items-center justify-center py-8" role="status" aria-label="Kurse laden">
          <YinYang className="h-8 w-8 animate-spin-slow motion-reduce:animate-none" />
        </div>
      )}

      {status === "error" && <ErrorNote>{error}</ErrorNote>}

      {!loading && (
        <>
          <ul className={`divide-y divide-line ${status === "error" ? "mt-4 opacity-60" : ""}`}>
            {CURATED_COINS.map((meta) => {
              const coin = coins[meta.id];
              const change = coin?.price_change_percentage_24h ?? null;
              const up = (change ?? 0) >= 0;
              const threshold = alerts[meta.id];
              const isEditing = editing === meta.id;

              return (
                <li key={meta.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{meta.symbol}</p>
                    <p className="truncate text-xs text-muted">{meta.name}</p>
                    {isEditing ? (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="font-mono text-xs text-muted">$</span>
                        <input
                          autoFocus
                          inputMode="decimal"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveAlert(meta.id);
                            if (e.key === "Escape") {
                              setEditing(null);
                              setDraft("");
                            }
                          }}
                          placeholder="Schwelle"
                          className="w-24 rounded-md border border-line bg-raised px-2 py-1 font-mono text-xs tabular-nums text-foreground outline-none focus:border-white/40"
                        />
                        <button
                          type="button"
                          onClick={() => saveAlert(meta.id)}
                          className="rounded-md border border-line bg-raised px-2 py-1 text-xs text-muted transition-colors hover:text-white"
                        >
                          OK
                        </button>
                      </div>
                    ) : threshold != null ? (
                      <button
                        type="button"
                        onClick={() => openEditor(meta.id)}
                        className="mt-1 font-mono text-[11px] tabular-nums text-muted transition-colors hover:text-white"
                        title="Alarm bearbeiten"
                      >
                        ⌁ Alarm {fmtUsd(threshold)}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openEditor(meta.id)}
                        className="mt-1 text-[11px] text-muted opacity-0 transition-all hover:text-white group-hover:opacity-100"
                      >
                        + Alarm
                      </button>
                    )}
                  </div>

                  {coin ? (
                    <Sparkline points={coin.sparkline} up={up} />
                  ) : (
                    <div className="h-9 w-[120px] shrink-0" aria-hidden="true" />
                  )}

                  <AlertPulse
                    value={coin?.current_price ?? 0}
                    threshold={threshold}
                    className="w-28 text-right"
                  >
                    <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {coin ? (
                        <Flash value={coin.current_price}>
                          <CountUp
                            value={coin.current_price}
                            prefix="$ "
                            maxFractionDigits={coin.current_price >= 1000 ? 0 : coin.current_price >= 1 ? 2 : 4}
                          />
                        </Flash>
                      ) : (
                        "—"
                      )}
                    </p>
                    <p
                      className={`flex items-center justify-end gap-1 font-mono text-xs tabular-nums ${changeWeight(up)}`}
                    >
                      {change === null ? (
                        "–"
                      ) : (
                        <>
                          <TrendArrow up={up} className="h-2 w-2" />
                          {`${up ? "+" : ""}${change.toFixed(2)} %`}
                        </>
                      )}
                    </p>
                  </AlertPulse>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: CoinGecko · USD · 24h-Sparkline · Alarme lokal gespeichert
            {updatedAt &&
              ` · Stand: ${updatedAt.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}`}
          </p>
        </>
      )}
    </WidgetCard>
  );
}
