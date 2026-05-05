package repository

import (
	"database/sql"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
)

// GetBallotDrafts retrieves ballot drafts with filtering and pagination
func GetBallotDrafts(conn *sql.DB, params models.BallotDraftSearchParams) (*models.BallotDraftListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		id, name, question_text, answer_type_id, has_text_input, note_text,
		created_at, updated_at
	FROM i_ballot_draft`

	if params.Search != nil && *params.Search != "" {
		conditions = append(conditions, "(name LIKE ? OR question_text LIKE ?)")
		searchPattern := "%" + *params.Search + "%"
		args = append(args, searchPattern, searchPattern)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*) FROM i_ballot_draft`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count ballot drafts: %v", err)
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
		return nil, fmt.Errorf("failed to query ballot drafts: %v", err)
	}
	defer rows.Close()

	var drafts []models.BallotDraft
	for rows.Next() {
		var draft models.BallotDraft
		var answerTypeID sql.NullInt64
		var noteText sql.NullString
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(
			&draft.ID, &draft.Name, &draft.QuestionText, &answerTypeID,
			&draft.HasTextInput, &noteText, &createdAt, &updatedAt,
		)
		if err != nil {
			log.Error("Failed to scan ballot draft: %v", err)
			continue
		}

		if answerTypeID.Valid {
			draft.AnswerTypeID = int(answerTypeID.Int64)
		} else {
			// answer_type_id is NOT NULL in database, but handle gracefully
			log.Error("Ballot draft has null answer_type_id: id=%v", draft.ID)
		}

		if noteText.Valid {
			draft.NoteText = &noteText.String
		}

		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			draft.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			draft.UpdatedAt = &val
		}

		// Load answers
		if draft.ID != nil {
			answers, err := GetBallotDraftAnswers(conn, *draft.ID)
			if err == nil {
				draft.Answers = answers
			}

			// Load attachments
			attachments, err := GetBallotDraftAttachments(conn, *draft.ID)
			if err == nil {
				draft.Attachments = attachments
			}
		}

		drafts = append(drafts, draft)
	}

	return &models.BallotDraftListResponse{
		Data:  drafts,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetBallotDraftByID retrieves a ballot draft by ID with all related data
func GetBallotDraftByID(conn *sql.DB, id int) (*models.BallotDraft, error) {
	query := `SELECT 
		id, name, question_text, answer_type_id, has_text_input, note_text,
		created_at, updated_at
	FROM i_ballot_draft
	WHERE id = ?`

	var draft models.BallotDraft
	var answerTypeID sql.NullInt64
	var noteText sql.NullString
	var createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, id).Scan(
		&draft.ID, &draft.Name, &draft.QuestionText, &answerTypeID,
		&draft.HasTextInput, &noteText, &createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("ballot draft not found")
		}
		return nil, fmt.Errorf("failed to get ballot draft: %v", err)
	}

	if answerTypeID.Valid {
		draft.AnswerTypeID = int(answerTypeID.Int64)
	}

	if noteText.Valid {
		draft.NoteText = &noteText.String
	}

	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		draft.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		draft.UpdatedAt = &val
	}

	// Load answers
	answers, err := GetBallotDraftAnswers(conn, id)
	if err == nil {
		draft.Answers = answers
	}

	// Load attachments
	attachments, err := GetBallotDraftAttachments(conn, id)
	if err == nil {
		draft.Attachments = attachments
	}

	return &draft, nil
}

