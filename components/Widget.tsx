"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useFocusZoom } from "@/components/FocusZoom";
import Reveal from "@/components/Reveal";
import WidgetBoundary from "@/components/WidgetBoundary";
import WidgetSkeleton from "@/components/WidgetSkeleton";

type WidgetProps = {
  title: string;
  /** Position im Grid — steuert den 50-ms-Stagger des Scroll-Reveals. */
  index: number;
  skeleton?: "stats" | "list";
  /** Optionaler Marker für die Verbindungslinien (P7), z. B. "krypto". */
  dataId?: string;
  /** Optionales Ziel der Detailseite — rendert oben rechts einen Link-Pfeil. */
  href?: string;
  children: React.ReactNode;
};

/**
 * Gemeinsame Hülle für alle Seiten: Scroll-Reveal + Fokus-Zoom
 * (P8) + Error-Boundary + Suspense mit Layout-Skeleton, dessen Inhalt beim
 * Erscheinen aus Graustufen „erwacht" (P5). Crasht ein Widget, bleibt der Rest
 * intakt.
 */
export default function Widget({ title, index, skeleton = "list", dataId, href, children }: WidgetProps) {
  const { focused, setFocused, enabled: focusEnabled } = useFocusZoom();
  const isFocused = focused === index;

  return (
    <div>
    <Reveal delayMs={index * 50}>
      <div
        data-widget={dataId}
        className={`group relative transition-transform duration-300 ${
          isFocused ? "z-30 scale-[1.04]" : "z-10"
        }`}
      >
        <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
          {href && (
            <Link
              href={href}
              aria-label={`${title} öffnen`}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-raised text-muted opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M7 17 L17 7 M9 7 H17 V15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
          {focusEnabled && (
            <button
              type="button"
              onClick={() => setFocused(isFocused ? null : index)}
              aria-label={isFocused ? "Fokus verlassen" : `${title} fokussieren`}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-raised text-muted opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
        <WidgetBoundary title={title}>
          <Suspense fallback={<WidgetSkeleton title={title} variant={skeleton} />}>
            <div className="animate-wake motion-reduce:animate-none">{children}</div>
          </Suspense>
        </WidgetBoundary>
      </div>
    </Reveal>
    </div>
  );
}
