import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import KryptoKurse from "@/components/widgets/KryptoKurse";

export const metadata = { title: "Krypto · Overview Dashboard" };

/* Ausbau-Kandidat: Template von app/ddd/page.tsx (KpiRow/TrendChart/HistoryTable). */
export default function KryptoPage() {
  return (
    <>
      <PageHeader title="Krypto" subtitle="Kurse & 24h-Entwicklung" />
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-3xl">
          <Widget title="Krypto-Kurse" index={0}>
            <KryptoKurse />
          </Widget>
        </div>
      </main>
    </>
  );
}
