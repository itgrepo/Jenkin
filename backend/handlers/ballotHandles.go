package handlers

import (
	"estisi/db"
	"estisi/models"
	"estisi/repository"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// @Summary Get Ballot Drafts List
// @Description Get list of ballot drafts with filtering and pagination
// @Tags Ballot Draft
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search in name or question text"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.BallotDraftListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-draft [get]
func GetBallotDraftsHandler(c *gin.Context) {
	var params models.BallotDraftSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetBallotDrafts(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot drafts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Get Ballot Draft by ID
// @Description Get a single ballot draft by ID with all related data
// @Tags Ballot Draft
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Draft ID"
// @Success 200 {object} models.BallotDraft
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-draft/{id} [get]
func GetBallotDraftByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot draft ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	draft, err := repository.GetBallotDraftByID(conn, id)
	if err != nil {
		if err.Error() == "ballot draft not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot draft: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, draft)
}

// @Summary Upsert Ballot Draft (Create or Update)
// @Description Create a new ballot draft or update existing one with nested relationships
// @Tags Ballot Draft
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.BallotDraft true "Ballot Draft data"
// @Success 200 {object} models.BallotDraft
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-draft [post]
func UpsertBallotDraftHandler(c *gin.Context) {
	// Get user ID from JWT middleware
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	var req models.BallotDraft
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	draft, err := repository.UpsertBallotDraft(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert ballot draft: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, draft)
}

// @Summary Delete Ballot Draft
// @Description Delete a ballot draft and all related data
// @Tags Ballot Draft
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Draft ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-draft/{id} [delete]
func DeleteBallotDraftHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot draft ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteBallotDraft(conn, id)
	if err != nil {
		if err.Error() == "ballot draft not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete ballot draft: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Ballot draft deleted successfully"})
}

// @Summary Get Ballot Requests List
// @Description Get list of ballot requests with filtering and pagination
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param status query string false "Filter by status (comma-separated for multiple)"
// @Param search query string false "Search in name"
// @Param createdBy query int false "Filter by creator"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.BallotRequestListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request [get]
func GetBallotRequestsHandler(c *gin.Context) {
	var params models.BallotRequestSearchParams

	// Handle status as array (status[]=value) - Gin's ShouldBindQuery doesn't support array format
	statusArray := c.QueryArray("status[]")
	if len(statusArray) > 0 {
		// Join array values with comma
		statusStr := strings.Join(statusArray, ",")
		params.Status = &statusStr
	} else {
		// Fallback to single value format (status=value)
		if status := c.Query("status"); status != "" {
			params.Status = &status
		}
	}

	// Bind other query parameters (search, createdBy, page, limit)
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetBallotRequests(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot requests: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Get Ballot Request by ID
// @Description Get a single ballot request by ID with all related data
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id} [get]
func GetBallotRequestByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.GetBallotRequestByID(conn, id)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Upsert Ballot Request (Create or Update)
// @Description Create a new ballot request or update existing one with nested relationships
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.BallotRequest true "Ballot Request data"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request [post]
func UpsertBallotRequestHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	var req models.BallotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set createdBy if not provided
	if req.CreatedBy == nil {
		req.CreatedBy = &uid
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.UpsertBallotRequest(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Delete Ballot Request
// @Description Delete a ballot request and all related data
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id} [delete]
func DeleteBallotRequestHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteBallotRequest(conn, id)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Ballot request deleted successfully"})
}

// @Summary Send Ballot Request for Approval
// @Description Update ballot request status
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Param request body models.SendBallotRequestForApprovalRequest true "Status update request"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id}/send-approval [post]
func SendBallotRequestForApprovalHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	var req models.SendBallotRequestForApprovalRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.SendBallotRequestForApproval(conn, id, uid, string(req.Status))
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to send ballot request for approval: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Approve Ballot Request
// @Description Approve a ballot request at manager (level 1) or director (level 2) level
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Param request body models.ApproveBallotRequestRequest true "Approve request"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id}/approve [post]
func ApproveBallotRequestHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	var req models.ApproveBallotRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid approval level: must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.ApproveBallotRequest(conn, id, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to approve ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Disapprove Ballot Request
// @Description Disapprove a ballot request at manager (level 1) or director (level 2) level
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Param request body models.DisapproveBallotRequestRequest true "Disapprove request"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id}/disapprove [post]
func DisapproveBallotRequestHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	var req models.DisapproveBallotRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid approval level: must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.DisapproveBallotRequest(conn, id, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to disapprove ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Review Ballot Request
// @Description Send a ballot request back for review at manager (level 1) or director (level 2) level
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Param request body models.ReviewBallotRequestRequest true "Review request"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id}/review [post]
func ReviewBallotRequestHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	var req models.ReviewBallotRequestRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid approval level: must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.ReviewBallotRequest(conn, id, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to review ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Close Ballot Request
// @Description Close a ballot request (update status to closed)
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id}/close [post]
func CloseBallotRequestHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.CloseBallotRequest(conn, id, uid)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to close ballot request: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Send Ballot Request Email
// @Description Send emails to recipients for a ballot request
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Request ID"
// @Success 200 {object} models.BallotRequest
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/{id}/send-email [post]
func SendBallotRequestEmailHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	request, err := repository.SendBallotRequestEmail(conn, id)
	if err != nil {
		if err.Error() == "ballot request not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to send ballot request email: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, request)
}

