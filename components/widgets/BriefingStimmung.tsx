import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { loadBriefingHistory } from "@/lib/briefing";
import { buildThemaSentiment, type ThemaSentiment } from "@/lib/briefing-analysis";

function toneLabel(score: number, hits: number): string {
  if (hits === 0) return "neutral · keine Signalwörter";
  if (score > 0.33) return "positiv";
  if (score > 0.05) return "eher positiv";
  if (score < -0.33) return "negativ";
  if (score < -0.05) return "eher negativ";
  return "ausgewogen";
}

/** Horizontaler Ton-Meter: Position des Markers = Ton von negativ (links) zu positiv (rechts). */
function ToneMeter({ score }: { score: number }) {
  const left = ((score + 1) / 2) * 100;
  return (
    <div className="relative h-8">
      {/* Skala */}
      <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/[0.07]" />
      {/* Neutral-Mitte */}
      <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-white/20" />
      {/* Marker */}
      <div
        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-foreground shadow-[0_0_10px_rgba(255,255,255,0.25)]"
        style={{ left: `${left}%` }}
        aria-hidden="true"
      />
      <span className="absolute left-0 top-full text-[10px] uppercase tracking-wider text-muted">−</span>
      <span className="absolute right-0 top-full text-[10px] uppercase tracking-wider text-muted">+</span>
    </div>
  );
}

/** Verlaufs-Sparkline des Tons über die Tage (Nulllinie = neutral). */
function ToneSparkline({ series }: { series: ThemaSentiment["series"] }) {
  if (series.length < 2) return null;
  const w = 96;
  const h = 28;
  const pad = 3;
  const xy = series.map((p, i) => {
    const x = pad + (i / (series.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (p.score + 1) / 2) * (h - pad * 2); // score∈[-1,1] → y
    return [x, y] as const;
  });
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const midY = pad + 0.5 * (h - pad * 2);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className="shrink-0">
      <line x1={pad} y1={midY} x2={w - pad} y2={midY} stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="2 2" />
      <polyline
        points={line}
        fill="none"
        stroke="#e5e5e5"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-fade-in"
      />
    </svg>
  );
}

/**
 * Stimmungsbild je Thema: grobe Ton-Heuristik (Polaritäts-Lexikon, keine AI)
 * auf dem aktuellsten Eintrag, plus Verlaufs-Sparkline sobald ≥2 Tage
 * Historie vorliegen. Bewusst als weiches Richtungssignal ausgewiesen.
 */
export default async function BriefingStimmung() {
  const result = await loadBriefingHistory();
  const themen = result.status === "live" ? buildThemaSentiment(result.rows) : [];

  return (
    <WidgetCard
      title="Stimmungsbild"
      badge={result.status === "live" ? "Ton-Heuristik" : "Offline"}
      badgeTone={result.status === "live" ? "accent" : "neutral"}
    >
      {result.status === "error" && <ErrorNote>{result.hint}</ErrorNote>}

      {result.status === "live" && (
        <>
          <ul className="space-y-5">
            {themen.map((t) => (
              <li key={t.thema}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{t.thema}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                    {toneLabel(t.latest.score, t.latest.hits)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <ToneMeter score={t.latest.score} />
                  </div>
                  <ToneSparkline series={t.series} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Heuristische Tonbewertung aus dem Text (keine AI) · Verlauf ab dem 2. Tag
          </p>
        </>
      )}
    </WidgetCard>
  );
}
