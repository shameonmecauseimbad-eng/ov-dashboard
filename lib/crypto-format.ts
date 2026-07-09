function priceFormatter(v: number): Intl.NumberFormat {
  const frac = v >= 1000 ? 0 : v >= 1 ? 2 : 4;
  return new Intl.NumberFormat("de-AT", { minimumFractionDigits: frac, maximumFractionDigits: frac });
}

/** Kurs mit „$ "-Präfix (de-AT-Trennung, Nachkommastellen je Größenordnung). */
export function fmtUsd(v: number): string {
  return `$ ${priceFormatter(v).format(v)}`;
}

/** Größere Summen (Portfolio-Gesamtwert), immer 2 Nachkommastellen. */
export function fmtUsdSum(v: number): string {
  return `$ ${new Intl.NumberFormat("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
}

export const cryptoInt = new Intl.NumberFormat("de-AT");

/**
 * Monochrom-Kodierung der Richtung: KEINE Farbe. Zuwachs = fett + voll deckend
 * (helle Textfarbe), Verlust = regular + gedämpft (muted). Das Vorzeichen und
 * der Trendpfeil bleiben die harten Indikatoren.
 */
export function changeWeight(up: boolean): string {
  return up ? "font-bold text-foreground" : "font-normal text-muted";
}
