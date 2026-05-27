# Development Commands

## Start development environment

```bash
cp .env.example .env
docker compose up --build
# IMPORTANT: Always check logs after starting:
docker compose logs --tail=20
```

## Run all tests

```bash
# Backend
cd backend && go test -v -race ./...

# Frontend
cd frontend && npm test -- --run
```

## Build for production

```bash
docker compose -f docker-compose.yml build
```

## Clean up

```bash
docker compose down -v
docker compose rm -f
```

## Troubleshooting

```bash
# Check all container logs
docker compose logs

# Check specific service logs
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
docker compose logs minio

# Restart a specific service
docker compose restart frontend

# Rebuild without cache
docker compose build --no-cache
docker compose up -d
```