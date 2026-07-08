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

/** Minimalistische Plattform-Icons; unbekannte Plattformen bekommen ein Letter-Badge. */
function PlatformIcon({ platform }: { platform: string }) {
  const key = platform.trim().toLowerCase();
  const common = "h-4 w-4 text-foreground";

  if (key === "x" || key === "twitter") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <path d="M5 5 L19 19 M19 5 L5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </svg>
    );
  }
  if (key === "youtube") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <rect x="2.5" y="6" width="19" height="12" rx="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M10.5 9.75 L15 12 L10.5 14.25 Z" fill="currentColor" />
      </svg>
    );
  }
  if (key === "instagram") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.6" cy="7.4" r="1.2" fill="currentColor" />
      </svg>
    );
  }
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded bg-white/10 font-mono text-[10px] font-semibold uppercase text-foreground">
      {key.charAt(0) || "?"}
    </span>
  );
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
                <PlatformIcon platform={row.platform} />
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
