package generation

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"github.com/google/uuid"
)

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

type Storage interface {
	Put(ctx context.Context, key string, body []byte, contentType string) error
	GetPresignedURL(ctx context.Context, key string) (string, error)
	Delete(ctx context.Context, key string) error
	Get(ctx context.Context, key string) ([]byte, string, error)
}

type Service struct {
	repo    *Repository
	minimax MiniMaxClient
	storage Storage
}

func NewService(repo *Repository, minimax MiniMaxClient, storage Storage) *Service {
	return &Service{
		repo:    repo,
		minimax: minimax,
		storage: storage,
	}
}

func (s *Service) CreateImageGeneration(ctx context.Context, req *ImageGenerateRequest) (*ImageGenerateResponse, error) {
	// Default to "anonymous" if sessionId is empty
	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = "anonymous"
	}

	generation := &Generation{
		SessionID: sessionID,
		Type:      GenerationTypeImage,
		Mode:      GenerationMode(req.Mode),
		Prompt:    req.Prompt,
		Model:     req.Model,
		Status:    StatusPending,
	}

	if req.ReferenceImageObjectKey != "" {
		inputObjs, _ := json.Marshal([]string{req.ReferenceImageObjectKey})
		generation.InputObjects = inputObjs
	}

	settings, _ := json.Marshal(map[string]interface{}{
		"aspectRatio": req.AspectRatio,
	})
	generation.Settings = settings

	if err := s.repo.Create(generation); err != nil {
		return nil, fmt.Errorf("failed to create generation: %w", err)
	}

	var result *ImageGenerationResult
	var err error

	switch req.Mode {
	case ImageModeTextToImage:
		result, err = s.minimax.GenerateTextToImage(ctx, TextToImageRequest{
			Prompt:      req.Prompt,
			Model:       req.Model,
			AspectRatio: req.AspectRatio,
		})
	case ImageModeImageToImage:
		// Get reference image URL from MinIO
		refURL, err := s.storage.GetPresignedURL(ctx, req.ReferenceImageObjectKey)
		if err != nil {
			generation.Status = StatusFailed
			errMsg := fmt.Sprintf("failed to get reference image URL: %v", err)
			generation.ErrorMessage = &errMsg
			_ = s.repo.Update(generation)
			return &ImageGenerateResponse{
				GenerationID: generation.ID.String(),
				Status:       string(StatusFailed),
			}, nil
		}

		var i2iErr error
		result, i2iErr = s.minimax.GenerateImageToImage(ctx, ImageToImageRequest{
			Prompt:            req.Prompt,
			Model:             req.Model,
			ReferenceImageURL: refURL,
		})
		if i2iErr != nil {
			err = i2iErr
		}
	}

	if err != nil {
		generation.Status = StatusFailed
		errMsg := err.Error()
		generation.ErrorMessage = &errMsg
		_ = s.repo.Update(generation)
		return &ImageGenerateResponse{
			GenerationID: generation.ID.String(),
			Status:       string(StatusFailed),
		}, nil
	}

	// Check MiniMax API error response
	if result.BaseResp.StatusCode != 0 {
		generation.Status = StatusFailed
		errMsg := result.BaseResp.StatusMsg
		generation.ErrorMessage = &errMsg
		_ = s.repo.Update(generation)
		return &ImageGenerateResponse{
			GenerationID: generation.ID.String(),
			Status:       string(StatusFailed),
		}, nil
	}

	// Download and save images to MinIO
	var outputs []Output
	for i, imgURL := range result.Data.ImageURLs {
		// Download image from MiniMax
		imgData, err := s.downloadImage(ctx, imgURL)
		if err != nil {
			// If download fails, still include original URL
			outputs = append(outputs, Output{URL: imgURL})
			continue
		}

		// Save to MinIO with unique key
		objectKey := fmt.Sprintf("generated/images/%s/%d.jpg", generation.ID.String(), i)
		if err := s.storage.Put(ctx, objectKey, imgData, "image/jpeg"); err != nil {
			// If save fails, use original URL
			outputs = append(outputs, Output{URL: imgURL})
			continue
		}

		// Get accessible URL from MinIO
		minioURL, err := s.storage.GetPresignedURL(ctx, objectKey)
		if err != nil {
			outputs = append(outputs, Output{URL: imgURL})
			continue
		}

		outputs = append(outputs, Output{URL: minioURL})
	}

	generation.Status = StatusSuccess
	outputObjs, _ := json.Marshal(outputs)
	generation.OutputObjects = outputObjs
	now := time.Now()
	generation.CompletedAt = &now
	s.repo.Update(generation)

	return &ImageGenerateResponse{
		GenerationID: generation.ID.String(),
		Status:       string(StatusSuccess),
		Outputs:      outputs,
	}, nil
}

