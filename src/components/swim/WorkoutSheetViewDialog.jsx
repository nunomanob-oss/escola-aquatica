import React from "react";
import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WorkoutSheetPrint from "./WorkoutSheetPrint";

export default function WorkoutSheetViewDialog({ sheet, onClose, onPrint }) {
  if (!sheet) return null;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[88vh] overflow-y-auto bg-[#0d3f22] border-[#186a35] text-white sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-left text-white">Ficha de treino</DialogTitle>
          <DialogDescription className="text-left text-[#9bd0a8]">
            Pré-visualização da ficha como sai no papel.
          </DialogDescription>
        </DialogHeader>

        <WorkoutSheetPrint sheet={sheet} />

        <Button
          onClick={onPrint}
          className="w-full bg-[#2fe06b] text-[#062b16] hover:bg-[#2fe06b]/90 font-semibold"
        >
          <Printer className="w-4 h-4 mr-1" />
          Imprimir ficha
        </Button>
      </DialogContent>
    </Dialog>
  );
}