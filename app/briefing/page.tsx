import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import BriefingDelta from "@/components/widgets/BriefingDelta";
import BriefingGraph from "@/components/widgets/BriefingGraph";
import BriefingStimmung from "@/components/widgets/BriefingStimmung";
import BriefingSummary from "@/components/widgets/BriefingSummary";
import BriefingTimeline from "@/components/widgets/BriefingTimeline";
import MorgenBriefing from "@/components/widgets/MorgenBriefing";
import WatchlistPuls from "@/components/widgets/WatchlistPuls";

export const metadata = { title: "Morgen-Briefing · Overview Dashboard" };
export const revalidate = 60;

export default function BriefingPage() {
  return (
    <>
      <PageHeader title="Morgen-Briefing" subtitle="Neuester Stand pro Thema" />
      <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-5 py-8 sm:gap-5 sm:px-8 sm:py-10">
        <Widget title="Tagesüberblick" index={0}>
          <BriefingSummary />
        </Widget>
        <Widget title="Watchlist-Puls" index={1} skeleton="stats">
          <WatchlistPuls />
        </Widget>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
          <div className="flex flex-1 flex-col">
            <Widget title="Morgen-Briefing" index={2}>
              <MorgenBriefing />
            </Widget>
          </div>
          <div className="flex flex-1 flex-col">
            <Widget title="Seit gestern" index={3}>
              <BriefingDelta />
            </Widget>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
          <div className="flex flex-1 flex-col">
            <Widget title="Zeitleiste" index={4}>
              <BriefingTimeline />
            </Widget>
          </div>
          <div className="flex flex-1 flex-col">
            <Widget title="Stimmungsbild" index={5}>
              <BriefingStimmung />
            </Widget>
          </div>
        </div>
        <Widget title="Themen-Netz" index={6}>
          <BriefingGraph />
        </Widget>
      </main>
    </>
  );
}
