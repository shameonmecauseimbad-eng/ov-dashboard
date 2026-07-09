"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { isoDay } from "@/lib/todo-dates";
import { rescheduleUserTask } from "@/lib/todo-store";
import { withSync } from "@/lib/todo-toast";
import { PRIORITY_STYLE, type Priority, type TaskOrEvent } from "@/lib/todo-types";
import { useTasksAndEvents } from "@/lib/useTasksAndEvents";

const TZ = "Europe/Vienna";
const fmtTime = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

const DAY_START = 8 * 60; // 08:00
const DAY_END = 20 * 60; // 20:00
const MIN_GAP = 30; // Minuten
const DEFAULT_DUR = 30;
const LONG_TASK = 90; // ab dieser Dauer gilt eine Aufgabe als „lang" → Pause empfohlen
const BREAK_AFTER_LONG = 15; // empfohlene Pause nach einer langen Aufgabe (Minuten)
const BUFFER = 10; // stiller Puffer zwischen zwei Blöcken, damit sie nicht direkt aneinanderkleben
const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function minutesOf(iso: string): number {
  const [h, m] = fmtTime.format(new Date(iso)).split(":").map(Number);
  return h * 60 + m;
}
function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

type Suggestion =
  | { kind: "task"; task: TaskOrEvent; start: number; end: number }
  | { kind: "break"; start: number; end: number };

/**
 * Automatische Zeitfenster-Vorschläge (Feature 8). Ersetzt das MCP-Tool
 * suggest_time durch eine lokale Lückenberechnung: freie Fenster zwischen den
 * heutigen Terminen (08–20 Uhr) werden mit offenen, noch nicht terminierten
 * To-Dos gefüllt — NUR als Vorschlag. „Einplanen" setzt die Uhrzeit.
 *
 * MCP-Naht: Sobald der Kalender-Sync (list_events/suggest_time) über Supabase
 * andockt, liefert er die Belegung; die Fensterlogik hier bleibt gleich.
 */
export default function TimeSuggestions() {
  const { items, today } = useTasksAndEvents();
  const todayStr = isoDay();

  const suggestions = useMemo<Suggestion[]>(() => {
    // Belegte Blöcke aus heutigen, terminierten Punkten.
    const busy = today
      .filter((it) => it.at && !it.allDay)
      .map((it) => {
        const start = minutesOf(it.at!);
        const dur = it.estimatedMinutes && it.estimatedMinutes > 0 ? it.estimatedMinutes : 60;
        return { start, end: Math.min(DAY_END, start + dur) };
      })
      .filter((b) => b.end > DAY_START && b.start < DAY_END)
      .sort((a, b) => a.start - b.start);

    // Freie Lücken innerhalb 08–20 Uhr.
    const gaps: Array<{ start: number; end: number }> = [];
    let cursor = DAY_START;
    for (const b of busy) {
      if (b.start > cursor) gaps.push({ start: cursor, end: b.start });
      cursor = Math.max(cursor, b.end);
    }
    if (cursor < DAY_END) gaps.push({ start: cursor, end: DAY_END });

    // Offene, noch nicht terminierte To-Dos (undatiert ODER ganztägig ohne Uhrzeit).
    const candidates = items
      .filter((it) => it.type === "task" && !it.done && (!it.at || it.allDay))
      .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);

    const out: Suggestion[] = [];
    const workGaps = gaps.map((g) => ({ ...g }));
    let placed = 0;
    for (const task of candidates) {
      const dur = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : DEFAULT_DUR;
      const gap = workGaps.find((g) => g.end - g.start >= Math.max(MIN_GAP, dur));
      if (!gap) continue;
      const start = gap.start;
      const end = start + dur;
      out.push({ kind: "task", task, start, end });
      gap.start = end; // Lücke verkleinern
      placed += 1;
      if (placed >= 5) break;

      // Smarte Pause: nach langen Aufgaben eine sichtbare Pause empfehlen,
      // sonst nur einen stillen Puffer, damit Blöcke nicht direkt aneinanderkleben.
      const isLong = dur >= LONG_TASK;
      const breakLen = isLong ? BREAK_AFTER_LONG : BUFFER;
      const breakEnd = Math.min(gap.end, gap.start + breakLen);
      if (breakEnd > gap.start) {
        if (isLong) out.push({ kind: "break", start: gap.start, end: breakEnd });
        gap.start = breakEnd; // Pause/Puffer belegt die Lücke mit
      }
    }
    return out;
  }, [items, today]);

  const schedule = (task: TaskOrEvent, start: number) => {
    void withSync(() => rescheduleUserTask(task.id, todayStr, hhmm(start)), `„${task.title}“ für ${hhmm(start)} eingeplant.`);
  };

  return (
    <WidgetCard title="Zeitfenster-Vorschläge" badge="Heute" badgeTone="neutral">
      {suggestions.length === 0 ? (
        <p className="text-sm text-muted">
          Keine Vorschläge — entweder keine freien Fenster (08–20 Uhr) oder keine offenen, noch nicht terminierten To-Dos.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => {
            if (s.kind === "break") {
              return (
                <li
                  key={`break-${s.start}`}
                  className="flex items-center gap-3 rounded-lg border border-dashed border-white/10 px-3.5 py-2 opacity-70"
                >
                  <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-muted">
                    {hhmm(s.start)}–{hhmm(s.end)}
                  </span>
                  <span className="min-w-0 flex-1 text-xs uppercase tracking-wide text-muted">Pause empfohlen</span>
                </li>
              );
            }
            const st = PRIORITY_STYLE[s.task.priority];
            return (
              <li key={s.task.id} className="flex items-center gap-3 rounded-lg border border-dashed border-white/20 px-3.5 py-2.5">
                <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-muted">
                  {hhmm(s.start)}–{hhmm(s.end)}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm text-foreground ${st.weight} ${st.opacity}`}>{s.task.title}</span>
                <button
                  type="button"
                  onClick={() => schedule(s.task, s.start)}
                  className="shrink-0 rounded-lg border border-line px-3 py-1 text-xs text-foreground transition-colors hover:bg-white/10"
                >
                  Einplanen
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Smarte Lückensuche · Pause nach langen Aufgaben (≥ {LONG_TASK} Min) · nur Vorschlag, kein automatischer Eintrag
      </p>
    </WidgetCard>
  );
}
