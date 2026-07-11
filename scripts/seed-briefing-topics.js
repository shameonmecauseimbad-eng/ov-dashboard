#!/usr/bin/env node
/**
 * Seed-Script fürs Morgen-Briefing: stellt sicher, dass JEDES in
 * scripts/briefing-topics.config.js definierte Thema einen Eintrag für HEUTE
 * (Europe/Vienna) in dashboard.morning_briefing hat — damit das Dashboard das
 * komplette Themen-Set anzeigt, auch bevor der Hermes Agent echten Text liefert.
 *
 *   node scripts/seed-briefing-topics.js
 *
 * Idempotent: Themen, die für heute schon existieren, werden übersprungen.
 * Schreibt bewusst nur einen neutralen Platzhalter (KEIN erfundener Inhalt) —
 * echten Briefing-Text liefert ausschließlich der Hermes Agent.
 *
 * Braucht SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY aus .env.local (der Anon-Key
 * darf per RLS nicht schreiben, das Frontend bleibt read-only).
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { BRIEFING_TOPICS } = require("./briefing-topics.config");

const LOG_PREFIX = "[seed-briefing-topics]";
const PLACEHOLDER = "Platzhalter — wartet auf den Hermes Agent.";

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

/** Heutiges Datum als YYYY-MM-DD in Europe/Vienna. */
function todayVienna() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const datum = todayVienna();

  const { data, error } = await supabase
    .schema("dashboard")
    .from("morning_briefing")
    .select("thema")
    .eq("datum", datum);
  if (error) {
    const hint =
      error.code === "PGRST106"
        ? " — Schema 'dashboard' in Supabase unter Project Settings -> Data API -> Exposed schemas freischalten."
        : "";
    throw new Error(`Supabase-Select fehlgeschlagen (${error.code || "?"}): ${error.message}${hint}`);
  }

  const existing = new Set((data ?? []).map((r) => r.thema));
  const missing = BRIEFING_TOPICS.filter((t) => !existing.has(t.label));

  if (missing.length === 0) {
    log(`Nichts zu tun — alle ${BRIEFING_TOPICS.length} Themen haben bereits einen Eintrag für ${datum}.`);
    return;
  }

  const rows = missing.map((t) => ({ thema: t.label, inhalt: PLACEHOLDER, datum }));
  const { error: insErr } = await supabase.schema("dashboard").from("morning_briefing").insert(rows);
  if (insErr) {
    throw new Error(`Supabase-Insert fehlgeschlagen (${insErr.code || "?"}): ${insErr.message}`);
  }

  log(`OK: ${rows.length} Thema(en) für ${datum} geseedet: ${missing.map((m) => m.label).join(", ")}`);
}

if (require.main === module) {
  main().catch((err) => fail(err.message));
}

module.exports = { main };
