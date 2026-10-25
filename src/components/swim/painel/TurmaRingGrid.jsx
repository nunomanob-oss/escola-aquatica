import React from "react";
import ProgressRing from "./ProgressRing";
import { ringColor } from "./painelMeta";

// Grelha com o anel de cada turma; tocar escolhe a turma em destaque.
export default function TurmaRingGrid({ items, activeCode, onSelect }) {
  return (
    <div className="grid grid-cols-4 gap-1 p-2 border-t border-[#38383A]">
      {items.map(({ level, coverage }) => {
        const ratio = coverage.total ? coverage.done / coverage.total : 0;
        const active = level.code === activeCode;
        return (
          <button
            key={level.code}
            type="button"
            onClick={() => onSelect(level.code)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1 py-2.5 rounded-[10px] active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] ${
              active ? "bg-[#2C2C2E]" : ""
            }`}
          >
            <ProgressRing value={ratio} size={52} stroke={7} color={ringColor(level.code)} label={`${level.code}: ${Math.round(ratio * 100)}%`} />
            <span className="text-[13px] font-semibold text-white">{level.code}</span>
            <span className="text-[12px] text-[#8E8E93] tabular-nums">{Math.round(ratio * 100)}%</span>
          </button>
        );
      })}
    </div>
  );
}
