import { SOCIAL_PLATFORMS, type SocialDailyStat, type SocialPost, type SocialStats } from "@/lib/social-types";

const DAYS = 90;
const TZ = "Europe/Vienna";
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

// mulberry32: deterministischer PRNG (fixer Seed) — SSR und Client-Hydration
// erzeugen dieselbe Mock-Zahlenfolge, kein Hydration-Mismatch durch Math.random().
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PLATFORM_SEED: Record<string, number> = { youtube: 1337, instagram: 4242 };
const PLATFORM_BASE_FOLLOWERS: Record<string, number> = { youtube: 8200, instagram: 15400 };
const PLATFORM_DAILY_POST_CHANCE: Record<string, number> = { youtube: 0.35, instagram: 0.55 };

const POST_TITLES = [
  "Marktausblick der Woche",
  "Warum dieser Trade nicht aufging",
  "Q&A: Eure Fragen zu Krypto",
  "Live-Analyse: Bitcoin & Co.",
  "Setup-Breakdown im Detail",
  "Was ich diese Woche gelernt habe",
  "Reaktion auf die aktuellen Zahlen",
  "Behind the Scenes: Mein Trading-Setup",
  "Die größten Fehler beim Einstieg",
  "Charttechnik einfach erklärt",
];

function anchoredDay(offsetFromToday: number): { key: string; date: Date } {
  const now = Date.now();
  const [y, m, d] = dayKey.format(now).split("-").map(Number);
  // Auf 12:00 UTC verankert: eindeutig im Wiener Kalendertag, unabhängig von DST.
  const date = new Date(Date.UTC(y, m - 1, d - offsetFromToday, 12));
  return { key: dayKey.format(date), date };
}

/**
 * Erzeugt deterministische Mock-Daten für die Social-Media-Sektion: 90 Tage
 * Tageswerte je Plattform (leichter Wachstumstrend + Rauschen) und ~60 Tage
 * Posts mit unregelmäßiger Frequenz. Seed ist fix, damit Server- und
 * Client-Render exakt dieselben Zahlen liefern.
 */
export function generateSocialStats(): SocialStats {
  const daily: SocialDailyStat[] = [];
  const posts: SocialPost[] = [];

  for (const platform of SOCIAL_PLATFORMS) {
    const rand = mulberry32(PLATFORM_SEED[platform]);
    let followers = PLATFORM_BASE_FOLLOWERS[platform];
    let postCounter = 0;

    for (let i = DAYS - 1; i >= 0; i--) {
      const { key } = anchoredDay(i);

      // Leichter, leicht schwankender Wachstumstrend statt reinem Random-Walk.
      followers = Math.max(0, Math.round(followers + 6 + rand() * 18 - 4));
      const views = Math.round(400 + rand() * 1400 + (DAYS - i) * 2);
      const likes = Math.round(views * (0.04 + rand() * 0.03));
      const comments = Math.round(likes * (0.05 + rand() * 0.05));
      const shares = Math.round(likes * (0.02 + rand() * 0.04));

      daily.push({ platform, date: key, followers, views, likes, comments, shares });

      if (rand() < PLATFORM_DAILY_POST_CHANCE[platform]) {
        const postsToday = rand() < 0.15 ? 2 : 1;
        for (let p = 0; p < postsToday; p++) {
          postCounter++;
          const postViews = Math.round(views * (0.3 + rand() * 1.4));
          const postLikes = Math.round(postViews * (0.05 + rand() * 0.05));
          const postComments = Math.round(postLikes * (0.05 + rand() * 0.06));
          const postShares = Math.round(postLikes * (0.02 + rand() * 0.05));
          posts.push({
            post_id: `${platform}-${postCounter}`,
            platform,
            post_title: POST_TITLES[Math.floor(rand() * POST_TITLES.length)],
            post_url: "#",
            published_at: key,
            views: postViews,
            likes: postLikes,
            comments: postComments,
            shares: postShares,
          });
        }
      }
    }
  }

  daily.sort((a, b) => a.date.localeCompare(b.date));
  posts.sort((a, b) => b.published_at.localeCompare(a.published_at));

  return { daily, posts };
}
