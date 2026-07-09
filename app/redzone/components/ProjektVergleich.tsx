import WidgetCard from "@/components/WidgetCard";
import { generateRedzoneStats } from "@/lib/redzone-mock";
import { rzEur } from "@/lib/redzone-format";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";

type DddResult = { revenue: number; live: true } | { revenue: null; live: false; hint: string };

/**
 * DDD-Umsatz aus dashboard.ddd_stats (jüngster Eintrag). Read-only, wie die
 * übrigen Supabase-Widgets. Fällt sauber auf einen Hinweis zurück, solange das
 * Schema/die Tabelle nicht live ist.
 */
async function loadDddRevenue(): Promise<DddResult> {
  const supabase = getSupabase();
  if (!supabase) return { revenue: null, live: false, hint: "Supabase nicht konfiguriert" };
  try {
    const { data, error } = await supabase
      .schema(DASHBOARD_SCHEMA)
      .from("ddd_stats")
      .select("umsatz, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) return { revenue: null, live: false, hint: supabaseHint(error.code, error.message, "ddd_stats") };
    const row = data?.[0] as { umsatz: number | string } | undefined;
    if (!row) return { revenue: null, live: false, hint: "Tabelle „dashboard.ddd_stats“ ist noch leer." };
    return { revenue: Number(row.umsatz), live: true };
  } catch {
    return { revenue: null, live: false, hint: "Supabase (ddd_stats) ist gerade nicht erreichbar." };
  }
}

// Monochrom: RedzoneEarth = durchgezogene Fläche, DDD = Streifenmuster —
// das Projekt wird über das Muster erkennbar, nicht über den Farbton.
const REDZONE_FILL = "bg-white/70";
const DDD_FILL =
  "bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.7)_0px,rgba(255,255,255,0.7)_3px,transparent_3px,transparent_7px)]";

/**
 * Projektvergleich RedzoneEarth vs. DDD als horizontaler Split-Balken. DDD-
 * Umsatz kommt live aus dashboard.ddd_stats (falls Schema freigeschaltet),
 * RedzoneEarth aus Mock-Daten (90-Tage-Summe), bis der Ad-Provider steht.
 */
export default async function ProjektVergleich() {
  const ddd = await loadDddRevenue();
  const redzoneRevenue = generateRedzoneStats().daily.reduce((s, d) => s + d.revenue, 0);
  const dddRevenue = ddd.live ? ddd.revenue : 0;
  const total = redzoneRevenue + dddRevenue;

  const rows = [
    { key: "redzone", label: "RedzoneEarth", value: redzoneRevenue, fill: REDZONE_FILL, note: "Mock (90 Tage)" },
    { key: "ddd", label: "DrawdownDiary", value: dddRevenue, fill: DDD_FILL, note: ddd.live ? "live" : ddd.hint },
  ];

  return (
    <WidgetCard title="Projektvergleich · Umsatz" badge={ddd.live ? "DDD live" : "DDD offline"} badgeTone={ddd.live ? "accent" : "neutral"}>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]" aria-hidden="true">
        {rows.map((r) => (
          <span key={r.key} className={r.fill} style={{ width: total > 0 ? `${(r.value / total) * 100}%` : "0%" }} />
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-3 text-sm">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${r.fill}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="text-foreground">{r.label}</span>
              <span className="ml-2 text-[11px] uppercase tracking-[0.1em] text-muted">{r.note}</span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-foreground">{rzEur.format(r.value)}</span>
            <span className="w-14 shrink-0 text-right font-mono tabular-nums text-muted">
              {total > 0 ? ((r.value / total) * 100).toFixed(0) : "0"} %
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        RedzoneEarth: Mock-Umsatz · DDD: <span className="font-mono">dashboard.ddd_stats</span>
        {ddd.live ? "" : " (offline)"}
      </p>
    </WidgetCard>
  );
}
