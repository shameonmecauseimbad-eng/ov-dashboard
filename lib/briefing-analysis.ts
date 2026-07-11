import type { BriefingRow } from "@/lib/briefing";

/**
 * Leichtgewichtige, deterministische Textanalyse für die Briefing-Historie —
 * ohne AI-Call, ohne Dependency. Zwei Bausteine:
 *   1. Ton-Heuristik (Polaritäts-Lexikon)  → Stimmungsbild-Widget
 *   2. Entitäten-Erkennung (kuratiertes Lexikon) → Themen-Netz-Widget
 *
 * Bewusst als grobe Heuristik gedacht (Stamm-Präfix-Match, keine Semantik):
 * ein Richtungsgefühl, kein Urteil. Sobald der Hermes Agent ein eigenes
 * numerisches Sentiment-Feld mitschreibt, kann scoreSentiment() dort andocken.
 */

// Tokenisierung: klein, Wörter inkl. Umlaute/ß und "&" (für "s&p").
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zäöüß0-9&]+/)
    .filter(Boolean);
}

// Ein Token zählt für einen Stamm, wenn es mit ihm beginnt (fängt DE-Flexion:
// "steig" → steigt/steigen/steigende). Stämme bewusst lang genug gegen Fehltreffer.
function tokenMatchesAnyStem(token: string, stems: string[]): boolean {
  return stems.some((stem) => token.startsWith(stem));
}

// ─── Ton-Heuristik ───────────────────────────────────────────────────────────

const POSITIVE_STEMS = [
  "rally", "rallye", "gewinn", "steig", "anstieg", "hausse", "bullish", "optimis",
  "wachstum", "erholung", "rekord", "allzeithoch", "aufschwung", "aufwärts",
  "einigung", "entspann", "durchbruch", "stark", "stärk", "positiv", "zuversicht",
  "boom", "expansion", "chance", "profit", "erhol",
];

const NEGATIVE_STEMS = [
  "verlust", "fällt", "fallen", "rückgang", "einbruch", "crash", "bärish", "bearish",
  "rezession", "inflation", "krise", "konflikt", "eskal", "spannung", "angriff",
  "sanktion", "zoll", "zöll", "drohung", "drohen", "unsicher", "risik", "sorge",
  "schwach", "negativ", "abwärts", "ausverkauf", "selloff", "warnung", "abschwung",
  "pessimis", "angst", "abschwäch", "verschärf", "streit",
];

export type SentimentScore = {
  /** Normalisiert in [-1, 1] (0 = neutral / keine Signalwörter). */
  score: number;
  hits: number;
};

/** Grobe Tonbewertung: (positiv − negativ) / (positiv + negativ). */
export function scoreSentiment(text: string): SentimentScore {
  let pos = 0;
  let neg = 0;
  for (const token of tokenize(text)) {
    if (tokenMatchesAnyStem(token, POSITIVE_STEMS)) pos++;
    else if (tokenMatchesAnyStem(token, NEGATIVE_STEMS)) neg++;
  }
  const hits = pos + neg;
  return { score: hits === 0 ? 0 : (pos - neg) / hits, hits };
}

export type SentimentPoint = { datum: string; score: number; hits: number };

export type ThemaSentiment = {
  thema: string;
  latest: SentimentScore;
  /** Aufsteigend nach Datum — Grundlage für die Verlaufs-Sparkline. */
  series: SentimentPoint[];
};

/**
 * Ton je Thema: aktuellster Wert + chronologischer Verlauf über alle Tage.
 * Erwartet Rows absteigend sortiert (wie loadBriefingHistory liefert).
 */
