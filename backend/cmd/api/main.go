package main

import (
	"log"

	"github.com/minimax-gen/web/internal/config"
	"github.com/minimax-gen/web/internal/database"
	"github.com/minimax-gen/web/internal/modules/generation"
	"github.com/minimax-gen/web/internal/modules/minimax"
	"github.com/minimax-gen/web/internal/modules/storage"
	"github.com/minimax-gen/web/internal/server"
)

func main() {
	cfg := config.Load()

	db, err := database.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	repo := generation.NewRepository(db)
	if err := repo.AutoMigrate(); err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	minimaxClient := minimax.NewClient(cfg)

	minioStorage, err := storage.NewMinIO(cfg)
	if err != nil {
		log.Fatalf("Failed to create MinIO client: %v", err)
	}

	svc := generation.NewService(repo, minimaxClient, minioStorage)
	handler := generation.NewHandler(svc)

	r := server.NewRouter(handler)

	log.Printf("Starting server on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}