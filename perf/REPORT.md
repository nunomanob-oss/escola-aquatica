# Relatório de carga e performance: Escola Aquática

Data: 2026-11-17 · base: `main` @ `ed91610` + as correções deste PR · como foi testado: [README.md](README.md)

Etiquetas: **MEDIDO** (resultado de um teste guardado em `perf/results/`), **ESTIMADO** (conta feita a
partir de medições) e **NÃO TESTADO**.

## 1. Resumo executivo

**Veredito: GO COM CONDIÇÕES.** Sem as correções deste PR é **NO-GO**.

1. No código atual, um processo do servidor aguenta **~100 utilizadores simultâneos**. Aos 150 o SLO de leitura falha e aos 600 as respostas levam 11 s (p95). Com 5.000 utilizadores há 51% de pedidos falhados e o servidor **não recupera** depois do pico (MEDIDO).
2. A causa está provada com um perfil de CPU e não está na base de dados. Cada abertura de Níveis ou de Biblioteca gera e serializa de novo a lista completa de exercícios (870 KB). O Postgres nunca passou de 25% de CPU (MEDIDO).
3. Duas correções resolvem a maior parte. A primeira é cache do catálogo validada na BD, com ETag/304. A segunda guarda a sessão num cookie assinado durante 5 min. Com elas, **um processo aguenta ~1.100 utilizadores (11×)** e dois aguentam **~1.600–2.000**. O soak de 30 min com 1.000 utilizadores passou: p95 de 17 ms, zero erros e memória estável (MEDIDO).
4. Para 5.000 utilizadores simultâneos dentro do SLO, e com CPU abaixo de 70%, são precisos **~7 núcleos de servidor** (ESTIMADO). Esta máquina tem 4 vCPU partilhados com o gerador de carga e o Postgres, por isso o patamar de 5.000 só foi atingido em degradação (MEDIDO).
5. Condições para GO: (a) fazer merge destas correções; (b) alojamento com ≥ 7 vCPU de servidor ou autoscaling, mais um pooler de ligações ao Postgres; (c) estáticos e imagens numa CDN; (d) voltar a correr esta suíte contra o ambiente de staging real antes de abrir a todos.

## 2. Capacidade máxima medida

"Capacidade" é o maior patamar em que todas as janelas de 30 s cumprem o SLO (`timeline.txt`). As colunas
"ponto de rutura" são o primeiro patamar que falha.

| Configuração | Capacidade (SLO cumprido) | Ponto de rutura | Margem face a 5.000 VUs | Fonte |
| --- | --- | --- | --- | --- |
| Antes, 1 processo | **100 VUs · ~37 RPS** (CPU 69%) | 150 VUs · 52 RPS | −98% (50× abaixo) | `20261117T165427Z-stress-antes` |
| Correção 1 (catálogo + ETag), 1 processo | **≥ 600 VUs · 224 RPS** (CPU 68%, o teste parou nos 600) | não atingido | −88% | `20261117T180011Z-stress-fixA` |
| Correções 1+2, 1 processo | **1.100 VUs · ~407 RPS** (CPU 89%) | 1.200 VUs | −78% | `20261117T181724Z-stress-fixB` |
| Correções 1+2, 2 processos | **1.600 VUs · ~592 RPS** (2.000 VUs passou numa janela; 1.800 e 2.200 falham) | 1.800–2.200 VUs · ~750 RPS | −60% a −68% | `20261117T183833Z-stress-depois-2proc` |
| Correções 1+2, ~7 processos/vCPU | 5.000 VUs com CPU < 70% | n/d | 0% | **ESTIMADO**: ~800 VUs por processo a 70% de CPU, escala ~linear (de 1→2 processos: ×1,5–1,8, com o Postgres a partilhar núcleo) |

Carga alvo traduzida: 5.000 VUs com a jornada simulada (pausas de 5–15 s) dão **~1.850 RPS** à API
(ESTIMADO: 1.000 VUs mediram 365–374 RPS). 50.000 utilizadores/dia com pico de 10% em 5 min equivalem a esses
mesmos ~5.000 em simultâneo.

## 3. Resultados por cenário

Máquina: 4 vCPU / 15 GB. Servidor fixado no núcleo 0 (ou 0–1 com 2 processos), Postgres 16 no núcleo 1 e
k6 nos núcleos 2–3. CPU em % de **um** núcleo (2 processos podem chegar a 200%). Leitura (rd) e escrita (wr)
em ms. "Antes" = `main`, "Depois" = com as correções 1+2. A rampa usou patamares de 2 min (antes) e de 1 min
(depois), em vez de 5 min, para caber no tempo; o soak durou 30 min.

