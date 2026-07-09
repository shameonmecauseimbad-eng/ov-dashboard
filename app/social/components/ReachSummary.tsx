"use client";

import { useMemo } from "react";
import CountUp from "@/components/CountUp";
import WidgetCard from "@/components/WidgetCard";
import { socialInt } from "@/lib/social-format";
import { useSocialStats } from "@/lib/useSocialStats";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABEL, type SocialPlatform } from "@/lib/social-types";

const WINDOW_DAYS = 30;

// Monochrom: YouTube = durchgezogene Fläche, Instagram = Streifenmuster —
// die Plattform wird über das Muster erkennbar, nicht über den Farbton.
const SEGMENT_CLASS: Record<SocialPlatform, string> = {
  youtube: "bg-white/70",
  instagram:
    "bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.7)_0px,rgba(255,255,255,0.7)_3px,transparent_3px,transparent_7px)]",
};

/**
 * Hero-Kachel: Gesamtreichweite (Views, 30 Tage) über beide Plattformen
 * summiert, darunter ein Split-Balken der Verteilung — Muster statt Farbe.
 */
export default function ReachSummary() {
  const { data, isMock } = useSocialStats();

  const byPlatform = useMemo(() => {
    return SOCIAL_PLATFORMS.map((platform) => ({
      platform,
      views: data.daily.filter((r) => r.platform === platform).slice(-WINDOW_DAYS).reduce((sum, r) => sum + r.views, 0),
    }));
  }, [data.daily]);

  const total = byPlatform.reduce((sum, p) => sum + p.views, 0);

  return (
    <WidgetCard
      title="Cross-Platform Reach"
      badge={isMock ? "Mock-Daten" : "Live"}
      badgeTone={isMock ? "neutral" : "accent"}
    >
      <p className="text-xs uppercase tracking-[0.12em] text-muted">Gesamtreichweite, {WINDOW_DAYS} Tage</p>
      <p className="mt-1.5 font-mono text-stat-lg font-semibold tabular-nums tracking-tight text-foreground">
        <CountUp value={total} />
      </p>

      <div className="mt-6 flex h-2 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        {byPlatform.map(({ platform, views }) => (
          <span
            key={platform}
            className={SEGMENT_CLASS[platform]}
            style={{ width: total > 0 ? `${(views / total) * 100}%` : "0%" }}
          />
        ))}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {byPlatform.map(({ platform, views }) => (
          <li key={platform} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${SEGMENT_CLASS[platform]}`} aria-hidden="true" />
            <span className="text-foreground">{SOCIAL_PLATFORM_LABEL[platform]}</span>
            <span className="font-mono tabular-nums text-muted">
              {socialInt.format(views)} ({total > 0 ? ((views / total) * 100).toFixed(0) : "0"} %)
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Views je Plattform, letzte {WINDOW_DAYS} Tage · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.social_stats_daily</span>}
      </p>
    </WidgetCard>
  );
}
