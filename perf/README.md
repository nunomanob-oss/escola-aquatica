# Performance e carga: levantamento (Fase 0) e auditoria (Fase 1)

Relatório final com números e veredito: [REPORT.md](REPORT.md). Este ficheiro descreve a app, o que foi
auditado no código e como correr os testes.

## 1. O que é a app

**Tipo (C) misto**: SPA React servida por um servidor Node (TanStack Start), com API própria (funções de
servidor) e base de dados PostgreSQL. As páginas autenticadas têm `ssr: false` (o servidor só envia a
"casca" HTML; os dados chegam por chamadas à API depois de o JS arrancar).

| Camada | Detalhe |
| --- | --- |
| Frontend | React 19, TanStack Router, Tailwind 4, shadcn/ui. three.js só na demonstração 3D (chunk à parte, carregado a pedido). |
| Servidor | TanStack Start 1.169 sobre Vite 8. O build (`dist/server/server.js`) é um *fetch handler*; não há adaptador de alojamento configurado. Para os testes usa-se [`serve.mjs`](serve.mjs) (Node `http`, estáticos com `Cache-Control`/ETag, gzip/brotli). |
| Autenticação | Better Auth 1.7 (email + palavra-passe com scrypt; Google opcional). Sessão em cookie assinado, validada **na base de dados em cada pedido**. |
| Base de dados | PostgreSQL via `postgres.js` + Drizzle. Pool de **10 ligações por processo** (`src/db/index.ts:12`). |
| Cache | Nenhuma no servidor (antes deste trabalho). No browser, `localStorage` como cópia para uso sem rede. |
| Filas / trabalho assíncrono | Nenhum. Fila offline no browser (`offlineQueue.js`) para escritas feitas sem rede. |
| Serviços externos | Nenhum no caminho do pedido. YouTube (iframe) no detalhe de exercícios com vídeo; Google OAuth se configurado. **Sem links do Google Drive.** |
| Alojamento / CDN | **Ainda não há deploy.** Falou-se de Vercel + Neon. Não há Dockerfile, `vercel.json` nem configuração de CDN no repositório. |

### Rotas e pedidos

| Rota | O que pede ao servidor ao abrir |
| --- | --- |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | HTML (SSR) + `POST /api/auth/*` |
| `/` e `/painel` | redirecionam para `/niveis` |
| `/niveis` | sessão + `Level` (11) + `LevelContent` (245, ~170 KB) + **`Exercise` (todos, ~870 KB)** |
| `/biblioteca` | sessão + `Level` + **`Exercise` (todos, ~870 KB)** + imagens dos cartões (WebP, `loading="lazy"`) |
| `/aulas` (e `/treinos`) | sessão + `Level` + `WorkoutSheet` (até 500, ordenadas por data, **de todos os utilizadores**) |
| escritas | `POST /_serverFn/<id>` (`entityWrite`): criar/editar/apagar fichas, sumários e exercícios |

Todas as listas passam por uma única função genérica, `entityList` (`src/server/entities.ts`), que faz
`getSession` (2 queries: sessão + utilizador) e depois `SELECT <todas as colunas> FROM <tabela> [WHERE] [ORDER BY] LIMIT n`.

### Volume de dados

| Tabela | Real hoje | Massa de teste ([seed-volume.sql](scripts/seed-volume.sql)) |
| --- | --- | --- |
| user / account | 2 | 50 002 |
| session | poucas | 150 000 (100k antigas + 1 válida por utilizador) |
| exercise | 326 (151 do programa + 175 da biblioteca) | 426 (+100 personalizados) |
| level_content / level | 245 / 11 | iguais |
| workout_sheet | 3 | 200 000 |
| class_summary | 7 | 500 000 |

Assets: 326 imagens WebP (13 MB no total, 10–108 KB cada); JS do cliente 1,5 MB em bruto, o chunk inicial
`index` tem 320 KB (100 KB gzip); three.js (582 KB) só carrega na demo 3D; CSS 77 KB.

## 2. Auditoria estática (Fase 1)

