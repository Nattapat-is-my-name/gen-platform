# gen-video

MiniMax image and video generation app built with React + Vite (frontend) and Go + Gin (backend), with Postgres + MinIO in Docker.

## What This Project Does

- Text-to-image generation.
- Image-to-image generation with a reference image.
- Async video generation tasks.
- Session-based history for generated items.
- Download/open outputs from history.

## Project Context Read Order

Use this order for both humans and AI agents:

1. `README.md` (this file): quick start and source-of-truth map.
2. `TODO.md`: current execution backlog and next tasks.
3. `DESIGN_GUIDE.md`: UI/UX system and styling rules.
4. `.kilo/agent/agent.md`: project-specific coding/agent context.
5. `plan.md`: product scope and strategy (high-level, not task-level).

## Quick Start (Docker)

1. Copy env file and set your MiniMax key:

```bash
cp .env.example .env
```

2. Start all services:

```bash
docker compose up --build
```

3. Open:

- Frontend: `http://127.0.0.1:5173` (or next free Vite port, for example `5174`)
- Backend health: `http://127.0.0.1:8080/health`
- MinIO console: `http://127.0.0.1:9001`

## Optional: Run Frontend On Host

If backend is in Docker and frontend runs locally:

```bash
cd frontend
npm install
npm run dev
```

The Vite proxy is configured so `/api` calls go to `127.0.0.1:8080`.

## Daily Development Flow

1. Pick top unchecked item from `TODO.md`.
2. Implement a small, testable slice.
3. Run frontend/backend checks.
4. Update `TODO.md` status.
5. Keep UI aligned with `DESIGN_GUIDE.md`.

## Validation Commands

Frontend:

```bash
cd frontend
npm run build
npm test -- --run
```

Backend:

```bash
cd backend
go test ./...
```

## Important Environment Notes

- `MINIMAX_API_KEY` must be set in backend `.env`.
- Image-to-image in local dev may fail if MiniMax cannot reach a private MinIO URL.
- For that case, use a public URL/tunnel and (planned) `MINIO_PUBLIC_URL` support.

## Source-Of-Truth Rules

- Current work queue: `TODO.md`.
- UI design decisions: `DESIGN_GUIDE.md`.
- Runtime architecture and coding conventions: `.kilo/agent/agent.md`.
- High-level scope and milestones: `plan.md`.
