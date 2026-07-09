"use client";

import { useMemo, useState } from "react";
import WidgetCard from "@/components/WidgetCard";
import { postEngagement, socialInt } from "@/lib/social-format";
import { useSocialStats } from "@/lib/useSocialStats";
import { SOCIAL_PLATFORM_LABEL } from "@/lib/social-types";

type SortKey = "views" | "engagement";

const WINDOW_DAYS = 30;

/**
 * Top-5-Content der letzten 30 Tage, sortierbar nach Views oder Engagement.
 * Rang links in großer, dünner Typo — Thumbnails sind Platzhalter, bis der
 * Hermes-Sync echte post_url/Vorschaubilder liefert.
 */
export default function TopContentRanking() {
  const { data, isMock } = useSocialStats();
  const [sortKey, setSortKey] = useState<SortKey>("views");

  const top = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
    const cutoffKey = cutoff.toISOString().slice(0, 10);

    return [...data.posts]
      .filter((p) => p.published_at >= cutoffKey)
      .sort((a, b) =>
        sortKey === "views" ? b.views - a.views : postEngagement(b) - postEngagement(a)
      )
      .slice(0, 5);
  }, [data.posts, sortKey]);

  return (
    <WidgetCard
      title="Top-Content-Ranking"
      badge={isMock ? "Mock-Daten" : "Live"}
      badgeTone={isMock ? "neutral" : "accent"}
    >
      <div className="mb-4 flex items-center justify-end gap-1" role="group" aria-label="Sortierung wählen">
        {(["views", "engagement"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortKey(key)}
            aria-pressed={sortKey === key}
            className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
              sortKey === key ? "bg-white/10 font-medium text-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {key === "views" ? "Views" : "Engagement"}
          </button>
        ))}
      </div>

      {top.length === 0 ? (
        <p className="text-xs text-muted">Noch keine Posts in den letzten {WINDOW_DAYS} Tagen.</p>
      ) : (
        <ul className="divide-y divide-line">
          {top.map((post, i) => (
            <li key={post.post_id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <span className="w-8 shrink-0 text-right font-display text-2xl font-light tabular-nums text-muted/70">
                {i + 1}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white/5 text-[11px] uppercase tracking-[0.1em] text-muted">
                {SOCIAL_PLATFORM_LABEL[post.platform].charAt(0)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{post.post_title}</p>
                <p className="mt-0.5 text-xs text-muted">{SOCIAL_PLATFORM_LABEL[post.platform]}</p>
              </div>
              <span className="w-20 shrink-0 text-right">
                <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
                  {socialInt.format(post.views)}
                </span>
                <span className="block text-[11px] uppercase tracking-[0.1em] text-muted">Views</span>
              </span>
              <span className="w-20 shrink-0 text-right">
                <span className="block font-mono text-sm font-semibold tabular-nums text-foreground">
                  {socialInt.format(postEngagement(post))}
                </span>
                <span className="block text-[11px] uppercase tracking-[0.1em] text-muted">Engagement</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        Letzte {WINDOW_DAYS} Tage · Quelle:{" "}
        {isMock ? "Mock-Daten" : <span className="font-mono">dashboard.social_posts</span>}
      </p>
    </WidgetCard>
  );
}
