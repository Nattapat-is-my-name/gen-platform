# Project Agent

Specialized agent for MiniMax Gen Web project.

## Agent Guidelines

**When to use web search & skills:**
- If you don't know something, search the web or use available skills
- Use `use context7` in prompts when needing up-to-date library documentation
- Don't guess APIs or library versions - verify with current docs

**Tech stack updates:**
- Reference https://context7.com for up-to-date library documentation
- When implementing features, verify current best practices via context7

## Project Stack

- **Frontend**: React Vite + TypeScript + shadcn/ui + Tailwind + TanStack Query
- **Backend**: Go Gin + GORM + OpenAPI
- **Database**: Postgres
- **Storage**: MinIO
- **Tests**: Ginkgo/Omega (backend), Vitest (frontend)
- **Infrastructure**: Docker Compose

## MiniMax API Reference

**Base URL:** `https://api.minimax.io`

**API Type:** OpenAI-compatible API

**Authentication:**
```bash
export OPENAI_BASE_URL=https://api.minimax.io/v1
export OPENAI_API_KEY=${MINIMAX_API_KEY}
```

### MiniMax Endpoints

| Feature | Endpoint | Method |
|---------|----------|--------|
| Text to Image | `/v1/text_to_image` | POST |
| Image to Image | `/v1/image_to_image` | POST |
| Text to Video | `/v1/video_generation` | POST |
| Image to Video | `/v1/image_to_video` | POST |
| First+Last Frame Video | `/v1/first_last_frame_video` | POST |
| Subject Reference Video | `/v1/subject_reference_video` | POST |
| Query Video Task | `/v1/video_generation/{task_id}` | GET |
| Download Video | `/v1/video_generation/file/{file_id}` | GET |

### MiniMax Video Models
- `MiniMax-Hailuo-02` (latest, best quality)
- `MiniMax-Hailuo-2.3`
- `MiniMax-Hailuo-01`

### MiniMax Image Models
- `image-01`

### Video Options
- **Duration:** 6 or 10 seconds
- **Resolution:** 768P, 1080P

### Camera Movement Commands
```
[Push in], [Pull out], [Pan left], [Pan right]
[Tilt up], [Tilt down], [Zoom in], [Zoom out]
[Tracking shot], [Static shot], [Shake]
```

## Project Structure

```
gen-platform/
├── frontend/           # React Vite app
│   ├── src/
│   │   ├── app/       # App router
│   │   ├── pages/     # Page components
│   │   ├── components/# UI components
│   │   ├── api/       # Generated OpenAPI client
│   │   └── lib/       # Utilities
│   ├── package.json
│   └── vite.config.ts
├── backend/           # Go Gin API
│   ├── cmd/api/       # Main entrypoint
│   ├── internal/
│   │   ├── api/       # OpenAPI generated types
│   │   ├── config/    # Configuration
│   │   ├── database/  # GORM postgres connection
│   │   ├── server/    # Router, middleware
│   │   └── modules/   # Business logic
│   │       ├── generation/  # model, repository, service, handler, dto
│   │       ├── minimax/     # MiniMax API client
│   │       └── storage/      # MinIO storage
│   ├── api/           # OpenAPI spec
│   └── go.mod
├── docker-compose.yml
├── .env.example
└── Makefile
```

## Common Tasks

### Run locally

```bash
cp .env.example .env
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- Swagger: http://localhost:8080/swagger/index.html
- MinIO: http://localhost:9001
- Postgres: localhost:5432

### Backend commands

```bash
cd backend

# Run tests
go test -v -race ./...

# Run specific test
go test -v -race ./internal/modules/generation/...

# Build
go build -o bin/api ./cmd/api

# Run linter
golangci-lint run

# Run directly
go run ./cmd/api
```

### Frontend commands

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev

# Run tests
npm test

# Build
npm run build

# Generate API client
npm run gen:api

# Run linter
npm run lint
```

### Docker commands

```bash
# Build images
docker compose build

# Start services
docker compose up

# Stop services
docker compose down

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Rebuild without cache
docker compose build --no-cache
```

## Database

### Connect to Postgres

```bash
psql postgres://app:app@localhost:5432/genapp
```

## MinIO

- Endpoint: localhost:9000
- Console: http://localhost:9001
- Access Key: minio
- Secret Key: minio123
- Bucket: generations

## Testing

### Backend (Ginkgo/Omega)

```bash
cd backend
go test -v -race ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test -v ./internal/modules/generation/...
```

### Frontend (Vitest)

```bash
cd frontend
npm test -- --run
```

## Environment Variables

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

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/v1/images/generate | Generate image |
| POST | /api/v1/videos/generate | Generate video |
| GET | /api/v1/generations/:id | Get generation status |
| POST | /api/v1/videos/:id/poll | Poll video task |
| GET | /api/v1/generations | List generations |
| DELETE | /api/v1/generations/:id | Delete generation |

## Generation Modes

### Image
- `text_to_image`
- `image_to_image`

### Video
- `text_to_video`
- `image_to_video`
- `first_last_frame_video`
- `subject_reference_video`

## Status Values

- `pending`
- `processing`
- `success`
- `failed`