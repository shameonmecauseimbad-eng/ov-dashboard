type StatTileProps = {
  label: string;
  value: string;
};

/** Einzelne Kennzahl im KPI-Stil — Wert bewusst in Textfarbe, nicht im Akzentgrün. */
export default function StatTile({ label, value }: StatTileProps) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1.5 font-mono text-stat font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
