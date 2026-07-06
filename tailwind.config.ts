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
        surface: "#121214",
        raised: "#1a1a1e",
        line: "rgba(255, 255, 255, 0.07)",
        foreground: "#e5e5e5",
        muted: "#8f8f94",
        accent: {
          DEFAULT: "#22c55e",
          dim: "rgba(34, 197, 94, 0.12)",
        },
        danger: {
          DEFAULT: "#ef4444",
          // hellere Stufe für Text auf dunklen Karten (Kontrast ≥ 4,5:1)
          soft: "#f87171",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "var(--font-geist-sans)", "sans-serif"],
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        // GPU-freundliche Rotation (nur transform) für den Yin-Yang-Loader
        "spin-slow": "spin 1.4s linear infinite",
      },
      fontSize: {
        // Fluid: skaliert zwischen Mobil und Desktop ohne Breakpoints
        stat: ["clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem)", { lineHeight: "1.1" }],
        hero: ["clamp(1.35rem, 1.1rem + 1vw, 1.75rem)", { lineHeight: "1.2" }],
      },
    },
  },
  plugins: [],
};
export default config;
