// Valida a biblioteca e gera base44/seed/exercise-library.json.
// Uso: node scripts/library/build.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { toEntity } from "./define.mjs";
import { LEVEL_TURMAS, TURMAS } from "./turmas.mjs";
import { DEMO_3D } from "./demo3d.mjs";
import { DEMO_3D_IDS } from "../../src/components/swim/demo3d/presetIds.js";
import iniciacao from "./data/iniciacao.mjs";
import aprendizagem from "./data/aprendizagem.mjs";
import aperfeicoamento from "./data/aperfeicoamento.mjs";
import altoRendimento from "./data/alto-rendimento.mjs";
import master from "./data/master.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const schema = JSON.parse(fs.readFileSync(`${ROOT}/base44/entities/Exercise.jsonc`, "utf8")).properties;
const LEVELS = [iniciacao, aprendizagem, aperfeicoamento, altoRendimento, master];
const BLOCKS = schema.training_block.enum;

// Regras do treinador (Etapa 6).
const MAX_METERS = { INI: 200, APR: 400, APF: 1200, ALT: 3200, MST: 1500 };
const BANNED_EQUIPMENT = {
  INI: ["Pás", "PULL-BUOY", "Tubo Frontal (Snorkel)", "Elástico", "Cinto de Tração", "Metrónomo (Tempo Trainer)"],
  APR: ["Pás", "Tubo Frontal (Snorkel)", "Elástico", "Cinto de Tração", "Metrónomo (Tempo Trainer)"],
  APF: ["Elástico", "Cinto de Tração"],
  ALT: ["Esparguete", "Tapete flutuante", "Arcos de mergulho"],
  MST: ["Cinto de Tração", "Arcos de mergulho", "Tapete flutuante"],
};
const BLOCK_INTENSITY = {
  Aquecimento: ["Baixa", "Moderada"],
  Técnica: ["Baixa", "Moderada"],
  Pernas: ["Baixa", "Moderada", "Alta"],
  Braços: ["Baixa", "Moderada", "Alta"],
  "Série Principal": ["Moderada", "Alta", "Máxima"],
  Velocidade: ["Alta", "Máxima"],
  "Retorno à Calma": ["Baixa"],
  Jogos: ["Baixa", "Moderada", "Alta"],
};
const BLOCK_RANGE = {
  Aquecimento: [3, 5], Técnica: [5, 8], "Série Principal": [8, 12], Pernas: [3, 5],
  Braços: [3, 5], Velocidade: [3, 5], "Retorno à Calma": [2, 3], Jogos: [3, 5],
};
const CONTENT_STYLE = {
  Crol: "Crol", Costas: "Costas", Bruços: "Bruços", Mariposa: "Mariposa",
  "Adaptação ao Meio Aquático": "Genérico",
};

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);
const inEnum = (field, value) => (schema[field].enum || schema[field].items?.enum).includes(value);
const sentences = (text) => (text.match(/[.!?](\s|$)/g) || []).length;

const titles = new Set();
const entities = [];

