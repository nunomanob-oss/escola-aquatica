-- Massa de dados sintética para testes de carga. NUNCA correr contra produção.
-- Todos os registos têm id começado por 'perf-' e são removidos por cleanup-volume.sql.
-- Variáveis (psql -v): users (50000), sheets (200000), summaries (500000), custom (500)
\set ON_ERROR_STOP on
\if :{?users} \else \set users 50000 \endif
\if :{?sheets} \else \set sheets 200000 \endif
\if :{?summaries} \else \set summaries 500000 \endif
\if :{?custom} \else \set custom 100 \endif

BEGIN;
-- Utilizadores com a mesma palavra-passe do instrutor demo (instrutor123): copia-se o hash.
INSERT INTO "user" (id, name, email, email_verified, role)
SELECT 'perf-u-' || g, 'Carga ' || g, 'perf-' || g || '@carga.test', true, 'user'
FROM generate_series(1, :users) g;

INSERT INTO account (id, account_id, provider_id, user_id, password)
SELECT 'perf-a-' || g, 'perf-u-' || g, 'credential', 'perf-u-' || g,
       (SELECT a.password FROM account a JOIN "user" u ON u.id = a.user_id WHERE u.email = 'instrutor@escola.local')
FROM generate_series(1, :users) g;

-- Sessões antigas (expiradas e ativas), como ao fim de semanas de uso.
INSERT INTO session (id, expires_at, token, user_id, created_at, updated_at, user_agent)
SELECT 'perf-s-' || g, now() + ((g % 14) - 7) * interval '1 day', 'perf-tok-' || md5(g::text), 'perf-u-' || (1 + g % :users),
       now() - (g % 30) * interval '1 day', now() - (g % 30) * interval '1 day', 'k6'
FROM generate_series(1, :users * 2) g;

-- Uma sessão válida por utilizador: os testes k6 usam-nas para simular quem já tinha sessão aberta
-- (a maioria dos instrutores não faz login todos os dias; a sessão dura 7 dias).
INSERT INTO session (id, expires_at, token, user_id, created_at, updated_at, user_agent)
SELECT 'perf-live-' || g, now() + interval '7 days', 'perf-live-' || g, 'perf-u-' || g, now(), now(), 'k6'
FROM generate_series(1, :users) g;

-- Fichas de treino: ~4 por utilizador, datas espalhadas por 2 épocas.
INSERT INTO workout_sheet (id, title, level_id, session_date, focus, sections, total_distance, notes, created_by_id, created_at)
SELECT 'perf-w-' || g, 'Ficha carga ' || g,
       (ARRAY['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','M'])[1 + g % 11],
       (date '2025-09-01' + (g % 600))::date, 'Técnica',
       '[{"title":"Aquecimento","rest":"20s","items":["4x25 crol","2x50 costas"]},{"title":"Principal","rest":"30s","items":["8x25 pernas","4x50 bruços","2x100 livre"]}]'::jsonb,
       600 + (g % 10) * 100, null, 'perf-u-' || (1 + g % :users), now() - (g % 600) * interval '1 day'
FROM generate_series(1, :sheets) g;

-- Sumários de aula.
INSERT INTO class_summary (id, date, level_id, exercise_ids, content_ids, notes, created_by_id)
SELECT 'perf-c-' || g, (date '2025-09-01' + (g % 600))::date,
       (ARRAY['A1','A2','B1','B2','C1','C2','D1','D2','E1','E2','M'])[1 + g % 11],
       ARRAY['EX-00' || (1 + g % 9), 'EX-01' || (g % 10)], ARRAY[]::text[], null, 'perf-u-' || (1 + g % :users)
FROM generate_series(1, :summaries) g;

-- Exercícios personalizados criados por instrutores (crescem com o número de utilizadores).
INSERT INTO exercise (id, title, description, content, subcategory, category, level_id, is_custom, created_by_id, instructions, tags)
SELECT 'perf-e-' || g, 'Exercício personalizado ' || g, repeat('Descrição do exercício. ', 10), 'Respiração', 'Bolhas', 'Técnica',
       (ARRAY['A1','A2','B1','B2','C1'])[1 + g % 5], true, 'perf-u-' || (1 + g % :users),
       ARRAY['Passo 1', 'Passo 2', 'Passo 3'], ARRAY['carga']
FROM generate_series(1, :custom) g;
COMMIT;
ANALYZE;
