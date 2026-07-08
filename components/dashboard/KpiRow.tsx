import CountUp from "@/components/CountUp";
import TrendArrow from "@/components/TrendArrow";

export type KpiItem = {
  label: string;
  value: number;
  prefix?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  /** Veränderung zum Vortag in Prozent; null = kein Trend anzeigbar. */
  trendPct: number | null;
  /** true, wenn der Trend mangels Historie nur ein Platzhalter ist. */
  trendPlaceholder?: boolean;
};

const pctFormat = new Intl.NumberFormat("de-AT", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * KPI-Reihe für die Detail-Seiten (Template): große Countup-Zahlen mit
 * Trend-Pfeil vs. Vortag. Wiederverwendbar — nur items übergeben.
 */
export default function KpiRow({ items }: { items: KpiItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4">
      {items.map((item) => {
        const formattedLength = (
          (item.prefix ?? "") +
          new Intl.NumberFormat("de-AT", {
            minimumFractionDigits: item.minFractionDigits ?? 0,
            maximumFractionDigits: Math.max(
              item.minFractionDigits ?? 0,
              item.maxFractionDigits ?? 0
            ),
          }).format(item.value)
        ).length;
        const sizeClass = formattedLength > 8 ? "text-stat-sm" : "text-stat";
        const up = (item.trendPct ?? 0) >= 0;

        return (
          <div key={item.label} className="min-w-0">
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{item.label}</p>
            <p
              className={`mt-1.5 whitespace-nowrap font-mono ${sizeClass} font-semibold tabular-nums tracking-tight text-foreground`}
            >
              <CountUp
                value={item.value}
                prefix={item.prefix}
                minFractionDigits={item.minFractionDigits}
                maxFractionDigits={item.maxFractionDigits}
              />
            </p>
            {item.trendPct !== null && (
              <p
                className={`mt-1.5 flex items-center gap-1.5 font-mono text-xs tabular-nums ${
                  up ? "text-accent" : "text-danger-soft"
                }`}
              >
                <TrendArrow up={up} />
                {up ? "+" : ""}
                {pctFormat.format(item.trendPct)} %
                <span className="font-sans text-muted">
                  vs. Vortag{item.trendPlaceholder && " · Platzhalter"}
                </span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
