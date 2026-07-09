"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { rzEur, rzEur4, rzInt } from "@/lib/redzone-format";
import { useRedzoneStats } from "@/lib/useRedzoneStats";

const WINDOW_DAYS = 30;

/**
 * Revenue per Visitor = Umsatz / Besucher über die letzten 30 Tage. Kompakte
 * Stat-Karte, monochrom.
 */
export default function RevenuePerVisitor() {
  const { data, isMock } = useRedzoneStats();

  const { rpv, revenue, visitors } = useMemo(() => {
    const window = data.daily.slice(-WINDOW_DAYS);
    const rev = window.reduce((s, d) => s + d.revenue, 0);
    const vis = window.reduce((s, d) => s + d.visitors, 0);
    return { rpv: vis > 0 ? rev / vis : 0, revenue: rev, visitors: vis };
  }, [data.daily]);

  return (
    <WidgetCard title="Revenue per Visitor" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <p className="text-xs uppercase tracking-[0.12em] text-muted">Ø letzte {WINDOW_DAYS} Tage</p>
      <p className="mt-1.5 font-mono text-stat font-semibold tabular-nums tracking-tight text-foreground">
        {rzEur4.format(rpv)}
      </p>
      <p className="mt-3 text-xs text-muted">
        aus {rzEur.format(revenue)} Umsatz / {rzInt.format(visitors)} Besuchern
      </p>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Quelle: {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.redzone_stats</span>}
      </p>
    </WidgetCard>
  );
}
