"use client";

import { useEffect, useState } from "react";

/**
 * P10 — System-Status-Choreografie (monochrom): bei einem kritischen Event
 * ("ov:alert", z. B. Krypto-Schwelle) pulsiert für ~2,6 s ein weißer Rand um
 * den Viewport. Das Dashboard ist ohnehin Graustufen — daher trägt allein der
 * pulsierende Rand den Alarm. prefers-reduced-motion unterdrückt ihn.
 */
export default function AlertOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const onAlert = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      setActive(false);
      requestAnimationFrame(() => setActive(true));
      window.setTimeout(() => setActive(false), 2600);
    };
    window.addEventListener("ov:alert", onAlert);
    return () => window.removeEventListener("ov:alert", onAlert);
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] animate-alert-frame"
      aria-hidden="true"
    />
  );
}
