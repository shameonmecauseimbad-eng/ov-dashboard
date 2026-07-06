#!/usr/bin/env node
/**
 * Sync-Script für den Hermes Agent (Cron-Aufruf, unabhängig vom Next.js-Server):
 *
 *   node scripts/sync-social-stats.js
 *
 * Schreibt Follower-/View-Zahlen per Upsert in die Supabase-Tabelle
 * "dashboard.social_stats" (platform = Unique-Key, eigenes Schema). Die echten Zahlen liefert später
 * Hermes: entweder diese Datei importieren und syncSocialStats([...]) mit
 * eigenen Werten aufrufen, oder unten in main() den Platzhalter-Aufruf
 * ersetzen. Scraping-Logik gehört bewusst NICHT hierher.
 *
 * Braucht SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY aus .env.local —
 * der Anon-Key darf (RLS) nicht schreiben, das Frontend bleibt read-only.
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { platforms } = require("./social-platforms.config");

const LOG_PREFIX = "[sync-social-stats]";

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
 * Upsert der übergebenen Werte nach "social_stats".
 * @param {Array<{ platform: string, followers: number, views_24h: number }>} stats
 * @returns {Promise<number>} Anzahl geschriebener Zeilen
 */
async function syncSocialStats(stats) {
  loadEnvLocal();

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL und/oder SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local — ohne Service-Role-Key kein Schreibzugriff."
    );
  }

  if (!Array.isArray(stats) || stats.length === 0) {
    throw new Error("Keine Werte übergeben — erwartet wird ein Array aus { platform, followers, views_24h }.");
  }

  const known = new Set(platforms.map((p) => p.toLowerCase()));
  const rows = [];
  for (const entry of stats) {
    const platform = String(entry.platform || "").trim().toLowerCase();
    const followers = Number(entry.followers);
    const views = Number(entry.views_24h);

    if (!platform) {
      log("WARNUNG: Eintrag ohne platform übersprungen.");
      continue;
    }
    if (!known.has(platform)) {
      log(`WARNUNG: "${platform}" steht nicht in social-platforms.config.js — übersprungen.`);
      continue;
    }
    if (!Number.isFinite(followers) || !Number.isFinite(views)) {
      log(`WARNUNG: "${platform}" hat ungültige Zahlen (followers=${entry.followers}, views_24h=${entry.views_24h}) — übersprungen.`);
      continue;
    }

    rows.push({
      platform,
      followers: Math.round(followers),
      views_24h: Math.round(views),
      updated_at: new Date().toISOString(),
    });
  }

  if (rows.length === 0) {
    throw new Error("Nach Validierung blieb keine einzige gültige Zeile übrig — nichts geschrieben.");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .schema("dashboard")
    .from("social_stats")
    .upsert(rows, { onConflict: "platform" });

  if (error) {
    const hint =
      error.code === "PGRST106"
        ? " — Schema 'dashboard' in Supabase unter Project Settings -> Data API -> Exposed schemas freischalten."
        : "";
    throw new Error(`Supabase-Upsert fehlgeschlagen (${error.code || "?"}): ${error.message}${hint}`);
  }

  for (const row of rows) {
    log(`OK: ${row.platform} → ${row.followers} Follower, ${row.views_24h} Views/24h`);
  }
  log(`Fertig: ${rows.length} Plattform(en) geschrieben.`);
  return rows.length;
}

async function main() {
  // Platzhalter-Werte für alle konfigurierten Plattformen.
  // Hermes ersetzt diesen Aufruf durch echte Zahlen aus seinem Scraper.
  const placeholder = platforms.map((platform) => ({
    platform,
    followers: 0,
    views_24h: 0,
  }));

  log(`Starte Sync für: ${platforms.join(", ")}`);
  await syncSocialStats(placeholder);
}

module.exports = { syncSocialStats };

if (require.main === module) {
  main().catch((err) => fail(err.message));
}
