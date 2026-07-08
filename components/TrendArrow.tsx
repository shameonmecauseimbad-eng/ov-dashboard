type TrendArrowProps = {
  up: boolean;
  /** Größe/Extra-Klassen; Standard 10×10 px. */
  className?: string;
};

/**
 * Kleiner Richtungs-Pfeil (▲ / ▼). Trägt im Monochrom-System die Kursrichtung,
 * die die Farbe nicht mehr signalisiert — Helligkeit sagt „mehr/weniger",
 * der Pfeil sagt „rauf/runter". `currentColor`, erbt also die Textfarbe.
 */
export default function TrendArrow({ up, className = "h-2.5 w-2.5" }: TrendArrowProps) {
  return (
    <svg viewBox="0 0 10 10" className={`shrink-0 ${className}`} aria-hidden="true">
      {up ? (
        <path d="M5 1.5 L9 8.5 H1 Z" fill="currentColor" />
      ) : (
        <path d="M5 8.5 L1 1.5 H9 Z" fill="currentColor" />
      )}
    </svg>
  );
}
