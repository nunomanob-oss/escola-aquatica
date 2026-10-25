import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { SECTION_TEMPLATES } from "./workoutMeta";
import { saveRecord } from "./offlineQueue";

const fieldStyles = "bg-[#062b16] border-[#186a35] text-white placeholder:text-[#9bd0a8]";
const menuStyles = "bg-[#0d3f22] border-[#186a35] text-white";

function buildSections(sheet) {
  return SECTION_TEMPLATES.map((template) => {
    const found = (sheet?.sections || []).find((section) => section.title === template.title);
    return {
      title: template.title,
      rest: found?.rest || template.rest,
      lines: (found?.items || []).join("\n"),
    };
  });
}

export default function WorkoutSheetForm({ open, onOpenChange, levels, sheet, onSaved }) {
  const [title, setTitle] = useState("");
  const [levelCode, setLevelCode] = useState("");
  const [date, setDate] = useState("");
  const [focus, setFocus] = useState("");
  const [sections, setSections] = useState(buildSections(null));
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(sheet?.title || "");
    setLevelCode(sheet?.level_id || levels[0]?.code || "");
    setDate(sheet?.session_date || new Date().toISOString().slice(0, 10));
    setFocus(sheet?.focus || "");
    setTotal(sheet?.total_distance != null ? String(sheet.total_distance) : "");
    setNotes(sheet?.notes || "");
    setSections(buildSections(sheet));
  }, [open, sheet, levels]);

  const patchSection = (index, patch) =>
    setSections((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const handleSave = async () => {
    if (!title.trim() || !levelCode) return;
    setSaving(true);

    const payload = {
      title: title.trim(),
      level_id: levelCode,
      session_date: date,
      focus: focus.trim(),
      notes: notes.trim(),
      total_distance: total === "" ? null : Number(total),
      sections: sections
        .map((section) => ({
          title: section.title,
          rest: section.rest.trim(),
          items: section.lines
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }))
        .filter((section) => section.items.length > 0),
    };

    // Sem rede, a ficha fica guardada no dispositivo e é enviada quando a ligação voltar.
    try {
      await saveRecord("WorkoutSheet", sheet?.id || null, payload);
    } catch {
      setSaving(false);
      toast({ title: "Não foi possível guardar a ficha.", variant: "destructive" });
      return;
    }

    setSaving(false);
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto bg-[#0d3f22] border-[#186a35] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">
            {sheet ? "Editar ficha de treino" : "Nova ficha de treino"}
          </DialogTitle>
          <DialogDescription className="text-[#9bd0a8]">
            Aquecimento, técnica, série principal e retorno à calma, com distâncias e descansos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Título</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Técnica de crol — 1.ª sessão"
              className={fieldStyles}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#d8f0da]">Turma</Label>
              <Select value={levelCode} onValueChange={setLevelCode}>
                <SelectTrigger className={fieldStyles}>
                  <SelectValue placeholder="Turma" />
                </SelectTrigger>
                <SelectContent className={menuStyles}>
                  {levels.map((level) => (
                    <SelectItem key={level.code} value={level.code}>
                      {level.code}
                      {level.name ? ` · ${level.name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#d8f0da]">Data</Label>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={fieldStyles}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Frase de foco</Label>
            <Input
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="Ex: Dominar o deslize • Respirar de lado"
              className={fieldStyles}
            />
          </div>

          {sections.map((section, index) => (
            <div key={section.title} className="rounded-xl bg-[#062b16] p-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#2fe06b]">
                  {section.title}
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#9bd0a8]">Descanso</span>
                  <Input
                    value={section.rest}
                    onChange={(event) => patchSection(index, { rest: event.target.value })}
                    placeholder="1:30"
                    className={`${fieldStyles} h-7 w-16 text-xs`}
                  />
                </div>
              </div>
              <Textarea
                value={section.lines}
                onChange={(event) => patchSection(index, { lines: event.target.value })}
                rows={3}
                placeholder={"Uma série por linha, ex:\n4 x 50 m — Deslize dos dedos"}
                className={`${fieldStyles} text-sm`}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[#d8f0da]">Total (metros)</Label>
              <Input
                type="number"
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                placeholder="1800"
                className={fieldStyles}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#d8f0da]">Notas</Label>
              <Input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Material, grupos…"
                className={fieldStyles}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={!title.trim() || !levelCode || saving}
            className="w-full bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
          >
            {saving ? "A guardar…" : sheet ? "Guardar alterações" : "Criar ficha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}