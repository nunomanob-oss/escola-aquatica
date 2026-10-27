// Calendarização da época (setembro a julho) dos conteúdos por nível.

export const SEASON_MONTHS = ["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul"];

const MONTH_NAMES = {
  Set: "setembro", Out: "outubro", Nov: "novembro", Dez: "dezembro", Jan: "janeiro", Fev: "fevereiro",
  Mar: "março", Abr: "abril", Mai: "maio", Jun: "junho", Jul: "julho",
};
export const monthName = (month) => MONTH_NAMES[month] || month;

// Mês da época correspondente a uma data (agosto conta como setembro, início da época seguinte).
const BY_JS_MONTH = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Set", "Set", "Out", "Nov", "Dez"];
export const seasonMonth = (date = new Date()) => BY_JS_MONTH[date.getMonth()];

// "SET-JAN" -> ["Set", "Out", "Nov", "Dez", "Jan"]
export function periodMonths(period) {
  const [from, to] = (period || "").split("-").map((m) => m.charAt(0) + m.slice(1).toLowerCase());
  const start = SEASON_MONTHS.indexOf(from);
  const end = SEASON_MONTHS.indexOf(to);
  return start < 0 || end < start ? [] : SEASON_MONTHS.slice(start, end + 1);
}

// Situação do conteúdo num mês: introdução, consolidação ou fora da calendarização.
export function contentStatus(content, month) {
  if (!(content.months || []).includes(month)) return "off";
  return periodMonths(content.period).includes(month) ? "intro" : "consolidation";
}
