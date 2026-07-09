"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import {
  bulkComplete,
  bulkReschedule,
  bulkUpdate,
  rescheduleUserTask,
  toggleUserTask,
  updateUserTask,
} from "@/lib/todo-store";
import { shiftDays } from "@/lib/todo-dates";
import { withSync } from "@/lib/todo-toast";
import type { Priority, ProjectTag, TaskOrEvent } from "@/lib/todo-types";
import { PROJECT_TAG_LABEL } from "@/lib/todo-types";

export type SnoozePreset = "tomorrow" | "nextweek";

type TodoContextValue = {
  // Sichtbare, geordnete Aufgaben (von der Zeitleiste registriert).
  items: TaskOrEvent[];
  registerItems: (items: TaskOrEvent[]) => void;

  // Tastatur-Cursor (j/k).
  cursorId: string | null;
  setCursor: (id: string | null) => void;
  moveCursor: (delta: number) => void;

  // Mehrfachauswahl (Feature 10).
  selected: Set<string>;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  selectTo: (id: string) => void;
  clearSelection: () => void;

  // Hilfe-Overlay (?).
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;

  // Aktionen (mit Sync-Fehlerbehandlung + Toast).
  complete: (id: string) => void;
  snooze: (id: string, preset: SnoozePreset) => void;
  snoozeToDate: (id: string, date: string, time: string | null) => void;
  setPriorityFor: (id: string, priority: Priority) => void;

  // Bulk-Aktionen.
  bulkCompleteSelected: () => void;
  bulkSnoozeSelected: (preset: SnoozePreset) => void;
  bulkTagSelected: (tag: ProjectTag) => void;
};

const Ctx = createContext<TodoContextValue | null>(null);

export function useTodo(): TodoContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTodo muss innerhalb von <TodoProvider> genutzt werden.");
  return ctx;
}

function presetDate(preset: SnoozePreset): string {
  return preset === "tomorrow" ? shiftDays(new Date(), 1) : shiftDays(new Date(), 7);
}
const presetLabel: Record<SnoozePreset, string> = { tomorrow: "morgen", nextweek: "nächste Woche" };

export default function TodoProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TaskOrEvent[]>([]);
  const [cursorId, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [helpOpen, setHelpOpen] = useState(false);
  const lastPicked = useRef<string | null>(null);

  const registerItems = useCallback((next: TaskOrEvent[]) => setItems(next), []);

  const moveCursor = useCallback(
    (delta: number) => {
      setItems((current) => {
        setCursor((cur) => {
          if (current.length === 0) return null;
          const idx = current.findIndex((i) => i.id === cur);
          if (idx === -1) return current[0].id;
          const nextIdx = Math.max(0, Math.min(current.length - 1, idx + delta));
          return current[nextIdx].id;
        });
        return current;
      });
    },
    []
  );

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggleSelect = useCallback((id: string) => {
    lastPicked.current = id;
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Shift-Klick: Bereich vom zuletzt gewählten bis id auswählen.
  const selectTo = useCallback(
    (id: string) => {
      setItems((current) => {
        const from = lastPicked.current;
        const a = current.findIndex((i) => i.id === from);
        const b = current.findIndex((i) => i.id === id);
        if (a === -1 || b === -1) {
          setSelected((s) => new Set(s).add(id));
        } else {
          const [lo, hi] = a < b ? [a, b] : [b, a];
          setSelected((s) => {
            const next = new Set(s);
            for (let i = lo; i <= hi; i++) next.add(current[i].id);
            return next;
          });
        }
        return current;
      });
      lastPicked.current = id;
    },
    []
  );

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // ─── Aktionen ─────────────────────────────────────────────────────────────
  const complete = useCallback((id: string) => {
    void withSync(() => toggleUserTask(id));
  }, []);

  const snooze = useCallback((id: string, preset: SnoozePreset) => {
    void withSync(
      () => rescheduleUserTask(id, presetDate(preset), null),
      `Verschoben auf ${presetLabel[preset]}.`
    );
  }, []);

  const snoozeToDate = useCallback((id: string, date: string, time: string | null) => {
    void withSync(() => rescheduleUserTask(id, date, time), "Aufgabe verschoben.");
  }, []);

  const setPriorityFor = useCallback((id: string, priority: Priority) => {
    void withSync(() => updateUserTask(id, { priority }));
  }, []);

  // ─── Bulk ─────────────────────────────────────────────────────────────────
  const bulkCompleteSelected = useCallback(() => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    void withSync(() => bulkComplete(ids), `${ids.length} erledigt.`);
    clearSelection();
  }, [selected, clearSelection]);

  const bulkSnoozeSelected = useCallback(
    (preset: SnoozePreset) => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      void withSync(() => bulkReschedule(ids, presetDate(preset), null), `${ids.length} auf ${presetLabel[preset]} verschoben.`);
      clearSelection();
    },
    [selected, clearSelection]
  );

  const bulkTagSelected = useCallback(
    (tag: ProjectTag) => {
      const ids = Array.from(selected);
      if (ids.length === 0) return;
      void withSync(() => bulkUpdate(ids, { projectTag: tag }), `${ids.length} → ${PROJECT_TAG_LABEL[tag]}.`);
      clearSelection();
    },
    [selected, clearSelection]
  );

  const value = useMemo<TodoContextValue>(
    () => ({
      items,
      registerItems,
      cursorId,
      setCursor,
      moveCursor,
      selected,
      isSelected,
      toggleSelect,
      selectTo,
      clearSelection,
      helpOpen,
      setHelpOpen,
      complete,
      snooze,
      snoozeToDate,
      setPriorityFor,
      bulkCompleteSelected,
      bulkSnoozeSelected,
      bulkTagSelected,
    }),
    [
      items, registerItems, cursorId, moveCursor, selected, isSelected, toggleSelect, selectTo,
      clearSelection, helpOpen, complete, snooze, snoozeToDate, setPriorityFor,
      bulkCompleteSelected, bulkSnoozeSelected, bulkTagSelected,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
