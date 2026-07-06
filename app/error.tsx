"use client";

/** Letztes Netz auf Routen-Ebene — greift nur, wenn es außerhalb der Widget-Boundaries kracht. */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <h1 className="font-display text-hero font-semibold">
        Da ist etwas schiefgelaufen
      </h1>
      <p className="max-w-md text-sm text-muted">
        Die Seite konnte nicht gerendert werden.
        {error.digest && (
          <>
            {" "}
            Fehler-Digest: <span className="font-mono">{error.digest}</span>
          </>
        )}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5"
      >
        Neu laden
      </button>
    </div>
  );
}
