// Teste de carga da Escola Aquática. Escolhe o cenário com SCENARIO=smoke|ramp|spike|soak|stress.
//   k6 run -e SCENARIO=smoke perf/k6/load.js       (ou usa perf/run.sh, que trata dos ids e das métricas)
// Parâmetros: PLATEAU (duração de cada patamar da rampa, por omissão 5m), MAX_VUS (alvo, 5000),
// SOAK_VUS (1000), SOAK_DURATION (30m), STRESS_STEP (250 VUs), STRESS_STEP_TIME (1m), THINK (multiplicador).
import { instructorJourney, ENDPOINTS } from './lib.js'

const SCENARIO = __ENV.SCENARIO || 'smoke'
const PLATEAU = __ENV.PLATEAU || '5m'
const MAX_VUS = Number(__ENV.MAX_VUS || 5000)
const RAMP_STEPS = (__ENV.RAMP_STEPS || '100,500,1000,3000,5000').split(',').map(Number)

function rampStages() {
  const stages = []
  for (const target of RAMP_STEPS) stages.push({ duration: '1m', target }, { duration: PLATEAU, target })
  stages.push({ duration: '1m', target: 0 })
  return stages
}

function stressStages() {
  const step = Number(__ENV.STRESS_STEP || 250)
  const time = __ENV.STRESS_STEP_TIME || '1m'
  const stages = []
  for (let v = step; v <= Number(__ENV.STRESS_MAX || 2000); v += step) stages.push({ duration: '15s', target: v }, { duration: time, target: v })
  return stages
}

const SCENARIOS = {
  smoke: { executor: 'constant-vus', vus: 1, duration: __ENV.DURATION || '1m' },
  ramp: { executor: 'ramping-vus', startVUs: 0, stages: rampStages(), gracefulRampDown: '30s' },
  spike: {
    executor: 'ramping-vus', startVUs: 0, gracefulRampDown: '30s',
    stages: [{ duration: '30s', target: MAX_VUS }, { duration: '2m', target: MAX_VUS }, { duration: '10s', target: 0 }, { duration: '2m', target: 0 }],
  },
  // Recuperação: depois do pico, 50 VUs durante 2 min para ver se o sistema volta ao normal.
  soak: { executor: 'constant-vus', vus: Number(__ENV.SOAK_VUS || 1000), duration: __ENV.SOAK_DURATION || '30m' },
  stress: { executor: 'ramping-vus', startVUs: 0, stages: stressStages(), gracefulRampDown: '10s' },
}
if (SCENARIO === 'spike') {
  SCENARIOS.recovery = { executor: 'constant-vus', vus: 50, duration: '2m', startTime: '4m40s', tags: { phase: 'recovery' } }
}

// SLO (ver perf/README.md): leituras p95 ≤ 300 ms, escritas p95 ≤ 800 ms, tudo p99 ≤ 1 s, erros < 0,1%.
const thresholds = {
  'http_req_duration{kind:read}': ['p(95)<300'],
  'http_req_duration{kind:write}': ['p(95)<800'],
  'http_req_duration{kind:static}': ['p(95)<300'],
  http_req_duration: ['p(99)<1000'],
  http_req_failed: ['rate<0.001'],
  app_errors: ['rate<0.001'],
}
if (SCENARIO === 'stress') {
  // No stress o objetivo é encontrar o ponto de rutura. Os thresholds do k6 são cumulativos, por isso o ponto
  // de rutura lê-se em timeline.txt (janelas de 30 s); o teste só é abortado se o sistema colapsar (>5% erros).
  thresholds.http_req_failed = [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '1m' }]
}
// Sub-métricas por endpoint (só para aparecerem no resumo; não falham o teste).
for (const name of ENDPOINTS) thresholds[`http_req_duration{name:${name}}`] = ['max>=0']

export const options = {
  scenarios: SCENARIO === 'spike' ? { spike: SCENARIOS.spike, recovery: SCENARIOS.recovery } : { [SCENARIO]: SCENARIOS[SCENARIO] },
  thresholds,
  summaryTrendStats: ['avg', 'med', 'p(95)', 'p(99)', 'max', 'count'],
  discardResponseBodies: false,
  // Cada VU é um utilizador com sessão própria: mantém os cookies entre iterações (por omissão o k6 limpa-os).
  noCookiesReset: true,
  noConnectionReuse: false,
  userAgent: 'k6-escola-aquatica-perf',
}

export default function () {
  instructorJourney()
}

export function handleSummary(data) {
  const out = __ENV.OUT_DIR || 'perf/results'
  return {
    stdout: compactSummary(data),
    [`${out}/k6-summary.json`]: JSON.stringify(data, null, 1),
  }
}

// Resumo curto: SLO globais e tabela por endpoint (p50/p95/p99, pedidos e falhas).
function compactSummary(data) {
  const m = data.metrics
  const fmt = (v) => (v === undefined ? '-' : v >= 100 ? v.toFixed(0) : v.toFixed(1))
  const lines = []
  const reqs = m.http_reqs ? m.http_reqs.values : { count: 0, rate: 0 }
  lines.push(`\n== ${SCENARIO} ==  pedidos ${reqs.count}  RPS médio ${fmt(reqs.rate)}  VUs máx ${m.vus_max ? m.vus_max.values.max : '-'}  iterações ${m.iterations ? m.iterations.values.count : 0}`)
  lines.push(`falhas http ${m.http_req_failed ? (m.http_req_failed.values.rate * 100).toFixed(3) : '-'}%  ·  erros da app (HTTP 200 com erro) ${m.app_errors ? (m.app_errors.values.rate * 100).toFixed(3) : '-'}%`)
  lines.push('endpoint'.padEnd(28) + 'n'.padStart(8) + 'p50'.padStart(9) + 'p95'.padStart(9) + 'p99'.padStart(9) + 'max'.padStart(9))
  for (const key of Object.keys(m).filter((k) => k.startsWith('http_req_duration{')).sort()) {
    const v = m[key].values
    if (!v.count) continue
    lines.push(key.replace('http_req_duration', '').padEnd(28) + String(v.count).padStart(8) + fmt(v.med).padStart(9) + fmt(v['p(95)']).padStart(9) + fmt(v['p(99)']).padStart(9) + fmt(v.max).padStart(9))
  }
  const failed = Object.entries(m).filter(([, x]) => x.thresholds && Object.values(x.thresholds).some((t) => !t.ok)).map(([k]) => k)
  lines.push(failed.length ? `SLO FALHADOS: ${failed.join(', ')}` : 'SLO: todos cumpridos')
  return lines.join('\n') + '\n'
}
