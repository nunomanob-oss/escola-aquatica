import React from "react";
import { Play } from "lucide-react";
import { Image } from "@/components/ui/image";

const PERIOD_STYLES = {
  SEPT_JAN: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  FEB_JUL: "bg-[#2fe06b]/15 text-[#2fe06b] border-[#2fe06b]/30",
  FULL_YEAR: "bg-violet-400/15 text-violet-300 border-violet-400/30",
  FIRST_WEEK_ONLY: "bg-rose-400/15 text-rose-300 border-rose-400/30",
};

export default function LibraryExerciseCard({ exercise, onOpen }) {
  const isExample = Boolean(exercise.is_example);

  return (
    <button
      type="button"
      onClick={() => onOpen?.(exercise)}
      className={`w-full text-left p-4 rounded-xl border transition-colors ${
        isExample
          ? "bg-[#0d3f22]/60 border-dashed border-[#2fe06b]/35"
          : "bg-[#0d3f22] border-transparent hover:border-[#186a35]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {isExample ? (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#2fe06b]/20 text-[#2fe06b]">
            Exemplo
          </span>
        ) : (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#d8f0da]">
            {exercise.level_id}
          </span>
        )}
        {exercise.period_label && (
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border ${
              PERIOD_STYLES[exercise.period_type] || "bg-white/10 text-white/70 border-white/20"
            }`}
          >
            {exercise.period_label}
          </span>
        )}
      </div>

      {exercise.image_diagram && (
        <div className="relative mb-2 rounded-lg overflow-hidden bg-black/20">
          <Image
            src={exercise.image_diagram}
            alt={exercise.title}
            className="w-full aspect-[3/2]"
          />
          {exercise.video_url && (
            <span className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-[#2fe06b]">
              <Play className="w-3 h-3" />
              Vídeo
            </span>
          )}
        </div>
      )}

      <p className="text-sm sm:text-base text-white leading-snug">{exercise.title}</p>
    </button>
  );
}