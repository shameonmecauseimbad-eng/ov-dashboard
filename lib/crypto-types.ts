/** Normalisierter Markt-Datensatz eines Coins (aus CoinGecko /coins/markets). */
export type CoinMarket = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  /** Letzte 24 Stundenwerte für die Sparkline. */
  sparkline: number[];
};

/** Eine Portfolio-Position. Entspricht dashboard.crypto_holdings. */
export type Holding = {
  coin_id: string;
  amount: number;
  added_at: string; // ISO
};
