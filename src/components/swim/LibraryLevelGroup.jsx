import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import LibraryPeriodGroup from "./LibraryPeriodGroup";

const PERIOD_ORDER = ["SEPT_JAN", "FEB_JUL", "FULL_YEAR", "FIRST_WEEK_ONLY"];
const FALLBACK_LABELS = {
  SEPT_JAN: "Dar de setembro a janeiro",
  FEB_JUL: "Dar de fevereiro a julho",
  FULL_YEAR: "Dar de setembro a julho",
  FIRST_WEEK_ONLY: "Só na 1.ª semana (até 15 de setembro)",
};

function periodLabel(type, items) {
  const first = items.find((ex) => ex.period_label);
  return (first && first.period_label) || FALLBACK_LABELS[type] || "Sem época";
}

function groupByPeriod(exercises) {
  const map = new Map();
  exercises.forEach((ex) => {
    const key = ex.period_type || "FULL_YEAR";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(ex);
  });
  return [...map.entries()].sort((a, b) => {
    const ia = PERIOD_ORDER.indexOf(a[0]);
    const ib = PERIOD_ORDER.indexOf(b[0]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export default function LibraryLevelGroup({ code, name, exercises, onOpenExercise }) {
  const [open, setOpen] = useState(false);
  const periods = groupByPeriod(exercises);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-xl bg-[#0d3f22] border border-transparent hover:border-[#186a35] transition-colors"
    >
      <CollapsibleTrigger className="w-full flex items-center gap-3 p-3 text-left">
        <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-[#2fe06b] text-[#062b16] shrink-0">
          {code}
        </span>
        {name ? (
          <span className="flex-1 text-sm text-[#d8f0da] leading-snug">{name}</span>
        ) : (
          <span className="flex-1" />
        )}
        <span className="text-[11px] text-[#9bd0a8] shrink-0">{exercises.length}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#2fe06b] shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="px-3 pb-3 space-y-2">
        {periods.map(([type, items]) => (
          <LibraryPeriodGroup
            key={type}
            label={periodLabel(type, items)}
            exercises={items}
            onOpenExercise={onOpenExercise}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}