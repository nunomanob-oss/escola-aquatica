import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, asc, desc, eq, getTableColumns, type SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import * as schema from '@/db/schema'

// O servidor (base de dados e auth) só é carregado dentro das funções de servidor,
// para não entrar no bundle do browser.
const server = () => Promise.all([import('@/db'), import('@/lib/auth')]).then(([d, a]) => ({ db: d.db, auth: a.auth }))

// Entidades expostas ao cliente, com a mesma forma (snake_case) que a app antiga usava.
const TABLES = {
  Level: schema.level,
  Exercise: schema.exercise,
  WorkoutSheet: schema.workoutSheet,
  ClassSummary: schema.classSummary,
} as const

type EntityName = keyof typeof TABLES
const ENTITY_NAMES = Object.keys(TABLES) as [EntityName, ...EntityName[]]
const SORTABLE = ['order_index', 'session_date', 'date'] as const

const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
const toCamel = (key: string) => key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())

// Linha da base de dados -> objeto da API (snake_case).
function toApi(row: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [toSnake(k), v]))
}

// Objeto vindo do cliente -> colunas válidas da tabela (camelCase), sem o id nem campos de sistema.
function toColumns(table: PgTable, data: Record<string, unknown>) {
  const columns = getTableColumns(table) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const camel = toCamel(key)
    if (camel in columns && !['id', 'createdAt', 'updatedAt', 'createdById'].includes(camel)) {
      out[camel] = value
    }
  }
  return out
}

async function currentUser() {
  const { auth } = await server()
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session) throw new Error('Não autenticado')
  return session.user
}

const listInput = z.object({
  entity: z.enum(ENTITY_NAMES),
  query: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  sort: z.enum(SORTABLE).optional(),
  descending: z.boolean().default(false),
  limit: z.number().int().min(1).max(1000).default(500),
})

export const entityList = createServerFn({ method: 'GET' })
  .validator(listInput)
  .handler(async ({ data }) => {
    await currentUser()
    const { db } = await server()
    const table = TABLES[data.entity] as PgTable & Record<string, any>
    const columns = getTableColumns(table) as Record<string, any>

    const conditions: SQL[] = []
    for (const [key, value] of Object.entries(data.query)) {
      const column = columns[toCamel(key)]
      if (column) conditions.push(eq(column, value as never))
    }

    const sortKey = data.sort?.replace(/^-/, '') ?? null
    const sortColumn = sortKey ? columns[toCamel(sortKey)] : null
    const order = sortColumn ? (data.descending ? desc(sortColumn) : asc(sortColumn)) : undefined

    const rows = await db
      .select()
      .from(table)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...(order ? [order] : []))
      .limit(data.limit)

    return rows.map((row) => toApi(row))
  })

const writeInput = z.object({
  entity: z.enum(['Exercise', 'WorkoutSheet', 'ClassSummary']),
  op: z.enum(['create', 'update', 'delete']),
  id: z.string().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
})

// Escrita: qualquer utilizador autenticado cria; alterar/apagar fichas só o autor ou um admin.
export const entityWrite = createServerFn({ method: 'POST' })
  .validator(writeInput)
  .handler(async ({ data }) => {
    const user = await currentUser()
    const { db } = await server()
    const table = TABLES[data.entity] as PgTable & Record<string, any>
    const columns = getTableColumns(table) as Record<string, any>

    if (data.op === 'create') {
      const [row] = await db
        .insert(table)
        .values({
          ...toColumns(table, data.data),
          id: crypto.randomUUID(),
          createdById: user.id,
        } as never)
        .returning()
      return toApi(row)
    }

    if (!data.id) throw new Error('Falta o id do registo')
    const idColumn = columns.id
    const [existing] = await db.select().from(table).where(eq(idColumn, data.id)).limit(1)
    if (!existing) throw new Error('Registo não encontrado')

    if (data.entity === 'WorkoutSheet') {
      const isOwner = existing.createdById === user.id
      if (!isOwner && user.role !== 'admin') throw new Error('Sem permissão para alterar esta ficha')
    }

    if (data.op === 'delete') {
      await db.delete(table).where(eq(idColumn, data.id))
      return { id: data.id }
    }

    const [row] = await db
      .update(table)
      .set({ ...toColumns(table, data.data), updatedAt: new Date() } as never)
      .where(eq(idColumn, data.id))
      .returning()
    return toApi(row)
  })
