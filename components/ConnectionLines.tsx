"use client";

import { useEffect, useState } from "react";

/**
 * P7 — Orthogonales „U-Bahn-Plan"-Verbindungssystem zwischen thematisch
 * verwandten Widgets. Statt einer geraden Linie quer durch die Karten wird die
 * Verbindung rechtwinklig durch die ZWISCHENRÄUME (Rinnen) des Grids geführt:
 * sie verlässt das Start-Widget an einer Kante, läuft durch den Kanal zwischen
 * den Karten und betritt das Ziel-Widget von außen. Dadurch kreuzt sie nie eine
 * Karte und — wichtig — nie den Sticky-Header (der Kanal liegt immer MITTIG
 * zwischen den beiden Widgets, also stets unterhalb des Headers).
 *
 * Positionierung: Das SVG liegt als `fixed inset-0` mit z-index 0 HINTER den
 * Karten (die auf z-10 sitzen, siehe Widget.tsx) im selben Stacking-Kontext
 * (`relative z-10`-Wrapper in layout.tsx). Sichtbar sind die Linien deshalb nur
 * in den Zwischenräumen des Grids — genau der gewünschte Metro-Effekt.
 *
 * ─── NEUE VERBINDUNG HINZUFÜGEN ─────────────────────────────────────────────
 *   Einfach einen Eintrag in CONNECTIONS ergänzen:
 *     { from: "krypto", to: "github", fromSide: "left", toSide: "left" }
 *   • from / to       = dataId-Marker der Widgets (siehe <Widget dataId="…">)
 *   • fromSide/toSide = Kante, an der die Linie das Widget verlässt bzw. betritt
 *                       ("top" | "right" | "bottom" | "left"). Faustregel: die
 *                       Kante wählen, die dem Partner-Widget zugewandt ist
 *                       (nebeneinander → right/left, übereinander → bottom/top).
 *   Die Pfad-Geometrie wird komplett automatisch aus den live gemessenen
 *   Positionen berechnet — es sind keine festen Koordinaten nötig.
 * ────────────────────────────────────────────────────────────────────────────
 */

type Side = "top" | "right" | "bottom" | "left";

type Connection = {
  /** dataId des Start-Widgets. */
  from: string;
  /** dataId des Ziel-Widgets. */
  to: string;
  /** Kante, an der die Linie das Start-Widget verlässt. */
  fromSide: Side;
  /** Kante, an der die Linie das Ziel-Widget betritt. */
  toSide: Side;
};

/** Radius der abgerundeten Knicke (Q-Kurven) in px. */
const CORNER_RADIUS = 10;

/**
 * Registrierte Verbindungen. Reihenfolge egal; jede wird unabhängig gerendert.
 */
const CONNECTIONS: Connection[] = [
  // Morgen-Briefing (oben links) ↔ Krypto-Kurse (rechte Spalte): verlässt die
  // Briefing-Karte RECHTS, läuft durch die mittlere Spalten-Rinne hinab und
  // tritt LINKS in die Krypto-Karte ein — eine saubere, durchgehend sichtbare
  // Verbindung im Zwischenraum, ganz ohne Header-Berührung.
  { from: "briefing", to: "krypto", fromSide: "right", toSide: "left" },
];

// ─── Geometrie-Helfer ───────────────────────────────────────────────────────

type Point = [number, number];

type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** Mittelpunkt X. */
  cx: number;
  /** Mittelpunkt Y. */
  cy: number;
};

