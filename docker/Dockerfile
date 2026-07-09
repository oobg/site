FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
ENV HUSKY=0

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# pnpm store를 BuildKit 캐시 마운트에 두어 재빌드 시 재다운로드 회피(러너 로컬에 영구 잔존)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# .next/cache를 캐시 마운트로 재활용 → next build가 콜드가 아닌 증분으로 동작
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache \
    pnpm build

FROM base AS runner
ENV NODE_ENV=production
# Next standalone server.js는 $HOSTNAME에 바인딩. Docker가 HOSTNAME을 컨테이너ID로
# 자동 설정 → loopback에 안 붙어 컨테이너 내부 헬스체크(127.0.0.1)가 refused.
# 0.0.0.0으로 강제해 loopback·eth0 모두 수신.
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
