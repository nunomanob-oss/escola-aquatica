import React, { useMemo, useState } from "react";
import { Check, ChevronDown, Eye, Lightbulb, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Image } from "@/components/ui/image";
import ProgressionSteps from "./ProgressionSteps";

const PERIOD_BADGE = "bg-amber-400/15 text-amber-300 border-amber-400/30";

// Traço horizontal que liga cada nó à linha vertical do nível de cima.
const branch =
  "relative before:absolute before:-left-4 before:top-5 before:w-3 before:border-t before:border-[#186a35]";

function Difficulty({ rating }) {
  if (!rating) return null;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Dificuldade ${rating}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`w-1.5 h-1.5 rounded-full ${n <= rating ? "bg-[#2fe06b]" : "bg-white/20"}`} />
      ))}
    </span>
  );
}

function ExampleNode({ exercise, levelCode, inLesson, onToggle, onOpen }) {
  const elsewhere = (exercise.turmas || []).filter((t) => t !== levelCode);

  return (
    <li className={branch}>
      <div className="rounded-lg bg-[#062b16] p-3">
        {exercise.image_diagram && (
          <button type="button" onClick={() => onOpen(exercise)} className="block w-full mb-3 rounded-md overflow-hidden">
            <Image src={exercise.image_diagram} alt={exercise.title} className="w-full aspect-[3/2]" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpen(exercise)}
          className="text-left text-sm font-semibold text-white hover:text-[#2fe06b]"
        >
          {exercise.title}
        </button>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#9bd0a8]">
          <span>{exercise.code}</span>
          {exercise.duration && <span>· {exercise.duration}</span>}
          <Difficulty rating={exercise.difficulty_rating} />
          {elsewhere.length > 0 && <span>· também em {elsewhere.join(", ")}</span>}
        </div>

        {(exercise.regression || exercise.progression) && (
          <div className="mt-3 border-l border-[#186a35] pl-3">
            <ProgressionSteps exercise={exercise} />
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onToggle(exercise.id)}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold transition-colors ${
              inLesson
                ? "bg-[#2fe06b] text-[#062b16]"
                : "bg-[#186a35] text-[#d8f0da] hover:bg-[#2fe06b]/30"
            }`}
          >
            {inLesson ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {inLesson ? "Na aula" : "Juntar à aula"}
          </button>
          <button
            type="button"
            onClick={() => onOpen(exercise)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-[#d8f0da] hover:bg-[#186a35]"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver ficha
          </button>
        </div>
      </div>
    </li>
  );
}

function ContentNode({ content, examples, levelCode, selectedIds, onToggle, onOpenExercise }) {
  const [open, setOpen] = useState(false);
  const checked = selectedIds.has(content.id);

  return (
    <li className={branch}>
      <div
        className={`rounded-xl border transition-colors ${
          checked ? "bg-[#186a35] border-[#2fe06b]/40" : "bg-[#0d3f22] border-transparent"
        }`}
      >
        <div className="flex items-start gap-3 p-4">
          <label className="flex flex-1 items-start gap-3 cursor-pointer select-none">
            <Checkbox
              checked={checked}
              onCheckedChange={() => onToggle(content.id)}
              className="mt-0.5 w-5 h-5 border-[#9bd0a8] data-checked:bg-[#2fe06b] data-checked:border-[#2fe06b] data-checked:text-[#062b16]"
            />
            <span className="flex-1">
              <span className="block text-sm sm:text-base text-white leading-snug">
                <span className="text-[#9bd0a8] mr-1.5">{content.number}.</span>
                {content.title}
              </span>
              {content.period && (
                <span className={`inline-block mt-2 text-[11px] px-2 py-1 rounded-full border ${PERIOD_BADGE}`}>
                  {content.period}
                </span>
              )}
            </span>
          </label>
          {examples.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex items-center gap-1 shrink-0 px-2.5 h-9 rounded-lg text-xs font-semibold text-[#2fe06b] hover:bg-[#2fe06b]/10"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Exemplos
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
    </li>
  );
}

function BlockNode({ block, children, total, selected }) {
  const [open, setOpen] = useState(true);
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        <ChevronDown className={`w-4 h-4 text-[#2fe06b] transition-transform ${open ? "" : "-rotate-90"}`} />
        <h2 className="flex-1 text-[#2fe06b] text-xs font-semibold uppercase tracking-wider">{block}</h2>
        <span className="text-[11px] text-[#9bd0a8]">
          {selected > 0 ? `${selected}/` : ""}
          {total}
        </span>
      </button>
      {open && <ul className="ml-2 border-l border-[#186a35] pl-4 space-y-2">{children}</ul>}
    </section>
  );
}

// Árvore do programa da turma: Bloco → Conteúdo → Exercício exemplo → Regressão / Progressão.
export default function ContentTree({ contents, exercisesByCode, levelCode, selectedIds, onToggle, onOpenExercise }) {
  const blocks = useMemo(() => {
    const map = new Map();
    contents.forEach((content) => {
      const key = content.block || "Outros conteúdos";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(content);
    });
    return [...map.entries()];
  }, [contents]);

  return (
    <div className="space-y-4">
      {blocks.map(([block, items]) => (
        <BlockNode
          key={block}
          block={block}
          total={items.length}
          selected={items.filter((c) => selectedIds.has(c.id)).length}
        >
          {items.map((content) => (
            <ContentNode
              key={content.id}
              content={content}
              examples={(content.exercise_codes || []).map((code) => exercisesByCode[code]).filter(Boolean)}
              levelCode={levelCode}
              selectedIds={selectedIds}
              onToggle={onToggle}
              onOpenExercise={onOpenExercise}
            />
          ))}
        </BlockNode>
      ))}
    </div>
  );
}
