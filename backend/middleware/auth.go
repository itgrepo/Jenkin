package middleware

import (
	"errors"
	"estisi/models"
	"fmt"
	"net/http"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

var JwtKey = []byte("#@!WSXZAQ123")

type UserClaims struct {
	UserID int `json:"userID"`
	Role   int `json:"role"`
	jwt.StandardClaims
}

func GenerateToken(userID int, role int) (models.Token, error) {
	expireAt := time.Now().Add(24 * time.Hour)
	expireAtFormatted := expireAt.Format("2006-01-02 15:04:05")

	claims := UserClaims{
		UserID: userID,
		Role:   role,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expireAt.Unix(),
			IssuedAt:  time.Now().Unix(),
			Subject:   fmt.Sprintf("%d", userID),
		},
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := jwtToken.SignedString(JwtKey)
	if err != nil {
		return models.Token{}, err
	}
	return models.Token{
		Value:  signedToken,
		Expire: expireAtFormatted,
	}, nil
}

func ParseToken(tokenStr string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		return JwtKey, nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	claims := token.Claims.(*UserClaims)
	return claims, nil
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		// Try to get token from Authorization header first (for mobile apps)
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" {
			// Expected format: "Bearer <token>"
			if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenStr = authHeader[7:]
			}
		}

		// If not found in header, try cookie (for web apps)
		if tokenStr == "" {
			var err error
			tokenStr, err = c.Cookie("estisiToken")
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
				return
			}
		}

		token, err := jwt.ParseWithClaims(tokenStr, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
			return JwtKey, nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		if _, ok := token.Claims.(*UserClaims); !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid claims structure"})
			return
		}

		claims := token.Claims.(*UserClaims)
		c.Set("userID", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func RequireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if r, exists := c.Get("role"); !exists || r != role {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
			return
		}
		c.Next()
	}
}
func ParseAndValidateToken(tokenStr string) (int, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &UserClaims{}, func(token *jwt.Token) (interface{}, error) {
		// ตรวจ signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return JwtKey, nil
	})

	if err != nil || !token.Valid {
		return 0, errors.New("invalid token")
	}

	claims, ok := token.Claims.(*UserClaims)
	if !ok {
		return 0, errors.New("invalid claims structure")
	}

	// ตรวจวันหมดอายุจาก claims.ExpiresAt
	if claims.ExpiresAt < time.Now().Unix() {
		return 0, errors.New("token expired")
	}

	// ✅ คืน userID ที่เป็น int
	return claims.UserID, nil
}
