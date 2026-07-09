/**
 * Zentrale Wiener-Kalender-Helfer für den To-Do-Bereich (Snooze,
 * Wochenrückblick, Zeitfenster-Vorschläge). Alle Datumssprünge sind
 * DST-sicher auf 12:00 UTC verankert.
 */

const TZ = "Europe/Vienna";
export const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** Wiener Kalendertag von `base` als YYYY-MM-DD. */
export function isoDay(base: Date = new Date()): string {
  return dayKey.format(base);
}

/** `base` + delta Tage als YYYY-MM-DD (Wiener Datum, DST-sicher). */
export function shiftDays(base: Date, delta: number): string {
  const [y, m, d] = dayKey.format(base).split("-").map(Number);
  return dayKey.format(new Date(Date.UTC(y, m - 1, d + delta, 12)));
}

/** Wochentag (0 = Sonntag … 6 = Samstag) des Wiener Datums von `base`. */
export function isoWeekday(base: Date = new Date()): number {
  const [y, m, d] = dayKey.format(base).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/** Montag der laufenden Woche als YYYY-MM-DD (Wochenrückblick, Mo–So). */
export function startOfWeek(base: Date = new Date()): string {
  const dow = isoWeekday(base); // 0=So
  const backToMonday = (dow + 6) % 7; // So→6, Mo→0, Di→1 …
  return shiftDays(base, -backToMonday);
}
