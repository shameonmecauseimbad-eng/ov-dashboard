import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import SocialMedia from "@/components/widgets/SocialMedia";

export const metadata = { title: "Social Media · Overview Dashboard" };
export const revalidate = 60;

/* Ausbau-Kandidat: Template von app/ddd/page.tsx (KpiRow/TrendChart/HistoryTable). */
export default function SocialPage() {
  return (
    <>
      <PageHeader title="Social Media" subtitle="Follower & Reichweite" />
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-3xl">
          <Widget title="Social Media" index={0}>
            <SocialMedia />
          </Widget>
        </div>
      </main>
    </>
  );
}
