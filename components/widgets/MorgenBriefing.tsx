import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { latestPerThema, loadBriefingHistory } from "@/lib/briefing";

const fmtDatum = new Intl.DateTimeFormat("de-AT", {
  dateStyle: "medium",
  timeZone: "Europe/Vienna",
});

/**
 * Neuester Briefing-Eintrag pro Thema aus "morning_briefing" (read-only) —
 * geschrieben wird die Tabelle täglich vom Hermes Agent.
 */
export default async function MorgenBriefing() {
  const result = await loadBriefingHistory();
  const entries = result.status === "live" ? latestPerThema(result.rows) : [];

  return (
    <WidgetCard
      title="Morgen-Briefing"
      badge={result.status === "live" ? "Live" : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "live" ? (
        <>
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <li key={entry.thema} className="py-3.5 first:pt-0 last:pb-0">
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {entry.thema}
                  </span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {fmtDatum.format(new Date(entry.datum))}
                  </span>
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">
                  {entry.inhalt}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: Supabase · <span className="font-mono">dashboard.morning_briefing</span> · Befüllung: Hermes Agent (täglich)
          </p>
        </>
      ) : (
        <ErrorNote>{result.hint}</ErrorNote>
      )}
    </WidgetCard>
  );
}
