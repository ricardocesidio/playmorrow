# Build timestamp: 2026-07-10T09:45:00Z
FROM node:22-alpine AS base
RUN npm i -g pnpm@11

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @playmorrow/database db:generate
RUN pnpm --filter @playmorrow/api build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
// force rebuild Fri Jul 10 10:34:16 WEST 2026
