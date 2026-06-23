FROM node:22-alpine AS base
RUN npm install -g pnpm@11.1.3

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm exec turbo run build --filter=@playmorrow/api...

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN npm install -g pnpm@11.1.3
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/database/src/generated ./packages/database/src/generated
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/database/package.json ./packages/database/package.json
COPY --from=build /app/packages/types ./packages/types
RUN mkdir -p apps/api/uploads
EXPOSE 4000
CMD ["dumb-init", "node", "apps/api/dist/main.js"]
