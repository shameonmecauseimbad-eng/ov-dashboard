"use client";

import { useSyncExternalStore } from "react";
import { pushToast } from "@/lib/todo-toast";
import type { ItemType, Priority, ProjectTag, Recurrence, Subtask, TaskOrEvent } from "@/lib/todo-types";

/**
 * Client-Store für selbst erstellte Aufgaben. Quelle der Wahrheit ist
 * dashboard.todo_items in Supabase (über den Route Handler /api/todos) —
 * damit überleben To-Dos Browser-Resets und sind geräteübergreifend.
 *
 * localStorage bleibt als Warm-Cache: erster Paint kommt sofort aus dem
 * lokalen Stand, danach ersetzt der Server-Abgleich (refresh) den Cache.
 * Mutationen laufen optimistisch: erst lokal (Cache + localStorage + emit),
 * dann asynchron zum Server; scheitert der Schreibzugriff, meldet ein Toast
 * den Fehler — die Änderung bleibt bis zum nächsten Laden lokal sichtbar,
 * wird aber beim nächsten Server-Abgleich überschrieben.
 *
 * Einmal-Migration pro Gerät: Aufgaben, die nur im localStorage existieren
 * (Alt-Bestand von vor der Supabase-Anbindung), werden beim ersten Abgleich
 * hochgeladen statt verworfen (MIGRATED_KEY verhindert, dass ein Gerät mit
 * veraltetem Cache später gelöschte Aufgaben wiederbelebt).
 */

const KEY = "ov-todo-user-tasks-v1";
const MIGRATED_KEY = "ov-todo-supabase-migrated-v1";

// Stabile Referenzen: getSnapshot MUSS bei Unverändertheit dieselbe Referenz
// liefern, sonst rendert React endlos. cache wird nur bei echter Mutation neu
// zugewiesen. EMPTY dient als Server-Snapshot (SSR kennt kein localStorage).
const EMPTY: TaskOrEvent[] = [];
let cache: TaskOrEvent[] = EMPTY;
let loaded = false;
let refreshStarted = false;
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

// ─── Supabase-Sync (/api/todos) ───────────────────────────────────────────────

async function request(body: { upsert?: TaskOrEvent[]; remove?: string[] }): Promise<void> {
  const res = await fetch("/api/todos", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(detail?.error ?? `HTTP ${res.status}`);
  }
}

/** Feuert einen Schreibzugriff ab; Fehler werden als Toast sichtbar. */
function sync(body: { upsert?: TaskOrEvent[]; remove?: string[] }): void {
  void request(body).catch((e: unknown) => {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    pushToast(`Nicht nach Supabase gespeichert (${msg}) — Änderung nur lokal.`, "error");
  });
}

/** Aufgabe mit dieser id (aktueller Cache-Stand) zum Server schreiben. */
function syncOne(id: string): void {
  const t = cache.find((x) => x.id === id);
  if (t) sync({ upsert: [t] });
}

/** Server-Stand holen; beim ersten Mal pro Gerät lokalen Alt-Bestand hochladen. */
async function refresh(): Promise<void> {
  try {
    const res = await fetch("/api/todos", { cache: "no-store" });
    if (!res.ok) {
      const detail = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(detail?.error ?? `HTTP ${res.status}`);
    }
    const server = (await res.json()) as TaskOrEvent[];

    let merged = server;
    if (!window.localStorage.getItem(MIGRATED_KEY)) {
      const known = new Set(server.map((t) => t.id));
      const missing = cache.filter((t) => !known.has(t.id));
      if (missing.length > 0) {
        merged = [...missing, ...server];
        sync({ upsert: missing });
      }
      try {
        window.localStorage.setItem(MIGRATED_KEY, "1");
      } catch {
        /* ohne Flag läuft die Migration beim nächsten Laden erneut — harmlos. */
      }
    }

    cache = merged;
    persist();
    emit();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unbekannter Fehler";
    pushToast(`To-Dos: Supabase nicht erreichbar (${msg}) — zeige lokalen Stand.`, "error");
  }
}

function subscribe(listener: () => void): () => void {
  // Erst-Laden erfolgt beim ersten Abonnenten (nach Mount) — nicht während des
  // Server-/Erstrenders, damit Server- und Client-HTML (beide leer) matchen.
  if (!loaded) load();
  if (!refreshStarted) {
    refreshStarted = true;
    void refresh();
  }
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
  sync({ upsert: [task] });
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
  if (!target) return;
  const willBeDone = !target.done;

  cache = cache.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  const changed: TaskOrEvent[] = [{ ...target, done: willBeDone }];

  // Wiederkehrende Aufgabe erledigt → nächste Instanz einplanen (eigene
  // Wiederholungslogik; MCP-Spiegelung der iOS-Regel folgt an der bekannten Naht).
  if (willBeDone && target.recurrence && target.at) {
    const next: TaskOrEvent = {
      ...target,
      id: newId(),
      at: advance(target.at, target.recurrence),
      done: false,
      // Subtasks für die neue Instanz zurücksetzen.
      subtasks: (target.subtasks ?? []).map((s) => ({ ...s, done: false })),
    };
    cache = [next, ...cache];
    changed.push(next);
  }
  persist();
  emit();
  sync({ upsert: changed });
}

/** Generisches Patch für eine eigene Aufgabe (Snooze, Priorität, Dauer, Subtasks …). */
export function updateUserTask(id: string, patch: Partial<TaskOrEvent>): void {
  if (!loaded) load();
  cache = cache.map((t) => (t.id === id ? { ...t, ...patch } : t));
  persist();
  emit();
  syncOne(id);
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
  syncOne(taskId);
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
  syncOne(taskId);
}

export function removeSubtask(taskId: string, subId: string): void {
  if (!loaded) load();
  cache = cache.map((t) =>
    t.id === taskId ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== subId) } : t
  );
  persist();
  emit();
  syncOne(taskId);
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
  sync({ upsert: cache.filter((t) => set.has(t.id)) });
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
  sync({ remove: [id] });
}

/** Reaktiver Zugriff auf die selbst erstellten Aufgaben (SSR-sicher: leer). */
export function useUserTasks(): TaskOrEvent[] {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => EMPTY
  );
}
