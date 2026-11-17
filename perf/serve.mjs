// Servidor de produção mínimo para os testes de carga (Node puro, sem dependências).
// Serve dist/client como estático e passa o resto ao handler do TanStack Start (dist/server/server.js).
//   PORT=3000 WORKERS=1 COMPRESS=1 node perf/serve.mjs
// WORKERS>1 usa node:cluster (um processo por núcleo, como várias instâncias atrás de um balanceador).
import 'dotenv/config'
import cluster from 'node:cluster'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { Readable } from 'node:stream'
import { monitorEventLoopDelay } from 'node:perf_hooks'

const PORT = Number(process.env.PORT || 3000)
const WORKERS = Number(process.env.WORKERS || 1)
const COMPRESS = process.env.COMPRESS !== '0'
const ROOT = path.resolve('dist/client')

if (cluster.isPrimary && WORKERS > 1) {
  for (let i = 0; i < WORKERS; i++) cluster.fork()
  cluster.on('exit', (w, code) => console.error(`[serve] worker ${w.process.pid} saiu (${code})`))
} else {
  const { default: app } = await import(path.resolve('dist/server/server.js'))
  const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2', '.txt': 'text/plain' }
  const COMPRESSIBLE = /^(text\/|application\/(json|javascript|x-ndjson))/

  // Métricas do processo para os relatórios (lidas em /__perf, só existe neste servidor de teste).
  const lag = monitorEventLoopDelay({ resolution: 10 }); lag.enable()
  let inflight = 0

  function pickEncoding(req, type) {
    if (!COMPRESS || !type || !COMPRESSIBLE.test(type)) return null
    const ae = String(req.headers['accept-encoding'] || '')
    return ae.includes('br') ? 'br' : ae.includes('gzip') ? 'gzip' : null
  }
  function encoder(enc) {
    return enc === 'br' ? zlib.createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } }) : zlib.createGzip({ level: 6 })
  }

  function serveStatic(req, res, urlPath) {
    const file = path.join(ROOT, decodeURIComponent(urlPath))
    if (!file.startsWith(ROOT)) return false
    let stat
    try { stat = fs.statSync(file) } catch { return false }
    if (!stat.isFile()) return false
    const type = TYPES[path.extname(file)] || 'application/octet-stream'
    const etag = `W/"${stat.size.toString(16)}-${stat.mtimeMs.toString(16)}"`
    const headers = {
      'content-type': type,
      etag,
      // Ficheiros com hash no nome nunca mudam; as imagens podem mudar de conteúdo com o mesmo nome.
      'cache-control': urlPath.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=86400, stale-while-revalidate=604800',
      vary: 'accept-encoding',
    }
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return true }
    const enc = pickEncoding(req, type)
    if (enc) { headers['content-encoding'] = enc; res.writeHead(200, headers); fs.createReadStream(file).pipe(encoder(enc)).pipe(res) }
    else { headers['content-length'] = stat.size; res.writeHead(200, headers); fs.createReadStream(file).pipe(res) }
    return true
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
    if (url.pathname === '/__perf') {
      const m = process.memoryUsage()
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ pid: process.pid, inflight, rssMB: +(m.rss / 1048576).toFixed(1), heapMB: +(m.heapUsed / 1048576).toFixed(1), lagP99ms: +(lag.percentile(99) / 1e6).toFixed(1), lagMaxms: +(lag.max / 1e6).toFixed(1) }))
      lag.reset(); return
    }
    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname !== '/' && serveStatic(req, res, url.pathname)) return
    inflight++
    try {
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req)
      const request = new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half' })
      const response = await app.fetch(request)
      const headers = {}
      response.headers.forEach((v, k) => { if (k !== 'set-cookie') headers[k] = v })
      const cookies = response.headers.getSetCookie?.() ?? []
      if (cookies.length) headers['set-cookie'] = cookies
      const enc = response.body ? pickEncoding(req, response.headers.get('content-type')) : null
      if (enc) { headers['content-encoding'] = enc; headers['vary'] = 'accept-encoding'; delete headers['content-length'] }
      res.writeHead(response.status, headers)
      if (!response.body) return res.end()
      const src = Readable.fromWeb(response.body)
      ;(enc ? src.pipe(encoder(enc)) : src).pipe(res)
    } catch (err) {
      console.error('[serve]', err)
      if (!res.headersSent) res.writeHead(500)
      res.end()
    } finally { inflight-- }
  })
  server.keepAliveTimeout = 65_000
  server.listen(PORT, () => console.log(`[serve] pid ${process.pid} em http://localhost:${PORT} (compressão ${COMPRESS ? 'on' : 'off'})`))
}

// Saída limpa (necessário para o --cpu-prof escrever o perfil).
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(0))