Gravidade: crítico / alto / médio / baixo. "Confirmação" diz como foi (ou será) medido; os ganhos medidos
estão em [REPORT.md](REPORT.md#4-achados).

| # | Achado | Onde | Impacto esperado | Grav. | Esforço | Confirmação |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Lista completa de exercícios (todas as colunas, ~870 KB JSON, 134 KB brotli) pedida em **cada** abertura de Níveis e Biblioteca, sem cache nem ETag. O servidor converte cada linha (`toApi`) e serializa com seroval em cada pedido. | `src/pages/Niveis.jsx:48`, `src/pages/Biblioteca.jsx:56`, `src/server/entities.ts` (`entityList`) | CPU do servidor por pedido ~60–90 ms; satura 1 núcleo com poucas dezenas de pedidos/s | **crítico** | médio | perfil de CPU (`--cpu-prof`) + k6 antes/depois |
| A2 | "Paginação" falsa: `fetchAll` pede 500 e o servidor nunca devolve `next_cursor`. Com mais de 500 exercícios a lista é **cortada em silêncio**; os personalizados têm `order_index = 0` e passam à frente, por isso os primeiros a desaparecer são os da biblioteca. O mesmo para fichas (> 500 fichas = as mais antigas somem). | `src/components/swim/offlineCache.js:46`, `src/lib/entities.ts:41` | Bug funcional a partir de 500 linhas; cresce com o nº de utilizadores | **alto** | médio | contagem com 826 exercícios na massa de teste |
| A3 | Sessão validada na BD em cada chamada (sem `cookieCache`). Uma página faz 3–4 chamadas → 6–8 queries só de sessão. | `src/lib/auth.ts`, `src/server/entities.ts:currentUser` | Carga na BD e latência proporcional ao nº de chamadas | médio | baixo | `pg_stat_statements` |
| A4 | Login com scrypt (correto por segurança) corre no *thread pool* do libuv (4 threads), partilhado com a compressão zlib. Muitos logins em simultâneo atrasam **todos** os pedidos. | Better Auth `crypto/password` | Picos de 8 s com 80 logins simultâneos | alto (em pico) | baixo (`UV_THREADPOOL_SIZE`, mais instâncias) | k6: 80 logins ao mesmo tempo |
| A5 | Erros da API devolvidos com **HTTP 200** (`{"error":...}` serializado). Balanceadores, alertas e dashboards de taxa de erro não os veem. | comportamento do TanStack Start em `entityList`/`entityWrite` | Observabilidade cega | médio | baixo | k6 conta-os à parte (`app_errors`) |
| A6 | Pool de 10 ligações por processo; com várias instâncias/serverless multiplica (10 × N) contra o limite do Postgres alojado. | `src/db/index.ts:12` | Esgotamento de ligações ao escalar horizontalmente | médio | baixo | monitor `pgConns` |
| A7 | Fichas de treino: lista de **todos** os utilizadores (até 500) em cada abertura de Aulas, ~440 KB. Com 200k fichas a query usa o índice (`workout_sheet_date_idx`), mas o payload é grande. É também uma questão de produto (todos veem as fichas de todos?). | `src/pages/Treinos.jsx:38` | ~40–60 ms por pedido; payload grande em rede móvel | médio | médio (decisão de produto) | k6 por endpoint |
| A8 | Escrita do sumário: ler-depois-escrever sem transação nem chave única (`date`,`level_id`) → dois cliques/dispositivos simultâneos criam dois sumários (race condition). | `src/components/swim/offlineQueue.js:24-31` | Duplicados, não lentidão | baixo | baixo (índice único + upsert; é migração) | revisão de código |
| A9 | Esquema Drizzle (definições de tabelas) entra no bundle do cliente, porque `src/server/entities.ts` importa `@/db/schema` no topo. | chunk `offlineQueue-*.js` (42 KB) | Peso de JS desnecessário | baixo | baixo | inspeção do bundle |
| A10 | Rate limiting do Better Auth é **em memória por processo** e confia em `x-forwarded-for`. Com várias instâncias, cada uma tem o seu contador. | Better Auth (omissão) | Limites menos eficazes ao escalar | baixo | baixo (storage `database`/Redis) | revisão de configuração |
| A11 | Sem compressão nem cabeçalhos de cache no build (dependem do alojamento). `vite preview` não é servidor de produção. | `vite.config.ts`, sem adaptador | Se o alojamento não comprimir, 870 KB por pedido | médio | baixo (Vercel/Netlify fazem-no) | `curl` com/sem `Accept-Encoding` |

Verificado e **sem problema**: índices nas colunas filtradas/ordenadas (`workout_sheet.session_date`,
`class_summary(date, level_id)`, `session.token` único, `level_content.level_code`); imagens já em WebP
com `loading="lazy"`; three.js em chunk separado; devtools do TanStack removidas do build de produção;
sem Google Drive nem CDNs de terceiros; sem N+1 (cada lista é 1 query).

## 3. Como correr

Pré-requisitos: Node 22+, k6 (≥ 0.54), Postgres 16 com `pg_stat_statements`, base de dados de **teste**.

```bash
# 1) base de dados de teste + dados base
cp .env.example .env   # preencher BETTER_AUTH_SECRET
npm install && npm run db:migrate && npm run db:seed && npm run db:demo
psql "$DATABASE_URL" -c "create extension if not exists pg_stat_statements"   # requer shared_preload_libraries
psql "$DATABASE_URL" -f perf/scripts/seed-volume.sql                           # 50k utilizadores, 700k registos

# 2) build de produção e servidor (1 processo; WORKERS=4 para 4 processos)
npm run build
NODE_ENV=production WORKERS=1 node perf/serve.mjs &

# 3) cenários (resultados em perf/results/<data>-<cenário>-<etiqueta>/)
perf/run.sh smoke depois                                    # 1 VU, 1 min
PLATEAU=5m perf/run.sh ramp depois                          # 0→100→500→1000→3000→5000 VUs
perf/run.sh spike depois                                    # 0→5000 em 30 s, 2 min, recuperação
SOAK_VUS=1000 SOAK_DURATION=30m perf/run.sh soak depois     # fugas de memória/ligações
STRESS_STEP=50 STRESS_MAX=2000 perf/run.sh stress depois    # degrau a degrau até partir (ler timeline.txt)

# 4) limpar a massa de dados
psql "$DATABASE_URL" -f perf/scripts/cleanup-volume.sql
```

Cada pasta de resultados tem: `config.json` (commit, parâmetros, máquina, nº de linhas), `k6-stdout.txt`
(resumo por endpoint), `k6-summary.json`, `k6-raw.csv.gz` (todas as amostras), `timeline.txt` (janelas de
30 s com VUs, RPS, p50/p95/p99, erros, CPU do servidor e lag do event loop), `monitor.ndjson` e
`monitor-summary.json` (CPU/RAM por processo, event loop, ligações/locks/cache hit/TPS do Postgres) e
`pg-top-queries.txt` (`pg_stat_statements`).

Parâmetros úteis: `THINK` (multiplicador das pausas, 1 = 5–15 s entre páginas), `RETURNING` (fração de
utilizadores que já têm sessão; 0.9 por omissão, os restantes fazem login), `STATIC=1` (inclui JS/CSS e
imagens; desligado por omissão porque em produção devem vir de CDN), `BASE_URL`.

### A jornada simulada ([k6/lib.js](k6/lib.js))

Cada VU é um instrutor diferente (`perf-<n>@carga.test`, 50k contas), com cookies próprios e IP próprio
(`X-Forwarded-For`), e repete: abrir Níveis → (30%) marcar exercícios no sumário do dia (ler + criar/atualizar)
→ Biblioteca → (40%) Aulas → (50% destes) criar ficha, (30%) editá-la → (5%) sair. Pausas de 5–15 s entre
páginas. Como o browser, guarda ETags e revalida com `If-None-Match`. Os erros da app que chegam com HTTP 200
contam como falha (`app_errors`).
