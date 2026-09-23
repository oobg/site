#!/usr/bin/env node
/**
 * 배포할 SHA의 supabase/migrations/ 파일이 전부 dev DB에 적용됐는지 확인한다.
 *
 * dev 배포 workflow는 앱 이미지만 바꾸고 migration을 실행하지 않는다. 2026-09-10과
 * 2026-09-22에 migration이 빠진 채 앱만 배포돼 공개 화면이 500을 냈다. 이 검사는
 * public.raven_schema_migrations ledger를 읽기만 하고, 빠진 파일이 있으면 앱을
 * 바꾸기 전에 배포를 중단한다. migration을 자동 적용하지 않는다. 적용은 owner가
 * 백업한 뒤 수동으로 하고, 같은 트랜잭션에서 파일 이름을 ledger에 insert한다.
 *
 * 환경 변수
 * - RAVEN_DEV_DB_CONTAINER (기본 raven-supabase-dev-db)
 * - RAVEN_DEV_DB_NAME (기본 postgres)
 * - RAVEN_DEV_DB_USER (기본 postgres)
 *
 * 사용: node scripts/check-applied-migrations.mjs [migrations 디렉터리]
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEDGER_TABLE = 'public.raven_schema_migrations';
const MIGRATION_FILE = /^\d{14}_[a-z0-9_]+\.sql$/;

/**
 * @param {string[]} files 저장소의 migration 파일 이름
 * @param {string[] | null} ledgerNames ledger의 name 값. ledger 표가 없으면 null
 * @returns {{ status: 'ledger-missing' } | { status: 'ok' | 'missing', missing: string[] }}
 */
export function findMissingMigrations(files, ledgerNames) {
  if (ledgerNames === null) return { status: 'ledger-missing' };
  const applied = new Set(ledgerNames.map((name) => name.trim()).filter(Boolean));
  const missing = [...files].sort().filter((file) => !applied.has(file));
  return { status: missing.length === 0 ? 'ok' : 'missing', missing };
}

/** @param {string} dir */
export function listMigrationFiles(dir) {
  return readdirSync(dir)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function psql(target, sql) {
  return execFileSync(
    'docker',
    ['exec', target.container, 'psql', '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-U', target.user, '-d', target.db, '-c', sql],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function readLedger(target) {
  const exists = psql(target, `select to_regclass('${LEDGER_TABLE}') is not null`).trim();
  if (exists !== 't') return null;
  return psql(target, `select name from ${LEDGER_TABLE} order by name`).split('\n');
}

function main() {
  const dir = resolve(process.argv[2] ?? 'supabase/migrations');
  const target = {
    container: process.env.RAVEN_DEV_DB_CONTAINER || 'raven-supabase-dev-db',
    db: process.env.RAVEN_DEV_DB_NAME || 'postgres',
    user: process.env.RAVEN_DEV_DB_USER || 'postgres',
  };
  const files = listMigrationFiles(dir);
  const invalid = files.filter((file) => !MIGRATION_FILE.test(file));
  if (invalid.length > 0) {
    console.error(`::error::migration 파일 이름 형식이 맞지 않습니다: ${invalid.join(', ')}`);
    process.exit(1);
  }

  console.log(`검사 대상: container=${target.container} db=${target.db} ledger=${LEDGER_TABLE}`);
  console.log(`저장소 migration ${files.length}개 (${dir})`);

  let ledger;
  try {
    ledger = readLedger(target);
  } catch (error) {
    const stderr = String(error?.stderr ?? '').trim();
    console.error(`::error::dev DB에서 migration ledger를 읽지 못했습니다. container=${target.container} db=${target.db}`);
    if (stderr) console.error(stderr);
    console.error('앱은 바꾸지 않았습니다. container가 실행 중인지, runner가 docker를 쓸 수 있는지 확인하세요.');
    process.exit(1);
  }

  const result = findMissingMigrations(files, ledger);
  if (result.status === 'ledger-missing') {
    console.error(`::error::${LEDGER_TABLE} 표가 없어 적용된 migration을 확인할 수 없습니다. 배포를 중단합니다.`);
    console.error('앱은 바꾸지 않았습니다. DB를 백업한 뒤 ledger migration을 적용하고, 이미 적용된 migration 이름을 backfill하세요.');
    console.error('절차: docs/dev-setup.md "migration ledger와 배포 gate"');
    process.exit(1);
  }
  if (result.status === 'missing') {
    console.error(`::error::dev DB에 적용되지 않은 migration ${result.missing.length}개가 있어 배포를 중단합니다.`);
    for (const file of result.missing) console.error(`  - ${file}`);
    console.error('앱은 바꾸지 않았습니다. DB를 백업하고 위 파일을 순서대로 수동 적용하면서, 같은 트랜잭션에서 파일 이름을 ledger에 insert한 뒤 다시 배포하세요.');
    console.error('절차: docs/dev-setup.md "migration ledger와 배포 gate"');
    process.exit(1);
  }
  console.log(`모든 migration이 적용돼 있습니다 (${files.length}개).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
