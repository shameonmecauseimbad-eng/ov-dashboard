"use client";

import { useEffect, useState } from "react";

/**
 * P4 — Tag/Nacht-Lichtsystem (reines Design, kein echter Lightmode):
 * ein kaum sichtbarer weißer Radial-Gradient (5 %), dessen horizontale
 * Position an die echte Tageszeit gekoppelt ist (0–24 h → 0–100 %) und
 * einmal pro Tag quer über den Bildschirm wandert. Monochrom, ambient.
 */
export default function LightGradient() {
  const [pct, setPct] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setPct((minutes / 1440) * 100);
    };
    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
  }, []);

  if (pct === null) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      style={{
        background: `radial-gradient(60vw 65vh at ${pct}% -5%, rgba(255,255,255,0.05), rgba(255,255,255,0) 60%)`,
        transition: "background 60s linear",
      }}
    />
  );
}
