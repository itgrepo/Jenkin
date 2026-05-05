package repository

import (
	"database/sql"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
)

// GetBallotResponses retrieves ballot responses with filtering and pagination
func GetBallotResponses(conn *sql.DB, params models.BallotResponseSearchParams) (*models.BallotResponseListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		br.id, br.ballot_request_id, br.user_id, br.user_name, br.user_email,
		br.submitted_at, br.created_at, br.updated_at
	FROM i_ballot_response br`

	if params.BallotRequestID != nil {
		conditions = append(conditions, "br.ballot_request_id = ?")
		args = append(args, *params.BallotRequestID)
	}

	if params.UserID != nil {
		conditions = append(conditions, "br.user_id = ?")
		args = append(args, *params.UserID)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY br.submitted_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*) FROM i_ballot_response br`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count ballot responses: %v", err)
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
		return nil, fmt.Errorf("failed to query ballot responses: %v", err)
	}
	defer rows.Close()

	var responses []models.BallotResponse
	for rows.Next() {
		var resp models.BallotResponse
		var userEmail sql.NullString
		var submittedAt, createdAt, updatedAt sql.NullTime

		err := rows.Scan(
			&resp.ID, &resp.BallotRequestID, &resp.UserID, &resp.UserName, &userEmail,
			&submittedAt, &createdAt, &updatedAt,
		)
		if err != nil {
			log.Error("Failed to scan ballot response: %v", err)
			continue
		}

		if userEmail.Valid {
			resp.UserEmail = &userEmail.String
		}
		if submittedAt.Valid {
			val := submittedAt.Time.Format("2006-01-02 15:04:05")
			resp.SubmittedAt = &val
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			resp.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			resp.UpdatedAt = &val
		}

		// Load nested answers
		if resp.ID != nil {
			answers, _ := GetBallotResponseAnswers(conn, *resp.ID)
			resp.Answers = answers
		}

		responses = append(responses, resp)
	}

	return &models.BallotResponseListResponse{
		Data:  responses,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetBallotResponseByID retrieves a ballot response by ID with all related data
func GetBallotResponseByID(conn *sql.DB, id int) (*models.BallotResponse, error) {
	query := `SELECT 
		id, ballot_request_id, user_id, user_name, user_email,
		submitted_at, created_at, updated_at
	FROM i_ballot_response
	WHERE id = ?`

	var resp models.BallotResponse
	var userEmail sql.NullString
	var submittedAt, createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, id).Scan(
		&resp.ID, &resp.BallotRequestID, &resp.UserID, &resp.UserName, &userEmail,
		&submittedAt, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("ballot response not found")
		}
		return nil, fmt.Errorf("failed to get ballot response: %v", err)
	}

	if userEmail.Valid {
		resp.UserEmail = &userEmail.String
	}
	if submittedAt.Valid {
		val := submittedAt.Time.Format("2006-01-02 15:04:05")
		resp.SubmittedAt = &val
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		resp.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		resp.UpdatedAt = &val
	}

	// Load nested answers
	answers, _ := GetBallotResponseAnswers(conn, id)
	resp.Answers = answers

	return &resp, nil
}

// GetBallotResponseByRequestAndUser retrieves a ballot response by request ID and user ID
func GetBallotResponseByRequestAndUser(conn *sql.DB, requestID int, userID int) (*models.BallotResponse, error) {
	query := `SELECT 
		id, ballot_request_id, user_id, user_name, user_email,
		submitted_at, created_at, updated_at
	FROM i_ballot_response
	WHERE ballot_request_id = ? AND user_id = ?`

	var resp models.BallotResponse
	var userEmail sql.NullString
	var submittedAt, createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, requestID, userID).Scan(
		&resp.ID, &resp.BallotRequestID, &resp.UserID, &resp.UserName, &userEmail,
		&submittedAt, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("ballot response not found")
		}
		return nil, fmt.Errorf("failed to get ballot response: %v", err)
	}

	if userEmail.Valid {
		resp.UserEmail = &userEmail.String
	}
	if submittedAt.Valid {
		val := submittedAt.Time.Format("2006-01-02 15:04:05")
		resp.SubmittedAt = &val
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		resp.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		resp.UpdatedAt = &val
	}

	// Load nested answers
	if resp.ID != nil {
		answers, _ := GetBallotResponseAnswers(conn, *resp.ID)
		resp.Answers = answers
	}

	return &resp, nil
}

