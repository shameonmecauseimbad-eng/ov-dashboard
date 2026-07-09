"use client";

import { PROJECT_TAG_LABEL, PROJECT_TAGS, type ProjectTag } from "@/lib/todo-types";

export type FilterValue = ProjectTag | "all";

type ProjectFilterProps = {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

/**
 * Filterleiste als dezente Outline-Pills. Der aktive Filter ist NICHT über
 * Farbe markiert, sondern über Opacity/Font-Weight: aktiv = voll deckend +
 * heller Rahmen, inaktiv = gedämpft.
 */
export default function ProjectFilter({ value, onChange }: ProjectFilterProps) {
  const options: Array<{ key: FilterValue; label: string }> = [
    { key: "all", label: "Alle" },
    ...PROJECT_TAGS.map((t) => ({ key: t as FilterValue, label: PROJECT_TAG_LABEL[t] })),
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Nach Projekt filtern">
      {options.map(({ key, label }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-xs transition-all ${
              active
                ? "border-white/40 font-medium text-foreground opacity-100"
                : "border-line font-normal text-muted opacity-60 hover:opacity-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
