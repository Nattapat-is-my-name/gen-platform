# Project Agent

Specialized agent for MiniMax Gen Web project.

## Project Stack

- **Frontend**: React Vite + TypeScript + shadcn/ui + Tailwind + TanStack Query
- **Backend**: Go Gin + GORM + OpenAPI
- **Database**: Postgres
- **Storage**: MinIO
- **Tests**: Ginkgo/Omega (backend), Vitest (frontend)
- **Infrastructure**: Docker Compose

## Project Structure

```
minimax-gen-web/
├── frontend/           # React Vite app
│   ├── src/
│   │   ├── app/       # App router
│   │   ├── pages/     # Page components
│   │   ├── components/# UI components
│   │   ├── api/       # Generated OpenAPI client
│   │   └── lib/       # Utilities
│   └── package.json
├── backend/           # Go Gin API
│   ├── cmd/api/       # Main entrypoint
│   ├── internal/
│   │   ├── api/       # OpenAPI generated types
│   │   ├── config/    # Configuration
│   │   ├── server/    # Router, middleware
│   │   └── modules/   # Business logic
│   ├── api/           # OpenAPI spec
│   ├── migrations/    # SQL migrations
│   └── go.mod
├── docker-compose.yml
└── .env.example
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

# Run migrations
migrate -path migrations -database "$DATABASE_URL" up

# Generate OpenAPI types
oapi-codegen -generate types,gin -package api ./api/openapi.yaml > ./internal/api/openapi.gen.go

# Run linter
golangci-lint run
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

### Run migrations

```bash
cd backend
migrate -path migrations -database "postgres://app:app@localhost:5432/genapp?sslmode=disable" up
```

### Create migration

```bash
cd backend
migrate create -ext sql -dir migrations -seq add_user_table
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