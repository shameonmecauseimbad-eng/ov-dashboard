"use client";

import { useEffect, useState } from "react";
import YinYang from "@/components/YinYang";

type ProgressRingProps = {
  done: number;
  total: number;
};

const SIZE = 132;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/**
 * Fortschritts-Ring im Yin-Yang-Motiv: der weiße Bogen füllt sich anteilig zu
 * erledigten/offenen Punkten des Tages, im Zentrum das Yin-Yang-Branding.
 * Rein schwarz-weiß — Track gedämpft, Fortschritt hell; animiert über
 * stroke-dashoffset (respektiert prefers-reduced-motion via globaler Regel).
 */
export default function ProgressRing({ done, total }: ProgressRingProps) {
  const pct = total > 0 ? done / total : 0;
  // Von 0 auf Zielwert animieren: erst nach Mount den echten Offset setzen.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setProgress(pct));
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#e5e5e5"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <YinYang className="h-11 w-11" />
        </div>
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
          {done}/{total}
        </p>
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted">erledigt heute</p>
      </div>
    </div>
  );
}
