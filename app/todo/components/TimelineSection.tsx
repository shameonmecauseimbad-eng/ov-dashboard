"use client";

import { useMemo, useState } from "react";
import CombinedTimeline from "@/app/todo/components/CombinedTimeline";
import ProjectFilter, { type FilterValue } from "@/app/todo/components/ProjectFilter";
import WidgetCard from "@/components/WidgetCard";
import { useTasksAndEvents } from "@/lib/useTasksAndEvents";

/**
 * Kombi-Zeitleisten-Karte: hält den aktiven Projekt-Filter und verdrahtet
 * Filterleiste ↔ Zeitleiste. Datenbasis ist der zentrale Hook
 * useTasksAndEvents() (aktuell Platzhalter-Daten).
 */
export default function TimelineSection() {
  const { items, isMock } = useTasksAndEvents();
  const [filter, setFilter] = useState<FilterValue>("all");

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((it) => it.projectTag === filter)),
    [items, filter]
  );

  return (
    <WidgetCard title="Zeitleiste" badge={isMock ? "Platzhalter" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <div className="mb-5">
        <ProjectFilter value={filter} onChange={setFilter} />
      </div>
      <CombinedTimeline items={filtered} />
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Termine (durchgezogener Rahmen) + To-Dos (gestrichelt) · Quelle:{" "}
        {isMock ? "Platzhalter-Daten" : <span className="font-mono">dashboard.todo_items</span>}
      </p>
    </WidgetCard>
  );
}
