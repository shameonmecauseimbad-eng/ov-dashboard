import { cache } from "react";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";

export type BriefingRow = {
  datum: string;
  thema: string;
  inhalt: string;
  erstellt_am: string;
};

export type BriefingLoadResult =
  | { status: "live"; rows: BriefingRow[] }
  | { status: "error"; hint: string };

/**
 * Lädt die Briefing-Historie aus "dashboard.morning_briefing" (read-only,
 * Hermes Agent befüllt täglich). Mit React `cache()` gewrappt, damit mehrere
 * Briefing-Widgets auf derselben Seite (Kurzfassung, Delta, Detail) sich
 * einen einzigen Supabase-Request pro Request teilen statt dreifach zu laden.
 */
export const loadBriefingHistory = cache(async (): Promise<BriefingLoadResult> => {
  const supabase = getSupabase();
  if (!supabase) {
    return { status: "error", hint: "SUPABASE_URL und SUPABASE_ANON_KEY in .env.local setzen." };
  }

  try {
    const { data, error } = await supabase
      .schema(DASHBOARD_SCHEMA)
      .from("morning_briefing")
      .select("datum, thema, inhalt, erstellt_am")
      .order("datum", { ascending: false })
      .order("erstellt_am", { ascending: false })
      .limit(120);

    if (error) {
      return { status: "error", hint: supabaseHint(error.code, error.message, "morning_briefing") };
    }
    if (!data || data.length === 0) {
      return {
        status: "error",
        hint: "Noch keine Briefings — der Hermes Agent schreibt täglich einen Eintrag pro Thema.",
      };
    }
    return { status: "live", rows: data as BriefingRow[] };
  } catch {
    return { status: "error", hint: "Supabase ist gerade nicht erreichbar." };
  }
});

/** Neuester Eintrag pro Thema (rows kommen bereits datum+erstellt_am absteigend sortiert). */
export function latestPerThema(rows: BriefingRow[]): BriefingRow[] {
  const map = new Map<string, BriefingRow>();
  for (const row of rows) {
    if (!map.has(row.thema)) map.set(row.thema, row);
  }
  return Array.from(map.values());
}

// ─── TL;DR ───────────────────────────────────────────────────────────────────

export type SummaryEntry = { thema: string; snippet: string; datum: string };

/**
 * Kurzfassung des aktuellsten Tages: erster Satz je Thema, deterministisch
 * aus dem Inhalt extrahiert (keine zusätzliche AI-Zusammenfassung nötig).
 */
export function buildDailySummary(rows: BriefingRow[], maxEntries = 8): SummaryEntry[] {
  if (rows.length === 0) return [];
  const latestDatum = rows[0].datum;
  const seen = new Set<string>();
  const out: SummaryEntry[] = [];

  for (const row of rows) {
    if (row.datum !== latestDatum || seen.has(row.thema)) continue;
    seen.add(row.thema);

    const trimmed = row.inhalt.trim();
    const firstSentenceMatch = trimmed.match(/^.*?[.!?](?=\s|$)/);
    const firstSentence = firstSentenceMatch ? firstSentenceMatch[0] : trimmed;
    const snippet = firstSentence.length > 140 ? `${firstSentence.slice(0, 137)}…` : firstSentence;

    out.push({ thema: row.thema, snippet, datum: row.datum });
    if (out.length >= maxEntries) break;
  }
  return out;
}

// ─── "Seit gestern"-Delta ────────────────────────────────────────────────────

export type DeltaStatus = "neu" | "aktualisiert" | "unveraendert" | "kein_update";

export type DeltaEntry = {
  thema: string;
  status: DeltaStatus;
  latest: BriefingRow;
  previous?: BriefingRow;
};

const STATUS_RANK: Record<DeltaStatus, number> = {
  neu: 0,
  aktualisiert: 1,
  kein_update: 2,
  unveraendert: 3,
};

/**
 * Vergleicht je Thema den neuesten Eintrag mit dem davor. "kein_update"
 * heißt: das Thema hat heute (= aktuellstes Datum in der Historie) gar
 * keinen neuen Eintrag bekommen — sein letzter Stand ist älter.
 */
export function buildDelta(rows: BriefingRow[]): DeltaEntry[] {
  if (rows.length === 0) return [];
  const latestDatum = rows[0].datum;

  const byThema = new Map<string, BriefingRow[]>();
  for (const row of rows) {
    const list = byThema.get(row.thema);
    if (list) list.push(row);
    else byThema.set(row.thema, [row]);
  }

  const entries: DeltaEntry[] = [];
  for (const [thema, list] of Array.from(byThema.entries())) {
    const [latest, previous] = list; // bereits datum+erstellt_am absteigend sortiert
    let status: DeltaStatus;
    if (latest.datum !== latestDatum) status = "kein_update";
    else if (!previous) status = "neu";
    else if (previous.inhalt.trim() === latest.inhalt.trim()) status = "unveraendert";
    else status = "aktualisiert";
    entries.push({ thema, status, latest, previous });
  }

  return entries.sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.thema.localeCompare(b.thema, "de")
  );
}

// ─── Ereignis-Timeline ───────────────────────────────────────────────────────

export type TimelineDay = { datum: string; entries: BriefingRow[] };

/**
 * Gruppiert die Historie chronologisch nach Tag (neuester zuerst), innerhalb
 * eines Tages nach Eingang (erstellt_am absteigend). Grundlage für die
 * vertikale Ereignis-Timeline über alle Themen hinweg.
 */
export function buildTimeline(rows: BriefingRow[], maxDays = 14): TimelineDay[] {
  const byDatum = new Map<string, BriefingRow[]>();
  for (const row of rows) {
    const list = byDatum.get(row.datum);
    if (list) list.push(row);
    else byDatum.set(row.datum, [row]);
  }
  return Array.from(byDatum.entries())
    .map(([datum, entries]) => ({ datum, entries }))
    .slice(0, maxDays);
}
