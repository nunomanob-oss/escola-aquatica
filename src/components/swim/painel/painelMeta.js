// Cálculos do Painel: cobertura do programa por turma, datas relativas e cores por etapa.

// Cor do sistema (modo escuro do iOS) por etapa de aprendizagem.
const STAGE_COLOR = { A: "#40C8E0", B: "#0A84FF", C: "#5E5CE6", D: "#5E5CE6" };
export const ringColor = (code) => STAGE_COLOR[code?.[0]] || "#0A84FF";

const iso = (d) => d.toISOString().slice(0, 10);

// A época começa a 1 de setembro.
export function seasonStart(today = new Date()) {
  const year = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
  return `${year}-09-01`;
}

// Conteúdos de fevereiro a julho só contam a partir de fevereiro.
const isPeriodActive = (period, today) => {
  if (period !== "FEB_JUL") return true;
  const month = today.getMonth();
  return month >= 1 && month <= 6;
};

// Quanto do programa da turma, até à data, já foi dado nos sumários desta época.
export function programCoverage(exercises, summaries, code, today = new Date()) {
  const program = exercises
    .filter((ex) => ex.level_id === code && isPeriodActive(ex.period_type, today))
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const start = seasonStart(today);
  const given = new Set();
  summaries
    .filter((s) => s.level_id === code && (s.date || "") >= start)
    .forEach((s) => (s.exercise_ids || []).forEach((id) => given.add(id)));
  const pending = program.filter((ex) => !given.has(ex.id));
  return { total: program.length, done: program.length - pending.length, pending };
}

// "Hoje", "Ontem", "Amanhã", dia da semana nos próximos/últimos 6 dias, senão "23 de outubro".
export function relativeDay(dateStr, today = new Date()) {
  if (!dateStr) return "";
  const date = new Date(`${dateStr}T12:00:00`);
  const base = new Date(`${iso(today)}T12:00:00`);
  const diff = Math.round((date - base) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  if (Math.abs(diff) < 7) {
    const day = date.toLocaleDateString("pt-PT", { weekday: "long" });
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  return date.toLocaleDateString("pt-PT", { day: "numeric", month: "long" });
}

export function longToday(today = new Date()) {
  const text = today.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export const todayIso = (today = new Date()) => iso(today);
