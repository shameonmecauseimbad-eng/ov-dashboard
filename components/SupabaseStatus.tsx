type Status = {
  ok: boolean;
  detail: string;
};

/**
 * Leichter Verbindungs-Check gegen /auth/v1/health (30 s Cache).
 * Prüft URL + Anon-Key + Erreichbarkeit — nicht, ob einzelne Tabellen
 * existieren. (Die PostgREST-Wurzel taugt nicht: sie liefert bei diesem
 * Projekt auch mit gültigem Key 401.)
 */
async function checkSupabase(): Promise<Status> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, detail: "Env-Vars fehlen" };

  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok
      ? { ok: true, detail: "verbunden" }
      : { ok: false, detail: `HTTP ${res.status}` };
  } catch {
    return { ok: false, detail: "nicht erreichbar" };
  }
}

/** Heller pulsierender / gedämpfter Punkt im Header — Status nie nur über Helligkeit, daher mit Label + Tooltip. */
export default async function SupabaseStatus() {
  const { ok, detail } = await checkSupabase();

  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted"
      title={`Supabase: ${detail}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          ok
            ? "bg-accent animate-pulse-soft motion-reduce:animate-none"
            : "bg-danger"
        }`}
        aria-hidden="true"
      />
      Supabase
      <span className="sr-only">{ok ? "verbunden" : `Fehler: ${detail}`}</span>
    </span>
  );
}
