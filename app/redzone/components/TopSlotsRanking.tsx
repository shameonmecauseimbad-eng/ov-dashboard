"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { rzEur, rzInt } from "@/lib/redzone-format";
import { useRedzoneStats } from "@/lib/useRedzoneStats";

/**
 * Top-5-Platzierungen nach Umsatz. Rang links in großer, dünner Typo (analog
 * zum Social-Top-Content-Ranking). Monochrom.
 */
export default function TopSlotsRanking() {
  const { data, isMock } = useRedzoneStats();
  const top = useMemo(() => data.slots.slice(0, 5), [data.slots]);

  return (
    <WidgetCard title="Top-Slots" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      {top.length === 0 ? (
        <p className="text-xs text-muted">Keine Platzierungen vorhanden.</p>
      ) : (
        <ul className="divide-y divide-line">
          {top.map((slot, i) => (
            <li key={slot.slot_id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="w-8 shrink-0 text-right font-display text-2xl font-light tabular-nums text-muted/70">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{slot.slot_name}</p>
                <p className="mt-0.5 text-xs text-muted">{rzInt.format(slot.impressions)} Impressions</p>
              </div>
              <span className="shrink-0 text-right">
                <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
                  {rzEur.format(slot.revenue)}
                </span>
                <span className="block text-[11px] uppercase tracking-[0.1em] text-muted">Umsatz</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Umsatzstärkste Platzierungen (90 Tage) · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.redzone_stats</span>}
      </p>
    </WidgetCard>
  );
}
