package utils

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/md5"
	"encoding/base64"
	"encoding/hex"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

var secretKey = "estisi#@!1234567" // 16 bytes สำหรับ AES-128

func AesCBCEncryptForJS(plainText string) (string, error) {

	block, err := aes.NewCipher([]byte(secretKey))
	if err != nil {
		return "", err
	}

	// Padding ให้ความยาวเป็น BlockSize
	padded, err := PKCS7Padding([]byte(plainText), aes.BlockSize)
	if err != nil {
		return "", err
	}

	iv := []byte(secretKey)
	mode := cipher.NewCBCEncrypter(block, iv)

	encrypted := make([]byte, len(padded))
	mode.CryptBlocks(encrypted, padded)

	// base64 encode เพื่อส่งให้ JS
	return base64.StdEncoding.EncodeToString(encrypted), nil
}

func PKCS7Padding(data []byte, blockSize int) ([]byte, error) {
	padLen := blockSize - len(data)%blockSize
	pad := bytes.Repeat([]byte{byte(padLen)}, padLen)
	return append(data, pad...), nil
}

func AesCBCDecryptFromJS(cipherText string) (string, error) {
	// Decode base64 (ได้ ciphertext ที่ CryptoJS เข้ารหัสไว้)
	cipherBytes, err := base64.StdEncoding.DecodeString(cipherText)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher([]byte(secretKey))
	if err != nil {
		return "", err
	}

	if len(cipherBytes)%aes.BlockSize != 0 {
		return "", errors.New("cipherText is not a multiple of the block size")
	}

	iv := []byte(secretKey)
	mode := cipher.NewCBCDecrypter(block, iv)

	decrypted := make([]byte, len(cipherBytes))
	mode.CryptBlocks(decrypted, cipherBytes)

	plain, err := PKCS7UnPadding(decrypted)
	if err != nil {
		return "", err
	}

	return string(plain), nil
}

func PKCS7UnPadding(data []byte) ([]byte, error) {
	length := len(data)
	if length == 0 {
		return nil, errors.New("data is empty")
	}
	padLen := int(data[length-1])
	if padLen > length || padLen == 0 {
		return nil, errors.New("invalid padding")
	}
	return data[:length-padLen], nil
}

func HashPassword(password string) string {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		panic(err) // หรือจัดการ error ตามระบบของคุณ
	}
	return string(bytes)
}

func GetMD5Hash(text string) string {
	hash := md5.Sum([]byte(text))
	return hex.EncodeToString(hash[:])
}

// ConvertPHPBcryptToGo converts PHP bcrypt hash ($2y$) to Go-compatible format ($2a$)
// Go bcrypt can handle $2y$ format, but to be safe, we convert it to $2a$
func ConvertPHPBcryptToGo(phpHash string) string {
	// PHP bcrypt uses $2y$ prefix, Go uses $2a$ or $2b$
	// They are compatible, but we'll convert $2y$ to $2a$ for consistency
	if len(phpHash) >= 4 && phpHash[:4] == "$2y$" {
		return "$2a$" + phpHash[4:]
	}
	return phpHash
}

// ComparePasswordWithPHPBcrypt compares a plain password with PHP bcrypt hash ($2y$)
func ComparePasswordWithPHPBcrypt(hashedPassword, plainPassword string) error {
	// Convert PHP bcrypt hash to Go-compatible format
	goHash := ConvertPHPBcryptToGo(hashedPassword)
	return bcrypt.CompareHashAndPassword([]byte(goHash), []byte(plainPassword))
}
