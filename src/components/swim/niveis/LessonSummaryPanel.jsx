import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Check, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { saveRecord } from "../offlineQueue";

const formatDate = (iso) => (iso ? iso.split("-").reverse().join("/") : "");

// Texto do sumário: cabeçalho com nível e data, conteúdos agrupados por bloco, exercícios e observações.
export function buildSummaryText({ level, date, contents, exercises = [], notes }) {
  const lines = [`Sumário · ${level?.code ?? ""} · ${formatDate(date)}`];
  let block = null;
  for (const c of contents) {
    if (c.block !== block) {
      block = c.block;
      lines.push("", block || "Outros");
    }
    lines.push(`- ${c.title}`);
  }
  if (exercises.length) lines.push("", "Exercícios", ...exercises.map((e) => `- ${e.title}`));
  if (notes?.trim()) lines.push("", `Observações: ${notes.trim()}`);
  return lines.join("\n");
}

// A API de clipboard só existe em contexto seguro (https/localhost); no tablet via http da rede local
// ou quando é recusada, copia através de uma textarea temporária.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (!ok) throw new Error("copy failed");
  }
}

export default function LessonSummaryPanel({ level, selectedContents, selectedExercises = [], onClear }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = selectedContents.length + selectedExercises.length;
  const empty = total === 0;
  const text = useMemo(
    () => buildSummaryText({ level, date, contents: selectedContents, exercises: selectedExercises, notes }),
    [level, date, selectedContents, selectedExercises, notes]
  );

  const handleCopy = async () => {
    try {
      await copyText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar o sumário.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!level || empty) return;
    setSaving(true);
    try {
      // Sem rede, o sumário fica na fila do dispositivo e é enviado quando a ligação voltar.
      await saveRecord("ClassSummary", null, {
        date,
        level_id: level.code,
        content_ids: selectedContents.map((c) => c.id),
        exercise_ids: selectedExercises.map((e) => e.id),
        notes: text,
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
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-[#2fe06b] uppercase tracking-wide">
            Sumário da Aula {level ? `· ${level.code}` : ""}
          </h3>
          <span className="text-xs text-[#9bd0a8]">{selectedContents.length} conteúdo(s)
            {selectedExercises.length > 0 && ` · ${selectedExercises.length} exercício(s)`}
          </span>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Data da aula"
            className="h-10 w-[9.5rem] shrink-0 rounded-lg bg-[#062b16] border border-white/10 px-2 text-sm text-white [color-scheme:dark]"
          />
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações (opcional)"
            className="h-10 flex-1 min-w-0 rounded-lg bg-[#062b16] border border-white/10 px-3 text-sm text-white placeholder:text-[#9bd0a8]/70"
          />
        </div>

        {empty ? (
          <p className="text-[#9bd0a8] text-sm mb-3">Marca os conteúdos (e os exercícios exemplo) que vais dar nesta aula.</p>
        ) : (
          <pre className="max-h-20 sm:max-h-32 overflow-y-auto mb-3 whitespace-pre-wrap font-sans text-sm text-white/90 bg-[#062b16]/60 rounded-lg p-3">
            {text}
          </pre>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            disabled={empty}
            className="flex-1 min-w-0 h-11 bg-[#2fe06b] text-[#062b16] hover:bg-[#6bffab] font-semibold"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={empty || saving}
            variant="outline"
            className="flex-1 min-w-0 h-11 border-[#2fe06b]/40 text-[#2fe06b] hover:bg-[#2fe06b]/10"
          >
            <Save className="w-4 h-4 mr-2" />
            {saved ? "Guardado!" : saving ? "A guardar..." : "Guardar"}
          </Button>
          <Button
            onClick={onClear}
            disabled={empty}
            variant="ghost"
            aria-label="Limpar Seleção"
            className="shrink-0 sm:flex-1 h-11 text-[#9bd0a8] hover:text-white hover:bg-white/5"
          >
            <Trash2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Limpar Seleção</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
