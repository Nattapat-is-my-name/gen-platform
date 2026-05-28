# gen-video Team Memory

Shared lessons across all reins. Add entries as team learns them.

## Project setup

- Workspace: `/Users/developer/Desktop/gen-video`
- Tech: React 18 + Vite (frontend), Go + Gin (backend), Postgres + MinIO (Docker)
- Quick start: `docker compose up --build`
- Validate: `make test`

## Key quirks

### MiniMax URL blocker

MiniMax rejects private/localhost URLs when fetching reference images. Image-to-image fails in local dev without a public tunnel. Fix: run `ngrok http 9000` and set `MINIO_PUBLIC_URL`.

### Session isolation pattern

Frontend generates UUID on first visit → localStorage → sent as `X-Session-ID` header. Backend stores `session_id` in generations table. History filtered by session.

### Vite proxy rule

Host-local Vite must proxy `/api` to `127.0.0.1:8080` (not `localhost:8080`). Docker frontend uses `VITE_API_URL=http://backend:8080`.

## Working context

- Frontend dev port: 5173
- Backend dev port: 8080
- Postgres: 5432
- MinIO API: 9000, Console: 9001