// Carrega utilizadores demo, turmas e a biblioteca técnica para o Postgres.
// Uso: npm run db:seed   (idempotente: emails e códigos BIB-… já existentes são ignorados)
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
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

const LEVELS = [
  { code: 'A1', name: 'Adaptação ao Meio Aquático', ageRange: '7–15 anos', orderIndex: 1 },
  { code: 'A1+', name: 'Introdução às técnicas de Crol e Costas', ageRange: '7–15 anos', orderIndex: 2 },
  { code: 'A2', name: 'Adaptação', ageRange: '7–15 anos', orderIndex: 3 },
  { code: 'A2+', name: 'Introdução Crol/Costas', ageRange: '7–15 anos', orderIndex: 4 },
  { code: 'B1', name: 'Crol e costas, introdução ao bruços', ageRange: '8–15 anos', orderIndex: 5 },
  { code: 'B2', name: 'Mariposa, bruços, estafetas', ageRange: '8–15 anos', orderIndex: 6 },
  { code: 'C', name: 'Bruços, viragem de bruços, velocidade', ageRange: '9–16 anos', orderIndex: 7 },
  { code: 'D', name: 'Mariposa, estilos, ritmo', ageRange: '9–16 anos', orderIndex: 8 },
]

const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

// Campos da biblioteca (snake_case no JSON de seed) -> colunas camelCase da tabela.
function toRow(item: Record<string, unknown>) {
  const columns = new Set(Object.keys(schema.exercise))
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

async function main() {
  await seedUsers()

  for (const level of LEVELS) {
    await db
      .insert(schema.level)
      .values({
        id: randomUUID(),
        code: level.code,
        name: level.name,
        durationMin: 45,
        maxStudents: 8,
        ageRange: level.ageRange,
        orderIndex: level.orderIndex,
      })
      .onConflictDoNothing({ target: schema.level.code })
  }
  console.log(`Turmas: ${LEVELS.length} (existentes ignoradas)`)

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
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
