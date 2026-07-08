"use client";

import { useCallback, useEffect, useId, useState } from "react";
import AlertPulse from "@/components/AlertPulse";
import CountUp from "@/components/CountUp";
import ErrorNote from "@/components/ErrorNote";
import Flash from "@/components/Flash";
import TrendArrow from "@/components/TrendArrow";
import WidgetCard from "@/components/WidgetCard";
import YinYang from "@/components/YinYang";
import { CRYPTO_ALERTS, CRYPTO_WATCHLIST } from "@/lib/crypto-watchlist.config";

type Coin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price: number[] };
};

const REFRESH_MS = 60_000;

// Monochrom: Richtung über Helligkeit statt Farbe — Anstieg hell (#e5e5e5),
// Rückgang gedämpftes Grau (#8f8f94). Das Vorzeichen bleibt der harte Indikator.
const UP_COLOR = "#e5e5e5";
const DOWN_COLOR = "#8f8f94";

// Preise rendern über CountUp mit manuellem "$ "-Präfix: de-AT-Formatierung
// (Punkt als Tausendertrenner) würde das Dollarzeichen sonst nachstellen.

/**
 * 24h-Sparkline als SVG mit Verlaufsfläche je Kursrichtung und
 * Hover-Tooltip (Preis + Zeitpunkt) — weiterhin ohne Chart-Lib.
 */
function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;

  const w = 120;
  const h = 36;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const color = up ? UP_COLOR : DOWN_COLOR;

  const xy = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  // Pfadlänge für den Draw-on-Load-Effekt (stroke-dashoffset, .anim-draw)
  const lineLen = xy.reduce(
    (acc, [x, y], i) =>
      i === 0 ? 0 : acc + Math.hypot(x - xy[i - 1][0], y - xy[i - 1][1]),
    0
  );
  const area =
    `M ${xy[0][0].toFixed(1)},${h - 1} ` +
    xy.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L ${xy[xy.length - 1][0].toFixed(1)},${h - 1} Z`;

  const hoursAgo = hover === null ? 0 : points.length - 1 - hover;
  const tooltipPrice =
    hover === null
      ? ""
      : `$ ${new Intl.NumberFormat("de-AT", {
          maximumFractionDigits: points[hover] >= 1000 ? 0 : 2,
        }).format(points[hover])}`;
  const tooltipTime = hoursAgo === 0 ? "jetzt" : `vor ${hoursAgo} Std.`;
  const tooltipLeft = hover === null ? 0 : Math.max(12, Math.min(88, (xy[hover][0] / w) * 100));

  return (
    <div className="relative shrink-0">
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2"
          style={{ left: `${tooltipLeft}%` }}
          aria-hidden="true"
        >
          <div className="animate-scale-in origin-bottom whitespace-nowrap rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[10px] tabular-nums text-foreground motion-reduce:animate-none">
            {tooltipPrice} · {tooltipTime}
          </div>
        </div>
      )}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden="true"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * w;
          const index = Math.round(((x - pad) / (w - pad * 2)) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, index)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-draw"
          style={{ ["--draw-len" as string]: lineLen } as React.CSSProperties}
        />
        {hover !== null && (
          <circle
            cx={xy[hover][0]}
            cy={xy[hover][1]}
            r="3.5"
            fill={color}
            stroke="#121214"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
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
                  <AlertPulse
                    value={coin.current_price}
                    threshold={CRYPTO_ALERTS[coin.id]}
                    className="w-28 text-right"
                  >
                    <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                      <Flash value={coin.current_price}>
                        <CountUp
                          value={coin.current_price}
                          prefix="$ "
                          maxFractionDigits={coin.current_price >= 1000 ? 0 : 2}
                        />
                      </Flash>
                    </p>
                    <p
                      className={`flex items-center justify-end gap-1 font-mono text-xs tabular-nums ${
                        up ? "text-accent" : "text-danger-soft"
                      }`}
                    >
                      {change === null || change === undefined ? (
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
