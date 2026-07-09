"use client";

import { useEffect, useRef, useState } from "react";
import QuickAdd from "@/app/todo/components/QuickAdd";
import WidgetCard from "@/components/WidgetCard";
import { addUserTask } from "@/lib/todo-store";
import {
  PROJECT_TAGS,
  PROJECT_TAG_LABEL,
  RECURRENCE_LABEL,
  type ItemType,
  type Priority,
  type ProjectTag,
  type RecurrenceFreq,
} from "@/lib/todo-types";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

const inputBase =
  "w-full rounded-lg border border-line bg-raised px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-white/30 focus:outline-none";
const labelBase = "mb-1.5 block text-xs uppercase tracking-[0.12em] text-muted";

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const PRIORITY_LABEL: Record<Priority, string> = { high: "Hoch", medium: "Mittel", low: "Niedrig" };

/**
 * Formular-Widget zum Anlegen eigener Aufgaben/Termine. Speichert lokal über
 * den todo-store (localStorage) — die neue Aufgabe erscheint sofort im
 * Fokus-Widget und in der Zeitleiste. Wird über /todo#neu angesteuert
 * (Auto-Fokus auf den Titel).
 */
export default function TaskCreator() {
  const titleRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"form" | "quick">("form");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ItemType>("task");
  const [priority, setPriority] = useState<Priority>("medium");
  const [projectTag, setProjectTag] = useState<ProjectTag>("sonstiges");
  const [date, setDate] = useState(() => dayKey.format(new Date()));
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<"none" | RecurrenceFreq>("none");
  const [duration, setDuration] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);

  // Von „+ Aufgabe erstellen" (…/todo#neu) kommend: Titel fokussieren.
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#neu") {
      titleRef.current?.focus();
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const mins = Number(duration.replace(",", "."));
    addUserTask({
      title: trimmed,
      type,
      priority,
      projectTag,
      date,
      time: time || null,
      recurrence: recurrence === "none" ? null : { freq: recurrence, interval: 1 },
      estimatedMinutes: Number.isFinite(mins) && mins > 0 ? Math.round(mins) : null,
    });
    setJustAdded(trimmed);
    setTitle("");
    setTime("");
    setDuration("");
    titleRef.current?.focus();
    window.setTimeout(() => setJustAdded(null), 2500);
  }

  return (
    <WidgetCard title="Neue Aufgabe" badge="Lokal" badgeTone="neutral">
      {/* Modus-Umschalter: strukturiertes Formular ⇄ Schnell-Eingabe (Quick-Work) */}
      <div className="mb-5 inline-flex rounded-lg border border-line p-0.5" role="tablist" aria-label="Eingabemodus">
        {([["form", "Formular"], ["quick", "Schnell"]] as const).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-md px-3.5 py-1.5 text-sm transition-colors ${
              mode === m ? "bg-white/10 font-medium text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "quick" ? (
        <>
          <QuickAdd autoFocus className="" />
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Schnell-Eingabe: erkennt Datum, Uhrzeit, Projekt, Priorität, Wiederholung &amp; Dauer aus dem
            Text — z. B. „morgen 9 Uhr DDD Bugfix wöchentlich 30 min“.
          </p>
        </>
      ) : (
        <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="task-title" className={labelBase}>
            Titel
          </label>
          <input
            id="task-title"
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Was ist zu tun?"
            className={inputBase}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <span className={labelBase}>Typ</span>
            <div className="flex gap-2">
              {(["task", "event"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  aria-pressed={type === t}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === t
                      ? "border-white/40 font-medium text-foreground opacity-100"
                      : "border-line text-muted opacity-60 hover:opacity-100"
                  } ${t === "event" ? "border-solid" : "border-dashed"}`}
                >
                  {t === "task" ? "To-Do" : "Termin"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="task-priority" className={labelBase}>
              Priorität
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={inputBase}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="task-project" className={labelBase}>
              Projekt
            </label>
            <select
              id="task-project"
              value={projectTag}
              onChange={(e) => setProjectTag(e.target.value as ProjectTag)}
              className={inputBase}
            >
              {PROJECT_TAGS.map((t) => (
                <option key={t} value={t}>
                  {PROJECT_TAG_LABEL[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-date" className={labelBase}>
                Datum
              </label>
              <input
                id="task-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputBase} [color-scheme:dark]`}
                required
              />
            </div>
            <div>
              <label htmlFor="task-time" className={labelBase}>
                Uhrzeit
              </label>
              <input
                id="task-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`${inputBase} [color-scheme:dark]`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-recurrence" className={labelBase}>
              Wiederholung
            </label>
            <select
              id="task-recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as "none" | RecurrenceFreq)}
              className={inputBase}
            >
              <option value="none">Einmalig</option>
              <option value="daily">{RECURRENCE_LABEL.daily}</option>
              <option value="weekly">{RECURRENCE_LABEL.weekly}</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-duration" className={labelBase}>
              Geschätzte Dauer (Min.)
            </label>
            <input
              id="task-duration"
              inputMode="numeric"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="z. B. 30"
              className={inputBase}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            type="submit"
            className="rounded-lg border border-white/40 bg-white/10 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/15"
          >
            Aufgabe hinzufügen
          </button>
          {justAdded && (
            <span className="animate-fade-in text-xs text-muted">
              &bdquo;{justAdded}&ldquo; hinzugefügt ✓
            </span>
          )}
        </div>
      </form>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Ohne Uhrzeit = ganztägig · Speicherung: lokal im Browser (localStorage)
          </p>
        </>
      )}
    </WidgetCard>
  );
}
