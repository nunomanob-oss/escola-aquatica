import React, { useCallback, useEffect, useMemo, useState } from "react";
import { entities } from "@/lib/entities";
import AppNav from "@/components/swim/AppNav";
import PanelSection from "@/components/swim/painel/PanelSection";
import FeaturedTurma from "@/components/swim/painel/FeaturedTurma";
import TurmaRingGrid from "@/components/swim/painel/TurmaRingGrid";
import SummariesSection from "@/components/swim/painel/SummariesSection";
import SheetsSection from "@/components/swim/painel/SheetsSection";
import LibrarySection from "@/components/swim/painel/LibrarySection";
import SyncSection from "@/components/swim/painel/SyncSection";
import { longToday, programCoverage } from "@/components/swim/painel/painelMeta";
import { CACHE_KEYS, fetchAll, loadWithCache } from "@/components/swim/offlineCache";
import { SYNC_EVENT, applyPending, pendingCount } from "@/components/swim/offlineQueue";

const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif';

const listOf = (res) => (Array.isArray(res) ? res : res.items || []);

export default function Painel() {
  const [data, setData] = useState(null);
  const [activeCode, setActiveCode] = useState(() => localStorage.getItem("swim_active_level") || "A1");
  const [pending, setPending] = useState(pendingCount());
  const [online, setOnline] = useState(navigator.onLine);

  // Tudo com cache: o Painel abre sem rede com os últimos dados guardados.
  const load = useCallback(async () => {
    const safe = (p) => p.catch(() => []);
    const [levels, exercises, sheets, summaries] = await Promise.all([
      safe(loadWithCache(CACHE_KEYS.levels, async () => listOf(await entities.Level.list({ limit: 100 })))),
      safe(loadWithCache(CACHE_KEYS.exercises, () => fetchAll(entities.Exercise, {}, "order_index"))),
      safe(loadWithCache(CACHE_KEYS.sheets, () => fetchAll(entities.WorkoutSheet, {}, "-session_date"))),
      safe(loadWithCache(CACHE_KEYS.summaries, () => fetchAll(entities.ClassSummary, {}, "-date"))),
    ]);
    setData({
      levels: [...levels].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
      exercises,
      sheets: applyPending("WorkoutSheet", sheets),
      summaries: applyPending("ClassSummary", summaries),
    });
    setPending(pendingCount());
  }, []);

  useEffect(() => {
    load();
    const status = () => setOnline(navigator.onLine);
    window.addEventListener(SYNC_EVENT, load);
    window.addEventListener("online", status);
    window.addEventListener("offline", status);
    return () => {
      window.removeEventListener(SYNC_EVENT, load);
      window.removeEventListener("online", status);
      window.removeEventListener("offline", status);
    };
  }, [load]);

  const rings = useMemo(
    () =>
      (data?.levels || []).map((level) => ({
        level,
        coverage: programCoverage(data.exercises, data.summaries, level.code),
      })),
    [data]
  );
  const featured = rings.find((r) => r.level.code === activeCode) || rings[0];

  return (
    <div className="min-h-screen bg-black text-white pb-10" style={{ fontFamily: SYSTEM_FONT }}>
      <AppNav />

      <header className="px-4 sm:px-8 pt-6 pb-2 max-w-3xl mx-auto w-full">
        <h1 className="text-[34px] leading-tight font-bold tracking-[-0.02em]">Painel</h1>
        <p className="text-[15px] text-[#8E8E93]">{longToday()}</p>
      </header>

      {!data ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-[3px] border-[#2C2C2E] border-t-[#8E8E93] rounded-full animate-spin" />
        </div>
      ) : (
        <main className="px-4 sm:px-8 mt-4 max-w-3xl mx-auto w-full space-y-8">
          {featured && (
            <PanelSection title="Programa por turma">
              <FeaturedTurma
                level={featured.level}
                coverage={featured.coverage}
                onOpen={() => localStorage.setItem("swim_active_level", featured.level.code)}
              />
              <TurmaRingGrid items={rings} activeCode={featured.level.code} onSelect={setActiveCode} />
            </PanelSection>
          )}

          <div className="grid gap-8 sm:grid-cols-2">
            <SummariesSection summaries={data.summaries} />
            <SheetsSection sheets={data.sheets} />
            <LibrarySection exercises={data.exercises} />
            <SyncSection pending={pending} online={online} onSynced={load} />
          </div>
        </main>
      )}
    </div>
  );
}
