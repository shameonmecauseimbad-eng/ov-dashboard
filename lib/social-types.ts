export type SocialPlatform = "youtube" | "instagram";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["youtube", "instagram"];

export const SOCIAL_PLATFORM_LABEL: Record<SocialPlatform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
};

/** Ein Tageswert pro Plattform — Grundlage für Follower-Chart, Wachstumsrate, Engagement, Heatmap. */
export type SocialDailyStat = {
  platform: SocialPlatform;
  date: string; // YYYY-MM-DD (Europe/Vienna)
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

/** Ein einzelner Post/Video — Grundlage für das Top-Content-Ranking. */
export type SocialPost = {
  post_id: string;
  platform: SocialPlatform;
  post_title: string;
  post_url: string;
  published_at: string; // ISO-Datum
  views: number;
  likes: number;
  comments: number;
  shares: number;
};

export type SocialStats = {
  /** Letzte 90 Tage, beide Plattformen, chronologisch aufsteigend. */
  daily: SocialDailyStat[];
  /** Letzte ~60 Tage, beide Plattformen, chronologisch absteigend (neueste zuerst). */
  posts: SocialPost[];
};
