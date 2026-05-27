package generation

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestHealthCheck(t *testing.T) {
	router := gin.New()
	handler := &Handler{}
	router.GET("/health", handler.HealthCheck)

	req, _ := http.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	var resp map[string]string
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp["status"] != "ok" {
		t.Errorf("Expected status 'ok', got '%s'", resp["status"])
	}
}

func TestGenerateImageValidation(t *testing.T) {
	router := gin.New()
	handler := &Handler{}
	router.POST("/api/v1/images/generate", handler.GenerateImage)

	tests := []struct {
		name       string
		body       map[string]interface{}
		wantStatus int
	}{
		{
			name:       "missing mode",
			body:       map[string]interface{}{"sessionId": "test", "prompt": "test", "model": "image-01"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "missing prompt",
			body:       map[string]interface{}{"sessionId": "test", "mode": "text_to_image", "model": "image-01"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "missing model",
			body:       map[string]interface{}{"sessionId": "test", "mode": "text_to_image", "prompt": "test"},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tt.body)
			req, _ := http.NewRequest("POST", "/api/v1/images/generate", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Expected status %d, got %d", tt.wantStatus, w.Code)
			}
		})
	}
}

func TestGenerateVideoValidation(t *testing.T) {
	router := gin.New()
	handler := &Handler{}
	router.POST("/api/v1/videos/generate", handler.GenerateVideo)

	tests := []struct {
		name       string
		body       map[string]interface{}
		wantStatus int
	}{
		{
			name:       "missing mode",
			body:       map[string]interface{}{"sessionId": "test", "prompt": "test", "model": "MiniMax-Hailuo-02"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "missing prompt",
			body:       map[string]interface{}{"sessionId": "test", "mode": "text_to_video", "model": "MiniMax-Hailuo-02"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "missing model",
			body:       map[string]interface{}{"sessionId": "test", "mode": "text_to_video", "prompt": "test"},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			bodyBytes, _ := json.Marshal(tt.body)
			req, _ := http.NewRequest("POST", "/api/v1/videos/generate", bytes.NewBuffer(bodyBytes))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Expected status %d, got %d", tt.wantStatus, w.Code)
			}
		})
	}
}

func TestGetGenerationInvalidUUID(t *testing.T) {
	router := gin.New()
	handler := &Handler{}
	router.GET("/api/v1/generations/:id", handler.GetGeneration)

	req, _ := http.NewRequest("GET", "/api/v1/generations/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestDeleteGenerationInvalidUUID(t *testing.T) {
	router := gin.New()
	handler := &Handler{}
	router.DELETE("/api/v1/generations/:id", handler.DeleteGeneration)

	req, _ := http.NewRequest("DELETE", "/api/v1/generations/invalid-uuid", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestPollVideoInvalidUUID(t *testing.T) {
	router := gin.New()
	handler := &Handler{}
	router.POST("/api/v1/videos/:generationId/poll", handler.PollVideo)

	req, _ := http.NewRequest("POST", "/api/v1/videos/invalid-uuid/poll", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}