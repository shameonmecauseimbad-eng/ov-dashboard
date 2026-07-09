"use client";

import { useState } from "react";
import { generateRedzoneStats } from "@/lib/redzone-mock";
import type { RedzoneStats } from "@/lib/redzone-types";

export type UseRedzoneStatsResult = {
  data: RedzoneStats;
  /** true = Mock-Daten (Ad-Provider noch nicht angebunden), false = echte Anbindung. */
  isMock: boolean;
};

/**
 * Zentraler Datenzugriff für den RedzoneEarth-Bereich (alle Widgets teilen sich
 * einen Aufruf). Liefert aktuell deterministische Mock-Daten aus
 * generateRedzoneStats() — lazy-init im useState, damit Server- und
 * Client-Render exakt denselben Datensatz erzeugen (kein Hydration-Mismatch).
 *
 * Sobald dashboard.redzone_stats (Ad-Provider-Sync) befüllt ist: hier den
 * generateRedzoneStats()-Aufruf gegen einen Fetch auf einen Route Handler
 * (z. B. /api/redzone-stats, serverseitig getSupabase()) tauschen und
 * isMock:false setzen — die Widgets bleiben unverändert, sie kennen nur
 * RedzoneStats aus lib/redzone-types.ts.
 */
export function useRedzoneStats(): UseRedzoneStatsResult {
  const [data] = useState<RedzoneStats>(() => generateRedzoneStats());
  return { data, isMock: true };
}
