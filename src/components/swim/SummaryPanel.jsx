import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Check, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { saveRecord } from "./offlineQueue";

export default function SummaryPanel({ level, selectedContents = [], selectedExercises, onClear }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = selectedContents.length + selectedExercises.length;

  const handleCopy = async () => {
    const lines = (title, items) => (items.length ? [title, ...items.map((item) => `- ${item.title}`)] : []);
    const text = selectedContents.length
      ? [...lines("Conteúdos:", selectedContents), ...lines("Exercícios:", selectedExercises)].join("\n")
      : selectedExercises.map((e) => `- ${e.title}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!level || total === 0) return;
    setSaving(true);
    try {
      // Sem rede, o sumário fica na fila do dispositivo e é enviado quando a ligação voltar.
      await saveRecord("ClassSummary", null, {
        date: new Date().toISOString().slice(0, 10),
        level_id: level.code,
        exercise_ids: selectedExercises.map((e) => e.id),
        content_ids: selectedContents.map((c) => c.id),
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
          <span className="text-xs text-[#9bd0a8]">{total} selecionado(s)</span>
        </div>

        <div className="max-h-28 overflow-y-auto mb-3 text-sm text-white/90 space-y-1">
          {total === 0 ? (
            <p className="text-[#9bd0a8] text-sm">Nenhum conteúdo ou exercício selecionado.</p>
          ) : (
            <>
              {selectedContents.map((c) => (
                <p key={c.id}>• {c.title}</p>
              ))}
              {selectedExercises.map((e) => (
                <p key={e.id} className={selectedContents.length ? "text-[#9bd0a8]" : undefined}>
                  {selectedContents.length ? "↳ " : "• "}
                  {e.title}
                </p>
              ))}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleCopy}
            disabled={total === 0}
            className="flex-1 min-w-[140px] h-11 bg-[#2fe06b] text-[#062b16] hover:bg-[#6bffab] font-semibold"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar Sumário"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={total === 0 || saving}
            variant="outline"
            className="flex-1 min-w-[140px] h-11 border-[#2fe06b]/40 text-[#2fe06b] hover:bg-[#2fe06b]/10"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? "Guardado!" : saving ? "A guardar..." : "Guardar Sumário"}
          </Button>
          <Button
            onClick={onClear}
            disabled={total === 0}
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