"use client";

import { useMemo, useState } from "react";
import { generateTasksAndEvents } from "@/lib/todo-mock";
import { useUserTasks } from "@/lib/todo-store";
import type { TaskOrEvent } from "@/lib/todo-types";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export type UseTasksAndEventsResult = {
  /** Alle Punkte (Termine + To-Dos), chronologisch aufsteigend; undatierte To-Dos ans Ende. */
  items: TaskOrEvent[];
  /** Nur die Punkte von heute (Wiener Kalendertag). */
  today: TaskOrEvent[];
  /** true = Platzhalter-/Mock-Daten, false = echte Anbindung. Steuert die Badges. */
  isMock: boolean;
};

function sortChrono(a: TaskOrEvent, b: TaskOrEvent): number {
  if (a.at && b.at) return a.at.localeCompare(b.at);
  if (a.at) return -1; // datierte vor undatierten
  if (b.at) return 1;
  return a.title.localeCompare(b.title, "de");
}

/**
 * Zentraler Datenzugriff für den gesamten /todo-Bereich: führt Termine
 * (Kalender) und Erinnerungen (To-Dos) zu EINEM normalisierten
 * TaskOrEvent[]-Strom zusammen. Alle Widgets teilen sich diese eine Quelle.
 *
 * Aktuell liefert der Hook deterministische Platzhalter-Daten aus
 * generateTasksAndEvents() (fester Datensatz, kein Hydration-Mismatch).
 *
 * Selbst erstellte Aufgaben (lib/todo-store.ts, localStorage) werden hier mit
 * dem Platzhalter-Datensatz zusammengeführt — sie erscheinen dadurch überall
 * (Fokus-Widget, Zeitleiste). Die User-Aufgaben laden erst NACH dem Mount
 * (SSR-sicher leer), daher kein Hydration-Mismatch.
 *
 * ANBINDUNG SPÄTER (bewusst als Naht angelegt): Die App kann MCP nicht selbst
 * aufrufen — die iOS-/Google-Kalender-MCP-Verbindung lebt im Claude-Client,
 * nicht im Vercel-Runtime. Der Weg zu echten Kalenderdaten führt daher wie bei
 * den übrigen Widgets über Supabase:
 *   1. Tabelle dashboard.todo_items anlegen (Migration analog social_stats).
 *   2. Agent/Hermes synct Kalender+Erinnerungen per MCP → Supabase.
 *   3. Hier generateTasksAndEvents() gegen einen Fetch auf einen Route Handler
 *      (z. B. /api/todo, serverseitig getSupabase()) tauschen und isMock:false
 *      setzen. Die Widgets unten bleiben unverändert — sie kennen nur
 *      TaskOrEvent aus lib/todo-types.ts.
 */
export function useTasksAndEvents(): UseTasksAndEventsResult {
  const [mock] = useState<TaskOrEvent[]>(() => generateTasksAndEvents());
  const userTasks = useUserTasks();

  return useMemo(() => {
    const items = [...mock, ...userTasks].sort(sortChrono);
    const todayStr = dayKey.format(new Date());
    const today = items.filter((it) => it.at && dayKey.format(new Date(it.at)) === todayStr);
    // isMock bleibt true, solange die Kalender-/Termindaten Platzhalter sind —
    // eigene User-Aufgaben sind echt, ändern aber den Anbindungsstatus nicht.
    return { items, today, isMock: true };
  }, [mock, userTasks]);
}
