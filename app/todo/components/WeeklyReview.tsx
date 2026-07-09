"use client";

import { useMemo, useState } from "react";
import WidgetCard from "@/components/WidgetCard";
import { isoWeekday, startOfWeek } from "@/lib/todo-dates";
import { useTasksAndEvents } from "@/lib/useTasksAndEvents";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const WD = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

/**
 * Wochenrückblick (Feature 7): fasst die laufende Woche (Mo–So, Wiener Zeit)
 * als erledigt/geplant zusammen — Prozentzahl + Mini-Balken je Wochentag.
 * Sonntags automatisch aufgeklappt, sonst per Klick. Nur To-Dos zählen.
 */
export default function WeeklyReview() {
  const { items } = useTasksAndEvents();
  const isSunday = isoWeekday() === 0;
  const [open, setOpen] = useState(isSunday);

  const { weekLabel, planned, done, percent, perDay } = useMemo(() => {
    const weekStart = startOfWeek(new Date());
    const days = Array.from({ length: 7 }, (_, i) => shiftDaysFrom(weekStart, i));
    const inWeek = new Set(days);

    const tasks = items.filter((it) => it.type === "task" && it.at && inWeek.has(dayKey.format(new Date(it.at))));
    const doneCount = tasks.filter((t) => t.done).length;
    const perDay = days.map((d, i) => {
      const dayTasks = tasks.filter((t) => dayKey.format(new Date(t.at!)) === d);
      return { label: WD[i], total: dayTasks.length, done: dayTasks.filter((t) => t.done).length };
    });
    const fmt = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "short", timeZone: TZ });
    const weekLabel = `${fmt.format(new Date(`${days[0]}T12:00`))} – ${fmt.format(new Date(`${days[6]}T12:00`))}`;

    return {
      weekLabel,
      planned: tasks.length,
      done: doneCount,
      percent: tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0,
      perDay,
    };
  }, [items]);

  const maxTotal = Math.max(1, ...perDay.map((d) => d.total));

  return (
    <WidgetCard title="Wochenrückblick" badge={isSunday ? "Sonntag" : "Lokal"} badgeTone="neutral">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-4 text-left"
      >
        <span className="flex items-baseline gap-3">
          <span className="font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">{percent}%</span>
          <span className="text-sm text-muted">
            {done} von {planned} erledigt
          </span>
        </span>
        <span className="text-xs text-muted">{open ? "einklappen" : `${weekLabel} ▾`}</span>
      </button>

      {open && (
        <div className="mt-5">
          <div className="flex items-end justify-between gap-2" style={{ height: 72 }}>
            {perDay.map((d) => {
              const totalH = (d.total / maxTotal) * 60;
              const doneH = d.total > 0 ? (d.done / d.total) * totalH : 0;
              return (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="relative flex w-full max-w-8 flex-1 items-end justify-center">
                    <div className="w-full rounded-t-sm border border-white/15 bg-white/[0.04]" style={{ height: Math.max(2, totalH) }}>
                      <div className="w-full rounded-t-sm bg-white/70" style={{ height: doneH, marginTop: Math.max(0, totalH - doneH) }} />
                    </div>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-muted">{d.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 border-t border-line pt-4 text-xs text-muted">
            Gefüllt = erledigt, Umriss = geplant · {weekLabel} · nur eigene To-Dos
          </p>
        </div>
      )}
    </WidgetCard>
  );
}

/** YYYY-MM-DD + i Tage (rein kalendarisch, DST-sicher). */
function shiftDaysFrom(base: string, i: number): string {
  const [y, m, d] = base.split("-").map(Number);
  return dayKey.format(new Date(Date.UTC(y, m - 1, d + i, 12)));
}
