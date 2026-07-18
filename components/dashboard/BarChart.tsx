"use client";

import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarDatum = { label: string; value: number; highlight?: boolean };

type BarChartProps = {
  data: BarDatum[];
  /** Präfix vor dem Wert (Tooltip + Balken-Label), z. B. "€ ". */
  valuePrefix?: string;
  /** Nachkommastellen für Werte (Standard 0). */
  fractionDigits?: number;
  height?: number;
};

// Monochrom: hervorgehobener Balken hell, restliche gedämpftes Grau
// (Unterscheidung über Helligkeit statt Farbton — Dashboard-Designregel).
const MAIN = "#e5e5e5";
const MUTED = "#6b6b70";

type TipProps = {
  active?: boolean;
  payload?: Array<{ value: number; payload: BarDatum }>;
  formatValue: (v: number) => string;
};

function BarTip({ active, payload, formatValue }: TipProps) {
  if (!active || !payload?.length) return null;
  const bar = payload[0];
  return (
    <div className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs shadow-lg">
      <p className="mb-0.5 text-muted">{bar.payload.label}</p>
      <p className="font-mono font-semibold tabular-nums text-foreground">{formatValue(bar.value)}</p>
    </div>
  );
}

/**
 * Monochromer Balken-Chart (Template): ein hervorgehobener Balken hell, der
 * Rest gedämpft. Wert-Label über jedem Balken, Hover-Tooltip. Für Kategorie-
 * Vergleiche (Paket-Preise, Extras-Preise …).
 */
export default function BarChart({ data, valuePrefix = "", fractionDigits = 0, height = 260 }: BarChartProps) {
  const nf = new Intl.NumberFormat("de-AT", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  const formatValue = (v: number) => `${valuePrefix}${nf.format(v)}`;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 22, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={(v: number) => nf.format(v)}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.05)" }}
            content={(props) => <BarTip {...(props as unknown as TipProps)} formatValue={formatValue} />}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={72}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.highlight ? MAIN : MUTED} />
            ))}
            <LabelList
              dataKey="value"
              position="top"
              formatter={(v) => formatValue(Number(v))}
              style={{ fill: "#8f8f94", fontSize: 11, fontFamily: "var(--font-geist-mono, monospace)" }}
            />
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
