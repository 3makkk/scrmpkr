# Server Dockerfile (multi-stage, pnpm workspaces)
FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS base
WORKDIR /app
RUN npm install -g corepack@latest && corepack enable

# Install only manifest files first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Patches referenced by the lockfile must be present before install
COPY patches/ patches/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

FROM base AS deps
RUN pnpm install -r --frozen-lockfile

FROM deps AS build
COPY . .
# Build the server and all its dependencies (e.g., shared package)
RUN pnpm --filter '{./apps/server}...' build

# Create a pruned, production-only deploy directory for the server
RUN pnpm --filter ./apps/server deploy --prod /app/server-deploy

FROM node:26-alpine@sha256:e88a35be04478413b7c71c455cd9865de9b9360e1f43456be5951032d7ac1a66 AS runner
WORKDIR /app
ENV NODE_ENV=production
# The deploy directory contains server package files and pruned node_modules
COPY --from=build /app/server-deploy ./

EXPOSE 4000
EXPOSE 9464

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/index.js"]

