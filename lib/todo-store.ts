"use client";

import { useSyncExternalStore } from "react";
import type { ItemType, Priority, ProjectTag, Recurrence, Subtask, TaskOrEvent } from "@/lib/todo-types";

/**
 * Client-Store für selbst erstellte Aufgaben (localStorage). Bewusst getrennt
 * vom Platzhalter-Datensatz: das Frontend bleibt gegenüber Supabase read-only,
 * eigene To-Dos leben lokal im Browser (privat, sofort nutzbar, pro Gerät).
 *
 * Umstellung auf geräteübergreifende Speicherung später: die vier Funktionen
 * (load/persist/add/toggle/remove) gegen Aufrufe eines Route Handlers tauschen,
 * der nach dashboard.todo_items schreibt — der useSyncExternalStore-Vertrag
 * nach außen (useUserTasks) bleibt gleich.
 */

const KEY = "ov-todo-user-tasks-v1";

// Stabile Referenzen: getSnapshot MUSS bei Unverändertheit dieselbe Referenz
// liefern, sonst rendert React endlos. cache wird nur bei echter Mutation neu
// zugewiesen. EMPTY dient als Server-Snapshot (SSR kennt kein localStorage).
const EMPTY: TaskOrEvent[] = [];
let cache: TaskOrEvent[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as TaskOrEvent[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  loaded = true;
}

function persist(): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* Speicher voll / privater Modus — ignorieren, Daten bleiben in-memory. */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  // Erst-Laden erfolgt beim ersten Abonnenten (nach Mount) — nicht während des
  // Server-/Erstrenders, damit Server- und Client-HTML (beide leer) matchen.
  if (!loaded) load();
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export type NewTaskInput = {
  title: string;
  type: ItemType;
  priority: Priority;
  projectTag: ProjectTag;
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM oder null (= ganztägig / ohne Uhrzeit). */
  time: string | null;
  recurrence?: Recurrence | null;
  estimatedMinutes?: number | null;
  subtasks?: Subtask[];
};

function newId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function addUserTask(input: NewTaskInput): void {
  if (!loaded) load();
  const hasTime = Boolean(input.time);
  const at = new Date(`${input.date}T${input.time ?? "00:00"}`).toISOString();
  const task: TaskOrEvent = {
    id: newId(),
    title: input.title.trim(),
    type: input.type,
    at,
    allDay: !hasTime,
    projectTag: input.projectTag,
    priority: input.priority,
    done: false,
    source: "user",
    recurrence: input.recurrence ?? null,
    estimatedMinutes: input.estimatedMinutes ?? null,
    subtasks: input.subtasks ?? [],
  };
  cache = [task, ...cache];
  persist();
  emit();
}

/** Verschiebt einen ISO-Zeitstempel um interval Tage/Wochen (Uhrzeit bleibt). */
function advance(iso: string, rec: Recurrence): string {
  const d = new Date(iso);
  const days = rec.freq === "weekly" ? 7 * rec.interval : rec.interval;
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function toggleUserTask(id: string): void {
  if (!loaded) load();
  const target = cache.find((t) => t.id === id);
  const willBeDone = target ? !target.done : false;

  cache = cache.map((t) => (t.id === id ? { ...t, done: !t.done } : t));

  // Wiederkehrende Aufgabe erledigt → nächste Instanz einplanen (eigene
  // Wiederholungslogik; MCP-Spiegelung der iOS-Regel folgt an der bekannten Naht).
  if (target && willBeDone && target.recurrence && target.at) {
    const next: TaskOrEvent = {
      ...target,
      id: newId(),
      at: advance(target.at, target.recurrence),
      done: false,
      // Subtasks für die neue Instanz zurücksetzen.
      subtasks: (target.subtasks ?? []).map((s) => ({ ...s, done: false })),
    };
    cache = [next, ...cache];
  }
  persist();
  emit();
}

/** Generisches Patch für eine eigene Aufgabe (Snooze, Priorität, Dauer, Subtasks …). */
export function updateUserTask(id: string, patch: Partial<TaskOrEvent>): void {
  if (!loaded) load();
  cache = cache.map((t) => (t.id === id ? { ...t, ...patch } : t));
  persist();
  emit();
}

/** Aufgabe auf ein neues Datum/Uhrzeit verschieben (YYYY-MM-DD, HH:MM|null). */
export function rescheduleUserTask(id: string, date: string, time: string | null): void {
  const at = new Date(`${date}T${time ?? "00:00"}`).toISOString();
  updateUserTask(id, { at, allDay: !time });
}

// ─── Subtasks ─────────────────────────────────────────────────────────────────

export function addSubtask(taskId: string, title: string): void {
  if (!loaded) load();
  const clean = title.trim();
  if (!clean) return;
  cache = cache.map((t) =>
    t.id === taskId
      ? { ...t, subtasks: [...(t.subtasks ?? []), { id: newId(), title: clean, done: false }] }
      : t
  );
  persist();
  emit();
}

export function toggleSubtask(taskId: string, subId: string): void {
  if (!loaded) load();
  cache = cache.map((t) =>
    t.id === taskId
      ? { ...t, subtasks: (t.subtasks ?? []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s)) }
      : t
  );
  persist();
  emit();
}

export function removeSubtask(taskId: string, subId: string): void {
  if (!loaded) load();
  cache = cache.map((t) =>
    t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subId) } : t
  );
  persist();
  emit();
}

// ─── Bulk-Aktionen (Feature 10) ────────────────────────────────────────────────

export function bulkComplete(ids: string[]): void {
  for (const id of ids) {
    const t = cache.find((x) => x.id === id);
    if (t && !t.done) toggleUserTask(id); // nutzt Recurrence-Logik
  }
}

export function bulkUpdate(ids: string[], patch: Partial<TaskOrEvent>): void {
  if (!loaded) load();
  const set = new Set(ids);
  cache = cache.map((t) => (set.has(t.id) ? { ...t, ...patch } : t));
  persist();
  emit();
}

export function bulkReschedule(ids: string[], date: string, time: string | null): void {
  const at = new Date(`${date}T${time ?? "00:00"}`).toISOString();
  bulkUpdate(ids, { at, allDay: !time });
}

export function removeUserTask(id: string): void {
  if (!loaded) load();
  cache = cache.filter((t) => t.id !== id);
  persist();
  emit();
}

/** Reaktiver Zugriff auf die selbst erstellten Aufgaben (SSR-sicher: leer). */
export function useUserTasks(): TaskOrEvent[] {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => EMPTY
  );
}
