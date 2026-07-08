"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SeriesLine = {
  key: string;
  label: string;
  /** true = gestrichelt + gedämpftes Grau (zweite/Neben-Serie). */
  muted?: boolean;
  prefix?: string;
};

type MultiLineChartProps = {
  data: Array<Record<string, number | string>>;
  /** Schlüssel der X-Achsen-Kategorie (z. B. "label"). */
  xKey: string;
  lines: SeriesLine[];
  height?: number;
};

const nf = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 0 });

// Monochrom: Hauptserie hell/durchgezogen, Nebenserie gedämpft/gestrichelt.
const MAIN = "#e5e5e5";
const MUTED = "#8f8f94";

type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ dataKey: string; value: number; name: string; color: string }>;
};

function ChartTip({ active, payload, label, lines }: TipProps & { lines: SeriesLine[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs shadow-lg">
      <p className="mb-1 text-muted">{label}</p>
      {payload.map((p) => {
        const line = lines.find((l) => l.key === p.dataKey);
        return (
          <p key={p.dataKey} className="flex items-center gap-2 font-mono tabular-nums text-foreground">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
              aria-hidden="true"
            />
            <span className="font-sans text-muted">{line?.label ?? p.name}:</span>
            {line?.prefix ?? ""}
            {nf.format(p.value)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Mehrlinien-Zeitverlauf (Template): eine helle Hauptlinie, weitere Serien
 * gedämpft/gestrichelt — Unterscheidung über Helligkeit und Strichmuster
 * statt Farbe. Legende unten, Hover-Tooltip mit allen Serienwerten.
 */
export default function MultiLineChart({ data, xKey, lines, height = 260 }: MultiLineChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            allowDecimals={false}
            tickFormatter={(v: number) => nf.format(v)}
          />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.15)" }}
            content={(props) => <ChartTip {...(props as unknown as TipProps)} lines={lines} />}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 11, color: MUTED, paddingTop: 8 }}
            formatter={(value) => <span style={{ color: MUTED }}>{value}</span>}
          />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.muted ? MUTED : MAIN}
              strokeWidth={2}
              strokeDasharray={line.muted ? "4 3" : undefined}
              dot={false}
              activeDot={{ r: 4, stroke: "#0a0a0a", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
