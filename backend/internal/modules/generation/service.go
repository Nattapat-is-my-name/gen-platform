package generation

import (
	"context"
	"encoding/json"
	"fmt"
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
	generation := &Generation{
		Type:   GenerationTypeImage,
		Mode:   GenerationMode(req.Mode),
		Prompt: req.Prompt,
		Model:  req.Model,
		Status: StatusPending,
	}

	inputObjs, _ := json.Marshal(req.ReferenceImageObjectKeys)
	generation.InputObjects = inputObjs

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
			Prompt: req.Prompt,
			Model:  req.Model,
		})
	case ImageModeImageToImage:
		result, err = s.minimax.GenerateImageToImage(ctx, ImageToImageRequest{
			Prompt: req.Prompt,
			Model:  req.Model,
		})
	}

	if err != nil {
		generation.Status = StatusFailed
		errMsg := err.Error()
		generation.ErrorMessage = &errMsg
		s.repo.Update(generation)
		return &ImageGenerateResponse{
			GenerationID: generation.ID.String(),
			Status:       string(StatusFailed),
		}, nil
	}

	generation.Status = StatusSuccess
	outputObjs, _ := json.Marshal(result.Outputs)
	generation.OutputObjects = outputObjs
	now := time.Now()
	generation.CompletedAt = &now
	s.repo.Update(generation)

	outputs := make([]Output, len(result.Outputs))
	for i, out := range result.Outputs {
		outputs[i] = Output{URL: out.URL}
	}

	return &ImageGenerateResponse{
		GenerationID: generation.ID.String(),
		Status:       string(StatusSuccess),
		Outputs:      outputs,
	}, nil
}

func (s *Service) CreateVideoGeneration(ctx context.Context, req *VideoGenerateRequest) (*VideoGenerateResponse, error) {
	generation := &Generation{
		Type:   GenerationTypeVideo,
		Mode:   GenerationMode(req.Mode),
		Prompt: req.Prompt,
		Model:  req.Model,
		Status: StatusPending,
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

	var outputs []Output
	if generation.OutputObjects != nil {
		json.Unmarshal(generation.OutputObjects, &outputs)
	}

	return ToGenerationResponse(generation, outputs), nil
}

func (s *Service) ListGenerations(filter string) ([]GenerationResponse, error) {
	generations, err := s.repo.FindAll(filter)
	if err != nil {
		return nil, err
	}

	responses := make([]GenerationResponse, len(generations))
	for i, g := range generations {
		var outputs []Output
		if g.OutputObjects != nil {
			json.Unmarshal(g.OutputObjects, &outputs)
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
			s.storage.Put(ctx, key, videoData, contentType)
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

	s.repo.Update(generation)

	var outputs []Output
	if generation.OutputObjects != nil {
		json.Unmarshal(generation.OutputObjects, &outputs)
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
		json.Unmarshal(generation.InputObjects, &inputKeys)
	}
	for _, key := range inputKeys {
		s.storage.Delete(ctx, key)
	}

	var outputKeys []Output
	if generation.OutputObjects != nil {
		json.Unmarshal(generation.OutputObjects, &outputKeys)
	}
	for _, out := range outputKeys {
		s.storage.Delete(ctx, out.URL)
	}

	return s.repo.Delete(id)
}

func (s *Service) GetRepository() *Repository {
	return s.repo
}

type TextToImageRequest struct {
	Prompt string `json:"prompt"`
	Model  string `json:"model"`
}

type ImageToImageRequest struct {
	Prompt            string `json:"prompt"`
	Model             string `json:"model"`
	ReferenceImageURL string `json:"referenceImageUrl,omitempty"`
}

type ImageGenerationResult struct {
	Outputs []struct {
		URL string `json:"url"`
	} `json:"outputs"`
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
	TaskID string `json:"taskId"`
	Status string `json:"status"`
}

type VideoTaskStatus struct {
	Status       string `json:"status"`
	FileID       string `json:"fileId,omitempty"`
	ErrorMessage string `json:"errorMessage,omitempty"`
}