import React, { useMemo } from "react";
import ExerciseItem from "./ExerciseItem";

export default function ExerciseList({ exercises, selectedIds, onToggle }) {
  const grouped = useMemo(() => {
    const map = new Map();
    exercises.forEach((ex) => {
      const key = ex.category_id || "__none";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ex);
    });
    return map;
  }, [exercises]);

  if (exercises.length === 0) {
    return (
      <div className="text-[#9bd0a8] text-sm py-16 text-center">
        Sem exercícios para esta turma.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([key, items]) => (
        <div key={key}>
          {key !== "__none" && (
            <h2 className="text-[#2fe06b] text-xs font-semibold uppercase tracking-wider mb-2">
              {key}
            </h2>
          )}
          <div className="space-y-2">
            {items.map((ex) => (
              <ExerciseItem
                key={ex.id}
                exercise={ex}
                checked={selectedIds.has(ex.id)}
                onToggle={() => onToggle(ex.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}