// ─── Drauwerk — echte Kundenanfragen aus dem Gmail-Postfach ──────────────────
//
// Liest die Kontaktformular-Mails (drauwerk@gmail.com) und formt sie in dieselbe
// Struktur, die die /drauwerk-Widgets erwarten. Ersetzt die Anfrage-Teile der
// Demo-Daten (Zeitreihe, Paket-Interesse, Eingang); Besuchs-/Quellen-/Funnel-
// Widgets bleiben Demo (die kennt das Postfach nicht — dafür bräuchte es Plausible).
//
// Parsing-Annahmen (dokumentiertes Mail-Format der Drauwerk-Site — bei Änderung
// hier justieren):
//   • Betreff: „Neue Projektanfrage von {Name}" bzw. „… (Paket: {Paket})"
//   • Kundenmail: Reply-To-Header
//   • Nachricht: Text-Body (Abschnitt nach „Nachricht:" falls vorhanden)
//   • Status: UNREAD-Label → „offen" (Proxy — echtes „beantwortet" ließe sich
//     nur über den Sent-Ordner ermitteln)

import { fetchInquiryMessages, gmailConfigured, type GmailMessage } from "@/lib/gmail";

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

const FENSTER_TAGE = 30;
const EINGANG_MAX = 8;
const QUERY = `subject:"Neue Projektanfrage" newer_than:45d`;

export type InquiryData = {
  serie: Array<{ label: string; full: string; anfragen: number }>;
  anfragen30: number;
  anfragenWoche: number;
  ungelesen: number;
  paketInteresse: Array<{ label: string; value: number; highlight?: boolean }>;
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

export type InquiryLoad =
  | { status: "ok"; data: InquiryData }
  | { status: "unconfigured" }
  | { status: "error"; message: string };

// ─── Parsing-Helfer ──────────────────────────────────────────────────────────

function parseName(subject: string): { name: string; paket: string } | null {
  const m = subject.match(/^Neue Projektanfrage von\s+(.+?)(?:\s*\(Paket:\s*(.+?)\))?\s*$/i);
  if (!m) return null; // „Re:"-Antworten u. Ä. verwerfen
  return { name: m[1].trim(), paket: (m[2] ?? "").trim() };
}

function normPaket(p: string): string {
  const t = p.toLowerCase();
  if (t.includes("signature")) return "Signature";
  if (t.includes("fast")) return "Fast Track";
  if (t.includes("starter")) return "Starter";
  return "";
}

function parseEmail(replyTo: string): string {
  const m = replyTo.match(/<([^>]+)>/);
  return (m ? m[1] : replyTo).trim();
}

function extractNachricht(body: string): string {
  const idx = body.search(/Nachricht:\s*/i);
  const txt = idx >= 0 ? body.slice(idx).replace(/^[\s\S]*?Nachricht:\s*/i, "") : body;
  return txt.trim();
}

function relativ(now: number, date: number): string {
  const h = Math.max(0, Math.round((now - date) / 3_600_000));
  if (h < 1) return "gerade eben";
  if (h < 24) return `vor ${h} Std.`;
  return `vor ${Math.round(h / 24)} Tg.`;
}

// ─── Loader ──────────────────────────────────────────────────────────────────

export async function loadDrauwerkInquiries(now: number): Promise<InquiryLoad> {
  if (!gmailConfigured()) return { status: "unconfigured" };

  let messages: GmailMessage[];
  try {
    messages = await fetchInquiryMessages(QUERY);
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Gmail nicht erreichbar." };
  }

  // Nur echte Erstanfragen (Betreff passt), nach Datum absteigend.
  type Parsed = GmailMessage & { name: string; paket: string };
  const parsed: Parsed[] = messages
    .map((m) => {
      const p = parseName(m.subject);
      return p ? { ...m, name: p.name, paket: normPaket(p.paket) } : null;
    })
    .filter((m): m is Parsed => m !== null)
    .sort((a, b) => b.date - a.date);

  // 30-Tage-Zeitreihe (DST-sicher, 12:00 UTC als eindeutiger Tagesanker).
  const [y, mo, d] = dayKey.format(now).split("-").map(Number);
  const tage: Array<{ key: string; label: string; full: string; anfragen: number }> = [];
  const idx = new Map<string, number>();
  for (let i = FENSTER_TAGE - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(y, mo - 1, d - i, 12));
    idx.set(dayKey.format(date), tage.length);
    tage.push({ key: dayKey.format(date), label: dayLabel.format(date), full: dayFull.format(date), anfragen: 0 });
  }
  for (const m of parsed) {
    const i = idx.get(dayKey.format(new Date(m.date)));
    if (i !== undefined) tage[i].anfragen++;
  }

  const serie = tage.map(({ label, full, anfragen }) => ({ label, full, anfragen }));
  const imFenster = parsed.filter((m) => idx.has(dayKey.format(new Date(m.date))));
  const anfragen30 = imFenster.length;
  const wocheGrenze = now - 7 * 86_400_000;
  const anfragenWoche = parsed.filter((m) => m.date >= wocheGrenze).length;
  const ungelesen = parsed.filter((m) => m.unread).length;

  // Paket-Interesse: Zählung; hellster Balken = häufigstes Paket.
  const zaehl: Record<string, number> = { Signature: 0, Starter: 0, "Fast Track": 0 };
  for (const m of imFenster) if (m.paket) zaehl[m.paket] = (zaehl[m.paket] ?? 0) + 1;
  const maxPaket = (["Signature", "Starter", "Fast Track"] as const).reduce((a, b) =>
    zaehl[b] > zaehl[a] ? b : a
  );
  const paketInteresse = (["Signature", "Starter", "Fast Track"] as const).map((label) => ({
    label,
    value: zaehl[label],
    highlight: zaehl[maxPaket] > 0 && label === maxPaket,
  }));

  const eingang = parsed.slice(0, EINGANG_MAX).map((m) => ({
    name: m.name,
    ort: "", // steht nicht in der Mail
    paket: m.paket,
    quelle: parseEmail(m.replyTo) || "E-Mail",
    status: (m.unread ? "offen" : "beantwortet") as "offen" | "beantwortet",
    nachricht: extractNachricht(m.bodyText) || "(kein Text)",
    zeit: relativ(now, m.date),
    datum: dateTime.format(new Date(m.date)),
  }));

  return { status: "ok", data: { serie, anfragen30, anfragenWoche, ungelesen, paketInteresse, eingang } };
}
