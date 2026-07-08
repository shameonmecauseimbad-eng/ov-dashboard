import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import KalenderErinnerungen from "@/components/widgets/KalenderErinnerungen";

export const metadata = { title: "Kalender · Overview Dashboard" };
export const revalidate = 60;

export default function KalenderPage() {
  return (
    <>
      <PageHeader title="Kalender" subtitle="Google Calendar + Tasks · Europe/Vienna" />
      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-3xl">
          <Widget title="Kalender & Erinnerungen" index={0}>
            <KalenderErinnerungen />
          </Widget>
        </div>
      </main>
    </>
  );
}