func (s *Service) CreateVideoGeneration(ctx context.Context, req *VideoGenerateRequest) (*VideoGenerateResponse, error) {
	// Default to "anonymous" if sessionId is empty
	sessionID := req.SessionID
	if sessionID == "" {
		sessionID = "anonymous"
	}

	generation := &Generation{
		SessionID: sessionID,
		Type:      GenerationTypeVideo,
		Mode:      GenerationMode(req.Mode),
		Prompt:    req.Prompt,
		Model:     req.Model,
		Status:    StatusPending,
	}

	inputObjs, _ := json.Marshal(req.InputObjectKeys)
	generation.InputObjects = inputObjs

	settings, _ := json.Marshal(map[string]interface{}{
		"duration":         req.Duration,
		"resolution":       req.Resolution,
		"promptOptimizer":  req.PromptOptimizer,
		"fastPretreatment": req.FastPretreatment,
	})
	generation.Settings = settings

	if err := s.repo.Create(generation); err != nil {
		return nil, fmt.Errorf("failed to create generation: %w", err)
	}

	var result *VideoTaskResult
	var err error

	switch req.Mode {
	case VideoModeTextToVideo:
		result, err = s.minimax.CreateTextToVideoTask(ctx, TextToVideoRequest{
			Prompt:          req.Prompt,
			Model:           req.Model,
			Duration:        req.Duration,
			Resolution:      req.Resolution,
			PromptOptimizer: req.PromptOptimizer,
		})
	case VideoModeImageToVideo:
		result, err = s.minimax.CreateImageToVideoTask(ctx, ImageToVideoRequest{
			Prompt:   req.Prompt,
			Model:    req.Model,
			Duration: req.Duration,
		})
	case VideoModeFirstLastFrameVideo:
		result, err = s.minimax.CreateFirstLastFrameVideoTask(ctx, FirstLastFrameVideoRequest{
			Prompt:   req.Prompt,
			Model:    req.Model,
			Duration: req.Duration,
		})
	case VideoModeSubjectReference:
		result, err = s.minimax.CreateSubjectReferenceVideoTask(ctx, SubjectReferenceVideoRequest{
			Prompt:   req.Prompt,
			Model:    req.Model,
			Duration: req.Duration,
		})
	}

	if err != nil {
		generation.Status = StatusFailed
		errMsg := err.Error()
		generation.ErrorMessage = &errMsg
		s.repo.Update(generation)
		return &VideoGenerateResponse{
			GenerationID: generation.ID.String(),
			Status:       string(StatusFailed),
		}, nil
	}

	generation.Status = StatusProcessing
	generation.TaskID = &result.TaskID
	s.repo.Update(generation)

	return &VideoGenerateResponse{
		GenerationID: generation.ID.String(),
		TaskID:       result.TaskID,
		Status:       string(StatusProcessing),
	}, nil
}

func (s *Service) GetGeneration(ctx context.Context, id uuid.UUID) (*GenerationResponse, error) {
	generation, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if generation.Type == GenerationTypeVideo && generation.Status == StatusProcessing && generation.TaskID != nil {
		status, err := s.minimax.QueryVideoTask(ctx, *generation.TaskID)
		if err == nil {
			switch status.Status {
			case "Success":
				generation.Status = StatusSuccess
				generation.FileID = &status.FileID

				videoData, contentType, err := s.minimax.DownloadVideoFile(ctx, status.FileID)
				if err == nil {
					key := fmt.Sprintf("videos/%s/%s.mp4", generation.ID.String(), status.FileID)
					_ = s.storage.Put(ctx, key, videoData, contentType)
					url, _ := s.storage.GetPresignedURL(ctx, key)

					outputs := []Output{{URL: url}}
					outputObjs, _ := json.Marshal(outputs)
					generation.OutputObjects = outputObjs
				}

				now := time.Now()
				generation.CompletedAt = &now
			case "Fail":
				generation.Status = StatusFailed
				errMsg := status.ErrorMessage
				generation.ErrorMessage = &errMsg
			default:
				generation.Status = StatusProcessing
			}
			_ = s.repo.Update(generation)
		}
	}

	var outputs []Output
	if generation.OutputObjects != nil {
		_ = json.Unmarshal(generation.OutputObjects, &outputs)
	}

	return ToGenerationResponse(generation, outputs), nil
}

func (s *Service) ListGenerations(sessionID string, filter string) ([]GenerationResponse, error) {
	generations, err := s.repo.FindAll(sessionID, filter)
	if err != nil {
		return nil, err
	}

	responses := make([]GenerationResponse, len(generations))
	for i, g := range generations {
		var outputs []Output
		if g.OutputObjects != nil {
			_ = json.Unmarshal(g.OutputObjects, &outputs)
		}
		resp := ToGenerationResponse(&g, outputs)
		responses[i] = *resp
	}

	return responses, nil
}

