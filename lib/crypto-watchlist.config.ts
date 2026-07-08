/**
 * Watchlist fürs Krypto-Widget — CoinGecko-IDs (nicht Ticker!).
 * Nachschlagen: https://api.coingecko.com/api/v3/coins/list
 */
export const CRYPTO_WATCHLIST: string[] = ["bitcoin", "ethereum"];

/**
 * Optionale Kurs-Alarme: CoinGecko-ID → Schwelle in USD. Überschreitet der
 * Preis die Schwelle von unten nach oben, pulst die Kachel einmal (weißer
 * Ring, siehe components/AlertPulse.tsx). Leer = keine Alarme.
 * Beispiel: { bitcoin: 100000 }
 */
export const CRYPTO_ALERTS: Record<string, number> = {};
