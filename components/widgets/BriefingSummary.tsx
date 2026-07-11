import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { buildDailySummary, loadBriefingHistory } from "@/lib/briefing";

const fmtDatum = new Intl.DateTimeFormat("de-AT", {
  dateStyle: "full",
  timeZone: "Europe/Vienna",
});

/**
 * "Das Wichtigste in 30 Sekunden": erster Satz je Thema des aktuellsten
 * Briefing-Tages, oben im Bereich angepinnt. Keine separate AI-Zusammen-
 * fassung — deterministisch aus lib/briefing.ts extrahiert, damit sie ohne
 * zusätzlichen Agent-Call immer synchron zu den Detail-Widgets bleibt.
 */
export default async function BriefingSummary() {
  const result = await loadBriefingHistory();
  const summary = result.status === "live" ? buildDailySummary(result.rows) : [];

  return (
    <WidgetCard
      title="Tagesüberblick"
      badge={result.status === "live" ? "Kurzfassung" : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "error" && <ErrorNote>{result.hint}</ErrorNote>}

      {result.status === "live" && summary.length === 0 && (
        <ErrorNote>Für heute liegt noch keine Zusammenfassung vor.</ErrorNote>
      )}

      {result.status === "live" && summary.length > 0 && (
        <>
          <p className="mb-4 text-xs text-muted">{fmtDatum.format(new Date(summary[0].datum))}</p>
          <ol className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {summary.map((entry, i) => (
              <li key={entry.thema} className="flex gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm leading-relaxed text-foreground/90">
                  <span className="font-medium text-foreground">{entry.thema}:</span> {entry.snippet}
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </WidgetCard>
  );
}
