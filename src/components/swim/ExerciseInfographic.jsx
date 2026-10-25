import React from "react";
import { Image } from "@/components/ui/image";

export default function ExerciseInfographic({ exercise }) {
  const url = exercise.image_diagram || null;

  return (
    <div className="rounded-xl bg-[#062b16] p-3">
      <div className="mb-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#2fe06b]">
          Demonstração
        </h4>
      </div>

      {url ? (
        <div className="rounded-lg overflow-hidden bg-white">
          <Image
            src={url}
            alt={exercise.title}
            fittingType="fit"
            className="w-full aspect-square"
          />
        </div>
      ) : (
        <p className="text-[11px] text-[#9bd0a8] leading-relaxed">
          Ainda não há imagem de demonstração para este exercício.
        </p>
      )}
    </div>
  );
}