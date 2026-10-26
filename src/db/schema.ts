import { relations } from 'drizzle-orm'
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// Tabelas do Better Auth (user, session, account, verification).
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

// Domínio da escola (turmas, exercícios, fichas e sumários).
export const level = pgTable('level', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  durationMin: integer('duration_min'),
  maxStudents: integer('max_students'),
  ageRange: text('age_range'),
  orderIndex: integer('order_index').notNull().default(0),
})

export const exercise = pgTable(
  'exercise',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    code: text('code'),
    // Origem: 'CFP' para os exemplos do programa do clube; vazio para a biblioteca técnica e personalizados.
    source: text('source'),
    description: text('description'),
    primaryObjective: text('primary_objective'),
    content: text('content'),
    subcategory: text('subcategory'),
    trainingBlock: text('training_block'),
    category: text('category'),
    style: text('style').array().notNull().default([]),
    level: text('level').array().notNull().default([]),
    turmas: text('turmas').array().notNull().default([]),
    equipmentRequired: text('equipment_required').array().notNull().default([]),
    focusPoints: text('focus_points').array().notNull().default([]),
    focusArea: text('focus_area').array().notNull().default([]),
    tags: text('tags').array().notNull().default([]),
    instructions: text('instructions').array().notNull().default([]),
    variations: text('variations').array().notNull().default([]),
    difficultyRating: integer('difficulty_rating'),
    commonMistakes: text('common_mistakes'),
    organization: text('organization'),
    successCriteria: text('success_criteria'),
    progression: text('progression'),
    regression: text('regression'),
    ageAdaptation: text('age_adaptation'),
    coachingCues: text('coaching_cues'),
    videoUrl: text('video_url'),
    imageDiagram: text('image_diagram'),
    demo3d: text('demo_3d'),
    distance: text('distance'),
    distanceM: integer('distance_m'),
    restInterval: text('rest_interval'),
    repetitions: text('repetitions'),
    duration: text('duration'),
    intensity: text('intensity'),
    levelId: text('level_id').notNull().default('ALL'),
    periodType: text('period_type').notNull().default('FULL_YEAR'),
    periodLabel: text('period_label'),
    orderIndex: integer('order_index').notNull().default(0),
    isExample: boolean('is_example').notNull().default(false),
    isCustom: boolean('is_custom').notNull().default(false),
    createdById: text('created_by_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('exercise_level_id_idx').on(table.levelId),
    index('exercise_order_idx').on(table.orderIndex),
  ],
)

// Conteúdos do programa de cada turma (por bloco e período), com os códigos dos exercícios exemplo.
export const levelContent = pgTable(
  'level_content',
  {
    id: text('id').primaryKey(),
    levelCode: text('level_code').notNull(),
    number: text('number'),
    block: text('block'),
    title: text('title').notNull(),
    period: text('period'),
    months: text('months').array().notNull().default([]),
    exerciseCodes: text('exercise_codes').array().notNull().default([]),
    orderIndex: integer('order_index').notNull().default(0),
  },
  (table) => [index('level_content_level_idx').on(table.levelCode)],
)

export const workoutSheet = pgTable(
  'workout_sheet',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    levelId: text('level_id').notNull(),
    sessionDate: date('session_date', { mode: 'string' }),
    focus: text('focus'),
    // [{ title, rest, items: string[] }]
    sections: jsonb('sections').$type<{ title: string; rest: string; items: string[] }[]>().notNull().default([]),
    totalDistance: integer('total_distance'),
    notes: text('notes'),
    createdById: text('created_by_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('workout_sheet_date_idx').on(table.sessionDate)],
)

export const classSummary = pgTable(
  'class_summary',
  {
    id: text('id').primaryKey(),
    date: date('date', { mode: 'string' }).notNull(),
    levelId: text('level_id').notNull(),
    exerciseIds: text('exercise_ids').array().notNull().default([]),
    contentIds: text('content_ids').array().notNull().default([]),
    notes: text('notes'),
    createdById: text('created_by_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('class_summary_date_level_idx').on(table.date, table.levelId)],
)
