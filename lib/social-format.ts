import type { SocialDailyStat, SocialPost } from "@/lib/social-types";

export const socialInt = new Intl.NumberFormat("de-AT");
export const socialPct = new Intl.NumberFormat("de-AT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** (Likes + Kommentare + Shares) / Follower in Prozent. */
export function engagementRate(row: Pick<SocialDailyStat, "likes" | "comments" | "shares" | "followers">): number {
  if (row.followers <= 0) return 0;
  return ((row.likes + row.comments + row.shares) / row.followers) * 100;
}

export function postEngagement(post: Pick<SocialPost, "likes" | "comments" | "shares">): number {
  return post.likes + post.comments + post.shares;
}
