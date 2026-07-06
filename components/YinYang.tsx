type YinYangProps = {
  size?: number;
  className?: string;
};

/**
 * Klassisches Schwarz-Weiß-Yin-Yang als Branding-Element. Die dunkle Hälfte
 * trägt den Seitenhintergrund, ein Hairline-Ring hält die Kontur auf #0a0a0a.
 * Responsive Größen via className (Tailwind h-/w-Klassen) — die überschreiben size.
 */
export default function YinYang({ size = 28, className }: YinYangProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="47" fill="#e5e5e5" />
      <path
        d="M50,3 a23.5,23.5 0 0,1 0,47 a23.5,23.5 0 0,0 0,47 a47,47 0 0,1 0,-94 z"
        fill="#0a0a0a"
      />
      <circle cx="50" cy="26.5" r="7" fill="#e5e5e5" />
      <circle cx="50" cy="73.5" r="7" fill="#0a0a0a" />
      <circle
        cx="50"
        cy="50"
        r="47"
        fill="none"
        stroke="rgba(255, 255, 255, 0.25)"
        strokeWidth="2"
      />
    </svg>
  );
}
