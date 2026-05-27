# Project Agent

Specialized agent notes for the `gen-video` MiniMax generation web app.

Use this file as the project-specific memory for future coding sessions. Keep it accurate and practical: commands, architecture, known blockers, UI style, and project rules.

## Context Read Order

For best results, read docs in this order:

1. `README.md`
2. `TODO.md`
3. `DESIGN_GUIDE.md`
4. `.kilo/agent/agent.md` (this file)
5. `plan.md`

## Project Summary

`gen-video` is a local web app for MiniMax image and video generation.

Core behavior:

- Generate images from text prompts.
- Transform images with a reference image.
- Create async video generation tasks.
- Poll unfinished video tasks.
- Save generated media metadata in Postgres.
- Store uploaded/generated assets in MinIO.
- Filter generation history by browser session ID.

No auth, billing, teams, public sharing, or multi-provider support.

## Tech Stack

Frontend:

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- Base UI primitives
- lucide-react icons
- sonner toasts
- Vitest

Backend:

- Go
- Gin
- GORM
- Postgres
- MinIO
- Docker Compose

Project services:

- Frontend: `http://127.0.0.1:5173` or next free Vite port
- Backend: `http://127.0.0.1:8080`
- Postgres: `localhost:5432`
- MinIO API: `localhost:9000`
- MinIO Console: `http://localhost:9001`

## Important Files

Frontend:

- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/pages/ImagePage.tsx`
- `frontend/src/pages/VideoPage.tsx`
- `frontend/src/pages/HistoryPage.tsx`
- `frontend/src/components/app/PageShell.tsx`
- `frontend/src/components/ui/*`
- `frontend/src/lib/session.ts`
- `frontend/src/lib/active-generations.ts`
- `frontend/src/index.css`
- `frontend/tailwind.config.js`
- `frontend/vite.config.ts`

Backend:

- `backend/cmd/api/main.go`
- `backend/internal/server/router.go`
- `backend/internal/server/middleware.go`
- `backend/internal/modules/generation/*`
- `backend/internal/modules/minimax/client.go`
- `backend/internal/modules/storage/minio.go`
- `backend/internal/config/config.go`
- `backend/internal/database/postgres.go`

Docs and project notes:

- `DESIGN_GUIDE.md`
- `TODO.md`
- `plan.md`
- `docker-compose.yml`

## UI And Design Rules

Follow `DESIGN_GUIDE.md` for the current app style.

The UI should be:

- Simple.
- Clean.
- Neutral.
- Practical.
- shadcn-style.
- Workspace-first, not marketing-first.

Use:

- Neutral background.
- White cards.
- Soft borders.
- Small Lucide icons.
- No emoji UI icons.
- No big gradients.
- No heavy shadows.
- No nested cards.
- One short title and one muted description per page.

Main layout:

- Shared shell: `PageShell`.
- Page width: `max-w-6xl`.
- Page padding: `px-4 py-6 sm:px-6 lg:px-8`.
- Card radius: `rounded-lg`.
- Major layout gap: `gap-6`.

Tool pages use two columns on desktop:

```tsx
<div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
  <Card>{/* controls */}</Card>
  <Card className="lg:sticky lg:top-6 lg:self-start">{/* result */}</Card>
</div>
```

For unfinished generation jobs:

- The source page should show a loading result panel.
- History should show a spinner card with `pending` or `processing`.
- Local active jobs are tracked in `frontend/src/lib/active-generations.ts`.
- History must dedupe local placeholders against backend generation records.

## Frontend Patterns

Session:

- Use `useSession()` from `frontend/src/lib/session.ts`.
- It creates a browser UUID and stores it in localStorage.
- Always send `sessionId` to generation and history endpoints.

Active generation state:

- Use `createActiveGeneration()` immediately when a user clicks generate.
- Use `updateActiveGeneration()` once the backend returns `generationId`.
- Use `removeActiveGeneration()` when a synchronous request fails or completes.
- Use `removeActiveGenerationByGenerationId()` when polling finishes.

History behavior:

- Fetch `/api/v1/generations?sessionId=...`.
- Merge backend generations with active local generations.
- Poll backend records where status is `pending` or `processing`.
- Do not show duplicate cards for the same generation.
- Do not show an empty state when the API failed; show an error state.

Local Vite proxy:

- Host-local Vite should proxy `/api` to `http://127.0.0.1:8080`.
- Docker frontend should set `VITE_API_URL=http://backend:8080`.
- This avoids `getaddrinfo ENOTFOUND backend` when running Vite on the host.

## Backend Patterns

Generation status values:

