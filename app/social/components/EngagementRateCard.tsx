"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { engagementRate, socialPct } from "@/lib/social-format";
import { useSocialStats } from "@/lib/useSocialStats";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABEL, type SocialPlatform } from "@/lib/social-types";

type Row = { platform: SocialPlatform; current: number; series: number[] };

/** Minimaler Verlaufs-Strich ohne Achsen — reine weiße Linie, Opacity-Fläche darunter. */
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const w = 160;
  const h = 32;
  const pad = 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const xy = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" aria-hidden="true">
      <polyline
        points={xy.join(" ")}
        fill="none"
        stroke="#e5e5e5"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Engagement-Rate (Likes+Kommentare+Shares / Follower) pro Plattform, mit
 * 30-Tage-Sparkline darunter — reine weiße Linie ohne Farbcodierung.
 */
export default function EngagementRateCard() {
  const { data, isMock } = useSocialStats();

  const rows = useMemo<Row[]>(() => {
    return SOCIAL_PLATFORMS.map((platform) => {
      const series = data.daily.filter((r) => r.platform === platform).slice(-30).map(engagementRate);
      return { platform, current: series[series.length - 1] ?? 0, series };
    });
  }, [data.daily]);

  return (
    <WidgetCard title="Engagement-Rate" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <div className="grid grid-cols-2 gap-5">
        {rows.map(({ platform, current, series }) => (
          <div key={platform} className="min-w-0">
            <p className="truncate text-xs uppercase tracking-[0.12em] text-muted">
              {SOCIAL_PLATFORM_LABEL[platform]}
            </p>
            <p className="mt-1.5 font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">
              {socialPct.format(current)} %
            </p>
            <div className="mt-2">
              <Sparkline points={series} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        (Likes + Kommentare + Shares) / Follower, 30-Tage-Verlauf · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.social_stats_daily</span>}
      </p>
    </WidgetCard>
  );
}
