import type { ReactNode } from "react";

type WidgetCardProps = {
  title: string;
  /** Kleines Status-Chip rechts im Kartenkopf, z. B. "Live" oder "Platzhalter". */
  badge?: string;
  badgeTone?: "accent" | "neutral";
  children: ReactNode;
};

/**
 * Gemeinsame Hülle für alle Dashboard-Widgets. Neue Datenquellen bekommen
 * eine eigene Komponente unter components/widgets/ und rendern sich hierin.
 */
export default function WidgetCard({
  title,
  badge,
  badgeTone = "neutral",
  children,
}: WidgetCardProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transform-gpu [backface-visibility:hidden] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:shadow-[0_0_24px_rgba(255,255,255,0.08)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="animate-blur-in font-display text-sm font-medium uppercase tracking-[0.16em] text-muted motion-reduce:animate-none">
            {title}
          </h2>
          <span
            className="mt-1.5 block h-px w-8 origin-left animate-underline bg-white/25 motion-reduce:animate-none"
            aria-hidden="true"
          />
        </div>
        {badge && (
          <span
            className={
              badgeTone === "accent"
                ? "inline-flex items-center gap-1.5 rounded-full bg-accent-dim px-2.5 py-0.5 text-xs font-medium text-accent animate-glow-once motion-reduce:animate-none"
                : "rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted animate-fade-in motion-reduce:animate-none"
            }
          >
            {badgeTone === "accent" && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent animate-live-ring motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {badge}
          </span>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}
