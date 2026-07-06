import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// eslint-config-next 16 ships native flat config arrays — import directly
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals');
const nextTypescript = require('eslint-config-next/typescript');

// 공유 패턴 (flat config는 같은 규칙이 여러 블록에 있으면 마지막이 덮어씀 → 재사용)
const noParentRelative = {
  group: ['../*', '../../*', '../../../*', '../../../../*'],
  message: '상대 부모 경로 대신 path alias를 사용하세요.',
};
const noSonner = { name: 'sonner', message: 'sonner는 @lib/toast에서만 import하세요.' };
const noBarrel = {
  selector: "ExportAllDeclaration[source.value!='']",
  message: 'Barrel export 금지. 실제 파일 경로에서 import/export 하세요.',
};

export default [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts', 'coverage/**'] },
  ...nextCoreWebVitals,
  ...nextTypescript,

  // 전역: barrel 금지 + 상대경로 금지 + sonner 금지
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/toast.ts'],
    rules: {
      'no-restricted-syntax': ['error', noBarrel],
      'no-restricted-imports': ['error', { paths: [noSonner], patterns: [noParentRelative] }],
    },
  },
  // toast.ts는 sonner 허용
  {
    files: ['src/lib/toast.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [noParentRelative] }] },
  },
  // index.ts barrel 파일 생성 금지
  {
    files: ['src/**/index.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', { selector: 'Program', message: 'index.ts barrel 파일 금지.' }],
    },
  },
  // components: features/app import 금지
  {
    files: ['src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [noSonner],
        patterns: [noParentRelative,
          { group: ['@features/*', '@/features/*', '@app/*', '@/app/*'], message: '공용 컴포넌트는 app/feature를 import할 수 없습니다.' }],
      }],
    },
  },
  // features: app import 금지
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [noSonner],
        patterns: [noParentRelative,
          { group: ['@app/*', '@/app/*'], message: 'feature는 app layer를 import할 수 없습니다.' }],
      }],
    },
  },
  // _components: 데이터 로딩 금지 (권장, 정당한 예외는 eslint-disable 주석으로)
  {
    files: ['src/app/**/_components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [noSonner],
        patterns: [noParentRelative,
          { group: ['@features/*/services/*', '@services/*', '@stores/*'], message: '_components는 표시 전용입니다. 데이터·콜백은 상위에서 props로 받으세요.' }],
      }],
    },
  },
  // page.tsx는 Server Component 권장 (예외는 eslint-disable 주석으로)
  {
    files: ['src/app/**/page.tsx'],
    rules: {
      'no-restricted-syntax': ['error',
        noBarrel,
        { selector: "ExpressionStatement > Literal[value='use client']", message: "page.tsx는 Server Component로 유지하세요. 클라이언트 로직은 _container로." }],
    },
  },
];
