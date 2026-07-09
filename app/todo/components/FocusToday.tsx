"use client";

import { useMemo, useState } from "react";
import WidgetCard from "@/components/WidgetCard";
import ProgressRing from "@/app/todo/components/ProgressRing";
import { PROJECT_TAG_LABEL, PRIORITY_STYLE, type Priority, type TaskOrEvent } from "@/lib/todo-types";
import { useTasksAndEvents } from "@/lib/useTasksAndEvents";

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
const FOCUS_COUNT = 4;

const fmtTime = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });

function timeLabel(it: TaskOrEvent): string {
  if (!it.at || it.allDay) return "ganztägig";
  return fmtTime.format(new Date(it.at));
}

/**
 * Fokus-heute-Widget: die 3–5 wichtigsten OFFENEN Punkte des Tages groß oben,
 * der Rest standardmäßig eingeklappt. Rechts der Yin-Yang-Fortschrittsring
 * (erledigt/gesamt heute). Desktop nebeneinander, Mobile gestapelt.
 */
export default function FocusToday() {
  const { today } = useTasksAndEvents();
  const [expanded, setExpanded] = useState(false);

  const { focus, rest, done, total } = useMemo(() => {
    const open = today.filter((it) => !it.done);
    const byImportance = [...open].sort((a, b) => {
      const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      return p !== 0 ? p : (a.at ?? "").localeCompare(b.at ?? "");
    });
    return {
      focus: byImportance.slice(0, FOCUS_COUNT),
      rest: byImportance.slice(FOCUS_COUNT),
      done: today.filter((it) => it.done).length,
      total: today.length,
    };
  }, [today]);

  return (
    <WidgetCard title="Fokus heute" badge="Lokal" badgeTone="neutral">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="min-w-0 flex-1">
          {focus.length === 0 ? (
            <p className="text-sm text-muted">
              {total === 0
                ? 'Noch keine Aufgaben — leg unten unter „Neue Aufgabe“ welche an.'
                : 'Nichts Offenes mehr für heute. 🌓'}
            </p>
          ) : (
            <ul className="space-y-3">
              {focus.map((it) => {
                const s = PRIORITY_STYLE[it.priority];
                return (
                  <li key={it.id} className="flex items-baseline gap-3">
                    <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-muted">{timeLabel(it)}</span>
                    <span className={`min-w-0 flex-1 text-lg leading-snug text-foreground ${s.weight} ${s.opacity}`}>
                      {it.title}
                    </span>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted">
                      {PROJECT_TAG_LABEL[it.projectTag]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {rest.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="text-xs text-muted transition-colors hover:text-foreground"
              >
                {expanded ? "Weitere ausblenden" : `+ ${rest.length} weitere offene Punkte`}
              </button>
              {expanded && (
                <ul className="mt-3 space-y-2">
                  {rest.map((it) => {
                    const s = PRIORITY_STYLE[it.priority];
                    return (
                      <li key={it.id} className="flex items-baseline gap-3 text-sm">
                        <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-muted">{timeLabel(it)}</span>
                        <span className={`min-w-0 flex-1 truncate text-foreground ${s.weight} ${s.opacity}`}>
                          {it.title}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 sm:border-l sm:border-line sm:pl-8">
          <ProgressRing done={done} total={total} />
        </div>
      </div>
    </WidgetCard>
  );
}
