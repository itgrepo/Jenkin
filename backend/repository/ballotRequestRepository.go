package repository

import (
	"database/sql"
	"estisi/email"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
)

// GetBallotRequests retrieves ballot requests with filtering and pagination
func GetBallotRequests(conn *sql.DB, params models.BallotRequestSearchParams) (*models.BallotRequestListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		br.id, br.name, br.use_draft, br.draft_id, br.question_text, br.answer_type_id,
		br.has_text_input, br.project_id, br.start_date, br.end_date, br.number_of_days,
		br.group_type_id, br.status_id, br.created_by, br.manager_id, br.director_id,
		br.created_at, br.updated_at,
		ms.code as status_code, ms.name as status_name,
		p.name_thai as project_name
	FROM i_ballot_request br
	LEFT JOIN i_master_ballot_request_status ms ON br.status_id = ms.id
	LEFT JOIN i_projects p ON br.project_id = p.id`

	if params.Status != nil && *params.Status != "" {
		// Support comma-separated statuses
		statuses := strings.Split(*params.Status, ",")
		placeholders := make([]string, len(statuses))
		for i, s := range statuses {
			placeholders[i] = "?"
			args = append(args, strings.TrimSpace(s))
		}
		conditions = append(conditions, fmt.Sprintf("ms.code IN (%s)", strings.Join(placeholders, ",")))
	}

	if params.Search != nil && *params.Search != "" {
		conditions = append(conditions, "br.name LIKE ?")
		args = append(args, "%"+*params.Search+"%")
	}

	if params.CreatedBy != nil {
		conditions = append(conditions, "br.created_by = ?")
		args = append(args, *params.CreatedBy)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY br.created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_ballot_request br
	LEFT JOIN i_master_ballot_request_status ms ON br.status_id = ms.id`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count ballot requests: %v", err)
	}

	// Pagination
	page := 1
	limit := 50
	if params.Page != nil && *params.Page > 0 {
		page = *params.Page
	}
	if params.Limit != nil && *params.Limit > 0 {
		limit = *params.Limit
	}
	offset := (page - 1) * limit
	baseQuery += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	rows, err := conn.Query(baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot requests: %v", err)
	}
	defer rows.Close()

	var requests []models.BallotRequest
	for rows.Next() {
		var req models.BallotRequest
		var useDraft sql.NullBool
		var draftID, projectID, numberOfDays, groupTypeID, statusID, createdBy, managerID, directorID sql.NullInt64
		var projectName, statusCode, statusName sql.NullString
		var startDate, endDate sql.NullTime
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(
			&req.ID, &req.Name, &useDraft, &draftID, &req.QuestionText, &req.AnswerType,
			&req.HasTextInput, &projectID, &startDate, &endDate, &numberOfDays,
			&groupTypeID, &statusID, &createdBy, &managerID, &directorID,
			&createdAt, &updatedAt,
			&statusCode, &statusName, &projectName,
		)
		if err != nil {
			log.Error("Failed to scan ballot request: %v", err)
			continue
		}

		if useDraft.Valid {
			req.UseDraft = useDraft.Bool
		}
		if draftID.Valid {
			val := int(draftID.Int64)
			req.DraftID = &val
		}
		if projectID.Valid {
			val := int(projectID.Int64)
			req.ProjectID = &val
		}
		if projectName.Valid {
			req.ProjectName = &projectName.String
		}
		if startDate.Valid {
			req.StartDate = startDate.Time.Format("2006-01-02")
		}
		if endDate.Valid {
			req.EndDate = endDate.Time.Format("2006-01-02")
		}
		if numberOfDays.Valid {
			val := int(numberOfDays.Int64)
			req.NumberOfDays = &val
		}
		if groupTypeID.Valid {
			req.GroupType = int(groupTypeID.Int64)
			req.GroupTypeID = &req.GroupType
		}
		if statusCode.Valid {
			req.Status = models.BallotRequestStatus(statusCode.String)
		}
		if createdBy.Valid {
			val := int(createdBy.Int64)
			req.CreatedBy = &val
		}
		if managerID.Valid {
			val := int(managerID.Int64)
			req.ManagerID = &val
		}
		if directorID.Valid {
			val := int(directorID.Int64)
			req.DirectorID = &val
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			req.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			req.UpdatedAt = &val
		}

		// Load nested data
		if req.ID != nil {
			answers, _ := GetBallotRequestAnswers(conn, *req.ID)
			req.Answers = answers

			attachments, _ := GetBallotRequestAttachments(conn, *req.ID)
			req.Attachments = attachments

			committeeIDs, _ := GetBallotRequestCommittees(conn, *req.ID)
			req.CommitteeIDs = committeeIDs

			staffRecipients, _ := GetBallotRequestStaff(conn, *req.ID)
			req.StaffRecipients = staffRecipients

			expertRecipients, _ := GetBallotRequestExperts(conn, *req.ID)
			req.ExpertRecipients = expertRecipients
		}

		requests = append(requests, req)
	}

	return &models.BallotRequestListResponse{
		Data:  requests,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetBallotRequestByID retrieves a ballot request by ID with all related data
func GetBallotRequestByID(conn *sql.DB, id int) (*models.BallotRequest, error) {
	query := `SELECT 
		br.id, br.name, br.use_draft, br.draft_id, br.question_text, br.answer_type_id,
		br.has_text_input, br.project_id, br.start_date, br.end_date, br.number_of_days,
		br.group_type_id, br.status_id, br.created_by, br.manager_id, br.director_id,
		br.created_at, br.updated_at,
		ms.code as status_code, ms.name as status_name,
		p.name_thai as project_name
	FROM i_ballot_request br
	LEFT JOIN i_master_ballot_request_status ms ON br.status_id = ms.id
	LEFT JOIN i_projects p ON br.project_id = p.id
	WHERE br.id = ?`

	var req models.BallotRequest
	var useDraft sql.NullBool
	var draftID, projectID, numberOfDays, groupTypeID, statusID, createdBy, managerID, directorID sql.NullInt64
	var projectName, statusCode, statusName sql.NullString
	var startDate, endDate sql.NullTime
	var createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, id).Scan(
		&req.ID, &req.Name, &useDraft, &draftID, &req.QuestionText, &req.AnswerType,
		&req.HasTextInput, &projectID, &startDate, &endDate, &numberOfDays,
		&groupTypeID, &statusID, &createdBy, &managerID, &directorID,
		&createdAt, &updatedAt,
		&statusCode, &statusName, &projectName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("ballot request not found")
		}
		return nil, fmt.Errorf("failed to get ballot request: %v", err)
	}

	if useDraft.Valid {
		req.UseDraft = useDraft.Bool
	}
	if draftID.Valid {
		val := int(draftID.Int64)
		req.DraftID = &val
	}
	if projectID.Valid {
		val := int(projectID.Int64)
		req.ProjectID = &val
	}
	if projectName.Valid {
		req.ProjectName = &projectName.String
	}
	if startDate.Valid {
		req.StartDate = startDate.Time.Format("2006-01-02")
	}
	if endDate.Valid {
		req.EndDate = endDate.Time.Format("2006-01-02")
	}
	if numberOfDays.Valid {
		val := int(numberOfDays.Int64)
		req.NumberOfDays = &val
	}
	if groupTypeID.Valid {
		req.GroupType = int(groupTypeID.Int64)
		req.GroupTypeID = &req.GroupType
	}
	if statusCode.Valid {
		req.Status = models.BallotRequestStatus(statusCode.String)
	}
	if createdBy.Valid {
		val := int(createdBy.Int64)
		req.CreatedBy = &val
	}
	if managerID.Valid {
		val := int(managerID.Int64)
		req.ManagerID = &val
	}
	if directorID.Valid {
		val := int(directorID.Int64)
		req.DirectorID = &val
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		req.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		req.UpdatedAt = &val
	}

	// Load nested data
	answers, _ := GetBallotRequestAnswers(conn, id)
	req.Answers = answers

	attachments, _ := GetBallotRequestAttachments(conn, id)
	req.Attachments = attachments

	committeeIDs, _ := GetBallotRequestCommittees(conn, id)
	req.CommitteeIDs = committeeIDs

	staffRecipients, _ := GetBallotRequestStaff(conn, id)
	req.StaffRecipients = staffRecipients

	expertRecipients, _ := GetBallotRequestExperts(conn, id)
	req.ExpertRecipients = expertRecipients

	return &req, nil
}

