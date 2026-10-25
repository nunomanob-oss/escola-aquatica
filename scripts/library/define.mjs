// Forma compacta de escrever os exercícios da biblioteca (ver data/*.mjs).
// Cada nível exporta { level, prefix, exercises }, onde cada exercício é ex(bloco, título, campos).
export const ex = (block, title, o) => ({ block, title, ...o });

// Converte para a forma da entidade Exercise (base44/entities/Exercise.jsonc).
export function toEntity(level, item, code, orderIndex, turmas, demo3d) {
  return {
    title: item.title,
    code,
    description: item.desc,
    primary_objective: item.obj,
    content: item.content,
    subcategory: item.block,
    training_block: item.block,
    style: item.style,
    category: item.category,
    level: [level],
    turmas,
    demo_3d: demo3d,
    equipment_required: item.eq?.length ? item.eq : ["Nenhum"],
    distance: item.fmt,
    distance_m: item.m,
    rest_interval: item.rest,
    repetitions: item.reps,
    duration: item.dur,
    intensity: item.int,
    difficulty_rating: item.diff,
    instructions: item.steps,
    focus_points: item.tips,
    coaching_cues: item.cue,
    common_mistakes: item.errors.map((e) => `• ${e}`).join("\n"),
    variations: item.vars,
    focus_area: item.focus,
    tags: item.tags,
    is_example: true,
    is_custom: false,
    level_id: "ALL",
    period_type: "FULL_YEAR",
    order_index: orderIndex,
  };
}
