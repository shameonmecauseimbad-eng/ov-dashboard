import { unstable_cache } from "next/cache";

export type CalendarEvent = {
  title: string;
  /** ISO-Zeitstempel bzw. YYYY-MM-DD bei ganztägigen Terminen. */
  start: string;
  allDay: boolean;
};

export type Task = {
  title: string;
  /** Google Tasks kennt nur Fälligkeits-DATEN (RFC3339, Zeitanteil ohne Bedeutung). */
  due: string | null;
};

export type GoogleData = {
  events: CalendarEvent[];
  tasks: Task[];
};

/**
 * Access-Token aus dem Refresh-Token holen. Wirft mit maschinenlesbaren
 * Markern (GOOGLE_AUTH_*) — das Widget übersetzt sie in deutsche Hinweise.
 */
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN ?? "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const body = await res.text();
    if (body.includes("invalid_grant")) throw new Error("GOOGLE_AUTH_INVALID_GRANT");
    if (body.includes("invalid_client")) throw new Error("GOOGLE_AUTH_INVALID_CLIENT");
    throw new Error(`GOOGLE_AUTH_HTTP_${res.status}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("GOOGLE_AUTH_NO_TOKEN");
  return json.access_token;
}

/**
 * Nächste Termine (Hauptkalender "primary") und offene Tasks (Standardliste
 * "@default") — reine GET-Aufrufe, es wird nichts geschrieben.
 */
async function loadGoogleUncached(): Promise<GoogleData> {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  const eventsUrl = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  );
  eventsUrl.searchParams.set("timeMin", new Date().toISOString());
  eventsUrl.searchParams.set("singleEvents", "true"); // Serien-Termine expandieren
  eventsUrl.searchParams.set("orderBy", "startTime");
  eventsUrl.searchParams.set("maxResults", "5");
  eventsUrl.searchParams.set("timeZone", "Europe/Vienna");

  const tasksUrl = new URL("https://tasks.googleapis.com/tasks/v1/lists/@default/tasks");
  tasksUrl.searchParams.set("showCompleted", "false");
  tasksUrl.searchParams.set("showHidden", "false");
  tasksUrl.searchParams.set("maxResults", "50");

  const [eventsRes, tasksRes] = await Promise.all([
    fetch(eventsUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) }),
    fetch(tasksUrl, { headers, cache: "no-store", signal: AbortSignal.timeout(8000) }),
  ]);

  if (!eventsRes.ok) throw new Error(`GOOGLE_CALENDAR_HTTP_${eventsRes.status}`);
  if (!tasksRes.ok) throw new Error(`GOOGLE_TASKS_HTTP_${tasksRes.status}`);

  const eventsJson = (await eventsRes.json()) as {
    items?: Array<{ summary?: string; start?: { dateTime?: string; date?: string } }>;
  };
  const events: CalendarEvent[] = (eventsJson.items ?? []).map((item) => {
    const allDay = Boolean(item.start?.date && !item.start?.dateTime);
    return {
      title: item.summary || "(ohne Titel)",
      start: item.start?.dateTime ?? item.start?.date ?? "",
      allDay,
    };
  });

  const tasksJson = (await tasksRes.json()) as {
    items?: Array<{ title?: string; due?: string; status?: string }>;
  };
  const tasks: Task[] = (tasksJson.items ?? [])
    .filter((item) => item.status !== "completed")
    .map((item) => ({
      title: item.title || "(ohne Titel)",
      due: item.due ?? null,
    }))
    .sort((a, b) => {
      if (a.due && b.due) return a.due.localeCompare(b.due);
      if (a.due) return -1;
      if (b.due) return 1;
      return a.title.localeCompare(b.title, "de");
    })
    .slice(0, 5);

  return { events, tasks };
}

/** 5 Minuten gecacht; Fehler werden nicht gecacht. */
export const loadGoogle = unstable_cache(loadGoogleUncached, ["google-calendar-tasks"], {
  revalidate: 300,
});
