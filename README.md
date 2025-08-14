# scrmpkr

Lightweight internal Scrum Poker web app with a simple name-based login (stored only in your browser) and a placeholder Azure AD authentication, Socket.io realtime backend, and React frontend.

## Setup

Install dependencies with [pnpm](https://pnpm.io):

```
pnpm install
```

This repo now uses TypeScript for both frontend and server.
Build all packages:

```
pnpm build
```

### Backend

Create `server/.env` using `server/.env.example`.

```
TENANT_ID=<tenant>
AZURE_CLIENT_ID=<app id>
AZURE_ISSUER=https://login.microsoftonline.com/<TENANT_ID>/v2.0
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Run the backend:

```
pnpm dev:server
```

### Frontend

Create `frontend/.env` using `frontend/.env.example`.

```
VITE_AZURE_TENANT_ID=<tenant>
VITE_AZURE_CLIENT_ID=<app id>
VITE_REDIRECT_URI=http://localhost:5173
VITE_API_URL=http://localhost:4000
```

Run the frontend:

```
pnpm dev:frontend
```

### Tests

```
pnpm test
```

Note: Jest is currently configured for JavaScript tests. To run server tests against TypeScript sources, either build first and point tests at compiled output, or add ts-jest to transpile on the fly.
