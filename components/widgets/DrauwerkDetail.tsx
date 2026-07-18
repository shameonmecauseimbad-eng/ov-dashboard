import BarChart from "@/components/dashboard/BarChart";
import MultiLineChart from "@/components/dashboard/MultiLineChart";
import PlanPie from "@/components/dashboard/PlanPie";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { SectionNote } from "@/components/widgets/DddDetail";
import WidgetCard from "@/components/WidgetCard";
import { DRAUWERK, drauwerkStartpreis, goLiveFortschritt } from "@/lib/drauwerk";
import { buildDrauwerkDemo, type DrauwerkDemo } from "@/lib/drauwerk-demo";
import { loadDrauwerkInquiries } from "@/lib/drauwerk-inquiries";

const int = new Intl.NumberFormat("de-AT");

// ─── Kleine Bausteine (monochrom, Dashboard-Designregeln) ────────────────────

function StatTile({
  label,
  value,
  prefix,
  suffix,
  maxFractionDigits = 0,
  hint,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  maxFractionDigits?: number;
  hint?: string;
}) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <p className="truncate text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1.5 flex items-baseline justify-center whitespace-nowrap font-mono text-stat-sm font-semibold tabular-nums tracking-tight text-foreground">
        <CountUp value={value} prefix={prefix} suffix={suffix} maxFractionDigits={maxFractionDigits} />
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

// Horizontale 0–100-Score-Leiste (Lighthouse). 100 = hell, darunter gedämpft.
function ScoreBar({ name, value }: { name: string; value: number }) {
  const full = value >= 100;
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted">{name}</span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${full ? "bg-foreground" : "bg-white/45"}`}
          style={{ width: `${value}%` }}
          aria-hidden="true"
        />
      </span>
      <span className="w-12 shrink-0 text-right font-mono tabular-nums text-foreground">{value}</span>
    </li>
  );
}

// Fortschrittsbalken erledigt/gesamt (Go-Live-Checkliste).
function ProgressBar({ kategorie, erledigt, gesamt }: { kategorie: string; erledigt: number; gesamt: number }) {
  const pct = gesamt > 0 ? (erledigt / gesamt) * 100 : 0;
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className="w-32 shrink-0 text-muted">{kategorie}</span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-white/45"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </span>
      <span className="w-14 shrink-0 text-right font-mono tabular-nums text-foreground">
        {erledigt}/{gesamt}
      </span>
    </li>
  );
}

// Conversion-Funnel: absteigende Balken, Helligkeit nimmt Stufe für Stufe ab
// (Monochrom: Richtung über Helligkeit + Breite, nicht über Farbe).
const FUNNEL_SHADES = ["#e5e5e5", "#bcbcc0", "#8f8f94", "#5f5f64"];

