"use client";

import { useSyncExternalStore } from "react";

/**
 * Winziger Toast-Store (localStorage-frei, nur In-Memory). Dient als sichtbares
 * Feedback für Aktionen (verschoben, erledigt) UND als Fehlerkanal: sobald der
 * spätere MCP-/Supabase-Sync an der dokumentierten Naht andockt, melden
 * fehlgeschlagene Schreibzugriffe (update_event/delete_event) hier eine
 * Fehlermeldung — ohne dass die Aufrufer sich um die Darstellung kümmern.
 */

export type ToastTone = "info" | "error";
export type Toast = { id: number; message: string; tone: ToastTone };

let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function pushToast(message: string, tone: ToastTone = "info"): void {
  const id = ++seq;
  toasts = [...toasts, { id, message, tone }];
  emit();
  window.setTimeout(() => dismissToast(id), tone === "error" ? 5000 : 2600);
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const EMPTY: Toast[] = [];

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    subscribe,
    () => toasts,
    () => EMPTY
  );
}

/**
 * Führt eine (später ggf. asynchrone MCP-)Schreibaktion aus und meldet Erfolg
 * bzw. Fehler als Toast. Aktuell laufen die Mutationen synchron gegen den
 * lokalen Store; wirft eine davon, wird der Fehler sichtbar statt verschluckt.
 */
export async function withSync<T>(
  action: () => T | Promise<T>,
  okMessage?: string,
  errMessage = "Sync fehlgeschlagen — Änderung nicht gespeichert."
): Promise<T | undefined> {
  try {
    const result = await action();
    if (okMessage) pushToast(okMessage, "info");
    return result;
  } catch {
    pushToast(errMessage, "error");
    return undefined;
  }
}
