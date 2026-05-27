package generation

type ImageMode string

const (
	ImageModeTextToImage  ImageMode = "text_to_image"
	ImageModeImageToImage ImageMode = "image_to_image"
)

type VideoMode string

const (
	VideoModeTextToVideo          VideoMode = "text_to_video"
	VideoModeImageToVideo        VideoMode = "image_to_video"
	VideoModeFirstLastFrameVideo VideoMode = "first_last_frame_video"
	VideoModeSubjectReference    VideoMode = "subject_reference_video"
)

type ImageGenerateRequest struct {
	Mode                     ImageMode `json:"mode" binding:"required"`
	Prompt                   string    `json:"prompt" binding:"required"`
	Model                    string    `json:"model" binding:"required"`
	AspectRatio              string    `json:"aspectRatio"`
	ReferenceImageObjectKeys []string  `json:"referenceImageObjectKeys"`
}

type VideoGenerateRequest struct {
	Mode             VideoMode `json:"mode" binding:"required"`
	Prompt           string    `json:"prompt" binding:"required"`
	Model            string    `json:"model" binding:"required"`
	Duration         int       `json:"duration"`
	Resolution       string    `json:"resolution"`
	PromptOptimizer  bool      `json:"promptOptimizer"`
	FastPretreatment bool      `json:"fastPretreatment"`
	InputObjectKeys []string  `json:"inputObjectKeys"`
}

type GenerationResponse struct {
	ID           string   `json:"id"`
	Type         string   `json:"type"`
	Mode         string   `json:"mode"`
	Prompt       string   `json:"prompt"`
	Model        string   `json:"model"`
	Status       string   `json:"status"`
	TaskID       *string  `json:"taskId,omitempty"`
	FileID       *string  `json:"fileId,omitempty"`
	Outputs      []Output `json:"outputs"`
	ErrorCode    *string  `json:"errorCode,omitempty"`
	ErrorMessage *string  `json:"errorMessage,omitempty"`
	CreatedAt    string   `json:"createdAt"`
	CompletedAt  *string  `json:"completedAt,omitempty"`
}

type Output struct {
	URL string `json:"url"`
}

type ImageGenerateResponse struct {
	GenerationID string   `json:"generationId"`
	Status       string   `json:"status"`
	Outputs      []Output `json:"outputs,omitempty"`
}

type VideoGenerateResponse struct {
	GenerationID string `json:"generationId"`
	TaskID       string `json:"taskId"`
	Status       string `json:"status"`
}

func ToGenerationResponse(g *Generation, outputs []Output) *GenerationResponse {
	resp := &GenerationResponse{
		ID:      g.ID.String(),
		Type:    string(g.Type),
		Mode:    string(g.Mode),
		Prompt:  g.Prompt,
		Model:   g.Model,
		Status:  string(g.Status),
		TaskID:  g.TaskID,
		FileID:  g.FileID,
		Outputs: outputs,
	}
	if g.ErrorCode != nil {
		resp.ErrorCode = g.ErrorCode
	}
	if g.ErrorMessage != nil {
		resp.ErrorMessage = g.ErrorMessage
	}
	if g.CompletedAt != nil {
		completed := g.CompletedAt.Format("2006-01-02T15:04:05Z07:00")
		resp.CompletedAt = &completed
	}
	return resp
}