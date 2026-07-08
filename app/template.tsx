"use client";

/**
 * P3 — Seiten-Choreografie: template.tsx re-mountet bei jedem Routenwechsel,
 * daher entfaltet sich der neue Seiteninhalt aus der Mitte (scale + fade,
 * transform-origin center). Die Exit-Hälfte (Kollaps zur Mitte) bräuchte
 * Framer Motion AnimatePresence und bleibt bewusst weg (0-Dependencies-Prinzip).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter motion-reduce:animate-none">{children}</div>;
}
