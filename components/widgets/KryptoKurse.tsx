"use client";

import { useCallback, useEffect, useState } from "react";
import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import YinYang from "@/components/YinYang";
import { CRYPTO_WATCHLIST } from "@/lib/crypto-watchlist.config";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price: number[] };
};

const REFRESH_MS = 60_000;

// Polaritätsfarben bewusst hell genug für #121214 (grün 8,2:1 / rot ~5,4:1)
const UP_COLOR = "#22c55e";
const DOWN_COLOR = "#f87171";

// Bewusst manuelles "$ "-Präfix: de-AT-Formatierung (Punkt als Tausendertrenner)
// würde das Dollarzeichen sonst nachstellen ("54.977 $").
function formatPrice(value: number): string {
  const formatted = new Intl.NumberFormat("de-AT", {
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
  return `$ ${formatted}`;
}

/** Mini-Sparkline der letzten 24h als schlanke SVG-Polyline — keine Chart-Lib nötig. */
function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  if (points.length < 2) return null;

  const w = 88;
  const h = 28;
  const pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const coords = points
    .map((p, i) => {
      const x = pad + (i / (points.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (p - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <polyline
        points={coords}
        fill="none"
        stroke={up ? UP_COLOR : DOWN_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Kurse & 24h-Sparklines von der öffentlichen CoinGecko-API (kein Key),
 * client-seitig alle 60 s aktualisiert. Watchlist: lib/crypto-watchlist.config.ts.
 */
export default function KryptoKurse() {
  const [coins, setCoins] = useState<Coin[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const ids = CRYPTO_WATCHLIST.join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`
      );
      if (!res.ok) {
        setError(
          res.status === 429
            ? "CoinGecko-Rate-Limit erreicht — nächster Versuch in 60 s."
            : `CoinGecko-Fehler (HTTP ${res.status}).`
        );
        return;
      }
      const data = (await res.json()) as Coin[];
      setCoins(data);
      setError(null);
      setUpdatedAt(new Date());
    } catch {
      setError("CoinGecko nicht erreichbar (offline?).");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const live = coins !== null && !error;

  return (
    <WidgetCard
      title="Krypto-Kurse"
      badge={live ? "Live" : error ? "Offline" : "Lädt …"}
      badgeTone={live ? "accent" : "neutral"}
    >
      {coins === null && !error && (
        <div className="flex items-center justify-center py-8" role="status" aria-label="Kurse laden">
          <YinYang className="h-8 w-8 animate-spin-slow motion-reduce:animate-none" />
        </div>
      )}

      {error && <ErrorNote>{error}</ErrorNote>}

      {coins !== null && (
        <>
          <ul className={`divide-y divide-line ${error ? "mt-4 opacity-60" : ""}`}>
            {coins.map((coin) => {
              const change = coin.price_change_percentage_24h;
              const up = (change ?? 0) >= 0;
              // Das 7d-Sparkline-Feld liefert Stundenwerte — die letzten 24 = 24h
              const points = coin.sparkline_in_7d?.price.slice(-24) ?? [];

              return (
                <li key={coin.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {coin.symbol.toUpperCase()}
                    </p>
                    <p className="truncate text-xs text-muted">{coin.name}</p>
                  </div>
                  <Sparkline points={points} up={up} />
                  <div className="w-28 text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      {formatPrice(coin.current_price)}
                    </p>
                    <p
                      className={`font-mono text-xs tabular-nums ${
                        up ? "text-accent" : "text-danger-soft"
                      }`}
                    >
                      {change === null || change === undefined
                        ? "–"
                        : `${up ? "+" : ""}${change.toFixed(2)} %`}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: CoinGecko · USD · 24h-Sparkline
            {updatedAt &&
              ` · Stand: ${updatedAt.toLocaleTimeString("de-AT", {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
          </p>
        </>
      )}
    </WidgetCard>
  );
}
