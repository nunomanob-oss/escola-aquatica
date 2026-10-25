import React from "react";
import { Link } from "@tanstack/react-router";
import PanelSection from "./PanelSection";
import PanelRow from "./PanelRow";
import TurmaBadge from "./TurmaBadge";
import { relativeDay, todayIso } from "./painelMeta";

// Próximas fichas primeiro (por data), depois as mais recentes.
function pick(sheets) {
  const today = todayIso();
  const upcoming = sheets.filter((s) => (s.session_date || "") >= today).sort((a, b) => a.session_date.localeCompare(b.session_date));
  const past = sheets.filter((s) => (s.session_date || "") < today).sort((a, b) => (b.session_date || "").localeCompare(a.session_date || ""));
  return [...upcoming, ...past].slice(0, 4);
}

export default function SheetsSection({ sheets }) {
  const list = pick(sheets);

  return (
    <PanelSection title="Fichas de treino" actionLabel={list.length ? "Ver todas" : undefined} actionTo="/aulas">
      {list.length === 0 ? (
        <div className="px-4 py-4">
          <p className="text-[15px] text-[#8E8E93]">Ainda não há fichas de treino.</p>
          <Link to="/aulas" className="mt-2 inline-block text-[15px] text-[#0A84FF] active:opacity-60">
            Criar a primeira ficha
          </Link>
        </div>
      ) : (
        list.map((sheet) => (
          <PanelRow
            key={sheet.id}
            leading={<TurmaBadge code={sheet.level_id} />}
            title={sheet.title}
            subtitle={relativeDay(sheet.session_date)}
            trailing={
              sheet.total_distance > 0 && (
                <span className="text-[15px] text-[#8E8E93] tabular-nums whitespace-nowrap">
                  {sheet.total_distance.toLocaleString("pt-PT")} m
                </span>
              )
            }
          />
        ))
      )}
    </PanelSection>
  );
}
