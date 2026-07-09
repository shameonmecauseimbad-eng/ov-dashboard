"use client";

import { dismissToast, useToasts } from "@/lib/todo-toast";

/**
 * Rendert die aktiven Toasts unten mittig. Monochrom: Info = heller Rahmen,
 * Fehler = kräftigerer weißer Rahmen + linke Akzentkante (keine Signalfarbe).
 */
export default function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-lg border bg-raised px-4 py-2.5 text-sm text-foreground shadow-[0_8px_24px_rgba(0,0,0,0.5)] animate-fade-in ${
            t.tone === "error" ? "border-white/50 border-l-4" : "border-line"
          }`}
        >
          {t.tone === "error" && (
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
              <path d="M12 8 V13 M12 16 H12.01 M12 3 L21 20 H3 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