export function buildThemaSentiment(rows: BriefingRow[]): ThemaSentiment[] {
  const byThema = new Map<string, SentimentPoint[]>();
  for (const row of rows) {
    const s = scoreSentiment(row.inhalt);
    const point = { datum: row.datum, score: s.score, hits: s.hits };
    const list = byThema.get(row.thema);
    if (list) list.push(point);
    else byThema.set(row.thema, [point]);
  }

  return Array.from(byThema.entries())
    .map(([thema, pointsDesc]) => {
      const series = [...pointsDesc].reverse(); // aufsteigend
      const newest = pointsDesc[0];
      return {
        thema,
        latest: { score: newest.score, hits: newest.hits },
        series,
      };
    })
    .sort((a, b) => a.thema.localeCompare(b.thema, "de"));
}

// ─── Entitäten-Erkennung ─────────────────────────────────────────────────────

/** Kanonisches Label → Erkennungs-Stämme/Aliasse (lowercase). */
const ENTITY_LEXICON: Record<string, string[]> = {
  Fed: ["fed", "notenbank", "powell", "leitzins"],
  EZB: ["ezb", "lagarde"],
  Zinsen: ["zins", "zinssatz", "zinssenkung", "zinserhöh"],
  Inflation: ["inflation", "cpi", "teuerung", "preisauftrieb"],
  Öl: ["öl", "ölpreis", "brent", "wti", "rohöl", "opec"],
  Gold: ["gold"],
  Bitcoin: ["bitcoin", "btc"],
  Ethereum: ["ethereum", "eth"],
  Aktien: ["aktie", "s&p", "nasdaq", "dax", "dow", "wall street", "wallstreet"],
  Anleihen: ["anleihe", "bond", "rendite", "treasury"],
  Trump: ["trump"],
  Zölle: ["zoll", "zöll", "tariff", "handelskrieg"],
  China: ["china", "peking", "xi jinping"],
  Iran: ["iran", "teheran"],
  Israel: ["israel"],
  Ukraine: ["ukraine", "russland", "putin", "kreml"],
};

/**
 * Findet kanonische Entitäten im Text (dedupliziert, in Lexikon-Reihenfolge).
 * Kurze Stämme (< 4 Zeichen: "eth", "btc", "dow", "öl", "cpi") matchen nur als
 * exaktes Token, damit z. B. "ethisch" nicht als "Ethereum" oder "down" nicht
 * als "Dow" zählt. Längere Stämme dürfen Präfix sein (fängt "Zinsen",
 * "Goldpreis", "Bitcoins"). Mehrwort-Stämme laufen als Teilstring.
 */
export function extractEntities(text: string): string[] {
  const tokens = tokenize(text);
  const joined = text.toLowerCase();
  const found: string[] = [];
  for (const [label, stems] of Object.entries(ENTITY_LEXICON)) {
    const hit = stems.some((stem) =>
      stem.includes(" ")
        ? joined.includes(stem)
        : tokens.some((t) => t === stem || (stem.length >= 4 && t.startsWith(stem)))
    );
    if (hit) found.push(label);
  }
  return found;
}

export type GraphNode = {
  thema: string;
  entities: string[];
  sentiment: number;
};

export type GraphEdge = {
  a: string;
  b: string;
  /** Gemeinsame Entitäten — Grund und Gewicht der Kante. */
  shared: string[];
};

export type TopicGraphData = { nodes: GraphNode[]; edges: GraphEdge[] };

/**
 * Baut das Themen-Netz aus dem jeweils neuesten Eintrag pro Thema: Knoten =
 * Thema, Kante zwischen zwei Themen, wenn sie am aktuellsten Stand gemeinsame
 * Entitäten erwähnen (z. B. beide „Fed" + „Inflation").
 */
export function buildTopicGraph(latestRows: BriefingRow[]): TopicGraphData {
  const nodes: GraphNode[] = latestRows.map((row) => ({
    thema: row.thema,
    entities: extractEntities(row.inhalt),
    sentiment: scoreSentiment(row.inhalt).score,
  }));

  const edges: GraphEdge[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const shared = nodes[i].entities.filter((e) => nodes[j].entities.includes(e));
      if (shared.length > 0) {
        edges.push({ a: nodes[i].thema, b: nodes[j].thema, shared });
      }
    }
  }
  return { nodes, edges };
}
