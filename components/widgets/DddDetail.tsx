import CountUp from "@/components/CountUp";
import MultiLineChart from "@/components/dashboard/MultiLineChart";
import PlanPie, { type PlanSlice } from "@/components/dashboard/PlanPie";
import ErrorNote from "@/components/ErrorNote";
import Reveal from "@/components/Reveal";
import WidgetCard from "@/components/WidgetCard";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";
import { loadStripe } from "@/lib/stripe";

// ─── DDD-Datenquelle ─────────────────────────────────────────────────────────
// Gesamt-User + Plan-Verteilung kommen über die Aggregat-RPC
// public.get_user_stats() → { total, free, pro, lifetime }. Bewusst KEIN
// direkter SELECT auf public.users: die Tabelle enthält E-Mails u. a. PII, und
// der Anon-Key ist konzeptionell öffentlich. Die RPC (SECURITY DEFINER, nur
// GRANT EXECUTE auf anon) gibt ausschließlich Aggregate zurück — keine PII
// verlässt die DB. Seitenaufrufe kommen weiterhin aus dashboard.page_views.
const PAGE_VIEWS_TS_COL = "viewed_at"; // Zeitstempel-Spalte von dashboard.page_views

const TZ = "Europe/Vienna";
const int = new Intl.NumberFormat("de-AT");
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("de-AT", { timeZone: TZ, day: "numeric", month: "numeric" });
const dayFull = new Intl.DateTimeFormat("de-AT", { timeZone: TZ, weekday: "short", day: "numeric", month: "long" });
const dateFull = new Intl.DateTimeFormat("de-AT", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });

const euro = (currency: string) =>
  new Intl.NumberFormat("de-AT", { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: 0 });

// ─── Datenlader ──────────────────────────────────────────────────────────────

type PageViews = {
  today: number;
  total: number; // Gesamtzahl aller Aufrufe (all-time)
  firstSeen: string | null; // ältester viewed_at (ISO) — Start des Trackings
  daysWithData: number; // Tage im 30-Tage-Fenster mit ≥1 Aufruf
  series: Array<{ label: string; full: string; views: number }>;
};

export async function loadPageViews(): Promise<{ data: PageViews } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "SUPABASE_URL und SUPABASE_ANON_KEY in .env.local setzen." };

  const now = Date.now();
  const days: Array<{ key: string; label: string; full: string; views: number }> = [];
  const idx = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    idx.set(dayKey.format(d), days.length);
    days.push({ key: dayKey.format(d), label: dayLabel.format(d), full: dayFull.format(d), views: 0 });
  }

  try {
    const since = new Date(now - 31 * 86_400_000).toISOString();
    // Fenster-Query (für Serie/heute) + all-time Gesamtzahl & ältester Eintrag parallel.
    const [windowRes, firstRes] = await Promise.all([
      supabase.schema(DASHBOARD_SCHEMA).from("page_views").select(PAGE_VIEWS_TS_COL).gte(PAGE_VIEWS_TS_COL, since),
      supabase
        .schema(DASHBOARD_SCHEMA)
        .from("page_views")
        .select(PAGE_VIEWS_TS_COL, { count: "exact" })
        .order(PAGE_VIEWS_TS_COL, { ascending: true })
        .limit(1),
    ]);

    if (windowRes.error) return { error: supabaseHint(windowRes.error.code, windowRes.error.message, "page_views") };

    for (const row of (windowRes.data ?? []) as Record<string, string>[]) {
      const ts = row[PAGE_VIEWS_TS_COL];
      if (!ts) continue;
      const i = idx.get(dayKey.format(new Date(ts)));
      if (i !== undefined) days[i].views++;
    }

    const daysWithData = days.filter((d) => d.views > 0).length;
    const firstSeen = (firstRes.data?.[0] as Record<string, string> | undefined)?.[PAGE_VIEWS_TS_COL] ?? null;
    const total = firstRes.count ?? (windowRes.data?.length ?? 0);

    return {
      data: {
        today: days[days.length - 1].views,
        total,
        firstSeen,
        daysWithData,
        series: days.map((d) => ({ label: d.label, full: d.full, views: d.views })),
      },
    };
  } catch {
    return { error: "Supabase (page_views) ist gerade nicht erreichbar." };
  }
}

type DddUsers = {
  total: number;
  plan: PlanSlice[];
};

// Rückgabe der RPC public.get_user_stats().
type UserStats = { total: number; free: number; pro: number; lifetime: number };

export async function loadDddUsers(): Promise<{ data: DddUsers } | { error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "SUPABASE_URL und SUPABASE_ANON_KEY in .env.local setzen." };

  try {
    const { data, error } = await supabase.rpc("get_user_stats");
    if (error) {
      return {
        error:
          `${supabaseHint(error.code, error.message, "get_user_stats")} ` +
          `— RPC public.get_user_stats() muss existieren und für anon ausführbar sein ` +
          `(GRANT EXECUTE ON FUNCTION public.get_user_stats() TO anon).`,
      };
    }

    const s = (data ?? {}) as Partial<UserStats>;
    // Nur Slices mit Wert > 0 in den Pie (Lifetime = 0 wird ausgeblendet).
    const plan: PlanSlice[] = [
      { name: "Free", value: s.free ?? 0 },
      { name: "Pro", value: s.pro ?? 0 },
      { name: "Lifetime", value: s.lifetime ?? 0 },
    ].filter((p) => p.value > 0);

    return { data: { total: s.total ?? 0, plan } };
  } catch {
    return { error: "Supabase (DDD-User) ist gerade nicht erreichbar." };
  }
}

// ─── Bausteine ───────────────────────────────────────────────────────────────

