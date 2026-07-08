"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type CountUpProps = {
  value: number;
  prefix?: string;
  suffix?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  durationMs?: number;
};

/**
 * Zählt beim ersten Rendern von 0 zum Zielwert hoch (ease-out, ~800 ms).
 * SSR liefert den Endwert (kein Layout-Sprung, suppressHydrationWarning),
 * spätere Wert-Updates springen direkt ohne erneute Animation.
 * prefers-reduced-motion deaktiviert die Animation komplett.
 */
export default function CountUp({
  value,
  prefix = "",
  suffix = "",
  minFractionDigits = 0,
  maxFractionDigits = 0,
  durationMs = 800,
}: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) {
      // Folge-Updates (z. B. Krypto-Refresh alle 60 s): direkt setzen
      setDisplay(value);
      return;
    }
    mountedRef.current = true;

    if (
      value === 0 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const progress = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    setDisplay(0);
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("de-AT", {
        minimumFractionDigits: minFractionDigits,
        maximumFractionDigits: Math.max(minFractionDigits, maxFractionDigits),
      }),
    [minFractionDigits, maxFractionDigits]
  );

  return (
    <span suppressHydrationWarning data-countup className="tabular-nums">
      {prefix}
      {formatter.format(display)}
      {suffix}
    </span>
  );
}
