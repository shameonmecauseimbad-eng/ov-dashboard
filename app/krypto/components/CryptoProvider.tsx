"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CURATED_IDS } from "@/lib/crypto-coins";
import type { CoinMarket } from "@/lib/crypto-types";

const REFRESH_MS = 60_000;

type Status = "loading" | "live" | "error";

type CryptoContextValue = {
  coins: Record<string, CoinMarket>;
  status: Status;
  error: string | null;
  updatedAt: Date | null;
};

const CryptoContext = createContext<CryptoContextValue | null>(null);

export function useCryptoMarkets(): CryptoContextValue {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error("useCryptoMarkets muss innerhalb von <CryptoProvider> genutzt werden.");
  return ctx;
}

type RawCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price: number[] };
};

/**
 * Lädt die Marktdaten aller kuratierten Coins EINMAL zentral (alle 60 s) und
 * stellt sie per Context bereit — so teilen sich Portfolio, Preisliste und
 * Watchlist einen einzigen CoinGecko-Aufruf statt jeder für sich (Rate-Limit).
 */
export default function CryptoProvider({ children }: { children: React.ReactNode }) {
  const [coins, setCoins] = useState<Record<string, CoinMarket>>({});
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const ids = CURATED_IDS.join(",");
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`
      );
      if (!res.ok) {
        setStatus("error");
        setError(
          res.status === 429
            ? "CoinGecko-Rate-Limit erreicht — nächster Versuch in 60 s."
            : `CoinGecko-Fehler (HTTP ${res.status}).`
        );
        return;
      }
      const data = (await res.json()) as RawCoin[];
      const map: Record<string, CoinMarket> = {};
      for (const c of data) {
        map[c.id] = {
          id: c.id,
          symbol: c.symbol,
          name: c.name,
          current_price: c.current_price,
          price_change_percentage_24h: c.price_change_percentage_24h ?? null,
          sparkline: c.sparkline_in_7d?.price.slice(-24) ?? [],
        };
      }
      setCoins(map);
      setStatus("live");
      setError(null);
      setUpdatedAt(new Date());
    } catch {
      setStatus("error");
      setError("CoinGecko nicht erreichbar (offline?).");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return <CryptoContext.Provider value={{ coins, status, error, updatedAt }}>{children}</CryptoContext.Provider>;
}
