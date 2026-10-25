import React from "react";
import { Link } from "@tanstack/react-router";

// Secção agrupada ao estilo iOS: título, ação opcional e cartão.
export default function PanelSection({ title, actionLabel, actionTo, children, className = "" }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <div className="flex items-baseline justify-between px-1 mb-2">
        <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-white">{title}</h2>
        {actionLabel && (
          <Link
            to={actionTo}
            className="text-[15px] text-[#0A84FF] rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] active:opacity-60"
          >
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="rounded-[12px] bg-[#1C1C1E] overflow-hidden">{children}</div>
    </section>
  );
}
