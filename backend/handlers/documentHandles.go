package handlers

import (
	"estisi/db"
	"estisi/email"
	"estisi/models"
	"estisi/repository"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

// @Summary Get Documents
// @Description Get list of documents with optional filters
// @Tags Documents
// @Accept json
// @Produce json
// @Param title query string false "Document title (partial match)"
// @Param type query string false "Document type code"
// @Security BearerAuth
// @Success 200 {object} models.DocumentListResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents [get]
func GetDocumentsHandler(c *gin.Context) {
	titleParam := c.Query("title")
	typeParam := c.Query("type")
	committeeIdParam := c.Query("committeeId")
	folderPath := c.Query("folderPath")

	var params models.DocumentSearchParams
	if strings.TrimSpace(titleParam) != "" {
		t := strings.TrimSpace(titleParam)
		params.Title = &t
	}
	if strings.TrimSpace(typeParam) != "" {
		t := strings.TrimSpace(typeParam)
		params.Type = &t
	}
	if strings.TrimSpace(committeeIdParam) != "" {
		t := strings.TrimSpace(committeeIdParam)
		params.CommitteeID = &t
	}
	if strings.TrimSpace(folderPath) != "" {
		t := strings.TrimSpace(folderPath)
		params.FolderPath = &t
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userID := userIDVal.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	resp, err := repository.GetDocuments(conn, params, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get documents: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary Get document path groups
// @Description Get distinct path prefixes (group by folder under documents/), e.g. documents/meeting, documents/resolution
// @Tags Documents
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.DocumentPathGroupsResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents/path-groups [get]
func GetDocumentPathGroupsHandler(c *gin.Context) {
	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	_ = userIDVal.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	resp, err := repository.GetDocumentPathGroups(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get document path groups: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// @Summary Delete Document
// @Description Soft delete document (set status = 'Deleted') and log action
// @Tags Documents
// @Accept json
// @Produce json
// @Param id path int true "Document ID"
// @Security BearerAuth
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents/{id} [delete]
func DeleteDocumentHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid document ID"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userID := userIDVal.(int)

	roleIDVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	roleID := roleIDVal.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	err = repository.DeleteDocument(conn, id, userID, roleID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Document not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to delete document: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "Document deleted successfully"})
}

// @Summary Notify Document
// @Description Set document status to 'Notified' and log action. Optionally send email to committee members if subject and body are provided.
// @Tags Documents
// @Accept json
// @Produce json
// @Param id path int true "Document ID"
// @Param request body models.NotifyDocumentRequest false "Optional: Email subject and body to send notification"
// @Security BearerAuth
// @Success 200 {object} models.NotifyDocumentResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents/{id}/notify [post]
func NotifyDocumentHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid document ID"})
		return
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userID := userIDVal.(int)

	roleIDVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	roleID := roleIDVal.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	// Get document to check if it exists and has committee_id
	doc, err := repository.GetDocumentByID(conn, id)
	if err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Document not found"})
		return
	}

	// Parse optional request body for email
	var req models.NotifyDocumentRequest
	shouldSendEmail := false
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&req); err == nil {
			// If both subject and body are provided, send email
			if req.Subject != nil && req.Body != nil &&
				strings.TrimSpace(*req.Subject) != "" && strings.TrimSpace(*req.Body) != "" {
				shouldSendEmail = true
			}
		}
	}

	// Send email if requested
	var sentTo *int
	if shouldSendEmail && doc.CommitteeID != nil {
		// Get committee member emails
		emails, err := repository.GetDocumentCommitteeMemberEmails(conn, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get committee member emails: " + err.Error()})
			return
		}

		fmt.Println("emails:", emails)

		emails = []string{"tisidev.2025@gmail.com", "sasichan.bu@intelligist.co.th"}

		if len(emails) > 0 {
			// Build email body with document information
			emailBody := buildSingleDocumentNotificationEmailBody(*req.Body, doc)

			// Send email
			err = email.SendEmail(emails, *req.Subject, emailBody)
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to send email: " + err.Error()})
				return
			}

			sentCount := len(emails)
			sentTo = &sentCount
		}
	}

	// Update document status to 'Notified' and log action
	err = repository.NotifyDocument(conn, id, userID, roleID)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Document not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to notify document: " + err.Error()})
		return
	}

	message := "Document notified successfully"
	if shouldSendEmail && sentTo != nil {
		message = fmt.Sprintf("Document notified and email sent to %d recipients", *sentTo)
	}

	c.JSON(http.StatusOK, models.NotifyDocumentResponse{
		Success: true,
		Message: message,
		SentTo:  sentTo,
	})
}

