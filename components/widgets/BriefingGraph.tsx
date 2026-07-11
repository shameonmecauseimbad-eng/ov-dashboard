import ErrorNote from "@/components/ErrorNote";
import TopicGraph from "@/components/TopicGraph";
import WidgetCard from "@/components/WidgetCard";
import { latestPerThema, loadBriefingHistory } from "@/lib/briefing";
import { buildTopicGraph } from "@/lib/briefing-analysis";

/**
 * Themen-Netz: zeigt, welche Briefing-Themen am aktuellsten Stand über
 * gemeinsame Begriffe (Fed, Inflation, Öl, …) zusammenhängen. Server berechnet
 * Knoten/Kanten, die Interaktion (Hover-Highlight) läuft im Client-TopicGraph.
 */
export default async function BriefingGraph() {
  const result = await loadBriefingHistory();

  if (result.status === "error") {
    return (
      <WidgetCard title="Themen-Netz" badge="Offline" badgeTone="neutral">
        <ErrorNote>{result.hint}</ErrorNote>
      </WidgetCard>
    );
  }

  const latest = latestPerThema(result.rows);
  const graph = buildTopicGraph(latest);

  return (
    <WidgetCard
      title="Themen-Netz"
      badge={`${graph.edges.length} ${graph.edges.length === 1 ? "Verbindung" : "Verbindungen"}`}
      badgeTone={graph.edges.length > 0 ? "accent" : "neutral"}
    >
      <TopicGraph nodes={graph.nodes} edges={graph.edges} />
    </WidgetCard>
  );
}
