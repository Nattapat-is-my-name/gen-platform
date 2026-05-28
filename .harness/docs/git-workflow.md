# Git Workflow

## Branch strategy

- **Main branch**: `main` — production-ready, never directly edited.
- **Feature branches**: `feature/<name>` — all work happens here.
- Use **worktrees** for all code changes — never edit `main` directly.

## Worktree workflow

1. Load the `worktree-management` skill before making any code changes.
2. Create a worktree branch: `mavis worktree create feature/<name>`.
3. Make changes in the worktree.
4. Validate: `npm run build` / `go test ./...`.
5. Commit in the worktree when done.
6. The orchestrator handles MR creation and merging.

## Commit messages

Keep them short and meaningful:

- `feat: add image-to-video upload controls`
- `fix: dedupe active generations against backend records`
- `refactor: extract MiniMax client into separate package`
- `test: add history dedup edge case tests`

## What to commit

- Code changes, tests, and docs.
- NOT: `.env`, `node_modules/`, build artifacts, `bin/`.

## CI / validation

- Frontend: `npm run build && npm test -- --run`
- Backend: `go test ./...`
- Run both before marking a feature complete.