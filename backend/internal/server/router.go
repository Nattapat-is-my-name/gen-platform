package server

import (
	"github.com/gin-gonic/gin"
	"github.com/minimax-gen/web/internal/modules/generation"
)

func NewRouter(genHandler *generation.Handler) *gin.Engine {
	r := gin.Default()

	r.Use(corsMiddleware())

	r.GET("/health", genHandler.HealthCheck)

	// Serve uploaded files so MiniMax can access them
	r.Static("/uploads", "/uploads")

	api := r.Group("/api/v1")
	{
		api.POST("/upload", genHandler.Upload)
		api.POST("/images/generate", genHandler.GenerateImage)
		api.POST("/videos/generate", genHandler.GenerateVideo)
		api.GET("/generations/:id", genHandler.GetGeneration)
		api.GET("/generations", genHandler.ListGenerations)
		api.POST("/videos/:generationId/poll", genHandler.PollVideo)
		api.DELETE("/generations/:id", genHandler.DeleteGeneration)
	}

	return r
}
