"use client";

import { useEffect, useRef, useState } from "react";
import PriorityBadge from "@/app/todo/components/PriorityBadge";
import { useTodo } from "@/app/todo/components/TodoContext";
import { addSubtask, removeSubtask, removeUserTask, toggleSubtask } from "@/lib/todo-store";
import { isoDay } from "@/lib/todo-dates";
import {
  PROJECT_TAG_LABEL,
  PRIORITY_STYLE,
  RECURRENCE_LABEL,
  type TaskOrEvent,
} from "@/lib/todo-types";

const fmtTime = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Vienna" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna", year: "numeric", month: "2-digit", day: "2-digit" });

function timeLabel(it: TaskOrEvent): string {
  if (!it.at || it.allDay) return "ganztägig";
  return fmtTime.format(new Date(it.at));
}

/** Überfällige Tage (Wiener Kalendertage). 0 = nicht überfällig / kein Datum / erledigt. */
function overdueDays(it: TaskOrEvent): number {
  if (!it.at || it.done) return 0;
  const due = dayKey.format(new Date(it.at));
  const today = isoDay();
  if (due >= today) return 0;
  const a = new Date(`${due}T12:00:00Z`).getTime();
  const b = new Date(`${today}T12:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Eskalation überfälliger Aufgaben (Feature 6): je länger überfällig, desto
 * stärker Font-Weight/Opacity + linke Kante. Monochrom, keine Signalfarbe.
 */
function escalation(days: number): { row: string; title: string; tag: string | null } {
  if (days <= 0) return { row: "", title: "", tag: null };
  if (days < 3) return { row: "border-l-2 border-white/30", title: "font-medium opacity-100", tag: "überfällig" };
  if (days < 7)
    return { row: "border-l-2 border-white/50 bg-white/[0.03]", title: "font-semibold opacity-100", tag: `${days} Tage überfällig` };
  return {
    row: "border-l-4 border-white/70 bg-white/[0.05]",
    title: "font-bold opacity-100 underline decoration-white/40 underline-offset-2",
    tag: `${days} Tage überfällig`,
  };
}

function DoneToggle({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={done ? "Als offen markieren" : "Als erledigt markieren"}
      aria-pressed={done}
      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/30 text-foreground transition-colors hover:border-white/60"
    >
      {done && (
        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
          <path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function TaskRow({ item }: { item: TaskOrEvent }) {
  const { cursorId, setCursor, isSelected, toggleSelect, selectTo, selected, complete, snooze, snoozeToDate } = useTodo();
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subDraft, setSubDraft] = useState("");
  const [dateDraft, setDateDraft] = useState(isoDay());
  const menuRef = useRef<HTMLDivElement>(null);

  const isUser = item.source === "user";
  const s = PRIORITY_STYLE[item.priority];
  const subs = item.subtasks ?? [];
  const subDone = subs.filter((x) => x.done).length;
  const days = overdueDays(item);
  const esc = escalation(days);
  const selectionActive = selected.size > 0;
  const picked = isSelected(item.id);
  const isCursor = cursorId === item.id;

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <li
      onMouseDown={(e) => {
        if (isUser && e.shiftKey) {
          e.preventDefault();
          selectTo(item.id);
        }
      }}
      onClick={() => setCursor(item.id)}
      className={`group/row rounded-lg border bg-white/[0.02] px-3.5 py-2.5 transition-colors ${
        item.type === "event" ? "border-solid border-line" : "border-dashed border-white/20"
      } ${esc.row} ${item.done ? "opacity-50" : ""} ${
        isCursor ? "outline outline-1 outline-white/40" : ""
      } ${picked ? "bg-white/[0.06]" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Auswahl-Checkbox (Feature 10): sichtbar bei Hover oder aktiver Auswahl */}
        {isUser && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelect(item.id);
            }}
            aria-label={picked ? "Auswahl aufheben" : "Auswählen"}
            aria-pressed={picked}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all ${
              picked
                ? "border-white/70 bg-white/20 opacity-100"
                : `border-white/30 opacity-0 group-hover/row:opacity-100 ${selectionActive ? "opacity-100" : ""}`
            }`}
          >
            {picked && (
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden="true">
                <path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {isUser && <DoneToggle done={item.done} onClick={() => complete(item.id)} />}

        <span className="w-14 shrink-0 font-mono text-xs tabular-nums text-muted">{timeLabel(item)}</span>

        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className={`min-w-0 truncate text-sm text-foreground ${s.weight} ${s.opacity} ${esc.title} ${item.done ? "line-through" : ""}`}>
            {item.title}
          </span>

          {/* Subtask-Fortschritt (Feature 3) */}
          {subs.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="shrink-0 rounded-full border border-line px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted transition-colors hover:text-foreground"
              aria-expanded={expanded}
              aria-label="Checkliste ein-/ausklappen"
            >
              {subDone}/{subs.length}
            </button>
          )}

          {/* Wiederholung (Feature 2) */}
          {item.recurrence && (
            <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] uppercase tracking-[0.1em] text-muted" title="Wiederkehrend">
              <svg viewBox="0 0 24 24" className="h-3 w-3" aria-hidden="true">
                <path d="M4 9 A8 8 0 0 1 18 6 L20 8 M20 15 A8 8 0 0 1 6 18 L4 16 M20 4 V8 H16 M4 20 V16 H8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {RECURRENCE_LABEL[item.recurrence.freq]}
            </span>
          )}

          {/* Dauer-Schätzung (Feature 5) */}
          {item.estimatedMinutes != null && item.estimatedMinutes > 0 && (
            <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
              ~{item.estimatedMinutes >= 60 ? `${(item.estimatedMinutes / 60).toLocaleString("de-AT", { maximumFractionDigits: 1 })} h` : `${item.estimatedMinutes} min`}
            </span>
          )}

          <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
            {item.type === "event" ? "Termin" : "To-Do"}
          </span>

          {esc.tag && (
            <span className="shrink-0 rounded-full border border-white/40 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-foreground">
              {esc.tag}
            </span>
          )}
        </span>

        <span className="hidden shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted sm:inline">
          {PROJECT_TAG_LABEL[item.projectTag]}
        </span>
        <PriorityBadge priority={item.priority} />

        {/* Snooze/Kontextmenü (Feature 4) */}
        {isUser && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              aria-label="Verschieben / Aktionen"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="text-muted transition-colors hover:text-foreground"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <circle cx="5" cy="12" r="1.6" fill="currentColor" />
                <circle cx="12" cy="12" r="1.6" fill="currentColor" />
                <circle cx="19" cy="12" r="1.6" fill="currentColor" />
              </svg>
            </button>
            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-6 z-20 w-52 rounded-lg border border-line bg-raised p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">Verschieben</p>
                <button type="button" role="menuitem" onClick={() => { snooze(item.id, "tomorrow"); setMenuOpen(false); }} className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-white/10">
                  Morgen
                </button>
                <button type="button" role="menuitem" onClick={() => { snooze(item.id, "nextweek"); setMenuOpen(false); }} className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-white/10">
                  Nächste Woche
                </button>
                <div className="mt-1 flex items-center gap-1.5 border-t border-line px-2 pt-2">
                  <input
                    type="date"
                    value={dateDraft}
                    onChange={(e) => setDateDraft(e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-line bg-surface px-2 py-1 text-xs text-foreground [color-scheme:dark] focus:border-white/40 focus:outline-none"
                  />
                  <button type="button" onClick={() => { snoozeToDate(item.id, dateDraft, null); setMenuOpen(false); }} className="rounded-md border border-line px-2 py-1 text-xs text-muted transition-colors hover:text-foreground">
                    OK
                  </button>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setExpanded(true); setMenuOpen(false); }}
                  className="mt-1 block w-full rounded-md border-t border-line px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-white/10"
                >
                  Checkliste bearbeiten
                </button>
              </div>
            )}
          </div>
        )}

        {isUser && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); removeUserTask(item.id); }}
            aria-label="Aufgabe löschen"
            className="shrink-0 text-muted transition-colors hover:text-foreground"
          >
            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true">
              <path d="M3 3 L11 11 M11 3 L3 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Subtasks-Panel (Feature 3) */}
      {isUser && expanded && (
        <div className="mt-2.5 space-y-1.5 border-t border-line pl-7 pt-2.5" onClick={(e) => e.stopPropagation()}>
          {subs.map((sub) => (
            <div key={sub.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSubtask(item.id, sub.id)}
                aria-pressed={sub.done}
                className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-white/30 transition-colors hover:border-white/60"
              >
                {sub.done && (
                  <svg viewBox="0 0 12 12" className="h-2 w-2" aria-hidden="true">
                    <path d="M2 6.5 L5 9 L10 3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`min-w-0 flex-1 truncate text-sm text-foreground ${sub.done ? "line-through opacity-50" : ""}`}>
                {sub.title}
              </span>
              <button type="button" onClick={() => removeSubtask(item.id, sub.id)} aria-label="Unterpunkt löschen" className="text-muted transition-colors hover:text-foreground">
                <svg viewBox="0 0 14 14" className="h-3 w-3" aria-hidden="true">
                  <path d="M3 3 L11 11 M11 3 L3 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addSubtask(item.id, subDraft);
              setSubDraft("");
            }}
            className="flex items-center gap-2 pt-0.5"
          >
            <input
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              placeholder="Unterpunkt hinzufügen …"
              className="min-w-0 flex-1 rounded-md border border-line bg-raised px-2 py-1 text-xs text-foreground placeholder:text-muted focus:border-white/30 focus:outline-none"
            />
            <button type="submit" className="rounded-md border border-line px-2 py-1 text-xs text-muted transition-colors hover:text-foreground">
              +
            </button>
          </form>
        </div>
      )}
    </li>
  );
}
