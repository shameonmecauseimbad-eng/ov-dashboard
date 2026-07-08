"use client";

import { useEffect, useRef, useState } from "react";

type AlertPulseProps = {
  /** Aktueller Wert (z. B. Kurs). */
  value: number;
  /** Schwelle; undefined = passiv (kein Puls). */
  threshold?: number;
  children: React.ReactNode;
  className?: string;
};

/**
 * Pulst einmalig (weißer Ring), wenn `value` den `threshold` von unten nach
 * oben überschreitet — z. B. „BTC über 100 000". Konfigurierbar per Prop,
 * kein Puls beim ersten Rendern, prefers-reduced-motion unterdrückt ihn.
 */
export default function AlertPulse({
  value,
  threshold,
  children,
  className = "",
}: AlertPulseProps) {
  const [pulse, setPulse] = useState(false);
  const prev = useRef(value);
  const mounted = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const before = prev.current;
    prev.current = value;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (threshold === undefined) return;
    // Nur beim Durchbrechen von unten nach oben.
    if (!(before < threshold && value >= threshold)) return;
    // Globalen Alarm auslösen (P10: Viewport-Rand-Puls).
    window.dispatchEvent(new CustomEvent("ov:alert"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPulse(false), 900);
    return () => window.clearTimeout(timer.current);
  }, [value, threshold]);

  return (
    <div className={`rounded-md ${pulse ? "animate-alert-ring" : ""} ${className}`}>
      {children}
    </div>
  );
}
