"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type TrendMetric = {
  key: string;
  label: string;
  prefix?: string;
};

export type TrendPoint = Record<string, number | string>;

type TrendChartProps = {
  series: TrendPoint[];
  metrics: TrendMetric[];
  /** true = synthetischer Verlauf, weil noch keine echte Historie existiert. */
  placeholder?: boolean;
};

const numberFormat = new Intl.NumberFormat("de-AT", { maximumFractionDigits: 0 });

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-accent-dim text-accent"
          : "bg-white/5 text-muted hover:bg-white/10 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Zeitverlauf-Linienchart (Template für alle Detail-Seiten): eine Linie,
 * eine Achse — Metriken mit unterschiedlichen Skalen werden umgeschaltet
 * statt auf eine zweite Y-Achse gelegt. Filter-Chips in einer Reihe oben,
 * Hover-Tooltip mit Wert + Datum.
 */
export default function TrendChart({ series, metrics, placeholder }: TrendChartProps) {
  const [range, setRange] = useState<7 | 30>(30);
  const [metricKey, setMetricKey] = useState(metrics[0]?.key ?? "");
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0];
  const data = series.slice(-range);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip active={range === 7} onClick={() => setRange(7)}>
          7 Tage
        </Chip>
        <Chip active={range === 30} onClick={() => setRange(30)}>
          30 Tage
        </Chip>
        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
        {metrics.map((m) => (
          <Chip key={m.key} active={m.key === metric.key} onClick={() => setMetricKey(m.key)}>
            {m.label}
          </Chip>
        ))}
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#8f8f94", fontSize: 11 }}
              axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "#8f8f94", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(value: number) => numberFormat.format(value)}
            />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const value = Number(payload[0].value);
                return (
                  <div className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs">
                    <p className="text-muted">{label}</p>
                    <p className="font-mono font-semibold tabular-nums text-foreground">
                      {metric.prefix ?? ""}
                      {numberFormat.format(value)}
                      <span className="ml-1.5 font-sans font-normal text-muted">
                        {metric.label}
                      </span>
                    </p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey={metric.key}
              stroke="#e5e5e5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#121214", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {placeholder && (
        <p className="mt-3 text-xs text-muted">
          Platzhalter-Verlauf — die echte Historie entsteht, sobald der Hermes Agent
          täglich Einträge schreibt.
        </p>
      )}
    </div>
  );
}