- `pending`
- `processing`
- `success`
- `failed`

Generation modes:

Image:

- `text_to_image`
- `image_to_image`

Video:

- `text_to_video`
- `image_to_video`
- `first_last_frame_video`
- `subject_reference_video`

API endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| POST | `/api/v1/upload` | Upload reference image |
| POST | `/api/v1/images/generate` | Generate image |
| POST | `/api/v1/videos/generate` | Create video task |
| GET | `/api/v1/generations?sessionId=...` | List session generations |
| GET | `/api/v1/generations/:id` | Get and update generation status |
| POST | `/api/v1/videos/:generationId/poll` | Poll video task |
| DELETE | `/api/v1/generations/:id` | Delete generation |

Video flow:

1. Frontend posts `/api/v1/videos/generate`.
2. Backend creates a MiniMax video task.
3. Backend stores `taskId` and marks status `processing`.
4. Frontend polls `/api/v1/generations/:id`.
5. Backend queries MiniMax task status.
6. If success, backend downloads video, saves to MinIO, and marks `success`.
7. If failed, backend stores MiniMax error and marks `failed`.

Image flow:

1. Frontend posts `/api/v1/images/generate`.
2. Backend calls MiniMax.
3. Backend downloads generated images.
4. Backend stores images in MinIO.
5. Backend stores metadata and returns output URLs.

## Known Blocker

Image-to-image in local dev can fail with:

```txt
disallowed image url: localhost or private address not allowed
```

Cause:

- MiniMax cannot fetch private/local MinIO URLs from the public internet.

Likely fixes:

- Use an ngrok tunnel for MinIO in development.
- Use public S3/R2/Cloudinary storage for reference images.
- Add a `MINIO_PUBLIC_URL` style config and return public URLs for MiniMax inputs.

## MiniMax Notes

Base URL:

```txt
https://api.minimax.io
```

Image model currently used:

```txt
image-01
```

Video models currently shown in the UI:

```txt
MiniMax-Hailuo-2.3
MiniMax-Hailuo-2.3-Fast-6s-768p
```

Camera command chips:

```txt
[Push in]
[Pull out]
[Pan left]
[Pan right]
[Tilt up]
[Tilt down]
[Zoom in]
[Zoom out]
[Tracking shot]
[Static shot]
[Shake]
```

Important: if MiniMax API details are uncertain or likely changed, verify against the official MiniMax docs before changing the client.

## Commands

Start everything:

```bash
docker compose up --build
```

Start detached:

```bash
docker compose up --build -d
```

Rebuild backend only:

```bash
docker compose up -d --build backend
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
npm test -- --run
```

Backend:

```bash
cd backend
go test ./...
go build -o bin/api ./cmd/api
go run ./cmd/api
```

Docker checks:

```bash
docker compose ps
docker compose logs --tail=50 backend
docker compose logs --tail=50 frontend
```

Postgres quick reset:

```bash
docker compose exec postgres psql -U app -d genapp -c "DROP TABLE IF EXISTS generations CASCADE;"
```

## Environment Variables

Typical Docker/local environment:

```env
APP_ENV=local
PORT=8080
DATABASE_URL=postgres://app:app@postgres:5432/genapp?sslmode=disable
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minio
MINIO_SECRET_KEY=minio123
MINIO_BUCKET=generations
MINIO_USE_SSL=false
MINIMAX_BASE_URL=https://api.minimax.io
MINIMAX_API_KEY=your_key_here
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Frontend Docker override:

```env
VITE_API_URL=http://backend:8080
```

Potential future env for public reference image URLs:

```env
MINIO_PUBLIC_URL=https://public-minio-or-tunnel.example.com
```

## Testing Rules

Before saying a frontend change is done:

```bash
cd frontend
npm run build
npm test -- --run
```

Vitest may print a sandbox websocket warning like:

```txt
listen EPERM 0.0.0.0:24678
```

If tests still pass, mention the warning but do not treat it as a failure.

Before saying a backend change is done:

```bash
cd backend
go test ./...
```

If the running Docker backend must use the change:

```bash
docker compose up -d --build backend
```

## Project Rules

- Do not remove user work from unrelated files.
- Keep frontend changes consistent with `DESIGN_GUIDE.md`.
- Prefer existing shadcn-style components in `frontend/src/components/ui`.
- Use Lucide icons instead of emoji icons.
- Keep app screens usable first; do not build landing pages.
- Use `rg` for searching.
- Run focused tests/builds after changes.
- If using local Vite, remember backend proxy should target `127.0.0.1:8080`.
- If using Docker frontend, remember `VITE_API_URL=http://backend:8080`.
