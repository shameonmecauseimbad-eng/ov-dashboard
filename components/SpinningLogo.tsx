"use client";

import { useEffect, useRef, useState } from "react";
import YinYang from "@/components/YinYang";

/**
 * Header-Logo als „Lebenszeichen" der Daten:
 * - Ruhezustand: dezenter Atem (scale 0.98 ↔ 1.02, 4 s).
 * - Während eines echten Fetches (AutoRefresh via useTransition → Event
 *   "ov:loading"): kontinuierliche Drehung.
 * - Sobald geladen ("ov:loaded"): Stopp + einmaliger Puls (scale 1.06).
 * prefers-reduced-motion deaktiviert jede Bewegung.
 */
export default function SpinningLogo({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const pulseTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onLoading = () => setLoading(true);
    const onLoaded = () => {
      setLoading(false);
      // Einmal-Puls als sanfter Abschluss (Re-Trigger via rAF).
      setPulse(false);
      requestAnimationFrame(() => setPulse(true));
      window.clearTimeout(pulseTimer.current);
      pulseTimer.current = window.setTimeout(() => setPulse(false), 500);
    };

    window.addEventListener("ov:loading", onLoading);
    window.addEventListener("ov:loaded", onLoaded);
    return () => {
      window.removeEventListener("ov:loading", onLoading);
      window.removeEventListener("ov:loaded", onLoaded);
      window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const state = loading
    ? "animate-spin-slow"
    : pulse
      ? "animate-pulse-once"
      : "animate-breathe";

  return (
    <span className={`inline-flex ${state} motion-reduce:animate-none`}>
      <YinYang className={className} />
    </span>
  );
}
