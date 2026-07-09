export type ItemType = "event" | "task";
export type Priority = "high" | "medium" | "low";
export type ProjectTag = "ddd" | "redzone" | "ov-dashboard" | "sonstiges";

export const PROJECT_TAGS: ProjectTag[] = ["ddd", "redzone", "ov-dashboard", "sonstiges"];

export const PROJECT_TAG_LABEL: Record<ProjectTag, string> = {
  ddd: "DDD",
  redzone: "RedzoneEarth",
  "ov-dashboard": "ov-dashboard",
  sonstiges: "Sonstiges",
};

/** Monochrom: Priorität rein über Font-Weight + Opacity, kein Farbcode. */
export const PRIORITY_STYLE: Record<Priority, { weight: string; opacity: string; label: string }> = {
  high: { weight: "font-bold", opacity: "opacity-100", label: "Hoch" },
  medium: { weight: "font-medium", opacity: "opacity-70", label: "Mittel" },
  low: { weight: "font-normal", opacity: "opacity-45", label: "Niedrig" },
};

/**
 * Einheitliches, normalisiertes Interface für Termine UND Erinnerungen —
 * die gemeinsame Zeitleiste kennt nur diesen Typ. Termine (type: "event")
 * kommen aus dem Kalender, To-Dos (type: "task") aus den Erinnerungen.
 */
export type TaskOrEvent = {
  id: string;
  title: string;
  type: ItemType;
  /** ISO-Zeitstempel: bei Terminen der Start, bei To-Dos die Fälligkeit. null = To-Do ohne Datum. */
  at: string | null;
  /** true = ganztägiger Termin bzw. To-Do ohne Uhrzeit. */
  allDay: boolean;
  projectTag: ProjectTag;
  priority: Priority;
  done: boolean;
};
