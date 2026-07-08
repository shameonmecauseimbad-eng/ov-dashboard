import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import KryptoKurse from "@/components/widgets/KryptoKurse";

export const metadata = { title: "Krypto · Overview Dashboard" };

/* Ausbau-Kandidat: Template von app/ddd/page.tsx (DddDetail: KpiTile-Grid + MultiLineChart). */
export default function KryptoPage() {
  return (
    <>
      <PageHeader title="Krypto" subtitle="Kurse & 24h-Entwicklung" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Widget title="Krypto-Kurse" index={0}>
          <KryptoKurse />
        </Widget>
      </main>
    </>
  );
}
