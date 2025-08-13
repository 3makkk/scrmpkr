# scrmpkr

Lightweight internal Scrum Poker web app with Azure AD authentication, Socket.io realtime backend, and React frontend.

## Setup

### Backend

Create `server/.env` using `server/.env.example`.

```
TENANT_ID=<tenant>
AZURE_CLIENT_ID=<app id>
AZURE_ISSUER=https://login.microsoftonline.com/<TENANT_ID>/v2.0
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

Run:

```
cd server
npm install
npm run dev
```

### Frontend

Create `frontend/.env` using `frontend/.env.example`.

```
VITE_AZURE_TENANT_ID=<tenant>
VITE_AZURE_CLIENT_ID=<app id>
VITE_REDIRECT_URI=http://localhost:5173
VITE_API_URL=http://localhost:4000
```

Run:

```
cd frontend
npm install
npm run dev
```

Backend unit tests:

```
cd server
npm test
```
