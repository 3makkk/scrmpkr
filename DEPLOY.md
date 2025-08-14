# Deployment (Docker + Traefik)

This repo ships first-class Docker images for the API (server) and the Vite React app (frontend). A global Traefik controller terminates TLS and routes traffic to both services via labels. Traefik is not part of the compose file; it must run elsewhere and share an external network with these services.

## Prerequisites
- Docker and Docker Compose v2
- A running Traefik instance (v2+) on the same Docker host
- A shared external Docker network (e.g., `traefik_proxy`) that Traefik and this stack join

Create the external network if it does not exist:

```
docker network create traefik_proxy
```

## Configure
- Nothing to configure for hostnames or Traefik: values are hard-coded for simplicity.
  - Host: `scrmpkr.friedemann.dev`
  - API path prefix: `/api`
  - Traefik network: `traefik_proxy`, entrypoint: `websecure`, TLS: `true`
  - Server `CORS_ORIGIN`: `https://scrmpkr.friedemann.dev`
  - Frontend API URL baked at build: `https://scrmpkr.friedemann.dev/api`

## Build and Run
```
# Build images
docker compose build

# Start services (joins Traefik external network)
docker compose up -d
```

- Frontend container serves the static site on port `80` (internal).
- Server container listens on `4000` (internal) and exposes `/health`.
- Traefik routes traffic to both via labels and the external network.

## Traefik Labels Summary
- Frontend router `scrmpkr-web`: `Host(\`scrmpkr.friedemann.dev\`) && PathPrefix(\`/\`)` → port `80`
- API router `scrmpkr-api`: `Host(\`scrmpkr.friedemann.dev\`) && PathPrefix(\`/api\`)` → port `4000`
- Middleware `scrmpkr-api-strip` strips `/api` so backend sees `/` (Socket.io path `/socket.io` works via `/api/socket.io` at the edge)
- Both attach to `traefik_proxy` and use entrypoint `websecure` with TLS enabled

## Environment Contract
- Server required at runtime: none beyond defaults; `PORT=4000` is set, `CORS_ORIGIN` is hard-coded in compose/stack
- Frontend required at build: none; API URL is defaulted in the Dockerfile

## Common Gotchas
- 404 on SPA routes: ensured by nginx `try_files` → `index.html` fallback.
- CORS errors: set `CORS_ORIGIN` to the exact frontend origin (including `https://`).
- WebSockets: Traefik v2 handles WS automatically on the same router/service.
- TLS: leave `TRAEFIK_TLS=true` if your entrypoints require TLS (typical with `websecure`).

## Clean Up
```
docker compose down --remove-orphans
```

## Docker Swarm (Stack)

Build and push images to a registry, then deploy the stack. The stack file cannot build images.

1) Create the external overlay network shared with Traefik (once):

```
docker network create --driver overlay --attachable ${TRAEFIK_NETWORK:-traefik_proxy}
```

2) Build and push images (example for amd64) to GHCR:

```
docker buildx build --platform linux/amd64 -t ghcr.io/<owner>/server:latest -f server/Dockerfile . --push
docker buildx build --platform linux/amd64 -t ghcr.io/<owner>/frontend:latest -f frontend/Dockerfile . --push
```

4) Deploy the stack:

```
docker stack deploy -c docker-stack.yml scrmpkr
```

5) Verify:

```
docker stack services scrmpkr
docker service logs -f scrmpkr_server
docker service logs -f scrmpkr_frontend
```

Notes:
- The API service runs with `replicas: 1` because it maintains in-memory room state; scaling requires a shared adapter (e.g., Redis) for Socket.io.
- The frontend is stateless and runs with `replicas: 2` by default.
- Ensure Traefik is configured with the Docker provider in swarm mode and is attached to `traefik_proxy`.
