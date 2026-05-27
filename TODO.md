# gen-video TODO

Last updated: 2026-05-27

This is the active execution list for day-to-day work.

Source-of-truth map:

- Strategy/scope: `plan.md`
- UI system: `DESIGN_GUIDE.md`
- AI/coding context: `.kilo/agent/agent.md`

## Current Status

### Done

- [x] Docker Compose setup for frontend, backend, Postgres, and MinIO.
- [x] React Vite frontend with shadcn-style UI.
- [x] Shared app shell and clean UI style guide.
- [x] Text-to-image generation.
- [x] Image upload to MinIO.
- [x] Generated image download from MiniMax and save to MinIO.
- [x] Store generation metadata in Postgres.
- [x] Browser session isolation with local UUID.
- [x] Session-based history filtering.
- [x] History cards with preview, status, open, download, and delete.
- [x] Local Vite proxy works from host: `/api` -> `127.0.0.1:8080`.
- [x] Docker frontend uses `VITE_API_URL=http://backend:8080`.
- [x] Video generation request sends `sessionId`.
- [x] Video task creation stores `taskId` and status.
- [x] History shows pending/processing jobs with loading state.
- [x] History polls unfinished backend jobs.
- [x] Duplicate local loading cards are deduped against backend generations.
- [x] Backend generation responses include `createdAt`.

## Next Priority

### 1. Finish Reference Image Public URL Flow

Image-to-image currently works structurally, but local dev can fail because MiniMax cannot fetch private/localhost MinIO URLs.

Known error:

```txt
disallowed image url: localhost or private address not allowed
```

Tasks:

- [ ] Add `MINIO_PUBLIC_URL` config.
- [ ] Update storage URL generation so MiniMax receives a public URL when configured.
- [ ] Support dev tunnel flow, such as ngrok or Cloudflare Tunnel.
- [ ] Document dev tunnel setup in README or TODO.
- [ ] Test image-to-image with a public MinIO URL.

Recommended dev path:

```bash
ngrok http 9000
```

Then set:

```env
MINIO_PUBLIC_URL=https://your-tunnel-url
```

Production options:

- Cloudflare R2.
- S3 public bucket or signed public URL.
- Cloudinary or ImgBB.

### 2. Finish Non-Text Video Modes

The UI exposes the modes, but image inputs are not complete for:

- `image_to_video`
- `first_last_frame_video`
- `subject_reference_video`

Tasks:

- [ ] Add image/video upload controls on `VideoPage`.
- [ ] Store uploaded object keys in `inputObjectKeys`.
- [ ] Send `inputObjectKeys` to `/api/v1/videos/generate`.
- [ ] Convert uploaded object keys into public URLs for MiniMax.
- [ ] Update backend MiniMax client request bodies for each mode if needed.
- [ ] Show selected input previews in the video form.
- [ ] Validate required inputs per mode before submit.

Mode requirements:

- Image to Video: one input image.
- First + Last Frame: first frame and last frame images.
- Subject Reference: subject reference image plus prompt.

### 3. Improve Video Polling And Download UX

Basic polling exists, but the video workflow should feel complete.

Tasks:

- [ ] Keep polling visible on `VideoPage` and `HistoryPage`.
- [ ] Show clearer state copy: queued, generating, downloading, complete, failed.
- [ ] Add manual refresh for an individual generation card.
- [ ] Add direct video download button in History.
- [ ] Ensure downloaded video filenames are useful.
- [ ] Handle MiniMax task failure messages cleanly.

### 4. Retry Failed Generations

The MVP plan includes retry failed generation.

Tasks:

- [ ] Add retry action to failed History cards.
- [ ] Store enough request settings to retry accurately.
- [ ] Retry image generations with original mode, prompt, model, aspect ratio, and reference object.
- [ ] Retry video generations with original mode, prompt, model, duration, resolution, optimizer settings, and input objects.
- [ ] Decide whether retry creates a new generation or updates the old one.

### 5. Better API Contract And Types

The plan mentions OpenAPI and generated TypeScript client, but the app currently uses direct `fetch`.

Tasks:

- [ ] Add or update backend OpenAPI spec.
- [ ] Generate TypeScript API client.
- [ ] Replace repeated `fetch` calls with typed API helper functions.
- [ ] Add shared frontend types for generation responses.
- [ ] Keep API error response shape consistent.

## Medium Priority

### History Improvements

- [ ] Add pagination or infinite loading for large history.
- [ ] Add filters for image/video/status.
- [ ] Add search by prompt.
- [ ] Add confirmation before delete.
- [ ] Fix MinIO deletion logic for presigned output URLs versus object keys.

### Image UX

- [ ] Add gallery support if MiniMax returns multiple images.
- [ ] Add aspect ratio visual picker.
- [ ] Add model selector when more image models are available.
- [ ] Add prompt examples without turning it into a full template system.

### Video UX

- [ ] Add `fastPretreatment` control if supported by selected model/mode.
- [ ] Allow combining up to three camera commands in one bracket.
- [ ] Add mode-specific helper text or validation state.
- [ ] Add preview cards for uploaded video inputs.

### Error Handling

- [ ] Show MiniMax error details where useful.
- [ ] Avoid generic "Network error" when backend returns useful JSON.
- [ ] Add empty/error/loading states to every async panel.
- [ ] Log backend errors with enough context for debugging.

## Low Priority

- [ ] Add image gallery page.
- [ ] Add generation detail page.
- [ ] Add keyboard-friendly command palette.
- [ ] Add dark mode after light UI is stable.
- [ ] Add admin/debug page for backend health, MinIO, and database status.
- [ ] Add nicer file naming for downloads.

## Bugs To Watch

- [ ] Image-to-image fails in local dev without public URL.
- [ ] Non-text video modes may create tasks without real input media until upload flow is completed.
- [ ] MinIO object deletion may not work correctly when only a presigned URL is stored.
- [ ] Backend `/uploads` static route currently points at `/uploads`; confirm whether it is needed with MinIO.
- [ ] If MiniMax model names change, update model dropdowns and backend client together.

## Validation Checklist

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

Docker:

```bash
docker compose ps
docker compose logs --tail=50 backend
docker compose logs --tail=50 frontend
```

Rebuild backend after backend changes:

```bash
docker compose up -d --build backend
```

## Key Project Patterns

### Session Management

```txt
Frontend useSession() creates a UUID in localStorage.
Frontend sends sessionId on generate/list requests.
Backend stores session_id and filters history by session.
```

### Image-to-Image Flow

```txt
1. Frontend uploads file to POST /api/v1/upload.
2. Backend saves file in MinIO and returns objectKey.
3. Frontend sends referenceImageObjectKey to POST /api/v1/images/generate.
4. Backend turns object key into URL.
5. Backend sends public reference URL to MiniMax.
6. Backend downloads generated output and stores it in MinIO.
7. Frontend shows output and History records it.
```

Current blocker is step 5 in local dev unless the URL is public.

### Video Flow

```txt
1. Frontend creates local active generation.
2. Frontend posts to POST /api/v1/videos/generate.
3. Backend creates MiniMax task and saves taskId.
4. Frontend and History poll GET /api/v1/generations/:id.
5. Backend queries MiniMax and updates status.
6. On success, backend downloads video and stores output URL.
7. Frontend removes local active placeholder and shows final result.
```

## Environment Notes

Current env:

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
MINIMAX_API_KEY=your_api_key_here
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Needed for public reference images:

```env
MINIO_PUBLIC_URL=https://your-public-url
```
