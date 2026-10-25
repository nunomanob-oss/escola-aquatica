import React, { useMemo } from "react";
import LibraryLevelGroup from "./LibraryLevelGroup";

function cleanLevelName(name, code) {
  if (!name) return "";
  if (!name.startsWith(code)) return name;
  return name
    .slice(code.length)
    .replace(/^[\s(]+/, "")
    .replace(/\)+$/, "")
    .trim();
}

export default function LibraryLevelAccordion({ exercises, levels, onOpenExercise }) {
  const groups = useMemo(() => {
    const order = Object.fromEntries(levels.map((l) => [l.code, l.order_index || 0]));
    const names = Object.fromEntries(levels.map((l) => [l.code, l.name || ""]));
    const map = new Map();
    exercises.forEach((ex) => {
      const code = ex.level_id || "—";
      if (!map.has(code)) map.set(code, []);
      map.get(code).push(ex);
    });
    return [...map.entries()]
      .map(([code, items]) => ({
        code,
        name: cleanLevelName(names[code], code),
        items: [...items].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
      }))
      .sort((a, b) => (order[a.code] ?? 99) - (order[b.code] ?? 99));
  }, [exercises, levels]);

  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <LibraryLevelGroup
          key={group.code}
          code={group.code}
          name={group.name}
          exercises={group.items}
          onOpenExercise={onOpenExercise}
        />
      ))}
    </div>
  );
}