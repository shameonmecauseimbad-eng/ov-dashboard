export type HistoryColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

type HistoryTableProps = {
  columns: HistoryColumn[];
  rows: Array<Record<string, React.ReactNode>>;
};

/**
 * Schlichte Detail-Tabelle für die Template-Seiten — horizontales Scrollen
 * statt Umbruch, Zahlen rechtsbündig in Mono mit Tabellenziffern.
 */
export default function HistoryTable({ columns, rows }: HistoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-2.5 ${
                    col.align === "right"
                      ? "text-right font-mono tabular-nums text-foreground"
                      : "text-foreground"
                  }`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