LEVELS.forEach(({ level, prefix, exercises }, levelIndex) => {
  if (!schema.level.items.enum.includes(level)) fail(prefix, `nível desconhecido ${level}`);

  const byBlock = Object.fromEntries(BLOCKS.map((b) => [b, []]));
  exercises.forEach((item) => {
    if (!byBlock[item.block]) fail(item.title, `bloco desconhecido ${item.block}`);
    else byBlock[item.block].push(item);
  });

  // Quantidades por bloco (Etapa 4). Velocidade só a partir de Aperfeiçoamento; jogos só nos iniciais.
  BLOCKS.forEach((block) => {
    const n = byBlock[block].length;
    const [min, max] = BLOCK_RANGE[block];
    const optional =
      (block === "Velocidade" && ["INI", "APR"].includes(prefix)) ||
      (block === "Jogos" && !["INI", "APR"].includes(prefix));
    if (optional && n === 0) return;
    if (n < min || n > max) fail(prefix, `${block} tem ${n} (esperado ${min}-${max})`);
  });

  let counter = 0;
  BLOCKS.forEach((block, blockIndex) => {
    byBlock[block].forEach((item) => {
      counter += 1;
      const code = `BIB-${prefix}-${String(counter).padStart(3, "0")}`;
      const w = `${code} "${item.title}"`;

      if (titles.has(item.title.toLowerCase())) fail(w, "título duplicado");
      titles.add(item.title.toLowerCase());

      if (!item.desc || sentences(item.desc) < 2) fail(w, "descrição com menos de 2 frases");
      if (!item.obj) fail(w, "sem objetivo");
      if (!item.steps || item.steps.length < 3) fail(w, "menos de 3 passos");
      if (!item.tips || item.tips.length < 2) fail(w, "menos de 2 dicas do treinador");
      if (!item.errors || item.errors.length < 2) fail(w, "menos de 2 erros comuns");
      if (!item.vars || item.vars.length < 1) fail(w, "sem variações");
      if (!item.tags || item.tags.length < 2) fail(w, "menos de 2 tags");
      if (!item.cue) fail(w, "sem frase-chave");
      if (!item.fmt || !item.rest || !item.dur || !item.reps) fail(w, "formato incompleto");
      // Exercícios parados (na borda, flutuação, jogos) têm 0 m e um formato em tempo ou repetições.
      if (typeof item.m !== "number" || item.m < 0 || item.m > MAX_METERS[prefix])
        fail(w, `distância ${item.m} m fora do limite do nível (${MAX_METERS[prefix]} m)`);
      if (!(item.diff >= 1 && item.diff <= 5)) fail(w, "dificuldade fora de 1-5");

      if (!inEnum("intensity", item.int)) fail(w, `intensidade inválida ${item.int}`);
      else if (!BLOCK_INTENSITY[block].includes(item.int)) {
        // Partidas e chegadas são técnica, mas treinam-se à velocidade de prova.
        const raceSpeedDrill = block === "Técnica" && item.category === "Partidas e Viragens" && item.int === "Alta";
        if (!raceSpeedDrill) fail(w, `intensidade ${item.int} incoerente com ${block}`);
      }
      if (item.category && !inEnum("category", item.category)) fail(w, `categoria inválida ${item.category}`);
      (item.style || []).forEach((s) => !inEnum("style", s) && fail(w, `estilo inválido ${s}`));
      (item.eq || []).forEach((e) => {
        if (!inEnum("equipment_required", e)) fail(w, `equipamento inválido ${e}`);
        if (BANNED_EQUIPMENT[prefix].includes(e)) fail(w, `equipamento ${e} não adequado ao nível`);
      });
      (item.focus || []).forEach((f) => !inEnum("focus_area", f) && fail(w, `área inválida ${f}`));
      if (!item.focus?.length) fail(w, "sem áreas trabalhadas");

      const expected = CONTENT_STYLE[item.content];
      if (expected && !item.style.includes(expected)) fail(w, `estilo não bate com o conteúdo ${item.content}`);
      if (item.content === "Estilos" && !item.style.includes("Quatro Estilos (IM)") && item.style.length < 2)
        fail(w, "conteúdo Estilos precisa de mais de um estilo");
      // Distâncias sempre em metros: "largura" só para o corpo (ex.: à largura dos ombros).
      const text = JSON.stringify(item).replace(/largura d[oa]s? (ombros?|ancas?)/gi, "");
      if (/(?<!\p{L})(larguras?|meia piscina|piscinas|por piscina|cada piscina|outra parede)(?!\p{L})/iu.test(text))
        fail(w, "distância descrita em larguras/piscinas — usar metros");
      if (/\b(crawl|quadril|nadadeira|palmar|placa|piscina olímpica)\b/i.test(JSON.stringify(item)))
        fail(w, "terminologia não pt-PT");

      // Turmas: obrigatórias nos níveis da escola e sempre dentro das turmas desse nível.
      const turmas = TURMAS[item.title] || [];
      const allowed = LEVEL_TURMAS[level] || [];
      if (allowed.length && turmas.length === 0) fail(w, "sem turma atribuída");
      if (!allowed.length && turmas.length) fail(w, "nível sem turmas não pode ter turma");
      turmas.forEach((t) => !allowed.includes(t) && fail(w, `turma ${t} não pertence ao nível ${level}`));

      const demo3d = DEMO_3D[item.title];
      if (demo3d && !DEMO_3D_IDS.includes(demo3d)) fail(w, `demonstração 3D desconhecida: ${demo3d}`);

      entities.push(toEntity(level, item, code, 1000 + blockIndex * 1000 + levelIndex * 100 + counter, turmas, demo3d));
    });
  });

  if (prefix === "INI") {
    const ludicos = exercises.filter((e) => e.tags?.includes("lúdico")).length;
    if (ludicos < 15) fail(prefix, `só ${ludicos} exercícios lúdicos de adaptação (mínimo 15)`);
  }
});

Object.keys(DEMO_3D).forEach((title) => {
  if (!titles.has(title.toLowerCase())) fail("demo3d.mjs", `título sem exercício: ${title}`);
});
Object.keys(TURMAS).forEach((title) => {
  if (!titles.has(title.toLowerCase())) fail("turmas.mjs", `título sem exercício: ${title}`);
});

if (errors.length) {
  console.error(`${errors.length} problemas:\n- ${errors.join("\n- ")}`);
  process.exit(1);
}

fs.writeFileSync(`${ROOT}/base44/seed/exercise-library.json`, `${JSON.stringify(entities, null, 2)}\n`);

const table = LEVELS.map(({ level, exercises }) => {
  const counts = BLOCKS.map((b) => exercises.filter((e) => e.block === b).length);
  return [level, ...counts, exercises.length];
});
console.log(["Nível", ...BLOCKS, "Total"].join(" | "));
table.forEach((row) => console.log(row.join(" | ")));
const perTurma = Object.values(LEVEL_TURMAS).flat().map((t) => `${t} ${entities.filter((e) => e.turmas.includes(t)).length}`);
console.log(`\nPor turma: ${perTurma.join(" · ")}`);
console.log(`\n${entities.length} exercícios válidos → base44/seed/exercise-library.json`);