// @Summary Get Ballot Responses List
// @Description Get list of ballot responses with filtering and pagination
// @Tags Ballot Response
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param ballotRequestId query int false "Filter by ballot request ID"
// @Param userId query int false "Filter by user ID"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.BallotResponseListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-response [get]
func GetBallotResponsesHandler(c *gin.Context) {
	var params models.BallotResponseSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetBallotResponses(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot responses: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Get Ballot Response by ID
// @Description Get a single ballot response by ID with all related data
// @Tags Ballot Response
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Ballot Response ID"
// @Success 200 {object} models.BallotResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-response/{id} [get]
func GetBallotResponseByIDHandler(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot response ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	response, err := repository.GetBallotResponseByID(conn, id)
	if err != nil {
		if err.Error() == "ballot response not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot response: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get Ballot Response by Request and User
// @Description Get a ballot response by request ID and user ID
// @Tags Ballot Response
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param requestId path int true "Ballot Request ID"
// @Param userId path int true "User ID"
// @Success 200 {object} models.BallotResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-response/request/{requestId}/user/{userId} [get]
func GetBallotResponseByRequestAndUserHandler(c *gin.Context) {
	requestID, err := strconv.Atoi(c.Param("requestId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid ballot request ID"})
		return
	}

	userID, err := strconv.Atoi(c.Param("userId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid user ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	response, err := repository.GetBallotResponseByRequestAndUser(conn, requestID, userID)
	if err != nil {
		if err.Error() == "ballot response not found" {
			c.JSON(http.StatusOK, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot response: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Create or Update Ballot Response
// @Description Create or update a ballot response
// @Tags Ballot Response
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.BallotResponse true "Ballot response data"
// @Success 200 {object} models.BallotResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-response [post]
func UpsertBallotResponseHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	var req models.BallotResponse
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set user ID from JWT token
	req.UserID = uid

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	response, err := repository.UpsertBallotResponse(conn, &req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert ballot response: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get Available Ballot Requests
// @Description Get ballot requests available for the current user to answer
// @Tags Ballot Request
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param search query string false "Search in name"
// @Success 200 {object} models.BallotRequestListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request/available [get]
func GetAvailableBallotRequestsHandler(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	uid := 0
	switch v := userID.(type) {
	case int:
		uid = v
	case int64:
		uid = int(v)
	case uint64:
		uid = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	search := c.Query("search")
	var searchPtr *string
	if search != "" {
		searchPtr = &search
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetAvailableBallotRequests(conn, uid, searchPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get available ballot requests: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
