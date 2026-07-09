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
 * useSocialStats() (aktuell Mock-Daten, s. lib/useSocialStats.ts). Hero-Karte
 * (Reichweite) volle Breite oben, Rest im responsiven 2er-Grid.
 */
export default function SocialPage() {
  return (
    <>
      <PageHeader title="Social Media" subtitle="Follower, Engagement & Reichweite" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-5">
          <div className="lg:col-span-2">
            <Widget title="Cross-Platform Reach" index={0} skeleton="stats">
              <ReachSummary />
            </Widget>
          </div>
          <Widget title="Follower-Wachstum" index={1}>
            <FollowerGrowthChart />
          </Widget>
          <Widget title="Wachstumsrate" index={2} skeleton="stats">
            <GrowthRateCard />
          </Widget>
          <Widget title="Engagement-Rate" index={3} skeleton="stats">
            <EngagementRateCard />
          </Widget>
          <Widget title="Top-Content-Ranking" index={4}>
            <TopContentRanking />
          </Widget>
          <div className="lg:col-span-2">
            <Widget title="Posting-Heatmap" index={5}>
              <PostingHeatmap />
            </Widget>
          </div>
        </div>
      </main>
    </>
  );
}
