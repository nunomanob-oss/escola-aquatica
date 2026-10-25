import React from "react";
import { ringColor } from "./painelMeta";

// Quadrado arredondado com o código da turma, na cor da etapa.
export default function TurmaBadge({ code }) {
  const color = ringColor(code);
  return (
    <span
      className="w-9 h-9 shrink-0 rounded-[9px] flex items-center justify-center text-[13px] font-semibold"
      style={{ backgroundColor: `${color}2E`, color }}
    >
      {code}
    </span>
  );
}
