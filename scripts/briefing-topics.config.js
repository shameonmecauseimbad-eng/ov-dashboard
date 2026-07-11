/**
 * Kanonische Themen-Liste fürs Morgen-Briefing — die eine Quelle der Wahrheit
 * für (a) den Hermes Agent (welche Themen er täglich schreibt) und (b) das
 * Seed-Script scripts/seed-briefing-topics.js.
 *
 * `label` = exakter Wert der Spalte `thema` in dashboard.morning_briefing
 *           (die Widgets gruppieren danach — Schreibweise muss konstant bleiben).
 * `fokus` = kurze Leitplanke für den Agent, welchen Ausschnitt das Thema abdeckt.
 *
 * Reihenfolge = gedachte Lese-/Prioritätsreihenfolge (Finanz zuerst, dann
 * Geopolitik, dann Energie als Bindeglied).
 */
const BRIEFING_TOPICS = [
  { label: "Märkte", fokus: "Aktienindizes, Anleihen, Risikostimmung (S&P, Nasdaq, DAX)" },
  { label: "Geldpolitik", fokus: "Fed & EZB, Zinsen, Inflation, Liquidität" },
  { label: "Krypto", fokus: "Bitcoin, Ethereum, Altcoins, Regulierung, On-Chain" },
  { label: "US-Politik", fokus: "Trump-Administration, Kongress, Wahlen, Fiskalpolitik" },
  { label: "China", fokus: "Handel & Zölle, Taiwan, Konjunktur, Tech-Sektor" },
  { label: "Iran", fokus: "Nahost-Eskalation, Atomprogramm, Stellvertreterkonflikte" },
  { label: "Energie & Öl", fokus: "Brent/WTI, OPEC+, Erdgas, Angebotsschocks" },
];

module.exports = { BRIEFING_TOPICS };
