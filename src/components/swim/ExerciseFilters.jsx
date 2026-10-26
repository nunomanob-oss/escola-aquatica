import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ATHLETE_LEVEL_OPTIONS,
  CATEGORY_OPTIONS,
  EQUIPMENT_OPTIONS,
  STYLE_OPTIONS,
} from "./exerciseMeta";
import { SOURCE_OPTIONS, hasActiveFilters } from "./libraryQuery";

const ALL = "__all";
const fieldStyles = "bg-[#062b16] border-[#186a35] text-white placeholder:text-[#9bd0a8]";
const menuStyles = "bg-[#0d3f22] border-[#186a35] text-white";

function FilterSelect({ value, onChange, placeholder, options }) {
  // Sem `items`, o Select mostra o valor interno ("__all") em vez do rótulo.
  const items = [{ value: ALL, label: placeholder }, ...options.map((option) => ({ value: option, label: option }))];
  return (
    <Select items={items} value={value || ALL} onValueChange={(next) => onChange(next === ALL ? "" : next)}>
      <SelectTrigger className={fieldStyles}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={menuStyles}>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ExerciseFilters({ filters, onChange, onClear }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });

  return (
    <div className="px-4 sm:px-8 mt-4 max-w-3xl mx-auto w-full">
      <div className="rounded-2xl bg-[#0d3f22]/70 border border-[#186a35] p-3 space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#9bd0a8] absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={filters.q}
            onChange={(e) => set("q")(e.target.value)}
            placeholder="Pesquisar por palavra-chave, tag ou código…"
            className={`${fieldStyles} pl-9`}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <FilterSelect
            value={filters.source}
            onChange={set("source")}
            placeholder="Origem"
            options={SOURCE_OPTIONS}
          />
          <FilterSelect
            value={filters.style}
            onChange={set("style")}
            placeholder="Estilo"
            options={STYLE_OPTIONS}
          />
          <FilterSelect
            value={filters.category}
            onChange={set("category")}
            placeholder="Categoria"
            options={CATEGORY_OPTIONS}
          />
          <FilterSelect
            value={filters.equipment}
            onChange={set("equipment")}
            placeholder="Equipamento"
            options={EQUIPMENT_OPTIONS}
          />
          <FilterSelect
            value={filters.level}
            onChange={set("level")}
            placeholder="Nível do atleta"
            options={ATHLETE_LEVEL_OPTIONS}
          />
        </div>

        {hasActiveFilters(filters) && (
          <Button
            variant="ghost"
            onClick={onClear}
            className="w-full sm:w-auto text-[#9bd0a8] hover:bg-[#186a35] hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}