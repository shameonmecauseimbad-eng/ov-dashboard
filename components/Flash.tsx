"use client";

import { useEffect, useRef, useState } from "react";

type FlashProps = {
  /** Bei jeder Änderung dieses Werts blitzt der Inhalt einmal hell auf. */
  value: string | number;
  children: React.ReactNode;
  className?: string;
};

/**
 * Lässt seinen Inhalt bei jeder Wertänderung kurz hell aufblitzen (weißer
 * Highlight, 0.8 s). Im Monochrom-System signalisiert der Blitz nur „hat sich
 * geändert" — die Richtung trägt das Vorzeichen/der Pfeil, nicht Grün/Rot.
 * Kein Blitz beim ersten Rendern; prefers-reduced-motion unterdrückt ihn ganz.
 */
export default function Flash({ value, children, className = "" }: FlashProps) {
  const [flash, setFlash] = useState(false);
  const prev = useRef(value);
  const mounted = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      prev.current = value;
      return;
    }
    if (prev.current === value) return;
    prev.current = value;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setFlash(false);
    requestAnimationFrame(() => setFlash(true));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(false), 800);
    return () => window.clearTimeout(timer.current);
  }, [value]);

  return (
    <span className={`-mx-1 rounded-sm px-1 ${flash ? "animate-flash" : ""} ${className}`}>
      {children}
    </span>
  );
}
