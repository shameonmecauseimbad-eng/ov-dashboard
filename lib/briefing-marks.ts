"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-Store für in der Zeitleiste markierte Tage (localStorage, pro Gerät).
 * Bewusst getrennt von den Briefing-Daten: die bleiben read-only aus Supabase,
 * die Markierung ist eine private Annotation ("dieser Tag ist mir wichtig").
 *
 * Folgt demselben useSyncExternalStore-Vertrag wie lib/todo-store.ts:
 * SSR-sicher (Server-Snapshot leer → kein Hydration-Mismatch), cross-tab über
 * das storage-Event. Umstellung auf geräteübergreifende Speicherung später:
 * load/persist gegen einen Route Handler tauschen, der Vertrag bleibt gleich.
 */

const KEY = "ov-briefing-marked-days-v1";

// Stabile EMPTY-Referenz: getSnapshot muss bei Unverändertheit dieselbe
// Referenz liefern, sonst rendert React endlos. cache wird nur bei echter
// Mutation neu zugewiesen.
const EMPTY: readonly string[] = [];
let cache: readonly string[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    cache = Array.isArray(parsed) ? (parsed.filter((d) => typeof d === "string") as string[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  loaded = true;
}

function persist(): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* Speicher voll / privater Modus — ignorieren, bleibt in-memory. */
  }
}

function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  // Erst-Laden beim ersten Abonnenten (nach Mount) — nicht im Server-/Erstrender,
  // damit Server- und Client-HTML (beide leer) matchen.
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

function getSnapshot(): readonly string[] {
  return cache;
}

function getServerSnapshot(): readonly string[] {
  return EMPTY;
}

/** Reaktive Liste der markierten Tage (YYYY-MM-DD). */
export function useMarkedDays(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Markierung eines Tages umschalten und persistieren. */
export function toggleMarkedDay(datum: string): void {
  if (!loaded) load();
  cache = cache.includes(datum) ? cache.filter((d) => d !== datum) : [...cache, datum];
  persist();
  emit();
}
