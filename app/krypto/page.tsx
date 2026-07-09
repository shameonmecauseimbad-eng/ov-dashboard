import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import { matchCoinsInEntries, type BriefingEntry, type CoinMention } from "@/lib/crypto-briefing";
import { DASHBOARD_SCHEMA, getSupabase } from "@/lib/supabase";
import KryptoDetail from "./components/KryptoDetail";

export const metadata = { title: "Krypto · Overview Dashboard" };
export const revalidate = 300;

/**
 * Ermittelt server-seitig, welche kuratierten Coins im neuesten Morgen-Briefing
 * vorkommen (neuester Eintrag pro Thema). Fehlt Supabase oder die Tabelle,
 * bleibt die Liste leer — der Krypto-Bereich funktioniert trotzdem.
 */
async function loadBriefingMentions(): Promise<CoinMention[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .schema(DASHBOARD_SCHEMA)
      .from("morning_briefing")
      .select("thema, inhalt, erstellt_am, datum")
      .order("datum", { ascending: false })
      .order("erstellt_am", { ascending: false })
      .limit(60);

    if (error || !data) return [];

    // Neuester Eintrag pro Thema.
    const latestPerThema = new Map<string, { thema: string; inhalt: string }>();
    for (const row of data as Array<{ thema: string; inhalt: string }>) {
      if (!latestPerThema.has(row.thema)) latestPerThema.set(row.thema, row);
    }

    const entries: BriefingEntry[] = Array.from(latestPerThema.values()).map((r) => ({
      category: r.thema,
      text: r.inhalt,
    }));
    return matchCoinsInEntries(entries);
  } catch {
    return [];
  }
}

export default async function KryptoPage() {
  const mentions = await loadBriefingMentions();

  return (
    <>
      <PageHeader title="Krypto" subtitle="Portfolio, Kurse & Briefing-Bezug" />
      <main className="mx-auto w-full max-w-[1800px] flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <Widget title="Krypto" index={0} skeleton="stats">
          <KryptoDetail mentions={mentions} />
        </Widget>
      </main>
    </>
  );
}
