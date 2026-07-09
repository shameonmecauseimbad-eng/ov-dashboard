"use client";

import { useMemo } from "react";
import TrendArrow from "@/components/TrendArrow";
import WidgetCard from "@/components/WidgetCard";
import { useSocialStats } from "@/lib/useSocialStats";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABEL, type SocialPlatform } from "@/lib/social-types";

type Rate = { platform: SocialPlatform; pct: number | null; up: boolean };

/**
 * Wachstumsrate Woche-über-Woche je Plattform. Monochrom-Regel: Wachstum vs.
 * Rückgang unterscheidet sich über Font-Weight (bold vs. regular), nicht über
 * Farbe — der Trendpfeil trägt die Richtung.
 */
export default function GrowthRateCard() {
  const { data, isMock } = useSocialStats();

  const rates = useMemo<Rate[]>(() => {
    return SOCIAL_PLATFORMS.map((platform) => {
      const rows = data.daily.filter((r) => r.platform === platform);
      if (rows.length < 8) return { platform, pct: null, up: true };
      const latest = rows[rows.length - 1];
      const weekAgo = rows[rows.length - 8];
      const pct = weekAgo.followers > 0 ? ((latest.followers - weekAgo.followers) / weekAgo.followers) * 100 : null;
      return { platform, pct, up: (pct ?? 0) >= 0 };
    });
  }, [data.daily]);

  return (
    <WidgetCard title="Wachstumsrate" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <div className="grid grid-cols-2 gap-5">
        {rates.map(({ platform, pct, up }) => (
          <div key={platform} className="min-w-0 text-center">
            <p className="truncate text-xs uppercase tracking-[0.12em] text-muted">
              {SOCIAL_PLATFORM_LABEL[platform]}
            </p>
            <p
              className={`mt-1.5 flex items-center justify-center gap-1.5 font-mono text-stat-sm tabular-nums tracking-tight ${
                up ? "font-bold text-foreground" : "font-normal text-muted"
              }`}
            >
              {pct === null ? (
                "—"
              ) : (
                <>
                  <TrendArrow up={up} />
                  {`${up ? "+" : ""}${pct.toFixed(1)} %`}
                </>
              )}
            </p>
            <p className="mt-1 text-[11px] text-muted">ggü. Vorwoche</p>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Follower-Veränderung Woche-über-Woche · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.social_stats_daily</span>}
      </p>
    </WidgetCard>
  );
}
