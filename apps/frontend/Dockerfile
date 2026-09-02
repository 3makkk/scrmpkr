# Frontend Dockerfile (build with pnpm, serve via nginx)
FROM node:26-alpine@sha256:2d984a15c9b54fd0aeb608b8e0d0d83529eb34d2966db27a1fb4f1edc3d298a3 AS base
WORKDIR /app
RUN npm install -g corepack@latest && corepack enable

# Build-time env passed as ARG to embed in static assets
# These should be set during docker build via --build-arg
ARG VITE_API_URL
ARG VITE_SOCKET_PATH
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_SOCKET_PATH=${VITE_SOCKET_PATH}

# Install only manifest files first for better caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
# Patches referenced by the lockfile must be present before install
COPY patches/ patches/
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/

FROM base AS deps
RUN pnpm install -r --frozen-lockfile

FROM deps AS build
ENV NODE_ENV='production'
COPY . .
# Then build the frontend
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token)" \
    pnpm --filter '{./apps/frontend}...' build

FROM nginx:1.31-alpine@sha256:db35bfc6b2951e7f8a72db5db120288c127ffaeeb4a6d4b95a26fead017d5913 AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1/ || exit 1
