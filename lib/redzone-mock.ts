import type { RedzoneDailyStat, RedzoneSlot, RedzoneStats } from "@/lib/redzone-types";

const DAYS = 90;
const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// mulberry32: deterministischer PRNG (fixer Seed) — Server und Client-Hydration
// erzeugen dieselbe Mock-Zahlenfolge, kein Hydration-Mismatch durch Math.random().
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function anchoredDayKey(offsetFromToday: number): string {
  const now = Date.now();
  const [y, m, d] = dayKey.format(now).split("-").map(Number);
  // Auf 12:00 UTC verankert: eindeutig im Wiener Kalendertag, unabhängig von DST.
  return dayKey.format(new Date(Date.UTC(y, m - 1, d - offsetFromToday, 12)));
}

const SLOT_NAMES = [
  "Startseite Header",
  "Artikel Sidebar",
  "Footer Banner",
  "Mobile Interstitial",
  "Newsletter Inline",
];
// Umsatzanteile je Slot (summieren auf 1) — fixe Gewichte für Determinismus.
const SLOT_WEIGHTS = [0.32, 0.24, 0.18, 0.15, 0.11];

/**
 * Deterministische Mock-Daten für den RedzoneEarth-Bereich: 90 Tage Ad-Erlöse
 * (leichter Aufwärtstrend + Rauschen) plus fünf Platzierungen mit
 * Umsatzverteilung. Fixer Seed → Server- und Client-Render liefern identische
 * Zahlen. Pure Funktion: auch serverseitig (Projektvergleich) nutzbar.
 */
export function generateRedzoneStats(): RedzoneStats {
  const rand = mulberry32(2024);
  const daily: RedzoneDailyStat[] = [];
  let revenueBase = 12;

  for (let i = DAYS - 1; i >= 0; i--) {
    revenueBase = Math.max(4, revenueBase + (rand() * 4 - 1.85)); // leichter Aufwärtsdrift
    const trend = (DAYS - i) * 0.06;
    const revenue = Math.round((revenueBase + trend + rand() * 6) * 100) / 100;
    const impressions = Math.round(2500 + rand() * 6000 + (DAYS - i) * 10);
    const fill_rate = Math.round((62 + rand() * 33) * 10) / 10;
    const visitors = Math.round(700 + rand() * 2200 + (DAYS - i) * 4);
    daily.push({ date: anchoredDayKey(i), revenue, impressions, fill_rate, visitors });
  }

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalImpressions = daily.reduce((s, d) => s + d.impressions, 0);
  const slots: RedzoneSlot[] = SLOT_NAMES.map((name, idx) => ({
    slot_id: `slot-${idx + 1}`,
    slot_name: name,
    revenue: Math.round(totalRevenue * SLOT_WEIGHTS[idx] * 100) / 100,
    impressions: Math.round(totalImpressions * SLOT_WEIGHTS[idx]),
  }));

  daily.sort((a, b) => a.date.localeCompare(b.date));
  slots.sort((a, b) => b.revenue - a.revenue);

  return { daily, slots };
}