| Cenário | Versão | VUs | RPS | rd p50 | rd p95 | wr p95 | p99 | % erros | CPU servidor média/máx | RAM servidor máx | SLO |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| smoke 1 min | antes | 1 | 0,5 | 9,7 | 160 | 11 | 187 | 0 | 3% / 12% | 172 MB | ✅ |
| smoke 1 min | depois | 1 | 0,4 | 5,5 | 94 | 118 | 461¹ | 0 | 2% / 42% | 153 MB | ✅ |
| stress (degraus de 50 a cada min, até 600) | antes | 600 | 47 | 3.686 | 11.097 | 12.832 | 13.837 | 0 | 91% / 100% | 518 MB | ❌ a partir de 150 VUs |
| stress (degraus de 50, até 600) | correção 1 | 600 | 119 | 5,9 | 33 | 167 | 135 | 0 | 42% / 99% | 360 MB | ✅ em todas as janelas |
| stress (degraus de 100, até 1.600) | depois | 1.600 | 268 | 47 | 2.314 | 5.113 | 4.660 | 0 | 69% / 100% | 672 MB | ❌ a partir de 1.200 VUs |
| stress (degraus de 200, até 3.000), 2 proc. | depois | 3.000 | 494 | 45 | 2.358 | 5.641 | 5.183 | 0 | 127% / 196% | 1,5 GB | ❌ a partir de 1.800 VUs |
| rampa 0→100→500→1k→3k→5k | antes | 5.000 | 66 | 8.078 | 60.001² | 60.001 | 60.001 | **51,4** | 92% / 100% | 740 MB | ❌ a partir de 500 VUs (ok até 100) |
| rampa 0→100→500→1k→3k→5k, 2 proc. | depois | 5.000 | 286 | 387 | 15.926 | 34.341 | 29.244 | 0,06 | 110% / 198% | 1,9 GB | ❌ a partir de ~1.900 VUs (ok até 1.000) |
| pico 0→5.000 em 30 s | antes | 5.000 | 51 | 20.595 | 60.001 | 60.001 | 60.002 | **60,5** | 98% / 100% | 921 MB | ❌; **não recupera**: CPU a 99% e timeouts de 60 s 4 min depois do fim |
| pico 0→5.000 em 30 s, 2 proc. | depois | 5.000 | 180 | 2.083 | 60.000 | 60.000 | 60.001 | 6,5 | 87% / 197% | 2,5 GB | ❌ no pico; **recupera em < 30 s** (p95 de 11 ms com 50 VUs logo a seguir) |
| soak 1.000 VUs, 30 min, 2 proc. | depois | 1.000 | 365 | 3,5 | 17 | 103 | 128 | **0** | 93% / 193% | 1,4 GB, estável³ | ✅ |

¹ Primeiro pedido a frio (HTML 600 ms ao arrancar o processo). Sem ele, p99 < 130 ms.
² 60.000 ms é o timeout do k6: o pedido não teve resposta.
³ Heap entre 50 e 165 MB sem tendência de subida; RSS dos 3 processos estável em 1,32–1,39 GB do minuto 3 ao 30; 21 ligações à BD durante todo o teste; cache hit do Postgres a 100%.

Postgres em todos os cenários: CPU média de 3–15% de um núcleo, sem esperas por locks (`pgLockWaits` = 0),
sem deadlocks e com o pool sempre abaixo do máximo (11 ligações com 1 processo, 21 com 2).

**Gerador de carga.** O k6 nunca passou de ~95% dos seus 2 núcleos durante o stress. Os picos de 198% são a
inicialização dos 3.000–5.000 VUs no arranque e a parte final do pico. Nos patamares de 3.000–5.000 da
rampa e do pico, parte da latência pode vir do próprio gerador. Isso **não** afeta as capacidades medidas
(≤ 2.000 VUs), mas impede afirmar com números como se comporta um servidor com 7 núcleos.

### Frontend (Lighthouse 12, mobile simulado, 4G lento, primeira visita, depois das correções)

| Página | Score | LCP | FCP | TBT (≈ INP) | CLS | Peso transferido | Nós DOM | SLO LCP < 2,5 s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /login | 98 | 2,2 s | 1,1 s | 20 ms | 0 | 201 KB | 29 | ✅ |
| /niveis | 88 | **3,7 s** | 2,0 s | 50 ms | 0 | 388 KB | 660 | ❌ |
| /biblioteca | 79 | **4,9 s** | 1,9 s | 140 ms | 0 | 890 KB | 1.634 | ❌ |

