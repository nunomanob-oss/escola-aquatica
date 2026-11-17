// Utilitários partilhados pelos cenários k6: codificação das funções de servidor do TanStack Start,
// login do Better Auth e as jornadas de utilizador.
import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Counter, Rate, Trend } from 'k6/metrics'
import crypto from 'k6/crypto'

export const BASE = __ENV.BASE_URL || 'http://localhost:3000'
// Ids das funções de servidor no build atual (mudam quando src/server/entities.ts muda).
// perf/run.sh deteta-os a partir de dist/client e passa-os por variável de ambiente.
const FN_LIST = __ENV.FN_LIST
const FN_WRITE = __ENV.FN_WRITE
const FN_SESSION = __ENV.FN_SESSION
const USERS = Number(__ENV.USERS || 50000)
const STATIC = __ENV.STATIC === '1'
const THINK = Number(__ENV.THINK || 1) // multiplicador do think time (0 = sem pausas)
// Fração de VUs que já têm sessão aberta (cookie válido) e não fazem login; os restantes fazem login com palavra-passe.
const RETURNING = Number(__ENV.RETURNING ?? 0.9)
const SECRET = __ENV.BETTER_AUTH_SECRET
const DEBUG = __ENV.DEBUG === '1'
const PASSWORD = __ENV.PASSWORD || 'instrutor123'

const IMAGES = JSON.parse(open('./data/images.json'))
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'M']

export const errors = new Counter('errors_by_type')
export const payloadBytes = new Trend('payload_bytes')

// --- Codificação seroval (formato das funções de servidor do TanStack Start) ---
function enc(value, ctx) {
  if (value === undefined) return { t: 2, s: 1 }
  if (value === true) return { t: 2, s: 2 }
  if (value === false) return { t: 2, s: 3 }
  if (typeof value === 'number') return { t: 0, s: value }
  if (typeof value === 'string') return { t: 1, s: value }
  if (Array.isArray(value)) return { t: 9, i: ctx.id++, l: value.length, a: value.map((v) => enc(v, ctx)), o: 0 }
  const keys = Object.keys(value)
  return { t: 10, i: ctx.id++, p: { k: keys, v: keys.map((k) => enc(value[k], ctx)) }, o: 0 }
}
const serialize = (data) => JSON.stringify({ t: enc({ data }, { id: 0 }), f: 127, m: [] })

function headers(vuIp, referer) {
  return {
    'x-tsr-serverFn': 'true',
    'sec-fetch-site': 'same-origin',
    origin: BASE,
    referer: `${BASE}${referer}`,
    'accept-encoding': 'br, gzip',
    'x-forwarded-for': vuIp,
  }
}

const vuIp = () => `10.${(__VU >> 16) & 255}.${(__VU >> 8) & 255}.${__VU & 255}`

