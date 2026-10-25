import React, { useCallback, useEffect, useMemo, useState } from "react";
import { entities } from "@/lib/entities";
import { Plus } from "lucide-react";
import AppNav from "@/components/swim/AppNav";
import FilterChipRow from "@/components/swim/FilterChipRow";
import LibraryContentSection from "@/components/swim/LibraryContentSection";
import AddExerciseDialog from "@/components/swim/AddExerciseDialog";
import ExerciseFilters from "@/components/swim/ExerciseFilters";
import ExerciseCard from "@/components/swim/ExerciseCard";
import ExerciseDetailDialog from "@/components/swim/ExerciseDetailDialog";
import {
  EMPTY_FILTERS,
  countByLevel,
  filterLibrary,
  hasActiveFilters,
  isLibraryExercise,
  rank,
} from "@/components/swim/libraryQuery";
import { normalizeExercise } from "@/components/swim/exerciseMeta";
import { CACHE_KEYS, fetchAll, loadWithCache } from "@/components/swim/offlineCache";
import { Button } from "@/components/ui/button";

const CONTENT_ORDER = [
  "Adaptação ao Meio Aquático",
  "Crol",
  "Costas",
  "Bruços",
  "Mariposa",
  "Estilos",
  "Partidas e Viragens",
  "Remadas e Sustentação",
  "Pólo Aquático",
  "Natação Sincronizada",
];

export default function Biblioteca() {
  const [levels, setLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState("all");
  const [allExercises, setAllExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openExercise, setOpenExercise] = useState(null);

  const loadLevels = useCallback(async () => {
    const lvls = await loadWithCache(CACHE_KEYS.levels, async () => {
      const res = await entities.Level.list({ limit: 100 });
      return Array.isArray(res) ? res : res.items || [];
    }).catch(() => []);
    setLevels([...lvls].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
  }, []);

  // Biblioteca completa (rede ou cache); turma e filtros aplicam-se no dispositivo.
  const loadExercises = useCallback(async () => {
    const list = await loadWithCache(CACHE_KEYS.exercises, () =>
      fetchAll(entities.Exercise, {}, "order_index")
    ).catch(() => []);
    setAllExercises(list.filter(isLibraryExercise).map(normalizeExercise));
  }, []);

  useEffect(() => {
    Promise.all([loadLevels(), loadExercises()]).finally(() => setLoading(false));
  }, [loadLevels, loadExercises]);

  const exercises = useMemo(
    () => filterLibrary(allExercises, activeLevel, filters),
    [allExercises, activeLevel, filters]
  );

  const levelCounts = useMemo(() => countByLevel(allExercises, filters), [allExercises, filters]);

  const handleCreated = async (exercise) => {
    await loadExercises();
    if (activeLevel !== "all" && exercise.level_id !== activeLevel) {
      setActiveLevel(exercise.level_id);
    }
  };

  const levelOrder = useMemo(
    () => Object.fromEntries(levels.map((l) => [l.code, l.order_index || 0])),
    [levels]
  );

  const sections = useMemo(() => {
    const map = new Map();
    [...exercises]
      .sort((a, b) => {
        const la = levelOrder[a.level_id] ?? 99;
        const lb = levelOrder[b.level_id] ?? 99;
        if (la !== lb) return la - lb;
        return rank(a) - rank(b) || (a.order_index || 0) - (b.order_index || 0);
      })
      .forEach((ex) => {
        const key = ex.content || "Outros";
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(ex);
      });
    return [...map.entries()].sort((a, b) => {
      const ia = CONTENT_ORDER.indexOf(a[0]);
      const ib = CONTENT_ORDER.indexOf(b[0]);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
  }, [exercises, levelOrder]);

  const levelItems = [
    { value: "all", label: "Todas", count: levelCounts.all },
    ...levels.map((l) => ({ value: l.code, label: l.code, count: levelCounts[l.code] })),
  ];

  const filtersActive = hasActiveFilters(filters);

  const handleDuplicated = async () => {
    await loadExercises();
  };

  return (
    <div className="min-h-screen bg-[#062b16] text-white pb-10">
      <AppNav />

      <header className="px-4 sm:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Biblioteca de Exercícios
            </h1>
            <p className="text-[#9bd0a8] text-sm mt-1 max-w-xl">
              Escolhe a turma e vê os conteúdos, subcategorias e exemplos de exercícios para
              desenvolver com os alunos
            </p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="w-full sm:w-auto bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Adicionar exercício
          </Button>
        </div>
      </header>

      <ExerciseFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#0d3f22] border-t-[#2fe06b] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <FilterChipRow items={levelItems} activeValue={activeLevel} onSelect={setActiveLevel} />

          <main className="px-4 sm:px-8 mt-4 max-w-3xl mx-auto w-full">
            {filtersActive ? (
              exercises.length === 0 ? (
                <p className="text-[#9bd0a8] text-sm py-16 text-center">
                  Sem exercícios com estes filtros.
                </p>
              ) : (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#9bd0a8] mb-3">
                    {exercises.length} exercícios encontrados
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {exercises.map((ex) => (
                      <ExerciseCard key={ex.id} exercise={ex} onOpen={setOpenExercise} />
                    ))}
                  </div>
                </div>
              )
            ) : sections.length === 0 ? (
              <p className="text-[#9bd0a8] text-sm py-16 text-center">
                Sem exercícios para esta turma.
              </p>
            ) : (
              <div className="space-y-8">
                {sections.map(([content, items]) => (
                  <LibraryContentSection
                    key={content}
                    content={content}
                    exercises={items}
                    levels={levels}
                    onOpenExercise={setOpenExercise}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      <AddExerciseDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        contents={CONTENT_ORDER}
        levels={levels}
        onCreated={handleCreated}
      />

      <ExerciseDetailDialog
        exercise={openExercise}
        onClose={() => setOpenExercise(null)}
        levels={levels}
        onDuplicated={handleDuplicated}
      />
    </div>
  );
}