# gen-video Product Plan

Last reviewed: 2026-05-27

## Role Of This File

This file is the high-level product/technical plan.

- Use `TODO.md` for active implementation tasks.
- Use `DESIGN_GUIDE.md` for UI/UX rules.
- Use `.kilo/agent/agent.md` for project-specific AI/coding context.

## Product Goal

Ship a simple, clean generation workspace for MiniMax media:

- Image generation (text and reference modes).
- Video generation (text and image-driven modes).
- Reliable history with clear status and output actions.
- Local-first development with Docker and predictable setup.

## In Scope (MVP)

Image:

- Text-to-image.
- Image-to-image/reference image.
- Store output metadata in Postgres.
- Store media objects in MinIO.
- Show history and download/open output.

Video:

- Text-to-video.
- Image-to-video.
- First+last frame video.
- Subject reference video.
- Async task creation and status polling.
- Save completed outputs to MinIO and history.

Shared:

- Session-based history isolation (no auth for MVP).
- Clean shadcn-style UI with strong loading/error states.

## Out Of Scope (For Now)

- Auth, billing, credits.
- Team workspaces.
- Public sharing links.
- Multi-provider generation routing.
- Marketplace/templates platform.

## Architecture Decisions

Frontend:

- React + Vite + TypeScript.
- Tailwind + shadcn-style primitives.
- Session ID from localStorage for scoping history.

Backend:

- Go + Gin + GORM.
- Postgres for generation metadata.
- MinIO for uploads/outputs.
- MiniMax API integration with async video polling.

Environment:

- Docker Compose for local stack.
- Frontend host mode uses Vite proxy for `/api`.

## UX Principles

- Keep the interface practical and quiet.
- Favor clarity over visual flair.
- Always show explicit state: pending, processing, success, failed.
- Keep primary flows short: generate -> observe progress -> open/download.

Reference: `DESIGN_GUIDE.md`.

## Delivery Milestones

### Milestone 1: Foundation (Done)

- Core Docker stack.
- Base frontend pages and shared shell.
- Backend generation modules and persistence.

### Milestone 2: Core Generation + History (Mostly Done)

- Text-to-image flow.
- Async video task creation and polling baseline.
- Session-based history and loading placeholders.

### Milestone 3: Input URL Reliability (In Progress)

- Public URL support for reference inputs (`MINIO_PUBLIC_URL` pattern).
- Complete non-text video input flows.

### Milestone 4: Workflow Polish (Next)

- Retry failed jobs.
- Better status copy and per-card refresh.
- Typed API contract (OpenAPI + generated frontend client).

## Primary Risks And Mitigations

Risk: MiniMax cannot fetch localhost/private media URLs.

- Mitigation: public tunnel/public object URL support and config-driven input URL generation.

Risk: Async tasks produce unclear UX when user navigates away.

- Mitigation: shared active-generation store + history polling + dedupe logic.

Risk: drift between docs and implementation.

- Mitigation: treat `TODO.md` as active queue and keep this file strategy-only.

## Definition Of Done (For A Feature)

- Works end-to-end in UI and backend.
- Loading/error/success states are visible and accurate.
- History reflects in-progress and completed states correctly.
- Relevant frontend/backend checks pass.
- `TODO.md` updated.
