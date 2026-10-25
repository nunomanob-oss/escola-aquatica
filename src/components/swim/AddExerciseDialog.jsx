import React, { useEffect, useState } from "react";
import { entities } from "@/lib/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const ALL_LEVEL = "ALL";
const NEW_SUB = "__new";

const PERIODS = [
  { value: "SEPT_JAN", label: "Dar de setembro a janeiro" },
  { value: "FEB_JUL", label: "Dar de fevereiro a julho" },
  { value: "FULL_YEAR", label: "Dar de setembro a julho" },
  { value: "FIRST_WEEK_ONLY", label: "Só na 1.ª semana (até 15 de setembro)" },
];

const fieldStyles = "bg-[#062b16] border-[#186a35] text-white placeholder:text-[#9bd0a8]";
const menuStyles = "bg-[#0d3f22] border-[#186a35] text-white";

export default function AddExerciseDialog({ open, onOpenChange, contents, levels, onCreated }) {
  const [levelId, setLevelId] = useState(ALL_LEVEL);
  const [content, setContent] = useState(contents[0] || "");
  const [subcategories, setSubcategories] = useState([]);
  const [subcategory, setSubcategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [title, setTitle] = useState("");
  const [periodType, setPeriodType] = useState("FULL_YEAR");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLevelId(ALL_LEVEL);
    setContent(contents[0] || "");
    setSubcategory("");
    setNewSubcategory("");
    setTitle("");
    setPeriodType("FULL_YEAR");
  }, [open, contents]);

  useEffect(() => {
    if (!open || !content) return;
    let cancelled = false;
    entities.Exercise.filter({ content }, { distinct: "subcategory", limit: 100 }).then((res) => {
      if (cancelled) return;
      const list = Array.isArray(res) ? res : res.items || [];
      setSubcategories(list.filter(Boolean).sort());
    });
    return () => {
      cancelled = true;
    };
  }, [open, content]);

  const canSave = Boolean(title.trim() && content);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const period = PERIODS.find((p) => p.value === periodType);
    const exercise = await entities.Exercise.create({
      level_id: levelId,
      content,
      subcategory: (subcategory === NEW_SUB ? newSubcategory.trim() : subcategory) || undefined,
      title: title.trim(),
      period_type: periodType,
      period_label: period ? period.label : undefined,
      is_example: levelId === ALL_LEVEL,
      is_custom: true,
    });
    setSaving(false);
    onOpenChange(false);
    onCreated(exercise);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto bg-[#0d3f22] border-[#186a35] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar exercício</DialogTitle>
          <DialogDescription className="text-[#9bd0a8]">
            Escolhe a turma e o conteúdo para o exercício ficar na tua biblioteca.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Turma</Label>
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger className={fieldStyles}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={menuStyles}>
                <SelectItem value={ALL_LEVEL}>Todas as turmas (exemplo)</SelectItem>
                {levels.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.code}
                    {l.name ? ` · ${l.name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Conteúdo</Label>
            <Select
              value={content}
              onValueChange={(value) => {
                setContent(value);
                setSubcategory("");
                setNewSubcategory("");
              }}
            >
              <SelectTrigger className={fieldStyles}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={menuStyles}>
                {contents.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Subcategoria</Label>
            <Select value={subcategory} onValueChange={setSubcategory}>
              <SelectTrigger className={fieldStyles}>
                <SelectValue placeholder="Sem subcategoria" />
              </SelectTrigger>
              <SelectContent className={menuStyles}>
                {subcategories.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
                <SelectItem value={NEW_SUB}>Nova subcategoria…</SelectItem>
              </SelectContent>
            </Select>
            {subcategory === NEW_SUB && (
              <Input
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="Nome da subcategoria"
                className={fieldStyles}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Exercício</Label>
            <Textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              placeholder="Ex: Pernada de crol com prancha, 4x25m"
              className={fieldStyles}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#d8f0da]">Época</Label>
            <Select value={periodType} onValueChange={setPeriodType}>
              <SelectTrigger className={fieldStyles}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={menuStyles}>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 text-[#d8f0da] hover:bg-[#186a35] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!canSave || saving}
              className="flex-1 bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
            >
              {saving ? "A guardar…" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}