import CountUp from "@/components/CountUp";

type StatTileProps = {
  label: string;
  value: number;
  prefix?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
};

/**
 * Einzelne Kennzahl im KPI-Stil — Wert bewusst in Textfarbe, nicht im
 * Akzentgrün, mit Countup-Animation beim ersten Rendern. Lange Werte
 * (z. B. Euro-Beträge mit Cent) bekommen automatisch die kleinere
 * Fluid-Stufe, damit in der Drittel-Spalte nichts abschneidet.
 */
export default function StatTile({
  label,
  value,
  prefix = "",
  minFractionDigits = 0,
  maxFractionDigits = 0,
}: StatTileProps) {
  const formattedLength = (
    prefix +
    new Intl.NumberFormat("de-AT", {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: Math.max(minFractionDigits, maxFractionDigits),
    }).format(value)
  ).length;
  const sizeClass = formattedLength > 8 ? "text-stat-sm" : "text-stat";

  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p
        className={`mt-1.5 whitespace-nowrap font-mono ${sizeClass} font-semibold tabular-nums tracking-tight text-foreground`}
      >
        <CountUp
          value={value}
          prefix={prefix}
          minFractionDigits={minFractionDigits}
          maxFractionDigits={maxFractionDigits}
        />
      </p>
    </div>
  );
}
