import type { Priority, ProjectTag, TaskOrEvent } from "@/lib/todo-types";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * Baut einen ISO-Zeitstempel für „heute + dayOffset" zur lokalen Wiener Stunde.
 * Anker über das Wiener Kalenderdatum (12:00 UTC, DST-sicher) — Server- und
 * Client-Render liefern denselben Tag, daher kein Hydration-Mismatch.
 */
function at(dayOffset: number, hour: number, minute = 0): string {
  const now = Date.now();
  const [y, m, d] = dayKey.format(now).split("-").map(Number);
  // Wiener Zeit liegt UTC+1/+2 vor — grob über feste Stunde; für Mock ausreichend.
  const date = new Date(Date.UTC(y, m - 1, d + dayOffset, hour, minute));
  return date.toISOString();
}

type Seed = Omit<TaskOrEvent, "id" | "at"> & { dayOffset: number; hour: number; minute?: number; noTime?: boolean };

// Fester, handkuratierter Datensatz — deckt alle UI-Zustände ab: Termine vs.
// To-Dos, alle drei Prioritäten, alle vier Projekt-Tags, erledigt/offen,
// heute + kommende Wochentage.
const SEEDS: Seed[] = [
  // ── Heute ──
  { type: "event", title: "Standup DrawdownDiary", dayOffset: 0, hour: 9, priority: "high", projectTag: "ddd", allDay: false, done: false },
  { type: "task", title: "Stripe-Umsätze Q2 prüfen", dayOffset: 0, hour: 10, priority: "high", projectTag: "ddd", allDay: false, done: false },
  { type: "task", title: "Social-Widgets Review mergen", dayOffset: 0, hour: 11, priority: "high", projectTag: "ov-dashboard", allDay: false, done: false },
  { type: "event", title: "Call RedzoneEarth Ad-Provider", dayOffset: 0, hour: 14, priority: "medium", projectTag: "redzone", allDay: false, done: false },
  { type: "task", title: "Newsletter-Entwurf gegenlesen", dayOffset: 0, hour: 16, priority: "medium", projectTag: "sonstiges", allDay: false, done: false },
  { type: "task", title: "Backup-Job kontrollieren", dayOffset: 0, hour: 8, priority: "low", projectTag: "ov-dashboard", allDay: false, done: true },
  { type: "task", title: "Kaffee nachbestellen", dayOffset: 0, hour: 8, minute: 30, priority: "low", projectTag: "sonstiges", allDay: false, done: true },

  // ── Morgen ──
  { type: "event", title: "Deploy-Fenster ov-dashboard", dayOffset: 1, hour: 10, priority: "high", projectTag: "ov-dashboard", allDay: false, done: false },
  { type: "task", title: "DDD-Onboarding-Flow testen", dayOffset: 1, hour: 13, priority: "medium", projectTag: "ddd", allDay: false, done: false },
  { type: "event", title: "Steuerberater-Termin", dayOffset: 1, hour: 15, priority: "medium", projectTag: "sonstiges", allDay: false, done: false },

  // ── Übermorgen / Woche ──
  { type: "task", title: "RedzoneEarth Creatives briefen", dayOffset: 2, hour: 11, priority: "high", projectTag: "redzone", allDay: false, done: false },
  { type: "event", title: "Ganztägig: Konferenz", dayOffset: 3, hour: 0, priority: "low", projectTag: "sonstiges", allDay: true, done: false, noTime: true },
  { type: "task", title: "Quartalszahlen zusammenstellen", dayOffset: 3, hour: 12, priority: "medium", projectTag: "ddd", allDay: false, done: false },
  { type: "task", title: "Domain-Renewal ov-dashboard", dayOffset: 4, hour: 9, priority: "low", projectTag: "ov-dashboard", allDay: false, done: false },
];

/**
 * Deterministische Platzhalter-Daten für den /todo-Bereich. Fester Datensatz
 * (kein Zufall) → Server und Client rendern identisch. Wird später vom echten
 * Datenlader ersetzt (s. lib/useTasksAndEvents.ts).
 */
export function generateTasksAndEvents(): TaskOrEvent[] {
  return SEEDS.map((s, i) => ({
    id: `mock-${i}`,
    title: s.title,
    type: s.type,
    at: s.noTime ? at(s.dayOffset, 0) : at(s.dayOffset, s.hour, s.minute ?? 0),
    allDay: s.allDay,
    projectTag: s.projectTag as ProjectTag,
    priority: s.priority as Priority,
    done: s.done,
  }));
}
