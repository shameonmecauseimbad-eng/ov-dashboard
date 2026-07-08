import CountUp from "@/components/CountUp";
import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";

type SocialRow = {
  platform: string;
  followers: number;
  views_24h: number;
  updated_at: string | null;
};

type LoadResult =
  | { status: "live"; rows: SocialRow[] }
  | { status: "error"; hint: string };

async function loadSocialStats(): Promise<LoadResult> {
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
      .from("social_stats")
      .select("platform, followers, views_24h, updated_at")
      .order("followers", { ascending: false });

    if (error) {
      return { status: "error", hint: supabaseHint(error.code, error.message, "social_stats") };
    }
    if (!data || data.length === 0) {
      return {
        status: "error",
        hint: "Noch keine Plattform-Daten — der Hermes Agent befüllt „social_stats“ später per Cron.",
      };
    }
    return { status: "live", rows: data as SocialRow[] };
  } catch {
    return { status: "error", hint: "Supabase ist gerade nicht erreichbar." };
  }
}

function platformLabel(platform: string): string {
  const key = platform.trim().toLowerCase();
  if (key === "x" || key === "twitter") return "X";
  if (key === "youtube") return "YouTube";
  if (key === "instagram") return "Instagram";
  if (key === "tiktok") return "TikTok";
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

/**
 * Plattform-Badge: erster Buchstabe des Labels in einem kleinen Quadrat.
 * Bewusst SVG-frei (wie die übrigen Server-Widgets) — server-gerendertes
 * inline-SVG im Multi-Column-Layout löst in Safari einen Repaint-Bug aus,
 * bei dem die ganze Karte beim Hover verschwindet.
 */
function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded bg-white/10 font-mono text-[10px] font-semibold uppercase text-foreground">
      {platformLabel(platform).charAt(0) || "?"}
    </span>
  );
}

/**
 * Follower & 24h-Views pro Plattform aus "social_stats" — Frontend liest nur;
 * geschrieben wird die Tabelle später vom Hermes Agent per Cron.
 */
export default async function SocialMedia() {
  const result = await loadSocialStats();

  return (
    <WidgetCard
      title="Social Media"
      badge={result.status === "live" ? "Live" : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "live" ? (
        <>
          <ul className="divide-y divide-line">
            {result.rows.map((row) => (
              <li key={row.platform} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <PlatformBadge platform={row.platform} />
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                  {platformLabel(row.platform)}
                </span>
                <span className="w-24 text-right">
                  <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
                    <CountUp value={row.followers} />
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.1em] text-muted">
                    Follower
                  </span>
                </span>
                <span className="w-24 text-right">
                  <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
                    <CountUp value={row.views_24h} />
                  </span>
                  <span className="block text-[11px] uppercase tracking-[0.1em] text-muted">
                    Views 24h
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: Supabase · <span className="font-mono">dashboard.social_stats</span> · Befüllung: Hermes Agent (Cron)
          </p>
        </>
      ) : (
        <ErrorNote>{result.hint}</ErrorNote>
      )}
    </WidgetCard>
  );
}
