import React from "react";
import { Clock } from "lucide-react";
import { formatSheetDate, sectionIcon } from "./workoutMeta";

export default function WorkoutSheetPrint({ sheet }) {
  const sections = (sheet.sections || []).filter((section) => (section.items || []).length > 0);

  return (
    <div className="print-area bg-white text-[#1D3F75] rounded-2xl overflow-hidden border-2 border-[#215598]">
      <div className="bg-[#1D3F75] text-white px-5 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#A4C6ED]">
          Escola Aquática · Ficha de treino
        </p>
        <h2 className="text-xl font-bold leading-tight mt-1">{sheet.title}</h2>
        <p className="text-xs text-[#A4C6ED] mt-1">
          {sheet.focus || "Melhor técnica • Nadador mais forte"}
        </p>
        <p className="text-[11px] text-white/80 mt-1">
          Turma {sheet.level_id}
          {sheet.session_date ? ` · ${formatSheetDate(sheet.session_date)}` : ""}
        </p>
      </div>

      {sections.map((section, index) => {
        const Icon = sectionIcon(section.title, index);
        return (
          <div key={`${section.title}-${index}`} className="flex gap-3 px-5 py-4 border-t border-[#A4C6ED]">
            <div className="w-9 h-9 rounded-full bg-[#EAF4F9] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[#3B7FB9]" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C5E9C]">
                {section.title}
              </h3>
              <ul className="mt-1.5 space-y-1">
                {(section.items || []).map((item, itemIndex) => (
                  <li key={`${item}-${itemIndex}`} className="flex gap-2 text-sm text-[#12203a]">
                    <span className="text-[#3B7FB9]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {section.rest && (
              <div className="w-16 h-16 rounded-full border-2 border-[#3B7FB9] flex flex-col items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5 text-[#3B7FB9]" />
                <span className="text-[10px] font-bold text-[#1D3F75]">{section.rest}</span>
                <span className="text-[8px] uppercase text-[#3B7FB9]">descanso</span>
              </div>
            )}
          </div>
        );
      })}

      {sheet.notes && (
        <div className="px-5 py-3 border-t border-[#A4C6ED] text-xs text-[#12203a]">{sheet.notes}</div>
      )}

      <div className="bg-[#1D3F75] text-white px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-[#A4C6ED]">Total</span>
        <span className="font-bold">{sheet.total_distance ? `${sheet.total_distance} m` : "—"}</span>
      </div>
    </div>
  );
}