func (s *Service) PollVideoTask(ctx context.Context, id uuid.UUID) (*GenerationResponse, error) {
	generation, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	if generation.TaskID == nil {
		return nil, fmt.Errorf("no task_id associated with generation")
	}

	status, err := s.minimax.QueryVideoTask(ctx, *generation.TaskID)
	if err != nil {
		return nil, err
	}

	switch status.Status {
	case "Success":
		generation.Status = StatusSuccess
		generation.FileID = &status.FileID

		videoData, contentType, err := s.minimax.DownloadVideoFile(ctx, status.FileID)
		if err == nil {
			key := fmt.Sprintf("videos/%s/%s.mp4", generation.ID.String(), status.FileID)
			_ = s.storage.Put(ctx, key, videoData, contentType)
			url, _ := s.storage.GetPresignedURL(ctx, key)

			outputs := []Output{{URL: url}}
			outputObjs, _ := json.Marshal(outputs)
			generation.OutputObjects = outputObjs
		}

		now := time.Now()
		generation.CompletedAt = &now
	case "Fail":
		generation.Status = StatusFailed
		errMsg := status.ErrorMessage
		generation.ErrorMessage = &errMsg
	default:
		generation.Status = StatusProcessing
	}

	_ = s.repo.Update(generation)

	var outputs []Output
	if generation.OutputObjects != nil {
		_ = json.Unmarshal(generation.OutputObjects, &outputs)
	}

	return ToGenerationResponse(generation, outputs), nil
}

func (s *Service) DeleteGeneration(ctx context.Context, id uuid.UUID) error {
	generation, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	var inputKeys []string
	if generation.InputObjects != nil {
		_ = json.Unmarshal(generation.InputObjects, &inputKeys)
	}
	for _, key := range inputKeys {
		_ = s.storage.Delete(ctx, key)
	}

	var outputKeys []Output
	if generation.OutputObjects != nil {
		_ = json.Unmarshal(generation.OutputObjects, &outputKeys)
	}
	for _, out := range outputKeys {
		_ = s.storage.Delete(ctx, out.URL)
	}

	return s.repo.Delete(id)
}

func (s *Service) GetRepository() *Repository {
	return s.repo
}

func (s *Service) downloadImage(ctx context.Context, url string) ([]byte, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to download image: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("image download failed with status: %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func (s *Service) UploadFile(ctx context.Context, file *multipart.FileHeader) (*UploadResponse, error) {
	objectKey := fmt.Sprintf("uploads/images/%s/%s", uuid.New().String(), file.Filename)

	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer src.Close()

	body, err := io.ReadAll(src)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if err := s.storage.Put(ctx, objectKey, body, contentType); err != nil {
		return nil, fmt.Errorf("failed to upload to storage: %w", err)
	}

	presignedURL, err := s.storage.GetPresignedURL(ctx, objectKey)
	if err != nil {
		return nil, fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return &UploadResponse{
		ObjectKey: objectKey,
		URL:       presignedURL,
	}, nil
}

type TextToImageRequest struct {
	Prompt      string `json:"prompt"`
	Model       string `json:"model"`
	AspectRatio string `json:"aspect_ratio,omitempty"`
}

type ImageToImageRequest struct {
	Prompt            string `json:"prompt"`
	Model             string `json:"model"`
	ReferenceImageURL string `json:"referenceImageUrl,omitempty"`
}

type ImageGenerationResult struct {
	Data    ImageResultData `json:"data"`
	BaseResp BaseResp       `json:"base_resp"`
}

type ImageResultData struct {
	ImageURLs []string `json:"image_urls"`
}

type BaseResp struct {
	StatusCode int    `json:"status_code"`
	StatusMsg  string `json:"status_msg"`
}

type TextToVideoRequest struct {
	Prompt          string `json:"prompt"`
	Model           string `json:"model"`
	Duration        int    `json:"duration"`
	Resolution      string `json:"resolution"`
	PromptOptimizer bool   `json:"promptOptimizer"`
}

type ImageToVideoRequest struct {
	Prompt   string `json:"prompt"`
	Model    string `json:"model"`
	Duration int    `json:"duration"`
}

type FirstLastFrameVideoRequest struct {
	Prompt   string `json:"prompt"`
	Model    string `json:"model"`
	Duration int    `json:"duration"`
}

type SubjectReferenceVideoRequest struct {
	Prompt   string `json:"prompt"`
	Model    string `json:"model"`
	Duration int    `json:"duration"`
}

type VideoTaskResult struct {
	TaskID string `json:"task_id"`
	Status string `json:"status"`
}

type VideoTaskStatus struct {
	Status       string `json:"status"`
	FileID       string `json:"fileId,omitempty"`
	ErrorMessage string `json:"errorMessage,omitempty"`
}
