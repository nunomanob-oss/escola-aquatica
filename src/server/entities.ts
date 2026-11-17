import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, asc, desc, eq, getTableColumns, getTableName, sql, type SQL } from 'drizzle-orm'
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
  LevelContent: schema.levelContent,
  WorkoutSheet: schema.workoutSheet,
  ClassSummary: schema.classSummary,
} as const

type EntityName = keyof typeof TABLES
const ENTITY_NAMES = Object.keys(TABLES) as [EntityName, ...EntityName[]]
const SORTABLE = ['order_index', 'session_date', 'date'] as const

// Memorizado: chamado para cada campo de cada linha (era ~5% do CPU do servidor nas listas grandes).
const snakeCache = new Map<string, string>()
const toSnake = (key: string) => {
  let out = snakeCache.get(key)
  if (out === undefined) snakeCache.set(key, (out = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)))
  return out
}
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

// Catálogo (níveis, conteúdos e exercícios): igual para todos os utilizadores, lido em cada abertura de Níveis e
// Biblioteca (a lista de exercícios tem ~870 KB). Guarda-se a resposta já em JSON por processo, validada contra uma
// "versão" barata calculada na base de dados: nº de linhas + último updated_at (exercícios; todas as escritas da app
// e do seed atualizam updated_at) ou soma de hashes do conteúdo (níveis e conteúdos, tabelas pequenas sem
// updated_at). Uma alteração feita por esta ou por outra instância muda a versão e invalida a cópia. Com ETag,
// o browser revalida e recebe 304 sem corpo quando nada mudou.
const CATALOG = new Set<EntityName>(['Level', 'LevelContent', 'Exercise'])
const catalogCache = new Map<string, { version: string; etag: string; body: string }>()

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' }

async function catalogVersion(db: Awaited<ReturnType<typeof server>>['db'], table: PgTable) {
  const name = sql.identifier(getTableName(table))
  const hasUpdatedAt = 'updatedAt' in getTableColumns(table)
  const [row] = await db.execute<{ v: string }>(
    hasUpdatedAt
      ? sql`select count(*)::text || '-' || coalesce(max(updated_at)::text, '') as v from ${name}`
      : sql`select count(*)::text || '-' || coalesce(sum(hashtext(t::text)), 0)::text as v from ${name} t`,
  )
  return row.v
}

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

    const load = async () => {
      const rows = await db
        .select()
        .from(table)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(...(order ? [order] : []))
        .limit(data.limit)
      return JSON.stringify(rows.map((row) => toApi(row)))
    }

    // Listas por utilizador/filtro: JSON simples (o cliente recebe o mesmo array; as datas chegam como texto).
    if (!CATALOG.has(data.entity) || conditions.length) {
      return new Response(await load(), { headers: { ...JSON_HEADERS, 'cache-control': 'private, no-store' } })
    }

    const key = JSON.stringify(data)
    const version = await catalogVersion(db, table)
    let entry = catalogCache.get(key)
    if (!entry || entry.version !== version) {
      const body = await load()
      entry = { version, etag: `"${data.entity}-${version}-${body.length}"`, body }
      if (catalogCache.size > 50) catalogCache.clear()
      catalogCache.set(key, entry)
    }
    const headers = { ...JSON_HEADERS, etag: entry.etag, 'cache-control': 'private, no-cache' }
    if (getRequest().headers.get('if-none-match') === entry.etag) return new Response(null, { status: 304, headers })
    return new Response(entry.body, { headers })
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
