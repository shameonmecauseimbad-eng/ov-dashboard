import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth-Gate für das gesamte Dashboard (HTTP Basic Auth).
 *
 * Das Dashboard zeigt Umsätze, User-Zahlen, Kalender u. a. — es darf NICHT
 * öffentlich erreichbar sein. Zugangsdaten kommen aus zwei Env-Variablen:
 *   DASHBOARD_AUTH_USER, DASHBOARD_AUTH_PASSWORD
 * (ohne NEXT_PUBLIC — nur server-/edge-seitig, nie im Browser-Bundle).
 *
 * Sind beide gesetzt, verlangt jede Anfrage gültige Credentials. Fehlen sie,
 * bleibt das Gate offen (lokale Dev) — die Warnung dazu steht in .env.example.
 * Auf Vercel MÜSSEN beide gesetzt sein. Läuft im Edge-Runtime: kein Buffer,
 * daher atob() für die Base64-Dekodierung.
 */
export const config = {
  // Alles außer Next-Interna und statischen Assets absichern.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};

/**
 * Timing-sicherer Vergleich: beide Seiten werden erst SHA-256-gehasht (feste
 * Länge), dann byteweise ohne Short-Circuit verglichen. Ein Längen-Early-Return
 * auf den Rohstrings würde die Credential-Länge über die Antwortzeit leaken.
 */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export async function middleware(req: NextRequest) {
  const user = process.env.DASHBOARD_AUTH_USER;
  const pass = process.env.DASHBOARD_AUTH_PASSWORD;

  // Kein Gate konfiguriert → durchlassen (nur lokal gedacht).
  if (!user || !pass) return NextResponse.next();

  const header = req.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    let decoded = "";
    try {
      decoded = atob(encoded);
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep !== -1) {
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      // Beide Vergleiche immer ausführen (kein Short-Circuit-Timing-Leak).
      const [userOk, passOk] = await Promise.all([safeEqual(u, user), safeEqual(p, pass)]);
      const ok = userOk && passOk;
      if (ok) return NextResponse.next();
    }
  }

  return new NextResponse("Authentifizierung erforderlich.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="OV-Dashboard", charset="UTF-8"' },
  });
}
