"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const REFRESH_MS = 5 * 60_000;

/**
 * Globaler Auto-Refresh: router.refresh() lädt alle Server-Widgets
 * (Supabase, GitHub, iCloud) neu, ohne die Seite neu zu laden — Client-State
 * bleibt erhalten, das Krypto-Widget behält seinen eigenen 60-s-Takt.
 * Der Zeitstempel wird erst nach dem Mount gesetzt (kein Hydration-Mismatch).
 */
export default function AutoRefresh() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    // Initialer Datenstand = Zeitpunkt des Seitenaufbaus
    setLastRefresh(new Date());
    const timer = setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <span
      className="text-xs tabular-nums text-muted"
      title="Widgets laden alle 5 Minuten neu (Krypto-Kurse: eigener 60-s-Takt)"
    >
      <span className="hidden md:inline">Zuletzt aktualisiert: </span>
      <span className="font-mono">
        {lastRefresh
          ? lastRefresh.toLocaleTimeString("de-AT", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "–"}
      </span>
    </span>
  );
}
