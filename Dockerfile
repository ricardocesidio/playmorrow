FROM node:22-alpine
RUN npm install -g pnpm@11.1.3

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/
COPY packages/types/package.json packages/types/

RUN pnpm install --frozen-lockfile

COPY . .
RUN NODE_ENV=production pnpm exec turbo run build --filter=@playmorrow/api...
RUN pnpm --filter @playmorrow/database db:generate

RUN mkdir -p apps/api/uploads

ENV NODE_ENV=production
EXPOSE 8080
CMD node apps/api/dist/main.js
