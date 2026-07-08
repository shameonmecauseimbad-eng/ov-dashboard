import WidgetCard from "@/components/WidgetCard";
import YinYang from "@/components/YinYang";

type WidgetSkeletonProps = {
  title: string;
  /** "stats" = drei KPI-Kacheln (DDD, Ads), "list" = Zeilen (alles andere). */
  variant?: "stats" | "list";
};

/**
 * Lade-Zustand eines Widgets: Skeleton im Layout des späteren Inhalts
 * (kein leerer Whitespace). Platzhalter mit horizontalem Shimmer (heller
 * Grau-Gradient) statt Puls, plus kleines rotierendes Yin-Yang in der
 * Fußzeile. Reine CSS-Animationen, prefers-reduced-motion wird respektiert.
 */
export default function WidgetSkeleton({ title, variant = "list" }: WidgetSkeletonProps) {
  const bar = "skeleton-shimmer animate-shimmer motion-reduce:animate-none rounded";
  return (
    <WidgetCard title={title} badge="Lädt …" badgeTone="neutral">
      <div role="status" aria-label={`${title} lädt`}>
        {variant === "stats" ? (
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="min-w-0">
                <div className={`h-3 w-14 max-w-full ${bar}`} />
                <div className={`mt-2.5 h-7 w-20 max-w-full ${bar}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-white/10" />
                <div
                  className={`h-4 flex-1 ${bar}`}
                  style={{ maxWidth: `${85 - i * 12}%` }}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
          <YinYang className="h-3.5 w-3.5 animate-spin-slow motion-reduce:animate-none" />
          <div className={`h-3 w-28 ${bar}`} />
        </div>
      </div>
    </WidgetCard>
  );
}
