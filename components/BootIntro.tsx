"use client";

import { useEffect, useState } from "react";

const BOOT_KEY = "ov:booted";

/**
 * P1 — Boot-Sequenz beim ersten Aufruf pro Session: schwarzer Screen, das
 * Yin-Yang zeichnet sich (Ring via stroke-dashoffset) und dreht/skaliert sich
 * ein, danach fadet das Overlay weg und gibt das Dashboard frei. Per Klick
 * überspringbar, danach (sessionStorage) nie wieder in dieser Session.
 * (Vereinfachung ggü. Prompt: Reveal statt Partikel-Zerfall in die Widgets.)
 *
 * Zum erneuten Testen: URL mit ?boot aufrufen — das erzwingt die Sequenz
 * unabhängig vom Session-Flag.
 */
export default function BootIntro() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const force = window.location.search.includes("boot");
    if (!force && sessionStorage.getItem(BOOT_KEY)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sessionStorage.setItem(BOOT_KEY, "1");
      return;
    }

    setShow(true);
    const t1 = window.setTimeout(() => setLeaving(true), 1600);
    // Flag erst am Ende setzen — so re-etabliert der Strict-Mode-Doppel-Effekt
    // die Timer sauber (statt beim zweiten Lauf früh abzubrechen).
    const t2 = window.setTimeout(() => {
      setShow(false);
      sessionStorage.setItem(BOOT_KEY, "1");
    }, 2150);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(BOOT_KEY, "1");
  };

  if (!show) return null;

  return (
    <div
      onClick={dismiss}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      role="presentation"
    >
      <svg width="96" height="96" viewBox="0 0 100 100" className="animate-boot-logo" aria-hidden="true">
        <circle cx="50" cy="50" r="47" fill="#e5e5e5" className="animate-boot-fill opacity-0" />
        <path
          d="M50,3 a23.5,23.5 0 0,1 0,47 a23.5,23.5 0 0,0 0,47 a47,47 0 0,1 0,-94 z"
          fill="#0a0a0a"
          className="animate-boot-fill opacity-0"
        />
        <circle cx="50" cy="26.5" r="7" fill="#e5e5e5" className="animate-boot-fill opacity-0" />
        <circle cx="50" cy="73.5" r="7" fill="#0a0a0a" className="animate-boot-fill opacity-0" />
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="#e5e5e5"
          strokeWidth="2"
          className="animate-boot-draw"
          style={{ strokeDasharray: 295, strokeDashoffset: 295 }}
        />
      </svg>
      <span className="absolute bottom-8 text-xs text-muted">Klick zum Überspringen</span>
    </div>
  );
}
