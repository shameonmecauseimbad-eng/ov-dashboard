/**
 * Server-seitiger Stripe-Zugriff, ausschließlich lesend über die REST-API
 * (kein SDK, keine zusätzliche Dependency). Der Secret Key liegt in
 * STRIPE_SECRET_KEY und wird — wie die Supabase-Vars — bewusst OHNE
 * NEXT_PUBLIC-Präfix gehalten: er darf niemals ins Browser-Bundle gelangen.
 * Gibt bei fehlendem Key null zurück, damit die Seite einen Hinweis zeigt.
 */

const STRIPE_API = "https://api.stripe.com/v1";

function getKey(): string | null {
  return process.env.STRIPE_SECRET_KEY ?? null;
}

type StripeList<T> = { data: T[]; has_more: boolean };

async function stripeGet<T>(path: string, key: string): Promise<StripeList<T>> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    // Auf Fetch-Ebene 5 Min. cachen (analog zu den übrigen externen Quellen).
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Stripe HTTP ${res.status}`);
  }
  return (await res.json()) as StripeList<T>;
}

/** Alle Objekte einer Liste durchpaginieren (Cursor via starting_after). */
async function listAll<T extends { id: string }>(
  resource: string,
  query: string,
  key: string,
  maxPages = 12
): Promise<T[]> {
  const out: T[] = [];
  let starting: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const cursor: string = starting ? `&starting_after=${starting}` : "";
    const chunk: StripeList<T> = await stripeGet<T>(
      `/${resource}?limit=100${query}${cursor}`,
      key
    );
    out.push(...chunk.data);
    if (!chunk.has_more || chunk.data.length === 0) break;
    starting = chunk.data[chunk.data.length - 1].id;
  }
  return out;
}

// ── Typen (nur die genutzten Felder) ────────────────────────────────────────
type StripeInvoice = { id: string; amount_paid: number; created: number; currency: string };
type StripeSubscription = {
  id: string;
  status: string;
  items: {
    data: Array<{
      quantity?: number;
      price: { unit_amount: number | null; recurring: { interval: string } | null };
    }>;
  };
};

/** Interval eines Preises auf einen Monatsbetrag normalisieren. */
function toMonthly(amountCents: number, interval: string): number {
  switch (interval) {
    case "year":
      return amountCents / 12;
    case "week":
      return (amountCents * 52) / 12;
    case "day":
      return (amountCents * 365) / 12;
    default: // month
      return amountCents;
  }
}

export type MonthPoint = { month: string; label: string; umsatz: number };

export type StripeResult = {
  /** Aktuelle MRR in Euro (aus aktiven Subscriptions). */
  mrr: number;
  /** Umsatz des laufenden Kalendermonats in Euro (bezahlte Rechnungen). */
  monthRevenue: number;
  /** Monatsumsatz-Verlauf der letzten 12 Monate. */
  series: MonthPoint[];
  currency: string;
};

const monthKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Vienna",
  year: "numeric",
  month: "2-digit",
});
const monthLabel = new Intl.DateTimeFormat("de-AT", {
  timeZone: "Europe/Vienna",
  month: "short",
  year: "2-digit",
});

/**
 * Zieht MRR (aus aktiven Subscriptions), den laufenden Monatsumsatz und den
 * 12-Monats-Umsatzverlauf (aus bezahlten Rechnungen). Wirft bei API-Fehlern,
 * gibt null zurück, wenn kein Key gesetzt ist.
 */
export async function loadStripe(): Promise<StripeResult | { error: string } | null> {
  const key = getKey();
  if (!key) {
    console.warn("[stripe] STRIPE_SECRET_KEY nicht gesetzt — Stripe-Widget bleibt leer.");
    return null;
  }

  try {
    // 12 Monats-Buckets vorbereiten (aktueller Monat zuletzt).
    const now = new Date();
    const buckets: MonthPoint[] = [];
    const idx = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const point = { month: monthKey.format(d), label: monthLabel.format(d), umsatz: 0 };
      idx.set(point.month, buckets.length);
      buckets.push(point);
    }

    const since = Math.floor(new Date(now.getFullYear(), now.getMonth() - 11, 1).getTime() / 1000);

    const [invoices, subscriptions] = await Promise.all([
      listAll<StripeInvoice>("invoices", `&status=paid&created[gte]=${since}`, key),
      listAll<StripeSubscription>("subscriptions", `&status=active`, key),
    ]);

    let currency = "eur";
    for (const inv of invoices) {
      if (inv.amount_paid > 0) currency = inv.currency;
      const bucket = idx.get(monthKey.format(new Date(inv.created * 1000)));
      if (bucket !== undefined) buckets[bucket].umsatz += inv.amount_paid / 100;
    }

    let mrrCents = 0;
    for (const sub of subscriptions) {
      for (const item of sub.items.data) {
        const amount = item.price.unit_amount ?? 0;
        const interval = item.price.recurring?.interval ?? "month";
        mrrCents += toMonthly(amount, interval) * (item.quantity ?? 1);
      }
    }

    const currentMonth = buckets[buckets.length - 1];
    return {
      mrr: mrrCents / 100,
      monthRevenue: currentMonth.umsatz,
      series: buckets,
      currency,
    };
  } catch (err) {
    // Nicht werfen: sonst crasht die gesamte DDD-Seite. Fehler loggen und einen
    // sichtbaren Hinweis zurückgeben, damit die Ursache diagnostizierbar ist.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stripe] Laden fehlgeschlagen:", message);
    return { error: `Stripe-API-Fehler: ${message}` };
  }
}
