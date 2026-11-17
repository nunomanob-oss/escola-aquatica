#!/usr/bin/env bash
# Corre um cenário k6 contra a app já a correr e guarda tudo em perf/results/<data>-<cenário>-<etiqueta>/.
#   perf/run.sh smoke baseline
#   PLATEAU=2m perf/run.sh ramp antes
# Requer: k6, psql, app em BASE_URL (por omissão http://localhost:3000) servida por perf/serve.mjs,
# base de dados de TESTE com pg_stat_statements e a massa de dados de perf/scripts/seed-volume.sql.
set -euo pipefail
cd "$(dirname "$0")/.."
SCENARIO=${1:-smoke}; LABEL=${2:-run}
set -a; source .env; set +a
BASE_URL=${BASE_URL:-http://localhost:3000}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT=perf/results/${STAMP}-${SCENARIO}-${LABEL}
mkdir -p "$OUT"

# Ids das funções de servidor no build atual: a de listagem é o GET seguido do POST (escrita) em src/server/entities.ts;
# a da sessão é o outro GET.
read FN_LIST FN_WRITE < <(grep -oh "method:\`GET\`}).handler([a-zA-Z_$]*(\`[a-f0-9]\{64\}\`)),[a-zA-Z_$]*=[a-zA-Z_$]*({method:\`POST\`}).handler([a-zA-Z_$]*(\`[a-f0-9]\{64\}" dist/client/assets/*.js | grep -o "[a-f0-9]\{64\}" | head -2 | xargs)
FN_SESSION=$(grep -oh "method:\`GET\`}).handler([a-zA-Z_$]*(\`[a-f0-9]\{64\}" dist/client/assets/*.js | grep -o "[a-f0-9]\{64\}" | grep -v "$FN_LIST" | head -1)
: "${FN_LIST:?id da função de listagem não encontrado}" "${FN_WRITE:?}" "${FN_SESSION:?}"

cat > "$OUT/config.json" <<JSON
{ "scenario": "$SCENARIO", "label": "$LABEL", "started": "$STAMP", "commit": "$(git rev-parse --short HEAD)$(git diff --quiet || echo '-dirty')",
  "base_url": "$BASE_URL", "plateau": "${PLATEAU:-5m}", "max_vus": "${MAX_VUS:-5000}", "think": "${THINK:-1}", "static": "${STATIC:-0}", "returning": "${RETURNING:-0.9}",
  "server_workers": "${WORKERS:-1}", "machine": "$(nproc) vCPU, $(free -g | awk '/Mem/{print $2}') GB RAM", "k6": "$(k6 version | head -1)",
  "db_rows": $(psql "$DATABASE_URL" -Atc "select json_object_agg(relname, n_live_tup) from pg_stat_user_tables") }
JSON

# Repõe as sessões "já abertas" (os logouts dos testes anteriores apagam-nas) e limpa as estatísticas.
psql "$DATABASE_URL" -qc "INSERT INTO session (id, expires_at, token, user_id, created_at, updated_at, user_agent)
  SELECT 'perf-live-' || g, now() + interval '7 days', 'perf-live-' || g, 'perf-u-' || g, now(), now(), 'k6'
  FROM generate_series(1, ${USERS:-50000}) g ON CONFLICT (id) DO UPDATE SET expires_at = excluded.expires_at, updated_at = now()" >/dev/null
psql "$DATABASE_URL" -qc "select pg_stat_statements_reset()" >/dev/null 2>&1 || echo "aviso: sem pg_stat_statements"
node perf/scripts/monitor.mjs "$OUT/monitor.ndjson" & MON=$!
set +e
k6 run --quiet --out csv="$OUT/k6-raw.csv.gz" -e SCENARIO="$SCENARIO" -e OUT_DIR="$OUT" -e BASE_URL="$BASE_URL" \
  -e FN_LIST="$FN_LIST" -e FN_WRITE="$FN_WRITE" -e FN_SESSION="$FN_SESSION" -e BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" ${RETURNING:+-e RETURNING=$RETURNING} \
  ${PLATEAU:+-e PLATEAU=$PLATEAU} ${MAX_VUS:+-e MAX_VUS=$MAX_VUS} ${THINK:+-e THINK=$THINK} ${STATIC:+-e STATIC=$STATIC} \
  ${DURATION:+-e DURATION=$DURATION} ${SOAK_VUS:+-e SOAK_VUS=$SOAK_VUS} ${SOAK_DURATION:+-e SOAK_DURATION=$SOAK_DURATION} \
  ${RAMP_STEPS:+-e RAMP_STEPS=$RAMP_STEPS} ${STRESS_STEP:+-e STRESS_STEP=$STRESS_STEP} ${STRESS_STEP_TIME:+-e STRESS_STEP_TIME=$STRESS_STEP_TIME} ${STRESS_MAX:+-e STRESS_MAX=$STRESS_MAX} \
  perf/k6/load.js 2>&1 | tee "$OUT/k6-stdout.txt"
RC=${PIPESTATUS[0]}
set -e
kill -TERM $MON; wait $MON || true
python3 perf/scripts/timeline.py "$OUT" > "$OUT/timeline.txt" || true
cat "$OUT/timeline.txt"

psql "$DATABASE_URL" -c "select calls, round(mean_exec_time::numeric,2) mean_ms, round(max_exec_time::numeric,1) max_ms, round(total_exec_time::numeric) total_ms, rows, left(regexp_replace(query, '\s+', ' ', 'g'), 160) query from pg_stat_statements where dbid = (select oid from pg_database where datname = current_database()) order by total_exec_time desc limit 15" > "$OUT/pg-top-queries.txt" 2>&1 || true
echo "k6 exit $RC  ·  resultados em $OUT"
exit $RC