INP não se mede numa navegação do Lighthouse: o TBT é o indicador mais próximo, e < 200 ms em todas as
páginas sugere INP dentro do SLO (ESTIMADO). As causas do LCP estão nos achados F1 e F2.

## 4. Achados

| # | Problema | Ficheiro:linha | Evidência | Grav. | Correção | Ganho medido |
| --- | --- | --- | --- | --- | --- | --- |
| A1 | Lista inteira de exercícios (~870 KB) lida da BD, convertida e serializada (seroval) em **cada** abertura de Níveis/Biblioteca | `src/server/entities.ts` (`entityList`), `src/pages/Niveis.jsx:48`, `src/pages/Biblioteca.jsx:56` | Perfil de CPU a 80 VUs: serialização 20%, `toApi`/`toSnake` 17%, GC 12%, Drizzle 10% e zlib 8% do CPU ocupado. `list:Exercise` com 1 utilizador: p50 de 143 ms | **crítico** | **Aplicada.** Catálogo (níveis, conteúdos, exercícios) guardado em JSON por processo e validado contra uma "versão" calculada na BD (contagem + último `updated_at`, ou hash do conteúdo nas tabelas pequenas), com `ETag` + `Cache-Control: private, no-cache`; o browser revalida e recebe 304. As restantes listas passam a JSON simples. `toSnake` memorizado | `list:Exercise` p50 143 → 3,9 ms (−97%). Capacidade 100 → ≥ 600 VUs; com 600 VUs, leitura p95 11.097 → 33 ms (−99,7%) e RPS útil 47 → 119 |
| A3 | Sessão validada na BD (sessão + utilizador) em cada chamada; 3–4 chamadas por página | `src/lib/auth.ts` | 99k pares de queries `session`+`user` no stress de 600 VUs | médio | **Aplicada.** `session.cookieCache` de 5 min no Better Auth | CPU do servidor com 600 VUs 68% → 54% (−21%). Capacidade 600 → 1.100 VUs por processo. Queries de sessão desaparecem do top da BD |
| A4 | Tempestade de logins: o scrypt corre no thread pool do libuv (4 threads), que a compressão também usa | Better Auth `crypto/password` | 80 logins em simultâneo: escrita p95 de **8,3 s** e p99 global de 8,3 s na 1.ª janela (`20261117T164859Z-soak-perfil-80vus`); no soak, `auth:sign-in` p99 de 7 s no arranque | alto (em picos) | Não aplicada (é infra). `UV_THREADPOOL_SIZE=16`, mais instâncias e sessões de 7 dias (já é o valor por omissão). **Não** baixar o custo do scrypt | — |
| A12 | Sem limite de trabalho nem cancelamento: pedidos abandonados pelo cliente continuam a ser processados, e depois do pico o servidor fica minutos a 100% de CPU | `perf/serve.mjs` / falta de adaptador de produção | Pico "antes": CPU a 99% e timeouts de 60 s **4 min** depois do fim da carga | alto | Parcial: com as correções recupera em < 30 s. Em produção falta *load shedding* (ex.: 503 rápido acima de N pedidos em curso) e um timeout por pedido no proxy/plataforma | Recuperação de > 4 min para < 30 s |
| A2 | "Paginação" falsa: o cliente pede 500 e o servidor nunca devolve `next_cursor`. Acima de 500 linhas a lista é **cortada em silêncio**. Exercícios personalizados têm `order_index = 0` e passam à frente, por isso os da biblioteca são os primeiros a desaparecer; nas fichas somem as mais antigas | `src/components/swim/offlineCache.js:46`, `src/lib/entities.ts` (`next_cursor: null`) | Com 500 personalizados na massa de teste (826 exercícios), a lista devolveu os 500 personalizados e **nenhum** da biblioteca; reduzi para 100 para medir a app num estado utilizável | **alto** (funcional) | Não aplicada: decisão de produto (todos veem os personalizados de todos? as fichas de todos?). Opções: filtrar por autor, ou paginar a sério com cursor | — |
| A7 | Aulas carrega as fichas de **todos** os utilizadores (até 500; ~440 KB) | `src/pages/Treinos.jsx:38` | `list:WorkoutSheet` com 200k fichas: p50 de 40–48 ms a 1 VU; 1,5–1,7 ms na BD com índice | médio | Não aplicada (decisão de produto, igual a A2) | — |
| A5 | Erros da API devolvidos com HTTP 200; alertas por taxa de 5xx não os veem | comportamento do TanStack Start | O k6 contou-os à parte (`app_errors`); foi assim que se descobriu a perda de sessões numa corrida | médio | Monitorizar `app_errors` / logs; opcionalmente middleware que muda o estado | — |
| A6 | Pool de 10 ligações por processo; com N instâncias são 10×N ligações | `src/db/index.ts:12` | 11 ligações com 1 processo, 21 com 2 (MEDIDO). Com 7 instâncias seriam ~70 e, em serverless, muitas mais | médio | Usar pooler (PgBouncer / Neon pooled) e `max` por instância a 5–10 | — |
| F1 | Níveis só mostra o cabeçalho depois de todos os dados; o pedido de exercícios só começa depois de níveis+conteúdos (cascata) | `src/pages/Niveis.jsx:41-48` | LCP 3,7 s; o elemento LCP é o texto do cabeçalho | médio | Não aplicada: mostrar cabeçalho/esqueleto já e pedir os 3 em paralelo | — |
| F2 | Na Biblioteca, a imagem do 1.º cartão (elemento LCP) tem `loading="lazy"` | `src/components/ui/image.tsx:16` | LCP 4,9 s; o elemento LCP é `BIB-INI-001.webp` | médio | Não aplicada: `loading="eager"` + `fetchpriority="high"` nas 2–3 primeiras imagens | — |
| A8 | Sumário: ler-depois-escrever sem chave única → duplicados com dois cliques/dispositivos ao mesmo tempo | `src/components/swim/offlineQueue.js:24-31` | Revisão de código (não é lentidão) | baixo | Índice único (`date`,`level_id`,`created_by_id`) + upsert. **É migração: precisa da tua aprovação** | — |
| A13 | `created_by_id` (FK com `ON DELETE SET NULL`) sem índice em `workout_sheet`, `class_summary` e `exercise`: apagar um utilizador faz um seq scan a cada tabela | `src/db/schema.ts` | Apagar 50k utilizadores com 700k linhas mortas não acabou em 5 min; depois de `VACUUM` levou 1 min 54 s (~2 ms/utilizador com tabelas quase vazias) | baixo | Índices em `created_by_id`. **É migração: precisa da tua aprovação** | — |
| A9 | Definições das tabelas Drizzle entram no bundle do cliente | chunk `offlineQueue-*.js` (42 KB) | Inspeção do bundle | baixo | Separar tipos do esquema | — |
| A10 | Rate limit do Better Auth em memória por processo; confia em `X-Forwarded-For` | Better Auth (omissão) | Revisão de configuração | baixo | `rateLimit.storage: 'database'` (ou Redis) ao ter várias instâncias | — |
| A11 | Compressão e cache dos estáticos dependem do alojamento (não há adaptador) | `vite.config.ts` | 870 KB sem compressão vs 134 KB com brotli (MEDIDO com curl) | médio | Plataforma com compressão + CDN (Vercel/Netlify fazem-no) | — |

