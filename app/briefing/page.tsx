import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import MorgenBriefing from "@/components/widgets/MorgenBriefing";

export const metadata = { title: "Morgen-Briefing · Overview Dashboard" };
export const revalidate = 60;

export default function BriefingPage() {
  return (
    <>
      <PageHeader title="Morgen-Briefing" subtitle="Neuester Stand pro Thema" />
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-3xl">
          <Widget title="Morgen-Briefing" index={0}>
            <MorgenBriefing />
          </Widget>
        </div>
      </main>
    </>
  );
}
