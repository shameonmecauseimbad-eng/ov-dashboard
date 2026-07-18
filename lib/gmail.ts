// ─── Gmail — server-seitiger, READ-ONLY Zugriff aufs Drauwerk-Postfach ───────
//
// Liest die Kontaktformular-Anfragen aus drauwerk@gmail.com. Bewusst OHNE SDK,
// nur `fetch` (konsistent mit Stripe-/Supabase-REST hier) — spart die schwere
// googleapis-Dependency zur Laufzeit.
//
// Auth: OAuth2-Refresh-Token mit Scope `gmail.readonly`. Alle drei Env-Vars
// ohne NEXT_PUBLIC (nur server-seitig, hinter dem Basic-Auth-Gate der Middleware):
//   GMAIL_CLIENT_ID · GMAIL_CLIENT_SECRET · GMAIL_REFRESH_TOKEN
// Fehlt eine, gilt Gmail als „nicht konfiguriert" → das Widget zeigt Demo-Daten.

type GmailEnv = { clientId: string; clientSecret: string; refreshToken: string };

function gmailEnv(): GmailEnv | null {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function gmailConfigured(): boolean {
  return gmailEnv() !== null;
}

// Access-Token per Refresh-Token holen (OAuth2 refresh_token grant).
async function accessToken(env: GmailEnv): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      refresh_token: env.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Gmail-Token-Refresh fehlgeschlagen (${res.status})`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("Gmail: kein access_token erhalten");
  return json.access_token;
}

// ─── Message-Parsing ─────────────────────────────────────────────────────────

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};
type GmailRaw = {
  labelIds?: string[];
  internalDate?: string;
  payload?: GmailPart & { headers?: Array<{ name: string; value: string }> };
};

export type GmailMessage = {
  id: string;
  subject: string;
  replyTo: string;
  date: number; // ms seit Epoch
  unread: boolean;
  bodyText: string;
};

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
// Auf jeder ISR-Regenerierung neu ziehen (die Seite selbst cached via revalidate).
const FETCH_OPTS = { next: { revalidate: 3600 } } as const;

function decodeB64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function headerValue(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

// Erste text/plain-Part rekursiv finden (die Anfrage-Mails sind reiner Text).
function extractText(part: GmailPart | undefined): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) return decodeB64Url(part.body.data);
  if (part.parts) {
    for (const p of part.parts) {
      const t = extractText(p);
      if (t) return t;
    }
  }
  if (part.body?.data && (!part.mimeType || part.mimeType.startsWith("text/"))) {
    return decodeB64Url(part.body.data);
  }
  return "";
}

/**
 * Anfrage-Mails abrufen. `query` ist eine Gmail-Suchsyntax (z. B.
 * `subject:"Neue Projektanfrage" newer_than:45d`). Wirft bei API-Fehlern.
 */
export async function fetchInquiryMessages(query: string, max = 100): Promise<GmailMessage[]> {
  const env = gmailEnv();
  if (!env) return [];
  const token = await accessToken(env);
  const auth = { Authorization: `Bearer ${token}` } as const;

  const listRes = await fetch(
    `${GMAIL}/messages?q=${encodeURIComponent(query)}&maxResults=${max}`,
    { headers: auth, ...FETCH_OPTS }
  );
  if (!listRes.ok) throw new Error(`Gmail-Liste fehlgeschlagen (${listRes.status})`);
  const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
  const ids = (list.messages ?? []).map((m) => m.id);

  const msgs = await Promise.all(
    ids.map(async (id): Promise<GmailMessage | null> => {
      const r = await fetch(`${GMAIL}/messages/${id}?format=full`, { headers: auth, ...FETCH_OPTS });
      if (!r.ok) return null;
      const m = (await r.json()) as GmailRaw;
      const headers = m.payload?.headers ?? [];
      const dateHeader = headerValue(headers, "Date");
      const date = dateHeader ? Date.parse(dateHeader) : Number(m.internalDate) || Date.now();
      return {
        id,
        subject: headerValue(headers, "Subject"),
        replyTo: headerValue(headers, "Reply-To"),
        date: Number.isNaN(date) ? Date.now() : date,
        unread: (m.labelIds ?? []).includes("UNREAD"),
        bodyText: extractText(m.payload).trim(),
      };
    })
  );
  return msgs.filter((m): m is GmailMessage => m !== null);
}
