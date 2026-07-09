"use client";

import { useId, useState } from "react";

// Monochrom: Richtung über Helligkeit statt Farbe — Anstieg hell (#e5e5e5),
// Rückgang gedämpftes Grau (#8f8f94). Vorzeichen/Pfeil bleiben harte Indikatoren.
const UP_COLOR = "#e5e5e5";
const DOWN_COLOR = "#8f8f94";

/**
 * 24h-Sparkline als SVG mit Verlaufsfläche je Kursrichtung und Hover-Tooltip
 * (Preis + Zeitpunkt) — ohne Chart-Lib. Geteilt von Portfolio- und
 * Preislisten-Widget des Krypto-Bereichs.
 */
export default function Sparkline({
  points,
  up,
  width = 120,
  height = 36,
}: {
  points: number[];
  up: boolean;
  width?: number;
  height?: number;
}) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);
  if (points.length < 2) return null;

  const w = width;
  const h = height;
  const pad = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const color = up ? UP_COLOR : DOWN_COLOR;

  const xy = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const lineLen = xy.reduce(
    (acc, [x, y], i) => (i === 0 ? 0 : acc + Math.hypot(x - xy[i - 1][0], y - xy[i - 1][1])),
    0
  );
  const area =
    `M ${xy[0][0].toFixed(1)},${h - 1} ` +
    xy.map(([x, y]) => `L ${x.toFixed(1)},${y.toFixed(1)}`).join(" ") +
    ` L ${xy[xy.length - 1][0].toFixed(1)},${h - 1} Z`;

  const hoursAgo = hover === null ? 0 : points.length - 1 - hover;
  const tooltipPrice =
    hover === null
      ? ""
      : `$ ${new Intl.NumberFormat("de-AT", {
          maximumFractionDigits: points[hover] >= 1000 ? 0 : 2,
        }).format(points[hover])}`;
  const tooltipTime = hoursAgo === 0 ? "jetzt" : `vor ${hoursAgo} Std.`;
  const tooltipLeft = hover === null ? 0 : Math.max(12, Math.min(88, (xy[hover][0] / w) * 100));

  return (
    <div className="relative shrink-0">
      {hover !== null && (
        <div
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2"
          style={{ left: `${tooltipLeft}%` }}
          aria-hidden="true"
        >
          <div className="animate-scale-in origin-bottom whitespace-nowrap rounded-md border border-line bg-raised px-2 py-0.5 font-mono text-[10px] tabular-nums text-foreground motion-reduce:animate-none">
            {tooltipPrice} · {tooltipTime}
          </div>
        </div>
      )}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        aria-hidden="true"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * w;
          const index = Math.round(((x - pad) / (w - pad * 2)) * (points.length - 1));
          setHover(Math.max(0, Math.min(points.length - 1, index)));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
        <polyline
          points={line}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-draw"
          style={{ ["--draw-len" as string]: lineLen } as React.CSSProperties}
        />
        {hover !== null && (
          <circle cx={xy[hover][0]} cy={xy[hover][1]} r="3.5" fill={color} stroke="#121214" strokeWidth="2" />
        )}
      </svg>
    </div>
  );
}
