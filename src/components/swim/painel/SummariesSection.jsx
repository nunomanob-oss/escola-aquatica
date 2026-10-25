import React from "react";
import PanelSection from "./PanelSection";
import PanelRow from "./PanelRow";
import TurmaBadge from "./TurmaBadge";
import { relativeDay } from "./painelMeta";

// Últimos sumários guardados em Conteúdos.
export default function SummariesSection({ summaries }) {
  const recent = [...summaries].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);

  return (
    <PanelSection title="Sumários guardados">
      {recent.length === 0 ? (
        <p className="px-4 py-4 text-[15px] text-[#8E8E93]">
          Ainda não há sumários. Em Conteúdos, marca os exercícios da aula e toca em Guardar Sumário.
        </p>
      ) : (
        recent.map((s) => {
          const n = (s.exercise_ids || []).length;
          return (
            <PanelRow
              key={s.id}
              leading={<TurmaBadge code={s.level_id} />}
              title={`${n} ${n === 1 ? "exercício" : "exercícios"}`}
              trailing={<span className="text-[15px] text-[#8E8E93] whitespace-nowrap">{relativeDay(s.date)}</span>}
            />
          );
        })
      )}
    </PanelSection>
  );
}
