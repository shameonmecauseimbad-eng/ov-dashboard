import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Alle Dashboard-Tabellen liegen im eigenen Schema "dashboard" (nicht in
 * "public"), damit sie im geteilten DDD-Supabase-Projekt sauber getrennt
 * bleiben. Queries referenzieren das Schema explizit:
 *
 *   getSupabase()?.schema(DASHBOARD_SCHEMA).from("ddd_stats")…
 *
 * Achtung: Das Schema muss in Supabase unter Project Settings → Data API →
 * "Exposed schemas" freigeschaltet sein, sonst liefert PostgREST PGRST106.
 */
export const DASHBOARD_SCHEMA = "dashboard";

/** Übersetzt PostgREST-Fehlercodes in handlungsfähige deutsche Hinweise. */
export function supabaseHint(code: string | null, message: string, table: string): string {
  if (code === "PGRST205") {
    return `Tabelle „dashboard.${table}“ existiert noch nicht — Migrations-SQL aus dem README im Supabase-SQL-Editor ausführen.`;
  }
  if (code === "PGRST106") {
    return "Schema „dashboard“ ist nicht freigeschaltet — in Supabase: Project Settings → Data API → Exposed schemas → „dashboard“ ergänzen.";
  }
  return `Supabase-Fehler: ${message}`;
}

/**
 * Server-seitiger Supabase-Client, nur Lesezugriff per Anon-Key.
 * Die Env-Vars tragen bewusst KEIN NEXT_PUBLIC_-Präfix: sie werden nie
 * ins Browser-Bundle eingebettet, alle Queries laufen in Server Components.
 * Gibt null zurück, solange .env.local nicht befüllt ist — Widgets zeigen
 * dann einen Konfigurations-Hinweis.
 */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
