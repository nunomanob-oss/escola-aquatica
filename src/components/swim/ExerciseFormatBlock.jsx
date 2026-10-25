import React from "react";
import DetailBlock from "./DetailBlock";

// Formato da série: distância, repetições, descanso, duração e intensidade.
export default function ExerciseFormatBlock({ exercise }) {
  const items = [
    exercise.distance && ["Série", exercise.distance],
    exercise.distance_m > 0 && ["Total", `${exercise.distance_m} m`],
    exercise.rest_interval && ["Descanso", exercise.rest_interval],
    exercise.duration && ["Duração", exercise.duration],
    exercise.intensity && ["Intensidade", exercise.intensity],
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <DetailBlock title="Formato da Série">
      <div className="flex flex-wrap gap-2">
        {items.map(([label, value]) => (
          <span
            key={label}
            className="text-[11px] bg-[#0d3f22] px-2 py-1 rounded-full text-[#d8f0da]"
          >
            <span className="text-[#9bd0a8]">{label}: </span>
            {value}
          </span>
        ))}
      </div>
    </DetailBlock>
  );
}
