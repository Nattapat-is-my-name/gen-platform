package generation

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

func (r *Repository) AutoMigrate() error {
	return r.db.AutoMigrate(&Generation{}, &UploadedObject{})
}

func (r *Repository) Create(generation *Generation) error {
	return r.db.Create(generation).Error
}

func (r *Repository) FindByID(id uuid.UUID) (*Generation, error) {
	var generation Generation
	err := r.db.First(&generation, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &generation, nil
}

func (r *Repository) FindAll(sessionID string, filter string) ([]Generation, error) {
	var generations []Generation
	query := r.db.Where("session_id = ?", sessionID).Order("created_at DESC")
	if filter == "image" {
		query = query.Where("type = ?", GenerationTypeImage)
	} else if filter == "video" {
		query = query.Where("type = ?", GenerationTypeVideo)
	}
	err := query.Find(&generations).Error
	return generations, err
}

func (r *Repository) Update(generation *Generation) error {
	return r.db.Save(generation).Error
}

func (r *Repository) Delete(id uuid.UUID) error {
	return r.db.Delete(&Generation{}, "id = ?", id).Error
}

func (r *Repository) CreateUploadedObject(obj *UploadedObject) error {
	return r.db.Create(obj).Error
}

func (r *Repository) FindUploadedObjectsByGenerationID(generationID uuid.UUID) ([]UploadedObject, error) {
	var objects []UploadedObject
	err := r.db.Find(&objects, "generation_id = ?", generationID).Error
	return objects, err
}

func (r *Repository) DeleteUploadedObjectsByGenerationID(generationID uuid.UUID) error {
	return r.db.Delete(&UploadedObject{}, "generation_id = ?", generationID).Error
}