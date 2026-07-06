const rtf = new Intl.RelativeTimeFormat("de", { numeric: "auto", style: "short" });

/** ISO-Zeitstempel → "gerade eben", "vor 5 Min.", "vor 2 Std.", "vor 3 Tagen" … */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return "gerade eben";
  if (abs < 3600) return rtf.format(Math.trunc(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.trunc(diffSec / 3600), "hour");
  if (abs < 604800) return rtf.format(Math.trunc(diffSec / 86400), "day");
  if (abs < 2629800) return rtf.format(Math.trunc(diffSec / 604800), "week");
  return rtf.format(Math.trunc(diffSec / 2629800), "month");
}
