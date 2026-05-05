package miniox

import (
	"context"
	"errors"
	"estisi/log"
	"fmt"
	"io"
	"mime/multipart"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/spf13/viper"
)

var minioClient *minio.Client // ต้อง initialize ไว้ที่ main

var allowedTypes = map[string]bool{
	"image/png":       true,
	"image/jpeg":      true,
	"application/pdf": true,

	// Word
	"application/msword": true, // .doc
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, // .docx

	// Excel
	"application/vnd.ms-excel": true, // .xls
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true, // .xlsx

	// PowerPoint
	"application/vnd.ms-powerpoint":                                             true, // .ppt
	"application/vnd.openxmlformats-officedocument.presentationml.presentation": true, // .pptx
}

func InitMinioClient() error {
	var err error
	miniOHost := viper.GetString("miniO.host")
	miniOUser := viper.GetString("miniO.user")
	miniOPass := viper.GetString("miniO.pass")

	minioClient, err = minio.New(miniOHost, &minio.Options{
		Creds:  credentials.NewStaticV4(miniOUser, miniOPass, ""),
		Secure: false,
	})
	if err != nil {
		log.Error("Failed to initialize MinIO client: %v", err)
		return err
	}
	log.Info("MinIO client initialized successfully")
	return nil
}

func UploadFileMiniO(file *multipart.FileHeader, objectName string) (err error) {
	// ตรวจสอบว่า MinIO client ถูก initialize แล้วหรือยัง
	if minioClient == nil {
		return errors.New("MinIO client ไม่ได้ถูก initialize")
	}

	// ✅ ตรวจสอบประเภทไฟล์
	if !isAllowedContentType(file) {
		return errors.New("ไฟล์ต้องเป็น PNG, JPG หรือ PDF เท่านั้น")
	}

	maxFileSizeMB := viper.GetInt("miniO.maxFileSizeMB")

	// ✅ ตรวจสอบขนาดไฟล์
	if file.Size > int64(maxFileSizeMB*1024*1024) {
		msg_err := fmt.Sprintf("ขนาดไฟล์ต้องไม่เกิน %d MB", maxFileSizeMB)
		return errors.New(msg_err)
	}

	src, err := file.Open()
	if err != nil {
		log.Error("Failed to open uploaded file: %v", err)
		return fmt.Errorf("ไม่สามารถเปิดไฟล์ที่อัปโหลด: %v", err)
	}
	defer src.Close()

	bucketName := viper.GetString("miniO.bucketName")
	if bucketName == "" {
		return errors.New("ไม่พบ bucket name ใน configuration")
	}

	// ✅ ตรวจสอบ/สร้าง bucket
	ctx := context.Background()
	exists, err := minioClient.BucketExists(ctx, bucketName)
	if err != nil {
		log.Error("Failed to check bucket existence: %v", err)
		return fmt.Errorf("ไม่สามารถเชื่อมต่อกับ MinIO: %v", err)
	}
	if !exists {
		err = minioClient.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			log.Error("Failed to create bucket: %v", err)
			return fmt.Errorf("ไม่สามารถสร้าง bucket: %v", err)
		}
		log.Info("Created bucket: %s", bucketName)
	}

	// ✅ อัปโหลดไฟล์
	_, err = minioClient.PutObject(ctx, bucketName, objectName, src, file.Size, minio.PutObjectOptions{
		ContentType: file.Header.Get("Content-Type"),
	})
	if err != nil {
		log.Error("Failed to upload file to MinIO: %v", err)
		return fmt.Errorf("อัปโหลดไฟล์ล้มเหลว: %v", err)
	}

	log.Info("File uploaded successfully: %s", objectName)
	return nil
}

func DeleteFileFromMinIO(objectName string) error {
	ctx := context.Background()
	bucketName := viper.GetString("miniO.bucketName")
	// remove object
	err := minioClient.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
	if err != nil {
		return fmt.Errorf("failed to remove object: %w", err)
	}

	//fmt.Println("Successfully deleted", objectName, "from bucket", bucketName)
	return nil
}

// GetFileFromMinIO downloads a file from MinIO and returns the file content and content type
func GetFileFromMinIO(objectName string) (io.ReadCloser, string, int64, error) {
	if minioClient == nil {
		return nil, "", 0, errors.New("MinIO client ไม่ได้ถูก initialize")
	}

	ctx := context.Background()
	bucketName := viper.GetString("miniO.bucketName")
	if bucketName == "" {
		return nil, "", 0, errors.New("ไม่พบ bucket name ใน configuration")
	}

	// Get object info to get content type and size
	objInfo, err := minioClient.StatObject(ctx, bucketName, objectName, minio.StatObjectOptions{})
	if err != nil {
		log.Error("Failed to stat object: %v", err)
		return nil, "", 0, fmt.Errorf("ไม่พบไฟล์: %v", err)
	}

	// Get object
	object, err := minioClient.GetObject(ctx, bucketName, objectName, minio.GetObjectOptions{})
	if err != nil {
		log.Error("Failed to get object: %v", err)
		return nil, "", 0, fmt.Errorf("ไม่สามารถดาวน์โหลดไฟล์: %v", err)
	}

	return object, objInfo.ContentType, objInfo.Size, nil
}

// 🔍 ตรวจสอบประเภทไฟล์ที่อนุญาต
func isAllowedContentType(file *multipart.FileHeader) bool {
	contentType := file.Header.Get("Content-Type")
	return allowedTypes[contentType]
}
