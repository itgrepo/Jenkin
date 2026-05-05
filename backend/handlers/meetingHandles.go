package handlers

import (
	"estisi/db"
	"estisi/email"
	"estisi/models"
	"estisi/repository"
	"estisi/utils"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// @Summary Upsert Meeting Budget (Create or Update)
// @Description Create a new meeting budget record or update existing one
// @Tags Meeting Budget
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.MeetingBudget true "Meeting Budget data"
// @Success 200 {object} models.MeetingBudget
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting-budget [post]
func UpsertMeetingBudgetHandler(c *gin.Context) {
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

	var req models.MeetingBudget
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	budget, err := repository.UpsertMeetingBudget(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert meeting budget: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, budget)
}

// @Summary Get Meeting Budgets List
// @Description Get list of meeting budgets with filtering and pagination
// @Tags Meeting Budget
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param fiscalYear query string false "Filter by fiscal year"
// @Param departmentId query string false "Filter by department ID"
// @Param subDepartmentId query string false "Filter by sub department ID"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.MeetingBudgetListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting-budget [get]
func GetMeetingBudgetsHandler(c *gin.Context) {
	var params models.MeetingBudgetSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetMeetingBudgets(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting budgets: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Delete Meeting Budget
// @Description Delete a meeting budget record by ID
// @Tags Meeting Budget
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting Budget ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting-budget/{id} [delete]
func DeleteMeetingBudgetHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting budget ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteMeetingBudget(conn, id)
	if err != nil {
		if err.Error() == "meeting budget not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting budget not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete meeting budget: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Meeting budget deleted successfully"})
}

// @Summary Upsert Meeting (Create or Update)
// @Description Create a new meeting record or update existing one
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.Meeting true "Meeting data"
// @Success 200 {object} models.Meeting
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting [post]
func UpsertMeetingHandler(c *gin.Context) {
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

	var req models.Meeting
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	meeting, err := repository.UpsertMeeting(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// @Summary Get Meeting by ID
// @Description Get meeting information by ID
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.Meeting
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id} [get]
func GetMeetingByIDHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	meeting, err := repository.GetMeetingByID(conn, id)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// @Summary Get Unapproved Meetings List
// @Description Get list of unapproved meetings with filtering and pagination
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param startDate query string false "Filter by start date (from)"
// @Param search query string false "Search in committee number, committee name, or instance number"
// @Param status query string false "Filter by status"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.MeetingListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/unapproved [get]
func GetUnapprovedMeetingsHandler(c *gin.Context) {
	var params models.MeetingSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetUnapprovedMeetings(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get unapproved meetings: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Get Approved Meetings List
// @Description Get list of approved meetings with filtering and pagination
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param startDate query string false "Filter by start date (from)"
// @Param search query string false "Search in committee number, committee name, or instance number"
// @Param status query string false "Filter by status"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.MeetingListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/approved [get]
func GetApprovedMeetingsHandler(c *gin.Context) {
	var params models.MeetingSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetApprovedMeetings(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get approved meetings: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Delete Meeting
// @Description Delete a meeting record by ID
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id} [delete]
func DeleteMeetingHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteMeeting(conn, id)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Meeting deleted successfully"})
}

// @Summary Send Meeting for Approval
// @Description Send a meeting for approval (level 1 or 2)
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.SendApprovalRequest true "Approval level (1 or 2)"
// @Success 200 {object} models.Meeting
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/send-approval [post]
func SendMeetingForApprovalHandler(c *gin.Context) {
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

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.SendApprovalRequest
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

	meeting, err := repository.SendMeetingForApproval(conn, id, req.Level, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to send meeting for approval: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// @Summary Approve Meeting
// @Description Approve a meeting at the specified level
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.ApproveMeetingRequest true "Approve request"
// @Success 200 {object} models.Meeting
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/approve [post]
func ApproveMeetingHandler(c *gin.Context) {
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

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.ApproveMeetingRequest
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

	meeting, err := repository.ApproveMeeting(conn, id, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to approve meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// @Summary Disapprove Meeting
// @Description Disapprove a meeting
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.DisapproveMeetingRequest true "Disapprove request"
// @Success 200 {object} models.Meeting
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disapprove [post]
func DisapproveMeetingHandler(c *gin.Context) {
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

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.DisapproveMeetingRequest
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

	meeting, err := repository.DisapproveMeeting(conn, id, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to disapprove meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// @Summary Review Meeting
// @Description Send a meeting back for review
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.ReviewMeetingRequest true "Review request"
// @Success 200 {object} models.Meeting
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/review [post]
func ReviewMeetingHandler(c *gin.Context) {
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

	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.ReviewMeetingRequest
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

	meeting, err := repository.ReviewMeeting(conn, id, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to review meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meeting)
}

// @Summary Get Meeting Expense
// @Description Get meeting expense by meeting ID
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MeetingExpense
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/expense [get]
func GetMeetingExpenseHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	expense, err := repository.GetMeetingExpense(conn, meetingID)
	if err != nil {
		if err.Error() == "meeting expense not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting expense not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting expense: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, expense)
}

// @Summary Upsert Meeting Expense
// @Description Create or update meeting expense
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.MeetingExpense true "Meeting Expense data"
// @Success 200 {object} models.MeetingExpense
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/expense [post]
func UpsertMeetingExpenseHandler(c *gin.Context) {
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

	var req models.MeetingExpense
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	expense, err := repository.UpsertMeetingExpense(conn, req, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save meeting expense: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, expense)
}

// @Summary Get Meeting Expense Budget Info
// @Description Get budget information for a meeting
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MeetingExpenseBudgetInfo
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/expense/budget-info [get]
func GetMeetingExpenseBudgetInfoHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	budgetInfo, err := repository.GetMeetingExpenseBudgetInfo(conn, meetingID)
	if err != nil {
		if err.Error() == "meeting not found" || strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get budget info: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, budgetInfo)
}

// @Summary Get Meeting Invitation
// @Description Get meeting invitation by meeting ID
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MeetingInvitation
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/invitation [get]
func GetMeetingInvitationHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	invitation, err := repository.GetMeetingInvitation(conn, meetingID)
	if err != nil {
		if err.Error() == "meeting invitation not found" || strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting invitation not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting invitation: " + err.Error()})
		return
	}

	if invitation == nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting invitation not found"})
		return
	}

	c.JSON(http.StatusOK, invitation)
}

// @Summary Upsert Meeting Invitation
// @Description Create or update meeting invitation
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.MeetingInvitation true "Meeting invitation data"
// @Success 200 {object} models.MeetingInvitation
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/invitation [post]
func UpsertMeetingInvitationHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	// Bind JSON request
	var invitation models.MeetingInvitation
	if err := c.ShouldBindJSON(&invitation); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Override meeting ID from path parameter
	invitation.MeetingID = meetingID

	// Validate meeting format
	if invitation.MeetingFormat == "" {
		invitation.MeetingFormat = models.MeetingFormatOnsite // default
	}
	if invitation.MeetingFormat != models.MeetingFormatOnsite &&
		invitation.MeetingFormat != models.MeetingFormatOnline &&
		invitation.MeetingFormat != models.MeetingFormatHybrid {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting format: must be onsite, online, or hybrid"})
		return
	}

	// Convert empty strings to nil for optional fields
	if invitation.MeetingLocation != nil && *invitation.MeetingLocation == "" {
		invitation.MeetingLocation = nil
	}
	if invitation.MeetingRoom != nil && *invitation.MeetingRoom == "" {
		invitation.MeetingRoom = nil
	}
	if invitation.MeetingIDOnline != nil && *invitation.MeetingIDOnline == "" {
		invitation.MeetingIDOnline = nil
	}
	if invitation.Passcode != nil && *invitation.Passcode == "" {
		invitation.Passcode = nil
	}
	if invitation.MeetingLink != nil && *invitation.MeetingLink == "" {
		invitation.MeetingLink = nil
	}
	if invitation.AgendaFileName != nil && *invitation.AgendaFileName == "" {
		invitation.AgendaFileName = nil
	}
	if invitation.AgendaFilePath != nil && *invitation.AgendaFilePath == "" {
		invitation.AgendaFilePath = nil
	}
	if invitation.InvitationLetterFileName != nil && *invitation.InvitationLetterFileName == "" {
		invitation.InvitationLetterFileName = nil
	}
	if invitation.InvitationLetterFilePath != nil && *invitation.InvitationLetterFilePath == "" {
		invitation.InvitationLetterFilePath = nil
	}

	// Handle empty arrays for supporting documents
	if invitation.SupportingDocumentNames != nil && len(invitation.SupportingDocumentNames) == 0 {
		invitation.SupportingDocumentNames = nil
	}
	if invitation.SupportingDocumentPaths != nil && len(invitation.SupportingDocumentPaths) == 0 {
		invitation.SupportingDocumentPaths = nil
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Check if invitation already exists
	existingInvitation, err := repository.GetMeetingInvitation(conn, meetingID)
	if err == nil && existingInvitation != nil && existingInvitation.ID != nil {
		invitation.ID = existingInvitation.ID
	}

	result, err := repository.UpsertMeetingInvitation(conn, invitation, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save meeting invitation: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Generate Invitation Letter
// @Description Generate invitation letter automatically
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.GenerateInvitationLetterResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/invitation/generate-letter [post]
func GenerateInvitationLetterHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Check if meeting exists
	var meetingExists bool
	err = conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", meetingID).Scan(&meetingExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to check meeting existence"})
		return
	}
	if !meetingExists {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
		return
	}

	// TODO: Implement PDF generation logic here
	// For now, return a placeholder response
	fileName := fmt.Sprintf("invitation_%d.pdf", meetingID)
	filePath := fmt.Sprintf("/uploads/invitation_%d.pdf", meetingID)

	c.JSON(http.StatusOK, models.GenerateInvitationLetterResponse{
		FileName: fileName,
		FilePath: filePath,
	})
}

// @Summary Send Invitation Email
// @Description Send invitation email
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.SendInvitationEmailResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/invitation/send-email [post]
func SendInvitationEmailHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Check if meeting exists
	var meetingExists bool
	err = conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", meetingID).Scan(&meetingExists)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to check meeting existence"})
		return
	}
	if !meetingExists {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
		return
	}

	// Get meeting information
	meeting, err := repository.GetMeetingByID(conn, meetingID)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting: " + err.Error()})
		return
	}

	// Get meeting invitation
	invitation, err := repository.GetMeetingInvitation(conn, meetingID)
	if err != nil {
		if err.Error() == "meeting invitation not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting invitation not found. Please create invitation first."})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting invitation: " + err.Error()})
		return
	}

	// Check if email already sent
	// if invitation.EmailSentStatus == models.EmailSentStatusSent {
	// 	c.JSON(http.StatusOK, models.ErrorResponse{Error: "อีเมลเชิญประชุมถูกส่งไปแล้ว กรุณาตรวจสอบสถานะ"})
	// 	return
	// }

	// Get committee member emails from i_expert_committee_members > i_experts
	emails, err := repository.GetMeetingCommitteeMemberEmails(conn, meetingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee member emails: " + err.Error()})
		return
	}

	// Get meeting participant emails from i_meeting_participant table
	// emails, err := repository.GetMeetingParticipantEmails(conn, meetingID)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting participant emails: " + err.Error()})
	// 	return
	// }

	fmt.Println("emails:", emails)

	emails = []string{"tisidev.2025@gmail.com", "sasichan.bu@intelligist.co.th"}

	if len(emails) == 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "No committee members found with email addresses"})
		return
	}

	// Build email subject
	subject := fmt.Sprintf("เชิญประชุม %s %s", meeting.CommitteeNumber, meeting.InstanceNumber)

	// Build email body (HTML)
	emailBody := buildInvitationEmailBody(meeting, invitation)

	// Send email
	err = email.SendEmail(emails, subject, emailBody)
	if err != nil {
		// Update status to failed
		updateErr := repository.UpdateEmailSentStatus(conn, meetingID, models.EmailSentStatusFailed)
		if updateErr != nil {
			// Log error but don't fail the request
			fmt.Printf("Failed to update email status to failed: %v\n", updateErr)
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to send email: " + err.Error()})
		return
	}

	// Update status to sent
	err = repository.UpdateEmailSentStatus(conn, meetingID, models.EmailSentStatusSent)
	if err != nil {
		// Log error but don't fail the request since email was sent successfully
		fmt.Printf("Failed to update email status to sent: %v\n", err)
	}

	// Update Meeting status to meeting_invited
	_, err = repository.UpdateMeetingStatusToInvited(conn, meetingID, uid)
	if err != nil {
		// Log error but don't fail the request since email was sent successfully
		fmt.Printf("Failed to update meeting status to invited: %v\n", err)
	}

	c.JSON(http.StatusOK, models.SendInvitationEmailResponse{
		Success: true,
		Message: fmt.Sprintf("ส่งคำเชิญทางอีเมลเรียบร้อยแล้ว จำนวน %d รายการ", len(emails)),
	})
}

