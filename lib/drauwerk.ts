// ─── Drauwerk — statische Projektdaten aus Mikkos Obsidian-Vault ─────────────
// Drauwerk ist eine One-Page-Marketing-Website (eigener Webentwicklungs-Service,
// Zielgruppe Selbstständige/KMU in Österreich). Anders als DDD gibt es KEINE
// Live-Datenquelle (Supabase/Stripe) — die Kennzahlen sind dokumentierte
// Projektfakten. Diese Datei ist die Single Source of Truth fürs Dashboard;
// bei Projektänderungen hier nachziehen (Quelle: Vault „Projekte/Drauwerk").
//
// Stand der Notizen: 18.07.2026 — live: https://drauwerk.at (Vercel + Domain bei
// easyname, HTTPS aktiv, Kontaktformular scharf). Repo: shameonmecauseimbad-eng/
// drauwerk-site (privat).

export const DRAUWERK = {
  stand: "18.07.2026",
  claim: "Websites, die aus Besuchern Kunden machen.",

  // ── Pakete (Endpreise, Kleinunternehmerregelung — keine USt.) ──────────────
  // Quelle: „Drauwerk Feature — Festpreise & Pakete". Werktage bis Livegang.
  // 17.07.2026 gesenkt: Starter 499 / Signature 899 / Fast Track 1.499 €.
  pakete: [
    { name: "Starter", preis: 499, werktage: 10, features: 7, highlight: false },
    { name: "Signature", preis: 899, werktage: 7, features: 8, highlight: true },
    { name: "Fast Track", preis: 1499, werktage: 3, features: 6, highlight: false },
  ],

  // ── Upsell-Katalog (einmalige Extras, ,99-Anker) ───────────────────────────
  // Quelle: „Drauwerk Feature — Upsell-Katalog". alleExtras = dokumentierter
  // Gesamtpreis-Anker (ohne Abo). abo = einziges laufendes Add-on.
  upsells: [
    { name: "Newsletter-Anbindung", preis: 69.99 },
    { name: "Zusätzliche Unterseite", preis: 79.99 },
    { name: "Erweiterte SEO", preis: 99.99 },
    { name: "Blog-/News-Sektion", preis: 129.99 },
    { name: "Copywriting", preis: 149.99 },
    { name: "Express-Lieferung", preis: 149.99 },
    { name: "Mehrsprachigkeit", preis: 199.99 },
  ],
  alleExtras: 879.93,
  abo: { name: "Hosting & Basic Support", preisProMonat: 24.99 },

  // ── Lighthouse (mobil, Produktions-Build, Median aus 3 Runs, 15.07.2026) ────
  // Quelle: „Drauwerk Performance & Messwerte" + lib/metrics.ts der Site.
  lighthouse: {
    scores: [
      { name: "Performance", value: 96, runs: [97, 93, 96] },
      { name: "Accessibility", value: 100 },
      { name: "Best Practices", value: 100 },
      { name: "SEO", value: 100 },
    ],
    fcpSeconds: 1.0,
    clsMax: 0.002,
    tbtRange: "40–160 ms",
  },

  // ── Architektur (One-Pager, statisch vorgerendert) ─────────────────────────
  // Quelle: „Drauwerk Struktur & Komponenten". Client bewusst minimiert.
  architektur: {
    sektionen: 9, // Sektionen im One-Pager (Hero … Footer)
    komponenten: 27,
    clientKomponenten: 7, // „Client nur wo nötig" — Rest sind Server-Komponenten
  },

  // ── Go-Live-Checkliste (Stand 18.07.2026 — Site ist live) ──────────────────
  // Quelle: „Drauwerk 🚀 Go-Live Checkliste". erledigt/gesamt je Kategorie.
  // Site live seit 18.07.; offen sind v. a. Recht (AV-Verträge) & Nachlauf.
  goLive: [
    { kategorie: "Inhalte", erledigt: 3, gesamt: 5 },
    { kategorie: "Konfiguration", erledigt: 4, gesamt: 5 },
    { kategorie: "Deployment", erledigt: 5, gesamt: 6 },
    { kategorie: "Recht", erledigt: 0, gesamt: 3 },
    { kategorie: "Nach Launch", erledigt: 0, gesamt: 4 },
  ],

  // ── Build-Timeline (Session-Logs, chronologisch) ───────────────────────────
  // Quelle: „Drauwerk ✅ Session …"-Notizen + Rebrand-/Meilenstein-Historie.
  timeline: [
    { datum: "14.07.2026", titel: "Paket-Vorauswahl-Flow end-to-end getestet" },
    { datum: "15.07.2026", titel: "Rebrand „Webcraft“ → „Drauwerk“, Logo, GitHub-Push" },
    { datum: "15.07.2026", titel: "SEO, Blog + 2 Artikel, JSON-LD, Sitemap" },
    { datum: "15.07.2026", titel: "Hero-Umbau: Split-Layout, Mockup, Cursor-Animation" },
    { datum: "16.07.2026", titel: "Festpreise + Upsell-System" },
    { datum: "17.07.2026", titel: "Cursor-Navigation (3 Ansichten), Preise gesenkt" },
    { datum: "18.07.2026", titel: "Vercel-Deploy live, Domain drauwerk.at + HTTPS" },
    { datum: "18.07.2026", titel: "Kontaktformular scharf (Resend, Live-Test bestanden)" },
  ],
} as const;

// Abgeleitete Kennwerte (nicht doppelt pflegen) ───────────────────────────────
export const drauwerkStartpreis = Math.min(...DRAUWERK.pakete.map((p) => p.preis));

export const goLiveFortschritt = (() => {
  const t = DRAUWERK.goLive.reduce(
    (acc, g) => ({ erledigt: acc.erledigt + g.erledigt, gesamt: acc.gesamt + g.gesamt }),
    { erledigt: 0, gesamt: 0 }
  );
  return { ...t, prozent: t.gesamt > 0 ? Math.round((t.erledigt / t.gesamt) * 100) : 0 };
})();