// buildSingleDocumentNotificationEmailBody builds HTML email body for a single document
func buildSingleDocumentNotificationEmailBody(baseBody string, doc *models.DocumentItem) string {
	var body strings.Builder
	body.WriteString("<html><body>")
	body.WriteString("<p>" + strings.ReplaceAll(baseBody, "\n", "<br>") + "</p>")

	// Add document information table
	body.WriteString("<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; margin-top: 20px;'>")
	body.WriteString("<thead><tr><th>N Number</th><th>Title</th><th>Created</th></tr></thead>")
	body.WriteString("<tbody><tr>")

	if doc.NNumber != nil {
		body.WriteString(fmt.Sprintf("<td>%d</td>", *doc.NNumber))
	} else {
		body.WriteString("<td>-</td>")
	}
	body.WriteString(fmt.Sprintf("<td>%s</td>", doc.Title))
	if doc.CreatedAt != nil {
		body.WriteString(fmt.Sprintf("<td>%s</td>", *doc.CreatedAt))
	} else {
		body.WriteString("<td>-</td>")
	}

	body.WriteString("</tr></tbody></table>")
	body.WriteString("</body></html>")

	return body.String()
}

// @Summary Get Max N Number
// @Description Get the maximum n_number from documents with optional filters
// @Tags Documents
// @Accept json
// @Produce json
// @Param committeeId query int false "Filter by committee ID"
// @Param meetingId query int false "Filter by meeting ID"
// @Param typeCode query string false "Filter by document type code"
// @Security BearerAuth
// @Success 200 {object} models.MaxNNumberResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents/max-n-number [get]
func GetMaxNNumberHandler(c *gin.Context) {

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	result, err := repository.GetMaxNNumber(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get max n_number: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MaxNNumberResponse{MaxNNumber: result})
}

// @Summary Get Document Logs
// @Description Get all logs for a specific document
// @Tags Documents
// @Accept json
// @Produce json
// @Param id path int true "Document ID"
// @Security BearerAuth
// @Success 200 {object} models.DocumentLogListResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents/{id}/logs [get]
func GetDocumentLogsHandler(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid document ID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	logs, err := repository.GetDocumentLogs(conn, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get document logs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, logs)
}

// @Summary Upsert Document
// @Description Create or update a document and log action (CREATE / EDIT)
// @Tags Documents
// @Accept json
// @Produce json
// @Param request body models.DocumentItem true "Document data (include id for update)"
// @Security BearerAuth
// @Success 200 {object} models.DocumentItem
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/documents [post]
func UpsertDocumentHandler(c *gin.Context) {
	var req models.DocumentItem
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid request: " + err.Error()})
		return
	}

	// Basic validation
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Title is required"})
		return
	}
	if strings.TrimSpace(req.TypeCode) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "TypeCode is required"})
		return
	}
	if strings.TrimSpace(req.TypeName) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "TypeName is required"})
		return
	}

	// Optional: validate expectedDate format (YYYY-MM-DD) if provided
	if req.ExpectedDate != nil && strings.TrimSpace(*req.ExpectedDate) != "" {
		dateStr := strings.TrimSpace(*req.ExpectedDate)
		match, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}$`, dateStr)
		if !match {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "expectedDate must be in format YYYY-MM-DD"})
			return
		}
	}

	userIDVal, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	userID := userIDVal.(int)

	roleIDVal, exists := c.Get("role")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{Error: "User not authenticated"})
		return
	}
	roleID := roleIDVal.(int)

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	doc, err := repository.UpsertDocument(conn, req, userID, roleID)
	if err != nil {
		if strings.Contains(err.Error(), "document not found") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "Document not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to upsert document: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, doc)
}
