#!/usr/bin/env node
/**
 * Briefing-Script für den Hermes Agent (täglicher Cron, unabhängig vom
 * Next.js-Server):
 *
 *   node scripts/sync-morning-briefing.js --thema "Märkte" --inhalt "Text..." [--datum 2026-07-05]
 *
 * Schreibt einen Eintrag per Insert in die Supabase-Tabelle
 * "dashboard.morning_briefing" (eigenes Schema). Hermes kann alternativ insertBriefing({...})
 * importieren und direkt mit Werten aufrufen.
 *
 * Braucht SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY aus .env.local —
 * der Anon-Key darf (RLS) nicht schreiben, das Frontend bleibt read-only.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const LOG_PREFIX = "[sync-morning-briefing]";

function log(message) {
  console.log(`${LOG_PREFIX} ${new Date().toISOString()} ${message}`);
}

function fail(message) {
  console.error(`${LOG_PREFIX} ${new Date().toISOString()} FEHLER: ${message}`);
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

/**
 * Schreibt einen Briefing-Eintrag.
 * @param {{ thema: string, inhalt: string, datum?: string }} entry
 *   datum optional im Format YYYY-MM-DD; ohne Angabe setzt die DB das
 *   heutige Datum (Europe/Vienna) per Default.
 */
async function insertBriefing(entry) {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL und/oder SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local — ohne Service-Role-Key kein Schreibzugriff."
    );
  }

  const thema = String(entry?.thema ?? "").trim();
  const inhalt = String(entry?.inhalt ?? "").trim();
  const datum = entry?.datum ? String(entry.datum).trim() : undefined;

  if (!thema || !inhalt) {
    throw new Error('Pflichtfelder fehlen — erwartet: { thema: "…", inhalt: "…" }.');
  }
  if (datum && !/^\d{4}-\d{2}-\d{2}$/.test(datum)) {
    throw new Error(`Ungültiges Datum "${datum}" — erwartet wird YYYY-MM-DD.`);
  }

  const row = { thema, inhalt };
  if (datum) row.datum = datum;

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.schema("dashboard").from("morning_briefing").insert(row);
  if (error) {
    const hint =
      error.code === "PGRST106"
        ? " — Schema 'dashboard' in Supabase unter Project Settings -> Data API -> Exposed schemas freischalten."
        : "";
    throw new Error(`Supabase-Insert fehlgeschlagen (${error.code || "?"}): ${error.message}${hint}`);
  }

  log(`OK: Briefing „${thema}“ (${datum ?? "heute per DB-Default"}) geschrieben.`);
}

function getArg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : undefined;
}

async function main() {
  const thema = getArg("thema");
  const inhalt = getArg("inhalt");
  const datum = getArg("datum");

  if (!thema || !inhalt) {
    throw new Error(
      'Aufruf: node scripts/sync-morning-briefing.js --thema "Märkte" --inhalt "Text…" [--datum YYYY-MM-DD]'
    );
  }

  await insertBriefing({ thema, inhalt, datum });
}

module.exports = { insertBriefing };

if (require.main === module) {
  main().catch((err) => fail(err.message));
}
