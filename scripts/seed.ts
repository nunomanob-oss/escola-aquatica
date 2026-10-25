// Carrega as turmas e a biblioteca técnica (base44/seed/exercise-library.json) para o Postgres.
// Uso: npm run db:seed   (idempotente: os códigos BIB-… já existentes são ignorados)
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { eq } from 'drizzle-orm'
import { db, schema } from '../src/db'

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

// Campos da biblioteca (snake_case, forma da Base44) -> colunas da tabela.
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

async function main() {
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

  const library = JSON.parse(readFileSync('base44/seed/exercise-library.json', 'utf8')) as Record<string, unknown>[]
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
