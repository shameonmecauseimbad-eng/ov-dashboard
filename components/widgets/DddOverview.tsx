import ErrorNote from "@/components/ErrorNote";
import StatTile from "@/components/StatTile";
import WidgetCard from "@/components/WidgetCard";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";

type DddStats = {
  user_count: number;
  trade_count: number;
  umsatz: number;
  updated_at: string | null;
};

type LoadResult =
  | { status: "live"; stats: DddStats }
  | { status: "error"; hint: string };

const number = new Intl.NumberFormat("de-AT");
const euro = new Intl.NumberFormat("de-AT", {
  style: "currency",
  currency: "EUR",
});
const stand = new Intl.DateTimeFormat("de-AT", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Vienna",
});

async function loadStats(): Promise<LoadResult> {
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
      .from("ddd_stats")
      .select("user_count, trade_count, umsatz, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { status: "error", hint: supabaseHint(error.code, error.message, "ddd_stats") };
    }
    if (!data) {
      return { status: "error", hint: "Tabelle „dashboard.ddd_stats“ ist noch leer." };
    }
    return { status: "live", stats: data as DddStats };
  } catch {
    return { status: "error", hint: "Supabase ist gerade nicht erreichbar." };
  }
}

/** DrawdownDiary-Kennzahlen, live aus der Supabase-Tabelle "ddd_stats" (read-only). */
export default async function DddOverview() {
  const result = await loadStats();

  return (
    <WidgetCard
      title="DDD Übersicht"
      badge={result.status === "live" ? "Live" : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "live" ? (
        <>
          <div className="grid grid-cols-3 gap-4">
            <StatTile label="User" value={number.format(result.stats.user_count)} />
            <StatTile label="Trades" value={number.format(result.stats.trade_count)} />
            <StatTile label="Umsatz" value={euro.format(Number(result.stats.umsatz))} />
          </div>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: Supabase · <span className="font-mono">dashboard.ddd_stats</span>
            {result.stats.updated_at &&
              ` · Stand: ${stand.format(new Date(result.stats.updated_at))}`}
          </p>
        </>
      ) : (
        <ErrorNote>{result.hint}</ErrorNote>
      )}
    </WidgetCard>
  );
}
