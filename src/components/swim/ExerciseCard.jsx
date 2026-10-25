import React from "react";
import { Minus, Play } from "lucide-react";
import { Image } from "@/components/ui/image";
import { EQUIPMENT_ICONS } from "./exerciseMeta";

function DifficultyDots({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`w-1.5 h-1.5 rounded-full ${n <= rating ? "bg-[#2fe06b]" : "bg-white/20"}`}
        />
      ))}
    </div>
  );
}

export default function ExerciseCard({ exercise, onOpen }) {
  const styles = exercise.style || [];
  const athleteLevels = exercise.level || [];
  const equipment = exercise.equipment_required || [];
  const rating = Number(exercise.difficulty_rating) || 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(exercise)}
      className="w-full text-left rounded-xl bg-[#0d3f22] border border-transparent hover:border-[#2fe06b]/60 p-3 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {styles.map((style) => (
          <span
            key={style}
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2fe06b]/20 text-[#2fe06b]"
          >
            {style}
          </span>
        ))}
        {exercise.is_custom && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300">
            Personalizado
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

      <p className="text-sm font-semibold text-white leading-snug">{exercise.title}</p>

      {exercise.category && (
        <p className="text-[11px] text-[#9bd0a8] mt-1">{exercise.category}</p>
      )}
      {exercise.code && <p className="text-[10px] font-mono text-[#9bd0a8] mt-1">{exercise.code}</p>}

      {athleteLevels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {athleteLevels.map((level) => (
            <span
              key={level}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#d8f0da]"
            >
              {level}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex items-center gap-1.5">
          {equipment.map((item) => {
            const Icon = EQUIPMENT_ICONS[item] || Minus;
            return <Icon key={item} className="w-3.5 h-3.5 text-[#9bd0a8]" />;
          })}
        </div>
        {rating > 0 && <DifficultyDots rating={rating} />}
      </div>
    </button>
  );
}