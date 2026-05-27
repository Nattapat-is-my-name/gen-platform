package storage

import (
	"bytes"
	"context"
	"fmt"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/minimax-gen/web/internal/config"
)

type MinIOStorage struct {
	client *minio.Client
	bucket string
}

func NewMinIO(cfg *config.Config) (*MinIOStorage, error) {
	client, err := minio.New(cfg.MinIOEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIOAccessKey, cfg.MinIOSecretKey, ""),
		Secure: cfg.MinIOUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	return &MinIOStorage{
		client: client,
		bucket: cfg.MinIOBucket,
	}, nil
}

func (s *MinIOStorage) EnsureBucket(ctx context.Context) error {
	exists, err := s.client.BucketExists(ctx, s.bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket: %w", err)
	}

	if !exists {
		err = s.client.MakeBucket(ctx, s.bucket, minio.MakeBucketOptions{})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
	}

	return nil
}

func (s *MinIOStorage) Put(ctx context.Context, key string, body []byte, contentType string) error {
	_, err := s.client.PutObject(ctx, s.bucket, key, bytes.NewReader(body), int64(len(body)), minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return fmt.Errorf("failed to put object: %w", err)
	}

	return nil
}

func (s *MinIOStorage) GetPresignedURL(ctx context.Context, key string) (string, error) {
	// For image generation: return direct public URL without signature
	// MiniMax needs a publicly accessible URL, not localhost or presigned
	return fmt.Sprintf("http://localhost:9000/%s/%s", s.bucket, key), nil
}

func (s *MinIOStorage) Delete(ctx context.Context, key string) error {
	err := s.client.RemoveObject(ctx, s.bucket, key, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}

	return nil
}

func (s *MinIOStorage) Get(ctx context.Context, key string) ([]byte, string, error) {
	obj, err := s.client.GetObject(ctx, s.bucket, key, minio.GetObjectOptions{})
	if err != nil {
		return nil, "", fmt.Errorf("failed to get object: %w", err)
	}
	defer obj.Close()

	data := make([]byte, 0)
	buf := make([]byte, 1024)
	for {
		n, err := obj.Read(buf)
		if n > 0 {
			data = append(data, buf[:n]...)
		}
		if err != nil {
			break
		}
	}

	return data, "", nil
}