import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { buildDelta, loadBriefingHistory, type DeltaStatus } from "@/lib/briefing";

const fmtDatum = new Intl.DateTimeFormat("de-AT", {
  dateStyle: "medium",
  timeZone: "Europe/Vienna",
});

const STATUS_LABEL: Record<DeltaStatus, string> = {
  neu: "Neu",
  aktualisiert: "Aktualisiert",
  unveraendert: "Unverändert",
  kein_update: "Kein Update heute",
};

// Monochrom: nur die "frischen" Status (neu/aktualisiert) sind hell/fett,
// die stabilen (unveraendert/kein_update) treten gedämpft zurück.
const STATUS_CLASS: Record<DeltaStatus, string> = {
  neu: "bg-white/10 font-semibold text-foreground",
  aktualisiert: "bg-white/10 font-semibold text-foreground",
  unveraendert: "bg-white/5 font-medium text-muted",
  kein_update: "bg-white/5 font-medium text-muted",
};

function StatusDot({ status }: { status: DeltaStatus }) {
  const fresh = status === "neu" || status === "aktualisiert";
  return (
    <span
      aria-hidden="true"
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${fresh ? "bg-foreground" : "bg-muted/40"}`}
    />
  );
}

/**
 * Vergleicht den neuesten Briefing-Eintrag je Thema mit dem davor — die
 * eigentliche Morgenfrage "was ist neu seit gestern?" statt reiner
 * Themen-Auflistung. Rein aus der vorhandenen Historie berechnet, kein
 * zusätzliches Agent-Feld nötig.
 */
export default async function BriefingDelta() {
  const result = await loadBriefingHistory();
  const entries = result.status === "live" ? buildDelta(result.rows) : [];
  const changedCount = entries.filter((e) => e.status === "neu" || e.status === "aktualisiert").length;

  return (
    <WidgetCard
      title="Seit gestern"
      badge={result.status === "live" ? `${changedCount} ${changedCount === 1 ? "Änderung" : "Änderungen"}` : "Offline"}
      badgeTone={result.status === "live" && changedCount > 0 ? "accent" : "neutral"}
    >
      {result.status === "error" && <ErrorNote>{result.hint}</ErrorNote>}

      {result.status === "live" && (
        <>
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <li key={entry.thema} className="py-3.5 first:pt-0 last:pb-0">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <StatusDot status={entry.status} />
                    <span className="truncate text-sm font-medium text-foreground">{entry.thema}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${STATUS_CLASS[entry.status]}`}
                  >
                    {STATUS_LABEL[entry.status]}
                  </span>
                </div>
                {entry.status === "kein_update" ? (
                  <p className="text-xs text-muted">
                    Letzter Eintrag: {fmtDatum.format(new Date(entry.latest.datum))}
                  </p>
                ) : (
                  <p className="line-clamp-3 text-sm leading-relaxed text-foreground/90">
                    {entry.latest.inhalt}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Vergleich zum jeweils vorherigen Eintrag je Thema · Quelle:{" "}
            <span className="font-mono">dashboard.morning_briefing</span>
          </p>
        </>
      )}
    </WidgetCard>
  );
}
