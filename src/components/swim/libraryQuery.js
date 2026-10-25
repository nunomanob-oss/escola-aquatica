import { TURMA_LEVEL } from "./exerciseMeta";

export const EMPTY_FILTERS = { q: "", style: "", category: "", equipment: "", level: "" };

export function hasActiveFilters(filters) {
  return Boolean(
    filters.q.trim() || filters.style || filters.category || filters.equipment || filters.level
  );
}

const includes = (value, wanted) =>
  Array.isArray(value) ? value.includes(wanted) : value === wanted;

// Filtros do painel (sem a turma). Corre no dispositivo para funcionar sem rede.
export function matchesFilters(exercise, filters) {
  if (filters.style && !includes(exercise.style, filters.style)) return false;
  if (filters.category && exercise.category !== filters.category) return false;
  if (filters.equipment && !includes(exercise.equipment_required, filters.equipment)) return false;
  if (filters.level && !includes(exercise.level, filters.level)) return false;

  const term = filters.q.trim().toLocaleLowerCase("pt-PT");
  if (term) {
    const fields = [exercise.title, exercise.code, ...(exercise.tags || [])];
    return fields.some((field) => String(field || "").toLocaleLowerCase("pt-PT").includes(term));
  }
  return true;
}

// Exercícios da biblioteca técnica: têm bloco de treino e pertencem a um nível do atleta.
const isLevelled = (ex) => ex.level_id === "ALL" && Boolean(ex.training_block);

// A Biblioteca mostra só a biblioteca técnica e os exercícios criados pelos instrutores.
// O programa original das turmas continua a existir e a aparecer no ecrã Conteúdos.
export const isLibraryExercise = (ex) => isLevelled(ex) || Boolean(ex.is_custom);

// Turmas de um exercício da biblioteca: as atribuídas a ele ou, se não tiver, todas as do seu nível.
function turmasOf(ex) {
  if (ex.turmas?.length) return ex.turmas;
  return Object.keys(TURMA_LEVEL).filter((t) => (ex.level || []).includes(TURMA_LEVEL[t]));
}

// Conteúdos trabalhados numa turma, segundo o seu programa (FPN).
function turmaContents(exercises, turma) {
  return new Set(exercises.filter((ex) => ex.level_id === turma).map((ex) => ex.content));
}

// Um exercício pertence à turma se for do seu programa, da biblioteca técnica dessa turma,
// ou um exemplo geral de um conteúdo que a turma trabalha.
export function belongsToTurma(ex, turma, contents) {
  if (ex.level_id === turma) return true;
  if (ex.level_id !== "ALL") return false;
  if (isLevelled(ex)) return turmasOf(ex).includes(turma);
  return !contents || contents.has(ex.content);
}

// Primeiro o que é próprio da turma, depois os exemplos gerais; dentro de cada grupo, pela ordem.
export const rank = (ex) => (ex.level_id === "ALL" && !isLevelled(ex) ? 1 : 0);

// Exercícios visíveis para a turma ativa, com os filtros aplicados.
export function filterLibrary(exercises, activeLevel, filters) {
  const contents = activeLevel === "all" ? null : turmaContents(exercises, activeLevel);
  return exercises
    .filter((ex) => activeLevel === "all" || belongsToTurma(ex, activeLevel, contents))
    .filter((ex) => matchesFilters(ex, filters))
    .sort((a, b) => rank(a) - rank(b) || (a.order_index || 0) - (b.order_index || 0));
}

// Contagem por turma refletindo os filtros: programa da turma + biblioteca técnica dessa turma
// (os exemplos gerais, comuns a todas as turmas, não contam).
export function countByLevel(exercises, filters) {
  const counts = { all: 0 };
  exercises.forEach((ex) => {
    if (!matchesFilters(ex, filters)) return;
    counts.all += 1;
    if (ex.level_id && ex.level_id !== "ALL") counts[ex.level_id] = (counts[ex.level_id] || 0) + 1;
    if (isLevelled(ex)) turmasOf(ex).forEach((t) => (counts[t] = (counts[t] || 0) + 1));
  });
  return counts;
}
