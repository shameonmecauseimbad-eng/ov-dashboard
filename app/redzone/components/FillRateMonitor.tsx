"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { rzInt, rzPct } from "@/lib/redzone-format";
import { useRedzoneStats } from "@/lib/useRedzoneStats";

/**
 * Fill-Rate + Impressions-Monitor. Fill-Rate als monochromer Prozent-Balken
 * (weiße Füllung auf gedämpftem Track), Impressions als Kennzahl daneben.
 * Basis: jüngster Tag, plus 30-Tage-Mittel der Fill-Rate als Kontext.
 */
export default function FillRateMonitor() {
  const { data, isMock } = useRedzoneStats();

  const { fillRate, impressions, avg30 } = useMemo(() => {
    const latest = data.daily[data.daily.length - 1];
    const window = data.daily.slice(-30);
    const avg = window.reduce((s, d) => s + d.fill_rate, 0) / (window.length || 1);
    return { fillRate: latest?.fill_rate ?? 0, impressions: latest?.impressions ?? 0, avg30: avg };
  }, [data.daily]);

  return (
    <WidgetCard title="Fill-Rate & Impressions" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Fill-Rate heute</p>
        <p className="font-mono text-sm tabular-nums text-muted">Ø 30 T: {rzPct.format(avg30)} %</p>
      </div>
      <p className="mt-1.5 font-mono text-stat font-semibold tabular-nums tracking-tight text-foreground">
        {rzPct.format(fillRate)} %
      </p>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        <div className="h-full rounded-full bg-white/80" style={{ width: `${Math.min(100, fillRate)}%` }} />
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs uppercase tracking-[0.12em] text-muted">Impressions heute</p>
        <p className="font-mono text-sm font-semibold tabular-nums text-foreground">{rzInt.format(impressions)}</p>
      </div>
      <p className="mt-4 text-xs text-muted">
        Quelle: {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.redzone_stats</span>}
      </p>
    </WidgetCard>
  );
}
