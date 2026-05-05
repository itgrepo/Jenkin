package handlers

import (
	"estisi/db"
	"estisi/middleware"
	"estisi/models"
	"estisi/repository"
	"estisi/utils"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Logout
// @Description Logout current user by removing token cookie
// @Tags Auth
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.MessageResponse
// @Failure 401 {object} models.ErrorResponse
// @Router /api/v1/estandard/auth/logout [post]
func LogoutHandler(c *gin.Context) {
	userID, exists := c.Get("userID") // จาก JWT middleware
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	fmt.Println("LogoutHandler:", userID)

	// Clear authentication cookie
	c.SetCookie("estisiToken", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Logged out successfully"})
}

// @Summary SSO Login (sso_users table)
// @Description Login with username or email and password from sso_users table. Returns full user information from sso_users table (except password)
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials (username or email)"
// @Success 200 {object} models.SSOAuthResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Router /api/v1/estandard/sso/login [post]
func SSOLoginHandler(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Find user by username or email from sso_users table
	userInfo, err := repository.FindSSOUserByUsernameOrEmail(conn, req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Invalid username/email or password"})
		return
	}

	// Decrypt password from frontend (if encrypted)
	passDecrypt := req.Password
	if passDecrypt != "" && len(passDecrypt) > 50 {
		// If password looks encrypted (long base64 string), try to decrypt it
		if decrypted, err := utils.AesCBCDecryptFromJS(passDecrypt); err == nil {
			passDecrypt = decrypted
		}
	}

	// Compare password with PHP bcrypt hash ($2y$ format)
	if err := utils.ComparePasswordWithPHPBcrypt(*userInfo.PasswordHash, passDecrypt); err != nil {
		fmt.Println("[SSO Login Error] bcrypt compare failed:" + err.Error())
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Invalid username/email or password"})
		return
	}

	// Clear password hash from response (security: don't send password hash in response)
	userInfo.PasswordHash = nil

	token, err := middleware.GenerateToken(*userInfo.Id, userInfo.Role.Id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Set cookie (optional, for backward compatibility)
	c.SetCookie("estisiToken", token.Value, 86400, "/", "", false, true)

	// Return full UserInfo (all fields from sso_users table except password) and token
	c.JSON(http.StatusOK, models.SSOAuthResponse{
		User:  userInfo, // Full UserInfo with all SSO fields
		Token: token.Value,
	})
}

// @Summary SSO Profile (sso_users table)
// @Description Profile with username or email  from sso_users table. Returns full user information from sso_users table (except password)
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials (username or email)"
// @Success 200 {object} models.SSOAuthResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Router /api/v1/estandard/sso/login [post]
func SSOProfileHandler(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Find user by username or email from sso_users table
	userInfo, err := repository.FindSSOUserByUsernameOrEmail(conn, req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Invalid username/email or password"})
		return
	}

	// Clear password hash from response (security: don't send password hash in response)
	userInfo.PasswordHash = nil

	token, err := middleware.GenerateToken(*userInfo.Id, userInfo.Role.Id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Set cookie (optional, for backward compatibility)
	c.SetCookie("estisiToken", token.Value, 86400, "/", "", false, true)

	// Return full UserInfo (all fields from sso_users table except password) and token
	c.JSON(http.StatusOK, models.SSOAuthResponse{
		User:  userInfo, // Full UserInfo with all SSO fields
		Token: token.Value,
	})
}

// @Summary SSO Profile Admin (user_register table)
// @Description Profile with username or email from user_register table. Returns full user information mapped to UserInfo model (except password) and token
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body models.LoginRequest true "Login credentials (username or email)"
// @Success 200 {object} models.SSOAuthResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Router /api/v1/estandard/sso/profile-admin [post]
func SSOProfileAdminHandler(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Find user by username or email from user_register table
	userInfo, err := repository.FindUserRegisterByUsernameOrEmail(conn, req.Username)
	if err != nil {
		if err.Error() == "user not found" {
			c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Invalid username/email"})
			return
		}
		if err.Error() == "account is blocked" {
			c.JSON(http.StatusForbidden, models.ErrorResponse{Error: "Account is blocked"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get user profile: " + err.Error()})
		return
	}

	// Clear password hash from response (security: don't send password hash in response)
	userInfo.PasswordHash = nil

	token, err := middleware.GenerateToken(*userInfo.Id, userInfo.Role.Id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to generate token"})
		return
	}

	// Set cookie (optional, for backward compatibility)
	c.SetCookie("estisiToken", token.Value, 86400, "/", "", false, true)

	// Return full UserInfo (all fields from user_register table except password) and token
	c.JSON(http.StatusOK, models.SSOAuthResponse{
		User:  userInfo, // Full UserInfo mapped from user_register table
		Token: token.Value,
	})
}
