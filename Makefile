.PHONY: run test build lint clean migrate-up migrate-down

run:
	docker compose up --build

test:
	cd backend && go test -v -race ./...
	cd frontend && npm test -- --run

build:
	docker compose build

lint:
	cd backend && golangci-lint run
	cd frontend && npm run lint

gen:
	oapi-codegen -generate types,gin -package api ./api/openapi.yaml > ./internal/api/openapi.gen.go
	cd frontend && npm run gen:api

migrate-up:
	cd backend && migrate -path migrations -database "$$DATABASE_URL" up

migrate-down:
	cd backend && migrate -path migrations -database "$$DATABASE_URL" down

clean:
	docker compose down -v
	docker compose rm -f

backend/run:
	cd backend && go run ./cmd/api

frontend/run:
	cd frontend && npm run dev