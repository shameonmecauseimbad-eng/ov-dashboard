"use client";

import { createContext, useContext, useEffect, useState } from "react";

type FocusContextValue = {
  focused: number | null;
  setFocused: (index: number | null) => void;
  /** true nur innerhalb eines FocusZoomProvider — ohne Provider wäre der
   *  Fokus-Button ein totes UI-Element (No-op-Default), Widget blendet ihn
   *  dann aus. */
  enabled: boolean;
};

const FocusContext = createContext<FocusContextValue>({
  focused: null,
  setFocused: () => {},
  enabled: false,
});

export function useFocusZoom() {
  return useContext(FocusContext);
}

/**
 * P8 — Fokus-Modus (monochrom): ist ein Widget fokussiert, legt sich ein
 * Backdrop mit grayscale + blur über alles Übrige (defokussiert es), während
 * das fokussierte Widget angehoben und leicht vergrößert wird. Esc oder Klick
 * auf den Backdrop verlässt den Modus.
 */
export default function FocusZoomProvider({ children }: { children: React.ReactNode }) {
  const [focused, setFocused] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocused(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <FocusContext.Provider value={{ focused, setFocused, enabled: true }}>
      {focused !== null && (
        <div
          onClick={() => setFocused(null)}
          className="fixed inset-0 z-20 bg-background/40 backdrop-blur-[2px] backdrop-grayscale transition-opacity duration-300"
          aria-hidden="true"
        />
      )}
      {children}
    </FocusContext.Provider>
  );
}
