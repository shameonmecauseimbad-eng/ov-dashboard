"use client";

import { useSyncExternalStore } from "react";
import type { Holding } from "@/lib/crypto-types";

/**
 * Client-Stores (localStorage) für Portfolio-Holdings und Preisalarm-Schwellen.
 * Wie beim To-Do-Bereich: das Frontend bleibt gegenüber Supabase read-only,
 * eigene Eingaben leben lokal im Browser (privat, sofort nutzbar, pro Gerät).
 *
 * Umstellung auf geräteübergreifende Speicherung später: load/persist gegen
 * einen Route Handler tauschen, der nach dashboard.crypto_holdings schreibt —
 * der useSyncExternalStore-Vertrag nach außen (useHoldings/useAlerts) bleibt.
 */

// ─── Holdings ────────────────────────────────────────────────────────────────
const KEY_H = "ov-crypto-holdings-v1";
const EMPTY_H: Holding[] = [];
let cacheH: Holding[] = EMPTY_H;
let loadedH = false;
const listenersH = new Set<() => void>();

function loadH(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY_H);
    cacheH = raw ? (JSON.parse(raw) as Holding[]) : EMPTY_H;
  } catch {
    cacheH = EMPTY_H;
  }
  loadedH = true;
}

function persistH(): void {
  try {
    window.localStorage.setItem(KEY_H, JSON.stringify(cacheH));
  } catch {
    /* ignorieren */
  }
}

function subscribeH(listener: () => void): () => void {
  if (!loadedH) loadH();
  listenersH.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_H) {
      loadH();
      listenersH.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listenersH.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Position hinzufügen. Existiert der Coin schon, wird die Menge aufaddiert. */
export function addHolding(coin_id: string, amount: number): void {
  if (!loadedH) loadH();
  const existing = cacheH.find((h) => h.coin_id === coin_id);
  cacheH = existing
    ? cacheH.map((h) => (h.coin_id === coin_id ? { ...h, amount: h.amount + amount } : h))
    : [...cacheH, { coin_id, amount, added_at: new Date().toISOString() }];
  persistH();
  listenersH.forEach((l) => l());
}

export function removeHolding(coin_id: string): void {
  if (!loadedH) loadH();
  cacheH = cacheH.filter((h) => h.coin_id !== coin_id);
  persistH();
  listenersH.forEach((l) => l());
}

export function useHoldings(): Holding[] {
  return useSyncExternalStore(
    subscribeH,
    () => cacheH,
    () => EMPTY_H
  );
}

// ─── Preisalarm-Schwellen ────────────────────────────────────────────────────
const KEY_A = "ov-crypto-alerts-v1";
const EMPTY_A: Record<string, number> = {};
let cacheA: Record<string, number> = EMPTY_A;
let loadedA = false;
const listenersA = new Set<() => void>();

function loadA(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(KEY_A);
    cacheA = raw ? (JSON.parse(raw) as Record<string, number>) : EMPTY_A;
  } catch {
    cacheA = EMPTY_A;
  }
  loadedA = true;
}

function persistA(): void {
  try {
    window.localStorage.setItem(KEY_A, JSON.stringify(cacheA));
  } catch {
    /* ignorieren */
  }
}

function subscribeA(listener: () => void): () => void {
  if (!loadedA) loadA();
  listenersA.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY_A) {
      loadA();
      listenersA.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listenersA.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setAlert(coin_id: string, threshold: number): void {
  if (!loadedA) loadA();
  cacheA = { ...cacheA, [coin_id]: threshold };
  persistA();
  listenersA.forEach((l) => l());
}

export function removeAlert(coin_id: string): void {
  if (!loadedA) loadA();
  const next = { ...cacheA };
  delete next[coin_id];
  cacheA = next;
  persistA();
  listenersA.forEach((l) => l());
}

export function useAlerts(): Record<string, number> {
  return useSyncExternalStore(
    subscribeA,
    () => cacheA,
    () => EMPTY_A
  );
}