// UpsertBallotRequest creates or updates a ballot request with nested relationships
func UpsertBallotRequest(conn *sql.DB, req models.BallotRequest, userAuth int) (*models.BallotRequest, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if req.QuestionText == "" {
		return nil, fmt.Errorf("questionText is required")
	}
	if req.AnswerType <= 0 {
		return nil, fmt.Errorf("answerType is required")
	}
	if req.StartDate == "" {
		return nil, fmt.Errorf("startDate is required")
	}
	if req.EndDate == "" {
		return nil, fmt.Errorf("endDate is required")
	}
	if req.GroupType <= 0 {
		return nil, fmt.Errorf("groupType is required")
	}

	// Get status_id from status code
	var statusID int
	err := conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = ?", string(req.Status)).Scan(&statusID)
	if err != nil {
		// Default to pending_approval if status not found
		err = conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = 'pending_approval'").Scan(&statusID)
		if err != nil {
			return nil, fmt.Errorf("failed to get status_id: %v", err)
		}
	}

	// Start transaction
	tx, err := conn.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	var requestID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_ballot_request SET
			name = ?,
			use_draft = ?,
			draft_id = ?,
			question_text = ?,
			answer_type_id = ?,
			has_text_input = ?,
			project_id = ?,
			start_date = ?,
			end_date = ?,
			number_of_days = ?,
			group_type_id = ?,
			status_id = ?,
			manager_id = ?,
			director_id = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := tx.Exec(query,
			req.Name, req.UseDraft, req.DraftID, req.QuestionText, req.AnswerType,
			req.HasTextInput, req.ProjectID, req.StartDate, req.EndDate, req.NumberOfDays,
			req.GroupType, statusID, req.ManagerID, req.DirectorID, userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update ballot request: %v", err)
			return nil, fmt.Errorf("failed to update ballot request: %v", err)
		}
		requestID = *req.ID

		// Delete existing nested data
		tx.Exec("DELETE FROM i_ballot_request_answer WHERE ballot_request_id = ?", requestID)
		tx.Exec("DELETE FROM i_ballot_request_attachment WHERE ballot_request_id = ?", requestID)
		tx.Exec("DELETE FROM i_ballot_request_committee WHERE ballot_request_id = ?", requestID)
		tx.Exec("DELETE FROM i_ballot_request_staff WHERE ballot_request_id = ?", requestID)
		tx.Exec("DELETE FROM i_ballot_request_expert WHERE ballot_request_id = ?", requestID)
	} else {
		// INSERT
		query := `INSERT INTO i_ballot_request (
			name, use_draft, draft_id, question_text, answer_type_id, has_text_input,
			project_id, start_date, end_date, number_of_days, group_type_id, status_id,
			created_by, manager_id, director_id, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := tx.Exec(query,
			req.Name, req.UseDraft, req.DraftID, req.QuestionText, req.AnswerType,
			req.HasTextInput, req.ProjectID, req.StartDate, req.EndDate, req.NumberOfDays,
			req.GroupType, statusID, userAuth, req.ManagerID, req.DirectorID, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert ballot request: %v", err)
			return nil, fmt.Errorf("failed to insert ballot request: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			return nil, fmt.Errorf("failed to get ballot request ID: %v", err)
		}
		requestID = int(lastID)
	}

	// Insert answers
	for i, answer := range req.Answers {
		displayOrder := i + 1
		if answer.DisplayOrder != nil && *answer.DisplayOrder > 0 {
			displayOrder = *answer.DisplayOrder
		}
		_, err := tx.Exec("INSERT INTO i_ballot_request_answer (ballot_request_id, text, display_order) VALUES (?, ?, ?)",
			requestID, answer.Text, displayOrder)
		if err != nil {
			log.Error("Failed to insert ballot request answer: %v", err)
			return nil, fmt.Errorf("failed to insert ballot request answer: %v", err)
		}
	}

	// Insert attachments
	for i, attachment := range req.Attachments {
		displayOrder := i + 1
		if attachment.DisplayOrder != nil && *attachment.DisplayOrder > 0 {
			displayOrder = *attachment.DisplayOrder
		}
		_, err := tx.Exec("INSERT INTO i_ballot_request_attachment (ballot_request_id, file_name, file_path, display_order) VALUES (?, ?, ?, ?)",
			requestID, attachment.FileName, attachment.FilePath, displayOrder)
		if err != nil {
			log.Error("Failed to insert ballot request attachment: %v", err)
			return nil, fmt.Errorf("failed to insert ballot request attachment: %v", err)
		}
	}

	// Insert committees
	for _, committeeID := range req.CommitteeIDs {
		_, err := tx.Exec("INSERT INTO i_ballot_request_committee (ballot_request_id, committee_id) VALUES (?, ?)",
			requestID, committeeID)
		if err != nil {
			log.Error("Failed to insert ballot request committee: %v", err)
			return nil, fmt.Errorf("failed to insert ballot request committee: %v", err)
		}
	}

	// Insert staff recipients
	for _, staff := range req.StaffRecipients {
		_, err := tx.Exec("INSERT INTO i_ballot_request_staff (ballot_request_id, user_id, name, email) VALUES (?, ?, ?, ?)",
			requestID, staff.UserID, staff.Name, staff.Email)
		if err != nil {
			log.Error("Failed to insert ballot request staff: %v", err)
			return nil, fmt.Errorf("failed to insert ballot request staff: %v", err)
		}
	}

	// Insert expert recipients
	for _, expert := range req.ExpertRecipients {
		_, err := tx.Exec("INSERT INTO i_ballot_request_expert (ballot_request_id, user_id, expert_id, name, email) VALUES (?, ?, ?, ?, ?)",
			requestID, expert.UserID, nil, expert.Name, expert.Email)
		if err != nil {
			log.Error("Failed to insert ballot request expert: %v", err)
			return nil, fmt.Errorf("failed to insert ballot request expert: %v", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get the complete ballot request record
	request, err := GetBallotRequestByID(conn, requestID)
	if err != nil {
		return nil, err
	}

	return request, nil
}

// DeleteBallotRequest deletes a ballot request and all related data (CASCADE)
func DeleteBallotRequest(conn *sql.DB, id int) error {
	var exists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_request WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check ballot request existence: %v", err)
	}
	if !exists {
		return fmt.Errorf("ballot request not found")
	}

	_, err = conn.Exec("DELETE FROM i_ballot_request WHERE id = ?", id)
	if err != nil {
		log.Error("Failed to delete ballot request: %v", err)
		return fmt.Errorf("failed to delete ballot request: %v", err)
	}

	return nil
}

// SendBallotRequestForApproval updates status to pending_approval
func SendBallotRequestForApproval(conn *sql.DB, id int, userAuth int, status string) (*models.BallotRequest, error) {
	// Get pending_approval status_id
	var statusID int
	err := conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = ?", status).Scan(&statusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending_approval status_id: %v", err)
	}

	_, err = conn.Exec("UPDATE i_ballot_request SET status_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		statusID, userAuth, id)
	if err != nil {
		log.Error("Failed to send ballot request for approval: %v", err)
		return nil, fmt.Errorf("failed to send ballot request for approval: %v", err)
	}

	return GetBallotRequestByID(conn, id)
}

// ApproveBallotRequest approves a ballot request at the specified level
func ApproveBallotRequest(conn *sql.DB, id int, level int, remarks *string, userAuth int) (*models.BallotRequest, error) {
	if level != 1 && level != 2 {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	// Determine status code based on level
	var statusCode string
	if level == 1 {
		statusCode = "waiting_director_review"
	} else {
		statusCode = "director_approved"
	}

	// Get status_id
	var statusID int
	err := conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = ?", statusCode).Scan(&statusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get status_id: %v", err)
	}

	// Check if ballot request exists
	var exists bool
	err = conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_request WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check ballot request existence: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("ballot request not found")
	}

	// Update status, approver ID, and action fields
	var updateQuery string
	var remarksValue interface{}
	if remarks != nil && *remarks != "" {
		remarksValue = *remarks
	} else {
		remarksValue = nil
	}

	if level == 1 {
		updateQuery = "UPDATE i_ballot_request SET status_id = ?, manager_id = ?, action_level_1 = 'approved', action_level_1_remarks = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		_, err = conn.Exec(updateQuery, statusID, userAuth, remarksValue, userAuth, id)
	} else {
		updateQuery = "UPDATE i_ballot_request SET status_id = ?, director_id = ?, action_level_2 = 'approved', action_level_2_remarks = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		_, err = conn.Exec(updateQuery, statusID, userAuth, remarksValue, userAuth, id)
	}
	if err != nil {
		log.Error("Failed to approve ballot request: %v", err)
		return nil, fmt.Errorf("failed to approve ballot request: %v", err)
	}

	// If Director approved (level 2), send emails to recipients
	if level == 2 {
		go sendBallotRequestEmails(conn, id)
	}

	return GetBallotRequestByID(conn, id)
}

// DisapproveBallotRequest disapproves a ballot request at the specified level
func DisapproveBallotRequest(conn *sql.DB, id int, level int, remarks string, userAuth int) (*models.BallotRequest, error) {
	if level != 1 && level != 2 {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	// Determine status code based on level
	var statusCode string
	if level == 1 {
		statusCode = "manager_disapproved"
	} else {
		statusCode = "director_disapproved"
	}

	// Get status_id
	var statusID int
	err := conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = ?", statusCode).Scan(&statusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get status_id: %v", err)
	}

	// Check if ballot request exists
	var exists bool
	err = conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_request WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check ballot request existence: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("ballot request not found")
	}

	// Update status, approver ID, and action fields
	var updateQuery string
	if level == 1 {
		updateQuery = "UPDATE i_ballot_request SET status_id = ?, manager_id = ?, action_level_1 = 'disapprove', action_level_1_remarks = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		_, err = conn.Exec(updateQuery, statusID, userAuth, remarks, userAuth, id)
	} else {
		updateQuery = "UPDATE i_ballot_request SET status_id = ?, director_id = ?, action_level_2 = 'disapprove', action_level_2_remarks = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		_, err = conn.Exec(updateQuery, statusID, userAuth, remarks, userAuth, id)
	}
	if err != nil {
		log.Error("Failed to disapprove ballot request: %v", err)
		return nil, fmt.Errorf("failed to disapprove ballot request: %v", err)
	}

	return GetBallotRequestByID(conn, id)
}

// ReviewBallotRequest sends a ballot request back for review at the specified level
func ReviewBallotRequest(conn *sql.DB, id int, level int, remarks string, userAuth int) (*models.BallotRequest, error) {
	if level != 1 && level != 2 {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	// Status for review is always pending_review
	statusCode := "pending_review"

	// Get status_id
	var statusID int
	err := conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = ?", statusCode).Scan(&statusID)
	if err != nil {
		return nil, fmt.Errorf("failed to get status_id: %v", err)
	}

	// Check if ballot request exists
	var exists bool
	err = conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_request WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check ballot request existence: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("ballot request not found")
	}

	// Update status, approver ID, and action fields
	var updateQuery string
	if level == 1 {
		updateQuery = "UPDATE i_ballot_request SET status_id = ?, manager_id = ?, action_level_1 = 'review', action_level_1_remarks = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		_, err = conn.Exec(updateQuery, statusID, userAuth, remarks, userAuth, id)
	} else {
		updateQuery = "UPDATE i_ballot_request SET status_id = ?, director_id = ?, action_level_2 = 'review', action_level_2_remarks = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
		_, err = conn.Exec(updateQuery, statusID, userAuth, remarks, userAuth, id)
	}
	if err != nil {
		log.Error("Failed to review ballot request: %v", err)
		return nil, fmt.Errorf("failed to review ballot request: %v", err)
	}

	return GetBallotRequestByID(conn, id)
}

// CloseBallotRequest closes a ballot request (updates status to closed)
func CloseBallotRequest(conn *sql.DB, id int, userAuth int) (*models.BallotRequest, error) {
	// Get closed status_id
	var statusID int
	err := conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code = ?", "closed").Scan(&statusID)
	if err != nil {
		// If "closed" status doesn't exist, try alternative status codes
		err = conn.QueryRow("SELECT id FROM i_master_ballot_request_status WHERE code IN ('completed', 'finished', 'done') ORDER BY id LIMIT 1").Scan(&statusID)
		if err != nil {
			return nil, fmt.Errorf("failed to get closed status_id: %v", err)
		}
	}

	// Check if ballot request exists
	var exists bool
	err = conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_request WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check ballot request existence: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("ballot request not found")
	}

	// Update status to closed
	_, err = conn.Exec("UPDATE i_ballot_request SET status_id = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
		statusID, userAuth, id)
	if err != nil {
		log.Error("Failed to close ballot request: %v", err)
		return nil, fmt.Errorf("failed to close ballot request: %v", err)
	}

	return GetBallotRequestByID(conn, id)
}

// SendBallotRequestEmail sends emails to recipients for a ballot request
func SendBallotRequestEmail(conn *sql.DB, id int) (*models.BallotRequest, error) {
	// Check if ballot request exists
	var exists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_request WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check ballot request existence: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("ballot request not found")
	}

	// Send emails asynchronously
	go sendBallotRequestEmails(conn, id)

	// Return the ballot request
	return GetBallotRequestByID(conn, id)
}

// Helper functions for nested data
func GetBallotRequestAnswers(conn *sql.DB, requestID int) ([]models.BallotDraftAnswer, error) {
	query := `SELECT id, text, display_order
	FROM i_ballot_request_answer
	WHERE ballot_request_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(query, requestID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot request answers: %v", err)
	}
	defer rows.Close()

	var answers []models.BallotDraftAnswer
	for rows.Next() {
		var answer models.BallotDraftAnswer
		var displayOrder sql.NullInt64

		err := rows.Scan(&answer.ID, &answer.Text, &displayOrder)
		if err != nil {
			log.Error("Failed to scan ballot request answer: %v", err)
			continue
		}

		if displayOrder.Valid {
			val := int(displayOrder.Int64)
			answer.DisplayOrder = &val
		}

		answers = append(answers, answer)
	}

	return answers, nil
}

