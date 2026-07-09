"use client";

import { useMemo, useState } from "react";
import MultiLineChart from "@/components/dashboard/MultiLineChart";
import WidgetCard from "@/components/WidgetCard";
import { useRedzoneStats } from "@/lib/useRedzoneStats";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

const dayLabel = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "numeric" });

/**
 * Revenue-Trend als Zeitreihe mit 7/30/90-Tage-Toggle. Nutzt MultiLineChart
 * (helle durchgezogene Linie, monochrom). Datenquelle über useRedzoneStats()
 * austauschbar.
 */
export default function RevenueTrendChart() {
  const { data, isMock } = useRedzoneStats();
  const [range, setRange] = useState<Range>(30);

  const chartData = useMemo(
    () =>
      data.daily.slice(-range).map((d) => ({
        label: dayLabel.format(new Date(d.date)),
        revenue: d.revenue,
      })),
    [data.daily, range]
  );

  return (
    <WidgetCard title="Revenue-Trend" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
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
        lines={[{ key: "revenue", label: "Umsatz/Tag", prefix: "€ " }]}
      />
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Ad-Erlöse pro Tag, letzte {range} Tage · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.redzone_stats</span>}
      </p>
    </WidgetCard>
  );
}
