import React from "react";
import DetailBlock from "./DetailBlock";

// Lista simples (passo a passo numerado ou variações com bullets).
export default function ExerciseListBlock({ title, items, numbered = false }) {
  if (!items || items.length === 0) return null;

  return (
    <DetailBlock title={title}>
      <ul className="space-y-1">
        {items.map((item, index) => (
          <li key={`${index}-${item}`} className="flex gap-2 text-sm text-[#d8f0da] leading-relaxed">
            <span className="text-[#2fe06b] font-semibold">{numbered ? `${index + 1}.` : "•"}</span>
            {item}
          </li>
        ))}
      </ul>
    </DetailBlock>
  );
}
