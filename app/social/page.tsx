import EngagementRateCard from "@/app/social/components/EngagementRateCard";
import FollowerGrowthChart from "@/app/social/components/FollowerGrowthChart";
import GrowthRateCard from "@/app/social/components/GrowthRateCard";
import PostingHeatmap from "@/app/social/components/PostingHeatmap";
import ReachSummary from "@/app/social/components/ReachSummary";
import TopContentRanking from "@/app/social/components/TopContentRanking";
import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";

export const metadata = { title: "Social Media · Overview Dashboard" };

/**
 * Sechs Social-Media-Widgets, gespeist über den zentralen Hook
 * useSocialStats() (aktuell Mock-Daten, s. lib/useSocialStats.ts).
 *
 * Layout: Hero (Reichweite) und Heatmap volle Breite. Die vier mittleren
 * Karten NICHT im CSS-Grid — Grid erzwingt gleiche Zeilenhöhe, sodass die
 * kürzere Karte (Wachstumsrate/Engagement) darunter eine Lücke bis zur
 * nächsten Zeile lässt. Stattdessen zwei unabhängige Flex-Spalten (wie in
 * app/page.tsx), die ohne Zeilenzwang packen. Tall/short bewusst über Kreuz
 * verteilt, damit beide Spalten ähnlich hoch enden. Mobil stapeln beide
 * Spalten in DOM-Reihenfolge.
 */
export default function SocialPage() {
  return (
    <>
      <PageHeader title="Social Media" subtitle="Follower, Engagement & Reichweite" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="space-y-4 sm:space-y-5">
          <Widget title="Cross-Platform Reach" index={0} skeleton="stats">
            <ReachSummary />
          </Widget>

          <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
            <div className="flex flex-1 flex-col gap-4 lg:gap-5">
              <Widget title="Follower-Wachstum" index={1}>
                <FollowerGrowthChart />
              </Widget>
              <Widget title="Wachstumsrate" index={2} skeleton="stats">
                <GrowthRateCard />
              </Widget>
            </div>
            <div className="flex flex-1 flex-col gap-4 lg:gap-5">
              <Widget title="Engagement-Rate" index={3} skeleton="stats">
                <EngagementRateCard />
              </Widget>
              <Widget title="Top-Content-Ranking" index={4}>
                <TopContentRanking />
              </Widget>
            </div>
          </div>

          <Widget title="Posting-Heatmap" index={5}>
            <PostingHeatmap />
          </Widget>
        </div>
      </main>
    </>
  );
}