function toBox(r: DOMRect): Box {
  return {
    left: r.left,
    right: r.right,
    top: r.top,
    bottom: r.bottom,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

/** Austrittspunkt auf der gewählten Kante des Widgets (Kantenmitte). */
function edgePoint(b: Box, side: Side): Point {
  switch (side) {
    case "top":
      return [b.cx, b.top];
    case "bottom":
      return [b.cx, b.bottom];
    case "left":
      return [b.left, b.cy];
    case "right":
      return [b.right, b.cy];
  }
}

const isHorizontalExit = (s: Side) => s === "left" || s === "right";

/**
 * Ordnet die Stützpunkte des Pfades. Der Verbindungskanal liegt MITTIG zwischen
 * den beiden zugewandten Kanten:
 *   • Seitlicher Austritt (left/right) → vertikaler Kanal bei der Mittel-X.
 *   • Oben/unten-Austritt (top/bottom) → horizontaler Kanal bei der Mittel-Y.
 * Ergebnis ist ein rechtwinkliger Zwei-Knick-Verbinder (Z-Form) durch die
 * Grid-Rinne — nie über einer Karte, nie hinter dem Header.
 */
function routePoints(a: Box, b: Box, c: Connection): Point[] {
  const aEdge = edgePoint(a, c.fromSide);
  const bEdge = edgePoint(b, c.toSide);

  if (isHorizontalExit(c.fromSide)) {
    const channelX = (aEdge[0] + bEdge[0]) / 2;
    return [aEdge, [channelX, aEdge[1]], [channelX, bEdge[1]], bEdge];
  }
  const channelY = (aEdge[1] + bEdge[1]) / 2;
  return [aEdge, [aEdge[0], channelY], [bEdge[0], channelY], bEdge];
}

const len = (p: Point, q: Point) => Math.hypot(q[0] - p[0], q[1] - p[1]);

/** Einheitsvektor von p nach q (bei identischen Punkten [0,0]). */
function unit(p: Point, q: Point): Point {
  const d = len(p, q);
  return d === 0 ? [0, 0] : [(q[0] - p[0]) / d, (q[1] - p[1]) / d];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Baut aus einer Punktfolge einen orthogonalen SVG-Pfad mit an den Knicken
 * abgerundeten Ecken (quadratische Q-Kurven statt harter 90°-Winkel). Der
 * Radius wird pro Ecke auf die halbe kürzere Nachbarstrecke begrenzt, damit
 * benachbarte Kurven nicht überlappen (wichtig in engen Rinnen).
 */
function roundedOrthPath(points: Point[], radius: number): string {
  // Aufeinanderfolgende Duplikate entfernen (z. B. wenn Kanäle fluchten).
  const p: Point[] = points.filter(
    (pt, i) => i === 0 || pt[0] !== points[i - 1][0] || pt[1] !== points[i - 1][1]
  );
  if (p.length < 2) return "";

  let d = `M ${r1(p[0][0])} ${r1(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const prev = p[i - 1];
    const cur = p[i];
    const next = p[i + 1];
    const inDir = unit(prev, cur);
    const outDir = unit(cur, next);
    const r = Math.min(radius, len(prev, cur) / 2, len(cur, next) / 2);
    const before: Point = [cur[0] - inDir[0] * r, cur[1] - inDir[1] * r];
    const after: Point = [cur[0] + outDir[0] * r, cur[1] + outDir[1] * r];
    d += ` L ${r1(before[0])} ${r1(before[1])} Q ${r1(cur[0])} ${r1(cur[1])} ${r1(after[0])} ${r1(after[1])}`;
  }
  const last = p[p.length - 1];
  d += ` L ${r1(last[0])} ${r1(last[1])}`;
  return d;
}

// ─── Komponente ─────────────────────────────────────────────────────────────

type Rendered = { d: string; nodes: Point[] };

export default function ConnectionLines() {
  const [rendered, setRendered] = useState<Rendered[]>([]);

  useEffect(() => {
    const measure = () => {
      const next: Rendered[] = [];
      for (const c of CONNECTIONS) {
        const aEl = document.querySelector(`[data-widget="${c.from}"]`);
        const bEl = document.querySelector(`[data-widget="${c.to}"]`);
        if (!aEl || !bEl) continue;
        const a = toBox(aEl.getBoundingClientRect());
        const b = toBox(bEl.getBoundingClientRect());
        const pts = routePoints(a, b, c);
        next.push({ d: roundedOrthPath(pts, CORNER_RADIUS), nodes: [pts[0], pts[pts.length - 1]] });
      }
      setRendered(next);
    };

    // Neuberechnung rAF-gedrosselt bei Layout-Änderungen. Scroll ist nötig, weil
    // das SVG in Viewport-Koordinaten arbeitet und die Karten mitwandern.
    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    const timer = window.setInterval(schedule, 1000);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      window.clearInterval(timer);
    };
  }, []);

  if (rendered.length === 0) return null;

  return (
    <svg className="pointer-events-none fixed inset-0 z-0 h-full w-full" aria-hidden="true">
      {rendered.map((r, i) => (
        <g key={i}>
          <path
            d={r.d}
            fill="none"
            stroke="rgb(255 255 255)"
            strokeOpacity={0.18}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 11"
            className="connection-flow motion-reduce:animate-none"
          />
          {/* Kleine „Stationsknoten" an den Ein-/Austrittspunkten. */}
          {r.nodes.map((n, j) => (
            <circle key={j} cx={r1(n[0])} cy={r1(n[1])} r={2.5} fill="rgb(255 255 255)" fillOpacity={0.2} />
          ))}
        </g>
      ))}
    </svg>
  );
}
