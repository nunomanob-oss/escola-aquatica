// Carrega utilizadores demo, turmas e a biblioteca técnica para o Postgres.
// Uso: npm run db:seed   (idempotente: emails e códigos BIB-… já existentes são ignorados;
// níveis, conteúdos e exercícios EX-… do programa CFP são atualizados com a versão do JSON)
import { randomUUID } from 'node:crypto'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { hashPassword } from 'better-auth/crypto'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '../src/db'

const DEMO_USERS = [
  {
    name: 'Instrutor Demo',
    email: 'instrutor@escola.local',
    password: 'instrutor123',
    role: 'user',
  },
  {
    name: 'Admin Demo',
    email: 'admin@escola.local',
    password: 'admin1234',
    role: 'admin',
  },
]

// Programa do clube (níveis, conteúdos e exercícios exemplo), gerado por scripts/cfp/build.mjs.
type CfpProgram = {
  levels: { code: string; name: string; age_range: string; duration_min: number; max_students: number; order_index: number }[]
  contents: Record<string, unknown>[]
  exercises: Record<string, unknown>[]
}
const CFP = JSON.parse(readFileSync('scripts/cfp/seed/cfp-program.json', 'utf8')) as CfpProgram

// Calendarização detalhada por nível (Excel base_dados_niveis_CFP.xlsx -> scripts/niveis/xlsx-to-json.py).
type Niveis = {
  levels: { code: string; stage: string | null; space: string | null; requirements: string | null; periods: string[] }[]
  contents: {
    level_code: string
    number: string
    periods: string[]
    continuity: string[]
    start_month: string | null
    source: string | null
  }[]
}
const NIVEIS = JSON.parse(readFileSync('scripts/niveis/niveis-cfp.json', 'utf8')) as Niveis

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

// Campos do JSON de seed (snake_case) -> colunas camelCase da tabela.
function toRow(item: Record<string, unknown>, table: object = schema.exercise) {
  const columns = new Set(Object.keys(table))
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(item)) {
    const camel = toCamel(key)
    if (columns.has(camel) && !['id', 'createdAt', 'updatedAt', 'createdById'].includes(camel)) {
      row[camel] = value
    }
  }
  return row
}

async function seedUsers() {
  let inserted = 0
  let skipped = 0
  for (const demo of DEMO_USERS) {
    const [existing] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, demo.email))
      .limit(1)
    if (existing) {
      skipped += 1
      continue
    }
    const userId = randomUUID()
    await db.insert(schema.user).values({
      id: userId,
      name: demo.name,
      email: demo.email,
      emailVerified: true,
      role: demo.role,
    })
    await db.insert(schema.account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: await hashPassword(demo.password),
    })
    inserted += 1
  }
  console.log(`Utilizadores: ${inserted} criados, ${skipped} já existiam`)
  for (const demo of DEMO_USERS) {
    console.log(`  · ${demo.email} / ${demo.password} (${demo.role})`)
  }
}

// Ilustrações: public/exercicios/<CÓDIGO>.png (ou .webp/.jpg) fica como imagem do exercício com esse código.
const IMAGES_DIR = 'public/exercicios'

async function seedImages() {
  const files = existsSync(IMAGES_DIR) ? readdirSync(IMAGES_DIR).filter((f) => /\.(png|webp|jpe?g|svg)$/i.test(f)) : []
  let linked = 0
  for (const file of files) {
    const code = file.replace(/\.[^.]+$/, '')
    const rows = await db
      .update(schema.exercise)
      .set({ imageDiagram: `/exercicios/${file}` })
      .where(eq(schema.exercise.code, code))
      .returning({ id: schema.exercise.id })
    linked += rows.length
  }
  console.log(`Ilustrações: ${linked} exercícios com imagem (${files.length} ficheiros em ${IMAGES_DIR})`)
}

// Completa níveis e conteúdos do programa com a calendarização do Excel (por código do nível e nº do conteúdo).
async function seedCalendar() {
  for (const level of NIVEIS.levels) {
    await db
      .update(schema.level)
      .set({ stage: level.stage, space: level.space, requirements: level.requirements, periods: level.periods })
      .where(eq(schema.level.code, level.code))
  }
  let matched = 0
  for (const content of NIVEIS.contents) {
    const rows = await db
      .update(schema.levelContent)
      .set({
        periods: content.periods,
        continuity: content.continuity,
        startMonth: content.start_month,
        source: content.source,
      })
      .where(and(eq(schema.levelContent.levelCode, content.level_code), eq(schema.levelContent.number, content.number)))
      .returning({ id: schema.levelContent.id })
    matched += rows.length
  }
  console.log(`Calendarização: ${matched} de ${NIVEIS.contents.length} conteúdos atualizados`)
}

async function main() {
  await seedUsers()

  for (const level of CFP.levels) {
    const values = {
      name: level.name,
      durationMin: level.duration_min,
      maxStudents: level.max_students,
      ageRange: level.age_range,
      orderIndex: level.order_index,
    }
    await db
      .insert(schema.level)
      .values({ id: randomUUID(), code: level.code, ...values })
      .onConflictDoUpdate({ target: schema.level.code, set: values })
  }
  console.log(`Turmas: ${CFP.levels.length} (atualizadas com o programa CFP)`)

  for (const content of CFP.contents) {
    const row = toRow(content, schema.levelContent) as typeof schema.levelContent.$inferInsert
    await db
      .insert(schema.levelContent)
      .values({ ...row, id: content.id as string })
      .onConflictDoUpdate({ target: schema.levelContent.id, set: row })
  }
  console.log(`Conteúdos: ${CFP.contents.length} (atualizados)`)
  await seedCalendar()

  let cfpInserted = 0
  let cfpUpdated = 0
  for (const item of CFP.exercises) {
    const code = item.code as string
    const row = toRow(item)
    const [existing] = await db
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .where(eq(schema.exercise.code, code))
      .limit(1)
    if (existing) {
      await db
        .update(schema.exercise)
        .set({ ...row, updatedAt: new Date() } as never)
        .where(eq(schema.exercise.id, existing.id))
      cfpUpdated += 1
    } else {
      await db.insert(schema.exercise).values({ ...row, id: randomUUID(), code } as never)
      cfpInserted += 1
    }
  }
  console.log(`Exercícios do programa: ${cfpInserted} inseridos, ${cfpUpdated} atualizados`)

  const library = JSON.parse(
    readFileSync('scripts/library/seed/exercise-library.json', 'utf8'),
  ) as Record<string, unknown>[]
  let inserted = 0
  let skipped = 0
  for (const item of library) {
    const code = item.code as string
    const [existing] = await db
      .select({ id: schema.exercise.id })
      .from(schema.exercise)
      .where(eq(schema.exercise.code, code))
      .limit(1)
    if (existing) {
      skipped += 1
      continue
    }
    await db.insert(schema.exercise).values({ ...toRow(item), id: randomUUID(), code } as never)
    inserted += 1
  }
  console.log(`Biblioteca: ${inserted} inseridos, ${skipped} já existiam`)

  await seedImages()
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
