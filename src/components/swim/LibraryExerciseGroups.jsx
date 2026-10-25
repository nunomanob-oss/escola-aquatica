import React, { useMemo } from "react";
import LibraryExerciseCard from "./LibraryExerciseCard";

export default function LibraryExerciseGroups({ exercises, onOpenExercise }) {
  const groups = useMemo(() => {
    const map = new Map();
    exercises.forEach((ex) => {
      const key = ex.subcategory || "__none";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ex);
    });
    return [...map.entries()].sort((a, b) => {
      if (a[0] === "__none") return 1;
      if (b[0] === "__none") return -1;
      return 0;
    });
  }, [exercises]);

  return (
    <div className="space-y-5">
      {groups.map(([key, items]) => (
        <div key={key}>
          {key !== "__none" && (
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9bd0a8] mb-2">
              {key}
            </h3>
          )}
          <div className="space-y-2">
            {items.map((ex) => (
              <LibraryExerciseCard key={ex.id} exercise={ex} onOpen={onOpenExercise} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}