FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /app
ENV HUSKY=0

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=raven-dev-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

FROM base AS build
ARG CONTENT_SOURCE=mock
ARG SITE_URL
ARG SITE_INDEXABLE
ARG ASSET_STORAGE_BACKEND
ARG ASSET_PUBLIC_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV CONTENT_SOURCE=$CONTENT_SOURCE
ENV SITE_URL=$SITE_URL
ENV SITE_INDEXABLE=$SITE_INDEXABLE
ENV ASSET_STORAGE_BACKEND=$ASSET_STORAGE_BACKEND
ENV ASSET_PUBLIC_URL=$ASSET_PUBLIC_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p public
RUN test "$SITE_URL" = "https://dev.raven.kr" || \
      (echo "SITE_URL must target dev.raven.kr" >&2; exit 1)
RUN test "$SITE_INDEXABLE" = "false" || \
      (echo "SITE_INDEXABLE must disable indexing for Raven dev" >&2; exit 1)
RUN test "$ASSET_STORAGE_BACKEND" = "local" && \
    test "$ASSET_PUBLIC_URL" = "https://cdn-dev.raven.kr" || \
      (echo "Raven dev assets must use the local CDN contract" >&2; exit 1)
RUN test "$NEXT_PUBLIC_SUPABASE_URL" = "https://supabase-dev.raven.kr" || \
      (echo "NEXT_PUBLIC_SUPABASE_URL must target supabase-dev.raven.kr" >&2; exit 1)
RUN node -e 'if (process.env.CONTENT_SOURCE === "supabase" && !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) { console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is required"); process.exit(1) }'
RUN --mount=type=cache,id=raven-dev-next-cache,target=/app/.next/cache pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