export function KpiTile({
  label,
  value,
  prefix,
  currency,
  missing,
}: {
  label: string;
  value?: number;
  prefix?: string;
  currency?: string;
  missing?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      {missing || value === undefined ? (
        <p className="mt-1.5 font-mono text-stat font-semibold text-muted">—</p>
      ) : currency ? (
        <p className="mt-1.5 whitespace-nowrap font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">
          {euro(currency).format(value)}
        </p>
      ) : (
        <p className="mt-1.5 whitespace-nowrap font-mono text-stat font-semibold tabular-nums tracking-tight text-foreground">
          <CountUp value={value} prefix={prefix} />
        </p>
      )}
      {missing && <p className="mt-1.5 text-[11px] text-muted">{missing}</p>}
    </div>
  );
}

export function SectionNote({ children }: { children: React.ReactNode }) {
  return <p className="mt-5 border-t border-line pt-4 text-xs text-muted">{children}</p>;
}

// ─── Widget-Inhalt (async: lädt alle Quellen parallel) ───────────────────────

export default async function DddDetail() {
  const [pv, users, stripe] = await Promise.all([loadPageViews(), loadDddUsers(), loadStripe()]);

  const pvData = "data" in pv ? pv.data : null;
  const usersData = "data" in users ? users.data : null;
  const stripeData = stripe && "mrr" in stripe ? stripe : null;
  const stripeError = stripe && "error" in stripe ? stripe.error : null;
  const stripeMissing = stripe === null;
  const currency = stripeData?.currency ?? "eur";

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1 — KPI-Karten */}
      <WidgetCard title="Kennzahlen" badge="Live" badgeTone="accent">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-4">
          <KpiTile
            label="Gesamt-User"
            value={usersData?.total}
            missing={usersData ? undefined : "Quelle nicht konfiguriert (TODO)"}
          />
          <KpiTile
            label="Monatsumsatz"
            value={stripeData?.monthRevenue}
            currency={currency}
            missing={
              stripeMissing ? "STRIPE_SECRET_KEY setzen" : stripeError ? "Stripe-API-Fehler – Log prüfen" : undefined
            }
          />
          <KpiTile label="Seitenaufrufe heute" value={pvData?.today} />
        </div>
        <SectionNote>
          Quellen: Supabase-RPC (<span className="font-mono">get_user_stats</span>) · Stripe API ·
          <span className="font-mono"> dashboard.page_views</span>
        </SectionNote>
      </WidgetCard>

      {/* 2 — Umsatz-Entwicklung (Stripe MRR/Umsatz) */}
      <Reveal delayMs={100}>
        <WidgetCard
          title="Umsatz-Entwicklung"
          badge={stripeData ? "Live" : "Offline"}
          badgeTone={stripeData ? "accent" : "neutral"}
        >
          {stripeData ? (
            <>
              <div className="mb-5 grid grid-cols-2 gap-4">
                <KpiTile label="MRR aktuell" value={stripeData.mrr} currency={currency} />
                <KpiTile label="Umsatz lfd. Monat" value={stripeData.monthRevenue} currency={currency} />
              </div>
              <MultiLineChart
                data={stripeData.series}
                xKey="label"
                lines={[{ key: "umsatz", label: "Umsatz/Monat", prefix: currency.toUpperCase() === "EUR" ? "€ " : "" }]}
              />
              <SectionNote>Bezahlte Rechnungen pro Monat (12 Monate) · Quelle: Stripe API</SectionNote>
            </>
          ) : (
            <ErrorNote>
              {stripeError ?? "STRIPE_SECRET_KEY in .env.local setzen, um Stripe-Umsätze zu laden."}
            </ErrorNote>
          )}
        </WidgetCard>
      </Reveal>

      {/* 3 — Plan-Verteilung */}
      <Reveal delayMs={150}>
        <WidgetCard
          title="Plan-Verteilung"
          badge={usersData ? "Live" : "Offline"}
          badgeTone={usersData ? "accent" : "neutral"}
        >
          {usersData ? (
            usersData.plan.length > 0 ? (
              <>
                <PlanPie data={usersData.plan} />
                <SectionNote>Free / Pro / Lifetime · Quelle: Supabase-RPC get_user_stats</SectionNote>
              </>
            ) : (
              <ErrorNote>Noch keine User vorhanden.</ErrorNote>
            )
          ) : (
            <ErrorNote>{(users as { error: string }).error}</ErrorNote>
          )}
        </WidgetCard>
      </Reveal>

      {/* 4 — Seitenaufrufe (30 Tage) */}
      <Reveal delayMs={200}>
        <WidgetCard
          title="Seitenaufrufe"
          badge={pvData ? "Live" : "Offline"}
          badgeTone={pvData ? "accent" : "neutral"}
        >
          {pvData ? (
            pvData.daysWithData < 3 ? (
              // Zu wenig Tage mit Daten für eine sinnvolle Kurve → Gesamtzahl groß zeigen.
              <>
                <KpiTile label="Seitenaufrufe gesamt" value={pvData.total} />
                <SectionNote>
                  Noch zu wenig Daten für ein Diagramm — Tracking aktiv seit{" "}
                  {pvData.firstSeen ? dateFull.format(new Date(pvData.firstSeen)) : "—"}.
                </SectionNote>
              </>
            ) : (
              <>
                <MultiLineChart
                  data={pvData.series}
                  xKey="label"
                  lines={[{ key: "views", label: "Aufrufe" }]}
                />
                <SectionNote>
                  Tägliche Aufrufe (30 Tage) · heute {int.format(pvData.today)} · Quelle:{" "}
                  <span className="font-mono">dashboard.page_views</span>
                </SectionNote>
              </>
            )
          ) : (
            <ErrorNote>{(pv as { error: string }).error}</ErrorNote>
          )}
        </WidgetCard>
      </Reveal>
    </div>
  );
}
