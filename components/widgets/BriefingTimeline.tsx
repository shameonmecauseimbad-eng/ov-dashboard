import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { buildTimeline, loadBriefingHistory } from "@/lib/briefing";

const fmtTag = new Intl.DateTimeFormat("de-AT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Vienna",
});

const fmtZeit = new Intl.DateTimeFormat("de-AT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Vienna",
});

/**
 * Chronologische Ereignis-Timeline über alle Themen: was kam wann rein.
 * Neuester Tag oben, je Tag die Einträge nach Eingang. Vertikale Leiste mit
 * durchgehender Linie und Knotenpunkten — rein aus der vorhandenen Historie.
 */
export default async function BriefingTimeline() {
  const result = await loadBriefingHistory();
  const days = result.status === "live" ? buildTimeline(result.rows) : [];

  return (
    <WidgetCard
      title="Zeitleiste"
      badge={result.status === "live" ? `${days.length} ${days.length === 1 ? "Tag" : "Tage"}` : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "error" && <ErrorNote>{result.hint}</ErrorNote>}

      {result.status === "live" && (
        <div className="space-y-8">
          {days.map((day) => (
            <div key={day.datum}>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {fmtTag.format(new Date(day.datum))}
              </p>
              <ul className="relative ml-1.5 space-y-6 border-l border-line pl-5">
                {day.entries.map((entry, i) => (
                  <li key={`${entry.thema}-${i}`} className="relative">
                    <span
                      className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full border-2 border-background bg-foreground"
                      aria-hidden="true"
                    />
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{entry.thema}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                        {fmtZeit.format(new Date(entry.erstellt_am))}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-sm leading-relaxed text-foreground/85">
                      {entry.inhalt}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </WidgetCard>
  );
}
