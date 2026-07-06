#!/usr/bin/env node
/**
 * Einmaliges Hilfs-Script: erzeugt den GOOGLE_REFRESH_TOKEN fürs
 * Kalender-Widget.
 *
 *   node scripts/get-google-refresh-token.js
 *
 * Ablauf: Script startet einen lokalen Mini-Server, gibt einen Google-
 * Auth-Link aus → Link im Browser öffnen, einloggen, Zugriff bestätigen →
 * Google leitet auf localhost zurück, das Script tauscht den Code und
 * druckt den Refresh-Token in die Konsole. Den Wert manuell als
 * GOOGLE_REFRESH_TOKEN in .env.local eintragen.
 *
 * Voraussetzung: GOOGLE_CLIENT_ID und GOOGLE_CLIENT_SECRET in .env.local.
 * OAuth-Client-Typ in der GCP-Console: am besten "Desktop-App"; bei
 * "Webanwendung" muss http://localhost:53682/callback als autorisierte
 * Redirect-URI eingetragen sein (sonst: redirect_uri_mismatch).
 */

const fs = require("fs");
const http = require("http");
const path = require("path");
const { google } = require("googleapis");

const LOG_PREFIX = "[get-google-refresh-token]";
const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/tasks.readonly",
];
const TIMEOUT_MS = 5 * 60_000;

function log(message) {
  console.log(`${LOG_PREFIX} ${message}`);
}

function fail(message) {
  console.error(`${LOG_PREFIX} FEHLER: ${message}`);
  process.exitCode = 1;
}

/** Minimaler .env.local-Loader — kein dotenv-Paket nötig. */
function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID und/oder GOOGLE_CLIENT_SECRET fehlen in .env.local — zuerst den OAuth-Client in der GCP-Console anlegen."
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // ohne offline gibt es keinen Refresh-Token
    prompt: "consent", // erzwingt neuen Refresh-Token, auch wenn schon mal zugestimmt wurde
    scope: SCOPES,
  });

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    if (url.pathname !== "/callback") {
      res.writeHead(404).end();
      return;
    }

    const errorParam = url.searchParams.get("error");
    const code = url.searchParams.get("code");

    const page = (title, body) =>
      `<!doctype html><html lang="de"><meta charset="utf-8"><title>${title}</title>` +
      `<body style="background:#0a0a0a;color:#e5e5e5;font-family:system-ui;display:flex;` +
      `align-items:center;justify-content:center;min-height:100vh;text-align:center">` +
      `<div><h1 style="font-size:1.2rem">${title}</h1><p style="color:#8f8f94">${body}</p></div></body></html>`;

    try {
      if (errorParam) throw new Error(`Google meldet: ${errorParam}`);
      if (!code) throw new Error("Kein Auth-Code in der Antwort.");

      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        throw new Error(
          "Google hat keinen Refresh-Token geliefert (Access-Token kam an). Nochmal ausführen — prompt=consent sollte das eigentlich erzwingen."
        );
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(page("Fertig ✓", "Der Refresh-Token steht in der Konsole. Dieses Fenster kann zu."));

      console.log("");
      log("Erfolg! In .env.local eintragen:");
      console.log("");
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log("");
      log("Danach den Dev-Server neu laden — das Kalender-Widget springt auf „Live“.");
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
      res.end(page("Fehlgeschlagen", String(err.message || err)));
      fail(err.message || String(err));
    } finally {
      server.close();
      clearTimeout(timer);
    }
  });

  const timer = setTimeout(() => {
    fail(`Keine Antwort innerhalb von ${TIMEOUT_MS / 60000} Minuten — Script beendet. Einfach erneut starten.`);
    server.close();
  }, TIMEOUT_MS);

  server.listen(PORT, () => {
    log(`Lokaler Callback-Server läuft auf ${REDIRECT_URI}`);
    log("Diesen Link im Browser öffnen und mit dem Google-Konto anmelden:");
    console.log("");
    console.log(authUrl);
    console.log("");
    log("Warte auf die Rückleitung von Google … (Abbruch: Strg+C)");
  });

  server.on("error", (err) => {
    clearTimeout(timer);
    if (err.code === "EADDRINUSE") {
      fail(`Port ${PORT} ist belegt — anderes Programm schließen oder PORT im Script ändern.`);
    } else {
      fail(String(err.message || err));
    }
  });
}

main().catch((err) => fail(err.message || String(err)));