func GetBallotRequestAttachments(conn *sql.DB, requestID int) ([]models.BallotDraftAttachment, error) {
	query := `SELECT id, file_name, file_path, display_order
	FROM i_ballot_request_attachment
	WHERE ballot_request_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(query, requestID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot request attachments: %v", err)
	}
	defer rows.Close()

	var attachments []models.BallotDraftAttachment
	for rows.Next() {
		var attachment models.BallotDraftAttachment
		var displayOrder sql.NullInt64

		err := rows.Scan(&attachment.ID, &attachment.FileName, &attachment.FilePath, &displayOrder)
		if err != nil {
			log.Error("Failed to scan ballot request attachment: %v", err)
			continue
		}

		if displayOrder.Valid {
			val := int(displayOrder.Int64)
			attachment.DisplayOrder = &val
		}

		attachments = append(attachments, attachment)
	}

	return attachments, nil
}

func GetBallotRequestCommittees(conn *sql.DB, requestID int) ([]int, error) {
	query := `SELECT committee_id
	FROM i_ballot_request_committee
	WHERE ballot_request_id = ?`

	rows, err := conn.Query(query, requestID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot request committees: %v", err)
	}
	defer rows.Close()

	var committeeIDs []int
	for rows.Next() {
		var committeeID int
		err := rows.Scan(&committeeID)
		if err != nil {
			log.Error("Failed to scan ballot request committee: %v", err)
			continue
		}
		committeeIDs = append(committeeIDs, committeeID)
	}

	return committeeIDs, nil
}

func GetBallotRequestStaff(conn *sql.DB, requestID int) ([]models.BallotRequestRecipient, error) {
	query := `SELECT id, user_id, name, email
	FROM i_ballot_request_staff
	WHERE ballot_request_id = ?`

	rows, err := conn.Query(query, requestID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot request staff: %v", err)
	}
	defer rows.Close()

	var recipients []models.BallotRequestRecipient
	for rows.Next() {
		var recipient models.BallotRequestRecipient
		var userID sql.NullInt64
		var email sql.NullString

		err := rows.Scan(&recipient.ID, &userID, &recipient.Name, &email)
		if err != nil {
			log.Error("Failed to scan ballot request staff: %v", err)
			continue
		}

		if userID.Valid {
			val := int(userID.Int64)
			recipient.UserID = &val
		}
		if email.Valid {
			recipient.Email = &email.String
		}
		recipient.Type = "staff"

		recipients = append(recipients, recipient)
	}

	return recipients, nil
}

func GetBallotRequestExperts(conn *sql.DB, requestID int) ([]models.BallotRequestRecipient, error) {
	query := `SELECT id, user_id, expert_id, name, email
	FROM i_ballot_request_expert
	WHERE ballot_request_id = ?`

	rows, err := conn.Query(query, requestID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot request experts: %v", err)
	}
	defer rows.Close()

	var recipients []models.BallotRequestRecipient
	for rows.Next() {
		var recipient models.BallotRequestRecipient
		var userID, expertID sql.NullInt64
		var email sql.NullString

		err := rows.Scan(&recipient.ID, &userID, &expertID, &recipient.Name, &email)
		if err != nil {
			log.Error("Failed to scan ballot request expert: %v", err)
			continue
		}

		if userID.Valid {
			val := int(userID.Int64)
			recipient.UserID = &val
		}
		if email.Valid {
			recipient.Email = &email.String
		}
		recipient.Type = "expert"

		recipients = append(recipients, recipient)
	}

	return recipients, nil
}

// sendBallotRequestEmails sends emails to recipients based on group type
func sendBallotRequestEmails(conn *sql.DB, requestID int) {
	// Get ballot request details
	request, err := GetBallotRequestByID(conn, requestID)
	if err != nil {
		log.Error("Failed to get ballot request for email: %v", err)
		return
	}

	// Get group type name to determine email recipients
	var groupTypeName string
	err = conn.QueryRow("SELECT ballot_group_type_code FROM i_master_ballot_group_type WHERE ballot_group_type_id = ?", request.GroupType).Scan(&groupTypeName)
	if err != nil {
		log.Error("Failed to get group type name: %v", err)
		return
	}

	var recipients []struct {
		Name  string
		Email string
	}

	// Determine recipients based on group type
	switch groupTypeName {
	case "committee_gw", "sub_committee_gw":
		// กรณีเลือกคณะ กว. หรือคณะ อนุ กว.
		// ดึงจาก i_expert_committees, i_expert_committee_members, i_experts
		if len(request.CommitteeIDs) > 0 {
			placeholders := strings.Repeat("?,", len(request.CommitteeIDs))
			placeholders = placeholders[:len(placeholders)-1] // Remove trailing comma

			query := fmt.Sprintf(`
				SELECT DISTINCT
					CONCAT(COALESCE(t.title_name, ''), ' ', COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')) AS name,
					e.email
				FROM i_expert_committees c
				INNER JOIN i_expert_committee_members ecm ON c.id = ecm.committee_id
				INNER JOIN i_experts e ON ecm.expert_id = e.id
				LEFT JOIN tr6_titlename t ON e.prefix = t.id
				WHERE c.id IN (%s)
					AND ecm.status = 'active'
					AND e.status = 'active'
					AND e.email IS NOT NULL
					AND e.email != ''
			`, placeholders)

			args := make([]interface{}, len(request.CommitteeIDs))
			for i, id := range request.CommitteeIDs {
				args[i] = id
			}

			rows, err := conn.Query(query, args...)
			if err != nil {
				log.Error("Failed to query committee members: %v", err)
				return
			}
			defer rows.Close()

			for rows.Next() {
				var r struct {
					Name  string
					Email string
				}
				var name, email sql.NullString
				if err := rows.Scan(&name, &email); err != nil {
					log.Error("Failed to scan committee member: %v", err)
					continue
				}
				if name.Valid && email.Valid && email.String != "" {
					r.Name = name.String
					r.Email = email.String
					recipients = append(recipients, r)
				}
			}
		}

	case "tisi_staff":
		// กรณีเลือกเจ้าหน้าที่ สมอ.
		// ดึงจาก i_ballot_request_staff และ user_register
		if len(request.StaffRecipients) > 0 {
			for _, staff := range request.StaffRecipients {
				if staff.Email != nil && *staff.Email != "" {
					recipients = append(recipients, struct {
						Name  string
						Email string
					}{
						Name:  staff.Name,
						Email: *staff.Email,
					})
				} else if staff.UserID != nil {
					// If email not in staff recipient, get from user_register
					var email sql.NullString
					err := conn.QueryRow("SELECT email FROM user_register WHERE id = ?", *staff.UserID).Scan(&email)
					if err == nil && email.Valid && email.String != "" {
						recipients = append(recipients, struct {
							Name  string
							Email string
						}{
							Name:  staff.Name,
							Email: email.String,
						})
					}
				}
			}
		}

	case "registered_experts":
		// กรณีเลือก ผู้เชี่ยวชาญที่ลงทะเบียน
		// ดึงจาก i_ballot_request_expert และ i_experts
		if len(request.ExpertRecipients) > 0 {
			for _, expert := range request.ExpertRecipients {
				if expert.Email != nil && *expert.Email != "" {
					recipients = append(recipients, struct {
						Name  string
						Email string
					}{
						Name:  expert.Name,
						Email: *expert.Email,
					})
				} else if expert.UserID != nil {
					// If email not in expert recipient, get from i_experts
					var email sql.NullString
					err := conn.QueryRow("SELECT email FROM i_experts WHERE user_id = ?", *expert.UserID).Scan(&email)
					if err == nil && email.Valid && email.String != "" {
						recipients = append(recipients, struct {
							Name  string
							Email string
						}{
							Name:  expert.Name,
							Email: email.String,
						})
					}
				} else if expert.ID != nil {
					// If expert_id is provided
					var email sql.NullString
					err := conn.QueryRow("SELECT email FROM i_experts WHERE id = ?", *expert.ID).Scan(&email)
					if err == nil && email.Valid && email.String != "" {
						recipients = append(recipients, struct {
							Name  string
							Email string
						}{
							Name:  expert.Name,
							Email: email.String,
						})
					}
				}
			}
		}

	case "public", "บุคคลทั่วไป":
		// กรณีเลือก บุคคลทั่วไป - ไม่ต้องส่ง email
		log.Info("Public group selected, no email will be sent")
		return
	}

	// Send emails to all recipients

	// Start fix for Testing email
	fmt.Println("send email : ", recipients)
	var recipientsTest []struct {
		Name  string
		Email string
	}
	recipientsTest = append(recipientsTest, struct {
		Name  string
		Email string
	}{Name: "System", Email: "tisidev.2025@gmail.com"})

	recipients = recipientsTest

	// End fix for Testing email

	if len(recipients) > 0 {
		emailAddresses := make([]string, 0, len(recipients))
		for _, r := range recipients {
			if r.Email != "" {
				emailAddresses = append(emailAddresses, r.Email)
			}
		}

		if len(emailAddresses) > 0 {
			subject := fmt.Sprintf("แจ้งเตือน: การเวียนขอข้อคิดเห็น - %s", request.Name)
			body := fmt.Sprintf(`
				<html>
				<body>
					<p>เรียน ท่านผู้รับผิดชอบ</p>
					<p>ขอแจ้งให้ทราบว่า มีการเวียนขอข้อคิดเห็นเรื่อง <strong>%s</strong></p>
					<p>กรุณาเข้าไปตอบแบบสอบถามตามลิงก์ที่กำหนด</p>
					<p>วันที่เริ่มสอบถาม: %s</p>
					<p>วันที่สิ้นสุดสอบถาม: %s</p>
					<p>ขอบคุณครับ</p>
				</body>
				</html>
			`, request.Name, request.StartDate, request.EndDate)

			err := email.SendEmail(emailAddresses, subject, body)
			if err != nil {
				log.Error("Failed to send ballot request emails: %v", err)
			} else {
				log.Info("Successfully sent %d ballot request emails", len(emailAddresses))
			}
		}
	}
}
