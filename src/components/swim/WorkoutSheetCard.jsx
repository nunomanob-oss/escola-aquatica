import React from "react";
import { CalendarDays, Pencil, Printer, Trash2 } from "lucide-react";
import { formatSheetDate } from "./workoutMeta";

const actionStyles =
  "flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors";

export default function WorkoutSheetCard({ sheet, onOpen, onEdit, onDelete }) {
  const series = (sheet.sections || []).reduce(
    (total, section) => total + (section.items || []).length,
    0
  );

  return (
    <div className="rounded-2xl bg-[#0d3f22] border border-[#186a35] p-4 flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white leading-snug">{sheet.title}</h3>
          <p className="text-[11px] text-[#9bd0a8] mt-1 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Turma {sheet.level_id}
            {sheet.session_date ? ` · ${formatSheetDate(sheet.session_date)}` : ""}
          </p>
        </div>
        {sheet.total_distance > 0 && (
          <span className="text-[11px] font-bold text-[#2fe06b] whitespace-nowrap">
            {sheet.total_distance} m
          </span>
        )}
      </div>

      {sheet.focus && <p className="text-xs text-[#d8f0da] mt-2">{sheet.focus}</p>}

      <p className="text-[11px] text-[#9bd0a8] mt-2">
        {(sheet.sections || []).length} blocos · {series} séries
      </p>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#186a35]">
        <button
          onClick={onOpen}
          className={`${actionStyles} bg-[#2fe06b] text-[#062b16] font-semibold hover:bg-[#2fe06b]/90`}
        >
          <Printer className="w-3.5 h-3.5" />
          Ver e imprimir
        </button>
        <button
          onClick={onEdit}
          className={`${actionStyles} text-[#d8f0da] bg-white/5 hover:bg-white/10`}
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>
        <button
          onClick={onDelete}
          className={`${actionStyles} text-[#ff9c9c] bg-white/5 hover:bg-white/10`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Apagar
        </button>
      </div>
    </div>
  );
}