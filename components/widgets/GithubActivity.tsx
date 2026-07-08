import ErrorNote from "@/components/ErrorNote";
import WidgetCard from "@/components/WidgetCard";
import { relativeTime } from "@/lib/relative-time";

type Commit = {
  sha: string;
  message: string;
  author: string;
  date: string;
};

type Issue = {
  number: number;
  title: string;
  date: string;
};

type GithubData =
  | { status: "ok"; repo: string; commits: Commit[]; issues: Issue[] }
  | { status: "error"; hint: string };

const API_HEADERS_BASE = {
  Accept: "application/vnd.github+json",
  "User-Agent": "ov-dashboard",
  "X-GitHub-Api-Version": "2022-11-28",
};

function hintFor(status: number, repo: string, hasToken: boolean): string {
  if (status === 404) {
    return `Repo „${repo}“ nicht gefunden — existiert es schon auf GitHub? Für private Repos GITHUB_TOKEN in .env.local setzen.`;
  }
  if (status === 401) {
    return "GITHUB_TOKEN ist ungültig oder abgelaufen.";
  }
  if (status === 403 || status === 429) {
    return hasToken
      ? "GitHub-Rate-Limit erreicht — später erneut versuchen."
      : "GitHub-Rate-Limit erreicht (ohne Token nur 60 Anfragen/Std.) — GITHUB_TOKEN in .env.local setzen.";
  }
  if (status === 409) {
    return "Repo ist noch leer — es gibt keine Commits.";
  }
  return `GitHub-API-Fehler (HTTP ${status}).`;
}

async function loadGithub(): Promise<GithubData> {
  const repo = process.env.GITHUB_REPO;
  if (!repo) {
    return {
      status: "error",
      hint: "GITHUB_REPO in .env.local setzen (Format: owner/repo).",
    };
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { ...API_HEADERS_BASE };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const [commitsRes, issuesRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${repo}/commits?per_page=5`, {
        headers,
        next: { revalidate: 300 },
      }),
      fetch(`https://api.github.com/repos/${repo}/issues?state=open&per_page=10`, {
        headers,
        next: { revalidate: 300 },
      }),
    ]);

    if (!commitsRes.ok) {
      return { status: "error", hint: hintFor(commitsRes.status, repo, Boolean(token)) };
    }

    type RawCommit = {
      sha?: string;
      commit?: { message?: string; author?: { name?: string; date?: string } };
      author?: { login?: string };
    };
    const rawCommits = (await commitsRes.json()) as RawCommit[];
    const commits: Commit[] = rawCommits.map((c) => ({
      sha: String(c.sha ?? "").slice(0, 7),
      message: String(c.commit?.message ?? "").split("\n")[0],
      author: c.commit?.author?.name ?? c.author?.login ?? "unbekannt",
      date: c.commit?.author?.date ?? "",
    }));

    // Der Issues-Endpoint liefert auch Pull Requests mit — die fliegen raus.
    let issues: Issue[] = [];
    if (issuesRes.ok) {
      type RawIssue = {
        number?: number;
        title?: string;
        created_at?: string;
        pull_request?: unknown;
      };
      const rawIssues = (await issuesRes.json()) as RawIssue[];
      issues = rawIssues
        .filter((i) => !i.pull_request)
        .slice(0, 5)
        .map((i) => ({
          number: Number(i.number),
          title: String(i.title ?? ""),
          date: i.created_at ?? "",
        }));
    }

    return { status: "ok", repo, commits, issues };
  } catch {
    return { status: "error", hint: "GitHub-API nicht erreichbar (offline?)." };
  }
}

/** Letzte Commits und offene Issues aus der GitHub REST API (Cache: 5 Minuten). */
export default async function GithubActivity() {
  const data = await loadGithub();

  return (
    <WidgetCard
      title="GitHub Activity"
      badge={data.status === "ok" ? "Live" : "Offline"}
      badgeTone={data.status === "ok" ? "accent" : "neutral"}
    >
      {data.status === "ok" ? (
        <>
          <p className="mb-3 text-xs uppercase tracking-[0.12em] text-muted">
            Letzte Commits
          </p>
          <ul className="space-y-3.5">
            {data.commits.length === 0 && (
              <li className="text-xs text-muted">Noch keine Commits.</li>
            )}
            {data.commits.map((commit, index) => (
              <li key={commit.sha} className="flex items-start gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    index === 0
                      ? "bg-accent animate-live-ring motion-reduce:animate-none"
                      : "bg-white/15"
                  }`}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{commit.message}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    <span className="font-mono">{commit.sha}</span> · {commit.author}
                    {commit.date && ` · ${relativeTime(commit.date)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mb-3 mt-6 text-xs uppercase tracking-[0.12em] text-muted">
            Offene Issues ({data.issues.length})
          </p>
          {data.issues.length === 0 ? (
            <p className="text-xs text-muted">Keine offenen Issues.</p>
          ) : (
            <ul className="space-y-2">
              {data.issues.map((issue) => (
                <li key={issue.number} className="flex items-baseline gap-2 text-sm">
                  <span className="font-mono text-xs text-muted">#{issue.number}</span>
                  <span className="min-w-0 truncate text-foreground">{issue.title}</span>
                  {issue.date && (
                    <span className="ml-auto shrink-0 text-xs text-muted">
                      {relativeTime(issue.date)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
            Quelle: GitHub API · <span className="font-mono">{data.repo}</span>
          </p>
        </>
      ) : (
        <ErrorNote>{data.hint}</ErrorNote>
      )}
    </WidgetCard>
  );
}
