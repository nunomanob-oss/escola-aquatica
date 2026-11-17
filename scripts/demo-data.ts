// Dados de exemplo para Aulas e Painel: alguns sumários e fichas de treino das últimas semanas,
// atribuídos ao instrutor demo. Servem só para ver os ecrãs preenchidos.
// Uso: npm run db:demo            (cria; se já existirem, substitui-os)
//      npm run db:demo -- --limpar (apaga só os registos de exemplo)
// Todos os registos de exemplo têm id começado por "demo-", por isso nunca tocam em dados reais.
import { eq, like } from 'drizzle-orm'
import { db, schema } from '../src/db'

const PREFIX = 'demo-'
const DEMO_EMAIL = 'instrutor@escola.local'

// Mês da época (Set…Jul) para uma data; agosto conta como setembro.
const SEASON = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Set', 'Set', 'Out', 'Nov', 'Dez']

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

// [nível, há quantos dias, nº de conteúdos, observação]
const SUMMARIES: [string, number, number, string][] = [
  ['A1', 1, 3, 'Turma calma; dois alunos ainda com receio na imersão.'],
  ['B1', 2, 4, 'Boa evolução no crol com respiração lateral.'],
  ['A2', 5, 3, ''],
  ['C', 7, 4, 'Trabalhar a viragem de bruços na próxima aula.'],
  ['A1', 8, 2, ''],
  ['B1', 12, 3, 'Faltaram 3 alunos.'],
  ['D', 14, 4, ''],
]

const SHEETS = [
  {
    title: 'Crol: respiração e alinhamento',
    levelId: 'B1',
    days: 2,
    focus: 'Respiração lateral bilateral',
    totalDistance: 900,
    sections: [
      { title: 'Aquecimento', rest: '1:00', items: ['4×50 m crol fácil', '4×25 m costas'] },
      { title: 'Técnica', rest: '1:30', items: ['6×25 m crol com prancha, respiração a cada 3', '4×25 m crol só braço direito/esquerdo'] },
      { title: 'Série Principal', rest: '2:00', items: ['4×75 m crol, respiração bilateral'] },
      { title: 'Retorno à Calma', rest: '0:00', items: ['100 m livre fácil'] },
    ],
  },
  {
    title: 'Bruços: pernada e viragem',
    levelId: 'C',
    days: 7,
    focus: 'Pernada de bruços e viragem com duas mãos',
    totalDistance: 1400,
    sections: [
      { title: 'Aquecimento', rest: '1:00', items: ['200 m estilos fácil', '4×50 m bruços'] },
      { title: 'Técnica', rest: '1:30', items: ['8×25 m pernada de bruços com prancha', '6×25 m viragem de bruços'] },
      { title: 'Série Principal', rest: '2:00', items: ['6×100 m bruços a ritmo moderado'] },
      { title: 'Retorno à Calma', rest: '0:00', items: ['200 m costas fácil'] },
    ],
  },
  {
    title: 'Adaptação: imersão e flutuação',
    levelId: 'A1',
    days: 1,
    focus: 'Confiança na água',
    totalDistance: null,
    sections: [
      { title: 'Aquecimento', rest: '1:00', items: ['Entrada pela escada e deslocamentos agarrados à borda'] },
      { title: 'Técnica', rest: '1:30', items: ['Soprar bolhas', 'Apanhar argolas no fundo', 'Estrela de barriga para cima com apoio'] },
      { title: 'Série Principal', rest: '2:00', items: ['Jogo do comboio com esparguete'] },
      { title: 'Retorno à Calma', rest: '0:00', items: ['Flutuação livre com material'] },
    ],
  },
]

async function clear() {
  const s = await db.delete(schema.classSummary).where(like(schema.classSummary.id, `${PREFIX}%`)).returning({ id: schema.classSummary.id })
  const w = await db.delete(schema.workoutSheet).where(like(schema.workoutSheet.id, `${PREFIX}%`)).returning({ id: schema.workoutSheet.id })
  console.log(`Exemplos apagados: ${s.length} sumários, ${w.length} fichas`)
}

async function create() {
  const [instructor] = await db.select({ id: schema.user.id }).from(schema.user).where(eq(schema.user.email, DEMO_EMAIL)).limit(1)
  const createdById = instructor?.id ?? null
  const contents = await db.select().from(schema.levelContent)
  const exercises = await db.select({ id: schema.exercise.id, code: schema.exercise.code }).from(schema.exercise)
  const exerciseByCode = new Map(exercises.map((e) => [e.code, e.id]))

  let summaries = 0
  for (const [i, [levelId, days, count, note]] of SUMMARIES.entries()) {
    const date = daysAgo(days)
    const month = SEASON[new Date(date).getMonth()]
    const levelContents = contents
      .filter((c) => c.levelCode === levelId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
    // Conteúdos calendarizados para o mês da aula; se não houver, os primeiros do nível.
    const inMonth = levelContents.filter((c) => c.months.includes(month))
    const picked = (inMonth.length ? inMonth : levelContents).slice(i % 2, (i % 2) + count)
    if (!picked.length) continue
    const exerciseIds = picked
      .flatMap((c) => c.exerciseCodes)
      .map((code) => exerciseByCode.get(code))
      .filter((id): id is string => Boolean(id))
      .slice(0, 2)
    const text = [
      `Sumário · ${levelId} · ${date.split('-').reverse().join('/')}`,
      '',
      ...picked.map((c) => `- ${c.title}`),
      ...(note ? ['', `Observações: ${note}`] : []),
    ].join('\n')
    await db.insert(schema.classSummary).values({
      id: `${PREFIX}sumario-${i + 1}`,
      date,
      levelId,
      contentIds: picked.map((c) => c.id),
      exerciseIds,
      notes: text,
      createdById,
    })
    summaries += 1
  }

  for (const [i, sheet] of SHEETS.entries()) {
    const { days, ...rest } = sheet
    await db.insert(schema.workoutSheet).values({ ...rest, id: `${PREFIX}ficha-${i + 1}`, sessionDate: daysAgo(days), createdById })
  }
  console.log(`Exemplos criados: ${summaries} sumários, ${SHEETS.length} fichas de treino`)
}

async function main() {
  await clear()
  if (!process.argv.includes('--limpar')) await create()
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
