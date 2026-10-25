export function buildDemonstrationPrompt(exercise) {
  const how = (exercise.description || exercise.primary_objective || "")
    .replace(/\s+/g, " ")
    .slice(0, 260);
  const equipment = (exercise.equipment_required || []).join(", ");

  return [
    "Ilustração de demonstração técnica de natação, em vista lateral, para mostrar como executar um exercício.",
    `Exercício: ${exercise.title}.`,
    how ? `Como se executa: ${how}` : "",
    equipment ? `Equipamento visível: ${equipment}.` : "",
    "Um nadador adulto com touca preta e óculos azuis, corpo inteiro visível, na posição correta do exercício, dentro de água azul-turquesa translúcida com linhas de superfície, com realce verde (#2fe06b) no movimento principal e setas de direção discretas.",
    "Estilo ilustração limpa com acabamento realista, paleta de azuis (#1D3F75, #3B7FB9, #A4C6ED), fundo claro, composição quadrada e centrada.",
    "SEM qualquer texto, letra, número, etiqueta ou legenda na imagem.",
  ]
    .filter(Boolean)
    .join(" ");
}