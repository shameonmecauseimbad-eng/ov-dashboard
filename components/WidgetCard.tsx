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
    <section className="flex flex-col rounded-2xl border border-line bg-surface p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-medium uppercase tracking-[0.16em] text-muted">
          {title}
        </h2>
        {badge && (
          <span
            className={
              badgeTone === "accent"
                ? "rounded-full bg-accent-dim px-2.5 py-0.5 text-xs font-medium text-accent"
                : "rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-muted"
            }
          >
            {badge}
          </span>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}
