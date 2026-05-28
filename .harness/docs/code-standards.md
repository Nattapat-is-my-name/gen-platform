# Code Standards — gen-video

Keep this file as a single source of truth for coding conventions. Link from agent prompts instead of inlining.

## Project source-of-truth order

1. README.md — quick start
2. TODO.md — active task queue
3. DESIGN_GUIDE.md — UI/UX rules
4. .harness/memory/MEMORY.md — team shared lessons

## Git workflow

- All code changes happen in worktrees: `mavis team worktree new`
- Branch naming: `feature/<name>` or `fix/<name>`
- Never commit to main or develop directly
- Commit only when validation passes

## Frontend conventions

### Styling

- Follow `DESIGN_GUIDE.md` exactly
- Two-column layout for tool pages: `grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]`
- `max-w-6xl` page container
- `rounded-lg` cards
- Lucide icons only, no emoji
- CSS variables via `tailwind.config.js`
- Neutral palette — color only for state

### Patterns

- Session via `useSession()` → stores localStorage UUID → `X-Session-ID` header
- History deduplication: merge backend + local active generations
- React Query for data fetching
- zod for form validation
- shadcn components from `frontend/src/components/ui/`

### Validation

```bash
cd frontend && npm run build && npm test -- --run
```

## Backend conventions

### Structure

- `backend/cmd/api/main.go` — entry point
- `backend/internal/server/router.go` — routes
- `backend/internal/modules/generation/` — generation logic
- `backend/internal/modules/minimax/client.go` — MiniMax API client
- `backend/internal/modules/storage/minio.go` — MinIO storage

### Status values

`pending` | `processing` | `success` | `failed`

### Generation modes

Image: `text_to_image`, `image_to_image`
Video: `text_to_video`, `image_to_video`, `first_last_frame_video`, `subject_reference_video`

### Validation

```bash
cd backend && go test -v -race ./...
```

## Docker

- `docker compose up --build` starts everything
- Rebuild backend: `docker compose up -d --build backend`
- Reset DB: `docker compose exec postgres psql -U app -d genapp -c "DROP TABLE IF EXISTS generations CASCADE;"`