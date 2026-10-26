// Converte a base de dados do programa CFP (níveis, conteúdos e exercícios exemplo) no JSON de seed.
// Uso: node scripts/cfp/build.mjs [caminho/CFP_extracao.sqlite]
// Fonte por omissão: scripts/cfp/data/CFP_extracao.sqlite → scripts/cfp/seed/cfp-program.json
import { writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const source = process.argv[2] || "scripts/cfp/data/CFP_extracao.sqlite";
const target = "scripts/cfp/seed/cfp-program.json";
const db = new DatabaseSync(source, { readOnly: true });

// Termos fora do pt-PT na fonte (ver docs/BIBLIOTECA.md): "quadril" → "anca".
const ptPT = (value) => value.replace(/\bo quadril\b/g, "a anca").replace(/\bQuadril\b/g, "Anca").replace(/\bquadril\b/g, "anca");
const text = (value) => (value == null ? "" : ptPT(String(value).trim()));
const list = (value, sep) => text(value).split(sep).map((v) => v.trim()).filter(Boolean);
const minutes = (value) => Number.parseInt(text(value), 10) || null;

// "1) …\n2) …" → ["…", "…"]
const steps = (value) => list(value, "\n").map((line) => line.replace(/^\d+\)\s*/, ""));

const levels = db
  .prepare("SELECT * FROM nivel ORDER BY ordem")
  .all()
  .map((n) => ({
    code: n.nome,
    name: n.etapa,
    age_range: n.idade,
    duration_min: minutes(n.duracao),
    max_students: minutes(n.lotacao),
    order_index: n.ordem + 1,
  }));
const levelByKey = Object.fromEntries(db.prepare("SELECT key, nome FROM nivel").all().map((n) => [n.key, n.nome]));

const links = db.prepare("SELECT conteudo_id, exercicio_id FROM conteudo_exercicio ORDER BY exercicio_id").all();
const exercisesOf = (contentId) => links.filter((l) => l.conteudo_id === contentId).map((l) => l.exercicio_id);

const contents = db
  .prepare("SELECT * FROM conteudo ORDER BY id")
  .all()
  .map((c) => ({
    id: `CFP-${String(c.id).padStart(3, "0")}`,
    level_code: levelByKey[c.nivel_key],
    number: text(c.numero),
    block: text(c.bloco),
    title: text(c.conteudo),
    period: text(c.periodo_introducao),
    months: list(c.meses, ","),
    exercise_codes: exercisesOf(c.id),
    order_index: c.id,
  }));

// Turmas onde cada exercício aparece, pela ordem dos níveis.
const turmasOf = (code) => {
  const turmas = new Set(contents.filter((c) => c.exercise_codes.includes(code)).map((c) => c.level_code));
  return levels.map((l) => l.code).filter((t) => turmas.has(t));
};

const exercises = db
  .prepare("SELECT * FROM exercicio ORDER BY id")
  .all()
  .map((e, index) => ({
    code: e.id,
    title: text(e.nome),
    source: "CFP",
    category: text(e.tipo),
    content: text(e.tipo),
    turmas: turmasOf(e.id),
    difficulty_rating: e.dificuldade,
    equipment_required: text(e.material) ? [text(e.material)] : [],
    organization: text(e.organizacao),
    duration: text(e.tempo),
    instructions: steps(e.execucao),
    success_criteria: text(e.criterio_exito),
    common_mistakes: text(e.erros_correcao),
    progression: text(e.progressao),
    regression: text(e.regressao),
    age_adaptation: text(e.adaptacao_idade),
    order_index: index + 1,
  }));

// Integridade: todos os conteúdos têm exemplo e todos os exemplos existem.
const codes = new Set(exercises.map((e) => e.code));
const problems = [
  ...contents.filter((c) => !c.level_code).map((c) => `${c.id}: nível desconhecido`),
  ...contents.filter((c) => c.exercise_codes.length === 0).map((c) => `${c.id}: sem exercício exemplo`),
  ...contents.flatMap((c) => c.exercise_codes.filter((x) => !codes.has(x)).map((x) => `${c.id}: ${x} não existe`)),
  ...exercises.filter((e) => e.instructions.length === 0).map((e) => `${e.code}: sem passos`),
];
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}

writeFileSync(target, `${JSON.stringify({ levels, contents, exercises }, null, 2)}\n`);
console.log(`${levels.length} níveis, ${contents.length} conteúdos, ${exercises.length} exercícios → ${target}`);
