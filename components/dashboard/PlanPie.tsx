"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type PlanSlice = { name: string; value: number };

// Monochrom: Graustufen-Abstufung statt Farben — hell → dunkel je Segment.
const SHADES = ["#e5e5e5", "#a3a3a8", "#6b6b70", "#48484c", "#2c2c30"];

const nf = new Intl.NumberFormat("de-AT");

type TipProps = {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PlanSlice }>;
};

function PieTip({ active, payload, total }: TipProps & { total: number }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0];
  const pct = total > 0 ? (slice.value / total) * 100 : 0;
  return (
    <div className="rounded-md border border-line bg-raised px-2.5 py-1.5 text-xs shadow-lg">
      <p className="text-muted">{slice.name}</p>
      <p className="font-mono font-semibold tabular-nums text-foreground">
        {nf.format(slice.value)}
        <span className="ml-1.5 font-sans font-normal text-muted">
          {pct.toFixed(1)} %
        </span>
      </p>
    </div>
  );
}

/**
 * Plan-Verteilung als Donut mit monochromer Graustufen-Skala. Mittig die
 * Gesamtsumme, rechts eine Legende mit Zahl + Anteil je Plan. `centerLabel`
 * benennt die Einheit unter der Summe (z. B. „User", „Besuche").
 */
export default function PlanPie({ data, centerLabel = "User" }: { data: PlanSlice[]; centerLabel?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="#0a0a0a"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={SHADES[i % SHADES.length]} />
              ))}
            </Pie>
            <Tooltip content={(props) => <PieTip {...(props as unknown as TipProps)} total={total} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-stat font-semibold tabular-nums text-foreground">
            {nf.format(total)}
          </span>
          <span className="text-[11px] uppercase tracking-[0.12em] text-muted">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {data.map((slice, i) => {
          const pct = total > 0 ? (slice.value / total) * 100 : 0;
          return (
            <li key={slice.name} className="flex items-center gap-3 text-sm">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: SHADES[i % SHADES.length] }}
                aria-hidden="true"
              />
              <span className="flex-1 text-foreground">{slice.name}</span>
              <span className="font-mono tabular-nums text-foreground">{nf.format(slice.value)}</span>
              <span className="w-14 text-right font-mono tabular-nums text-muted">
                {pct.toFixed(1)} %
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
