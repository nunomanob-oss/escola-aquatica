import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Check, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { saveRecord } from "./offlineQueue";

export default function SummaryPanel({ level, selectedExercises, onClear }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    const text = selectedExercises.map((e) => `- ${e.title}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!level || selectedExercises.length === 0) return;
    setSaving(true);
    try {
      // Sem rede, o sumário fica na fila do dispositivo e é enviado quando a ligação voltar.
      await saveRecord("ClassSummary", null, {
        date: new Date().toISOString().slice(0, 10),
        level_id: level.code,
        exercise_ids: selectedExercises.map((e) => e.id),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast({ title: "Não foi possível guardar o sumário.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-[#0d3f22]/95 backdrop-blur border-t border-white/10 px-4 sm:px-8 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-[#2fe06b] uppercase tracking-wide">
            Sumário da Aula {level ? `· ${level.code}` : ""}
          </h3>
          <span className="text-xs text-[#9bd0a8]">{selectedExercises.length} selecionado(s)</span>
        </div>

        <div className="max-h-28 overflow-y-auto mb-3 text-sm text-white/90 space-y-1">
          {selectedExercises.length === 0 ? (
            <p className="text-[#9bd0a8] text-sm">Nenhum exercício selecionado.</p>
          ) : (
            selectedExercises.map((e) => <p key={e.id}>• {e.title}</p>)
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCopy}
            disabled={selectedExercises.length === 0}
            className="flex-1 min-w-[140px] h-11 bg-[#2fe06b] text-[#062b16] hover:bg-[#6bffab] font-semibold"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar Sumário"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedExercises.length === 0 || saving}
            variant="outline"
            className="flex-1 min-w-[140px] h-11 border-[#2fe06b]/40 text-[#2fe06b] hover:bg-[#2fe06b]/10"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? "Guardado!" : saving ? "A guardar..." : "Guardar Sumário"}
          </Button>
          <Button
            onClick={onClear}
            disabled={selectedExercises.length === 0}
            variant="ghost"
            className="flex-1 min-w-[140px] h-11 text-[#9bd0a8] hover:text-white hover:bg-white/5"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar Seleção
          </Button>
        </div>
      </div>
    </div>
  );
}