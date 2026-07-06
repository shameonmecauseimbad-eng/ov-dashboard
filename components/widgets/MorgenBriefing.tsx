import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";

type BriefingRow = {
  datum: string;
  thema: string;
  inhalt: string;
  erstellt_am: string;
};

type LoadResult =
  | { status: "live"; entries: BriefingRow[] }
  | { status: "error"; hint: string };

const fmtDatum = new Intl.DateTimeFormat("de-AT", {
  dateStyle: "medium",
  timeZone: "Europe/Vienna",
});

async function loadBriefing(): Promise<LoadResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      status: "error",
      hint: "SUPABASE_URL und SUPABASE_ANON_KEY in .env.local setzen.",
    };
  }

  try {
    const { data, error } = await supabase
      .schema(DASHBOARD_SCHEMA)
      .from("morning_briefing")
      .select("datum, thema, inhalt, erstellt_am")
      .order("datum", { ascending: false })
      .order("erstellt_am", { ascending: false })
      .limit(60);

    if (error) {
      return { status: "error", hint: supabaseHint(error.code, error.message, "morning_briefing") };
    }
    if (!data || data.length === 0) {
      return {
        status: "error",
        hint: "Noch keine Briefings — der Hermes Agent schreibt täglich einen Eintrag pro Thema.",
      };
    }

    // Neuester Eintrag pro Thema (Daten kommen bereits absteigend sortiert)
    const latestPerThema = new Map<string, BriefingRow>();
    for (const row of data as BriefingRow[]) {
      if (!latestPerThema.has(row.thema)) latestPerThema.set(row.thema, row);
    }
    return { status: "live", entries: Array.from(latestPerThema.values()) };
  } catch {
    return { status: "error", hint: "Supabase ist gerade nicht erreichbar." };
  }
}

/**
 * Neuester Briefing-Eintrag pro Thema aus "morning_briefing" (read-only) —
 * geschrieben wird die Tabelle täglich vom Hermes Agent.
 */
export default async function MorgenBriefing() {
  const result = await loadBriefing();

  return (
    <WidgetCard
      title="Morgen-Briefing"
      badge={result.status === "live" ? "Live" : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "live" ? (
        <>
          <ul className="divide-y divide-line">
            {result.entries.map((entry) => (
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
