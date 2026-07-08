import { Suspense } from "react";
import AutoRefresh from "@/components/AutoRefresh";
import SupabaseStatus from "@/components/SupabaseStatus";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

/**
 * Seitenkopf im Content-Bereich (rechts neben der Sidebar): Titel,
 * "Zuletzt aktualisiert", Supabase-Status und Datum. Das Branding
 * (Yin-Yang + Overview) lebt in der Sidebar — hier nicht duplizieren.
 * Mobile: linkes Padding lässt Platz für den Hamburger-Button.
 */
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  const today = new Intl.DateTimeFormat("de-AT", {
    dateStyle: "full",
    timeZone: "Europe/Vienna",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-background/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between gap-3 py-3.5 pl-11 pr-5 sm:py-6 sm:pr-8 lg:pl-8">
        <div className="min-w-0">
          <h1 className="animate-blur-in truncate font-display text-hero font-semibold tracking-tight motion-reduce:animate-none">
            {title}
          </h1>
          {subtitle && <p className="text-[11px] text-muted sm:text-xs">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
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
          <p className="hidden text-sm text-muted xl:block">{today}</p>
        </div>
      </div>
    </header>
  );
}
