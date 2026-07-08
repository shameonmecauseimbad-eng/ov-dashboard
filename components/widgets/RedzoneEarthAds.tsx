import StatTile from "@/components/StatTile";
import WidgetCard from "@/components/WidgetCard";

type AdStats = {
  impressions: number;
  clicks: number;
  umsatz: number;
};

type LoadResult = {
  stats: AdStats;
  live: boolean;
};

/**
 * Datenquelle des Ads-Widgets. Sobald der Ad-Provider feststeht, hier den
 * echten API-Fetch einsetzen und { stats, live: true } zurückgeben —
 * das Layout unten bleibt unverändert.
 */
async function loadAdStats(): Promise<LoadResult> {
  return {
    stats: { impressions: 0, clicks: 0, umsatz: 0 },
    live: false,
  };
}

/** RedzoneEarth-Werbeerlöse — Platzhalter, bis die Provider-API angebunden ist. */
export default async function RedzoneEarthAds() {
  const { stats, live } = await loadAdStats();

  return (
    <WidgetCard
      title="RedzoneEarth Ads"
      badge={live ? "Live" : "Noch nicht live"}
      badgeTone={live ? "accent" : "neutral"}
    >
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Impressions" value={stats.impressions} />
        <StatTile label="Klicks" value={stats.clicks} />
        <StatTile label="Umsatz" value={stats.umsatz} prefix="€ " />
      </div>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Quelle: Ad-Provider-API · Anbindung folgt
      </p>
    </WidgetCard>
  );
}
