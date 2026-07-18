import { NextResponse } from "next/server";
import { DASHBOARD_SCHEMA, getSupabase, supabaseHint } from "@/lib/supabase";
import {
  PROJECT_TAGS,
  type Priority,
  type ProjectTag,
  type Recurrence,
  type Subtask,
  type TaskOrEvent,
} from "@/lib/todo-types";

/**
 * Persistenz für selbst erstellte To-Dos: dashboard.todo_items.
 *
 * Läuft wie alles hinter dem Basic-Auth-Gate (middleware.ts) und nutzt den
 * server-seitigen Anon-Key — der Service-Role-Key bleibt laut Projektregel
 * lokal beim Hermes-Sync und kommt NIE auf Vercel. Deshalb hat die Tabelle
 * als einzige im Schema RLS-Schreib-Policies für anon: schlimmster Fall bei
 * einem Key-Leak ist diese To-Do-Liste, nie die übrigen Dashboard-/DDD-Daten.
 *
 * API (Client: lib/todo-store.ts):
 *   GET  → alle Aufgaben als TaskOrEvent[]
 *   POST → { upsert?: TaskOrEvent[], remove?: string[] } → { ok: true }
 */

export const dynamic = "force-dynamic";

const TABLE = "todo_items";
const MAX_BATCH = 200;
const MAX_TITLE = 500;
const MAX_SUBTASKS = 100;

const TYPES = new Set(["event", "task"]);
const PRIORITIES = new Set(["high", "medium", "low"]);
const TAGS = new Set<string>(PROJECT_TAGS);

/** Zeile in dashboard.todo_items (snake_case) ↔ TaskOrEvent (camelCase). */
type Row = {
  id: string;
  title: string;
  type: string;
  at: string | null;
  all_day: boolean;
  project_tag: string;
  priority: string;
  done: boolean;
  source: string;
  recurrence: Recurrence | null;
  subtasks: Subtask[] | null;
  estimated_minutes: number | null;
};

function fromRow(r: Row): TaskOrEvent {
  return {
    id: r.id,
    title: r.title,
    type: r.type === "event" ? "event" : "task",
    // PostgREST liefert "+00:00"-Offsets — auf "Z"-ISO normalisieren, damit
    // der lexikografische Sort in useTasksAndEvents einheitliche Strings sieht.
    at: r.at ? new Date(r.at).toISOString() : null,
    allDay: r.all_day,
    projectTag: (TAGS.has(r.project_tag) ? r.project_tag : "sonstiges") as ProjectTag,
    priority: (PRIORITIES.has(r.priority) ? r.priority : "medium") as Priority,
    done: r.done,
    source: "user",
    recurrence: r.recurrence ?? null,
    subtasks: r.subtasks ?? [],
    estimatedMinutes: r.estimated_minutes ?? null,
  };
}

function toRow(t: TaskOrEvent): Row {
  return {
    id: t.id,
    title: t.title,
    type: t.type,
    at: t.at,
    all_day: t.allDay,
    project_tag: t.projectTag,
    priority: t.priority,
    done: t.done,
    source: "user",
    recurrence: t.recurrence ?? null,
    subtasks: t.subtasks ?? [],
    estimated_minutes: t.estimatedMinutes ?? null,
  };
}

function isSubtask(v: unknown): v is Subtask {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return typeof s.id === "string" && typeof s.title === "string" && typeof s.done === "boolean";
}

function isRecurrence(v: unknown): v is Recurrence {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return (
    (r.freq === "daily" || r.freq === "weekly") &&
    typeof r.interval === "number" &&
    Number.isInteger(r.interval) &&
    r.interval >= 1 &&
    r.interval <= 365
  );
}

/** Prüft und normalisiert eine eingehende Aufgabe; null = Eintrag verwerfen. */
function sanitize(input: unknown): TaskOrEvent | null {
  if (typeof input !== "object" || input === null) return null;
  const t = input as Record<string, unknown>;
  if (typeof t.id !== "string" || !t.id || t.id.length > 100) return null;
  if (typeof t.title !== "string" || !t.title.trim()) return null;
  const at =
    typeof t.at === "string" && !Number.isNaN(Date.parse(t.at))
      ? new Date(t.at).toISOString()
      : null;
  const subtasks = Array.isArray(t.subtasks)
    ? t.subtasks.filter(isSubtask).slice(0, MAX_SUBTASKS).map((s) => ({
        id: s.id.slice(0, 100),
        title: s.title.slice(0, MAX_TITLE),
        done: s.done,
      }))
    : [];
  return {
    id: t.id,
    title: t.title.trim().slice(0, MAX_TITLE),
    type: typeof t.type === "string" && TYPES.has(t.type) ? (t.type as "event" | "task") : "task",
    at,
    allDay: t.allDay === true,
    projectTag:
      typeof t.projectTag === "string" && TAGS.has(t.projectTag)
        ? (t.projectTag as ProjectTag)
        : "sonstiges",
    priority:
      typeof t.priority === "string" && PRIORITIES.has(t.priority)
        ? (t.priority as Priority)
        : "medium",
    done: t.done === true,
    source: "user",
    recurrence: isRecurrence(t.recurrence) ? t.recurrence : null,
    subtasks,
    estimatedMinutes:
      typeof t.estimatedMinutes === "number" &&
      Number.isFinite(t.estimatedMinutes) &&
      t.estimatedMinutes > 0
        ? Math.round(t.estimatedMinutes)
        : null,
  };
}

function unconfigured(): NextResponse {
  return NextResponse.json(
    { error: "Supabase ist nicht konfiguriert — SUPABASE_URL/SUPABASE_ANON_KEY in .env.local setzen." },
    { status: 503 }
  );
}

export async function GET(): Promise<NextResponse> {
  const supabase = getSupabase();
  if (!supabase) return unconfigured();

  const { data, error } = await supabase
    .schema(DASHBOARD_SCHEMA)
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: supabaseHint(error.code ?? null, error.message, TABLE) },
      { status: 500 }
    );
  }
  return NextResponse.json((data as Row[]).map(fromRow));
}

export async function POST(req: Request): Promise<NextResponse> {
  const supabase = getSupabase();
  if (!supabase) return unconfigured();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body." }, { status: 400 });
  }
  const { upsert, remove } = (body ?? {}) as { upsert?: unknown; remove?: unknown };

  const tasks = Array.isArray(upsert)
    ? upsert.slice(0, MAX_BATCH).map(sanitize).filter((t): t is TaskOrEvent => t !== null)
    : [];
  const ids = Array.isArray(remove)
    ? remove.slice(0, MAX_BATCH).filter((v): v is string => typeof v === "string" && v.length > 0)
    : [];
  if (tasks.length === 0 && ids.length === 0) {
    return NextResponse.json({ error: "Nichts zu tun — upsert/remove leer." }, { status: 400 });
  }

  if (tasks.length > 0) {
    const { error } = await supabase
      .schema(DASHBOARD_SCHEMA)
      .from(TABLE)
      .upsert(tasks.map(toRow), { onConflict: "id" });
    if (error) {
      return NextResponse.json(
        { error: supabaseHint(error.code ?? null, error.message, TABLE) },
        { status: 500 }
      );
    }
  }

  if (ids.length > 0) {
    const { error } = await supabase.schema(DASHBOARD_SCHEMA).from(TABLE).delete().in("id", ids);
    if (error) {
      return NextResponse.json(
        { error: supabaseHint(error.code ?? null, error.message, TABLE) },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
