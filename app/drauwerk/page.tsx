import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import DrauwerkDetail from "@/components/widgets/DrauwerkDetail";

export const metadata = { title: "Drauwerk · Overview Dashboard" };

export default function DrauwerkPage() {
  return (
    <>
      <PageHeader title="Drauwerk" subtitle="Marketing-Website — Detailansicht" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Widget title="Drauwerk Detail" index={0} skeleton="stats">
          <DrauwerkDetail />
        </Widget>
      </main>
    </>
  );
}
