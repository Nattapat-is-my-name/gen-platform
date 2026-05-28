# Test Policy

## Philosophy

Tests should verify behavior, not implementation details. Write tests that would catch real regressions.

## Frontend tests

- Run: `cd frontend && npm test -- --run`
- Vitest for unit/component tests.
- Test alongside the code under test (e.g., `ImagePage.test.tsx` next to `ImagePage.tsx`).
- Test file naming: `*.test.ts` or `*.test.tsx`.

### What to test

- Happy path: user clicks Generate → API called → result shown.
- Error path: API fails → error state shown.
- Session: UUID sent on API calls.
- Empty states: shown when no history.
- Form validation: required fields enforced.

## Backend tests

- Run: `cd backend && go test ./...`
- Go standard `testing` package.
- Table-driven tests for handlers.
- Test file naming: `*_test.go` in the same package.

### What to test

- Handler responses (status code + body).
- Error handling (invalid input → 400).
- Service logic (MiniMax call flow, MinIO upload).
- Repository queries (GORM interactions).

## Before saying "done"

- Run the full validation suite.
- Frontend: `cd frontend && npm run build && npm test -- --run`
- Backend: `cd backend && go test ./...`
- If you changed Docker-configured services: `docker compose up -d --build <service>`