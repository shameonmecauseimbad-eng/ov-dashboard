import FillRateMonitor from "@/app/redzone/components/FillRateMonitor";
import PlaceholderStatus from "@/app/redzone/components/PlaceholderStatus";
import ProjektVergleich from "@/app/redzone/components/ProjektVergleich";
import RevenuePerVisitor from "@/app/redzone/components/RevenuePerVisitor";
import RevenueTrendChart from "@/app/redzone/components/RevenueTrendChart";
import TopSlotsRanking from "@/app/redzone/components/TopSlotsRanking";
import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";

export const metadata = { title: "RedzoneEarth · Overview Dashboard" };
export const revalidate = 300;

/**
 * RedzoneEarth-Bereich. Status-Karte (bewusster Zwischenzustand) volle Breite
 * oben, darunter Kennzahlen in zwei unabhängigen Flex-Spalten (kein CSS-Grid —
 * das erzwingt gleiche Zeilenhöhe und reißt bei unterschiedlich hohen Karten
 * Lücken; s. app/social/page.tsx), unten der Projektvergleich volle Breite.
 * Alle Kennzahlen laufen über useRedzoneStats() (Mock, bis Ad-Provider steht).
 */
export default function RedzonePage() {
  return (
    <>
      <PageHeader title="RedzoneEarth" subtitle="Werbeerlöse & Reichweite" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="space-y-4 sm:space-y-5">
          <Widget title="RedzoneEarth Status" index={0}>
            <PlaceholderStatus />
          </Widget>

          <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
            <div className="flex flex-1 flex-col gap-4 lg:gap-5">
              <Widget title="Revenue-Trend" index={1}>
                <RevenueTrendChart />
              </Widget>
              <Widget title="Revenue per Visitor" index={2} skeleton="stats">
                <RevenuePerVisitor />
              </Widget>
            </div>
            <div className="flex flex-1 flex-col gap-4 lg:gap-5">
              <Widget title="Fill-Rate & Impressions" index={3} skeleton="stats">
                <FillRateMonitor />
              </Widget>
              <Widget title="Top-Slots" index={4}>
                <TopSlotsRanking />
              </Widget>
            </div>
          </div>

          <Widget title="Projektvergleich" index={5} skeleton="stats">
            <ProjektVergleich />
          </Widget>
        </div>
      </main>
    </>
  );
}
