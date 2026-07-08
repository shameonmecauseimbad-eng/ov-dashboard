import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import RedzoneEarthAds from "@/components/widgets/RedzoneEarthAds";

export const metadata = { title: "RedzoneEarth · Overview Dashboard" };

/* Sobald echte Ad-Daten fließen: nach dem Vorbild von app/ddd/page.tsx
   (DddDetail: KpiTile-Grid + MultiLineChart) ausbauen. */
export default function RedzonePage() {
  return (
    <>
      <PageHeader title="RedzoneEarth" subtitle="Werbeerlöse" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Widget title="RedzoneEarth Ads" index={0} skeleton="stats">
          <RedzoneEarthAds />
        </Widget>
      </main>
    </>
  );
}
