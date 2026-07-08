import WidgetCard from "@/components/WidgetCard";
import { KpiTile, SectionNote, loadDddUsers, loadPageViews } from "@/components/widgets/DddDetail";
import { loadStripe } from "@/lib/stripe";

/**
 * Generisches "Kennzahlen"-Widget für das Overview: nur die drei KPIs
 * (Gesamt-User, Monatsumsatz, Seitenaufrufe heute) — ohne DDD-Detailcharts.
 * Lädt seine Quellen eigenständig, damit es unabhängig von der DDD-Seite steht.
 */
export default async function DddKennzahlen() {
  const [pv, users, stripe] = await Promise.all([loadPageViews(), loadDddUsers(), loadStripe()]);

  const pvData = "data" in pv ? pv.data : null;
  const usersData = "data" in users ? users.data : null;
  const stripeData = stripe && "mrr" in stripe ? stripe : null;
  const stripeError = stripe && "error" in stripe ? stripe.error : null;
  const stripeMissing = stripe === null;
  const currency = stripeData?.currency ?? "eur";

  return (
    <WidgetCard title="DDD Statistics" badge="Live" badgeTone="accent">
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
  );
}
