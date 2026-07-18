// ─── Drauwerk — DEMO-/Beispieldaten für die funktionalen Diagramme ───────────
//
// ⚠️  ACHTUNG: Das sind KEINE echten Kunden- oder Besuchszahlen. Alle Werte hier
//     sind synthetisch erzeugt, damit die Anfragen-/Besuchs-Diagramme auf der
//     /drauwerk-Seite funktional aussehen, solange es noch keine Live-Quelle gibt.
//
//     Die Zahlen sind deterministisch aus dem Kalendertag abgeleitet (fester Seed
//     pro Tag) und laufen immer bis „heute" mit — das Fenster verschiebt sich also
//     mit der Zeit, die Werte je Tag bleiben aber stabil.
//
//     Echte Anbindung später (dann diese Datei durch echte Loader ersetzen —
//     die Widget-Props bleiben identisch):
//       • Seitenbesuche  → Plausible Stats-API (cookielos), aktivieren via
//                          NEXT_PUBLIC_PLAUSIBLE_DOMAIN auf der Drauwerk-Site.
//       • Kundenanfragen → Kontaktformular schreibt zusätzlich zur E-Mail einen
//                          anonymen Datensatz (created_at · paket · quelle · status)
//                          in dashboard.drauwerk_inquiries (Supabase).

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayLabel = new Intl.DateTimeFormat("de-AT", { timeZone: TZ, day: "numeric", month: "numeric" });
const dayFull = new Intl.DateTimeFormat("de-AT", { timeZone: TZ, weekday: "short", day: "numeric", month: "long" });
const dateTime = new Intl.DateTimeFormat("de-AT", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const TAGE = 30;

// Deterministischer PRNG (mulberry32) + FNV-1a-Hash, damit jeder Kalendertag
// stabil dieselben Werte liefert (kein Springen zwischen ISR-Regenerierungen).
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand(key: string): number {
  return mulberry32(hash(key))();
}

type Tag = { key: string; label: string; full: string; weekday: number };

// Letzte n Wiener Kalendertage (DST-sicher: 12:00 UTC liegt in jeder Zeitzone
// eindeutig im Ziel-Tag — fixe 24-h-Schritte würden an DST-Übergängen kippen).
function letzteTage(now: number, n: number): Tag[] {
  const [y, m, d] = dayKey.format(now).split("-").map(Number);
  const tage: Tag[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(y, m - 1, d - i, 12));
    tage.push({
      key: dayKey.format(date),
      label: dayLabel.format(date),
      full: dayFull.format(date),
      weekday: date.getUTCDay(),
    });
  }
  return tage;
}

function relativ(hAgo: number): string {
  if (hAgo < 1) return "gerade eben";
  if (hAgo < 24) return `vor ${hAgo} Std.`;
  return `vor ${Math.round(hAgo / 24)} Tg.`;
}

// ─── Anfragen-Eingang (fiktive Beispiel-Kunden, realistische ö. Kleinbetriebe) ─
type RohEingang = {
  hAgo: number;
  name: string;
  ort: string;
  paket: string;
  quelle: string;
  status: "offen" | "beantwortet";
  nachricht: string;
};

const ROH_EINGANG: RohEingang[] = [
  {
    hAgo: 3,
    name: "Malerei Sonnleitner",
    ort: "Villach",
    paket: "Signature",
    quelle: "Google",
    status: "offen",
    nachricht:
      "Hallo Mikko, wir sind ein Malerbetrieb aus Villach und bräuchten dringend eine neue Website. Die alte ist von 2015 und am Handy praktisch unbrauchbar. Wäre das Signature-Paket das richtige für uns?",
  },
  {
    hAgo: 9,
    name: "Studio Nordlicht",
    ort: "Klagenfurt",
    paket: "Fast Track",
    quelle: "Social",
    status: "offen",
    nachricht:
      "Servus! Ich eröffne im September mein Fotostudio und brauche schnell eine Seite mit Portfolio und Kontaktmöglichkeit. Geht das mit Express wirklich in 3 Werktagen?",
  },
  {
    hAgo: 28,
    name: "Kanzlei Weitblick",
    ort: "Klagenfurt",
    paket: "Signature",
    quelle: "Direkt",
    status: "beantwortet",
    nachricht:
      "Sehr geehrter Herr, wir suchen einen seriösen Webauftritt für unsere Steuerberatungskanzlei, inkl. Impressum und Datenschutz. Bitte um ein unverbindliches Angebot.",
  },
  {
    hAgo: 35,
    name: "Tischlerei Draufeld",
    ort: "St. Veit",
    paket: "Starter",
    quelle: "Google",
    status: "beantwortet",
    nachricht:
      "Grüß dich, ich baue Möbel auf Maß und will endlich online sichtbar sein. Reicht das Starter-Paket für eine einfache Seite mit ein paar Fotos und einem Kontaktformular?",
  },
  {
    hAgo: 54,
    name: "Yoga & Balance",
    ort: "Velden",
    paket: "Starter",
    quelle: "Verweis",
    status: "beantwortet",
    nachricht:
      "Hallo, eine Kollegin hat mir eure Seite empfohlen. Ich hätte gern eine ruhige, schöne Website für mein Yogastudio mit Kursplan und Online-Anmeldung.",
  },
  {
    hAgo: 79,
    name: "Café Marktplatz",
    ort: "Klagenfurt",
    paket: "",
    quelle: "Direkt",
    status: "beantwortet",
    nachricht:
      "Hi, was kostet ungefähr eine Website für ein kleines Café mit Speisekarte und Öffnungszeiten? Muss nichts Großes sein, soll aber gut ausschauen.",
  },
  {
    hAgo: 122,
    name: "Bergblick Ferienwohnungen",
    ort: "Bad Kleinkirchheim",
    paket: "Signature",
    quelle: "Google",
    status: "beantwortet",
    nachricht:
      "Guten Tag, wir vermieten zwei Ferienwohnungen und möchten Direktbuchungen ohne Provision. Kann man ein Anfrageformular mit Zeitraum-Auswahl einbauen?",
  },
];

