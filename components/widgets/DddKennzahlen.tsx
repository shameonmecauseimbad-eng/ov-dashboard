import { DddKennzahlenCard } from "@/components/widgets/DddDetail";

/**
 * "Kennzahlen"-Widget für das Overview: dieselbe Karte wie auf der /ddd-Seite
 * (Gesamt-User, Trades, Monatsumsatz, Seitenaufrufe heute) — Daten kommen aus
 * der gemeinsamen, 300 s gecachten Ladefunktion in DddDetail.tsx, damit beide
 * Seiten identische Werte zeigen und Stripe nicht doppelt paginiert wird.
 */
export default function DddKennzahlen() {
  return <DddKennzahlenCard title="DDD Statistics" />;
}
