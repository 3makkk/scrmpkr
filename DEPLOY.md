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
1. Copy the env example and fill in values:
   ```
   cp .env.example .env
   ```
   - `FRONTEND_HOST`, `SERVER_HOST`: public hostnames routed by Traefik
   - `TRAEFIK_NETWORK`: the external Docker network name used by Traefik
   - `TRAEFIK_ENTRYPOINTS`: typically `websecure` if Traefik terminates TLS
   - `TRAEFIK_TLS`: set `true` to enable TLS on routers
   - Frontend `VITE_*`: public values baked into the static build
   - Server secrets (`TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_ISSUER`): set real values in `.env` (do not commit)
   - `CORS_ORIGIN`: must match `https://<FRONTEND_HOST>`

2. Ensure your frontend API URL is set correctly in `.env` as `VITE_API_URL`.

## Build and Run
```
# Build images (uses build args from .env for frontend)
docker compose build

# Start services (joins Traefik external network)
docker compose up -d
```

- Frontend container serves the static site on port `80` (internal).
- Server container listens on `4000` (internal) and exposes `/health`.
- Traefik routes traffic to both via labels and the external network.

## Traefik Labels Summary
- Frontend router `scrmpkr-web`: `Host(\`${FRONTEND_HOST}\`) && PathPrefix(\`/\`)` → port `80`
- API router `scrmpkr-api`: `Host(\`${SERVER_HOST}\`) && PathPrefix(\`${API_PATH_PREFIX}\`)` → port `4000`
- Middleware `scrmpkr-api-strip` strips `${API_PATH_PREFIX}` so backend sees `/` (Socket.io path `/socket.io` works via `/api/socket.io` at the edge)
- Both attach to `${TRAEFIK_NETWORK}` and use `${TRAEFIK_ENTRYPOINTS}` (e.g., `websecure`)

## Environment Contract
- Server required at runtime: `CORS_ORIGIN`, `PORT=4000` (default)
- Frontend required at build: `VITE_API_URL` (e.g., `https://scrmpkr.friedemann.dev/api`)

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

2) Choose an image registry and tag in `.env` (optional defaults are provided):

```
REGISTRY=ghcr.io/<your-account>
IMAGE_TAG=v1
```

3) Build and push images (example for amd64):

```
docker buildx build --platform linux/amd64 -t $REGISTRY/server:$IMAGE_TAG -f server/Dockerfile . --push
docker buildx build --platform linux/amd64 \
  --build-arg VITE_API_URL=$VITE_API_URL \
  -t $REGISTRY/frontend:$IMAGE_TAG -f frontend/Dockerfile . --push
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
- Ensure Traefik is configured with the Docker provider in swarm mode and is attached to `${TRAEFIK_NETWORK}`.
