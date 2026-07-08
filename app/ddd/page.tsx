import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import DddDetail from "@/components/widgets/DddDetail";

export const metadata = { title: "DDD · Overview Dashboard" };
export const revalidate = 300;

export default function DddPage() {
  return (
    <>
      <PageHeader title="DDD" subtitle="DrawdownDiary — Detailansicht" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Widget title="DrawdownDiary Detail" index={0} skeleton="stats">
          <DddDetail />
        </Widget>
      </main>
    </>
  );
}