// UpsertBallotDraft creates or updates a ballot draft with nested relationships
func UpsertBallotDraft(conn *sql.DB, req models.BallotDraft, userAuth int) (*models.BallotDraft, error) {
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if req.QuestionText == "" {
		return nil, fmt.Errorf("questionText is required")
	}
	if req.AnswerTypeID <= 0 {
		return nil, fmt.Errorf("answerType is required")
	}

	// Start transaction
	tx, err := conn.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	var draftID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_ballot_draft SET
			name = ?,
			question_text = ?,
			answer_type_id = ?,
			has_text_input = ?,
			note_text = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := tx.Exec(query,
			req.Name, req.QuestionText, req.AnswerTypeID, req.HasTextInput,
			req.NoteText, userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update ballot draft: %v", err)
			return nil, fmt.Errorf("failed to update ballot draft: %v", err)
		}
		draftID = *req.ID

		// Delete existing answers and attachments
		_, err = tx.Exec("DELETE FROM i_ballot_draft_answer WHERE ballot_draft_id = ?", draftID)
		if err != nil {
			log.Error("Failed to delete ballot draft answers: %v", err)
			return nil, fmt.Errorf("failed to delete ballot draft answers: %v", err)
		}

		_, err = tx.Exec("DELETE FROM i_ballot_draft_attachment WHERE ballot_draft_id = ?", draftID)
		if err != nil {
			log.Error("Failed to delete ballot draft attachments: %v", err)
			return nil, fmt.Errorf("failed to delete ballot draft attachments: %v", err)
		}
	} else {
		// INSERT
		query := `INSERT INTO i_ballot_draft (
			name, question_text, answer_type_id, has_text_input, note_text,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?)`

		res, err := tx.Exec(query,
			req.Name, req.QuestionText, req.AnswerTypeID, req.HasTextInput,
			req.NoteText, userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert ballot draft: %v", err)
			return nil, fmt.Errorf("failed to insert ballot draft: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get ballot draft ID: %v", err)
			return nil, fmt.Errorf("failed to get ballot draft ID: %v", err)
		}
		draftID = int(lastID)
	}

	// Insert answers
	for i, answer := range req.Answers {
		displayOrder := i + 1
		if answer.DisplayOrder != nil && *answer.DisplayOrder > 0 {
			displayOrder = *answer.DisplayOrder
		}

		query := `INSERT INTO i_ballot_draft_answer (
			ballot_draft_id, text, display_order
		) VALUES (?, ?, ?)`

		_, err := tx.Exec(query, draftID, answer.Text, displayOrder)
		if err != nil {
			log.Error("Failed to insert ballot draft answer: %v", err)
			return nil, fmt.Errorf("failed to insert ballot draft answer: %v", err)
		}
	}

	// Insert attachments
	for i, attachment := range req.Attachments {
		displayOrder := i + 1
		if attachment.DisplayOrder != nil && *attachment.DisplayOrder > 0 {
			displayOrder = *attachment.DisplayOrder
		}

		query := `INSERT INTO i_ballot_draft_attachment (
			ballot_draft_id, file_name, file_path, display_order
		) VALUES (?, ?, ?, ?)`

		_, err := tx.Exec(query, draftID, attachment.FileName, attachment.FilePath, displayOrder)
		if err != nil {
			log.Error("Failed to insert ballot draft attachment: %v", err)
			return nil, fmt.Errorf("failed to insert ballot draft attachment: %v", err)
		}
	}

	// Commit transaction
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get the complete ballot draft record
	draft, err := GetBallotDraftByID(conn, draftID)
	if err != nil {
		return nil, err
	}

	return draft, nil
}

// DeleteBallotDraft deletes a ballot draft and all related data (CASCADE)
func DeleteBallotDraft(conn *sql.DB, id int) error {
	// Check if draft exists
	var exists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_ballot_draft WHERE id = ?", id).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check ballot draft existence: %v", err)
	}
	if !exists {
		return fmt.Errorf("ballot draft not found")
	}

	// Delete (CASCADE will handle related records)
	_, err = conn.Exec("DELETE FROM i_ballot_draft WHERE id = ?", id)
	if err != nil {
		log.Error("Failed to delete ballot draft: %v", err)
		return fmt.Errorf("failed to delete ballot draft: %v", err)
	}

	return nil
}

// GetBallotDraftAnswers retrieves all answers for a ballot draft
func GetBallotDraftAnswers(conn *sql.DB, draftID int) ([]models.BallotDraftAnswer, error) {
	query := `SELECT id, text, display_order
	FROM i_ballot_draft_answer
	WHERE ballot_draft_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(query, draftID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot draft answers: %v", err)
	}
	defer rows.Close()

	var answers []models.BallotDraftAnswer
	for rows.Next() {
		var answer models.BallotDraftAnswer
		var displayOrder sql.NullInt64

		err := rows.Scan(&answer.ID, &answer.Text, &displayOrder)
		if err != nil {
			log.Error("Failed to scan ballot draft answer: %v", err)
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

// GetBallotDraftAttachments retrieves all attachments for a ballot draft
func GetBallotDraftAttachments(conn *sql.DB, draftID int) ([]models.BallotDraftAttachment, error) {
	query := `SELECT id, file_name, file_path, display_order
	FROM i_ballot_draft_attachment
	WHERE ballot_draft_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(query, draftID)
	if err != nil {
		return nil, fmt.Errorf("failed to query ballot draft attachments: %v", err)
	}
	defer rows.Close()

	var attachments []models.BallotDraftAttachment
	for rows.Next() {
		var attachment models.BallotDraftAttachment
		var displayOrder sql.NullInt64

		err := rows.Scan(&attachment.ID, &attachment.FileName, &attachment.FilePath, &displayOrder)
		if err != nil {
			log.Error("Failed to scan ballot draft attachment: %v", err)
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
