#!/usr/bin/env node
/**
 * Batch-Schreiber fürs Morgen-Briefing (für den Hermes Agent gedacht):
 * schreibt ALLE Themen eines Tages in EINEM Aufruf nach
 * dashboard.morning_briefing — robust gegenüber Shell-Escaping, weil der
 * Inhalt als JSON kommt statt als CLI-Argument.
 *
 *   node scripts/sync-morning-briefing-batch.js briefing.json
 *   echo '[{"thema":"Märkte","inhalt":"…"}]' | node scripts/sync-morning-briefing-batch.js
 *
 * Eingabe: JSON-Array von { thema, inhalt } (aus Datei-Argument ODER stdin).
 *   - `thema` muss in scripts/briefing-topics.config.js (BRIEFING_TOPICS) stehen;
 *     unbekannte Themen werden übersprungen (Whitelist gegen Datenmüll).
 *   - Geschrieben wird für HEUTE (Europe/Vienna). Idempotent: die heutigen
 *     Zeilen der betroffenen Themen werden ersetzt (erst gelöscht, dann neu
 *     eingefügt) — ein Re-Run erzeugt also keine Dubletten.
 *
 * Braucht SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY aus .env.local (der Anon-Key
 * darf per RLS nicht schreiben, das Frontend bleibt read-only).
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { BRIEFING_TOPICS } = require("./briefing-topics.config");

const LOG_PREFIX = "[sync-morning-briefing-batch]";

function log(message) {
  console.log(`${LOG_PREFIX} ${new Date().toISOString()} ${message}`);
}
function warn(message) {
  console.warn(`${LOG_PREFIX} ${new Date().toISOString()} WARNUNG: ${message}`);
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

/** Heutiges Datum als YYYY-MM-DD in Europe/Vienna. */
function todayVienna() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function readInput() {
  const fileArg = process.argv[2];
  if (fileArg) {
    const p = path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
    if (!fs.existsSync(p)) throw new Error(`Eingabedatei nicht gefunden: ${p}`);
    return fs.readFileSync(p, "utf8");
  }
  // Kein Argument → von stdin lesen.
  const stdin = fs.readFileSync(0, "utf8");
  if (!stdin.trim()) {
    throw new Error(
      'Keine Eingabe. Aufruf: node scripts/sync-morning-briefing-batch.js briefing.json  (oder JSON via stdin)'
    );
  }
  return stdin;
}

async function main() {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL und/oder SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local — ohne Service-Role-Key kein Schreibzugriff."
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(readInput());
  } catch (err) {
    throw new Error(`Eingabe ist kein gültiges JSON: ${err.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Eingabe muss ein JSON-Array von { thema, inhalt } sein.");
  }

  const allowed = new Set(BRIEFING_TOPICS.map((t) => t.label));
  const rows = [];
  const seen = new Set();
  for (const item of parsed) {
    const thema = String(item?.thema ?? "").trim();
    const inhalt = String(item?.inhalt ?? "").trim();
    if (!thema || !inhalt) {
      warn(`Eintrag ohne thema/inhalt übersprungen: ${JSON.stringify(item).slice(0, 120)}`);
      continue;
    }
    if (!allowed.has(thema)) {
      warn(`Unbekanntes Thema "${thema}" übersprungen (nicht in BRIEFING_TOPICS).`);
      continue;
    }
    if (seen.has(thema)) {
      warn(`Doppeltes Thema "${thema}" — nur der erste Eintrag wird verwendet.`);
      continue;
    }
    seen.add(thema);
    rows.push({ thema, inhalt });
  }

  if (rows.length === 0) {
    throw new Error("Keine gültigen Einträge nach Validierung — nichts geschrieben.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const datum = todayVienna();
  const themen = rows.map((r) => r.thema);

  // Idempotent: heutige Zeilen der betroffenen Themen erst entfernen …
  const { error: delErr } = await supabase
    .schema("dashboard")
    .from("morning_briefing")
    .delete()
    .eq("datum", datum)
    .in("thema", themen);
  if (delErr) {
    throw new Error(`Supabase-Delete fehlgeschlagen (${delErr.code || "?"}): ${delErr.message}`);
  }

  // … dann frisch einfügen.
  const { error: insErr } = await supabase
    .schema("dashboard")
    .from("morning_briefing")
    .insert(rows.map((r) => ({ thema: r.thema, inhalt: r.inhalt, datum })));
  if (insErr) {
    throw new Error(`Supabase-Insert fehlgeschlagen (${insErr.code || "?"}): ${insErr.message}`);
  }

  log(`OK: ${rows.length} Thema(en) für ${datum} geschrieben: ${themen.join(", ")}`);
}

if (require.main === module) {
  main().catch((err) => fail(err.message));
}

module.exports = { main };
