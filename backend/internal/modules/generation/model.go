package generation

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type GenerationType string

const (
	GenerationTypeImage GenerationType = "image"
	GenerationTypeVideo GenerationType = "video"
)

type GenerationMode string

const (
	ModeTextToImage           GenerationMode = "text_to_image"
	ModeImageToImage          GenerationMode = "image_to_image"
	ModeTextToVideo           GenerationMode = "text_to_video"
	ModeImageToVideo          GenerationMode = "image_to_video"
	ModeFirstLastFrameVideo   GenerationMode = "first_last_frame_video"
	ModeSubjectReferenceVideo GenerationMode = "subject_reference_video"
)

type GenerationStatus string

const (
	StatusPending    GenerationStatus = "pending"
	StatusProcessing GenerationStatus = "processing"
	StatusSuccess    GenerationStatus = "success"
	StatusFailed     GenerationStatus = "failed"
)

type Generation struct {
	ID        uuid.UUID        `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SessionID string           `gorm:"type:text;index" json:"sessionId"`
	Type      GenerationType   `gorm:"type:text;not null" json:"type"`
	Mode      GenerationMode  `gorm:"type:text;not null" json:"mode"`
	Prompt    string           `gorm:"type:text;not null" json:"prompt"`
	Model     string           `gorm:"type:text;not null" json:"model"`
	Status    GenerationStatus `gorm:"type:text;not null" json:"status"`
	TaskID    *string          `gorm:"type:text" json:"taskId,omitempty"`
	FileID    *string          `gorm:"type:text" json:"fileId,omitempty"`

	InputObjects  json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"inputObjects"`
	OutputObjects json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"outputObjects"`
	Settings      json.RawMessage `gorm:"type:jsonb;default:'{}'" json:"settings"`

	ErrorCode    *string    `gorm:"type:text" json:"errorCode,omitempty"`
	ErrorMessage *string    `gorm:"type:text" json:"errorMessage,omitempty"`

	CreatedAt   time.Time  `gorm:"not null;default:now()" json:"createdAt"`
	UpdatedAt   time.Time  `gorm:"not null;default:now()" json:"updatedAt"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
}

func (Generation) TableName() string {
	return "generations"
}

type UploadedObject struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GenerationID uuid.UUID `gorm:"type:uuid;not null" json:"generationId"`
	Bucket       string    `gorm:"type:text;not null" json:"bucket"`
	ObjectKey    string    `gorm:"type:text;not null" json:"objectKey"`
	ContentType  string    `gorm:"type:text;not null" json:"contentType"`
	SizeBytes    int64     `gorm:"not null" json:"sizeBytes"`
	CreatedAt    time.Time `gorm:"not null;default:now()" json:"createdAt"`
}

func (UploadedObject) TableName() string {
	return "uploaded_objects"
}