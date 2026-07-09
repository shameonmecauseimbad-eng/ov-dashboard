"use client";

import { useMemo } from "react";
import WidgetCard from "@/components/WidgetCard";
import { useSocialStats } from "@/lib/useSocialStats";

const WEEKS = 12;
const DAYS = WEEKS * 7;

const dayFull = new Intl.DateTimeFormat("de-AT", { day: "numeric", month: "long" });

// Monochrom: Intensität über Opacity-Stufen von Weiß statt Farbverlauf.
const LEVEL_CLASS = ["bg-white/[0.06]", "bg-white/25", "bg-white/50", "bg-white/85"];

function levelFor(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

/**
 * Posting-Häufigkeit der letzten 12 Wochen als Kalender-Grid (analog zum
 * GitHub-Contribution-Graph): eine Spalte pro Woche, sieben Zeilen (Mo–So),
 * Intensität über Opacity-Stufen von Weiß.
 */
export default function PostingHeatmap() {
  const { data, isMock } = useSocialStats();

  const weeks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of data.posts) {
      counts.set(post.published_at, (counts.get(post.published_at) ?? 0) + 1);
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (DAYS - 1));
    // Auf den Wochenanfang (Montag) zurückrunden, damit die Spalten voll bleiben.
    const isoWeekday = (cutoff.getDay() + 6) % 7;
    cutoff.setDate(cutoff.getDate() - isoWeekday);

    const days: Array<{ date: string; label: string; count: number }> = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = new Date(cutoff);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, label: dayFull.format(d), count: counts.get(key) ?? 0 });
    }

    const cols: (typeof days)[] = [];
    for (let w = 0; w < WEEKS; w++) cols.push(days.slice(w * 7, w * 7 + 7));
    return cols;
  }, [data.posts]);

  return (
    <WidgetCard title="Posting-Heatmap" badge={isMock ? "Mock-Daten" : "Live"} badgeTone={isMock ? "neutral" : "accent"}>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex shrink-0 flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.label}: ${day.count} Post${day.count === 1 ? "" : "s"}`}
                className={`h-3 w-3 rounded-sm ${LEVEL_CLASS[levelFor(day.count)]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted">
        <span>Weniger</span>
        {LEVEL_CLASS.map((cls, i) => (
          <span key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
        ))}
        <span>Mehr</span>
      </div>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Posting-Frequenz, letzte {WEEKS} Wochen (beide Plattformen) · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.social_posts</span>}
      </p>
    </WidgetCard>
  );
}