Sem problema (verificado): sem N+1, índices certos nas colunas filtradas, imagens em WebP com lazy loading,
three.js em chunk à parte, sem Google Drive nem CDN de terceiros, cache hit do Postgres a 100%, sem locks.

**Efeitos secundários das correções (lê antes do merge):**
- A3: um logout noutro dispositivo, uma sessão revogada ou uma **mudança de papel (admin)** só têm efeito neste browser até 5 min depois.
- A1: as listas passam a chegar como JSON simples. As datas `created_at`/`updated_at` chegam como texto, mas a app não as usa no cliente (verificado com `grep`). Testei no browser: Níveis, Biblioteca (175 imagens) e Aulas carregam sem erros, e o browser revalida com `If-None-Match` como esperado.
- A1: a cópia é por processo e é validada na BD em cada pedido, por isso várias instâncias nunca servem dados desatualizados. O custo é uma query de 0,3–0,7 ms por pedido de catálogo.

## 5. O que NÃO foi testado (e porquê)

- **Alojamento real, CDN, HTTP/2–3, cold starts serverless e limites do plano** (NÃO TESTADO): não há deploy. Os números são de um processo Node num contentor de 4 vCPU, não de Vercel/Neon.
- **5.000 VUs dentro do SLO** (NÃO TESTADO): exigiria ~7 núcleos de servidor e um gerador noutra máquina. Fica ESTIMADO a partir das medições de 1 e 2 processos.
- **Latência de rede real** (NÃO TESTADO): tudo em localhost. Em produção, cada pedido soma o RTT do cliente e o RTT servidor↔BD (Neon noutra região pode acrescentar 1–80 ms por query).
- **Estáticos e imagens sob carga** (NÃO TESTADO em carga): `STATIC=1` existe e foi verificado no smoke, mas os cenários correram sem estáticos, porque em produção devem vir de CDN.
- **INP real** (ESTIMADO pelo TBT), **CLS em interação** e dispositivos reais (NÃO TESTADO).
- **Login com Google** e **reposição de palavra-passe** (NÃO TESTADO).
- **Rampa com patamares de 5 min** (o pedido) foi corrida com 2 min (antes) e 1 min (depois); o soak durou 30 min e não 60. Os scripts aceitam `PLATEAU=5m` e `SOAK_DURATION=60m`.
- O 1.º par de corridas de rampa/pico "antes" ficou inválido por um bug no script de teste (os logouts apagavam as sessões partilhadas). Está guardado com o sufixo `-sessoes-invalidas` e foi repetido. Os números deste relatório são os da repetição.

