# ov-dashboard

Privates Übersichts-Dashboard (Next.js 14, App Router, TypeScript, Tailwind).
Dark Mode als einzige Option, ein Widget pro Datenquelle, Frontend strikt **read-only**.

| Widget | Datenquelle | Status |
|---|---|---|
| Morgen-Briefing | Supabase-Tabelle `morning_briefing` | live, sobald Tabelle existiert |
| Fokus heute / To-Do (`/todo`) | eigene Aufgaben (localStorage) | funktionsfähig; Kalender-Anbindung optional (s. unten) |
| DDD Übersicht | Supabase-Tabelle `ddd_stats` | live, sobald Tabelle existiert |
| GitHub Activity | GitHub REST API (`GITHUB_REPO`) | live, sobald Repo erreichbar |
| Social Media | Supabase-Tabelle `social_stats` | live, sobald Tabelle existiert |
| Social Media Detail (`/social`) | `social_stats_daily` + `social_posts` | Mock-Daten, bis Hermes befüllt (s. unten) |
| Krypto-Kurse | CoinGecko public API (kein Key) | live, 60-s-Refresh im Browser |
| RedzoneEarth Ads (Overview) | Ad-Provider-API | Platzhalter („Noch nicht live“) |
| RedzoneEarth Detail (`/redzone`) | Hook `useRedzoneStats()` → `redzone_stats` | Mock-Daten, bis Ad-Provider anbindet (s. unten) |

## Setup

```bash
npm install
cp .env.example .env.local   # und Werte eintragen
npm run dev                  # http://localhost:3000
```

### Env-Variablen (`.env.local`)

| Variable | Zweck | Auf Vercel? |
|---|---|---|
| `SUPABASE_URL` | Supabase-Projekt-URL | ja |
| `SUPABASE_ANON_KEY` | Lesezugriff (RLS), Legacy-Format `eyJ...` | ja |
| `GITHUB_REPO` | Repo fürs GitHub-Widget, Format `owner/repo` | ja |
| `GITHUB_TOKEN` | optional: private Repos / höheres Rate-Limit | ja (empfohlen) |
| `SUPABASE_SERVICE_ROLE_KEY` | **nur** für die `scripts/sync-*.js` (Hermes) | **NEIN — niemals!** |

Alle Variablen sind bewusst ohne `NEXT_PUBLIC_`-Präfix: sie bleiben serverseitig
und landen nie im Browser-Bundle. `.env.local` ist git-ignoriert.

