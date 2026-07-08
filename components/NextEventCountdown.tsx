"use client";

import { useEffect, useState } from "react";

type NextEventCountdownProps = {
  /** ISO-Startzeit des nächsten Termins. */
  startIso: string;
  title: string;
};

/**
 * Live-Countdown zum nächsten Termin (aktualisiert alle 30 s). Rendert nichts,
 * solange der Termin in der Vergangenheit liegt oder vor dem Mount (kein
 * Hydration-Mismatch, da die Zeit erst clientseitig gesetzt wird).
 */
export default function NextEventCountdown({ startIso, title }: NextEventCountdownProps) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  if (now === null) return null;
  const diff = new Date(startIso).getTime() - now;
  if (diff <= 0) return null;

  const totalMin = Math.floor(diff / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const label =
    days > 0 ? `${days} T ${hours} Std` : hours > 0 ? `${hours} Std ${mins} Min` : `${mins} Min`;

  return (
    <p className="mb-4 flex items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-2 text-xs">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent animate-pulse-soft motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="shrink-0 text-muted">Nächster Termin in</span>
      <span className="shrink-0 font-mono font-semibold tabular-nums text-foreground">{label}</span>
      <span className="min-w-0 truncate text-muted">· {title}</span>
    </p>
  );
}