// As funções de servidor do TanStack Start devolvem erros com HTTP 200 e {"k":["error"]} no corpo,
// por isso o estado HTTP não chega: verifica-se também o corpo.
export const appErrors = new Rate('app_errors')
function record(res, name, kind) {
  const httpOk = (res.status >= 200 && res.status < 300) || res.status === 304
  const appError = httpOk && typeof res.body === 'string' && res.body.startsWith('{"t":10,"i":0,"p":{"k":["error"]')
  const ok = check(res, { [`${name} 2xx`]: () => httpOk, [`${name} sem erro da app`]: () => !appError })
  if (name.startsWith('list:') || name.startsWith('write:') || name.startsWith('fn:')) appErrors.add(!ok, { name })
  // Sessão inválida: como a app, volta ao ecrã de login na próxima iteração.
  if (appError && String(res.body).includes('Não autenticado')) state.loggedIn = false
  if (!ok) errors.add(1, { name, kind, status: String(res.status), error: appError ? 'app:' + (String(res.body).match(/"s":"([^"]{0,60})"/) || [])[1] : res.error_code ? String(res.error_code) : 'http' })
  if (res.body !== null && res.body !== undefined) payloadBytes.add(res.body.length, { name })
  return ok
}

function list(entity, { query = {}, sort, descending = false, limit = 500 } = {}, page) {
  const payload = serialize({ entity, query, sort, descending, limit })
  const name = `list:${entity}`
  const url = `${BASE}/_serverFn/${FN_LIST}?payload=${encodeURIComponent(payload)}`
  // Como o browser: se a resposta anterior trouxe ETag, revalida com If-None-Match (304 = usa a cópia local).
  const h = headers(vuIp(), page)
  if (state.etags[url]) h['if-none-match'] = state.etags[url]
  const res = http.get(url, {
    headers: h,
    tags: { name, kind: 'read' },
    responseType: 'text',
  })
  if (res.headers.Etag) state.etags[url] = res.headers.Etag
  if (DEBUG) console.log(name, res.status, res.timings.duration.toFixed(1), String(res.body).slice(0, 160))
  record(res, name, 'read')
  return res
}

function write(entity, op, data, id, page) {
  const name = `write:${entity}:${op}`
  const body = serialize(id ? { entity, op, id, data } : { entity, op, data })
  const res = http.post(`${BASE}/_serverFn/${FN_WRITE}`, body, {
    headers: { ...headers(vuIp(), page), 'content-type': 'application/json' },
    tags: { name, kind: 'write' },
    responseType: 'text',
  })
  record(res, name, 'write')
  return res
}

function session(page) {
  const res = http.get(`${BASE}/_serverFn/${FN_SESSION}`, { headers: headers(vuIp(), page), tags: { name: 'fn:session', kind: 'read' }, responseType: 'text' })
  record(res, 'fn:session', 'read')
}

const think = (min, max) => THINK > 0 && sleep(THINK * (min + Math.random() * (max - min)))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Estado por VU (cada VU é um instrutor diferente, com browser e cookies próprios).
const state = { loggedIn: false, assets: null, iter: 0, sheets: [], etags: {} }

const userIndex = () => ((__VU - 1) % USERS) + 1

// Utilizador que volta à app com a sessão dos dias anteriores: cookie assinado (HMAC-SHA256, como o Better Auth)
// para uma sessão criada por seed-volume.sql ('perf-live-<n>').
function resumeSession() {
  const token = `perf-live-${userIndex()}`
  const signature = crypto.hmac('sha256', SECRET, token, 'base64')
  http.cookieJar().set(BASE, 'better-auth.session_token', encodeURIComponent(`${token}.${signature}`), { path: '/' })
  state.loggedIn = true
}

export function login() {
  const user = userIndex()
  const res = http.post(`${BASE}/api/auth/sign-in/email`, JSON.stringify({ email: `perf-${user}@carga.test`, password: PASSWORD }), {
    headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': vuIp() },
    tags: { name: 'auth:sign-in', kind: 'write' },
    responseType: 'none',
  })
  state.loggedIn = record(res, 'auth:sign-in', 'write')
}

function logout() {
  const res = http.post(`${BASE}/api/auth/sign-out`, '{}', {
    headers: { 'content-type': 'application/json', origin: BASE, 'x-forwarded-for': vuIp() },
    tags: { name: 'auth:sign-out', kind: 'write' },
    responseType: 'none',
  })
  if (DEBUG) console.log('LOGOUT')
  if (DEBUG) console.log('LOGOUT')
  record(res, 'auth:sign-out', 'write')
  http.cookieJar().clear(BASE)
  state.loggedIn = false
}

// Abrir a app: HTML + JS/CSS (só na primeira visita, depois fica na cache do browser).
function openApp(path) {
  const res = http.get(`${BASE}${path}`, { tags: { name: 'page:html', kind: 'read' }, headers: { 'accept-encoding': 'br, gzip' } })
  record(res, 'page:html', 'read')
  if (STATIC && !state.assets && res.body) {
    state.assets = [...new Set(String(res.body).match(/\/assets\/[^"']+\.(js|css)/g) || [])]
    http.batch(state.assets.map((a) => ['GET', `${BASE}${a}`, null, { tags: { name: 'static:asset', kind: 'static' }, headers: { 'accept-encoding': 'br, gzip' }, responseType: 'none' }]))
  }
}

function images(n) {
  if (!STATIC) return
  const reqs = []
  for (let i = 0; i < n; i++) reqs.push(['GET', `${BASE}/exercicios/${pick(IMAGES)}`, null, { tags: { name: 'static:image', kind: 'static' }, responseType: 'none' }])
  http.batch(reqs).forEach((r) => record(r, 'static:image', 'static'))
}

// Jornada de um instrutor: abre Níveis, consulta a Biblioteca, às vezes vê/cria fichas e marca exercícios dados.
export function instructorJourney() {
  state.iter++
  if (!state.loggedIn && state.iter === 1 && SECRET && (__VU % 100) < RETURNING * 100) resumeSession()
  if (!state.loggedIn) {
    group('login', () => { openApp('/login'); login() })
    if (!state.loggedIn) { think(2, 5); return }
  }

  group('niveis', () => {
    openApp('/niveis')
    session('/niveis')
    list('Level', { limit: 100 }, '/niveis')
    list('LevelContent', { sort: 'order_index', limit: 1000 }, '/niveis')
    list('Exercise', { sort: 'order_index', limit: 500 }, '/niveis')
  })
  think(5, 15)

  // Marcar exercícios dados na aula de hoje (sumário): procura o sumário do dia e cria ou atualiza.
  if (Math.random() < 0.3) {
    group('sumario', () => {
      const date = `2026-${String(1 + (__VU % 12)).padStart(2, '0')}-${String(1 + (state.iter % 28)).padStart(2, '0')}`
      const level = LEVELS[__VU % LEVELS.length]
      const res = list('ClassSummary', { query: { date, level_id: level }, limit: 1 }, '/niveis')
      // Corpo em JSON simples ([{"id":...}]) ou no formato seroval antigo.
      const existing = res.status === 200 && res.body && String(res.body).match(/^\[\{"id":"([^"]+)"|"id"\],"v":\[\{"t":1,"s":"([^"]+)"/)
      const exerciseIds = [`EX-00${1 + Math.floor(Math.random() * 9)}`, `EX-01${Math.floor(Math.random() * 10)}`]
      if (existing) write('ClassSummary', 'update', { exercise_ids: exerciseIds }, existing[1] || existing[2], '/niveis')
      else write('ClassSummary', 'create', { date, level_id: level, exercise_ids: exerciseIds }, null, '/niveis')
    })
    think(3, 8)
  }

  group('biblioteca', () => {
    session('/biblioteca')
    list('Level', { limit: 100 }, '/biblioteca')
    list('Exercise', { sort: 'order_index', limit: 500 }, '/biblioteca')
    images(8)
  })
  think(5, 15)

  if (Math.random() < 0.4) {
    group('aulas', () => {
      session('/aulas')
      list('Level', { limit: 100 }, '/aulas')
      list('WorkoutSheet', { sort: 'session_date', descending: true, limit: 500 }, '/aulas')
    })
    think(5, 15)

    if (Math.random() < 0.5) {
      group('ficha', () => {
        const res = write('WorkoutSheet', 'create', {
          title: `Ficha k6 VU${__VU} it${state.iter}`,
          level_id: LEVELS[__VU % LEVELS.length],
          session_date: '2026-11-18',
          focus: 'Tecnica',
          sections: [{ title: 'Aquecimento', rest: '20s', items: ['4x25 crol', '2x50 costas'] }],
          total_distance: 600,
        }, null, '/aulas')
        const id = res.status === 200 && String(res.body).match(/"id".*?"s":"([0-9a-f-]{36})"/)
        if (id && Math.random() < 0.3) {
          think(5, 10)
          write('WorkoutSheet', 'update', { notes: `editada ${state.iter}` }, id[1], '/aulas')
        }
      })
      think(3, 8)
    }
  }

  // De vez em quando o instrutor sai e volta a entrar.
  if (Math.random() < 0.05) logout()
}

export const ENDPOINTS = ['auth:sign-in', 'auth:sign-out', 'page:html', 'fn:session', 'list:Level', 'list:LevelContent', 'list:Exercise', 'list:WorkoutSheet', 'list:ClassSummary', 'write:ClassSummary:create', 'write:ClassSummary:update', 'write:WorkoutSheet:create', 'write:WorkoutSheet:update', 'static:asset', 'static:image']
