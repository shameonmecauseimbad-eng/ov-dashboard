import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import SocialMedia from "@/components/widgets/SocialMedia";

export const metadata = { title: "Social Media · Overview Dashboard" };
export const revalidate = 60;

/* Ausbau-Kandidat: Template von app/ddd/page.tsx (DddDetail: KpiTile-Grid + MultiLineChart). */
export default function SocialPage() {
  return (
    <>
      <PageHeader title="Social Media" subtitle="Follower & Reichweite" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Widget title="Social Media" index={0}>
          <SocialMedia />
        </Widget>
      </main>
    </>
  );
}
