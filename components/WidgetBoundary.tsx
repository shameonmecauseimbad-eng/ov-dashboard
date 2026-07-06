"use client";

import { useRouter } from "next/navigation";
import { Component, type ReactNode } from "react";
import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";

type Props = {
  /** Widget-Titel, damit die Fehlerkarte an derselben Stelle im Grid lesbar bleibt. */
  title: string;
  children: ReactNode;
};

type State = { hasError: boolean };

function RetryButton({ onRetry }: { onRetry: () => void }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        router.refresh();
        onRetry();
      }}
      className="mt-4 self-start rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/5"
    >
      Erneut versuchen
    </button>
  );
}

/**
 * Fängt Render-Crashes eines einzelnen Widgets ab (auch aus Server
 * Components, die innerhalb der zugehörigen Suspense-Grenze werfen) —
 * der Rest der Seite bleibt unberührt. Erwartbare Fehler (API down,
 * Tabelle fehlt) behandeln die Widgets selbst; das hier ist das Netz
 * für alles Unerwartete.
 */
export default class WidgetBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[Widget „${this.props.title}“ abgestürzt]`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <WidgetCard title={this.props.title} badge="Fehler" badgeTone="neutral">
          <ErrorNote>
            Dieses Widget ist abgestürzt — der Rest der Seite läuft weiter.
            Details stehen in der Browser-Konsole.
          </ErrorNote>
          <RetryButton onRetry={() => this.setState({ hasError: false })} />
        </WidgetCard>
      );
    }
    return this.props.children;
  }
}
