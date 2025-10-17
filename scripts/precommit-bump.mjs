import { execSync } from 'node:child_process';
import fs from 'node:fs';

const sh = (cmd) => execSync(cmd, { stdio: 'pipe' }).toString().trim();

try {
  // 환경변수로 스킵 가능
  if (process.env.SKIP_BUMP === '1') process.exit(0);

  // dev 브랜치에서만 동작 (원하면 조건 제거)
  const branch = sh('git rev-parse --abbrev-ref HEAD');
  if (branch !== 'dev') process.exit(0);

  // 스테이지된 파일 목록
  const stagedOut = sh('git diff --cached --name-only');
  const staged = stagedOut.split('\n').filter(Boolean);

  // 코드 변경이 없으면 스킵
  const shouldCheck = staged.some((p) => p.startsWith('src/') || p.endsWith('.ts') || p.endsWith('.tsx'));
  if (!shouldCheck) process.exit(0);

  // 사용자가 이미 package.json을 스테이지했다면 스킵(사용자 버전 변경 존중)
  if (staged.includes('package.json')) process.exit(0);

  // 현재 버전 읽기
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const before = pkg.version;

  // 패치 버전 증가 (태그 생성/커밋 없이 파일만 변경)
  sh('npm version patch --no-git-tag-version');
  sh('git add package.json');

  const after = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  console.log(`bump version: ${before} -> ${after}`);
} catch (err) {
  console.error(err?.message || String(err));
  // 실패 시 커밋을 막지 않으려면 0으로 변경 가능
  process.exit(1);
}