// buildInvitationEmailBody builds HTML email body for meeting invitation
func buildInvitationEmailBody(meeting *models.Meeting, invitation *models.MeetingInvitation) string {
	var locationInfo strings.Builder
	if invitation.MeetingLocation != nil && *invitation.MeetingLocation != "" {
		locationInfo.WriteString(fmt.Sprintf("<p><strong>สถานที่:</strong> %s</p>", *invitation.MeetingLocation))
	}
	if invitation.MeetingRoom != nil && *invitation.MeetingRoom != "" {
		locationInfo.WriteString(fmt.Sprintf("<p><strong>ห้อง:</strong> %s</p>", *invitation.MeetingRoom))
	}
	if invitation.MeetingLink != nil && *invitation.MeetingLink != "" {
		locationInfo.WriteString(fmt.Sprintf("<p><strong>ลิงก์การประชุม:</strong> <a href=\"%s\">%s</a></p>", *invitation.MeetingLink, *invitation.MeetingLink))
	}
	if invitation.MeetingIDOnline != nil && *invitation.MeetingIDOnline != "" {
		locationInfo.WriteString(fmt.Sprintf("<p><strong>Meeting ID:</strong> %s</p>", *invitation.MeetingIDOnline))
	}
	if invitation.Passcode != nil && *invitation.Passcode != "" {
		locationInfo.WriteString(fmt.Sprintf("<p><strong>Passcode:</strong> %s</p>", *invitation.Passcode))
	}

	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; }
		.container { max-width: 600px; margin: 0 auto; padding: 20px; }
		.header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
		.content { background-color: #f9f9f9; padding: 20px; }
		.details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #0066cc; }
		.footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<h1>เชิญประชุม</h1>
		</div>
		<div class="content">
			<p>เรียน คณะกรรมการ</p>
			<div class="details">
				<h2>%s</h2>
				<p><strong>ชื่อคณะ:</strong> %s</p>
				<p><strong>ครั้งที่:</strong> %s</p>
				<p><strong>วันที่:</strong> %s</p>
				%s
			</div>
			%s
			<p>ขอแสดงความนับถือ</p>
			<p>สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม (สมอ.)</p>
		</div>
		<div class="footer">
			<p>อีเมลนี้ส่งโดยระบบอัตโนมัติ กรุณาอย่าตอบกลับ</p>
		</div>
	</div>
</body>
</html>
	`,
		meeting.CommitteeNumber,
		meeting.CommitteeName,
		meeting.InstanceNumber,
		meeting.StartDate,
		locationInfo.String(),
		getAttachmentsSection(invitation),
	)

	return html
}

// getAttachmentsSection builds attachment section for email
func getAttachmentsSection(invitation *models.MeetingInvitation) string {
	var attachments strings.Builder
	hasAttachments := false

	if invitation.AgendaFilePath != nil && *invitation.AgendaFilePath != "" {
		attachments.WriteString(fmt.Sprintf("<p><strong>วาระการประชุม:</strong> <a href=\"%s\">%s</a></p>", utils.GetFullPathFilex(*invitation.AgendaFilePath), *invitation.AgendaFileName))
		hasAttachments = true
	}

	if invitation.InvitationLetterFilePath != nil && *invitation.InvitationLetterFilePath != "" {
		attachments.WriteString(fmt.Sprintf("<p><strong>หนังสือเชิญ:</strong> <a href=\"%s\">%s</a></p>", utils.GetFullPathFilex(*invitation.InvitationLetterFilePath), *invitation.InvitationLetterFileName))
		hasAttachments = true
	}

	if invitation.SupportingDocumentPaths != nil && len(invitation.SupportingDocumentPaths) > 0 {
		attachments.WriteString("<p><strong>เอกสารประกอบ:</strong></p><ul>")
		for i, path := range invitation.SupportingDocumentPaths {
			name := ""
			if i < len(invitation.SupportingDocumentNames) {
				name = invitation.SupportingDocumentNames[i]
			}
			attachments.WriteString(fmt.Sprintf("<li><a href=\"%s\">%s</a></li>", utils.GetFullPathFilex(path), name))
		}
		attachments.WriteString("</ul>")
		hasAttachments = true
	}

	if hasAttachments {
		return fmt.Sprintf("<div class=\"details\"><h3>เอกสารแนบ</h3>%s</div>", attachments.String())
	}

	return ""
}

// @Summary Get Meeting Topics
// @Description Get list of topics for a meeting
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MeetingTopicListResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/topics [get]
func GetMeetingTopicsHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetMeetingTopics(conn, meetingID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting topics: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Upsert Meeting Topic
// @Description Create or update a meeting topic
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.MeetingTopic true "Meeting topic data"
// @Success 200 {object} models.MeetingTopic
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/topics [post]
func UpsertMeetingTopicHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.MeetingTopic
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Override meeting ID from path parameter
	req.MeetingID = meetingID

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.UpsertMeetingTopic(conn, req, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save meeting topic: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Batch Upsert Meeting Topics
// @Description Create or update multiple meeting topics at once
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.BatchUpsertMeetingTopicsRequest true "Batch meeting topics data"
// @Success 200 {object} models.BatchUpsertMeetingTopicsResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/topics/batch [post]
func BatchUpsertMeetingTopicsHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.BatchUpsertMeetingTopicsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.BatchUpsertMeetingTopics(conn, meetingID, req.Topics, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save meeting topics: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Delete Meeting Topic
// @Description Delete a meeting topic by ID
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Topic ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/topic/{id} [delete]
func DeleteMeetingTopicHandler(c *gin.Context) {
	topicIDParam := c.Param("id")
	topicID, err := strconv.Atoi(topicIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid topic ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteMeetingTopic(conn, topicID)
	if err != nil {
		if err.Error() == "meeting topic not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting topic not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete meeting topic: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Meeting topic deleted successfully"})
}

// @Summary Close Meeting
// @Description Close a meeting (change status to meeting_closed)
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.CloseMeetingRequest false "Close meeting request"
// @Success 200 {object} models.CloseMeetingResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/close [post]
func CloseMeetingHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.CloseMeetingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Request body is optional, so we ignore the error
		req = models.CloseMeetingRequest{}
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	meeting, err := repository.CloseMeeting(conn, meetingID, req.Remarks, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		if strings.Contains(err.Error(), "no topics found") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to close meeting: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.CloseMeetingResponse{
		Success: true,
		Message: "ปิดการประชุมเรียบร้อยแล้ว",
		Data:    meeting,
	})
}

// @Summary Get Meeting Participants
// @Description Get list of meeting participants
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MeetingParticipantListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/participants [get]
func GetMeetingParticipantsHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	participants, err := repository.GetMeetingParticipants(conn, meetingID)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting participants: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, participants)
}

// @Summary Upsert Meeting Participant
// @Description Create or update a meeting participant
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.MeetingParticipant true "Meeting Participant data"
// @Success 200 {object} models.MeetingParticipant
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/participants [post]
func UpsertMeetingParticipantHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.MeetingParticipant
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	req.MeetingID = meetingID

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	participant, err := repository.UpsertMeetingParticipant(conn, req, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		if strings.Contains(err.Error(), "required") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save meeting participant: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, participant)
}

// @Summary Get Disbursement Summary
// @Description Get disbursement summary for a meeting
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.DisbursementSummary
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary [get]
func GetDisbursementSummaryHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	summary, err := repository.GetDisbursementSummary(conn, meetingID)
	if err != nil {
		if err.Error() == "disbursement summary not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Disbursement summary not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get disbursement summary: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// @Summary Upsert Disbursement Summary
// @Description Create or update disbursement summary
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.DisbursementSummary true "Disbursement Summary data"
// @Success 200 {object} models.DisbursementSummary
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary [post]
func UpsertDisbursementSummaryHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.DisbursementSummary
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	req.MeetingID = meetingID

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	summary, err := repository.UpsertDisbursementSummary(conn, req, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Meeting not found"})
			return
		}
		if strings.Contains(err.Error(), "required") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save disbursement summary: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// @Summary Submit Disbursement for Approval
// @Description Submit disbursement summary for approval
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.SubmitDisbursementResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary/submit [post]
func SubmitDisbursementForApprovalHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.SubmitDisbursementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	// Validate level
	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Level must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	summary, err := repository.SubmitDisbursementForApproval(conn, meetingID, req.Level, uid)
	if err != nil {
		if err.Error() == "disbursement summary not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Disbursement summary not found"})
			return
		}
		if err.Error() == "no participants found" {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "No participants found"})
			return
		}
		if strings.Contains(err.Error(), "invalid level") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to submit disbursement for approval: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.SubmitDisbursementResponse{
		Success: true,
		Message: "ส่งค่าใช้จ่ายเพื่ออนุมัติเรียบร้อยแล้ว",
		Data:    summary,
	})
}

// @Summary Generate Expense Document
// @Description Generate expense document for disbursement
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.GenerateExpenseDocumentResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary/generate-document [post]
func GenerateExpenseDocumentHandler(c *gin.Context) {
	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Check if disbursement summary exists
	_, err = repository.GetDisbursementSummary(conn, meetingID)
	if err != nil {
		if err.Error() == "disbursement summary not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Disbursement summary not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get disbursement summary: " + err.Error()})
		return
	}

	// TODO: Implement PDF generation logic here
	// For now, return a placeholder response
	fileName := fmt.Sprintf("expense_document_%d.pdf", meetingID)
	filePath := fmt.Sprintf("meeting-disbursement/%d/documents/%s", meetingID, fileName)

	c.JSON(http.StatusOK, models.GenerateExpenseDocumentResponse{
		FileName: fileName,
		FilePath: filePath,
	})
}

// @Summary Get Pending Disbursement Meetings
// @Description Get list of disbursement summaries with pending approval and their meetings
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param startDate query string false "Start date"
// @Param endDate query string false "End date"
// @Param search query string false "Search term"
// @Param subDepartmentId query int false "Sub department ID"
// @Param page query int false "Page number"
// @Param limit query int false "Limit per page"
// @Success 200 {object} models.DisbursementSummaryListResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/pending-disbursement-approval [get]
func GetPendingDisbursementMeetingsHandler(c *gin.Context) {
	var params models.MeetingSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	results, err := repository.GetPendingDisbursementMeetings(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get pending disbursement meetings: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, results)
}

// @Summary Get Upcoming Invited Meetings
// @Description Get list of meetings that user is invited to and not yet reached meeting date
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param startDate query string false "Start date"
// @Param endDate query string false "End date"
// @Param search query string false "Search term"
// @Param subDepartmentId query int false "Sub department ID"
// @Param page query int false "Page number"
// @Param limit query int false "Limit per page"
// @Success 200 {object} models.MeetingListResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/upcoming-invited [get]
func GetUpcomingInvitedMeetingsHandler(c *gin.Context) {
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

	var params models.MeetingSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	meetings, err := repository.GetUpcomingInvitedMeetings(conn, uid, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get upcoming invited meetings: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, meetings)
}

// @Summary Get Meeting Details for Attendee
// @Description Get meeting details with registration status for an attendee
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Success 200 {object} models.MeetingWithRegistration
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/attendee-details [get]
func GetMeetingDetailsForAttendeeHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Check if user is invited
	var isInvited bool
	err = conn.QueryRow("SELECT EXISTS(SELECT 1 FROM i_meeting_participant WHERE meeting_id = ? AND user_id = ?)", meetingID, uid).Scan(&isInvited)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to check invitation: " + err.Error()})
		return
	}
	if !isInvited {
		c.JSON(http.StatusForbidden, models.ErrorResponse{Error: "คุณไม่มีสิทธิ์เข้าถึงการประชุมนี้"})
		return
	}

	result, err := repository.GetMeetingDetailsForAttendee(conn, meetingID, uid)
	if err != nil {
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "ไม่พบข้อมูลการประชุม"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get meeting details: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Register for Meeting
// @Description Register a user for a meeting with optional followers
// @Tags Meeting
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.MeetingRegisterRequest true "Registration request"
// @Success 200 {object} models.RegisterResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 409 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/register [post]
func RegisterForMeetingHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.MeetingRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.RegisterForMeeting(conn, meetingID, uid, req.FollowerNames, uid)
	if err != nil {
		if strings.Contains(err.Error(), "ยังไม่ถึงวันประชุม") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		if strings.Contains(err.Error(), "ได้ลงทะเบียน") {
			c.JSON(http.StatusConflict, models.ErrorResponse{Error: err.Error()})
			return
		}
		if err.Error() == "meeting not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "ไม่พบข้อมูลการประชุม"})
			return
		}
		if strings.Contains(err.Error(), "ไม่มีสิทธิ์") {
			c.JSON(http.StatusForbidden, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to register: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Approve Disbursement
// @Description Approve disbursement at specified level
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.ApproveDisbursementRequest true "Approve request"
// @Success 200 {object} models.DisbursementSummary
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary/approve [post]
func ApproveDisbursementHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.ApproveDisbursementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Level must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	summary, err := repository.ApproveDisbursement(conn, meetingID, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "disbursement summary not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Disbursement summary not found"})
			return
		}
		if strings.Contains(err.Error(), "invalid level") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to approve disbursement: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// @Summary Disapprove Disbursement
// @Description Disapprove disbursement at specified level
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.DisapproveDisbursementRequest true "Disapprove request"
// @Success 200 {object} models.DisbursementSummary
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary/disapprove [post]
func DisapproveDisbursementHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.DisapproveDisbursementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Level must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	summary, err := repository.DisapproveDisbursement(conn, meetingID, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "disbursement summary not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Disbursement summary not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to disapprove disbursement: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}

// @Summary Review Disbursement
// @Description Send disbursement back for review
// @Tags Meeting Disbursement
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Meeting ID"
// @Param request body models.ReviewDisbursementRequest true "Review request"
// @Success 200 {object} models.DisbursementSummary
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/meeting/{id}/disbursement-summary/review [post]
func ReviewDisbursementHandler(c *gin.Context) {
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

	meetingIDParam := c.Param("id")
	meetingID, err := strconv.Atoi(meetingIDParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid meeting ID"})
		return
	}

	var req models.ReviewDisbursementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request body: " + err.Error()})
		return
	}

	if req.Level != 1 && req.Level != 2 {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Level must be 1 or 2"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	summary, err := repository.ReviewDisbursement(conn, meetingID, req.Level, req.Remarks, uid)
	if err != nil {
		if err.Error() == "disbursement summary not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Disbursement summary not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to review disbursement: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, summary)
}
