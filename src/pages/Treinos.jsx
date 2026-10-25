import React, { useCallback, useEffect, useMemo, useState } from "react";
import { entities } from "@/lib/entities";
import { Plus } from "lucide-react";
import AppNav from "@/components/swim/AppNav";
import FilterChipRow from "@/components/swim/FilterChipRow";
import WorkoutSheetCard from "@/components/swim/WorkoutSheetCard";
import WorkoutSheetForm from "@/components/swim/WorkoutSheetForm";
import WorkoutSheetPrint from "@/components/swim/WorkoutSheetPrint";
import WorkoutSheetViewDialog from "@/components/swim/WorkoutSheetViewDialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { CACHE_KEYS, fetchAll, loadWithCache } from "@/components/swim/offlineCache";
import { SYNC_EVENT, applyPending, removeRecord } from "@/components/swim/offlineQueue";

const byDateDesc = (a, b) => (b.session_date || "").localeCompare(a.session_date || "");

export default function Treinos() {
  const [levels, setLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState("all");
  const [allSheets, setAllSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [printing, setPrinting] = useState(null);

  const loadLevels = useCallback(async () => {
    const lvls = await loadWithCache(CACHE_KEYS.levels, async () => {
      const res = await entities.Level.list({ limit: 100 });
      return Array.isArray(res) ? res : res.items || [];
    }).catch(() => []);
    setLevels([...lvls].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)));
  }, []);

  // Todas as fichas (rede ou cache), já com as alterações feitas sem rede e ainda por enviar.
  const loadSheets = useCallback(async () => {
    const list = await loadWithCache(CACHE_KEYS.sheets, () =>
      fetchAll(entities.WorkoutSheet, {}, "-session_date")
    ).catch(() => []);
    setAllSheets(applyPending("WorkoutSheet", list).sort(byDateDesc));
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadLevels(), loadSheets()]);
  }, [loadLevels, loadSheets]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    window.addEventListener(SYNC_EVENT, loadSheets);
    return () => window.removeEventListener(SYNC_EVENT, loadSheets);
  }, [loadSheets]);

  // No telemóvel window.print() não bloqueia: a ficha só sai da página depois de impressa.
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(null);
    window.addEventListener("afterprint", done);
    const timer = setTimeout(() => window.print(), 100);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const handleDelete = async (sheet) => {
    if (!window.confirm(`Apagar a ficha "${sheet.title}"?`)) return;
    try {
      await removeRecord("WorkoutSheet", sheet.id);
    } catch {
      toast({ title: "Não foi possível apagar a ficha.", variant: "destructive" });
    }
    await loadSheets();
  };

  const sheets = useMemo(
    () =>
      activeLevel === "all" ? allSheets : allSheets.filter((s) => s.level_id === activeLevel),
    [allSheets, activeLevel]
  );

  const levelItems = [
    { value: "all", label: "Todas", count: allSheets.length },
    ...levels.map((level) => ({
      value: level.code,
      label: level.code,
      count: allSheets.filter((s) => s.level_id === level.code).length || undefined,
    })),
  ];

  return (
    <div className="min-h-screen bg-[#062b16] text-white pb-10">
      <AppNav />

      <header className="px-4 sm:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              Fichas de Treino
            </h1>
            <p className="text-[#9bd0a8] text-sm mt-1 max-w-xl">
              Monta a sessão de cada turma por blocos — aquecimento, técnica, série principal e
              retorno à calma — e imprime a ficha para levar para a borda da piscina
            </p>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="w-full sm:w-auto bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova ficha
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#0d3f22] border-t-[#2fe06b] rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <FilterChipRow items={levelItems} activeValue={activeLevel} onSelect={setActiveLevel} />

          <main className="px-4 sm:px-8 mt-4 max-w-3xl mx-auto w-full">
            {sheets.length === 0 ? (
              <p className="text-[#9bd0a8] text-sm py-16 text-center">
                Ainda não há fichas para esta turma. Cria a primeira com o botão "Nova ficha".
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sheets.map((sheet) => (
                  <WorkoutSheetCard
                    key={sheet.id}
                    sheet={sheet}
                    onOpen={() => setViewing(sheet)}
                    onEdit={() => {
                      setEditing(sheet);
                      setFormOpen(true);
                    }}
                    onDelete={() => handleDelete(sheet)}
                  />
                ))}
              </div>
            )}
          </main>
        </>
      )}

      <WorkoutSheetForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        levels={levels}
        sheet={editing}
        onSaved={refresh}
      />

      <WorkoutSheetViewDialog
        sheet={viewing}
        onClose={() => setViewing(null)}
        onPrint={() => {
          setPrinting(viewing);
          setViewing(null);
        }}
      />

      {printing && (
        <div className="hidden print:block">
          <WorkoutSheetPrint sheet={printing} />
        </div>
      )}
    </div>
  );
}