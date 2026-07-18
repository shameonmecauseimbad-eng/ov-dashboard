import BarChart from "@/components/dashboard/BarChart";
import PlanPie from "@/components/dashboard/PlanPie";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { SectionNote } from "@/components/widgets/DddDetail";
import WidgetCard from "@/components/WidgetCard";
import { DRAUWERK, drauwerkStartpreis, goLiveFortschritt } from "@/lib/drauwerk";

const euro = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

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

// ─── Gemeinsame Kennzahlen-Karte (Overview-Widget + /drauwerk-Seite) ─────────

export function DrauwerkKennzahlenCard({ title }: { title: string }) {
  return (
    <WidgetCard title={title} badge="Projekt" badgeTone="neutral">
      <div className="grid grid-cols-2 gap-5 sm:flex sm:items-baseline sm:gap-4">
        <StatTile label="PageSpeed" value={DRAUWERK.lighthouse.scores[0].value} suffix="/100" />
        <StatTile label="Startpreis" value={drauwerkStartpreis} prefix="ab € " />
        <StatTile label="Komponenten" value={DRAUWERK.architektur.komponenten} />
        <StatTile label="Launch-Reife" value={goLiveFortschritt.prozent} suffix=" %" hint="Inhalte/Konfig offen" />
      </div>
      <SectionNote>
        One-Page-Marketing-Website · Zielgruppe Selbstständige &amp; KMU (Österreich) · Stand {DRAUWERK.stand} ·
        Quelle: Obsidian-Vault (<span className="font-mono">Projekte/Drauwerk</span>)
      </SectionNote>
    </WidgetCard>
  );
}

// ─── Detail-Inhalt ───────────────────────────────────────────────────────────

export default function DrauwerkDetail() {
  const paketBars = DRAUWERK.pakete.map((p) => ({ label: p.name, value: p.preis, highlight: p.highlight }));
  // Kurz-Labels für die X-Achse (volle Namen würden bei 7 Balken überlappen).
  const upsellShort: Record<string, string> = {
    "Newsletter-Anbindung": "Newsletter",
    "Zusätzliche Unterseite": "Unterseite",
    "Erweiterte SEO": "SEO",
    "Blog-/News-Sektion": "Blog",
    Copywriting: "Copy",
    "Express-Lieferung": "Express",
    Mehrsprachigkeit: "Mehrspr.",
  };
  const upsellBars = DRAUWERK.upsells.map((u) => ({ label: upsellShort[u.name] ?? u.name, value: u.preis }));
  // Architektur-Split Server vs. Client als Donut.
  const archSlices = [
    { name: "Server", value: DRAUWERK.architektur.komponenten - DRAUWERK.architektur.clientKomponenten },
    { name: "Client", value: DRAUWERK.architektur.clientKomponenten },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1 — Kennzahlen */}
      <DrauwerkKennzahlenCard title="Kennzahlen" />

      {/* 2 — Paket-Preise */}
      <Reveal delayMs={100}>
        <WidgetCard title="Paket-Preise" badge="Festpreis" badgeTone="accent">
          <BarChart data={paketBars} valuePrefix="€ " />
          <SectionNote>
            Endpreise, keine USt. (Kleinunternehmerregelung) · Signature = „Beliebteste Wahl“ · Livegang Starter 5 /
            Signature 10 / Fast Track 3 Werktage
          </SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 3 — Lighthouse-Performance */}
      <Reveal delayMs={150}>
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

      {/* 4 — Upsell-Katalog */}
      <Reveal delayMs={200}>
        <WidgetCard title="Upsell-Katalog" badge="Extras" badgeTone="neutral">
          <BarChart data={upsellBars} valuePrefix="€ " fractionDigits={2} height={280} />
          <SectionNote>
            Einmalige Extras (,99-Anker) · „Alle Extras auf einmal“ {euro.format(DRAUWERK.alleExtras)} · laufend:{" "}
            {DRAUWERK.abo.name} {DRAUWERK.abo.preisProMonat.toLocaleString("de-AT")} €/Monat
          </SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 5 — Architektur (Server vs. Client) */}
      <Reveal delayMs={250}>
        <WidgetCard title="Architektur" badge="Next.js" badgeTone="neutral">
          <PlanPie data={archSlices} />
          <SectionNote>
            {DRAUWERK.architektur.komponenten} Komponenten, „Client nur wo nötig“ · {DRAUWERK.architektur.sektionen}{" "}
            Sektionen im One-Pager · alle Seiten statisch vorgerendert
          </SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 6 — Go-Live-Fortschritt */}
      <Reveal delayMs={300}>
        <WidgetCard title="Go-Live-Fortschritt" badge={`${goLiveFortschritt.prozent} %`} badgeTone="neutral">
          <ul className="space-y-3">
            {DRAUWERK.goLive.map((g) => (
              <ProgressBar key={g.kategorie} {...g} />
            ))}
          </ul>
          <SectionNote>
            Code fertig &amp; verifiziert — Launch blockiert durch Inhalte (Platzhalter Rechtsseiten) &amp;
            Konfiguration (Env-Vars, Domain, Resend)
          </SectionNote>
        </WidgetCard>
      </Reveal>

      {/* 7 — Build-Timeline */}
      <Reveal delayMs={350}>
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
          <SectionNote>Session-Logs 14.–17.07.2026 · Quelle: Vault „Projekte/Drauwerk“</SectionNote>
        </WidgetCard>
      </Reveal>
    </div>
  );
}
