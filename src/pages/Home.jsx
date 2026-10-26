import React, { useEffect, useState, useMemo } from "react";
import { entities } from "@/lib/entities";
import LevelTabs from "@/components/swim/LevelTabs";
import ExerciseList from "@/components/swim/ExerciseList";
import SummaryPanel from "@/components/swim/SummaryPanel";
import AppNav from "@/components/swim/AppNav";
import ContentTree from "@/components/swim/ContentTree";
import FilterChipRow from "@/components/swim/FilterChipRow";
import ExerciseDetailDialog from "@/components/swim/ExerciseDetailDialog";
import { CACHE_KEYS, fetchAll, loadWithCache } from "@/components/swim/offlineCache";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const CURRENT_MONTH = MONTHS[new Date().getMonth()];

export default function Home() {
  const [levels, setLevels] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [contents, setContents] = useState([]);
  const [onlyThisMonth, setOnlyThisMonth] = useState(false);
  const [openExercise, setOpenExercise] = useState(null);
  const [activeCode, setActiveCode] = useState(
    () => localStorage.getItem("swim_active_level") || "A1"
  );
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    // Rede primeiro; sem rede, usa a última cópia guardada no dispositivo.
    const list = (key, loader) => loadWithCache(key, loader).catch(() => []);
    Promise.all([
      list(CACHE_KEYS.levels, async () => (await entities.Level.list({ limit: 100 })).items || []),
      list(CACHE_KEYS.exercises, () => fetchAll(entities.Exercise, {}, "order_index")),
      list(CACHE_KEYS.contents, () => fetchAll(entities.LevelContent, {}, "order_index")),
    ])
      .then(([lvl, ex, cnt]) => {
        setLevels(lvl);
        setExercises(ex);
        setContents(cnt);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem("swim_active_level", activeCode);
    try {
      const raw = localStorage.getItem(`swim_selection_${activeCode}`);
      setSelectedIds(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setSelectedIds(new Set());
    }
  }, [activeCode]);

  const sortedLevels = useMemo(
    () => [...levels].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [levels]
  );

  const levelExercises = useMemo(
    () =>
      exercises
        .filter((e) => e.level_id === activeCode)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [exercises, activeCode]
  );

  const exercisesByCode = useMemo(
    () => Object.fromEntries(exercises.filter((e) => e.code).map((e) => [e.code, e])),
    [exercises]
  );

  const levelContents = useMemo(
    () =>
      contents
        .filter((c) => c.level_code === activeCode)
        .filter((c) => !onlyThisMonth || (c.months || []).includes(CURRENT_MONTH))
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [contents, activeCode, onlyThisMonth]
  );

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(`swim_selection_${activeCode}`, JSON.stringify([...next]));
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    localStorage.setItem(`swim_selection_${activeCode}`, JSON.stringify([]));
  };

  const selectedContents = contents.filter((c) => c.level_code === activeCode && selectedIds.has(c.id));
  const selectedExercises = exercises.filter((e) => selectedIds.has(e.id));
  const activeLevel = sortedLevels.find((l) => l.code === activeCode);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#062b16] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#0d3f22] border-t-[#2fe06b] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#062b16] text-white pb-6 flex flex-col">
      <AppNav />

      <header className="px-4 sm:px-8 pt-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Escola Aquática
        </h1>
        <p className="text-[#9bd0a8] text-sm mt-1">
          Seleciona a turma, marca os conteúdos da aula de hoje e abre os exemplos de exercícios
        </p>
      </header>

      <LevelTabs levels={sortedLevels} activeCode={activeCode} onSelect={setActiveCode} />

      <main className="px-4 sm:px-8 mt-6 max-w-3xl mx-auto w-full flex-1">
        {activeLevel && (
          <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#9bd0a8]">
            {activeLevel.age_range && <span>Idade: {activeLevel.age_range}</span>}
            {activeLevel.duration_min && <span>· {activeLevel.duration_min} min</span>}
            {activeLevel.max_students && <span>· Máx. {activeLevel.max_students} alunos</span>}
          </div>
        )}

        <FilterChipRow
          items={[
            { value: false, label: "Todo o ano" },
            { value: true, label: `Este mês (${CURRENT_MONTH})` },
          ]}
          activeValue={onlyThisMonth}
          onSelect={setOnlyThisMonth}
        />

        <div className="mt-4">
          {levelContents.length > 0 ? (
            <ContentTree
              contents={levelContents}
              exercisesByCode={exercisesByCode}
              levelCode={activeCode}
              selectedIds={selectedIds}
              onToggle={toggleSelected}
              onOpenExercise={setOpenExercise}
            />
          ) : (
            levelExercises.length === 0 && (
              <p className="text-[#9bd0a8] text-sm py-16 text-center">
                {onlyThisMonth ? "Sem conteúdos para este mês." : "Sem conteúdos para esta turma."}
              </p>
            )
          )}
        </div>

        {levelExercises.length > 0 && (
          <div className="mt-8">
            <h2 className="text-[#9bd0a8] text-xs font-semibold uppercase tracking-wider mb-2">
              Outros exercícios da turma
            </h2>
            <ExerciseList exercises={levelExercises} selectedIds={selectedIds} onToggle={toggleSelected} />
          </div>
        )}
      </main>

      <SummaryPanel
        level={activeLevel}
        selectedContents={selectedContents}
        selectedExercises={selectedExercises}
        onClear={clearSelection}
      />

      <ExerciseDetailDialog
        exercise={openExercise}
        onClose={() => setOpenExercise(null)}
        levels={sortedLevels}
        onDuplicated={() => {}}
      />
    </div>
  );
}