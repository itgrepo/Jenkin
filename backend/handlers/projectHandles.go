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

// @Summary Get Projects List
// @Description Get list of projects with search and pagination
// @Tags Projects
// @Accept json
// @Produce json
// @Param search query string false "Search term"
// @Param startYear query string false "Start year filter"
// @Param stageCode query string false "Stage code filter"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Security BearerAuth
// @Success 200 {object} models.ProjectListResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects [get]
func GetProjectsListHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	var params models.ProjectSearchParams

	if search := c.Query("search"); search != "" {
		params.Search = &search
	}
	if startYear := c.Query("startYear"); startYear != "" {
		params.StartYear = &startYear
	}
	if stageCode := c.Query("stageCode"); stageCode != "" {
		params.StageCode = &stageCode
	}
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil {
			params.Page = &page
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			params.Limit = &limit
		}
	}

	projects, err := repository.GetProjectsList(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get projects: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, projects)
}

// @Summary Get Project by ID
// @Description Get a single project by ID
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Security BearerAuth
// @Success 200 {object} models.Project
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/{id} [get]
func GetProjectByIDHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid project ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	project, err := repository.GetProjectByID(conn, id)
	if err != nil {
		if err.Error() == "project not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get project: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

// @Summary Upsert Project
// @Description Create or update a project
// @Tags Projects
// @Accept json
// @Produce json
// @Param project body models.Project true "Project data"
// @Security BearerAuth
// @Success 200 {object} models.Project
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects [post]
func UpsertProjectHandler(c *gin.Context) {
	var req models.Project
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	// Set createdBy if not provided
	if req.CreatedBy == nil {
		req.CreatedBy = &userAuth
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	project, err := repository.UpsertProject(conn, req, userAuth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert project: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, project)
}

// @Summary Delete Project
// @Description Soft delete a project
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Security BearerAuth
// @Success 200 {object} models.MessageResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/{id} [delete]
func DeleteProjectHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid project ID"})
		return
	}

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteProject(conn, id, userAuth)
	if err != nil {
		if err.Error() == "project not found" {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete project: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Project deleted successfully"})
}

// @Summary Get Project Logs
// @Description Get all logs for a specific project
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Security BearerAuth
// @Success 200 {array} models.ProjectLog
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/{id}/logs [get]
func GetProjectLogsHandler(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid project ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	logs, err := repository.GetProjectLogs(conn, projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get project logs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// @Summary Update Project Stage
// @Description Update the stage code and stage UI message for a project
// @Tags Projects
// @Accept json
// @Produce json
// @Param request body models.UpdateProjectStageRequest true "Update stage request"
// @Security BearerAuth
// @Success 200 {object} models.Project
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/stage [put]
func UpdateProjectStageHandler(c *gin.Context) {
	var req models.UpdateProjectStageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err := repository.UpdateProjectStage(conn, req.ID, req, userAuth)
	if err != nil {
		if err.Error() == "project not found" || strings.Contains(err.Error(), "project not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Project not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to update project stage: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Project stage updated successfully"})
}

// @Summary Upsert Project Log
// @Description Create or update a project log entry
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Param log body models.ProjectLog true "Project log data"
// @Security BearerAuth
// @Success 200 {object} models.ProjectLog
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/{id}/logs [post]
func UpsertProjectLogHandler(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid project ID"})
		return
	}

	var req models.ProjectLog
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set project ID from URL parameter
	req.ProjectID = projectID

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.UpsertProjectLog(conn, projectID, req, userAuth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert project log: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Project log upserted successfully"})
}

// @Summary Check TIS Number
// @Description Check if a TIS number already exists in tb3_tis table
// @Tags Projects
// @Accept json
// @Produce json
// @Param tisNumber query string true "TIS Number to check"
// @Security BearerAuth
// @Success 200 {object} map[string]bool "Response with exists field"
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/check-tis-number [get]
func CheckTISNumberHandler(c *gin.Context) {
	tisNumber := c.Query("tisNumber")
	if tisNumber == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "tisNumber parameter is required"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	exists, err := repository.CheckTISNumber(conn, tisNumber)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to check TIS number: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, map[string]bool{"exists": exists})
}

// @Summary Save Standard Announcement
// @Description Save standard announcement data to both i_projects and tb3_tis tables
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project ID"
// @Param request body models.SaveStandardAnnouncementRequest true "Standard announcement data"
// @Security BearerAuth
// @Success 200 {object} models.Project
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/{id}/save-standard-announcement [post]
func SaveStandardAnnouncementHandler(c *gin.Context) {
	projectIDStr := c.Param("id")
	projectID, err := strconv.Atoi(projectIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid project ID"})
		return
	}

	var req models.SaveStandardAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set project ID from URL parameter
	req.ProjectID = projectID

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.SaveStandardAnnouncement(conn, req, userAuth)
	if err != nil {
		if strings.Contains(err.Error(), "project not found") || strings.Contains(err.Error(), "does not have TIS number") {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to save standard announcement: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Standard announcement saved successfully"})
}

// @Summary Get TIS Standards For Review
// @Description Get list of TIS standards from tb3_tis table for review
// @Tags Projects
// @Accept json
// @Produce json
// @Param search query string false "Search term"
// @Security BearerAuth
// @Success 200 {object} models.TISStandardForReviewListResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/tis-standards-for-review [get]
func GetTISStandardsForReviewHandler(c *gin.Context) {
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

	result, err := repository.GetTISStandardsForReview(conn, searchPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get TIS standards for review: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Create Review From TIS
// @Description Create a new project review from TIS number
// @Tags Projects
// @Accept json
// @Produce json
// @Param request body models.ProjectReview true "Project review data"
// @Security BearerAuth
// @Success 200 {object} models.ProjectReview
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/projects/create-review-from-tis [post]
func CreateReviewFromTISHandler(c *gin.Context) {
	var req models.ProjectReview
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	review, err := repository.CreateReviewFromTIS(conn, req, userAuth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to create project review: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, review)
}

// @Summary Get Projects Review List
// @Description Get list of project reviews with search and pagination
// @Tags Projects
// @Accept json
// @Produce json
// @Param search query string false "Search term"
// @Param stageCode query string false "Stage code filter"
// @Param enforcementStatus query string false "Enforcement status filter"
// @Param ownerGroupId query int false "Owner group ID filter"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Security BearerAuth
// @Success 200 {object} models.ProjectReviewListResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/project-review [get]
func GetProjectsReviewHandler(c *gin.Context) {
	var params models.ProjectReviewSearchParams

	// Parse query parameters
	if search := c.Query("search"); search != "" {
		params.Search = &search
	}
	if stageCode := c.Query("stageCode"); stageCode != "" {
		params.StageCode = &stageCode
	}
	if enforcementStatus := c.Query("enforcementStatus"); enforcementStatus != "" {
		params.EnforcementStatus = &enforcementStatus
	}
	if ownerGroupIDStr := c.Query("ownerGroupId"); ownerGroupIDStr != "" {
		if ownerGroupID, err := strconv.Atoi(ownerGroupIDStr); err == nil {
			params.OwnerGroupID = &ownerGroupID
		}
	}
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			params.Page = &page
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			params.Limit = &limit
		}
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetProjectsReview(conn, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get project reviews: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// @Summary Update Project Review
// @Description Update a project review by ID
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Review ID"
// @Param request body models.ProjectReview true "Project review data to update"
// @Security BearerAuth
// @Success 200 {object} models.ProjectReview
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/project-review/{id} [put]
func UpdateProjectReviewHandler(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.Atoi(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid review ID"})
		return
	}

	var req models.ProjectReview
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set review ID from URL parameter
	req.ID = &reviewID

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	review, err := repository.UpdateProjectReview(conn, reviewID, req, userAuth)
	if err != nil {
		if strings.Contains(err.Error(), "project review not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Project review not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to update project review: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, review)
}

// @Summary Get Project Review Logs
// @Description Get all log entries for a project review
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project Review ID"
// @Security BearerAuth
// @Success 200 {array} models.ProjectReviewLog
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/project-review/{id}/logs [get]
func GetProjectReviewLogsHandler(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.Atoi(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid review ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	logs, err := repository.GetProjectReviewLogs(conn, reviewID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get project review logs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// @Summary Upsert Project Review Log
// @Description Create or update a project review log entry
// @Tags Projects
// @Accept json
// @Produce json
// @Param id path int true "Project Review ID"
// @Param request body models.ProjectReviewLog true "Project review log data"
// @Security BearerAuth
// @Success 200 {object} models.ProjectReviewLog
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/project-review/{id}/logs [post]
func UpsertProjectReviewLogHandler(c *gin.Context) {
	reviewIDStr := c.Param("id")
	reviewID, err := strconv.Atoi(reviewIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid review ID"})
		return
	}

	var req models.ProjectReviewLog
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Set project review ID from URL parameter
	req.ProjectReviewID = reviewID

	// Get user from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userAuth := userID.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.UpsertProjectReviewLog(conn, reviewID, req, userAuth)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert project review log: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Project review log upserted successfully"})
}
