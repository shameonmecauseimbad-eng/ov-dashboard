"use client";

import { useTodo } from "@/app/todo/components/TodoContext";
import { PROJECT_TAGS, PROJECT_TAG_LABEL, type ProjectTag } from "@/lib/todo-types";

/**
 * Kontextabhängige Aktionsleiste (Feature 10): erscheint unten, sobald
 * Aufgaben ausgewählt sind. Gemeinsame Aktionen — Erledigen, Verschieben,
 * Projekt-Tag setzen — laufen über die Bulk-Funktionen des Stores.
 */
export default function BulkToolbar() {
  const { selected, clearSelection, bulkCompleteSelected, bulkSnoozeSelected, bulkTagSelected } = useTodo();
  const count = selected.size;
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-raised px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-scale-in">
        <span className="px-1 text-sm font-medium text-foreground">
          {count} <span className="text-muted">ausgewählt</span>
        </span>
        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />

        <button type="button" onClick={bulkCompleteSelected} className="rounded-lg border border-line px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-white/10">
          Erledigen
        </button>
        <button type="button" onClick={() => bulkSnoozeSelected("tomorrow")} className="rounded-lg border border-line px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-white/10">
          → Morgen
        </button>
        <button type="button" onClick={() => bulkSnoozeSelected("nextweek")} className="rounded-lg border border-line px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-white/10">
          → Nächste Woche
        </button>

        <select
          aria-label="Projekt-Tag setzen"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) bulkTagSelected(e.target.value as ProjectTag);
            e.target.value = "";
          }}
          className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-foreground [color-scheme:dark] focus:border-white/40 focus:outline-none"
        >
          <option value="" disabled>Projekt setzen …</option>
          {PROJECT_TAGS.map((t) => (
            <option key={t} value={t}>{PROJECT_TAG_LABEL[t]}</option>
          ))}
        </select>

        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
        <button type="button" onClick={clearSelection} className="rounded-lg px-2 py-1.5 text-sm text-muted transition-colors hover:text-foreground">
          Aufheben
        </button>
      </div>
    </div>
  );
}
