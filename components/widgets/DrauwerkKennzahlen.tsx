import { DrauwerkKennzahlenCard } from "@/components/widgets/DrauwerkDetail";

/**
 * "Drauwerk"-Widget fürs Overview: dieselbe Kennzahlen-Karte wie oben auf der
 * /drauwerk-Seite (PageSpeed, Startpreis, Komponenten, Launch-Reife). Statische
 * Projektdaten aus dem Obsidian-Vault (lib/drauwerk.ts) — keine Live-Quelle.
 */
export default function DrauwerkKennzahlen() {
  return <DrauwerkKennzahlenCard title="Drauwerk" />;
}
