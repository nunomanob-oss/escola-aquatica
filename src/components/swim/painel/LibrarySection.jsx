import React from "react";
import PanelSection from "./PanelSection";
import PanelRow from "./PanelRow";
import { ATHLETE_LEVEL_OPTIONS } from "../exerciseMeta";
import { isLibraryExercise } from "../libraryQuery";

// Exercícios da Biblioteca por nível do atleta.
export default function LibrarySection({ exercises }) {
  const library = exercises.filter(isLibraryExercise);
  const rows = ATHLETE_LEVEL_OPTIONS.map((level) => ({
    level,
    count: library.filter((ex) => (ex.level || []).includes(level)).length,
  }));

  return (
    <PanelSection title="Biblioteca" actionLabel="Abrir" actionTo="/biblioteca">
      {rows.map(({ level, count }) => (
        <PanelRow
          key={level}
          title={level}
          trailing={<span className="text-[17px] text-[#8E8E93] tabular-nums">{count}</span>}
        />
      ))}
    </PanelSection>
  );
}
