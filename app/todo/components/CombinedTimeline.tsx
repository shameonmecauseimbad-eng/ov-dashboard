"use client";

import TaskRow from "@/app/todo/components/TaskRow";
import type { TaskOrEvent } from "@/lib/todo-types";

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayHead = new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });

type Group = { key: string; label: string; items: TaskOrEvent[] };

function groupByDay(items: TaskOrEvent[], todayStr: string): Group[] {
  const map = new Map<string, Group>();
  for (const it of items) {
    const key = it.at ? dayKey.format(new Date(it.at)) : "none";
    if (!map.has(key)) {
      const label =
        key === "none"
          ? "Ohne Datum"
          : key === todayStr
            ? `Heute · ${dayHead.format(new Date(it.at!))}`
            : dayHead.format(new Date(it.at!));
      map.set(key, { key, label, items: [] });
    }
    map.get(key)!.items.push(it);
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === "none") return 1;
    if (b.key === "none") return -1;
    return a.key.localeCompare(b.key);
  });
}

/**
 * Gemeinsame vertikale Zeitleiste aus Terminen UND To-Dos, nach Tag gruppiert.
 * Termine vs. To-Dos über den RAHMEN-STIL (durchgezogen vs. gestrichelt), nicht
 * Farbe. Die einzelne Zeile (inkl. Subtasks, Snooze, Eskalation, Auswahl)
 * rendert TaskRow.
 */
export default function CombinedTimeline({ items }: { items: TaskOrEvent[] }) {
  const todayStr = dayKey.format(new Date());
  const groups = groupByDay(items, todayStr);

  if (items.length === 0) {
    return <p className="text-sm text-muted">Keine Aufgaben — oben schnell hinzufügen oder unter „Neue Aufgabe“ anlegen.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-muted">{group.label}</p>
          <ul className="space-y-2.5">
            {group.items.map((it) => (
              <TaskRow key={it.id} item={it} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
