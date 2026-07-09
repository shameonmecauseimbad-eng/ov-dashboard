import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0a",
        sidebar: "#111111",
        surface: "#121214",
        raised: "#1a1a1e",
        line: "rgba(255, 255, 255, 0.07)",
        foreground: "#e5e5e5",
        muted: "#8f8f94",
        // Monochrom: „Akzent" ist jetzt Weiß — Hervorhebung läuft über Helligkeit,
        // nicht über Farbton (Live, Badges, aktive Nav, Kurs-Anstiege).
        accent: {
          DEFAULT: "#ffffff",
          dim: "rgba(255, 255, 255, 0.10)",
        },
        // Kein Rot mehr: negative Werte / Fehler laufen über gedämpftes Grau.
        // Die Richtung tragen Vorzeichen und Pfeil-Icons, nicht die Farbe.
        danger: {
          DEFAULT: "#a3a3a3",
          soft: "#a3a3a3",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-geist-sans)", "sans-serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        glowOnce: {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" },
          "40%": { boxShadow: "0 0 12px 2px rgba(255, 255, 255, 0.22)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" },
        },
        // Idle-„Atem" des Logos (nur transform)
        breathe: {
          "0%, 100%": { transform: "scale(0.98)" },
          "50%": { transform: "scale(1.02)" },
        },
        // Einmal-Puls, wenn frische Daten ankommen
        pulseScale: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
        },
        // Heller Highlight-Blitz bei Wertänderung (ersetzt Grün/Rot)
        flash: {
          "0%": { backgroundColor: "rgba(255, 255, 255, 0.16)" },
          "100%": { backgroundColor: "transparent" },
        },
        // Expandierender weißer Ring — einmalig (Alert) oder infinite (Live)
        ring: {
          "0%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0.5)" },
          "70%": { boxShadow: "0 0 0 8px rgba(255, 255, 255, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" },
        },
        // Wachsender Titel-Unterstrich (mit origin-left)
        growX: {
          from: { transform: "scaleX(0)" },
          to: { transform: "scaleX(1)" },
        },
        // Scanline-Sweep über ein Widget
        scan: {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(100%)" },
        },
        // Tooltip / kleine Elemente Scale-In
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        // Badge „Bounce-In" für neue Erwähnungen/Likes
        bounceIn: {
          "0%": { transform: "scale(0)" },
          "60%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        // Blur-to-Sharp für Überschriften
        blurIn: {
          from: { opacity: "0", filter: "blur(4px)" },
          to: { opacity: "1", filter: "blur(0)" },
        },
        // Skeleton-Shimmer (bg-position; Gradient via .skeleton-shimmer)
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        // Fehlermeldung: Slide-in von oben + dezenter Shake am Ende
        errorIn: {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "60%": { opacity: "1", transform: "translateY(0)" },
          "72%": { transform: "translateX(-2px)" },
          "84%": { transform: "translateX(2px)" },
          "100%": { transform: "translateX(0)" },
        },
        // P2: sehr dezentes Hintergrund-Atmen der ganzen Seite
        breatheBg: {
          "0%, 100%": { backgroundColor: "#0a0a0a" },
          "50%": { backgroundColor: "#101013" },
        },
        // P1 Boot-Intro: Ring zeichnet sich, Flächen faden ein, Logo skaliert/rotiert
        bootDraw: {
          from: { strokeDashoffset: "295" },
          to: { strokeDashoffset: "0" },
        },
        bootFill: {
          "0%, 45%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        bootLogo: {
          from: { opacity: "0", transform: "scale(0.7) rotate(-90deg)" },
          to: { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
        // P10 Alarm: pulsierender weißer Viewport-Rand
        alertFrame: {
          "0%, 100%": { boxShadow: "inset 0 0 0 0 rgba(255,255,255,0)" },
          "20%, 80%": { boxShadow: "inset 0 0 44px 3px rgba(255,255,255,0.5)" },
          "50%": { boxShadow: "inset 0 0 24px 2px rgba(255,255,255,0.22)" },
        },
        // P3: Seiten-Content entfaltet sich beim Routenwechsel aus der Mitte
        pageEnter: {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        // P5: Content „erwacht" aus gedämpftem Graustufen-Zustand
        wake: {
          from: { filter: "brightness(0.45) contrast(0.9)" },
          to: { filter: "brightness(1) contrast(1)" },
        },
      },
      animation: {
        // GPU-freundliche Rotation (nur transform) für den Yin-Yang-Loader
        "spin-slow": "spin 1.4s linear infinite",
        // einmalige 360°-Drehung des Header-Logos beim Auto-Refresh
        "spin-once": "spin 0.6s ease-in-out 1",
        // dezenter Puls für den Live-Status-Punkt
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "glow-once": "glowOnce 0.9s ease-out 1",
        // Logo-Lebenszeichen
        breathe: "breathe 4s ease-in-out infinite",
        "pulse-once": "pulseScale 0.45s ease-out 1",
        // Daten-Feedback (alles weiß/helligkeitsbasiert)
        flash: "flash 0.8s ease-out 1",
        "alert-ring": "ring 0.9s ease-out 1",
        "live-ring": "ring 2.4s ease-out infinite",
        underline: "growX 0.5s ease-out 1",
        "scan-once": "scan 0.6s ease-out 1",
        "scale-in": "scaleIn 0.15s ease-out 1",
        "bounce-in": "bounceIn 0.4s ease-out 1",
        "blur-in": "blurIn 0.4s ease-out 1",
        shimmer: "shimmer 1.6s linear infinite",
        "error-in": "errorIn 0.5s ease-out 1",
        "breathe-bg": "breatheBg 6s ease-in-out infinite",
        "boot-draw": "bootDraw 0.9s ease-out forwards",
        "boot-fill": "bootFill 1.2s ease-out forwards",
        "boot-logo": "bootLogo 1s ease-out forwards",
        "alert-frame": "alertFrame 2.6s ease-in-out 1",
        "page-enter": "pageEnter 0.4s ease-out",
        wake: "wake 0.7s ease-out",
      },
      fontSize: {
        // Fluid: skaliert zwischen Mobil und Desktop ohne Breakpoints
        stat: ["clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)", { lineHeight: "1.1" }],
        // kleinere Stufe für lange Werte (z. B. "€ 1.842,50"), damit nichts abschneidet
        "stat-sm": ["clamp(1.15rem, 0.9rem + 1vw, 1.65rem)", { lineHeight: "1.15" }],
        // größere Stufe für Hero-Kacheln (z. B. Cross-Platform-Reichweite)
        "stat-lg": ["clamp(2.25rem, 1.4rem + 3.5vw, 4rem)", { lineHeight: "1.05" }],
        hero: ["clamp(1.35rem, 1.1rem + 1vw, 1.75rem)", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};
export default config;
