import { Suspense } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import SupabaseStatus from "@/components/SupabaseStatus";
import WidgetBoundary from "@/components/WidgetBoundary";
import WidgetSkeleton from "@/components/WidgetSkeleton";
import YinYang from "@/components/YinYang";
import DddOverview from "@/components/widgets/DddOverview";
import GithubActivity from "@/components/widgets/GithubActivity";
import KalenderErinnerungen from "@/components/widgets/KalenderErinnerungen";
import KryptoKurse from "@/components/widgets/KryptoKurse";
import MorgenBriefing from "@/components/widgets/MorgenBriefing";
import RedzoneEarthAds from "@/components/widgets/RedzoneEarthAds";
import SocialMedia from "@/components/widgets/SocialMedia";

// Supabase-Daten alle 60 Sekunden neu laden (GitHub cached 5 Min. auf Fetch-Ebene)
export const revalidate = 60;

/** Boundary + Suspense pro Widget: crasht eins, bleibt der Rest der Seite intakt. */
function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <WidgetBoundary title={title}>
      <Suspense fallback={<WidgetSkeleton title={title} />}>{children}</Suspense>
    </WidgetBoundary>
  );
}

export default function Home() {
  const today = new Intl.DateTimeFormat("de-AT", {
    dateStyle: "full",
    timeZone: "Europe/Vienna",
  }).format(new Date());

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 sm:px-8">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-background/85 py-3.5 backdrop-blur sm:py-6">
        <div className="flex items-center gap-3 sm:gap-3.5">
          <YinYang className="h-7 w-7 sm:h-8 sm:w-8" />
          <div>
            <h1 className="font-display text-hero font-semibold tracking-tight">
              Overview
            </h1>
            <p className="text-[11px] text-muted sm:text-xs">Alle Projekte, ein Blick</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <AutoRefresh />
          <Suspense
            fallback={
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-white/20" aria-hidden="true" />
                Supabase
              </span>
            }
          >
            <SupabaseStatus />
          </Suspense>
          <p className="hidden text-sm text-muted lg:block">{today}</p>
        </div>
      </header>

      <main className="grid flex-1 content-start gap-4 py-8 sm:grid-cols-2 sm:gap-5 sm:py-10">
        {/* Tagesüberblick zuerst — Reihenfolge = DOM-Reihenfolge,
            gilt auch für die einspaltige Mobile-Ansicht. */}
        <Widget title="Morgen-Briefing">
          <MorgenBriefing />
        </Widget>
        <Widget title="Kalender & Erinnerungen">
          <KalenderErinnerungen />
        </Widget>
        <Widget title="DDD Übersicht">
          <DddOverview />
        </Widget>
        <Widget title="GitHub Activity">
          <GithubActivity />
        </Widget>
        <Widget title="Social Media">
          <SocialMedia />
        </Widget>
        <Widget title="Krypto-Kurse">
          <KryptoKurse />
        </Widget>
        <Widget title="RedzoneEarth Ads">
          <RedzoneEarthAds />
        </Widget>
        {/* Neue Widgets: Komponente unter components/widgets/ anlegen und
            hier in <Widget title="…"> einhängen — Karte, Fehlerisolierung
            und Yin-Yang-Loader kommen automatisch mit. */}
      </main>

      <footer className="flex items-center gap-2.5 border-t border-line py-5 text-xs text-muted">
        <YinYang size={14} />
        <span>ov-dashboard · lokal &amp; privat · read-only</span>
      </footer>
    </div>
  );
}
