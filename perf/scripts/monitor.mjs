// Amostra a cada 2 s: CPU/RSS por processo (node do servidor, postgres, k6), CPU total da máquina,
// métricas do servidor (/__perf: event-loop lag, heap) e do Postgres (ligações, locks, cache hit, TPS).
// Uso: node perf/scripts/monitor.mjs <ficheiro.ndjson>   (pára com SIGTERM e escreve um resumo)
import 'dotenv/config'
import fs from 'node:fs'
import postgres from 'postgres'

const out = process.argv[2] || 'monitor.ndjson'
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 0 })
const HZ = 100
const rows = []

function procs() {
  const res = {}
  for (const pid of fs.readdirSync('/proc').filter((d) => /^\d+$/.test(d))) {
    try {
      const cmd = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ')
      const group = cmd.includes('perf/serve.mjs') ? 'server' : cmd.startsWith('postgres') || cmd.includes('/postgres ') ? 'postgres' : cmd.startsWith('k6 ') || cmd.includes('/k6 ') ? 'k6' : null
      if (!group) continue
      const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8').split(') ')[1].split(' ')
      const ticks = Number(stat[11]) + Number(stat[12])
      const rss = Number(stat[21]) * 4096
      res[group] ??= { ticks: 0, rss: 0, n: 0 }
      res[group].ticks += ticks; res[group].rss += rss; res[group].n++
    } catch {}
  }
  return res
}
function cpuTotal() {
  const [, ...v] = fs.readFileSync('/proc/stat', 'utf8').split('\n')[0].trim().split(/\s+/)
  const n = v.map(Number); const idle = n[3] + n[4]; const total = n.reduce((a, b) => a + b, 0)
  return { idle, total }
}

let prevP = procs(), prevC = cpuTotal(), prevT = Date.now(), prevDb = null
async function sample() {
  const now = Date.now(), dt = (now - prevT) / 1000
  const p = procs(), c = cpuTotal()
  const row = { t: new Date(now).toISOString(), cpuMachinePct: +(100 * (1 - (c.idle - prevC.idle) / (c.total - prevC.total))).toFixed(1) }
  for (const g of ['server', 'postgres', 'k6']) {
    if (!p[g]) continue
    row[`${g}CpuPct`] = +((100 * (p[g].ticks - (prevP[g]?.ticks ?? p[g].ticks))) / HZ / dt).toFixed(1) // 100% = 1 núcleo
    row[`${g}RssMB`] = +(p[g].rss / 1048576).toFixed(0)
  }
  try { Object.assign(row, await (await fetch(`${BASE}/__perf`)).json()) } catch { row.serverDown = true }
  try {
    const [a] = await sql`select count(*) filter (where state = 'active')::int active, count(*) filter (where state = 'idle')::int idle,
      count(*) filter (where wait_event_type = 'Lock')::int lockwaits, count(*)::int total from pg_stat_activity where datname = current_database()`
    const [d] = await sql`select xact_commit::bigint xc, blks_hit::bigint hit, blks_read::bigint rd, deadlocks::int dl from pg_stat_database where datname = current_database()`
    Object.assign(row, { pgActive: a.active, pgIdle: a.idle, pgLockWaits: a.lockwaits, pgConns: a.total })
    if (prevDb) {
      row.pgTps = +((Number(d.xc) - Number(prevDb.xc)) / dt).toFixed(0)
      const hit = Number(d.hit) - Number(prevDb.hit), rd = Number(d.rd) - Number(prevDb.rd)
      row.pgCacheHitPct = hit + rd ? +((100 * hit) / (hit + rd)).toFixed(2) : 100
      row.pgDeadlocks = d.dl
    }
    prevDb = d
  } catch (e) { row.pgError = String(e.message) }
  prevP = p; prevC = c; prevT = now
  rows.push(row)
  fs.appendFileSync(out, JSON.stringify(row) + '\n')
}

const timer = setInterval(sample, 2000)
async function stop() {
  clearInterval(timer)
  const keys = ['cpuMachinePct', 'serverCpuPct', 'serverRssMB', 'postgresCpuPct', 'k6CpuPct', 'k6RssMB', 'lagP99ms', 'heapMB', 'pgActive', 'pgConns', 'pgLockWaits', 'pgTps', 'pgCacheHitPct']
  const summary = {}
  for (const k of keys) {
    const v = rows.map((r) => r[k]).filter((x) => typeof x === 'number')
    if (!v.length) continue
    const s = [...v].sort((a, b) => a - b)
    summary[k] = { avg: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1), p95: s[Math.floor(s.length * 0.95)], max: s[s.length - 1], first: v[0], last: v[v.length - 1] }
  }
  summary.samples = rows.length
  summary.serverDownSamples = rows.filter((r) => r.serverDown).length
  fs.writeFileSync(out.replace(/\.ndjson$/, '-summary.json'), JSON.stringify(summary, null, 1))
  await sql.end({ timeout: 1 })
  process.exit(0)
}
process.on('SIGTERM', stop); process.on('SIGINT', stop)
