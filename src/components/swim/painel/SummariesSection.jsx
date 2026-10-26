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
          Ainda não há sumários. Em Conteúdos, marca os conteúdos e exercícios da aula e toca em Guardar Sumário.
        </p>
      ) : (
        recent.map((s) => {
          const n = (s.exercise_ids || []).length;
          const c = (s.content_ids || []).length;
          return (
            <PanelRow
              key={s.id}
              leading={<TurmaBadge code={s.level_id} />}
              title={[
                c > 0 && `${c} ${c === 1 ? "conteúdo" : "conteúdos"}`,
                (n > 0 || c === 0) && `${n} ${n === 1 ? "exercício" : "exercícios"}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              trailing={<span className="text-[15px] text-[#8E8E93] whitespace-nowrap">{relativeDay(s.date)}</span>}
            />
          );
        })
      )}
    </PanelSection>
  );
}
