import { CURATED_COINS } from "@/lib/crypto-coins";

/** Coin → erkennbare Schlüsselwörter (Name, Symbol, gängige Aliasse). */
const COIN_KEYWORDS: Array<{ id: string; symbol: string; keywords: string[] }> = CURATED_COINS.map((c) => {
  const extra: Record<string, string[]> = {
    bitcoin: ["bitcoin", "btc"],
    ethereum: ["ethereum", "eth", "ether"],
    ripple: ["ripple", "xrp"],
    "avalanche-2": ["avalanche", "avax"],
    "polygon-ecosystem-token": ["polygon", "matic", "pol"],
  };
  return {
    id: c.id,
    symbol: c.symbol,
    keywords: extra[c.id] ?? [c.name.toLowerCase(), c.symbol.toLowerCase()],
  };
});

/** Ein Briefing-Eintrag, so weit ihn die Coin-Erkennung braucht. */
export type BriefingEntry = { category?: string; text: string };

export type CoinMention = { id: string; symbol: string; categories: string[] };

// Wort-Grenzen-Match, damit „eth" nicht in „method" trifft. Case-insensitive.
function mentionsKeyword(text: string, keyword: string): boolean {
  const re = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return re.test(text);
}

/**
 * Findet in Briefing-Einträgen erwähnte Coins (einfacher Keyword-Match). Gibt
 * je Coin die Kategorien zurück, in denen er vorkommt — Grundlage für die
 * klickbaren Verweise vom Krypto-Bereich zum Morgen-Briefing.
 */
export function matchCoinsInEntries(entries: BriefingEntry[]): CoinMention[] {
  const byId = new Map<string, CoinMention>();
  for (const entry of entries) {
    for (const coin of COIN_KEYWORDS) {
      if (coin.keywords.some((k) => mentionsKeyword(entry.text, k))) {
        const existing = byId.get(coin.id) ?? { id: coin.id, symbol: coin.symbol, categories: [] };
        if (entry.category && !existing.categories.includes(entry.category)) {
          existing.categories.push(entry.category);
        }
        byId.set(coin.id, existing);
      }
    }
  }
  return Array.from(byId.values());
}
