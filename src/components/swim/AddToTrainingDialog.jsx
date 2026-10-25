import React, { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { appendToSummary } from "./offlineQueue";

const fieldStyles = "bg-[#062b16] border-[#186a35] text-white placeholder:text-[#9bd0a8]";
const menuStyles = "bg-[#0d3f22] border-[#186a35] text-white";

export default function AddToTrainingDialog({ exercise, open, onOpenChange, levels }) {
  const [levelCode, setLevelCode] = useState(exercise.level_id || levels[0]?.code || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!levelCode || !date) return;
    setSaving(true);

    // Junta ao sumário da turma nesse dia; sem rede, fica na fila do dispositivo.
    try {
      await appendToSummary({ date, level_id: levelCode, exercise_id: exercise.id });
    } catch {
      setSaving(false);
      toast({ title: "Não foi possível adicionar ao treino.", variant: "destructive" });
      return;
    }

    setSaving(false);
    setSaved(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d3f22] border-[#186a35] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Adicionar ao treino</DialogTitle>
          <DialogDescription className="text-[#9bd0a8]">
            {exercise.title}
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="space-y-3">
            <p className="text-sm text-[#d8f0da]">
              Exercício adicionado ao treino da turma <strong>{levelCode}</strong> em {date}.
            </p>
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
            >
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[#d8f0da]">Turma</Label>
              <Select value={levelCode} onValueChange={setLevelCode}>
                <SelectTrigger className={fieldStyles}>
                  <SelectValue placeholder="Escolhe a turma" />
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
                onChange={(e) => setDate(e.target.value)}
                className={fieldStyles}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!levelCode || !date || saving}
              className="w-full bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
            >
              {saving ? "A adicionar…" : "Adicionar ao treino"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}