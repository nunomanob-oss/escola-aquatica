import React, { useEffect, useMemo, useState } from "react";
import { entities } from "@/lib/entities";
import LevelTabs from "@/components/swim/LevelTabs";
import AppNav from "@/components/swim/AppNav";
import ContentItem from "@/components/swim/niveis/ContentItem";
import LessonSummaryPanel from "@/components/swim/niveis/LessonSummaryPanel";
import ExerciseDetailDialog from "@/components/swim/ExerciseDetailDialog";
import { CACHE_KEYS as SWIM_CACHE, fetchAll, loadWithCache } from "@/components/swim/offlineCache";
import { SEASON_MONTHS, contentStatus, monthName, seasonMonth } from "@/components/swim/niveis/calendar";

const CACHE_KEYS = { levels: "swim_cache_levels", contents: "swim_cache_level_contents" };
const selectionKey = (code) => `niveis_selection_${code}`;

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

const chip = (active) =>
  `px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
    active ? "bg-[#2fe06b] text-[#062b16]" : "bg-[#0d3f22] text-[#d8f0da] hover:bg-[#186a35]"
  }`;

export default function Niveis() {
  const [levels, setLevels] = useState([]);
  const [contents, setContents] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [openExercise, setOpenExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCode, setActiveCode] = useState(() => localStorage.getItem("niveis_active_level") || "A1");
  const [month, setMonth] = useState(() => seasonMonth());
  const [onlyMonth, setOnlyMonth] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [lvlRes, contentRes] = await Promise.all([
          entities.Level.list({ limit: 100 }),
          entities.LevelContent.list({ limit: 1000, sort: "order_index" }),
        ]);
        setLevels(lvlRes.items || []);
        setContents(contentRes.items || []);
        // Exercícios exemplo dos conteúdos (mesma cache da aba Conteúdos).
        setExercises(await loadWithCache(SWIM_CACHE.exercises, () => fetchAll(entities.Exercise, {}, "order_index")).catch(() => []));
        localStorage.setItem(CACHE_KEYS.levels, JSON.stringify(lvlRes.items || []));
        localStorage.setItem(CACHE_KEYS.contents, JSON.stringify(contentRes.items || []));
      } catch {
        setLevels(readJson(CACHE_KEYS.levels, []));
        setContents(readJson(CACHE_KEYS.contents, []));
        setExercises(readJson(SWIM_CACHE.exercises, []));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem("niveis_active_level", activeCode);
    setSelectedIds(new Set(readJson(selectionKey(activeCode), [])));
  }, [activeCode]);

  // Só os níveis com conteúdos programados aparecem nesta aba.
  const sortedLevels = useMemo(() => {
    const withContents = new Set(contents.map((c) => c.level_code));
    return levels
      .filter((l) => withContents.has(l.code))
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [levels, contents]);

  const levelContents = useMemo(
    () => contents.filter((c) => c.level_code === activeCode).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    [contents, activeCode]
  );

  const exercisesByCode = useMemo(
    () => Object.fromEntries(exercises.filter((e) => e.code).map((e) => [e.code, e])),
    [exercises]
  );

  const visible = onlyMonth ? levelContents.filter((c) => contentStatus(c, month) !== "off") : levelContents;

  // Agrupa por bloco/domínio mantendo a ordem do caderno pedagógico.
  const groups = useMemo(() => {
    const out = [];
    for (const c of visible) {
      const last = out[out.length - 1];
      if (last && last.block === c.block) last.items.push(c);
      else out.push({ block: c.block, items: [c] });
    }
    return out;
  }, [visible]);

  const persist = (next) => localStorage.setItem(selectionKey(activeCode), JSON.stringify([...next]));

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      persist(next);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    persist(new Set());
  };

  const selectedContents = levelContents.filter((c) => selectedIds.has(c.id));
  const selectedExercises = exercises.filter((e) => selectedIds.has(e.id));
  const activeLevel = sortedLevels.find((l) => l.code === activeCode);
  const inMonth = levelContents.filter((c) => contentStatus(c, month) !== "off").length;

  useEffect(() => {
    if (!loading && sortedLevels.length && !activeLevel) setActiveCode(sortedLevels[0].code);
  }, [loading, sortedLevels, activeLevel]);

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
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">Conteúdos por nível</h1>
        <p className="text-[#9bd0a8] text-sm mt-1">
          Escolhe o nível e o mês, marca os conteúdos da aula e copia o sumário
        </p>
      </header>

      <LevelTabs levels={sortedLevels} activeCode={activeCode} onSelect={setActiveCode} />

      <main className="px-4 sm:px-8 mt-4 max-w-3xl mx-auto w-full flex-1">
        {activeLevel && (
          <div className="mb-4 rounded-xl bg-[#0d3f22] p-4 text-sm">
            <p className="font-semibold text-white">{activeLevel.stage || activeLevel.name}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#9bd0a8]">
              {activeLevel.age_range && <span>Idade: {activeLevel.age_range}</span>}
              {activeLevel.duration_min && <span>· {activeLevel.duration_min} min</span>}
              {activeLevel.space && <span>· {activeLevel.space}</span>}
              {activeLevel.max_students && <span>· Máx. {activeLevel.max_students} alunos</span>}
            </div>
            {activeLevel.requirements && (
              <p className="mt-2 text-xs text-[#d8f0da]/80">Entrada: {activeLevel.requirements}</p>
            )}
          </div>
        )}

        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1.5 min-w-max pb-2">
            {SEASON_MONTHS.map((m) => (
              <button key={m} type="button" onClick={() => setMonth(m)} className={chip(m === month)}>
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[#9bd0a8]">
            {inMonth} de {levelContents.length} conteúdos calendarizados para {monthName(month)}
          </p>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => setOnlyMonth(true)} className={chip(onlyMonth)}>
              Deste mês
            </button>
            <button type="button" onClick={() => setOnlyMonth(false)} className={chip(!onlyMonth)}>
              Todos
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-[#9bd0a8] text-sm py-8 text-center">Sem conteúdos calendarizados para {monthName(month)}.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((group, i) => (
              <section key={`${group.block}-${i}`}>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#2fe06b] mb-2">
                  {group.block || "Outros"}
                </h2>
                <div className="space-y-2">
                  {group.items.map((c) => (
                    <ContentItem
                      key={c.id}
                      content={c}
                      month={month}
                      examples={(c.exercise_codes || []).map((code) => exercisesByCode[code]).filter(Boolean)}
                      levelCode={activeCode}
                      selectedIds={selectedIds}
                      onToggle={toggle}
                      onOpenExercise={setOpenExercise}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <LessonSummaryPanel
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
