export type CoinMeta = { id: string; symbol: string; name: string };

/**
 * Kuratierte Coin-Auswahl (CoinGecko-IDs). Bewusst begrenzt: der Markets-Fetch
 * lädt genau diese IDs in EINEM Aufruf, Portfolio/Watchlist wählen daraus —
 * so bleiben alle Preise/Sparklines für jede Auswahl garantiert vorhanden,
 * ohne den CoinGecko-Endpoint coins/list abzufragen.
 */
export const CURATED_COINS: CoinMeta[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "tron", symbol: "TRX", name: "TRON" },
  { id: "polygon-ecosystem-token", symbol: "POL", name: "Polygon" },
];

export const CURATED_IDS: string[] = CURATED_COINS.map((c) => c.id);

export const COIN_BY_ID: Record<string, CoinMeta> = Object.fromEntries(
  CURATED_COINS.map((c) => [c.id, c])
);
