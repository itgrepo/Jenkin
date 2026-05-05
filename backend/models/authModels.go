package models

import (
	"database/sql"
	"encoding/json"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Message   string `json:"message"`
	ExpiresAt string `json:"expires_at"`
}

// SSOAuthResponse for SSO login response with full UserInfo
type SSOAuthResponse struct {
	User  *UserInfo `json:"user"` // Full UserInfo with all SSO fields except password
	Token string    `json:"token"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type MessageResponse struct {
	Message string `json:"message"`
}

type RegisterRequest struct {
	Username  string `json:"username" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required"`
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Phone     string `json:"phone"`
	Role      string `json:"role"` // customer, seller, admin
}

// SocialLoginRequest for OAuth login (Google, Facebook, LINE)
type SocialLoginRequest struct {
	Provider    string `json:"provider" binding:"required"`    // google, facebook, line
	ProviderID  string `json:"provider_id" binding:"required"` // unique ID from provider
	AccessToken string `json:"accessToken"`                    // token from provider
	Email       string `json:"email"`                          // optional, some providers don't give email
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Username    string `json:"username"` // optional, will auto-generate if empty
	Phone       string `json:"phone"`
	Role        string `json:"role"` // customer, seller, admin
	Avatar      string `json:"avatar"`
}

// UpdateProfileRequest for updating user profile
type UpdateProfileRequest struct {
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
	Email     *string `json:"email,omitempty"`
	Phone     *string `json:"phone,omitempty"`
	Avatar    *string `json:"avatar,omitempty"`
}

type MessageWithIdResponse struct {
	MasterId int    `json:"masterId"`
	Message  string `json:"message"`
}

type KeyResponse struct {
	Key string `json:"key"`
}

type SessionResponse struct {
	IsValid  bool      `json:"valid"`
	UserInfo *UserInfo `json:"userInfo,omitempty"`
}

type NullString struct {
	sql.NullString
}

func (s NullString) MarshalJSON() ([]byte, error) {
	if !s.Valid {
		return []byte("null"), nil
	}
	return json.Marshal(s.String)
}

func (s *NullString) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		s.String, s.Valid = "", false
		return nil
	}
	s.String, s.Valid = string(data), true
	return nil
}
