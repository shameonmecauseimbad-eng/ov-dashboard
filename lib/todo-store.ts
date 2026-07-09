"use client";

import { useSyncExternalStore } from "react";
import type { ItemType, Priority, ProjectTag, TaskOrEvent } from "@/lib/todo-types";

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
};

export function addUserTask(input: NewTaskInput): void {
  if (!loaded) load();
  const hasTime = Boolean(input.time);
  const at = new Date(`${input.date}T${input.time ?? "00:00"}`).toISOString();
  const task: TaskOrEvent = {
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: input.title.trim(),
    type: input.type,
    at,
    allDay: !hasTime,
    projectTag: input.projectTag,
    priority: input.priority,
    done: false,
    source: "user",
  };
  cache = [task, ...cache];
  persist();
  emit();
}

export function toggleUserTask(id: string): void {
  if (!loaded) load();
  cache = cache.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  persist();
  emit();
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
