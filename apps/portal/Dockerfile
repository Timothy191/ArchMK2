# Portal Dockerfile for Next.js production deployment
# Multi-stage build for optimized image size

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Builder stage
FROM base AS builder
RUN npm i -g pnpm@9.12.0
ENV PNPM_STORE_PATH=/pnpm-store
ENV NODE_ENV=production

COPY pnpm-lock.yaml turbo.json package.json ./
COPY apps/portal/package.json ./apps/portal/
COPY packages/ui/package.json ./packages/ui/
COPY packages/theme/package.json ./packages/theme/
COPY packages/supabase/package.json ./packages/supabase/
COPY packages/redis/package.json ./packages/redis/
COPY packages/errors/package.json ./packages/errors/
COPY packages/utils/package.json ./packages/utils/

RUN pnpm install --frozen-lockfile

COPY apps/portal/ ./apps/portal/
COPY packages/ ./packages/
COPY tsconfig.json turbo.json pnpm-workspace.yaml ./

RUN pnpm --filter portal build

# Production stage
FROM base AS production
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN npm i -g pnpm@9.12.0
ENV PNPM_STORE_PATH=/pnpm-store

WORKDIR /app
COPY --from=builder /pnpm-store /pnpm-store
COPY --from=builder --chown=node:node /app/apps/portal/.next ./.next
COPY --from=builder --chown=node:node /app/apps/portal/public ./public
COPY --from=builder --chown=node:node /app/apps/portal/package.json ./package.json

RUN pnpm install --prod --frozen-lockfile

EXPOSE 3000

USER node

CMD ["pnpm", "start"]