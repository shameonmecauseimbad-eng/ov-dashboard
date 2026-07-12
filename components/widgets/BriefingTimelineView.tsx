"use client";

import { useMemo, useState } from "react";
import { toggleMarkedDay, useMarkedDays } from "@/lib/briefing-marks";

export type TimelineEntryVM = { key: string; thema: string; zeit: string; snippet: string };
export type TimelineDayVM = {
  datum: string;
  labelLang: string;
  labelKurz: string;
  entries: TimelineEntryVM[];
  themen: string[];
};

// Neueste Tage immer detailliert; ältere Tage (letzter Monat) einklappbar.
const DETAIL_DAYS = 2;

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M8 1.7l1.83 3.71 4.09.59-2.96 2.88.7 4.07L8 11.5l-3.66 1.93.7-4.07L2.08 6.5l4.09-.59z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      aria-hidden="true"
    >
      <path d="M6 3.5l4.5 4.5L6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MarkButton({ marked, onClick }: { marked: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={marked}
      aria-label={marked ? "Markierung entfernen" : "Tag markieren"}
      title={marked ? "Markierung entfernen" : "Tag markieren"}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-[opacity,color] hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none ${
        marked
          ? "text-foreground opacity-100"
          : "text-muted opacity-0 max-sm:opacity-60 group-hover/day:opacity-100"
      }`}
    >
      <StarIcon filled={marked} />
    </button>
  );
}

function DayNode({ marked }: { marked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute left-0 top-[7px] h-2 w-2 -translate-x-1/2 rounded-full border-2 border-surface ${
        marked ? "bg-foreground" : "bg-muted/60"
      }`}
    />
  );
}

function EntryList({ entries }: { entries: TimelineEntryVM[] }) {
  return (
    <ul className="mt-2 space-y-3">
      {entries.map((e) => (
        <li key={e.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{e.thema}</span>
            <span className="shrink-0 font-mono text-xs tabular-nums text-muted">{e.zeit}</span>
          </div>
          <p className="mt-0.5 truncate text-sm leading-relaxed text-foreground/70">{e.snippet}</p>
        </li>
      ))}
    </ul>
  );
}

/**
 * Interaktive Zeitleiste: neueste Tage detailliert (Einzeiler je Eintrag),
 * ältere Tage des letzten Monats als anklickbare Disclosure (eingeklappt nur
 * Themen, ausgeklappt die Einträge). Jeder Tag lässt sich markieren — der
 * markierte Tag hebt sich über hellen Titel, gefüllten Stern und einen
 * helleren Spine-Abschnitt ab (monochrom, kein Farbakzent).
 */
export default function BriefingTimelineView({ days }: { days: TimelineDayVM[] }) {
  const markedList = useMarkedDays();
  const marked = useMemo(() => new Set(markedList), [markedList]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const detailDays = days.slice(0, DETAIL_DAYS);
  const compactDays = days.slice(DETAIL_DAYS);

  const toggleExpand = (datum: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(datum)) next.delete(datum);
      else next.add(datum);
      return next;
    });

  const spineClass = (isMarked: boolean) =>
    `group/day relative border-l-2 pl-5 transition-colors ${isMarked ? "border-foreground/50" : "border-line"}`;

  const labelClass = (isMarked: boolean, mono: boolean) =>
    `${mono ? "font-mono text-xs tabular-nums" : "text-xs font-medium uppercase tracking-[0.14em]"} ${
      isMarked ? "text-foreground" : "text-muted"
    }`;

  return (
    <div className="space-y-7">
      {/* Detailliert: neueste Tage, je Eintrag ein Einzeiler. */}
      <ul className="space-y-6">
        {detailDays.map((day) => {
          const isMarked = marked.has(day.datum);
          return (
            <li key={day.datum} className={spineClass(isMarked)}>
              <DayNode marked={isMarked} />
              <div className="flex items-center justify-between gap-2">
                <span className={labelClass(isMarked, false)}>{day.labelLang}</span>
                <MarkButton marked={isMarked} onClick={() => toggleMarkedDay(day.datum)} />
              </div>
              <EntryList entries={day.entries} />
            </li>
          );
        })}
      </ul>

      {/* Letzter Monat: ältere Tage anklickbar aus-/einklappen. */}
      {compactDays.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">Frühere Tage</p>
          <ul className="space-y-2.5">
            {compactDays.map((day) => {
              const isMarked = marked.has(day.datum);
              const isOpen = expanded.has(day.datum);
              return (
                <li key={day.datum} className={spineClass(isMarked)}>
                  <DayNode marked={isMarked} />
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleExpand(day.datum)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 py-0.5 text-left transition-colors hover:text-foreground"
                    >
                      <span className={`flex items-center gap-1.5 ${isMarked ? "text-foreground" : "text-muted"}`}>
                        <Chevron open={isOpen} />
                        <span className={labelClass(isMarked, true)}>{day.labelKurz}</span>
                      </span>
                      {!isOpen &&
                        day.themen.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-foreground/70"
                          >
                            {t}
                          </span>
                        ))}
                    </button>
                    <MarkButton marked={isMarked} onClick={() => toggleMarkedDay(day.datum)} />
                  </div>
                  {isOpen && <EntryList entries={day.entries} />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
