project plan

```txt
React Vite + shadcn/ui frontend
Go Gin backend + GORM (NOT sqlx)
Postgres database
MinIO object storage
Swagger/OpenAPI contract
Generated TypeScript frontend API client
Docker Compose for local run
Tests with gomock + Ginkgo + Omega
No login
No billing
No public sharing
Shared backend MiniMax API key
Responsive web UI
```

MiniMax video generation supports four core video modes: text-to-video, image-to-video, first-and-last-frame video, and subject-reference video. The official workflow is async: create generation task, poll status with `task_id`, then retrieve/download file with `file_id`. ([MiniMax API Docs][1]) Your uploaded T2V doc also confirms the `/v1/video_generation` endpoint, supported T2V models, prompt limit, duration/resolution options, prompt optimizer, fast pretreatment, callback URL, and camera movement commands.  MiniMax image generation supports text-to-image and image-to-image/reference-image generation. ([MiniMax][2])

---

# 1. Final MVP scope

## Included

### Image generation

1. Text to Image
2. Image to Image / Reference Image
3. Save generated images to MinIO
4. Save metadata to Postgres
5. Show image history
6. Download image

### Video generation

1. Text to Video
2. Image to Video
3. First + Last Frame Video
4. Subject Reference Video
5. Query task status
6. Download generated video
7. Save generated video to MinIO
8. Save task metadata to Postgres
9. Show video history
10. Retry failed generation

MiniMax docs list the OpenAPI specs for text-to-image, image-to-image, text-to-video, image-to-video, start/end-to-video, subject-reference-to-video, and video download/query APIs in the docs index. ([MiniMax][3])

## Not included yet

```txt
Login
Billing
Credits
Admin dashboard
Public sharing links
Multi-provider support
Prompt marketplace
Team workspace
Mobile app
```

For prompt templates, since you said “idk,” keep only **basic example prompts** in the UI, not a full template system.

---

# 2. User flow

## Home page

User sees:

```txt
Create Image
Create Video
Generation History
```

No login. Everyone using the app uses the same backend MiniMax key.

---

## Image flow

```txt
Choose Image mode
→ Select Text to Image or Image to Image
→ Enter prompt
→ Upload reference image if needed
→ Choose aspect ratio
→ Click Generate
→ Backend calls MiniMax
→ Result saved to MinIO
→ Metadata saved to Postgres
→ Frontend shows result
```

---

## Video flow

```txt
Choose Video mode
→ Select generation type
→ Enter prompt
→ Upload images if required
→ Choose model, duration, resolution
→ Click Generate
→ Backend creates MiniMax task
→ Save task_id in Postgres
→ Frontend polls backend
→ Backend queries MiniMax task status
→ When success, backend downloads video
→ Save video to MinIO
→ Save file metadata to Postgres
→ Frontend shows video player
```

---

# 3. UI pages

## `/`

Dashboard.

Cards:

```txt
Text to Image
Image to Image
Text to Video
Image to Video
First + Last Frame Video
Subject Reference Video
History
```

---

## `/images`

Tabs:

```txt
Text to Image
Image to Image
```

Fields:

```txt
Prompt
Aspect Ratio
Reference Image Upload
Generate Button
Result Gallery
```

---

## `/videos`

Tabs:

```txt
Text to Video
Image to Video
First + Last Frame
Subject Reference
```

Fields:

```txt
Prompt
Model
Duration
Resolution
Prompt Optimizer
Fast Pretreatment
Camera Commands
Image Uploads
Generate Button
Task Status
Video Preview
Download Button
```

For T2V camera controls, add simple chips:

```txt
Pan Left
Pan Right
Push In
Pull Out
Zoom In
Zoom Out
Tilt Up
Tilt Down
Tracking Shot
Static Shot
Shake
```

When clicked, insert syntax like:

```txt
[Push in]
[Tracking shot]
[Pan left,Pedestal up]
```

Your T2V doc says multiple camera commands can be combined in one bracket, recommended max 3. 

---

## `/history`

Table/cards:

```txt
Type
Mode
Prompt
Status
Created At
Preview
Download
Retry
Delete
```

---

# 4. Frontend architecture

