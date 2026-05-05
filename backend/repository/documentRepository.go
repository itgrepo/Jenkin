package repository

import (
	"database/sql"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
)

// GetDocuments retrieves a list of documents with optional filters
func GetDocuments(conn *sql.DB, params models.DocumentSearchParams, userID int) (models.DocumentListResponse, error) {
	var resp models.DocumentListResponse

	var builder strings.Builder
	var args []interface{}

	builder.WriteString(`
		SELECT
			d.id,
			d.n_number,
			d.title,
			d.description,
			d.type_code,
			d.type_name,
			d.subtype_code,
			d.subtype_name,
			d.meeting_id,
			d.project_id,
			d.ballot_id,
			d.committee_id,
			d.replaces,
			d.expected_action,
			DATE_FORMAT(d.expected_date, '%Y-%m-%d') AS expected_date,
			d.status,
			d.file_path,
			d.mime_type,
			DATE_FORMAT(d.updated_at, '%Y-%m-%d %H:%i:%s') AS modified_at,
			DATE_FORMAT(d.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
			d.created_by,
			d.created_by_role_id,
			d.updated_by,
			d.updated_by_role_id,
			d.version,
			CASE
				WHEN d.created_by_role_id = 6 THEN COALESCE(su_created.name, su_created.contact_name, '')
				ELSE COALESCE(CONCAT(COALESCE(ur_created.reg_fname, ''), ' ', COALESCE(ur_created.reg_lname, '')), '')
			END AS created_by_name,
			CASE
				WHEN d.updated_by_role_id = 6 THEN COALESCE(su_updated.name, su_updated.contact_name, '')
				ELSE COALESCE(CONCAT(COALESCE(ur_updated.reg_fname, ''), ' ', COALESCE(ur_updated.reg_lname, '')), '')
			END AS updated_by_name,
			im.meeting_subject as meeting_name,
			ibr.name as ballot_name,
			ip.name_thai as project_name
		FROM i_documents d
		LEFT JOIN sso_users su_created ON d.created_by_role_id = 6 AND d.created_by = su_created.id
		LEFT JOIN user_register ur_created ON d.created_by_role_id != 6 AND d.created_by = ur_created.runrecno
		LEFT JOIN sso_users su_updated ON d.updated_by_role_id = 6 AND d.updated_by = su_updated.id
		LEFT JOIN user_register ur_updated ON d.updated_by_role_id != 6 AND d.updated_by = ur_updated.runrecno
		LEFT JOIN i_meeting im ON im.id =d.meeting_id 
		LEFT JOIN i_ballot_request ibr  ON ibr.id =d.ballot_id 
		LEFT JOIN i_projects ip ON ip.id =d.project_id 
		WHERE d.status <> 'Deleted'
	`)

	if params.CommitteeID != nil && strings.TrimSpace(*params.CommitteeID) != "" {
		builder.WriteString(" AND d.committee_id = ?")
		args = append(args, *params.CommitteeID)
	}

	if params.Title != nil && strings.TrimSpace(*params.Title) != "" {
		builder.WriteString(" AND d.title LIKE ?")
		args = append(args, "%"+strings.TrimSpace(*params.Title)+"%")
	}

	if params.Type != nil && strings.TrimSpace(*params.Type) != "" {
		builder.WriteString(" AND d.type_code = ?")
		args = append(args, strings.TrimSpace(*params.Type))
	}

	if params.FolderPath != nil && strings.TrimSpace(*params.FolderPath) != "" {
		builder.WriteString(" AND d.file_path LIKE ? AND d.file_path <> ?")
		args = append(args, strings.TrimSpace(*params.FolderPath)+"%", strings.TrimSpace(*params.FolderPath))
	}

	builder.WriteString(" ORDER BY d.created_at DESC, d.id DESC")

	query := builder.String()

	rows, err := conn.Query(query, args...)
	if err != nil {
		log.Error("Failed to query documents: %v", err)
		return resp, fmt.Errorf("failed to query documents: %v", err)
	}
	defer rows.Close()

	var items []models.DocumentItem
	for rows.Next() {
		var item models.DocumentItem
		var id, nNumber, createdBy, updatedBy sql.NullInt64
		var createdByRoleID, updatedByRoleID sql.NullInt64
		var meetingID, projectID, ballotID, committeeID sql.NullInt64
		var title, description sql.NullString
		var typeCode, typeName sql.NullString
		var subTypeCode, subTypeName sql.NullString
		var expectedAction, expectedDate, replaces sql.NullString
		var status, filePath, mimeType sql.NullString
		var modifiedAt, createdAt sql.NullString
		var version sql.NullFloat64
		var createdByName, updatedByName sql.NullString
		var meetingName, ballotName, projectName sql.NullString
		err := rows.Scan(
			&id,
			&nNumber,
			&title,
			&description,
			&typeCode,
			&typeName,
			&subTypeCode,
			&subTypeName,
			&meetingID,
			&projectID,
			&ballotID,
			&committeeID,
			&replaces,
			&expectedAction,
			&expectedDate,
			&status,
			&filePath,
			&mimeType,
			&modifiedAt,
			&createdAt,
			&createdBy,
			&createdByRoleID,
			&updatedBy,
			&updatedByRoleID,
			&version,
			&createdByName,
			&updatedByName,
			&meetingName,
			&ballotName,
			&projectName,
		)
		if err != nil {
			log.Error("Failed to scan document: %v", err)
			return resp, fmt.Errorf("failed to scan document: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			item.ID = &idVal
		}
		if nNumber.Valid {
			nVal := int(nNumber.Int64)
			item.NNumber = &nVal
		}
		if title.Valid {
			item.Title = title.String
		}
		if description.Valid && description.String != "" {
			item.Description = &description.String
		}
		if typeCode.Valid {
			item.TypeCode = typeCode.String
		}
		if typeName.Valid {
			item.TypeName = typeName.String
		}
		if subTypeCode.Valid && subTypeCode.String != "" {
			item.SubTypeCode = &subTypeCode.String
		}
		if subTypeName.Valid && subTypeName.String != "" {
			item.SubTypeName = &subTypeName.String
		}
		if meetingID.Valid {
			mv := int(meetingID.Int64)
			item.MeetingID = &mv
		}
		if projectID.Valid {
			pv := int(projectID.Int64)
			item.ProjectID = &pv
		}
		if ballotID.Valid {
			bv := int(ballotID.Int64)
			item.BallotID = &bv
		}
		if committeeID.Valid {
			bv := int(committeeID.Int64)
			item.CommitteeID = &bv
		}
		if replaces.Valid && replaces.String != "" {
			item.Replaces = &replaces.String
		}
		if expectedAction.Valid && expectedAction.String != "" {
			item.ExpectedAction = &expectedAction.String
		}
		if expectedDate.Valid && expectedDate.String != "" {
			item.ExpectedDate = &expectedDate.String
		}
		if status.Valid && status.String != "" {
			item.Status = &status.String
		}
		if filePath.Valid && filePath.String != "" {
			item.FilePath = &filePath.String
		}
		if mimeType.Valid && mimeType.String != "" {
			item.MimeType = &mimeType.String
		}
		if modifiedAt.Valid && modifiedAt.String != "" {
			item.ModifiedAt = &modifiedAt.String
		}
		if createdAt.Valid && createdAt.String != "" {
			item.CreatedAt = &createdAt.String
		}
		if createdBy.Valid {
			cb := int(createdBy.Int64)
			item.CreatedBy = &cb
		}
		if version.Valid {
			v := version.Float64
			item.Version = &v
		}
		if createdByName.Valid && createdByName.String != "" {
			item.CreatedByName = &createdByName.String
		}
		if updatedByName.Valid && updatedByName.String != "" {
			item.UpdatedByName = &updatedByName.String
		}
		if meetingName.Valid && meetingName.String != "" {
			item.MeetingName = &meetingName.String
		}
		if ballotName.Valid && ballotName.String != "" {
			item.BallotName = &ballotName.String
		}
		if projectName.Valid && projectName.String != "" {
			item.ProjectName = &projectName.String
		}
		items = append(items, item)
	}

	if err = rows.Err(); err != nil {
		log.Error("Error iterating document rows: %v", err)
		return resp, fmt.Errorf("error iterating document rows: %v", err)
	}

	resp.Data = items
	return resp, nil
}

// logDocumentAction logs a document action into i_documents_log
func logDocumentAction(tx *sql.Tx, documentID int, action string, detail *string, userID, roleID int) error {
	query := `
		INSERT INTO i_documents_log (
			document_id, action, action_detail, action_by, action_by_role_id
		) VALUES (?, ?, ?, ?, ?)
	`

	_, err := tx.Exec(query, documentID, action, detail, userID, roleID)
	if err != nil {
		log.Error("Failed to insert document log: %v", err)
		return fmt.Errorf("failed to insert document log: %v", err)
	}

	return nil
}

// DeleteDocument performs a soft delete (set status = 'Deleted') and logs the action
func DeleteDocument(conn *sql.DB, documentID int, userID, roleID int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction for DeleteDocument: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Update status to Deleted
	updateQuery := `
		UPDATE i_documents
		SET status = 'Deleted', updated_by = ?,
		WHERE id = ? AND status <> 'Deleted'
	`
	res, err := tx.Exec(updateQuery, userID, documentID)
	if err != nil {
		log.Error("Failed to update document status to Deleted: %v", err)
		return fmt.Errorf("failed to update document status: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		log.Error("Failed to get RowsAffected for DeleteDocument: %v", err)
		return fmt.Errorf("failed to get rows affected: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("document not found or already deleted")
	}

	// Log action
	action := "DELETE"
	if err := logDocumentAction(tx, documentID, action, nil, userID, roleID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		log.Error("Failed to commit DeleteDocument transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

// NotifyDocument sets status to 'Notified' and logs the action
func NotifyDocument(conn *sql.DB, documentID int, userID, roleID int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction for NotifyDocument: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	updateQuery := `
		UPDATE i_documents
		SET status = 'Notified', updated_by = ?
		WHERE id = ? AND status <> 'Deleted'
	`

	res, err := tx.Exec(updateQuery, userID, documentID)
	if err != nil {
		log.Error("Failed to update document status to Notified: %v", err)
		return fmt.Errorf("failed to update document status: %v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		log.Error("Failed to get RowsAffected for NotifyDocument: %v", err)
		return fmt.Errorf("failed to get rows affected: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("document not found or already deleted")
	}

	// Log action
	action := "NOTIFY"
	if err := logDocumentAction(tx, documentID, action, nil, userID, roleID); err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		log.Error("Failed to commit NotifyDocument transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

// GetDocumentCommitteeMemberEmails retrieves email addresses of committee members for a document
func GetDocumentCommitteeMemberEmails(conn *sql.DB, documentID int) ([]string, error) {
	query := `SELECT DISTINCT e.email
	FROM i_documents d
	INNER JOIN i_expert_committee_members ecm ON d.committee_id = ecm.committee_id
	INNER JOIN i_experts e ON ecm.expert_id = e.id
	WHERE d.id = ?
		AND d.committee_id IS NOT NULL
		AND ecm.status = 'active'
		AND e.status = 'active'
		AND e.email IS NOT NULL
		AND e.email != ''`

	rows, err := conn.Query(query, documentID)
	if err != nil {
		return nil, fmt.Errorf("failed to query committee member emails: %v", err)
	}
	defer rows.Close()

	var emails []string
	for rows.Next() {
		var email string
		if err := rows.Scan(&email); err != nil {
			log.Error("Failed to scan email: %v", err)
			continue
		}
		if email != "" {
			emails = append(emails, email)
		}
	}

	return emails, nil
}

// GetDocumentByID retrieves a single document by ID
func GetDocumentByID(conn *sql.DB, documentID int) (*models.DocumentItem, error) {
	return getDocumentByID(conn, documentID)
}

// getDocumentByID retrieves a single document by ID (internal)
func getDocumentByID(conn *sql.DB, documentID int) (*models.DocumentItem, error) {
	query := `
		SELECT
			d.id,
			d.n_number,
			d.title,
			d.description,
			d.type_code,
			d.type_name,
			d.subtype_code,
			d.subtype_name,
			d.meeting_id,
			d.project_id,
			d.ballot_id,
			d.committee_id,
			d.replaces,
			d.expected_action,
			DATE_FORMAT(d.expected_date, '%Y-%m-%d') AS expected_date,
			d.status,
			d.file_path,
			d.mime_type,
			DATE_FORMAT(d.updated_at, '%Y-%m-%d %H:%i:%s') AS modified_at,
			DATE_FORMAT(d.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
			d.created_by,
			d.created_by_role_id,
			d.updated_by,
			d.updated_by_role_id,
			d.version,
			CASE
				WHEN d.created_by_role_id = 6 THEN COALESCE(su_created.name, su_created.contact_name, '')
				ELSE COALESCE(CONCAT(COALESCE(ur_created.reg_fname, ''), ' ', COALESCE(ur_created.reg_lname, '')), '')
			END AS created_by_name,
			CASE
				WHEN d.updated_by_role_id = 6 THEN COALESCE(su_updated.name, su_updated.contact_name, '')
				ELSE COALESCE(CONCAT(COALESCE(ur_updated.reg_fname, ''), ' ', COALESCE(ur_updated.reg_lname, '')), '')
			END AS updated_by_name,
			im.meeting_subject as meeting_name,
			ibr.name as ballot_name,
			ip.name_thai as project_name
		FROM i_documents d
		LEFT JOIN sso_users su_created ON d.created_by_role_id = 6 AND d.created_by = su_created.id
		LEFT JOIN user_register ur_created ON d.created_by_role_id != 6 AND d.created_by = ur_created.runrecno
		LEFT JOIN sso_users su_updated ON d.updated_by_role_id = 6 AND d.updated_by = su_updated.id
		LEFT JOIN user_register ur_updated ON d.updated_by_role_id != 6 AND d.updated_by = ur_updated.runrecno
		LEFT JOIN i_meeting im ON im.id =d.meeting_id 
		LEFT JOIN i_ballot_request ibr  ON ibr.id =d.ballot_id 
		LEFT JOIN i_projects ip ON ip.id =d.project_id 
		WHERE d.id = ?
	`

	var item models.DocumentItem
	var id, nNumber, createdBy, updatedBy sql.NullInt64
	var createdByRoleID, updatedByRoleID sql.NullInt64
	var meetingID, projectID, ballotID, committeeID sql.NullInt64
	var title, description sql.NullString
	var typeCode, typeName sql.NullString
	var subTypeCode, subTypeName sql.NullString
	var expectedAction, expectedDate, replaces sql.NullString
	var status, filePath, mimeType sql.NullString
	var modifiedAt, createdAt sql.NullString
	var version sql.NullFloat64
	var createdByName, updatedByName sql.NullString
	var meetingName, ballotName, projectName sql.NullString
	err := conn.QueryRow(query, documentID).Scan(
		&id,
		&nNumber,
		&title,
		&description,
		&typeCode,
		&typeName,
		&subTypeCode,
		&subTypeName,
		&meetingID,
		&projectID,
		&ballotID,
		&committeeID,
		&replaces,
		&expectedAction,
		&expectedDate,
		&status,
		&filePath,
		&mimeType,
		&modifiedAt,
		&createdAt,
		&createdBy,
		&createdByRoleID,
		&updatedBy,
		&updatedByRoleID,
		&version,
		&createdByName,
		&updatedByName,
		&meetingName,
		&ballotName,
		&projectName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("document not found")
		}
		log.Error("Failed to get document by ID: %v", err)
		return nil, fmt.Errorf("failed to get document: %v", err)
	}

	if id.Valid {
		idVal := int(id.Int64)
		item.ID = &idVal
	}
	if nNumber.Valid {
		nVal := int(nNumber.Int64)
		item.NNumber = &nVal
	}
	if title.Valid {
		item.Title = title.String
	}
	if description.Valid && description.String != "" {
		item.Description = &description.String
	}
	if typeCode.Valid {
		item.TypeCode = typeCode.String
	}
	if typeName.Valid {
		item.TypeName = typeName.String
	}
	if subTypeCode.Valid && subTypeCode.String != "" {
		item.SubTypeCode = &subTypeCode.String
	}
	if subTypeName.Valid && subTypeName.String != "" {
		item.SubTypeName = &subTypeName.String
	}
	if meetingID.Valid {
		mv := int(meetingID.Int64)
		item.MeetingID = &mv
	}
	if projectID.Valid {
		pv := int(projectID.Int64)
		item.ProjectID = &pv
	}
	if ballotID.Valid {
		bv := int(ballotID.Int64)
		item.BallotID = &bv
	}
	if committeeID.Valid {
		bv := int(committeeID.Int64)
		item.CommitteeID = &bv
	}
	if replaces.Valid && replaces.String != "" {
		item.Replaces = &replaces.String
	}
	if expectedAction.Valid && expectedAction.String != "" {
		item.ExpectedAction = &expectedAction.String
	}
	if expectedDate.Valid && expectedDate.String != "" {
		item.ExpectedDate = &expectedDate.String
	}
	if status.Valid && status.String != "" {
		item.Status = &status.String
	}
	if filePath.Valid && filePath.String != "" {
		item.FilePath = &filePath.String
	}
	if mimeType.Valid && mimeType.String != "" {
		item.MimeType = &mimeType.String
	}
	if modifiedAt.Valid && modifiedAt.String != "" {
		item.ModifiedAt = &modifiedAt.String
	}
	if createdAt.Valid && createdAt.String != "" {
		item.CreatedAt = &createdAt.String
	}
	if createdBy.Valid {
		cb := int(createdBy.Int64)
		item.CreatedBy = &cb
	}
	if version.Valid {
		v := version.Float64
		item.Version = &v
	}
	if createdByName.Valid && createdByName.String != "" {
		item.CreatedByName = &createdByName.String
	}
	if updatedByName.Valid && updatedByName.String != "" {
		item.UpdatedByName = &updatedByName.String
	}
	if meetingName.Valid && meetingName.String != "" {
		item.MeetingName = &meetingName.String
	}
	if ballotName.Valid && ballotName.String != "" {
		item.BallotName = &ballotName.String
	}
	if projectName.Valid && projectName.String != "" {
		item.ProjectName = &projectName.String
	}
	return &item, nil
}

// UpsertDocument creates or updates a document and logs the action
func UpsertDocument(conn *sql.DB, req models.DocumentItem, userID, roleID int) (*models.DocumentItem, error) {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction for UpsertDocument: %v", err)
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Determine if this is create or update
	isUpdate := req.ID != nil && *req.ID > 0

	// Normalize fields
	title := strings.TrimSpace(req.Title)
	typeCode := strings.TrimSpace(req.TypeCode)
	typeName := strings.TrimSpace(req.TypeName)

	if title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if typeCode == "" {
		return nil, fmt.Errorf("typeCode is required")
	}
	if typeName == "" {
		return nil, fmt.Errorf("typeName is required")
	}

	var status string
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		status = strings.TrimSpace(*req.Status)
	} else {
		status = "Draft"
	}

	var description *string
	if req.Description != nil && strings.TrimSpace(*req.Description) != "" {
		d := strings.TrimSpace(*req.Description)
		description = &d
	}

	var subtypeCode, subtypeName *string
	if req.SubTypeCode != nil && strings.TrimSpace(*req.SubTypeCode) != "" {
		s := strings.TrimSpace(*req.SubTypeCode)
		subtypeCode = &s
	}
	if req.SubTypeName != nil && strings.TrimSpace(*req.SubTypeName) != "" {
		s := strings.TrimSpace(*req.SubTypeName)
		subtypeName = &s
	}

	var replaces *string
	if req.Replaces != nil && strings.TrimSpace(*req.Replaces) != "" {
		r := strings.TrimSpace(*req.Replaces)
		replaces = &r
	}

	var expectedAction *string
	if req.ExpectedAction != nil && strings.TrimSpace(*req.ExpectedAction) != "" {
		ea := strings.TrimSpace(*req.ExpectedAction)
		expectedAction = &ea
	}

	var expectedDate *string
	if req.ExpectedDate != nil && strings.TrimSpace(*req.ExpectedDate) != "" {
		ed := strings.TrimSpace(*req.ExpectedDate)
		expectedDate = &ed
	}

	var filePath *string
	if req.FilePath != nil && strings.TrimSpace(*req.FilePath) != "" {
		fp := strings.TrimSpace(*req.FilePath)
		filePath = &fp
	}

	var mimeType *string
	if req.MimeType != nil && strings.TrimSpace(*req.MimeType) != "" {
		mt := strings.TrimSpace(*req.MimeType)
		mimeType = &mt
	}

	// Upsert logic
	if isUpdate {
		updateQuery := `
			UPDATE i_documents
			SET
				n_number = ?,
				title = ?,
				description = ?,
				type_code = ?,
				type_name = ?,
				subtype_code = ?,
				subtype_name = ?,
				meeting_id = ?,
				project_id = ?,
				ballot_id = ?,
				committee_id = ?,
				replaces = ?,
				expected_action = ?,
				expected_date = ?,
				status = ?,
				file_path = ?,
				mime_type = ?,
				updated_by = ?,
				version = version + 0.1,
				updated_by_role_id = ?
			WHERE id = ?
		`

		var nNumber interface{}
		if req.NNumber != nil {
			nNumber = *req.NNumber
		} else {
			nNumber = nil
		}

		var meetingID interface{}
		if req.MeetingID != nil && *req.MeetingID > 0 {
			meetingID = *req.MeetingID
		} else {
			meetingID = nil
		}

		var projectID interface{}
		if req.ProjectID != nil && *req.ProjectID > 0 {
			projectID = *req.ProjectID
		} else {
			projectID = nil
		}

		var ballotID interface{}
		if req.BallotID != nil && *req.BallotID > 0 {
			ballotID = *req.BallotID
		} else {
			ballotID = nil
		}
		var committeeID interface{}
		if req.CommitteeID != nil && *req.CommitteeID > 0 {
			committeeID = *req.CommitteeID
		} else {
			committeeID = nil
		}

		_, err = tx.Exec(updateQuery,
			nNumber,
			title,
			description,
			typeCode,
			typeName,
			subtypeCode,
			subtypeName,
			meetingID,
			projectID,
			ballotID,
			committeeID,
			replaces,
			expectedAction,
			expectedDate,
			status,
			filePath,
			mimeType,
			userID,
			roleID,
			*req.ID,
		)
		if err != nil {
			log.Error("Failed to update document: %v", err)
			return nil, fmt.Errorf("failed to update document: %v", err)
		}

		// Log EDIT action
		if err := logDocumentAction(tx, *req.ID, "EDIT", nil, userID, roleID); err != nil {
			return nil, err
		}
	} else {
		insertQuery := `
			INSERT INTO i_documents (
				n_number,
				title,
				description,
				type_code,
				type_name,
				subtype_code,
				subtype_name,
				meeting_id,
				project_id,
				ballot_id,
				committee_id,
				replaces,
				expected_action,
				expected_date,
				status,
				file_path,
				mime_type,
				created_by,
				updated_by,
				version,
				created_by_role_id
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`

		var nNumber int
		if req.NNumber != nil && *req.NNumber > 0 {
			nNumber = *req.NNumber
		} else {
			if req.TypeCode != "FOLDER" && req.TypeCode != "FILE" && req.TypeCode != "" {
				nNumber, err = GetMaxNNumber(conn)
				if err != nil {
					return nil, fmt.Errorf("failed to get max n_number: %v", err)
				}

				nNumber = nNumber + 1
			} else {
				nNumber = 0
			}
		}

		var meetingID interface{}
		if req.MeetingID != nil && *req.MeetingID > 0 {
			meetingID = *req.MeetingID
		} else {
			meetingID = nil
		}

		var projectID interface{}
		if req.ProjectID != nil && *req.ProjectID > 0 {
			projectID = *req.ProjectID
		} else {
			projectID = nil
		}

		var ballotID interface{}
		if req.BallotID != nil && *req.BallotID > 0 {
			ballotID = *req.BallotID
		} else {
			ballotID = nil
		}

		var committeeID interface{}
		if req.CommitteeID != nil && *req.CommitteeID > 0 {
			committeeID = *req.CommitteeID
		} else {
			committeeID = nil
		}

		res, err := tx.Exec(insertQuery,
			nNumber,
			title,
			description,
			typeCode,
			typeName,
			subtypeCode,
			subtypeName,
			meetingID,
			projectID,
			ballotID,
			committeeID,
			replaces,
			expectedAction,
			expectedDate,
			status,
			filePath,
			mimeType,
			userID,
			userID,
			0.1,
			roleID,
		)
		if err != nil {
			log.Error("Failed to insert document: %v", err)
			return nil, fmt.Errorf("failed to insert document: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get last insert ID for document: %v", err)
			return nil, fmt.Errorf("failed to get last insert ID: %v", err)
		}

		newID := int(lastID)

		// Log CREATE action
		if err := logDocumentAction(tx, newID, "CREATE", nil, userID, roleID); err != nil {
			return nil, err
		}

		req.ID = &newID
	}

	if err := tx.Commit(); err != nil {
		log.Error("Failed to commit UpsertDocument transaction: %v", err)
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Return the latest document data
	if req.ID == nil {
		return nil, fmt.Errorf("document ID is nil after upsert")
	}

	return getDocumentByID(conn, *req.ID)
}

// GetDocumentPathGroups returns distinct path prefixes from i_documents.file_path
// Group key: first two path segments (e.g. documents/meeting, documents/resolution, documents/aaaaaa)
func GetDocumentPathGroups(conn *sql.DB) (models.DocumentPathGroupsResponse, error) {
	var resp models.DocumentPathGroupsResponse
	query := `
		SELECT DISTINCT SUBSTRING_INDEX(d.file_path, '/', 2) AS path_group
		FROM i_documents d
		WHERE d.file_path IS NOT NULL
		  AND d.file_path LIKE 'documents/%'
		  AND d.status <> 'Deleted'
		  AND SUBSTRING_INDEX(d.file_path, '/', 2) <> ''
		ORDER BY path_group
	`
	rows, err := conn.Query(query)
	if err != nil {
		log.Error("Failed to query document path groups: %v", err)
		return resp, fmt.Errorf("failed to query document path groups: %v", err)
	}
	defer rows.Close()
	var groups []string
	for rows.Next() {
		var pathGroup string
		if err := rows.Scan(&pathGroup); err != nil {
			log.Error("Failed to scan path group: %v", err)
			continue
		}
		if pathGroup != "" {
			groups = append(groups, pathGroup)
		}
	}
	resp.Data = groups
	return resp, nil
}

// GetMaxNNumber retrieves the maximum n_number from i_documents with optional filters
func GetMaxNNumber(conn *sql.DB) (int, error) {
	var builder strings.Builder
	var args []interface{}

	builder.WriteString(`
		SELECT COALESCE(MAX(n_number), 0) AS max_n_number
		FROM i_documents
		WHERE status <> 'Deleted'
	`)

	query := builder.String()

	var maxNNumber int
	err := conn.QueryRow(query, args...).Scan(&maxNNumber)
	if err != nil {
		if err == sql.ErrNoRows {
			// No documents found, return 0
			return 0, nil
		}
		log.Error("Failed to get max n_number: %v", err)
		return 0, fmt.Errorf("failed to get max n_number: %v", err)
	}

	return maxNNumber, nil
}

// getRoleNameByRoleID maps role ID to role name
func getRoleNameByRoleID(roleID int) string {
	switch roleID {
	case 1:
		return "ผู้ดูแลระบบ"
	case 2:
		return "ผก."
	case 3:
		return "เจ้าหน้าที่"
	case 4:
		return "ผอ."
	case 5:
		return "เจ้าหน้าที่"
	case 6:
		return "ผู้ประกอบการ"
	default:
		return ""
	}
}

// GetDocumentLogs retrieves all logs for a specific document
func GetDocumentLogs(conn *sql.DB, documentID int) (models.DocumentLogListResponse, error) {
	var resp models.DocumentLogListResponse

	query := `
		SELECT
			idl.id,
			idl.document_id,
			idl.action,
			idl.action_detail,
			DATE_FORMAT(idl.action_at, '%Y-%m-%d %H:%i:%s') AS action_at,
			idl.action_by,
			idl.action_by_role_id,
			CASE
				WHEN idl.action_by_role_id = 6 THEN COALESCE(su.name, su.contact_name, '')
				ELSE COALESCE(CONCAT(COALESCE(ur.reg_fname, ''), ' ', COALESCE(ur.reg_lname, '')), '')
			END AS action_by_name
		FROM i_documents_log idl
		LEFT JOIN sso_users su ON idl.action_by_role_id = 6 AND idl.action_by = su.id
		LEFT JOIN user_register ur ON idl.action_by_role_id != 6 AND idl.action_by = ur.runrecno
		WHERE idl.document_id = ?
		ORDER BY idl.action_at DESC, idl.id DESC
	`

	rows, err := conn.Query(query, documentID)
	if err != nil {
		log.Error("Failed to query document logs: %v", err)
		return resp, fmt.Errorf("failed to query document logs: %v", err)
	}
	defer rows.Close()

	var logs []models.DocumentLog
	for rows.Next() {
		var docLog models.DocumentLog
		var id, actionBy sql.NullInt64
		var actionDetail sql.NullString
		var actionAt sql.NullString
		var actionByRoleID sql.NullInt64
		var actionByName sql.NullString
		err := rows.Scan(
			&id,
			&docLog.DocumentID,
			&docLog.Action,
			&actionDetail,
			&actionAt,
			&actionBy,
			&actionByRoleID,
			&actionByName,
		)
		if err != nil {
			log.Error("Failed to scan document log: %v", err)
			return resp, fmt.Errorf("failed to scan document log: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			docLog.ID = &idVal
		}
		if actionDetail.Valid && actionDetail.String != "" {
			docLog.ActionDetail = &actionDetail.String
		}
		if actionAt.Valid && actionAt.String != "" {
			docLog.ActionAt = &actionAt.String
		}
		if actionBy.Valid {
			ab := int(actionBy.Int64)
			docLog.ActionBy = &ab
		}
		if actionByRoleID.Valid {
			ab := int(actionByRoleID.Int64)
			docLog.ActionByRoleID = &ab
			// Map role ID to role name
			roleName := getRoleNameByRoleID(ab)
			if roleName != "" {
				docLog.ActionByRoleName = &roleName
			}
		}
		if actionByName.Valid && actionByName.String != "" {
			docLog.ActionByName = &actionByName.String
		}

		logs = append(logs, docLog)
	}

	if err = rows.Err(); err != nil {
		log.Error("Error iterating document log rows: %v", err)
		return resp, fmt.Errorf("error iterating document log rows: %v", err)
	}

	resp.Data = logs
	return resp, nil
}
