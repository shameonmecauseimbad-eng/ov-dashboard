import PriorityBadge from "@/app/todo/components/PriorityBadge";
import { PROJECT_TAG_LABEL, PRIORITY_STYLE, type TaskOrEvent } from "@/lib/todo-types";

type TimelineProps = {
  items: TaskOrEvent[];
  /** Erledigt-Status einer eigenen Aufgabe umschalten (nur source === "user"). */
  onToggle?: (id: string) => void;
  /** Eigene Aufgabe löschen (nur source === "user"). */
  onRemove?: (id: string) => void;
};

/** Erledigt-Kreis bzw. Häkchen für eigene Aufgaben. */
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

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayHead = new Intl.DateTimeFormat("de-AT", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
const fmtTime = new Intl.DateTimeFormat("de-AT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

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
  // Datierte Gruppen chronologisch, "Ohne Datum" ans Ende.
  return Array.from(map.values()).sort((a, b) => {
    if (a.key === "none") return 1;
    if (b.key === "none") return -1;
    return a.key.localeCompare(b.key);
  });
}

function timeLabel(it: TaskOrEvent): string {
  if (!it.at || it.allDay) return "ganztägig";
  return fmtTime.format(new Date(it.at));
}

/**
 * Gemeinsame vertikale Zeitleiste aus Terminen UND To-Dos, nach Tag gruppiert.
 * Termine vs. To-Dos werden über den RAHMEN-STIL unterschieden, nicht über
 * Farbe: Termine = durchgezogener Rahmen, To-Dos = gestrichelter Rahmen.
 * Priorität wirkt über Font-Weight/Opacity auf den Titel; erledigte Punkte
 * sind durchgestrichen und gedämpft.
 */
export default function CombinedTimeline({ items, onToggle, onRemove }: TimelineProps) {
  const todayStr = dayKey.format(new Date());
  const groups = groupByDay(items, todayStr);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted">Keine Aufgaben — oben unter „Neue Aufgabe“ anlegen.</p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-muted">{group.label}</p>
          <ul className="space-y-2.5">
            {group.items.map((it) => {
              const s = PRIORITY_STYLE[it.priority];
              return (
                <li
                  key={it.id}
                  className={`flex items-center gap-3 rounded-lg border bg-white/[0.02] px-3.5 py-2.5 ${
                    it.type === "event" ? "border-solid border-line" : "border-dashed border-white/20"
                  } ${it.done ? "opacity-50" : ""}`}
                >
                  {it.source === "user" && onToggle ? (
                    <DoneToggle done={it.done} onClick={() => onToggle(it.id)} />
                  ) : null}
                  <span className="w-14 shrink-0 font-mono text-xs tabular-nums text-muted">{timeLabel(it)}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={`min-w-0 truncate text-sm text-foreground ${s.weight} ${s.opacity} ${
                        it.done ? "line-through" : ""
                      }`}
                    >
                      {it.title}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
                      {it.type === "event" ? "Termin" : "To-Do"}
                    </span>
                    {it.source === "user" && (
                      <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted opacity-70">
                        · eigen
                      </span>
                    )}
                  </span>
                  <span className="hidden shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-muted sm:inline">
                    {PROJECT_TAG_LABEL[it.projectTag]}
                  </span>
                  <PriorityBadge priority={it.priority} />
                  {it.source === "user" && onRemove ? (
                    <button
                      type="button"
                      onClick={() => onRemove(it.id)}
                      aria-label="Aufgabe löschen"
                      className="shrink-0 text-muted transition-colors hover:text-foreground"
                    >
                      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M3 3 L11 11 M11 3 L3 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
