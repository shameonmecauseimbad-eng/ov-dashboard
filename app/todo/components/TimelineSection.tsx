"use client";

import { useEffect, useMemo, useState } from "react";
import CombinedTimeline from "@/app/todo/components/CombinedTimeline";
import ProjectFilter, { type FilterValue } from "@/app/todo/components/ProjectFilter";
import { useTodo } from "@/app/todo/components/TodoContext";
import WidgetCard from "@/components/WidgetCard";
import { useTasksAndEvents } from "@/lib/useTasksAndEvents";

/**
 * Kombi-Zeitleisten-Karte: hält den aktiven Projekt-Filter, verdrahtet
 * Filterleiste ↔ Zeitleiste und registriert die sichtbaren Aufgaben im
 * TodoContext (für Tastatur-Navigation und Bulk-Auswahl).
 */
export default function TimelineSection() {
  const { items } = useTasksAndEvents();
  const { registerItems } = useTodo();
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((it) => it.projectTag === filter)),
    [items, filter]
  );

  // Sichtbare (gefilterte) Reihenfolge dem Kontext melden — Cursor & Bulk
  // arbeiten damit exakt auf dem, was der Nutzer sieht.
  useEffect(() => {
    registerItems(filtered);
  }, [filtered, registerItems]);

  return (
    <WidgetCard title="Quick-Work" badge="Lokal" badgeTone="neutral">
      <div className="mb-5">
        <ProjectFilter value={filter} onChange={setFilter} />
      </div>
      <CombinedTimeline items={filtered} />
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Termine (durchgezogener Rahmen) + To-Dos (gestrichelt) · <kbd className="rounded border border-line px-1">?</kbd> für
        Tastaturkürzel · Quelle: lokal im Browser (localStorage)
      </p>
    </WidgetCard>
  );
}
