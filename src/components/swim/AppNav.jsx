import React from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, ClipboardList, LayoutGrid, ListChecks } from "lucide-react";

const base = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors";
const active = `${base} bg-[#2fe06b] text-[#062b16]`;
const inactive = `${base} bg-[#0d3f22] text-[#d8f0da] hover:bg-[#186a35]`;

export default function AppNav() {
  return (
    <nav className="flex flex-wrap gap-2 px-4 sm:px-8 pt-6">
      <Link to="/" activeOptions={{ exact: true }} className={inactive} activeProps={{ className: active }}>
        <ListChecks className="w-4 h-4" />
        Conteúdos
      </Link>
      <Link to="/biblioteca" className={inactive} activeProps={{ className: active }}>
        <BookOpen className="w-4 h-4" />
        Biblioteca
      </Link>
      <Link to="/aulas" className={inactive} activeProps={{ className: active }}>
        <ClipboardList className="w-4 h-4" />
        Aulas
      </Link>
      <Link to="/painel" className={inactive} activeProps={{ className: active }}>
        <LayoutGrid className="w-4 h-4" />
        Painel
      </Link>
    </nav>
  );
}
