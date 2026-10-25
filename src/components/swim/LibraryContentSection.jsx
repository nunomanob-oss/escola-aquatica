import React from "react";
import LibraryLevelAccordion from "./LibraryLevelAccordion";
import LibraryExerciseGroups from "./LibraryExerciseGroups";

export default function LibraryContentSection({ content, exercises, levels, onOpenExercise }) {
  const program = exercises.filter((ex) => !ex.is_example);
  const examples = exercises.filter((ex) => ex.is_example);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-3 border-b border-[#186a35] pb-2">
        <h2 className="text-lg sm:text-xl font-semibold text-[#2fe06b]">{content}</h2>
        <span className="text-[11px] text-[#9bd0a8] whitespace-nowrap">
          {exercises.length} exercícios
        </span>
      </div>

      {program.length > 0 && (
        <LibraryLevelAccordion
          exercises={program}
          levels={levels}
          onOpenExercise={onOpenExercise}
        />
      )}

      {examples.length > 0 && (
        <div
          className={`rounded-2xl border border-dashed border-[#2fe06b]/35 bg-[#0d3f22]/50 p-3 ${
            program.length > 0 ? "mt-4" : ""
          }`}
        >
          <div className="flex items-baseline justify-between gap-3 mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2fe06b]">
              Exemplos para a aula
            </h3>
            <span className="text-[11px] text-[#9bd0a8] whitespace-nowrap">
              {examples.length} exemplos
            </span>
          </div>
          <LibraryExerciseGroups exercises={examples} onOpenExercise={onOpenExercise} />
        </div>
      )}
    </section>
  );
}