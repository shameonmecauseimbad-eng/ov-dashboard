"use client";

import { useEffect } from "react";
import { useTodo } from "@/app/todo/components/TodoContext";

/** Ob der Fokus gerade in einem Eingabefeld liegt (dann keine Shortcuts). */
function inEditable(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

const SHORTCUTS: Array<{ keys: string; desc: string }> = [
  { keys: "j / k", desc: "nächste / vorige Aufgabe" },
  { keys: "x", desc: "Aufgabe erledigen" },
  { keys: "s", desc: "auf morgen verschieben" },
  { keys: "Leertaste", desc: "auswählen (Mehrfachauswahl)" },
  { keys: "1 / 2 / 3", desc: "Priorität hoch / mittel / niedrig" },
  { keys: "Esc", desc: "Auswahl / Hilfe schließen" },
  { keys: "?", desc: "diese Übersicht" },
];

/**
 * Globale Tastatur-Steuerung innerhalb von /todo (Feature 9) plus einblendbare
 * Kürzel-Übersicht (?). Wirkt auf die per TodoContext registrierte, sichtbare
 * Aufgabenliste; ignoriert Eingaben, während ein Feld fokussiert ist.
 */
export default function KeyboardShortcuts() {
  const {
    cursorId, moveCursor, complete, snooze, setPriorityFor, toggleSelect, clearSelection,
    helpOpen, setHelpOpen,
  } = useTodo();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" ) {
        if (inEditable()) return;
        e.preventDefault();
        setHelpOpen(!helpOpen);
        return;
      }
      if (e.key === "Escape") {
        clearSelection();
        setHelpOpen(false);
        return;
      }
      if (inEditable() || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "j": e.preventDefault(); moveCursor(1); break;
        case "k": e.preventDefault(); moveCursor(-1); break;
        case "x": if (cursorId) { e.preventDefault(); complete(cursorId); } break;
        case "s": if (cursorId) { e.preventDefault(); snooze(cursorId, "tomorrow"); } break;
        case " ": if (cursorId) { e.preventDefault(); toggleSelect(cursorId); } break;
        case "1": if (cursorId) { e.preventDefault(); setPriorityFor(cursorId, "high"); } break;
        case "2": if (cursorId) { e.preventDefault(); setPriorityFor(cursorId, "medium"); } break;
        case "3": if (cursorId) { e.preventDefault(); setPriorityFor(cursorId, "low"); } break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cursorId, moveCursor, complete, snooze, setPriorityFor, toggleSelect, clearSelection, helpOpen, setHelpOpen]);

  if (!helpOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in"
      onClick={() => setHelpOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Tastaturkürzel"
    >
      <div className="w-full max-w-sm rounded-2xl border border-line bg-raised p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-sm font-medium uppercase tracking-[0.16em] text-muted">Tastaturkürzel</h2>
        <ul className="space-y-2.5">
          {SHORTCUTS.map((sc) => (
            <li key={sc.keys} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-foreground">{sc.desc}</span>
              <kbd className="shrink-0 rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-xs text-muted">{sc.keys}</kbd>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setHelpOpen(false)}
          className="mt-5 w-full rounded-lg border border-line py-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          Schließen (Esc)
        </button>
      </div>
    </div>
  );
}
