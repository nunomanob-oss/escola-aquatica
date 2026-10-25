import React from "react";

export default function LevelTabs({ levels, activeCode, onSelect }) {
  return (
    <div className="px-4 sm:px-8 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {levels.map((level) => {
          const isActive = level.code === activeCode;
          return (
            <button
              key={level.code}
              onClick={() => onSelect(level.code)}
              className={`px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-[#2fe06b] text-[#062b16] shadow-lg shadow-[#2fe06b]/30"
                  : "bg-[#0d3f22] text-[#d8f0da] hover:bg-[#186a35]"
              }`}
            >
              {level.code}
            </button>
          );
        })}
      </div>
    </div>
  );
}