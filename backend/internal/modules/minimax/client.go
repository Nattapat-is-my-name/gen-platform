package minimax

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/minimax-gen/web/internal/config"
	"github.com/minimax-gen/web/internal/modules/generation"
)

type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewClient(cfg *config.Config) *Client {
	return &Client{
		baseURL: cfg.MiniMaxBaseURL,
		apiKey:  cfg.MiniMaxAPIKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (c *Client) doRequest(ctx context.Context, method, path string, body interface{}) ([]byte, error) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal request: %w", err)
		}
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to execute request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return respBody, nil
}

func (c *Client) GenerateTextToImage(ctx context.Context, req generation.TextToImageRequest) (*generation.ImageGenerationResult, error) {
	body := map[string]interface{}{
		"model": req.Model,
		"prompt": req.Prompt,
	}

	if req.AspectRatio != "" {
		body["aspect_ratio"] = req.AspectRatio
	}

	respBody, err := c.doRequest(ctx, http.MethodPost, "/v1/image_generation", body)
	if err != nil {
		return nil, err
	}

	var result generation.ImageGenerationResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

func (c *Client) GenerateImageToImage(ctx context.Context, req generation.ImageToImageRequest) (*generation.ImageGenerationResult, error) {
	body := map[string]interface{}{
		"model":  req.Model,
		"prompt": req.Prompt,
	}

	if req.ReferenceImageURL != "" {
		body["subject_reference"] = []map[string]string{
			{"type": "character", "image_file": req.ReferenceImageURL},
		}
	}

	respBody, err := c.doRequest(ctx, http.MethodPost, "/v1/image_generation", body)
	if err != nil {
		return nil, err
	}

	var result generation.ImageGenerationResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

func (c *Client) CreateTextToVideoTask(ctx context.Context, req generation.TextToVideoRequest) (*generation.VideoTaskResult, error) {
	body := map[string]interface{}{
		"model":            req.Model,
		"prompt":           req.Prompt,
		"duration":         req.Duration,
		"resolution":       req.Resolution,
		"prompt_optimizer": req.PromptOptimizer,
	}

	respBody, err := c.doRequest(ctx, http.MethodPost, "/v1/video_generation", body)
	if err != nil {
		return nil, err
	}

	var result generation.VideoTaskResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

func (c *Client) CreateImageToVideoTask(ctx context.Context, req generation.ImageToVideoRequest) (*generation.VideoTaskResult, error) {
	body := map[string]interface{}{
		"model":    req.Model,
		"prompt":   req.Prompt,
		"duration": req.Duration,
	}

	respBody, err := c.doRequest(ctx, http.MethodPost, "/v1/image_to_video", body)
	if err != nil {
		return nil, err
	}

	var result generation.VideoTaskResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

func (c *Client) CreateFirstLastFrameVideoTask(ctx context.Context, req generation.FirstLastFrameVideoRequest) (*generation.VideoTaskResult, error) {
	body := map[string]interface{}{
		"model":    req.Model,
		"prompt":   req.Prompt,
		"duration": req.Duration,
	}

	respBody, err := c.doRequest(ctx, http.MethodPost, "/v1/first_last_frame_video", body)
	if err != nil {
		return nil, err
	}

	var result generation.VideoTaskResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

func (c *Client) CreateSubjectReferenceVideoTask(ctx context.Context, req generation.SubjectReferenceVideoRequest) (*generation.VideoTaskResult, error) {
	body := map[string]interface{}{
		"model":    req.Model,
		"prompt":   req.Prompt,
		"duration": req.Duration,
	}

	respBody, err := c.doRequest(ctx, http.MethodPost, "/v1/subject_reference_video", body)
	if err != nil {
		return nil, err
	}

	var result generation.VideoTaskResult
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

func (c *Client) QueryVideoTask(ctx context.Context, taskID string) (*generation.VideoTaskStatus, error) {
	respBody, err := c.doRequest(ctx, http.MethodGet, "/v1/query/video_generation?task_id="+taskID, nil)
	if err != nil {
		return nil, err
	}

	var status generation.VideoTaskStatus
	if err := json.Unmarshal(respBody, &status); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &status, nil
}

func (c *Client) DownloadVideoFile(ctx context.Context, fileID string) ([]byte, string, error) {
	respBody, err := c.doRequest(ctx, http.MethodGet, "/v1/video_generation/file/"+fileID, nil)
	if err != nil {
		return nil, "", err
	}

	return respBody, "video/mp4", nil
}