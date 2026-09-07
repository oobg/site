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
ARG CONTENT_SOURCE=mock
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV CONTENT_SOURCE=$CONTENT_SOURCE
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 개인정보 이미지 제거 뒤 fresh checkout에는 public/ 자체가 없을 수 있다.
# runner 단계의 COPY가 항상 유효하도록 빈 디렉터리도 빌드 산출 경계에 만든다.
RUN mkdir -p public
# GIS 로그인은 CMS의 유일한 로그인 경로다. mock 빌드는 외부 설정 없이 허용하되
# Supabase CMS 빌드가 로그인 불가능한 상태로 배포되는 것은 막는다.
RUN if [ "$CONTENT_SOURCE" = "supabase" ]; then \
      test -n "$NEXT_PUBLIC_GOOGLE_CLIENT_ID" || \
        (echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID is required for a Supabase CMS build" >&2; exit 1); \
    fi
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
