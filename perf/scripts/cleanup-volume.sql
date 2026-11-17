-- Remove tudo o que seed-volume.sql e os testes k6 criaram (ids 'perf-' e utilizadores @carga.test).
-- Em dois passos com VACUUM no meio: as FKs created_by_id (ON DELETE SET NULL) não têm índice, por isso apagar
-- utilizadores com 700k linhas mortas nas tabelas de dados faria um seq scan por utilizador (minutos/horas).
\set ON_ERROR_STOP on
BEGIN;
DELETE FROM exercise WHERE id LIKE 'perf-%' OR created_by_id IN (SELECT id FROM "user" WHERE email LIKE '%@carga.test');
DELETE FROM workout_sheet WHERE id LIKE 'perf-%' OR created_by_id IN (SELECT id FROM "user" WHERE email LIKE '%@carga.test');
DELETE FROM class_summary WHERE id LIKE 'perf-%' OR created_by_id IN (SELECT id FROM "user" WHERE email LIKE '%@carga.test');
COMMIT;
VACUUM ANALYZE exercise;
VACUUM ANALYZE workout_sheet;
VACUUM ANALYZE class_summary;
DELETE FROM "user" WHERE email LIKE '%@carga.test';  -- sessões e contas apagadas em cascata
VACUUM ANALYZE;
