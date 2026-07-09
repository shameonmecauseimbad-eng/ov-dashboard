import WidgetCard from "@/components/WidgetCard";

/**
 * Bewusst gestalteter Zwischenzustand statt leerem Widget: klare Ansage, dass
 * RedzoneEarth noch nicht live ist und auf die Ad-Provider-Anbindung wartet.
 * Monochrom — gestrichelter Rahmen + pulsierender Punkt signalisieren „wartend".
 */
export default function PlaceholderStatus() {
  return (
    <WidgetCard title="RedzoneEarth Status" badge="Noch nicht live" badgeTone="neutral">
      <div className="flex flex-col items-start gap-5 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:gap-6">
        <span
          className="mt-1 flex h-3 w-3 shrink-0 items-center justify-center sm:mt-0"
          aria-hidden="true"
        >
          <span className="h-3 w-3 rounded-full bg-white/40 animate-pulse-soft motion-reduce:animate-none" />
        </span>
        <div className="min-w-0">
          <p className="text-lg font-semibold text-foreground">
            Noch nicht live – wartet auf Ad-Provider-Anbindung
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Die Kennzahlen unten laufen auf klar gekennzeichneten Mock-Daten. Sobald der
            Ad-Provider angebunden und <span className="font-mono">dashboard.redzone_stats</span> befüllt
            ist, stellt sich der gesamte Bereich über den Hook{" "}
            <span className="font-mono">useRedzoneStats()</span> nahtlos auf echte Zahlen um.
          </p>
        </div>
      </div>
    </WidgetCard>
  );
}
