# Development Commands

## Start development environment

```bash
cp .env.example .env
docker compose up --build
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