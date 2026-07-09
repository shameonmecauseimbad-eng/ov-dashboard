import BulkToolbar from "@/app/todo/components/BulkToolbar";
import FocusToday from "@/app/todo/components/FocusToday";
import KeyboardShortcuts from "@/app/todo/components/KeyboardShortcuts";
import TaskCreator from "@/app/todo/components/TaskCreator";
import TimelineSection from "@/app/todo/components/TimelineSection";
import TimeSuggestions from "@/app/todo/components/TimeSuggestions";
import Toaster from "@/app/todo/components/Toaster";
import TodoProvider from "@/app/todo/components/TodoContext";
import WeeklyReview from "@/app/todo/components/WeeklyReview";
import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";

export const metadata = { title: "To-Do · Overview Dashboard" };

/**
 * To-Do-Bereich. Datenbasis ist der zentrale Hook useTasksAndEvents()
 * (lokal, localStorage — s. lib/useTasksAndEvents.ts). Der TodoProvider teilt
 * Cursor-Navigation, Mehrfachauswahl und Aktionen über alle Widgets; Bulk-
 * Toolbar, Tastaturkürzel und Toasts hängen ebenfalls darunter.
 */
export default function TodoPage() {
  return (
    <>
      <PageHeader title="To-Do" subtitle="Termine & Erinnerungen · Europe/Vienna" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <TodoProvider>
          <div className="space-y-4 sm:space-y-5">
            <Widget title="Fokus heute" index={0}>
              <FocusToday />
            </Widget>
            {/* Anker #neu: das Overview-Widget verlinkt hierher (/todo#neu). */}
            <div id="neu" className="scroll-mt-24">
              <Widget title="Neue Aufgabe" index={1} skeleton="stats">
                <TaskCreator />
              </Widget>
            </div>
            <Widget title="Quick-Work" index={2}>
              <TimelineSection />
            </Widget>
            <Widget title="Zeitfenster-Vorschläge" index={3}>
              <TimeSuggestions />
            </Widget>
            <Widget title="Wochenrückblick" index={4}>
              <WeeklyReview />
            </Widget>
          </div>

          {/* Globale Overlays innerhalb des Providers (brauchen den Kontext). */}
          <BulkToolbar />
          <KeyboardShortcuts />
        </TodoProvider>
        <Toaster />
      </main>
    </>
  );
}
