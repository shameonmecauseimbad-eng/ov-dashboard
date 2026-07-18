"use client";

import { useMemo } from "react";
import { useUserTasks } from "@/lib/todo-store";
import type { TaskOrEvent } from "@/lib/todo-types";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export type UseTasksAndEventsResult = {
  /** Alle Punkte (Termine + To-Dos), chronologisch aufsteigend; undatierte To-Dos ans Ende. */
  items: TaskOrEvent[];
  /** Nur die Punkte von heute (Wiener Kalendertag). */
  today: TaskOrEvent[];
};

function sortChrono(a: TaskOrEvent, b: TaskOrEvent): number {
  if (a.at && b.at) return a.at.localeCompare(b.at);
  if (a.at) return -1; // datierte vor undatierten
  if (b.at) return 1;
  return a.title.localeCompare(b.title, "de");
}

/**
 * Zentraler Datenzugriff für den gesamten /todo-Bereich. Quelle sind
 * ausschließlich die selbst erstellten Aufgaben (lib/todo-store.ts —
 * Supabase dashboard.todo_items via /api/todos, localStorage als Warm-Cache).
 * Die Aufgaben laden erst NACH dem Mount (SSR-sicher leer), daher kein
 * Hydration-Mismatch. Alle Widgets teilen sich diese eine Quelle.
 *
 * KALENDER-ANBINDUNG SPÄTER (bewusst als Naht angelegt): Die App kann MCP
 * nicht selbst aufrufen — die iOS-/Google-Kalender-MCP-Verbindung lebt im
 * Claude-Client, nicht im Vercel-Runtime. Echte Termindaten schreibt der
 * Agent/Hermes per MCP direkt nach dashboard.todo_items (source: "mock" bzw.
 * ein künftiger Kalender-Marker) — sie erscheinen dann automatisch im selben
 * Strom. Die Widgets bleiben unverändert — sie kennen nur TaskOrEvent.
 */
export function useTasksAndEvents(): UseTasksAndEventsResult {
  const userTasks = useUserTasks();

  return useMemo(() => {
    const items = [...userTasks].sort(sortChrono);
    const todayStr = dayKey.format(new Date());
    const today = items.filter((it) => it.at && dayKey.format(new Date(it.at)) === todayStr);
    return { items, today };
  }, [userTasks]);
}