// UpsertBallotResponse creates or updates a ballot response
func UpsertBallotResponse(conn *sql.DB, req *models.BallotResponse, userAuth int) (*models.BallotResponse, error) {
	// Validate required fields
	if req.BallotRequestID <= 0 {
		return nil, fmt.Errorf("ballot_request_id is required")
	}
	if req.UserID <= 0 {
		return nil, fmt.Errorf("user_id is required")
	}
	if req.UserName == "" {
		return nil, fmt.Errorf("user_name is required")
	}

	// Start transaction
	tx, err := conn.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	var responseID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_ballot_response SET
			user_name = ?,
			user_email = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND user_id = ?`

		_, err := tx.Exec(query, req.UserName, req.UserEmail, req.ID, req.UserID)
		if err != nil {
			log.Error("Failed to update ballot response: %v", err)
			return nil, fmt.Errorf("failed to update ballot response: %v", err)
		}
		responseID = *req.ID

		// Delete existing answers
		_, err = tx.Exec("DELETE FROM i_ballot_response_answer WHERE ballot_response_id = ?", responseID)
		if err != nil {
			log.Error("Failed to delete ballot response answers: %v", err)
			return nil, fmt.Errorf("failed to delete ballot response answers: %v", err)
		}
	} else {
		// INSERT
		query := `INSERT INTO i_ballot_response (
			ballot_request_id, user_id, user_name, user_email, submitted_at
		) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`

		res, err := tx.Exec(query, req.BallotRequestID, req.UserID, req.UserName, req.UserEmail)
		if err != nil {
			log.Error("Failed to insert ballot response: %v", err)
			return nil, fmt.Errorf("failed to insert ballot response: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get ballot response ID: %v", err)
			return nil, fmt.Errorf("failed to get ballot response ID: %v", err)
		}
		responseID = int(lastID)
	}

	// Insert answers
	for i, answer := range req.Answers {
		displayOrder := i + 1
		if answer.DisplayOrder != nil && *answer.DisplayOrder > 0 {
			displayOrder = *answer.DisplayOrder
		}

		query := `INSERT INTO i_ballot_response_answer (
			ballot_response_id, ballot_draft_answer_id, answer_text, text_input, display_order
		) VALUES (?, ?, ?, ?, ?)`

		_, err := tx.Exec(query, responseID, answer.BallotDraftAnswerID, answer.AnswerText, answer.TextInput, displayOrder)
		if err != nil {
			log.Error("Failed to insert ballot response answer: %v", err)
			return nil, fmt.Errorf("failed to insert ballot response answer: %v", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get the complete ballot response record
	response, err := GetBallotResponseByID(conn, responseID)
	if err != nil {
		log.Error("Failed to get ballot response after upsert: %v", err)
		return nil, fmt.Errorf("failed to get ballot response after upsert: %v", err)
	}

	return response, nil
}

// GetAvailableBallotRequests retrieves ballot requests available for the current user to answer
// Filters by group type to ensure user is in the appropriate group
func GetAvailableBallotRequests(conn *sql.DB, userID int, search *string) (*models.BallotRequestListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT DISTINCT
		br.id, br.name, br.use_draft, br.draft_id, br.question_text, br.answer_type_id,
		br.has_text_input, br.project_id, br.start_date, br.end_date, br.number_of_days,
		br.group_type_id, br.status_id, br.created_by, br.manager_id, br.director_id,
		br.created_at, br.updated_at,
		ms.code as status_code, ms.name as status_name,
		p.name_thai as project_name
	FROM i_ballot_request br
	LEFT JOIN i_master_ballot_request_status ms ON br.status_id = ms.id
	LEFT JOIN i_projects p ON br.project_id = p.id
	LEFT JOIN i_master_ballot_group_type gt ON br.group_type_id = gt.ballot_group_type_id
	WHERE ms.code = 'director_approved'
		AND br.start_date <= CURDATE()
		AND br.end_date >= CURDATE()
		AND NOT EXISTS (
			SELECT 1 FROM i_ballot_response br2 
			WHERE br2.ballot_request_id = br.id AND br2.user_id = ?
		)
		AND (
			-- กรณีเลือกบุคคลทั่วไป - เปิดให้ทุกคนที่ login SSO ตอบได้
			gt.ballot_group_type_code = 'public' OR gt.ballot_group_type_code = 'บุคคลทั่วไป'
			OR
			-- กรณีเลือกคณะ กว. หรือคณะ อนุ กว. - ตรวจสอบว่า user อยู่ใน committee นั้นหรือไม่
			(gt.ballot_group_type_code IN ('committee_gw', 'sub_committee_gw')
				AND EXISTS (
					SELECT 1 FROM i_ballot_request_committee brc
					INNER JOIN i_expert_committee_members ecm ON brc.committee_id = ecm.committee_id
					INNER JOIN i_experts e ON ecm.expert_id = e.id
					WHERE brc.ballot_request_id = br.id
						AND e.user_id = ?
						AND ecm.status = 'active'
						AND e.status = 'active'
				)
			)
			OR
			-- กรณีเลือกเจ้าหน้าที่ สมอ. - ตรวจสอบว่า user อยู่ใน staff recipients หรือไม่
			(gt.ballot_group_type_code = 'tisi_staff'
				AND EXISTS (
					SELECT 1 FROM i_ballot_request_staff brs
					WHERE brs.ballot_request_id = br.id
						AND brs.user_id = ?
				)
			)
			OR
			-- กรณีเลือกผู้เชี่ยวชาญที่ลงทะเบียน - ตรวจสอบว่า user อยู่ใน expert recipients หรือไม่
			(gt.ballot_group_type_code = 'registered_experts'
				AND EXISTS (
					SELECT 1 FROM i_ballot_request_expert bre
					WHERE bre.ballot_request_id = br.id
						AND (bre.user_id = ? OR EXISTS (
							SELECT 1 FROM i_experts e
							WHERE e.id = bre.expert_id AND e.user_id = ?
						))
				)
			)
		)`

	args = append(args, userID, userID, userID, userID, userID)

	if search != nil && *search != "" {
		conditions = append(conditions, "br.name LIKE ?")
		args = append(args, "%"+*search+"%")
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY br.created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(DISTINCT br.id)
	FROM i_ballot_request br
	LEFT JOIN i_master_ballot_request_status ms ON br.status_id = ms.id
	LEFT JOIN i_master_ballot_group_type gt ON br.group_type_id = gt.ballot_group_type_id
	WHERE ms.code = 'director_approved'
		AND br.start_date <= CURDATE()
		AND br.end_date >= CURDATE()
		AND NOT EXISTS (
			SELECT 1 FROM i_ballot_response br2 
			WHERE br2.ballot_request_id = br.id AND br2.user_id = ?
		)
		AND (
			gt.ballot_group_type_code = 'public' OR gt.ballot_group_type_code = 'บุคคลทั่วไป'
			OR
			(gt.ballot_group_type_code IN ('committee_gw', 'sub_committee_gw')
				AND EXISTS (
					SELECT 1 FROM i_ballot_request_committee brc
					INNER JOIN i_expert_committee_members ecm ON brc.committee_id = ecm.committee_id
					INNER JOIN i_experts e ON ecm.expert_id = e.id
					WHERE brc.ballot_request_id = br.id
						AND e.user_id = ?
						AND ecm.status = 'active'
						AND e.status = 'active'
				)
			)
			OR
			(gt.ballot_group_type_code = 'tisi_staff'
				AND EXISTS (
					SELECT 1 FROM i_ballot_request_staff brs
					WHERE brs.ballot_request_id = br.id
						AND brs.user_id = ?
				)
			)
			OR
			(gt.ballot_group_type_code = 'registered_experts'
				AND EXISTS (
					SELECT 1 FROM i_ballot_request_expert bre
					WHERE bre.ballot_request_id = br.id
						AND (bre.user_id = ? OR EXISTS (
							SELECT 1 FROM i_experts e
							WHERE e.id = bre.expert_id AND e.user_id = ?
						))
				)
			)
		)`

	countArgs := []interface{}{userID, userID, userID, userID, userID}
	if len(conditions) > 0 {
		countQuery += " AND " + strings.Join(conditions, " AND ")
		countArgs = append(countArgs, args[5:]...)
	}

	var total int
	err := conn.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count available ballot requests: %v", err)
	}

	// Pagination (default limit 50)
	limit := 50
	offset := 0
	baseQuery += fmt.Sprintf(" LIMIT %d OFFSET %d", limit, offset)

	rows, err := conn.Query(baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query available ballot requests: %v", err)
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
		}

		requests = append(requests, req)
	}

	return &models.BallotRequestListResponse{
		Data:  requests,
		Total: total,
		Page:  1,
		Limit: limit,
	}, nil
}

// Helper functions for nested data
func GetBallotResponseAnswers(conn *sql.DB, responseID int) ([]models.BallotResponseAnswer, error) {
	query := `SELECT id, ballot_draft_answer_id, answer_text, text_input, display_order
	FROM i_ballot_response_answer
	WHERE ballot_response_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(query, responseID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot response answers: %v", err)
	}
	defer rows.Close()

	var answers []models.BallotResponseAnswer
	for rows.Next() {
		var answer models.BallotResponseAnswer
		var ballotDraftAnswerID sql.NullInt64
		var answerText, textInput sql.NullString
		var displayOrder sql.NullInt64

		err := rows.Scan(&answer.ID, &ballotDraftAnswerID, &answerText, &textInput, &displayOrder)
		if err != nil {
			log.Error("Failed to scan ballot response answer: %v", err)
			continue
		}

		if ballotDraftAnswerID.Valid {
			val := int(ballotDraftAnswerID.Int64)
			answer.BallotDraftAnswerID = &val
		}
		if answerText.Valid {
			answer.AnswerText = &answerText.String
		}
		if textInput.Valid {
			answer.TextInput = &textInput.String
		}
		if displayOrder.Valid {
			val := int(displayOrder.Int64)
			answer.DisplayOrder = &val
		}

		answers = append(answers, answer)
	}

	return answers, nil
}
