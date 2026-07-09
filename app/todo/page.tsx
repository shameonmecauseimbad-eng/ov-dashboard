import FocusToday from "@/app/todo/components/FocusToday";
import TimelineSection from "@/app/todo/components/TimelineSection";
import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";

export const metadata = { title: "To-Do · Overview Dashboard" };

/**
 * To-Do-Bereich (ersetzt den früheren Google-Kalender). Datenbasis ist der
 * zentrale Hook useTasksAndEvents() (aktuell Platzhalter-Daten, Anbindung
 * folgt — s. lib/useTasksAndEvents.ts). Fokus + Fortschrittsring oben,
 * darunter die gefilterte Kombi-Zeitleiste.
 */
export default function TodoPage() {
  return (
    <>
      <PageHeader title="To-Do" subtitle="Termine & Erinnerungen · Europe/Vienna" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="space-y-4 sm:space-y-5">
          <Widget title="Fokus heute" index={0}>
            <FocusToday />
          </Widget>
          <Widget title="Zeitleiste" index={1}>
            <TimelineSection />
          </Widget>
        </div>
      </main>
    </>
  );
}
