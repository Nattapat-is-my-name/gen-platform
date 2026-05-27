package config

import (
	"os"
)

type Config struct {
	AppEnv  string
	Port    string

	DatabaseURL string

	MinIOEndpoint  string
	MinIOAccessKey string
	MinIOSecretKey string
	MinIOBucket    string
	MinIOUseSSL    bool

	MiniMaxBaseURL string
	MiniMaxAPIKey  string

	CORSAllowedOrigins string
}

func Load() *Config {
	return &Config{
		AppEnv:  getEnv("APP_ENV", "local"),
		Port:    getEnv("PORT", "8080"),

		DatabaseURL: getEnv("DATABASE_URL", ""),

		MinIOEndpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		MinIOAccessKey: getEnv("MINIO_ACCESS_KEY", "minio"),
		MinIOSecretKey: getEnv("MINIO_SECRET_KEY", "minio123"),
		MinIOBucket:    getEnv("MINIO_BUCKET", "generations"),
		MinIOUseSSL:    getEnv("MINIO_USE_SSL", "false") == "true",

		MiniMaxBaseURL: getEnv("MINIMAX_BASE_URL", "https://api.minimax.io"),
		MiniMaxAPIKey:  getEnv("MINIMAX_API_KEY", ""),

		CORSAllowedOrigins: getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}