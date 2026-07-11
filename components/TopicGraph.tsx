"use client";

import { useMemo, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/briefing-analysis";

type TopicGraphProps = { nodes: GraphNode[]; edges: GraphEdge[] };

const W = 400;
const H = 320;
const CX = W / 2;
const CY = H / 2;
const R = 104;

type Placed = GraphNode & { x: number; y: number; radius: number };

/**
 * Radiales Themen-Netz: Knoten = Thema, Kante = gemeinsame Entitäten am
 * aktuellsten Stand. Monochrom, hover hebt die Verbindungen eines Themas hervor
 * und blendet die shared-Begriffe unter dem Graphen ein. Reines SVG, keine
 * Chart-Lib — Positionen deterministisch auf einem Kreis.
 */
export default function TopicGraph({ nodes, edges }: TopicGraphProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const placed = useMemo<Placed[]>(() => {
    const n = nodes.length;
    return nodes.map((node, i) => {
      if (n === 1) return { ...node, x: CX, y: CY, radius: 18 };
      const angle = (-Math.PI / 2) + (i / n) * Math.PI * 2;
      return {
        ...node,
        x: CX + R * Math.cos(angle),
        y: CY + R * Math.sin(angle),
        radius: 14 + Math.min(6, node.entities.length),
      };
    });
  }, [nodes]);

  const posByThema = useMemo(() => {
    const m = new Map<string, Placed>();
    for (const p of placed) m.set(p.thema, p);
    return m;
  }, [placed]);

  // Nachbarn je Thema (für Hover-Dimming).
  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of edges) {
      if (!m.has(e.a)) m.set(e.a, new Set());
      if (!m.has(e.b)) m.set(e.b, new Set());
      m.get(e.a)!.add(e.b);
      m.get(e.b)!.add(e.a);
    }
    return m;
  }, [edges]);

  const hoveredEdges = hovered ? edges.filter((e) => e.a === hovered || e.b === hovered) : [];

  function nodeDimmed(thema: string): boolean {
    if (!hovered) return false;
    if (thema === hovered) return false;
    return !(neighbors.get(hovered)?.has(thema) ?? false);
  }

  function edgeActive(e: GraphEdge): boolean {
    return hovered !== null && (e.a === hovered || e.b === hovered);
  }

  return (
    <div className="mx-auto max-w-[460px]">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block w-full"
        role="img"
        aria-label="Themen-Netz: Verbindungen über gemeinsame Begriffe"
      >
        {/* Kanten zuerst (hinter den Knoten) */}
        {edges.map((e, i) => {
          const pa = posByThema.get(e.a);
          const pb = posByThema.get(e.b);
          if (!pa || !pb) return null;
          const active = edgeActive(e);
          const dim = hovered !== null && !active;
          return (
            <line
              key={i}
              x1={pa.x}
              y1={pa.y}
              x2={pb.x}
              y2={pb.y}
              stroke="#ffffff"
              strokeWidth={active ? 2 : 1}
              strokeOpacity={dim ? 0.06 : active ? 0.5 : 0.16}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Knoten */}
        {placed.map((p) => {
          const dim = nodeDimmed(p.thema);
          const isHover = hovered === p.thema;
          return (
            <g
              key={p.thema}
              className="cursor-pointer transition-opacity duration-200"
              style={{ opacity: dim ? 0.3 : 1 }}
              onMouseEnter={() => setHovered(p.thema)}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r={p.radius}
                fill="#121214"
                stroke="#e5e5e5"
                strokeWidth={isHover ? 2 : 1.25}
                className="transition-all duration-200"
                style={isHover ? { filter: "drop-shadow(0 0 8px rgba(255,255,255,0.35))" } : undefined}
              />
              <text
                x={p.x}
                y={p.y + p.radius + 14}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 13, fontWeight: isHover ? 600 : 400 }}
              >
                {p.thema}
              </text>
              {p.entities.length > 0 && (
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  className="fill-muted"
                  style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}
                >
                  {p.entities.length}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Kontext unter dem Graphen */}
      <div className="mt-2 min-h-[2.5rem] border-t border-line pt-3 text-xs text-muted">
        {hovered && hoveredEdges.length > 0 ? (
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {hoveredEdges.map((e, i) => {
              const other = e.a === hovered ? e.b : e.a;
              return (
                <li key={i}>
                  <span className="text-foreground">{other}</span>
                  {" · "}
                  {e.shared.join(", ")}
                </li>
              );
            })}
          </ul>
        ) : hovered ? (
          <span>Keine gemeinsamen Begriffe mit anderen Themen.</span>
        ) : edges.length > 0 ? (
          <span>Über einen Knoten fahren, um gemeinsame Begriffe zu sehen. Zahl im Knoten = erkannte Begriffe.</span>
        ) : (
          <span>Noch keine gemeinsamen Begriffe zwischen den Themen erkannt — das Netz füllt sich mit echten Inhalten.</span>
        )}
      </div>
    </div>
  );
}