```txt
frontend/
  src/
    app/
      App.tsx
      router.tsx
    pages/
      DashboardPage.tsx
      ImagePage.tsx
      VideoPage.tsx
      HistoryPage.tsx
    components/
      layout/
        AppShell.tsx
        Header.tsx
        Sidebar.tsx
      forms/
        ImageGenerationForm.tsx
        VideoGenerationForm.tsx
        UploadDropzone.tsx
        CameraCommandPicker.tsx
      generation/
        GenerationCard.tsx
        StatusBadge.tsx
        ResultPreview.tsx
        VideoPlayer.tsx
      ui/
        shadcn components
    api/
      generated/
        // generated from backend OpenAPI
    lib/
      apiClient.ts
      constants.ts
      validators.ts
    types/
      generation.ts
```

Use:

```txt
Vite
React
TypeScript
Tailwind
shadcn/ui
React Hook Form
Zod
TanStack Query
OpenAPI-generated API client
```

---

# 5. Backend architecture

```txt
backend/
  cmd/
    api/
      main.go
  internal/
    config/
      config.go
    server/
      router.go
      middleware.go
    modules/
      generation/
        handler.go
        service.go
        repository.go
        dto.go
        model.go
      minimax/
        client.go
        image.go
        video.go
        file.go
      storage/
        minio.go
      database/
        postgres.go
    pkg/
      errors/
      logger/
  migrations/
  docs/
    swagger.yaml
  tests/
```

Use:

```txt
Gin
sqlc or sqlx
Postgres
MinIO SDK
swaggo or oapi-codegen
gomock
Ginkgo
Omega
Docker Compose
```

My recommendation: use **oapi-codegen** if you want contract-first OpenAPI and generated types. Use **swaggo** if you prefer generating Swagger from comments. Since you said “swagger gen to frontend,” contract-first OpenAPI is cleaner.

---

# 6. Docker Compose services

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    env_file:
      - .env
    depends_on:
      - postgres
      - minio

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: genapp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio
      MINIO_ROOT_PASSWORD: minio123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

---

# 7. Environment variables

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
MINIMAX_API_KEY=your_minimax_api_key

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Keep the MiniMax key only in backend `.env`. Never expose it to frontend.

---

# 8. Database schema

## `generations`

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  mode TEXT NOT NULL CHECK (
    mode IN (
      'text_to_image',
      'image_to_image',
      'text_to_video',
      'image_to_video',
      'first_last_frame_video',
      'subject_reference_video'
    )
  ),

  prompt TEXT NOT NULL,
  model TEXT NOT NULL,

  status TEXT NOT NULL CHECK (
    status IN ('pending', 'processing', 'success', 'failed')
  ),

  task_id TEXT,
  minimax_file_id TEXT,

  input_objects JSONB DEFAULT '[]',
  output_objects JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',

  error_code TEXT,
  error_message TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

---

## `uploaded_objects`

```sql
CREATE TABLE uploaded_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,

  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

# 9. Backend API contract

## Health

```txt
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

---

## Image generation

```txt
POST /api/v1/images/generate
```

Request:

```json
{
  "mode": "text_to_image",
  "prompt": "cinematic cyberpunk city at night",
  "model": "image-01",
  "aspectRatio": "16:9",
  "referenceImageObjectKeys": []
}
```

Response:

```json
{
  "generationId": "uuid",
  "status": "success",
  "outputs": [
    {
      "url": "http://localhost:9000/generations/..."
    }
  ]
}
```

---

## Video generation

```txt
POST /api/v1/videos/generate
```

Request:

```json
{
  "mode": "text_to_video",
  "prompt": "A man picks up a book [Pedestal up], then reads [Static shot].",
  "model": "MiniMax-Hailuo-2.3",
  "duration": 6,
  "resolution": "1080P",
  "promptOptimizer": true,
  "fastPretreatment": false,
  "inputObjectKeys": []
}
```

Response:

```json
{
  "generationId": "uuid",
  "taskId": "106916112212032",
  "status": "processing"
}
```

---

## Query status

```txt
GET /api/v1/generations/:id
```

Response:

```json
{
  "id": "uuid",
  "type": "video",
  "mode": "text_to_video",
  "prompt": "A man picks up a book...",
  "status": "processing",
  "taskId": "106916112212032",
  "outputs": []
}
```

