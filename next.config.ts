import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  // App Router 내비게이션을 startViewTransition으로 감싼다(clip-wipe 페이지 트랜지션).
  // 실제 wipe는 globals.css의 ::view-transition-* 규칙이 그린다.
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'raw.githubusercontent.com' }],
  },
};

export default nextConfig;
