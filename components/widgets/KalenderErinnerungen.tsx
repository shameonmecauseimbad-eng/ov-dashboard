import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { loadGoogle, type GoogleData } from "@/lib/google";

type LoadResult =
  | ({ status: "ok" } & GoogleData)
  | { status: "error"; hint: string };

const fmtDay = new Intl.DateTimeFormat("de-AT", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  timeZone: "Europe/Vienna",
});
const fmtTime = new Intl.DateTimeFormat("de-AT", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Vienna",
});

function errorHint(err: unknown): string {
  const msg = String(err);
  if (msg.includes("GOOGLE_AUTH_INVALID_GRANT")) {
    return "Google-Refresh-Token ist ungültig oder widerrufen — neuen Token erzeugen (OAuth 2.0 Playground, Scopes calendar.readonly + tasks.readonly).";
  }
  if (msg.includes("GOOGLE_AUTH_INVALID_CLIENT")) {
    return "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET stimmen nicht — Zugangsdaten aus der GCP-Console prüfen.";
  }
  if (msg.includes("GOOGLE_AUTH")) {
    return "Google-Anmeldung fehlgeschlagen — Client-ID, Secret und Refresh-Token in .env.local prüfen.";
  }
  if (msg.includes("GOOGLE_CALENDAR_HTTP_403") || msg.includes("GOOGLE_TASKS_HTTP_403")) {
    return "Zugriff verweigert (403) — Calendar API bzw. Tasks API im GCP-Projekt aktivieren und Scopes des Refresh-Tokens prüfen.";
  }
  if (msg.includes("GOOGLE_CALENDAR_HTTP") || msg.includes("GOOGLE_TASKS_HTTP")) {
    return "Google-API-Fehler — Details stehen im Server-Log.";
  }
  return "Google-APIs sind gerade nicht erreichbar.";
}

async function load(): Promise<LoadResult> {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REFRESH_TOKEN
  ) {
    return {
      status: "error",
      hint: "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET und GOOGLE_REFRESH_TOKEN in .env.local setzen — Anleitung steht im README.",
    };
  }

  try {
    const data = await loadGoogle();
    return { status: "ok", ...data };
  } catch (err) {
    return { status: "error", hint: errorHint(err) };
  }
}

/** Nächste 5 Termine (Google Calendar, primary) + 5 offene Tasks (Google Tasks, @default) — read-only, Europe/Vienna. */
export default async function KalenderErinnerungen() {
  const result = await load();
  const now = Date.now();

  return (
    <WidgetCard
      title="Kalender & Erinnerungen"
      badge={result.status === "ok" ? "Live" : "Offline"}
      badgeTone={result.status === "ok" ? "accent" : "neutral"}
    >
      {result.status === "ok" ? (
        <>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-muted">
            Nächste Termine
          </p>
          {result.events.length === 0 ? (
            <p className="text-xs text-muted">Keine anstehenden Termine.</p>
          ) : (
            <ul className="space-y-2.5">
              {result.events.map((event, i) => {
                const start = new Date(event.start);
                return (
                  <li key={`${event.start}-${i}`} className="flex items-baseline gap-3 text-sm">
                    <span className="w-[7.5rem] shrink-0 font-mono text-xs tabular-nums text-muted">
                      {fmtDay.format(start)}
                      {" · "}
                      {event.allDay ? "ganztägig" : fmtTime.format(start)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-foreground">{event.title}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mb-3 mt-6 text-xs uppercase tracking-[0.12em] text-muted">
            Offene Tasks
          </p>
          {result.tasks.length === 0 ? (
            <p className="text-xs text-muted">Keine offenen Tasks.</p>
          ) : (
            <ul className="space-y-2.5">
              {result.tasks.map((task, i) => {
                // Google-Tasks-Fälligkeit ist ein reines Datum — überfällig erst ab Folgetag
                const overdue =
                  task.due !== null &&
                  new Date(task.due).getTime() < now - 86_400_000;
                return (
                  <li key={`${task.title}-${i}`} className="flex items-baseline gap-3 text-sm">
                    <span
                      className="relative top-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-white/25"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">{task.title}</span>
                    {task.due && (
                      <span
                        className={`shrink-0 font-mono text-xs tabular-nums ${
                          overdue ? "text-danger-soft" : "text-muted"
                        }`}
                      >
                        {overdue && "überfällig · "}
                        {fmtDay.format(new Date(task.due))}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: Google Calendar + Tasks · read-only · Europe/Vienna · Cache 5 Min.
          </p>
        </>
      ) : (
        <ErrorNote>{result.hint}</ErrorNote>
      )}
    </WidgetCard>
  );
}