---

## Poll video task manually

```txt
POST /api/v1/videos/:generationId/poll
```

Backend behavior:

```txt
Find generation
→ Query MiniMax task status
→ If success, retrieve file_id
→ Download video
→ Upload to MinIO
→ Update generation status
→ Return latest generation
```

---

## History

```txt
GET /api/v1/generations?type=image
GET /api/v1/generations?type=video
GET /api/v1/generations
```

---

## Delete

```txt
DELETE /api/v1/generations/:id
```

Deletes DB row and MinIO objects.

---

# 10. Backend service boundaries

## Generation service

Responsibilities:

```txt
Create generation DB record
Validate mode-specific inputs
Call MiniMax client
Store output metadata
Update status
Return response DTO
```

---

## MiniMax client

Methods:

```go
type MiniMaxClient interface {
    GenerateTextToImage(ctx context.Context, req TextToImageRequest) (*ImageGenerationResult, error)
    GenerateImageToImage(ctx context.Context, req ImageToImageRequest) (*ImageGenerationResult, error)

    CreateTextToVideoTask(ctx context.Context, req TextToVideoRequest) (*VideoTaskResult, error)
    CreateImageToVideoTask(ctx context.Context, req ImageToVideoRequest) (*VideoTaskResult, error)
    CreateFirstLastFrameVideoTask(ctx context.Context, req FirstLastFrameVideoRequest) (*VideoTaskResult, error)
    CreateSubjectReferenceVideoTask(ctx context.Context, req SubjectReferenceVideoRequest) (*VideoTaskResult, error)

    QueryVideoTask(ctx context.Context, taskID string) (*VideoTaskStatus, error)
    DownloadVideoFile(ctx context.Context, fileID string) ([]byte, string, error)
}
```

---

## Storage service

Methods:

```go
type ObjectStorage interface {
    Put(ctx context.Context, key string, body []byte, contentType string) error
    GetPresignedURL(ctx context.Context, key string) (string, error)
    Delete(ctx context.Context, key string) error
}
```

---

# 11. Status model

Use your internal statuses:

```txt
pending
processing
success
failed
```

Map MiniMax statuses into them.

Example:

```txt
Preparing  -> processing
Queueing   -> processing
Processing -> processing
Success    -> success
Fail       -> failed
```

MiniMax’s video status query returns task status and returns file information after success. ([MiniMax API Docs][1])

---

# 12. Lean frontend behavior

Use TanStack Query:

```txt
useGenerateImage()
useGenerateVideo()
useGeneration(id)
useGenerations()
usePollGeneration(id)
useDeleteGeneration()
```

For video polling:

```txt
After POST /videos/generate
→ Save generationId
→ Start polling GET /generations/:id every 3 seconds
→ Also call POST /videos/:generationId/poll every 5 seconds until success/failed
→ Stop polling after terminal state
```

Do not expose MiniMax task IDs too prominently to users. Show them only in an “Advanced details” accordion.

---

# 13. Error handling

Show user-friendly errors:

```txt
Invalid prompt
Sensitive content detected
MiniMax rate limit
Insufficient MiniMax balance
Upload failed
Video generation failed
Download failed
Backend unavailable
```

Your uploaded doc lists MiniMax base error codes including successful request, rate limit, authentication failure, insufficient balance, sensitive content, invalid parameters, and invalid API key. 

Backend should store raw error details in DB but return safe messages to frontend.

---

# 14. Testing plan

## Backend unit tests

Use:

```txt
gomock
Ginkgo
Omega
```

Test:

```txt
Generation service validates required fields
Text-to-video creates DB record and MiniMax task
Image generation saves output object
Video polling updates status to success
Video polling handles failure
Storage upload failure returns proper error
MiniMax API error maps to app error
Repository CRUD works
```

---

## Backend integration tests

Use Docker Compose test profile:

```txt
Postgres test database
MinIO test bucket
Mock MiniMax server
```

Test:

```txt
POST /api/v1/videos/generate
GET /api/v1/generations/:id
POST /api/v1/videos/:id/poll
DELETE /api/v1/generations/:id
```

---

