"use client";

import { useCallback, useEffect, useState } from "react";
import CountUp from "@/components/CountUp";
import ErrorNote from "@/components/ErrorNote";
import Flash from "@/components/Flash";
import TrendArrow from "@/components/TrendArrow";
import WidgetCard from "@/components/WidgetCard";
import YinYang from "@/components/YinYang";
import { COIN_BY_ID } from "@/lib/crypto-coins";
import { CRYPTO_WATCHLIST } from "@/lib/crypto-watchlist.config";

const REFRESH_MS = 60_000;

type CoinPulse = {
  id: string;
  price: number;
  change24h: number | null;
};

type FngPulse = {
  value: number;
  classification: string;
  deltaVsYesterday: number | null;
};

type PulseState = {
  coins: CoinPulse[] | null;
  coinsError: string | null;
  fng: FngPulse | null;
  fngError: string | null;
  updatedAt: Date | null;
};

async function fetchCoins(): Promise<{ coins: CoinPulse[] | null; error: string | null }> {
  try {
    const ids = CRYPTO_WATCHLIST.join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) {
      return {
        coins: null,
        error: res.status === 429 ? "CoinGecko-Rate-Limit erreicht." : `CoinGecko-Fehler (HTTP ${res.status}).`,
      };
    }
    const data = (await res.json()) as Record<string, { usd: number; usd_24h_change?: number }>;
    const coins = CRYPTO_WATCHLIST.filter((id) => data[id]).map((id) => ({
      id,
      price: data[id].usd,
      change24h: data[id].usd_24h_change ?? null,
    }));
    return { coins, error: null };
  } catch {
    return { coins: null, error: "CoinGecko nicht erreichbar." };
  }
}

async function fetchFng(): Promise<{ fng: FngPulse | null; error: string | null }> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=2");
    if (!res.ok) return { fng: null, error: `Fear & Greed-Fehler (HTTP ${res.status}).` };
    const json = (await res.json()) as { data: Array<{ value: string; value_classification: string }> };
    const [today, yesterday] = json.data ?? [];
    if (!today) return { fng: null, error: "Fear & Greed: keine Daten." };
    const value = Number(today.value);
    const prevValue = yesterday ? Number(yesterday.value) : null;
    return {
      fng: {
        value,
        classification: today.value_classification,
        deltaVsYesterday: prevValue === null ? null : value - prevValue,
      },
      error: null,
    };
  } catch {
    return { fng: null, error: "Fear & Greed nicht erreichbar." };
  }
}

/**
 * Kompakter Marktpuls über der Themen-Historie: Watchlist-Preise (24h) +
 * Crypto Fear & Greed Index, damit das Briefing in Zahlen geerdet bleibt statt
 * reiner Text zu sein. Eigener 60-s-Client-Takt, unabhängig vom
 * Supabase-Refresh der übrigen Briefing-Widgets — Muster aus KryptoKurse.tsx.
 */
export default function WatchlistPuls() {
  const [state, setState] = useState<PulseState>({
    coins: null,
    coinsError: null,
    fng: null,
    fngError: null,
    updatedAt: null,
  });

  const load = useCallback(async () => {
    const [coinsResult, fngResult] = await Promise.all([fetchCoins(), fetchFng()]);
    setState({
      coins: coinsResult.coins,
      coinsError: coinsResult.error,
      fng: fngResult.fng,
      fngError: fngResult.error,
      updatedAt: new Date(),
    });
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const loading = state.coins === null && state.fng === null && !state.coinsError && !state.fngError;
  const live = (state.coins !== null || state.fng !== null) && !(state.coinsError && state.fngError);

  return (
    <WidgetCard
      title="Watchlist-Puls"
      badge={live ? "Live" : loading ? "Lädt …" : "Offline"}
      badgeTone={live ? "accent" : "neutral"}
    >
      {loading && (
        <div className="flex items-center justify-center py-8" role="status" aria-label="Marktpuls lädt">
          <YinYang className="h-8 w-8 animate-spin-slow motion-reduce:animate-none" />
        </div>
      )}

      {state.coinsError && state.fngError && <ErrorNote>{state.coinsError}</ErrorNote>}

      {!loading && !(state.coinsError && state.fngError) && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(state.coins ?? []).map((coin) => {
              const meta = COIN_BY_ID[coin.id];
              const up = (coin.change24h ?? 0) >= 0;
              return (
                <div key={coin.id} className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">
                    {meta?.symbol ?? coin.id}
                  </p>
                  <p className="mt-1.5 whitespace-nowrap font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">
                    <Flash value={coin.price}>
                      <CountUp
                        value={coin.price}
                        prefix="$ "
                        maxFractionDigits={coin.price >= 1000 ? 0 : 2}
                      />
                    </Flash>
                  </p>
                  <p
                    className={`mt-0.5 flex items-center gap-1 font-mono text-xs tabular-nums ${
                      up ? "font-semibold text-foreground" : "text-muted"
                    }`}
                  >
                    {coin.change24h === null ? (
                      "–"
                    ) : (
                      <>
                        <TrendArrow up={up} className="h-2 w-2" />
                        {`${up ? "+" : ""}${coin.change24h.toFixed(2)} %`}
                      </>
                    )}
                  </p>
                </div>
              );
            })}

            {state.fng && (
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.12em] text-muted">Fear &amp; Greed</p>
                <p className="mt-1.5 whitespace-nowrap font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">
                  <Flash value={state.fng.value}>
                    <CountUp value={state.fng.value} />
                  </Flash>
                </p>
                <p
                  className={`mt-0.5 flex items-center gap-1 font-mono text-xs tabular-nums ${
                    state.fng.deltaVsYesterday !== null && state.fng.deltaVsYesterday >= 0
                      ? "font-semibold text-foreground"
                      : "text-muted"
                  }`}
                >
                  {state.fng.deltaVsYesterday === null ? (
                    state.fng.classification
                  ) : (
                    <>
                      <TrendArrow up={state.fng.deltaVsYesterday >= 0} className="h-2 w-2" />
                      {state.fng.classification}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          {(state.coinsError || state.fngError) && (
            <p className="mt-4 text-xs text-muted">
              {state.coinsError && `Kurse: ${state.coinsError}`}
              {state.coinsError && state.fngError && " · "}
              {state.fngError && `Fear & Greed: ${state.fngError}`}
            </p>
          )}

          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: CoinGecko · alternative.me
            {state.updatedAt &&
              ` · Stand: ${state.updatedAt.toLocaleTimeString("de-AT", {
                hour: "2-digit",
                minute: "2-digit",
              })}`}
          </p>
        </>
      )}
    </WidgetCard>
  );
}