// ─── Typ & Builder ───────────────────────────────────────────────────────────

export type DrauwerkDemo = {
  besuche: Array<{ label: string; full: string; besucher: number; unique: number }>;
  anfragen: Array<{ label: string; full: string; anfragen: number }>;
  kpi: {
    besucher30: number;
    besucherSchnitt: number;
    besucherHeute: number;
    anfragen30: number;
    anfragenWoche: number;
    conversion: number; // Prozent
    antwortzeitStd: number;
  };
  paketInteresse: Array<{ label: string; value: number; highlight?: boolean }>;
  quellen: Array<{ name: string; value: number }>;
  funnel: Array<{ stufe: string; value: number; pct: number }>;
  eingang: Array<{
    name: string;
    ort: string;
    paket: string;
    quelle: string;
    status: "offen" | "beantwortet";
    nachricht: string;
    zeit: string;
    datum: string;
  }>;
};

export function buildDrauwerkDemo(now: number): DrauwerkDemo {
  const tage = letzteTage(now, TAGE);
  const istWochenende = (wd: number) => wd === 0 || wd === 6;

  // Besuche: junge, wachsende Seite → sanfter Aufwärtstrend, Wochenenden schwächer.
  const besuche = tage.map((t, i) => {
    const we = istWochenende(t.weekday) ? 0.55 : 1;
    const trend = 24 + (i / (TAGE - 1)) * 40; // 24 → 64 über das Fenster
    const besucher = Math.max(6, Math.round(trend * we * (0.8 + rand(t.key) * 0.5)));
    const unique = Math.round(besucher * (0.72 + rand(t.key + "u") * 0.12));
    return { label: t.label, full: t.full, besucher, unique };
  });

  // Anfragen: ~4 % Conversion aus den Besuchen mit Rauschen, gedeckelt 0–4/Tag.
  const anfragen = tage.map((t, i) => {
    const we = istWochenende(t.weekday) ? 0.4 : 1;
    const roh = besuche[i].besucher * 0.04 * we * (0.4 + rand(t.key + "a") * 1.7);
    return { label: t.label, full: t.full, anfragen: Math.max(0, Math.min(4, Math.round(roh))) };
  });

  const besucher30 = besuche.reduce((s, d) => s + d.besucher, 0);
  const anfragen30 = anfragen.reduce((s, d) => s + d.anfragen, 0);
  const anfragenWoche = anfragen.slice(-7).reduce((s, d) => s + d.anfragen, 0);
  const besucherHeute = besuche[besuche.length - 1].besucher;
  const besucherSchnitt = Math.round(besucher30 / TAGE);
  const conversion = besucher30 > 0 ? (anfragen30 / besucher30) * 100 : 0;

  // Paket-Interesse: Aufteilung der Anfragen (Signature führt), Rest sauber aufaddiert.
  const sig = Math.round(anfragen30 * 0.45);
  const start = Math.round(anfragen30 * 0.35);
  const fast = Math.max(0, anfragen30 - sig - start);
  const paketInteresse = [
    { label: "Signature", value: sig, highlight: true },
    { label: "Starter", value: start },
    { label: "Fast Track", value: fast },
  ];

  // Traffic-Quellen: Anteile der Besucher, Rest als „Verweis" aufgefüllt.
  const google = Math.round(besucher30 * 0.52);
  const direkt = Math.round(besucher30 * 0.24);
  const social = Math.round(besucher30 * 0.15);
  const verweis = Math.max(0, besucher30 - google - direkt - social);
  const quellen = [
    { name: "Google", value: google },
    { name: "Direkt", value: direkt },
    { name: "Social", value: social },
    { name: "Verweis", value: verweis },
  ];

  // Funnel: Besuch → Kontakt-Sektion gesehen → Formular begonnen → Anfrage gesendet.
  const kontaktViews = Math.round(besucher30 * 0.34);
  const formularStart = Math.max(anfragen30, Math.round(besucher30 * 0.085));
  const funnel = [
    { stufe: "Besucher", value: besucher30, pct: 100 },
    { stufe: "Kontakt-Sektion", value: kontaktViews, pct: (kontaktViews / besucher30) * 100 },
    { stufe: "Formular begonnen", value: formularStart, pct: (formularStart / besucher30) * 100 },
    { stufe: "Anfrage gesendet", value: anfragen30, pct: (anfragen30 / besucher30) * 100 },
  ];

  const eingang = ROH_EINGANG.map((e) => ({
    name: e.name,
    ort: e.ort,
    paket: e.paket,
    quelle: e.quelle,
    status: e.status,
    nachricht: e.nachricht,
    zeit: relativ(e.hAgo),
    datum: dateTime.format(new Date(now - e.hAgo * 3_600_000)),
  }));

  return {
    besuche,
    anfragen,
    kpi: {
      besucher30,
      besucherSchnitt,
      besucherHeute,
      anfragen30,
      anfragenWoche,
      conversion,
      antwortzeitStd: 5,
    },
    paketInteresse,
    quellen,
    funnel,
    eingang,
  };
}
