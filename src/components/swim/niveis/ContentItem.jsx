import React, { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ExampleNode } from "../ContentTree";
import { SEASON_MONTHS, contentStatus } from "./calendar";

const STATUS = {
  intro: { label: "Introdução", className: "bg-amber-400/15 text-amber-300 border-amber-400/30" },
  consolidation: { label: "Consolidação", className: "bg-violet-400/15 text-violet-300 border-violet-400/30" },
  off: { label: "Fora deste mês", className: "bg-white/5 text-white/50 border-white/15" },
};

// Conteúdo do nível com a sua calendarização (faixa Set–Jul), o estado no mês escolhido
// e os exercícios exemplo (os mesmos da aba Conteúdos).
// A área do conteúdo é o controlo; a Checkbox é só visual (dentro de um <label> alternava duas vezes).
export default function ContentItem({ content, month, examples = [], levelCode, selectedIds, onToggle, onOpenExercise }) {
  const [open, setOpen] = useState(false);
  const checked = selectedIds.has(content.id);
  const status = STATUS[contentStatus(content, month)];
  const months = new Set(content.months || []);

  const onKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(content.id);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-colors duration-150 ${
        checked ? "bg-[#186a35] border-[#2fe06b]/40" : "bg-[#0d3f22] border-transparent hover:border-[#186a35]"
      }`}
    >
      <div className="flex items-start gap-2 p-4">
        <div
          role="checkbox"
          aria-checked={checked}
          tabIndex={0}
          onClick={() => onToggle(content.id)}
          onKeyDown={onKeyDown}
          className="flex flex-1 min-w-0 items-start gap-3 cursor-pointer select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#2fe06b]/60"
        >
          <Checkbox
            checked={checked}
            tabIndex={-1}
            aria-hidden
            className="pointer-events-none mt-0.5 w-5 h-5 border-[#9bd0a8] data-checked:bg-[#2fe06b] data-checked:border-[#2fe06b] data-checked:text-[#062b16]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm sm:text-base text-white leading-snug">
              <span className="text-[#9bd0a8] tabular-nums mr-1.5">{content.number}.</span>
              {content.title}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-full border ${status.className}`}>{status.label}</span>
              {content.period && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 text-[#d8f0da]">
                  Introdução {content.period}
                </span>
              )}
              {(content.continuity || []).length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/15 text-[#d8f0da]">
                  Continuidade {content.continuity.join(" + ")}
                </span>
              )}
            </div>

            <div className="mt-2 grid grid-cols-11 gap-0.5 max-w-sm" aria-label={`Meses: ${(content.months || []).join(", ")}`}>
              {SEASON_MONTHS.map((m) => (
                <span
                  key={m}
                  title={m}
                  className={`text-[9px] leading-4 text-center rounded-sm ${
                    months.has(m) ? "bg-[#2fe06b]/25 text-[#c8f5d5]" : "bg-white/5 text-white/30"
                  } ${m === month ? "ring-1 ring-[#2fe06b]" : ""}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {examples.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1 shrink-0 px-2.5 h-9 rounded-lg text-xs font-semibold text-[#2fe06b] hover:bg-[#2fe06b]/10"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exemplos</span>
            <span className="text-[#9bd0a8]">{examples.length}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      {open && (
        <ul className="ml-6 mr-3 mb-3 border-l border-[#186a35] pl-4 space-y-2">
          {examples.map((exercise) => (
            <ExampleNode
              key={exercise.id}
              exercise={exercise}
              levelCode={levelCode}
              inLesson={selectedIds.has(exercise.id)}
              onToggle={onToggle}
              onOpen={onOpenExercise}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
