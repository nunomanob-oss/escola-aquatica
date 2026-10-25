import React from "react";

export default function DetailBlock({ title, children }) {
  return (
    <div className="rounded-xl bg-[#062b16] p-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#2fe06b] mb-2">
        {title}
      </h4>
      {children}
    </div>
  );
}
