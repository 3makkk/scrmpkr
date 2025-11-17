# Server Dockerfile (multi-stage, pnpm workspaces)
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

# Install only manifest files first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

FROM base AS deps
RUN pnpm install -r --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter ./apps/server build

# Create a pruned, production-only deploy directory for the server
RUN pnpm --filter ./apps/server deploy --prod /app/server-deploy

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# The deploy directory contains server package files and pruned node_modules
COPY --from=build /app/server-deploy ./
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/index.js"]