> **Hinweis Kalender/To-Do:** Der frühere Google-Calendar/Tasks-OAuth-Ansatz
> (403 `access_denied`) wurde entfernt. Der neue `/todo`-Bereich läuft über den
> zentralen Hook `useTasksAndEvents()` mit Platzhalter-Daten — die echte
> Anbindung folgt (s. Abschnitt „To-Do-Bereich" unten). Die `GOOGLE_*`-Env-Vars
> werden nicht mehr benötigt.

### Supabase-Migration: Schema „dashboard“

Alle Dashboard-Tabellen leben im eigenen Schema `dashboard` — sauber getrennt
von den DrawdownDiary-Tabellen in `public`, bei gleicher `SUPABASE_URL` und
gleichem Anon-Key. Einmalig im Supabase-SQL-Editor ausführen:

```sql
-- 1) Schema anlegen
create schema if not exists dashboard;
grant usage on schema dashboard to anon, authenticated, service_role;

-- 2) Früher in public angelegte Tabellen verschieben (falls vorhanden)
do $$
declare t text;
begin
  foreach t in array array['ddd_stats', 'social_stats', 'morning_briefing'] loop
    if exists (select from pg_tables where schemaname = 'public' and tablename = t) then
      execute format('alter table public.%I set schema dashboard', t);
    end if;
  end loop;
end $$;

-- 3) Tabellen anlegen, falls es sie noch nicht gibt
create table if not exists dashboard.ddd_stats (
  id bigint generated always as identity primary key,
  user_count int not null default 0,
  trade_count int not null default 0,
  umsatz numeric not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists dashboard.social_stats (
  platform text primary key,
  followers int not null default 0,
  views_24h int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists dashboard.morning_briefing (
  id bigint generated always as identity primary key,
  datum date not null default ((now() at time zone 'Europe/Vienna')::date),
  thema text not null,
  inhalt text not null,
  erstellt_am timestamptz not null default now()
);

-- 3b) Detail-Tabellen für die /social-Sektion (Follower-Chart, Wachstumsrate,
-- Engagement, Top-Content, Heatmap). Bewusst getrennt von "social_stats"
-- (dortige Grain: ein Snapshot pro Plattform, für das Overview-Widget) — hier
-- Zeitreihe (eine Zeile pro Plattform+Tag) bzw. eine Zeile pro Post.
create table if not exists dashboard.social_stats_daily (
  platform text not null,
  date date not null,
  followers int not null default 0,
  views int not null default 0,
  likes int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (platform, date)
);

create table if not exists dashboard.social_posts (
  post_id text primary key,
  platform text not null,
  post_title text not null,
  post_url text not null,
  published_at date not null,
  views int not null default 0,
  likes int not null default 0,
  comments int not null default 0,
  shares int not null default 0,
  updated_at timestamptz not null default now()
);

-- 3c) RedzoneEarth-Werbeerlöse (/redzone): Zeitreihe (eine Zeile pro Tag) plus
-- eine Zeile je Platzierung/Slot. Wird vom Ad-Provider-Sync befüllt.
create table if not exists dashboard.redzone_stats (
  date date not null,
  revenue numeric not null default 0,
  impressions int not null default 0,
  fill_rate numeric not null default 0,
  visitors int not null default 0,
  slot_id text not null default 'gesamt',
  slot_name text not null default 'Gesamt',
  updated_at timestamptz not null default now(),
  primary key (date, slot_id)
);

-- 4) RLS + Lese-Policies (idempotent)
alter table dashboard.ddd_stats enable row level security;
alter table dashboard.social_stats enable row level security;
alter table dashboard.social_stats_daily enable row level security;
alter table dashboard.social_posts enable row level security;
alter table dashboard.redzone_stats enable row level security;
alter table dashboard.morning_briefing enable row level security;

drop policy if exists "anon liest ddd_stats" on dashboard.ddd_stats;
create policy "anon liest ddd_stats" on dashboard.ddd_stats
  for select to anon, authenticated using (true);

drop policy if exists "anon liest social_stats" on dashboard.social_stats;
create policy "anon liest social_stats" on dashboard.social_stats
  for select to anon, authenticated using (true);

drop policy if exists "anon liest social_stats_daily" on dashboard.social_stats_daily;
create policy "anon liest social_stats_daily" on dashboard.social_stats_daily
  for select to anon, authenticated using (true);

drop policy if exists "anon liest social_posts" on dashboard.social_posts;
create policy "anon liest social_posts" on dashboard.social_posts
  for select to anon, authenticated using (true);

drop policy if exists "anon liest redzone_stats" on dashboard.redzone_stats;
create policy "anon liest redzone_stats" on dashboard.redzone_stats
  for select to anon, authenticated using (true);

drop policy if exists "anon liest morning_briefing" on dashboard.morning_briefing;
create policy "anon liest morning_briefing" on dashboard.morning_briefing
  for select to anon, authenticated using (true);

-- 5) Rechte: anders als in public gibt es im Custom-Schema KEINE automatischen Grants
grant select on all tables in schema dashboard to anon, authenticated;
grant all on all tables in schema dashboard to service_role;
grant usage, select on all sequences in schema dashboard to service_role;
alter default privileges in schema dashboard grant select on tables to anon, authenticated;
alter default privileges in schema dashboard grant all on tables to service_role;

-- 6) Platzhalter-Daten (nur wenn leer)
insert into dashboard.ddd_stats (user_count, trade_count, umsatz)
select 128, 3421, 1842.50
where not exists (select from dashboard.ddd_stats);

insert into dashboard.social_stats (platform, followers, views_24h) values
  ('x', 1240, 5600),
  ('youtube', 380, 2100),
  ('instagram', 210, 940)
on conflict (platform) do nothing;

insert into dashboard.morning_briefing (thema, inhalt)
select v.thema, v.inhalt
from (values
  ('Märkte', 'Platzhalter — erster Briefing-Eintrag, kommt täglich vom Hermes Agent.'),
  ('US-Politik', 'Platzhalter — erster Briefing-Eintrag, kommt täglich vom Hermes Agent.'),
  ('Iran', 'Platzhalter — erster Briefing-Eintrag, kommt täglich vom Hermes Agent.')
) as v(thema, inhalt)
where not exists (select from dashboard.morning_briefing);
```

**Danach zwingend:** In Supabase Studio unter **Project Settings → Data API →
Exposed schemas** das Schema `dashboard` ergänzen — sonst antwortet die API mit
`PGRST106` und die Supabase-Widgets bleiben offline (der Hinweis dazu erscheint
direkt im Widget).

Es gibt **keine** Insert-/Update-Policies für `anon` — Schreiben ist per RLS blockiert.

## Neues Widget hinzufügen

1. Komponente unter `components/widgets/MeinWidget.tsx` anlegen
   (Hülle: `WidgetCard`, Kennzahlen: `StatTile`, Fehlerfälle: `ErrorNote`).
2. In `app/page.tsx` importieren und im `<main>`-Grid einhängen. Fertig.

## Social-Media-Detailseite (`/social`)

Sechs Widgets (Follower-Wachstum, Wachstumsrate, Engagement-Rate,
Top-Content-Ranking, Posting-Heatmap, Cross-Platform Reach) unter
`app/social/components/`, gespeist über den zentralen Hook
`useSocialStats()` (`lib/useSocialStats.ts`). Aktuell liefert der Hook
deterministische Mock-Daten aus `lib/social-mock.ts` (fixer Seed, kein
Hydration-Mismatch) — Typen in `lib/social-types.ts`.

**Umstellung auf Live-Daten:** Sobald `dashboard.social_stats_daily` und
`dashboard.social_posts` vom Hermes Agent befüllt sind, in
`lib/useSocialStats.ts` den `generateSocialStats()`-Aufruf gegen einen Fetch
auf einen Route Handler (z. B. `app/api/social-stats/route.ts`, der
serverseitig `getSupabase()` nutzt) tauschen. Die sechs Widget-Komponenten
bleiben unverändert — sie kennen nur den `SocialStats`-Typ.

## RedzoneEarth-Detailseite (`/redzone`)

Sechs Bausteine unter `app/redzone/components/` (Status-Karte, Revenue-Trend-
Chart mit 7/30/90-Toggle, Fill-Rate/Impressions-Monitor, Top-Slots-Ranking,
Revenue per Visitor, Projektvergleich RedzoneEarth vs. DDD), gespeist über den
zentralen Hook `useRedzoneStats()` (`lib/useRedzoneStats.ts`). Typen in
`lib/redzone-types.ts`, Mock-Generator in `lib/redzone-mock.ts` (fixer Seed,
kein Hydration-Mismatch).

Der Ad-Provider ist noch nicht angebunden — alle Kennzahlen laufen auf klar
gekennzeichneten Mock-Daten (Badge „Mock-Daten", Status-Karte „Noch nicht
live"). Der **Projektvergleich** zieht den DDD-Umsatz bereits live aus
`dashboard.ddd_stats` (falls Schema freigeschaltet), RedzoneEarth bleibt Mock.

**Umstellung auf Live-Daten:** Sobald `dashboard.redzone_stats` vom Ad-Provider-
Sync befüllt ist, in `lib/useRedzoneStats.ts` den `generateRedzoneStats()`-
Aufruf gegen einen Fetch auf einen Route Handler (z. B. `app/api/redzone-stats/
route.ts`, serverseitig `getSupabase()`) tauschen und `isMock: false` setzen.
Die Widget-Komponenten bleiben unverändert — sie kennen nur den
`RedzoneStats`-Typ.

## To-Do-Bereich (`/todo`)

Ersetzt den früheren `/kalender`. Bausteine unter `app/todo/components/`
(Fokus heute, Yin-Yang-Fortschrittsring, Kombi-Zeitleiste, Prioritäts-Badges,
Projekt-Filter, Formular „Neue Aufgabe"), alle gespeist über den zentralen
Hook `useTasksAndEvents()` (`lib/useTasksAndEvents.ts`). Der Hook liefert einen
normalisierten `TaskOrEvent[]`-Strom (Typen in `lib/todo-types.ts`).

**Datenquelle:** ausschließlich selbst erstellte Aufgaben, gespeichert lokal im
Browser (`lib/todo-store.ts`, localStorage, `useSyncExternalStore` — SSR-sicher,
tab-übergreifend). Kein Platzhalter-Datensatz. Anlegen über das Widget „Neue
Aufgabe" auf `/todo` bzw. den Button im Overview-Fokus-Widget (`/todo#neu`).
Eigene Aufgaben sind in der Zeitleiste abhak- und löschbar.

**Kalender-Anbindung später (optional):** Die iOS-/Google-Kalender-MCP-
Verbindung lebt im Claude-Client (Agent-Seite), **nicht** im Vercel-Runtime —
die deployte App kann MCP-Tools nicht aufrufen. Echte Termine führen wie bei
allen anderen Widgets über Supabase:

1. Tabelle `dashboard.todo_items` anlegen (Migration analog `social_stats`).
2. Agent/Hermes synct Kalender + Erinnerungen per MCP → Supabase.
3. In `lib/useTasksAndEvents.ts` eine zweite Quelle (Fetch auf einen Route
   Handler, z. B. `app/api/todo/route.ts`, serverseitig `getSupabase()`) neben
   die User-Aufgaben mergen. Die Komponenten bleiben unverändert — sie kennen
   nur den `TaskOrEvent`-Typ.

## Hermes-Scripts (schreiben nach Supabase, laufen lokal per Cron)

```bash
node scripts/sync-social-stats.js
node scripts/sync-morning-briefing.js --thema "Märkte" --inhalt "Text…" [--datum YYYY-MM-DD]
```

- **sync-social-stats.js:** Upsert (`platform` = Unique-Key) nach `social_stats`.
  Plattform-Liste: `scripts/social-platforms.config.js`. Hermes importiert
  `syncSocialStats([...])` und übergibt echte Zahlen.
- **sync-morning-briefing.js:** Insert nach `morning_briefing` — Eintrag per
  CLI-Argumente oder als Import `insertBriefing({ thema, inhalt, datum? })`.

Beide loggen Fehler laut und beenden mit Exit-Code 1 (kein stiller Fail).
Scraping-/Recherche-Logik gehört nicht in dieses Repo.

## Deploy auf Vercel

1. Repo zu GitHub pushen, in Vercel importieren (Framework-Preset: Next.js).
2. Env-Vars laut Tabelle oben setzen — den `SUPABASE_SERVICE_ROLE_KEY`
   **nicht** hochladen, der Sync läuft lokal beim Hermes Agent.
3. `GITHUB_TOKEN` auf Vercel setzen (fine-grained, read-only): ohne Token teilt
   sich die Vercel-Infrastruktur das anonyme GitHub-Rate-Limit (60 Anfragen/Std./IP).

**Achtung, kein Auth-Layer:** Jeder, der die Deploy-URL kennt, sieht die
Kennzahlen (DDD-Umsatz!). „Unlisted“ ist kein Schutz — URLs leaken über Referrer,
Browser-History und Vercel-Preview-Kommentare. Empfehlung: in den
Vercel-Projekt-Einstellungen **Deployment Protection → Vercel Authentication**
aktivieren (kostenlos, kein eigener Auth-Code nötig).
