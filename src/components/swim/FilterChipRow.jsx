import React from "react";

export default function FilterChipRow({ items, activeValue, onSelect }) {
  return (
    <div className="px-4 sm:px-8 overflow-x-auto">
      <div className="flex gap-2 min-w-max pb-2">
        {items.map((item) => {
          const isActive = item.value === activeValue;
          return (
            <button
              key={item.value}
              onClick={() => onSelect(item.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-[#2fe06b] text-[#062b16]"
                  : "bg-[#0d3f22] text-[#d8f0da] hover:bg-[#186a35]"
              }`}
            >
              {item.label}
              {typeof item.count === "number" && (
                <span className={`ml-2 text-[11px] ${isActive ? "text-[#062b16]/70" : "text-[#9bd0a8]"}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}