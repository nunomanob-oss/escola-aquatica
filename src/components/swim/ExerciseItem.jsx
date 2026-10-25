import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

const BADGE_STYLES = {
  SEPT_JAN: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  FEB_JUL: "bg-[#2fe06b]/15 text-[#2fe06b] border-[#2fe06b]/30",
  FULL_YEAR: "bg-violet-400/15 text-violet-300 border-violet-400/30",
  FIRST_WEEK_ONLY: "bg-rose-400/15 text-rose-300 border-rose-400/30",
};

export default function ExerciseItem({ exercise, checked, onToggle }) {
  return (
    <label
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors duration-150 cursor-pointer select-none ${
        checked ? "bg-[#186a35] border-[#2fe06b]/40" : "bg-[#0d3f22] border-transparent hover:border-[#186a35]"
      }`}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        className="mt-0.5 w-5 h-5 border-[#9bd0a8] data-[state=checked]:bg-[#2fe06b] data-[state=checked]:border-[#2fe06b] data-[state=checked]:text-[#062b16]"
      />
      <div className="flex-1">
        <p className="text-sm sm:text-base text-white leading-snug">{exercise.title}</p>
        {exercise.period_label && (
          <span
            className={`inline-block mt-2 text-[11px] px-2 py-1 rounded-full border ${
              BADGE_STYLES[exercise.period_type] || "bg-white/10 text-white/70 border-white/20"
            }`}
          >
            {exercise.period_label}
          </span>
        )}
      </div>
    </label>
  );
}