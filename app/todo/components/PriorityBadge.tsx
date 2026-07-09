import { PRIORITY_STYLE, type Priority } from "@/lib/todo-types";

/**
 * Prioritäts-Pill. Monochrom-Regel: Priorität ausschließlich über Font-Weight
 * und Opacity — High = fett/100 %, Medium = medium/70 %, Low = regular/45 %.
 * Kein Farbcode.
 */
export default function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLE[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-foreground ${s.weight} ${s.opacity}`}
    >
      {s.label}
    </span>
  );
}
