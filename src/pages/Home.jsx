import React, { useEffect, useState, useMemo } from "react";
import { entities } from "@/lib/entities";
import LevelTabs from "@/components/swim/LevelTabs";
import ExerciseList from "@/components/swim/ExerciseList";
import SummaryPanel from "@/components/swim/SummaryPanel";
import AppNav from "@/components/swim/AppNav";

const CACHE_KEYS = {
  levels: "swim_cache_levels",
  categories: "swim_cache_categories",
  exercises: "swim_cache_exercises",
};

export default function Home() {
  const [levels, setLevels] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [activeCode, setActiveCode] = useState(
    () => localStorage.getItem("swim_active_level") || "A1"
  );
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [lvlRes, exRes] = await Promise.all([
          entities.Level.list({ limit: 100 }),
          entities.Exercise.list({ limit: 500 }),
        ]);
        const lvl = lvlRes.items || [];
        const ex = exRes.items || [];
        setLevels(lvl);
        setExercises(ex);
        localStorage.setItem(CACHE_KEYS.levels, JSON.stringify(lvl));
        localStorage.setItem(CACHE_KEYS.exercises, JSON.stringify(ex));
      } catch (e) {
        const lvl = JSON.parse(localStorage.getItem(CACHE_KEYS.levels) || "[]");
        const ex = JSON.parse(localStorage.getItem(CACHE_KEYS.exercises) || "[]");
        setLevels(lvl);
        setExercises(ex);
      } finally {
        setLoading(false);
      }
    }
    load();
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

  const toggleExercise = (id) => {
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

  const selectedExercises = levelExercises.filter((e) => selectedIds.has(e.id));
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
          Seleciona a turma e marca os exercícios dados na aula de hoje
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

        <ExerciseList
          exercises={levelExercises}
          selectedIds={selectedIds}
          onToggle={toggleExercise}
        />
      </main>

      <SummaryPanel level={activeLevel} selectedExercises={selectedExercises} onClear={clearSelection} />
    </div>
  );
}