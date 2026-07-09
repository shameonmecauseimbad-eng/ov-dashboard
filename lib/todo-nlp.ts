import { PROJECT_TAGS, type Priority, type ProjectTag } from "@/lib/todo-types";

/**
 * Leichtgewichtiges Natural-Language-Parsing für das Quick-Add-Feld der
 * Zeitleiste — rein Regex/Keyword-basiert, KEIN LLM-Call. Erkennt in einer
 * deutschen Eingabe wie „morgen 9 Uhr DDD Bugfix" das Fälligkeitsdatum, die
 * Uhrzeit, den Projekt-Tag und die Priorität und gibt den bereinigten Titel
 * zurück. Bewusst konservativ: was nicht sicher erkannt wird, bleibt Titel.
 */

const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

export type QuickAddParse = {
  /** Bereinigter Titel (erkannte Tokens entfernt). Kann leer sein. */
  title: string;
  /** YYYY-MM-DD oder null (dann behandelt der Aufrufer es als „heute"). */
  date: string | null;
  /** HH:MM oder null (= ganztägig). */
  time: string | null;
  projectTag: ProjectTag;
  priority: Priority;
  /** Was tatsächlich erkannt wurde — für die Live-Vorschau im UI. */
  matched: { date: boolean; time: boolean; project: boolean; priority: boolean };
};

// Projekt-Tag → erkennbare Schlüsselwörter (Reihenfolge: längere zuerst matchen).
const PROJECT_ALIASES: Record<ProjectTag, string[]> = {
  ddd: ["drawdowndiary", "ddd"],
  redzone: ["redzoneearth", "redzone earth", "redzone", "rze"],
  "ov-dashboard": ["ov-dashboard", "ov dashboard", "ovdashboard", "dashboard"],
  sonstiges: ["sonstiges", "sonstige", "misc"],
};

const WEEKDAYS: Record<string, number> = {
  sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6, sonnabend: 6,
};

/** Wiener Kalenderdatum + delta Tage → YYYY-MM-DD (DST-sicher, auf 12:00 UTC verankert). */
function shiftDay(base: Date, delta: number): string {
  const [y, m, d] = dayKey.format(base).split("-").map(Number);
  return dayKey.format(new Date(Date.UTC(y, m - 1, d + delta, 12)));
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseQuickAdd(input: string, now: Date = new Date()): QuickAddParse {
  let rest = ` ${input} `;
  const matched = { date: false, time: false, project: false, priority: false };
  let date: string | null = null;
  let time: string | null = null;
  let projectTag: ProjectTag = "sonstiges";
  let priority: Priority = "medium";

  const cut = (re: RegExp) => {
    rest = rest.replace(re, " ");
  };

  // ─── Priorität: „!" oder „!!" bzw. „wichtig" → hoch, „!low"/„niedrig" → niedrig ───
  if (/(^|\s)(!+|wichtig|dringend)(\s|$)/i.test(rest)) {
    priority = "high";
    matched.priority = true;
    cut(/(^|\s)(!+|wichtig|dringend)(?=\s|$)/gi);
  } else if (/(^|\s)(niedrig|unwichtig)(\s|$)/i.test(rest)) {
    priority = "low";
    matched.priority = true;
    cut(/(^|\s)(niedrig|unwichtig)(?=\s|$)/gi);
  }

  // ─── Projekt-Tag ─────────────────────────────────────────────────────────────
  for (const tag of PROJECT_TAGS) {
    const alias = PROJECT_ALIASES[tag].find((a) => new RegExp(`(^|\\s)${escapeRe(a)}(\\s|$)`, "i").test(rest));
    if (alias) {
      projectTag = tag;
      matched.project = true;
      cut(new RegExp(`(^|\\s)${escapeRe(alias)}(?=\\s|$)`, "i"));
      break;
    }
  }

  // ─── Datum ───────────────────────────────────────────────────────────────────
  // Relative Schlüsselwörter
  if (/(^|\s)heute(\s|$)/i.test(rest)) {
    date = shiftDay(now, 0); matched.date = true; cut(/(^|\s)heute(?=\s|$)/i);
  } else if (/(^|\s)(morgen)(\s|$)/i.test(rest) && !/(^|\s)übermorgen(\s|$)/i.test(rest)) {
    date = shiftDay(now, 1); matched.date = true; cut(/(^|\s)morgen(?=\s|$)/i);
  } else if (/(^|\s)übermorgen(\s|$)/i.test(rest)) {
    date = shiftDay(now, 2); matched.date = true; cut(/(^|\s)übermorgen(?=\s|$)/i);
  } else if (/(^|\s)(nächste|naechste)\s+woche(\s|$)/i.test(rest)) {
    date = shiftDay(now, 7); matched.date = true; cut(/(^|\s)(nächste|naechste)\s+woche(?=\s|$)/i);
  } else {
    // Wochentag
    const wd = Object.keys(WEEKDAYS).find((w) => new RegExp(`(^|\\s)${w}(\\s|$)`, "i").test(rest));
    if (wd) {
      const [y, m, d] = dayKey.format(now).split("-").map(Number);
      const todayDow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
      const delta = (WEEKDAYS[wd] - todayDow + 7) % 7; // 0 = heute
      date = shiftDay(now, delta); matched.date = true;
      cut(new RegExp(`(^|\\s)${wd}(?=\\s|$)`, "i"));
    } else {
      // Explizites Datum: 12.7. / 12.07.2026 / 12.07
      const md = rest.match(/(^|\s)(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?(\s|$)/);
      if (md) {
        const dd = Number(md[2]); const mm = Number(md[3]);
        const yy = md[4] ? Number(md[4].length === 2 ? `20${md[4]}` : md[4]) : Number(dayKey.format(now).slice(0, 4));
        if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
          date = dayKey.format(new Date(Date.UTC(yy, mm - 1, dd, 12)));
          matched.date = true;
          cut(/(^|\s)\d{1,2}\.\d{1,2}\.?(\d{2,4})?(?=\s|$)/);
        }
      }
    }
  }

  // ─── Uhrzeit ─────────────────────────────────────────────────────────────────
  const setTime = (h: number, min: number) => {
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      time = `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      matched.time = true;
      return true;
    }
    return false;
  };
  // HH:MM
  const hm = rest.match(/(^|\s)(\d{1,2}):(\d{2})(\s|$)/);
  if (hm && setTime(Number(hm[2]), Number(hm[3]))) {
    cut(/(^|\s)\d{1,2}:\d{2}(?=\s|$)/);
  } else {
    // „um 9", „9 Uhr", „9h"
    const uhr = rest.match(/(^|\s)(?:um\s+)?(\d{1,2})\s*(?:uhr|h)(\s|$)/i);
    const umOnly = rest.match(/(^|\s)um\s+(\d{1,2})(\s|$)/i);
    if (uhr && setTime(Number(uhr[2]), 0)) {
      cut(/(^|\s)(?:um\s+)?\d{1,2}\s*(?:uhr|h)(?=\s|$)/i);
    } else if (umOnly && setTime(Number(umOnly[2]), 0)) {
      cut(/(^|\s)um\s+\d{1,2}(?=\s|$)/i);
    }
  }

  const title = rest.replace(/\s+/g, " ").trim();
  return { title, date, time, projectTag, priority, matched };
}
