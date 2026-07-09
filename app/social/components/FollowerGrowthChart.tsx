"use client";

import { useMemo, useState } from "react";
import MultiLineChart from "@/components/dashboard/MultiLineChart";
import WidgetCard from "@/components/WidgetCard";
import { useSocialStats } from "@/lib/useSocialStats";
import { SOCIAL_PLATFORM_LABEL } from "@/lib/social-types";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const dayLabel = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "numeric" });

/**
 * Follower-Wachstum pro Plattform als Zeitreihe. Nutzt MultiLineChart (helle
 * durchgezogene Linie für YouTube, gedämpft/gestrichelt für Instagram) — im
 * Monochrom-System trägt das Strichmuster die Plattform, nicht die Farbe.
 */
export default function FollowerGrowthChart() {
  const { data, isMock } = useSocialStats();
  const [range, setRange] = useState<Range>(30);

  const chartData = useMemo(() => {
    const byDate = new Map<string, { label: string; youtube?: number; instagram?: number }>();
    for (const row of data.daily) {
      const entry = byDate.get(row.date) ?? { label: dayLabel.format(new Date(row.date)) };
      entry[row.platform] = row.followers;
      byDate.set(row.date, entry);
    }
    const dates = Array.from(byDate.keys()).sort();
    return dates.slice(-range).map((d) => byDate.get(d)!);
  }, [data.daily, range]);

  return (
    <WidgetCard title="Follower-Wachstum" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <div className="mb-4 flex items-center justify-end gap-1" role="group" aria-label="Zeitraum wählen">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              range === r ? "bg-white/10 font-medium text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {r} T
          </button>
        ))}
      </div>
      <MultiLineChart
        data={chartData}
        xKey="label"
        lines={[
          { key: "youtube", label: SOCIAL_PLATFORM_LABEL.youtube },
          { key: "instagram", label: SOCIAL_PLATFORM_LABEL.instagram, muted: true },
        ]}
      />
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Follower je Plattform, letzte {range} Tage · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.social_stats_daily</span>}
      </p>
    </WidgetCard>
  );
}
