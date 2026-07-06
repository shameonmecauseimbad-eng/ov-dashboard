import YinYang from "@/components/YinYang";

/** Ganzseitiger Lade-Zustand bei Routen-Übergängen — gleiche Yin-Yang-Rotation wie in den Widgets. */
export default function Loading() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-background"
      role="status"
      aria-label="Seite lädt"
    >
      <YinYang className="h-10 w-10 animate-spin-slow motion-reduce:animate-none" />
    </div>
  );
}