## Frontend tests

Lean version:

```txt
Vitest
React Testing Library
MSW
```

Test:

```txt
Image form validation
Video form validation
Mode-specific upload requirements
History rendering
Status badge rendering
API error display
```

---

# 15. Generated API client flow

Use OpenAPI as the contract:

```txt
backend/api/openapi.yaml
→ generate Go server types
→ generate TypeScript frontend client
```

Recommended commands:

```bash
# Backend Go types
oapi-codegen -generate types,gin -package api ./api/openapi.yaml > ./internal/api/openapi.gen.go

# Frontend TypeScript client
openapi-generator-cli generate \
  -i ./backend/api/openapi.yaml \
  -g typescript-fetch \
  -o ./frontend/src/api/generated
```

Then frontend calls only generated client methods, not handwritten fetch wrappers.

---

# 16. Local run commands

Target developer flow:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:8080
Swagger:  http://localhost:8080/swagger/index.html
MinIO:    http://localhost:9001
Postgres: localhost:5432
```

---

# 17. Suggested repo structure

```txt
minimax-gen-web/
  docker-compose.yml
  .env.example
  README.md

  frontend/
    Dockerfile
    package.json
    vite.config.ts
    tailwind.config.ts
    components.json
    src/

  backend/
    Dockerfile
    go.mod
    go.sum
    Makefile
    api/
      openapi.yaml
    cmd/
      api/
        main.go
    internal/
      api/
      config/
      server/
      modules/
      minimax/
      storage/
      database/
    migrations/
    tests/
```

---

# 18. Makefile

```makefile
.PHONY: run test gen migrate-up migrate-down

run:
	docker compose up --build

test:
	cd backend && go test ./...
	cd frontend && npm test

gen:
	oapi-codegen -generate types,gin -package api backend/api/openapi.yaml > backend/internal/api/openapi.gen.go
	cd frontend && npm run gen:api

migrate-up:
	cd backend && migrate -path migrations -database "$$DATABASE_URL" up

migrate-down:
	cd backend && migrate -path migrations -database "$$DATABASE_URL" down
```

---

# 19. Build order

## Phase 1: Foundation

```txt
Create repo
Add Docker Compose
Add Postgres
Add MinIO
Add Go Gin backend
Add React Vite frontend
Add health check
Add Swagger/OpenAPI
Generate frontend API client
```

## Phase 2: Storage + database

```txt
Create migrations
Create generation repository
Create MinIO storage service
Add upload endpoint
Add history endpoint
```

## Phase 3: Image generation

```txt
Add text-to-image
Add image-to-image
Save output to MinIO
Show result in frontend
Add history
```

## Phase 4: Video generation

```txt
Add text-to-video
Add image-to-video
Add first/last frame video
Add subject-reference video
Add polling
Add download-to-MinIO
Add video preview
```

## Phase 5: Polish

```txt
Responsive layout
Better errors
Loading states
Retry failed jobs
Tests
README
```

---

# 20. Final lean requirement summary

```txt
Build a responsive web app for MiniMax image and video generation.

Frontend:
React Vite, TypeScript, shadcn/ui, Tailwind, TanStack Query, generated OpenAPI client.

Backend:
Go Gin, OpenAPI/Swagger, Postgres, MinIO, shared MiniMax API key, Dockerized.

Features:
No login.
No billing.
No public sharing.
No admin yet.
Use MiniMax only.
Save all generated images/videos to MinIO.
Save metadata and task status to Postgres.
Support image generation: text-to-image and image-to-image.
Support video generation: text-to-video, image-to-video, first/last-frame video, and subject-reference video.
Support async video task polling and download.
Support responsive UI for desktop, tablet, and mobile.
Support backend tests with gomock, Ginkgo, Omega.
Package all services in Docker Compose.
```

This is complete enough to start implementation without more requirement questions.

[1]: https://platform.minimax.io/docs/guides/video-generation "Video Generation - MiniMax API Docs"
[2]: https://platform.minimaxi.com/docs/guides/image-generation?utm_source=chatgpt.com "图片生成 - MiniMax 开放平台文档中心"
[3]: https://platform.minimaxi.com/docs/llms.txt "platform.minimaxi.com"
