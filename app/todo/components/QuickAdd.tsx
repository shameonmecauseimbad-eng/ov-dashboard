"use client";

import { useMemo, useState } from "react";
import { addUserTask } from "@/lib/todo-store";
import { parseQuickAdd } from "@/lib/todo-nlp";
import { PRIORITY_STYLE, PROJECT_TAG_LABEL, RECURRENCE_LABEL } from "@/lib/todo-types";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const fmtDay = new Intl.DateTimeFormat("de-AT", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });

/** YYYY-MM-DD → lesbares, an heute/morgen ausgerichtetes Label. */
function dateLabel(date: string, now: Date): string {
  const todayStr = dayKey.format(now);
  const [y, m, d] = todayStr.split("-").map(Number);
  const tomorrowStr = dayKey.format(new Date(Date.UTC(y, m - 1, d + 1, 12)));
  if (date === todayStr) return "heute";
  if (date === tomorrowStr) return "morgen";
  return fmtDay.format(new Date(`${date}T12:00`));
}

/** Dezenter Vorschau-Chip (monochrom: Outline + Opacity, keine Farbe). */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/[0.03] px-2 py-0.5 text-[11px] text-foreground">
      {children}
    </span>
  );
}

/**
 * Quick-Add-Feld oben in der Zeitleiste: parst freie Eingaben („morgen 9 Uhr
 * DDD Bugfix") per Keyword/Regex in Datum, Uhrzeit, Projekt-Tag und Priorität
 * und legt die Aufgabe direkt lokal an. Live-Vorschau zeigt, was erkannt wurde.
 */
export default function QuickAdd({
  autoFocus = false,
  className = "mb-5",
}: {
  autoFocus?: boolean;
  className?: string;
} = {}) {
  const [raw, setRaw] = useState("");

  const parsed = useMemo(() => parseQuickAdd(raw), [raw]);
  const now = new Date();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!raw.trim()) return;
    const title = parsed.title || raw.trim();
    addUserTask({
      title,
      type: "task",
      priority: parsed.priority,
      projectTag: parsed.projectTag,
      date: parsed.date ?? dayKey.format(now),
      time: parsed.time,
      recurrence: parsed.recurrence,
      estimatedMinutes: parsed.estimatedMinutes,
    });
    setRaw("");
  }

  const showPreview = raw.trim().length > 0;

  return (
    <form onSubmit={submit} className={className}>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-muted" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path d="M12 5 V19 M5 12 H19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Schnell hinzufügen — z. B. „morgen 9 Uhr DDD Bugfix“"
          aria-label="Aufgabe schnell hinzufügen"
          className="min-w-0 flex-1 rounded-lg border border-line bg-raised px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-white/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!raw.trim()}
          className="shrink-0 rounded-lg border border-white/40 bg-white/10 px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Hinzufügen
        </button>
      </div>

      {showPreview && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
          <span className="text-[11px] text-muted">Erkannt:</span>
          <Chip>{parsed.matched.date ? dateLabel(parsed.date!, now) : "heute"}</Chip>
          {parsed.matched.time ? <Chip>{parsed.time} Uhr</Chip> : <Chip>ganztägig</Chip>}
          {parsed.matched.project && <Chip>{PROJECT_TAG_LABEL[parsed.projectTag]}</Chip>}
          {parsed.matched.priority && <Chip>Priorität {PRIORITY_STYLE[parsed.priority].label}</Chip>}
          {parsed.matched.recurrence && parsed.recurrence && <Chip>{RECURRENCE_LABEL[parsed.recurrence.freq]}</Chip>}
          {parsed.matched.estimate && parsed.estimatedMinutes != null && (
            <Chip>
              ~{parsed.estimatedMinutes >= 60 ? `${(parsed.estimatedMinutes / 60).toLocaleString("de-AT", { maximumFractionDigits: 1 })} h` : `${parsed.estimatedMinutes} min`}
            </Chip>
          )}
          <span className="text-[11px] text-muted">
            → „<span className="text-foreground">{parsed.title || raw.trim()}</span>“
          </span>
        </div>
      )}
    </form>
  );
}
