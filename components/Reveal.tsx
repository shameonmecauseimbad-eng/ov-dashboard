"use client";

import { useEffect, useRef, useState } from "react";

type RevealProps = {
  children: React.ReactNode;
  /** Stagger-Versatz in ms (pro Karte +50). */
  delayMs?: number;
};

/**
 * Scroll-Reveal via Intersection Observer: Karten blenden beim ersten
 * Sichtbarwerden sanft von opacity 0 / translateY(10px) ein — einmalig,
 * gestaffelt über delayMs. prefers-reduced-motion zeigt sofort alles.
 */
export default function Reveal({ children, delayMs = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delayMs}ms` : undefined }}
      className={`h-full transition-all duration-500 ease-out motion-reduce:transition-none ${
        shown ? "translate-y-0 opacity-100" : "translate-y-[10px] opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
