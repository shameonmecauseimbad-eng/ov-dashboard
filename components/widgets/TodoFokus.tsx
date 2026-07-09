"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { PROJECT_TAG_LABEL, PRIORITY_STYLE, type Priority } from "@/lib/todo-types";
import { useTasksAndEvents } from "@/lib/useTasksAndEvents";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const fmtTime = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });

/**
 * Overview-Widget: die wichtigsten offenen Punkte von heute + Fortschritt.
 * Kompakte Variante der /todo-Seite, gespeist aus demselben zentralen Hook.
 */
export default function TodoFokus() {
  const { today, isMock } = useTasksAndEvents();

  const { top, done, total, openCount } = useMemo(() => {
    const open = today.filter((it) => !it.done);
    const sorted = [...open].sort((a, b) => {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return p !== 0 ? p : (a.at ?? "").localeCompare(b.at ?? "");
    });
    return {
      top: sorted.slice(0, 4),
      done: today.filter((it) => it.done).length,
      total: today.length,
      openCount: open.length,
    };
  }, [today]);

  return (
    <WidgetCard title="Fokus heute" badge={isMock ? "Platzhalter" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      {top.length === 0 ? (
        <p className="text-sm text-muted">Nichts Offenes mehr für heute.</p>
      ) : (
        <ul className="space-y-2.5">
          {top.map((it) => {
            const s = PRIORITY_STYLE[it.priority];
            return (
              <li key={it.id} className="flex items-baseline gap-3 text-sm">
                <span className="w-14 shrink-0 font-mono text-xs tabular-nums text-muted">
                  {it.allDay || !it.at ? "ganzt." : fmtTime.format(new Date(it.at))}
                </span>
                <span className={`min-w-0 flex-1 truncate text-foreground ${s.weight} ${s.opacity}`}>{it.title}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted">
                  {PROJECT_TAG_LABEL[it.projectTag]}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        {done}/{total} erledigt · {openCount} offen heute · Quelle:{" "}
        {isMock ? "Platzhalter-Daten" : <span className="font-mono">dashboard.todo_items</span>}
      </p>
    </WidgetCard>
  );
}
