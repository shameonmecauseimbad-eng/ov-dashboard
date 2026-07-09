/** Ein Tageswert der Ad-Erlöse — Grundlage für Revenue-Trend, Fill-Rate, RPV. */
export type RedzoneDailyStat = {
  date: string; // YYYY-MM-DD (Europe/Vienna)
  revenue: number; // EUR
  impressions: number;
  fill_rate: number; // Prozent, 0..100
  visitors: number;
};

/** Eine Platzierung/Seite — Grundlage für das Top-Slots-Ranking. */
export type RedzoneSlot = {
  slot_id: string;
  slot_name: string;
  revenue: number; // EUR (Zeitraum-Summe)
  impressions: number;
};

export type RedzoneStats = {
  /** Letzte 90 Tage, chronologisch aufsteigend. */
  daily: RedzoneDailyStat[];
  /** Platzierungen, nach Umsatz absteigend. */
  slots: RedzoneSlot[];
};
