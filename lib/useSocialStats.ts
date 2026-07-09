"use client";

import { useState } from "react";
import { generateSocialStats } from "@/lib/social-mock";
import type { SocialStats } from "@/lib/social-types";

export type UseSocialStatsResult = {
  data: SocialStats;
  /** true = Mock-Daten, false = echte Supabase-Anbindung. Steuert die Badges der Widgets. */
  isMock: boolean;
};

/**
 * Zentraler Datenzugriff für die gesamte Social-Media-Sektion (alle sechs
 * Widgets teilen sich einen Aufruf). Liefert aktuell deterministische
 * Mock-Daten aus generateSocialStats() — lazy-init im useState, damit Server-
 * und Client-Render exakt denselben Datensatz erzeugen (kein Hydration-Mismatch).
 *
 * Sobald dashboard.social_stats_daily / dashboard.social_posts vom Hermes
 * Agent befüllt sind: hier den generateSocialStats()-Aufruf gegen einen
 * Fetch auf einen Route Handler (z. B. /api/social-stats) tauschen, der
 * serverseitig getSupabase() nutzt — die Widgets unten bleiben unverändert,
 * sie kennen nur SocialStats aus lib/social-types.ts.
 */
export function useSocialStats(): UseSocialStatsResult {
  const [data] = useState<SocialStats>(() => generateSocialStats());
  return { data, isMock: true };
}
