// P7 Orthogonales Verbindungssystem entlang der Grid-Außenränder (hinter den Karten).
import ConnectionLines from "@/components/ConnectionLines";
import FocusZoomProvider from "@/components/FocusZoom";
import PageHeader from "@/components/PageHeader";
import Widget from "@/components/Widget";
import DddKennzahlen from "@/components/widgets/DddKennzahlen";
import GithubActivity from "@/components/widgets/GithubActivity";
import KryptoKurse from "@/components/widgets/KryptoKurse";
import MorgenBriefing from "@/components/widgets/MorgenBriefing";
import RedzoneEarthAds from "@/components/widgets/RedzoneEarthAds";
import SocialMedia from "@/components/widgets/SocialMedia";
import TodoFokus from "@/components/widgets/TodoFokus";

// Supabase-Daten alle 60 Sekunden neu laden (GitHub/Google cachen 5 Min. auf Fetch-Ebene)
export const revalidate = 60;

export default function Home() {
  return (
    <>
      <PageHeader title="Overview" />

      <FocusZoomProvider>
        <div className="mx-auto w-full max-w-[1800px] flex-1 px-5 sm:px-8">
        {/* Zwei unabhängige Flex-Spalten statt CSS-Grid: Echtes Grid erzwingt
            gleiche Zeilenhöhe über beide Spalten hinweg (items-stretch je
            Reihe) — bei unterschiedlich hohen Karten entstehen dadurch große
            Lücken. CSS-Multi-Column (columns-2) hatte dieses Problem nicht,
            triggert aber den Safari-Hover-Bug (Karten verschwinden). Zwei
            eigenständige Flex-Spalten packen unabhängig ohne Zeilenzwang und
            ohne Column-Fragmentierung. Mobile: beide Spalten stapeln sich zur
            natürlichen DOM-Reihenfolge 0..6. Bei neuen Widgets die Aufteilung
            unten manuell balancieren. */}
        <main className="flex flex-col gap-4 py-8 sm:flex-row sm:gap-5 sm:py-10">
        <div className="flex flex-1 flex-col gap-4 sm:gap-5">
          {/* Tagesüberblick zuerst — Reihenfolge = DOM-Reihenfolge,
              gilt auch für die einspaltige Mobile-Ansicht. */}
          <Widget title="Morgen-Briefing" index={0} dataId="briefing" href="/briefing">
            <MorgenBriefing />
          </Widget>
          <Widget title="Fokus heute" index={1} href="/todo">
            <TodoFokus />
          </Widget>
          <Widget title="DDD Statistics" index={2} skeleton="stats" href="/ddd">
            <DddKennzahlen />
          </Widget>
          <Widget title="GitHub Activity" index={3}>
            <GithubActivity />
          </Widget>
        </div>
        <div className="flex flex-1 flex-col gap-4 sm:gap-5">
          <Widget title="Social Media" index={4} href="/social">
            <SocialMedia />
          </Widget>
          <Widget title="Krypto-Kurse" index={5} dataId="krypto" href="/krypto">
            <KryptoKurse />
          </Widget>
          <Widget title="RedzoneEarth Ads" index={6} skeleton="stats" href="/redzone">
            <RedzoneEarthAds />
          </Widget>
          {/* Neue Widgets: Komponente unter components/widgets/ anlegen und
              hier in <Widget title="…" index={…}> einhängen. */}
        </div>
        </main>
        </div>
      </FocusZoomProvider>
      <ConnectionLines />
    </>
  );
}