## 6. Riscos ao escalar 10× e monitorização

**Riscos a 10× (50.000 em simultâneo / 500.000 por dia):**
1. CPU do servidor: ~70 núcleos com o código atual (ESTIMADO). O próximo passo seria enviar só os exercícios que mudaram ou servir o catálogo como ficheiro estático versionado pela CDN.
2. Ligações à BD: dezenas de instâncias × 10 ligações esgotam um Postgres gerido; o pooler é obrigatório.
3. Listas sem paginação (A2/A7): com 10× mais fichas e exercícios personalizados, o corte silencioso e o peso dos payloads pioram.
4. Tempestades de login (A4) depois de expirarem as sessões ou de um deploy que as invalide.
5. Rate limit em memória (A10) deixa de proteger com muitas instâncias.

**Alertas propostos:**

| Métrica | Alerta | Porquê |
| --- | --- | --- |
| p95 de `/_serverFn/*` (GET) | > 300 ms durante 5 min | SLO de leitura |
| p95 de `/_serverFn/*` (POST) e `/api/auth/*` | > 800 ms durante 5 min | SLO de escrita |
| Taxa de 5xx + timeouts | > 0,1% durante 5 min | SLO de erros |
| Erros da app com HTTP 200 (log `"k":["error"]`) | > 0,1% | A5 |
| CPU por instância | > 70% durante 10 min | capacidade medida acaba aos ~89% |
| Event-loop lag p99 | > 100 ms | a degradação aparece aqui antes da latência |
| Ligações ativas ao Postgres / máximo | > 80% | A6 |
| Logins por minuto | > 5× a média | A4 |
| Memória (RSS) por instância | crescimento > 20%/h | fuga de memória (o soak não mostrou nenhuma) |

Dashboard: RPS por endpoint, p50/p95/p99 por endpoint, erros por tipo, CPU/RAM por instância, lag do event
loop, ligações e top de queries (`pg_stat_statements`).

## 7. CI e reprodução

- Job: [`.github/workflows/perf.yml`](../.github/workflows/perf.yml). Em PRs que mexem no servidor faz build, Postgres de teste, massa de dados e stress em degraus até 400 VUs; falha se um SLO for violado (thresholds em `perf/k6/load.js`). Também corre à mão com qualquer cenário (`workflow_dispatch`). Não foi executado no GitHub nesta sessão; o mesmo comando correu localmente.
- Comandos exatos usados neste relatório (depois de seguir o setup do [README](README.md#3-como-correr)):

```bash
npm run build
NODE_ENV=production WORKERS=1 taskset -c 0 node perf/serve.mjs &
taskset -c 2,3 perf/run.sh smoke depois
STRESS_STEP=100 STRESS_STEP_TIME=1m STRESS_MAX=1600 taskset -c 2,3 perf/run.sh stress depois
# 2 processos
NODE_ENV=production WORKERS=2 taskset -c 0,1 node perf/serve.mjs &
STRESS_STEP=200 STRESS_STEP_TIME=1m STRESS_MAX=3000 taskset -c 2,3 perf/run.sh stress depois-2proc
SOAK_VUS=1000 SOAK_DURATION=30m taskset -c 2,3 perf/run.sh soak depois-2proc
PLATEAU=1m taskset -c 2,3 perf/run.sh ramp depois-2proc
taskset -c 2,3 perf/run.sh spike depois-2proc
psql "$DATABASE_URL" -f perf/scripts/cleanup-volume.sql
```

Os resultados resumidos de cada corrida estão em `perf/results/` (o CSV bruto do k6, com 128 MB, não vai
para o git; está nos ficheiros do projeto em `perf/resultados-brutos/`).
