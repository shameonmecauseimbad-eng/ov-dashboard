import WidgetCard from "@/components/WidgetCard";
import YinYang from "@/components/YinYang";

/**
 * Lade-Zustand eines Widgets: rotierendes Schwarz-Weiß-Yin-Yang.
 * Reine CSS-Transform-Animation (animate-spin-slow), kein JS —
 * und respektiert prefers-reduced-motion.
 */
export default function WidgetSkeleton({ title }: { title: string }) {
  return (
    <WidgetCard title={title} badge="Lädt …" badgeTone="neutral">
      <div
        className="flex items-center justify-center py-8"
        role="status"
        aria-label={`${title} lädt`}
      >
        <YinYang className="h-8 w-8 animate-spin-slow motion-reduce:animate-none" />
      </div>
    </WidgetCard>
  );
}
