import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { buildTimeline, firstSentence, loadBriefingHistory } from "@/lib/briefing";

const fmtTag = new Intl.DateTimeFormat("de-AT", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Europe/Vienna",
});

const fmtTagKurz = new Intl.DateTimeFormat("de-AT", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Europe/Vienna",
});

const fmtZeit = new Intl.DateTimeFormat("de-AT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Vienna",
});

// Zweistufig, damit die Leiste nicht zum Textblock wächst: die neuesten
// DETAIL_DAYS Tage zeigen je Eintrag einen Einzeiler, ältere Tage nur noch
// eine kompakte Themen-Zeile (kein Fließtext). MAX_TAGE deckelt das Fenster
// insgesamt auf die nahe Vergangenheit.
const DETAIL_DAYS = 2;
const MAX_TAGE = 10;

export default async function BriefingTimeline() {
  const result = await loadBriefingHistory();
  const days = result.status === "live" ? buildTimeline(result.rows, MAX_TAGE) : [];
  const detailDays = days.slice(0, DETAIL_DAYS);
  const compactDays = days.slice(DETAIL_DAYS);

  return (
    <WidgetCard
      title="Zeitleiste"
      badge={result.status === "live" ? `${days.length} ${days.length === 1 ? "Tag" : "Tage"}` : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "error" && <ErrorNote>{result.hint}</ErrorNote>}

      {result.status === "live" && (
        <div className="space-y-7">
          {/* Neueste Tage: je Eintrag ein Einzeiler statt 3-Zeilen-Block. */}
          {detailDays.map((day) => (
            <div key={day.datum}>
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {fmtTag.format(new Date(day.datum))}
              </p>
              <ul className="relative ml-1.5 space-y-4 border-l border-line pl-5">
                {day.entries.map((entry, i) => (
                  <li key={`${entry.thema}-${i}`} className="relative">
                    <span
                      className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full border-2 border-background bg-foreground"
                      aria-hidden="true"
                    />
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{entry.thema}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                        {fmtZeit.format(new Date(entry.erstellt_am))}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm leading-relaxed text-foreground/70">
                      {firstSentence(entry.inhalt)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Ältere Tage: nur noch Datum + Themen-Chips, kein Fließtext. */}
          {compactDays.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Frühere Tage
              </p>
              <ul className="relative ml-1.5 space-y-3 border-l border-line pl-5">
                {compactDays.map((day) => {
                  const themen = Array.from(new Set(day.entries.map((e) => e.thema)));
                  return (
                    <li key={day.datum} className="relative">
                      <span
                        className="absolute -left-[22px] top-2 h-1.5 w-1.5 rounded-full bg-muted/50"
                        aria-hidden="true"
                      />
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        <span className="mr-1 shrink-0 font-mono text-xs tabular-nums text-muted">
                          {fmtTagKurz.format(new Date(day.datum))}
                        </span>
                        {themen.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-foreground/70"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </WidgetCard>
  );
}
