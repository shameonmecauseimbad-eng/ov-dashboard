import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import BriefingTimelineView, { type TimelineDayVM } from "@/components/widgets/BriefingTimelineView";
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

// Ganzer letzter Monat als Fenster; die neuesten Tage sind detailliert,
// die älteren einklappbar (siehe BriefingTimelineView).
const MAX_TAGE = 31;

/**
 * Chronologische Ereignis-Timeline über alle Themen. Der Server lädt die
 * Historie und bereitet ein rein serialisierbares View-Model auf (alle
 * Datums-/Zeit-Strings hier via Intl formatiert, damit kein Hydration-Drift
 * entsteht); Ausklappen und Markieren übernimmt die Client-Komponente.
 */
export default async function BriefingTimeline() {
  const result = await loadBriefingHistory();
  const days = result.status === "live" ? buildTimeline(result.rows, MAX_TAGE) : [];

  const model: TimelineDayVM[] = days.map((day) => ({
    datum: day.datum,
    labelLang: fmtTag.format(new Date(day.datum)),
    labelKurz: fmtTagKurz.format(new Date(day.datum)),
    entries: day.entries.map((e, i) => ({
      key: `${e.thema}-${i}`,
      thema: e.thema,
      zeit: fmtZeit.format(new Date(e.erstellt_am)),
      snippet: firstSentence(e.inhalt),
    })),
    themen: Array.from(new Set(day.entries.map((e) => e.thema))),
  }));

  return (
    <WidgetCard
      title="Zeitleiste"
      badge={result.status === "live" ? `${days.length} ${days.length === 1 ? "Tag" : "Tage"}` : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "error" ? (
        <ErrorNote>{result.hint}</ErrorNote>
      ) : (
        <BriefingTimelineView days={model} />
      )}
    </WidgetCard>
  );
}