function Funnel({ data }: { data: DrauwerkDemo["funnel"] }) {
  return (
    <ul className="space-y-3.5">
      {data.map((f, i) => (
        <li key={f.stufe} className="text-sm">
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="text-foreground">{f.stufe}</span>
            <span className="shrink-0 font-mono tabular-nums text-muted">
              <span className="text-foreground">{int.format(f.value)}</span>
              <span className="ml-2 tabular-nums">{f.pct.toFixed(1)} %</span>
            </span>
          </div>
          <span className="relative block h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${Math.max(f.pct, 1.5)}%`, backgroundColor: FUNNEL_SHADES[i] ?? FUNNEL_SHADES.at(-1) }}
              aria-hidden="true"
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Anfragen-Eingang: aufklappbare Liste (native <details>, ohne JS) zum Lesen.
// „offen" = helle Markierung, „beantwortet" = gedämpft (Monochrom-Regel).
function Eingang({ items }: { items: DrauwerkDemo["eingang"] }) {
  return (
    <ul className="-my-1 divide-y divide-line">
      {items.map((e, i) => (
        <li key={i}>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center gap-3 py-3 transition-colors hover:text-white [&::-webkit-details-marker]:hidden">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${e.status === "offen" ? "bg-foreground" : "bg-white/25"}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="truncate font-medium text-foreground">{e.name}</span>
                  {e.ort && <span className="shrink-0 text-xs text-muted">· {e.ort}</span>}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">{e.nachricht}</span>
              </span>
              {e.paket && (
                <span className="hidden shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted sm:inline">
                  {e.paket}
                </span>
              )}
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{e.zeit}</span>
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </summary>
            <div className="pb-4 pl-5 pr-1">
              <p className="text-sm text-foreground/90">{e.nachricht}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                <span>
                  Paket: <span className="text-foreground">{e.paket || "—"}</span>
                </span>
                {e.quelle && (
                  <span>
                    {e.quelle.includes("@") ? "E-Mail" : "Quelle"}:{" "}
                    <span className="text-foreground">{e.quelle}</span>
                  </span>
                )}
                <span>
                  Status: <span className="text-foreground">{e.status}</span>
                </span>
                <span>
                  Eingegangen: <span className="font-mono text-foreground">{e.datum}</span>
                </span>
              </div>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

// Wiederkehrender Hinweis auf den Demo-Charakter (statt echter Live-Quelle).
function DemoQuelle({ children }: { children: React.ReactNode }) {
  return (
    <SectionNote>
      <span className="font-medium text-foreground">Beispieldaten</span> — noch keine Live-Anbindung. {children}
    </SectionNote>
  );
}

// ─── Gemeinsame Kennzahlen-Karte (Overview-Widget + /drauwerk-Seite) ─────────

export function DrauwerkKennzahlenCard({ title }: { title: string }) {
  return (
    <WidgetCard title={title} badge="Live" badgeTone="accent">
      <div className="grid grid-cols-2 gap-5 sm:flex sm:items-baseline sm:gap-4">
        <StatTile label="PageSpeed" value={DRAUWERK.lighthouse.scores[0].value} suffix="/100" />
        <StatTile label="Startpreis" value={drauwerkStartpreis} prefix="ab € " />
        <StatTile label="Komponenten" value={DRAUWERK.architektur.komponenten} />
        <StatTile label="Checkliste" value={goLiveFortschritt.prozent} suffix=" %" hint="live · Rest: Recht/Analytics" />
      </div>
      <SectionNote>
        One-Page-Marketing-Website · live: <span className="font-mono">drauwerk.at</span> · Zielgruppe Selbstständige
        &amp; KMU (Österreich) · Stand {DRAUWERK.stand} · Quelle: Obsidian-Vault (
        <span className="font-mono">Projekte/Drauwerk</span>)
      </SectionNote>
    </WidgetCard>
  );
}

// ─── Detail-Inhalt ───────────────────────────────────────────────────────────
// Reihenfolge: Identität (real) → Betrieb: Anfragen & Besuche (Demo) →
// Technik & Verlauf (real). Demo-Daten laufen rollierend bis „heute" mit.

export default async function DrauwerkDetail() {
  const now = Date.now();
  const demo = buildDrauwerkDemo(now);
  const inquiries = await loadDrauwerkInquiries(now);
  const live = inquiries.status === "ok" ? inquiries.data : null;
  const inqError = inquiries.status === "error" ? inquiries.message : null;

  // Architektur-Split Server vs. Client als Donut (dokumentierte Projektfakten).
  const archSlices = [
    { name: "Server", value: DRAUWERK.architektur.komponenten - DRAUWERK.architektur.clientKomponenten },
    { name: "Client", value: DRAUWERK.architektur.clientKomponenten },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1 — Kennzahlen (real) */}
      <DrauwerkKennzahlenCard title="Kennzahlen" />

      {/* 2 — Kundenanfragen im Zeitverlauf (live: Gmail · sonst Demo) */}
      <Reveal delayMs={100}>
        <WidgetCard title="Kundenanfragen" badge={live ? "Gmail" : "Demo"} badgeTone={live ? "accent" : "neutral"}>
          <div className="mb-5 grid grid-cols-2 gap-5 sm:flex sm:items-baseline sm:gap-4">
            {live ? (
              <>
                <StatTile label="Anfragen (30 T)" value={live.anfragen30} />
                <StatTile label="Diese Woche" value={live.anfragenWoche} />
                <StatTile label="Ungelesen" value={live.ungelesen} />
              </>
            ) : (
              <>
                <StatTile label="Anfragen (30 T)" value={demo.kpi.anfragen30} />
                <StatTile label="Diese Woche" value={demo.kpi.anfragenWoche} />
                <StatTile label="Conversion" value={demo.kpi.conversion} suffix=" %" maxFractionDigits={1} />
                <StatTile label="Ø Antwortzeit" value={demo.kpi.antwortzeitStd} suffix=" Std." />
              </>
            )}
          </div>
          {live && live.anfragen30 === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Noch keine Anfragen im 30-Tage-Fenster.</p>
          ) : (
            <MultiLineChart
              data={live ? live.serie : demo.anfragen}
              xKey="label"
              lines={[{ key: "anfragen", label: "Anfragen/Tag" }]}
            />
          )}
          {live ? (
            <SectionNote>
              Anfragen pro Tag (30 Tage) · Quelle: <span className="font-mono">Gmail</span> (drauwerk@gmail.com),
              Betreff „Neue Projektanfrage“ · stündlich aktualisiert
            </SectionNote>
          ) : (
            <DemoQuelle>
              {inqError ? `Gmail-Fehler: ${inqError}. ` : ""}Echte Quelle: Gmail-Postfach — Env{" "}
              <span className="font-mono">GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN</span> setzen (siehe Setup).
            </DemoQuelle>
          )}
        </WidgetCard>
      </Reveal>

      {/* 3 — Anfragen-Eingang zum Auslesen (live: Gmail · sonst Demo) */}
      <Reveal delayMs={150}>
        <WidgetCard title="Anfragen-Eingang" badge={live ? "Gmail" : "Demo"} badgeTone={live ? "accent" : "neutral"}>
          {live ? (
            live.eingang.length > 0 ? (
              <Eingang items={live.eingang} />
            ) : (
              <p className="py-8 text-center text-sm text-muted">Noch keine Anfragen im Postfach.</p>
            )
          ) : (
            <Eingang items={demo.eingang} />
          )}
          {live ? (
            <SectionNote>
              Neueste Anfragen aus dem Postfach · „offen“ = ungelesen · Zeile aufklappen zum Lesen
            </SectionNote>
          ) : (
            <DemoQuelle>
              Zeile aufklappen zum Lesen. Namen &amp; Texte sind fiktiv — echte Anfragen erscheinen hier mit
              Gmail-Anbindung.
            </DemoQuelle>
          )}
        </WidgetCard>
      </Reveal>

      {/* 4 — Paket-Interesse aus den Anfragen (live: Gmail · sonst Demo) */}
      <Reveal delayMs={200}>
        <WidgetCard title="Paket-Interesse" badge={live ? "Gmail" : "Demo"} badgeTone={live ? "accent" : "neutral"}>
          <BarChart data={live ? live.paketInteresse : demo.paketInteresse} height={240} />
          {live ? (
            <SectionNote>Paket-Vorauswahl der Anfragen (aus dem Betreff) · Quelle: Gmail</SectionNote>
          ) : (
            <DemoQuelle>
              Wie oft welches Paket in den Anfragen vorausgewählt war (Signature führt). Quelle: Betreff-Zusatz „(Paket:
              …)“.
            </DemoQuelle>
          )}
        </WidgetCard>
      </Reveal>

      {/* 5 — Seitenbesuche im Zeitverlauf (Demo) */}
      <Reveal delayMs={250}>
        <WidgetCard title="Seitenbesuche" badge="Demo" badgeTone="neutral">
          <div className="mb-5 grid grid-cols-3 gap-4 sm:flex sm:items-baseline sm:gap-4">
            <StatTile label="Besucher (30 T)" value={demo.kpi.besucher30} />
            <StatTile label="Ø / Tag" value={demo.kpi.besucherSchnitt} />
            <StatTile label="Heute" value={demo.kpi.besucherHeute} />
          </div>
          <MultiLineChart
            data={demo.besuche}
            xKey="label"
            lines={[
              { key: "besucher", label: "Besucher" },
              { key: "unique", label: "Eindeutige", muted: true },
            ]}
          />
          <DemoQuelle>
            Echte Quelle später: Plausible Stats-API (cookielos) — aktivieren via{" "}
            <span className="font-mono">NEXT_PUBLIC_PLAUSIBLE_DOMAIN</span> auf der Drauwerk-Site.
          </DemoQuelle>
        </WidgetCard>
      </Reveal>

      {/* 6 — Traffic-Quellen (Demo) */}
      <Reveal delayMs={300}>
        <WidgetCard title="Traffic-Quellen" badge="Demo" badgeTone="neutral">
          <PlanPie data={demo.quellen} centerLabel="Besuche" />
          <DemoQuelle>Woher die Besucher kommen (30 Tage). Quelle später: Plausible.</DemoQuelle>
        </WidgetCard>
      </Reveal>

      {/* 7 — Conversion-Funnel (Demo) */}
      <Reveal delayMs={350}>
        <WidgetCard title="Conversion-Funnel" badge="Demo" badgeTone="neutral">
          <Funnel data={demo.funnel} />
          <DemoQuelle>
            Besuch → Kontakt-Sektion gesehen → Formular begonnen → Anfrage gesendet (30 Tage). Quelle später:
            Plausible-Goals + Supabase.
          </DemoQuelle>
        </WidgetCard>
      </Reveal>

      {/* 8 — Lighthouse-Performance (real) */}
      <Reveal delayMs={400}>
        <WidgetCard title="Lighthouse" badge="96/100" badgeTone="accent">
          <ul className="space-y-3">
            {DRAUWERK.lighthouse.scores.map((s) => (
              <ScoreBar key={s.name} name={s.name} value={s.value} />
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4 text-center">
            <div>
              <p className="font-mono text-stat-sm font-semibold tabular-nums text-foreground">
                {DRAUWERK.lighthouse.fcpSeconds.toLocaleString("de-AT")} s
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted">FCP</p>
            </div>
            <div>
              <p className="font-mono text-stat-sm font-semibold tabular-nums text-foreground">
                {DRAUWERK.lighthouse.clsMax.toLocaleString("de-AT")}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted">CLS max.</p>
            </div>
            <div>
              <p className="font-mono text-stat-sm font-semibold tabular-nums text-foreground">
                {DRAUWERK.lighthouse.tbtRange}
              </p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-muted">TBT</p>
            </div>
          </div>
          <SectionNote>Mobil-Preset, Produktions-Build, Median aus 3 Runs (15.07.2026)</SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 9 — Architektur (Server vs. Client, real) */}
      <Reveal delayMs={450}>
        <WidgetCard title="Architektur" badge="Next.js" badgeTone="neutral">
          <PlanPie data={archSlices} centerLabel="Kompon." />
          <SectionNote>
            {DRAUWERK.architektur.komponenten} Komponenten, „Client nur wo nötig“ · {DRAUWERK.architektur.sektionen}{" "}
            Sektionen im One-Pager · alle Seiten statisch vorgerendert
          </SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 10 — Go-Live-Checkliste (real) */}
      <Reveal delayMs={500}>
        <WidgetCard title="Launch-Checkliste" badge={`${goLiveFortschritt.prozent} %`} badgeTone="neutral">
          <ul className="space-y-3">
            {DRAUWERK.goLive.map((g) => (
              <ProgressBar key={g.kategorie} {...g} />
            ))}
          </ul>
          <SectionNote>
            Site ist live seit 18.07.2026 — offen sind v. a. AV-Verträge (Recht) sowie Nachlauf (Search Console,
            Live-Lighthouse, optional Analytics)
          </SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 11 — Build-Timeline (real) */}
      <Reveal delayMs={550}>
        <WidgetCard title="Build-Timeline" badge="Verlauf" badgeTone="neutral">
          <ol className="relative space-y-4 border-l border-line pl-5">
            {DRAUWERK.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span
                  className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-white/45 ring-4 ring-surface"
                  aria-hidden="true"
                />
                <p className="font-mono text-xs tabular-nums text-muted">{t.datum}</p>
                <p className="text-sm text-foreground">{t.titel}</p>
              </li>
            ))}
          </ol>
          <SectionNote>Session-Logs 14.–18.07.2026 · Quelle: Vault „Projekte/Drauwerk“</SectionNote>
        </WidgetCard>
      </Reveal>
    </div>
  );
}
