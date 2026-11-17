import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, ClipboardList, Layers, LayoutGrid, ListChecks, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";

const base = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors";
const active = `${base} bg-[#2fe06b] text-[#062b16]`;
const inactive = `${base} bg-[#0d3f22] text-[#d8f0da] hover:bg-[#186a35]`;
const logoutBtn = `${base} bg-[#0d3f22] text-[#9bd0a8] hover:bg-[#186a35] hover:text-[#d8f0da] disabled:opacity-60`;

export default function AppNav() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await signOut().catch(() => undefined);
    await navigate({ to: "/login" });
  };

  return (
    <nav className="flex flex-wrap items-center gap-2 px-4 sm:px-8 pt-6">
      <Link to="/" activeOptions={{ exact: true }} className={inactive} activeProps={{ className: active }}>
        <ListChecks className="w-4 h-4" />
        Conteúdos
      </Link>
      <Link to="/niveis" className={inactive} activeProps={{ className: active }}>
        <Layers className="w-4 h-4" />
        Níveis
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
      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className={`${logoutBtn} ml-auto`}
        aria-label="Terminar sessão"
      >
        <LogOut className="w-4 h-4" />
        {loggingOut ? "A sair…" : "Sair"}
      </button>
    </nav>
  );
}
