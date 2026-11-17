// Ilustrações dos exercícios da biblioteca (BIB-…) no mesmo estilo das ilustrações do programa CFP (EX-…).
// Gera cada imagem com o Kling Image V1 (inference.sh, CLI `belt`, ~$0,0035 por imagem), usando uma ilustração CFP
// como referência de estilo, e grava-a em public/exercicios/<código>.jpg (320 px de largura, como as CFP).
//
// Uso:
//   node scripts/library/illustrate-ai.mjs --dry-run [códigos…]   mostra os prompts, sem gerar
//   node scripts/library/illustrate-ai.mjs [códigos…]             gera (requer `belt login`); salta as que já existem
//   node scripts/library/illustrate-ai.mjs --force BIB-INI-001     volta a gerar
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const LIBRARY = 'scripts/library/seed/exercise-library.json'
const OUT_DIR = 'public/exercicios'
const APP = 'klingai/image-v1'
// O Kling V1 aceita uma só referência: crianças no cais para a iniciação, treino na piscina com treinador para os restantes.
const STYLE_REF = { INI: 'EX-018' }
const DEFAULT_STYLE_REF = 'EX-100'
const styleRefOf = (exercise) => `${OUT_DIR}/${STYLE_REF[exercise.code.split('-')[1]] || DEFAULT_STYLE_REF}.jpg`
const NEGATIVE = 'text, letters, numbers, captions, watermark, logo, photorealistic, photo, 3D render, blurry, deformed hands'

const SWIMMERS = {
  INI: 'young children aged 4 to 7 learning to swim, in colourful swimsuits and swim caps',
  APR: 'children aged 7 to 10 in a swimming school class, in swim caps and goggles',
  APF: 'children and young teenagers aged 9 to 14 improving their technique, in swim caps and goggles',
  ALT: 'teenage and young adult competitive swimmers in racing swimsuits, caps and goggles',
  MST: 'adult master swimmers aged 30 to 60 in swim caps and goggles',
}

const STYLE = [
  'Match exactly the art style of the reference image: flat editorial cartoon illustration with clean dark outlines,',
  'soft cel shading and a turquoise/teal colour palette; an indoor swimming pool with white tiles, lane ropes,',
  'ceiling lights and large windows with green trees; translucent water with visible surface lines and bubbles.',
  'A coach in a navy polo shirt stands on the pool deck when it makes sense.',
  'Landscape 4:3 composition, the exercise clearly readable at small size.',
  'Do not copy the people or scene of the reference, only its style.',
  'NO text, letters, numbers, labels or captions anywhere in the image.',
].join(' ')

const equipmentOf = (exercise) => (exercise.equipment_required || []).filter((e) => e && e !== 'Nenhum')

export function buildPrompt(exercise) {
  const group = exercise.code.split('-')[1]
  const steps = (exercise.instructions || []).slice(0, 4).join(' ')
  const equipment = equipmentOf(exercise)
  return [
    `Illustration of a swimming exercise called "${exercise.title}" (description in Portuguese below).`,
    `Show ${SWIMMERS[group] || 'swimmers'} performing it, in the correct body position for the exercise.`,
    `Description: ${exercise.description || exercise.primary_objective || ''}`,
    steps ? `Key steps: ${steps}` : '',
    equipment.length ? `Equipment that must be visible: ${equipment.join(', ')}.` : 'No swimming equipment.',
    STYLE,
  ]
    .filter(Boolean)
    .join('\n')
}

function generate(exercise) {
  const dir = mkdtempSync(join(tmpdir(), 'illustrate-'))
  try {
    const input = { prompt: buildPrompt(exercise), image: styleRefOf(exercise), negative_prompt: NEGATIVE, aspect_ratio: '4:3' }
    const raw = execFileSync('belt', ['app', 'run', APP, '--input', JSON.stringify(input), '--json'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    })
    const image = JSON.parse(raw).output?.image
    const url = typeof image === 'string' ? image : image?.uri || image?.url
    if (!url) throw new Error(`sem imagem na resposta: ${raw.slice(0, 300)}`)
    const file = join(dir, 'out')
    execFileSync('curl', ['-sSfL', url, '-o', file])
    // Mesmo formato das ilustrações CFP: JPEG com 320 px de largura.
    const out = `${OUT_DIR}/${exercise.code}.jpg`
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '--resampleWidth', '320', file, '--out', out], {
      stdio: 'ignore',
    })
    // O esquema SVG anterior deixa de ser usado.
    if (existsSync(`${OUT_DIR}/${exercise.code}.svg`)) unlinkSync(`${OUT_DIR}/${exercise.code}.svg`)
    return out
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')
  const codes = new Set(args.filter((a) => !a.startsWith('--')))
  const library = JSON.parse(readFileSync(LIBRARY, 'utf8'))
  const todo = library.filter((e) => !codes.size || codes.has(e.code))

  if (dryRun) {
    for (const e of todo) console.log(`── ${e.code}\n${buildPrompt(e)}\n`)
    return
  }

  let done = 0
  for (const e of todo) {
    if (!force && existsSync(`${OUT_DIR}/${e.code}.jpg`)) continue
    try {
      console.log(`${e.code} → ${generate(e)}`)
      done += 1
    } catch (error) {
      console.error(`${e.code}: ${error.message}`)
    }
  }
  console.log(`Geradas: ${done}`)
}

// Só gera quando corrido diretamente (importar o módulo, por exemplo para usar buildPrompt, não gera nada).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
