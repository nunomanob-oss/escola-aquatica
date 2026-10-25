import React from "react";
import { Link } from "@tanstack/react-router";
import ProgressRing from "./ProgressRing";
import { ringColor } from "./painelMeta";

const rounded = { fontFamily: 'ui-rounded, "SF Pro Rounded", system-ui, sans-serif' };

// Turma em destaque: anel grande, conteúdos dados e os próximos por dar.
export default function FeaturedTurma({ level, coverage, onOpen }) {
  const color = ringColor(level.code);
  const ratio = coverage.total ? coverage.done / coverage.total : 0;
  const next = coverage.pending.slice(0, 3);

  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center gap-5">
        <ProgressRing value={ratio} size={112} stroke={14} color={color} label={`${level.code}: ${coverage.done} de ${coverage.total} conteúdos dados`} />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-white">Turma {level.code}</p>
          <p className="text-[13px] text-[#8E8E93]">Conteúdos dados nesta época</p>
          <p className="mt-1 leading-none tabular-nums" style={{ ...rounded, color }}>
            <span className="text-[34px] font-semibold">{coverage.done}</span>
            <span className="text-[20px] font-medium">/{coverage.total}</span>
          </p>
        </div>
      </div>

      {next.length > 0 ? (
        <div className="mt-4">
          <p className="text-[13px] text-[#8E8E93] mb-1.5">A seguir no programa</p>
          <ul className="space-y-1.5">
            {next.map((ex) => (
              <li key={ex.id} className="flex gap-2.5 text-[15px] leading-snug text-white">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="min-w-0">{ex.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-[15px] text-[#8E8E93]">
          {coverage.total ? "Todo o programa até hoje já foi dado." : "Esta turma ainda não tem programa."}
        </p>
      )}

      <Link
        to="/"
        onClick={onOpen}
        className="mt-4 inline-flex h-11 items-center px-4 rounded-[10px] bg-[#0A84FF] text-[15px] font-semibold text-white active:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Abrir conteúdos de {level.code}
      </Link>
    </div>
  );
}
