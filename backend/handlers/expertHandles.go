package handlers

import (
	"estisi/db"
	"estisi/models"
	"estisi/repository"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// @Summary Upsert Expert (Create or Update)
// @Description Create a new expert record or update existing one based on user_id
// @Tags Expert
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.Expert true "Expert form data"
// @Success 200 {object} models.Expert
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert [post]
func UpsertExpertHandler(c *gin.Context) {
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

	var req models.Expert
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set user_id and default values
	// if req.UserID <= 0 {
	// 	req.UserID = uid
	// }

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	expert, err := repository.UpsertExpert(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert expert: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, expert)
}

// @Summary Delete Expert
// @Description Soft delete an expert record
// @Tags Expert
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Expert ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/{id} [delete]
func DeleteExpertHandler(c *gin.Context) {
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
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid expert ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteExpert(conn, id, uid)
	if err != nil {
		if err.Error() == "expert not found or already deleted" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Expert not found or already deleted"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete expert: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Expert deleted successfully"})
}

// @Summary Get Expert by ID
// @Description Get expert information by ID
// @Tags Expert
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Expert ID"
// @Success 200 {object} models.Expert
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/{id} [get]
func GetExpertByIDHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid expert ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	expert, err := repository.GetExpertByID(conn, id)
	if err != nil {
		if err.Error() == "expert not found" {
			c.JSON(http.StatusOK, models.ErrorResponse{Error: "Expert not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get expert: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, expert)
}

// @Summary Get Expert by User ID
// @Description Get expert information by user_id
// @Tags Expert
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param userId path int true "User ID"
// @Success 200 {object} models.Expert
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/user/{userId} [get]
func GetExpertByUserIDHandler(c *gin.Context) {
	userIdParam := c.Param("userId")
	userId, err := strconv.Atoi(userIdParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid user ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	expert, err := repository.GetExpertByUserID(conn, userId)
	if err != nil {
		if err.Error() == "expert not found" {
			c.JSON(http.StatusOK, models.ErrorResponse{Error: "Expert not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get expert: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, expert)
}

// @Summary Get Experts List
// @Description Get list of experts with filtering and pagination. Supports comma-separated search values.
// @Tags Expert
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param name query string false "Search by name (comma-separated for multi-search: 'John, Jane')"
// @Param email query string false "Search by email (comma-separated for multi-search)"
// @Param idCard query string false "Search by ID card (comma-separated for multi-search)"
// @Param status query string false "Filter by status (active, inactive, pending)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.ExpertListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert [get]
func GetExpertsHandler(c *gin.Context) {
	var params models.ExpertSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetExperts(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get experts: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Upsert Committee (Create or Update)
// @Description Create a new committee or update existing one based on committee_number
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.Committee true "Committee form data"
// @Success 200 {object} models.Committee
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committees [post]
func UpsertCommitteeHandler(c *gin.Context) {
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

	var req models.Committee
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	committee, err := repository.UpsertCommittee(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert committee: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, committee)
}

// @Summary Get Committee by ID
// @Description Get a single committee by ID
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Committee ID"
// @Success 200 {object} models.Committee
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committees/{id} [get]
func GetCommitteeByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid committee ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	committee, err := repository.GetCommitteeByID(conn, id)
	if err != nil {
		if err.Error() == "committee not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, committee)
}

// @Summary Get Committee by Committee Number
// @Description Get a single committee by committee_number
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param committeeNumber path string true "Committee Number"
// @Success 200 {object} models.Committee
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committees/{committeeNumber} [get]
func GetCommitteeByCommitteeNumberHandler(c *gin.Context) {
	committeeNumber := c.Param("committeeNumber")
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	committee, err := repository.GetCommitteeByCommitteeNumber(conn, committeeNumber)
	if err != nil {
		if err.Error() == "committee not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Committee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, committee)
}

// @Summary Get Committee by Committee Number
// @Description Get a list of committees by committee_number
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param committeeNumber path string true "Committee Number"
// @Success 200 {object} models.Committee
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committees/numberList/{committeeNumber} [get]
func GetCommitteeByCommitteeSubNumberHandler(c *gin.Context) {
	committeeId := c.Param("committeeId")
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	committee, err := repository.GetCommitteeByCommitteeSubNumber(conn, committeeId)
	if err != nil {
		if err.Error() == "committee not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Committee not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, committee)
}

// @Summary Get Committees List
// @Description Get list of committees with filtering and pagination
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param committeeType query int false "Committee Type ID"
// @Param committeeName query string false "Committee Name (comma-separated for multi-search)"
// @Param status query string false "Status (active, suspended, inactive)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.CommitteeListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committees [get]
func GetCommitteesHandler(c *gin.Context) {
	var params models.CommitteeSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetCommittees(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committees: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Get My Expert Committees
// @Description Get list of committees that current logged-in user is a member of, with filtering and pagination
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param committeeType query int false "Committee Type ID"
// @Param committeeName query string false "Committee Name (comma-separated for multi-search)"
// @Param status query string false "Status (active, suspended, inactive)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.CommitteeListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/committees/my [get]
func GetMyExpertCommitteesHandler(c *gin.Context) {
	var params models.CommitteeSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "Unauthorized"})
		return
	}

	var userID int
	switch v := userIDVal.(type) {
	case int:
		userID = v
	case int64:
		userID = int(v)
	case uint64:
		userID = int(v)
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Invalid user ID type"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetMyExpertCommittees(conn, userID, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get my committees: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Delete Committee
// @Description Delete a committee by ID
// @Tags Committee
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Committee ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committees/{id} [delete]
func DeleteCommitteeHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid committee ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteCommittee(conn, id)
	if err != nil {
		if err.Error() == "committee not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete committee: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Committee deleted successfully"})
}

// @Summary Upsert Directive (Create or Update)
// @Description Create a new directive or update existing one based on id
// @Tags Directive
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.Directive true "Directive data"
// @Success 200 {object} models.Directive
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/directives [post]
func UpsertDirectiveHandler(c *gin.Context) {
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

	var req models.Directive
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	directive, err := repository.UpsertDirective(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert directive: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, directive)
}

// @Summary Get Directive by ID
// @Description Get directive information by ID
// @Tags Directive
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Directive ID"
// @Success 200 {object} models.Directive
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/directives/{id} [get]
func GetDirectiveByIDHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid directive ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	directive, err := repository.GetDirectiveByID(conn, id)
	if err != nil {
		if err.Error() == "directive not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Directive not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get directive: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, directive)
}

// @Summary Delete Directive
// @Description Delete a directive by ID
// @Tags Directive
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Directive ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/directives/{id} [delete]
func DeleteDirectiveHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid directive ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteDirective(conn, id)
	if err != nil {
		if err.Error() == "directive not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Directive not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete directive: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Directive deleted successfully"})
}

// @Summary Get Directives List
// @Description Get list of directives with filtering and pagination
// @Tags Directive
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param orderType query int false "Filter by directive type ID"
// @Param orderNumber query string false "Search in order_number (comma-separated for multi-search)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.DirectiveListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/directives [get]
func GetDirectivesHandler(c *gin.Context) {
	var params models.DirectiveSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetDirectives(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get directives: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Upsert Committee Member (Create or Update)
// @Description Create a new committee member or update existing one based on id
// @Tags CommitteeMember
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body models.CommitteeMember true "Committee Member data"
// @Success 200 {object} models.CommitteeMember
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/committees/members [post]
func UpsertCommitteeMemberHandler(c *gin.Context) {
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

	var req models.CommitteeMember
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	member, err := repository.UpsertCommitteeMember(conn, req, uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert committee member: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

// @Summary Get Committee Member by ID
// @Description Get committee member information by ID
// @Tags CommitteeMember
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Committee Member ID"
// @Success 200 {object} models.CommitteeMember
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/committees/members/{id} [get]
func GetCommitteeMemberByIDHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid committee member ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	member, err := repository.GetCommitteeMemberByID(conn, id)
	if err != nil {
		if err.Error() == "committee member not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Committee member not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee member: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, member)
}

// @Summary Get Committee Members List
// @Description Get list of committee members with filtering and pagination
// @Tags CommitteeMember
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param committeeId query int false "Filter by committee ID"
// @Param expertId query int false "Filter by expert ID"
// @Param positionId query int false "Filter by position ID"
// @Param status query string false "Filter by status (active/inactive)"
// @Param page query int false "Page number (default: 1)"
// @Param limit query int false "Items per page (default: 50)"
// @Success 200 {object} models.CommitteeMemberListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/committees/members [get]
func GetCommitteeMembersHandler(c *gin.Context) {
	var params models.CommitteeMemberSearchParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid query parameters: " + err.Error()})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetCommitteeMembers(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee members: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Delete Committee Member
// @Description Delete a committee member by ID
// @Tags CommitteeMember
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path int true "Committee Member ID"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expert/committees/members/{id} [delete]
func DeleteCommitteeMemberHandler(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid committee member ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteCommitteeMember(conn, id)
	if err != nil {
		if err.Error() == "committee member not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Committee member not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete committee member: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Committee member deleted successfully"})
}
