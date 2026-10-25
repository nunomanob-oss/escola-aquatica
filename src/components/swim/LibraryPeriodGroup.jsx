import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ExerciseCard from "./ExerciseCard";

export default function LibraryPeriodGroup({ label, exercises, onOpenExercise }) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg bg-[#062b16]">
      <CollapsibleTrigger className="w-full flex items-center gap-2 p-2.5 text-left">
        <ChevronRight
          className={`w-4 h-4 text-[#2fe06b] shrink-0 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-[#9bd0a8]">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-[#2fe06b] shrink-0">
          {exercises.length}
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-3 pb-3 space-y-2">
        {exercises.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} onOpen={onOpenExercise} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}