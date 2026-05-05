package repository

import (
	"database/sql"
	"encoding/json"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
)

// UpsertProject creates or updates a project
func UpsertProject(conn *sql.DB, req models.Project, userAuth int) (*models.Project, error) {
	if req.NameThai == "" {
		return nil, fmt.Errorf("nameThai is required")
	}
	if req.StartYear == "" {
		return nil, fmt.Errorf("startYear is required")
	}

	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction: %v", err)
		return nil, fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	var projectID int
	var action string
	var oldData *models.Project

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		action = "UPDATE"

		// Get old data for logging
		oldData, _ = GetProjectByID(conn, *req.ID)

		query := `UPDATE i_projects SET
			name_thai = ?, name_english = ?, start_year = ?,
			owner_id = ?, owner_name = ?, owner_group_id = ?, owner_group_name = ?,
			writer_type_id = ?, writer_type_name = ?,
			expected_completion_month = ?, expected_completion_year = ?,
			enforcement_status_id = ?, enforcement_status_name = ?,
			proposal_type_id = ?, proposal_type_name = ?,
			method_type_id = ?, method_type_name = ?,
			std_type_id = ?, std_type_name = ?,
			product_group_id = ?, product_group_name = ?,
			nss_sector_id = ?, nss_sector_name = ?,
			nss_subject_id = ?, nss_subject_name = ?,
			iso_deliverable_id = ?, iso_deliverable_name = ?, iso_deliverable_other = ?,
			tis_reprint_no = ?,
			committee_id = ?, committee_name = ?,
			sub_committee_id = ?, sub_committee_name = ?,
			sdos_id = ?, sdos_name = ?,
			bcg_reason = ?, remarks = ?,
			stage_code = ?, stage_ui_msg = ?,
			updated_by = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND deleted_at IS NULL`

		_, err = tx.Exec(query,
			req.NameThai, req.NameEnglish, req.StartYear,
			req.OwnerID, req.OwnerName, req.OwnerGroupID, req.OwnerGroupName,
			req.WriterTypeID, req.WriterTypeName,
			req.ExpectedCompletionMonth, req.ExpectedCompletionYear,
			req.EnforcementStatusID, req.EnforcementStatusName,
			req.ProposalTypeID, req.ProposalTypeName,
			req.MethodTypeID, req.MethodTypeName,
			req.StdTypeID, req.StdTypeName,
			req.ProductGroupID, req.ProductGroupName,
			req.NSSSectorID, req.NSSSectorName,
			req.NSSSubjectID, req.NSSSubjectName,
			req.ISODeliverableID, req.ISODeliverableName, req.ISODeliverableOther,
			req.TISReprintNo,
			req.CommitteeID, req.CommitteeName,
			req.SubCommitteeID, req.SubCommitteeName,
			req.SDOSID, req.SDOSName,
			req.BCGReason, req.Remarks,
			req.StageCode, req.StageUIMsg,
			userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update project: %v", err)
			return nil, fmt.Errorf("failed to update project: %v", err)
		}
		projectID = *req.ID
	} else {
		// INSERT
		action = "CREATE"

		stageCode := "00.00"
		if req.StageCode != nil {
			stageCode = *req.StageCode
		}
		stageUIMsg := "สร้างร่าง"
		if req.StageUIMsg != nil {
			stageUIMsg = *req.StageUIMsg
		}

		query := `INSERT INTO i_projects (
			name_thai, name_english, start_year,
			owner_id, owner_name, owner_group_id, owner_group_name,
			writer_type_id, writer_type_name,
			expected_completion_month, expected_completion_year,
			enforcement_status_id, enforcement_status_name,
			proposal_type_id, proposal_type_name,
			method_type_id, method_type_name,
			std_type_id, std_type_name,
			product_group_id, product_group_name,
			nss_sector_id, nss_sector_name,
			nss_subject_id, nss_subject_name,
			iso_deliverable_id, iso_deliverable_name, iso_deliverable_other,
			tis_reprint_no,
			committee_id, committee_name,
			sub_committee_id, sub_committee_name,
			sdos_id, sdos_name,
			bcg_reason, remarks,
			stage_code, stage_ui_msg,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := tx.Exec(query,
			req.NameThai, req.NameEnglish, req.StartYear,
			req.OwnerID, req.OwnerName, req.OwnerGroupID, req.OwnerGroupName,
			req.WriterTypeID, req.WriterTypeName,
			req.ExpectedCompletionMonth, req.ExpectedCompletionYear,
			req.EnforcementStatusID, req.EnforcementStatusName,
			req.ProposalTypeID, req.ProposalTypeName,
			req.MethodTypeID, req.MethodTypeName,
			req.StdTypeID, req.StdTypeName,
			req.ProductGroupID, req.ProductGroupName,
			req.NSSSectorID, req.NSSSectorName,
			req.NSSSubjectID, req.NSSSubjectName,
			req.ISODeliverableID, req.ISODeliverableName, req.ISODeliverableOther,
			req.TISReprintNo,
			req.CommitteeID, req.CommitteeName,
			req.SubCommitteeID, req.SubCommitteeName,
			req.SDOSID, req.SDOSName,
			req.BCGReason, req.Remarks,
			stageCode, stageUIMsg,
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert project: %v", err)
			log.Error("INSERT query: %s", query)
			return nil, fmt.Errorf("failed to insert project: %v", err)
		}

		id, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get last insert id: %v", err)
			return nil, fmt.Errorf("failed to get last insert id: %v", err)
		}
		projectID = int(id)
	}

	// Handle junction tables for arrays
	// Delete existing relationships
	_, err = tx.Exec("DELETE FROM i_projects_product_policy WHERE project_id = ?", projectID)
	if err != nil {
		log.Error("Failed to delete product policy groups: %v", err)
		return nil, fmt.Errorf("failed to delete product policy groups: %v", err)
	}

	_, err = tx.Exec("DELETE FROM i_projects_product_bcg WHERE project_id = ?", projectID)
	if err != nil {
		log.Error("Failed to delete product BCGs: %v", err)
		return nil, fmt.Errorf("failed to delete product BCGs: %v", err)
	}

	_, err = tx.Exec("DELETE FROM i_projects_iso_ics WHERE project_id = ?", projectID)
	if err != nil {
		log.Error("Failed to delete ISO ICS: %v", err)
		return nil, fmt.Errorf("failed to delete ISO ICS: %v", err)
	}

	// Insert product policy groups
	if len(req.ProductPolicyGroupIDs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO i_projects_product_policy (project_id, product_policy_id) VALUES (?, ?)")
		if err != nil {
			log.Error("Failed to prepare product policy insert: %v", err)
			return nil, fmt.Errorf("failed to prepare product policy insert: %v", err)
		}
		defer stmt.Close()

		for _, policyID := range req.ProductPolicyGroupIDs {
			_, err = stmt.Exec(projectID, policyID)
			if err != nil {
				log.Error("Failed to insert product policy: %v", err)
				return nil, fmt.Errorf("failed to insert product policy: %v", err)
			}
		}
	}

	// Insert product BCGs
	if len(req.ProductBCGIDs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO i_projects_product_bcg (project_id, product_bcg_id) VALUES (?, ?)")
		if err != nil {
			log.Error("Failed to prepare product BCG insert: %v", err)
			return nil, fmt.Errorf("failed to prepare product BCG insert: %v", err)
		}
		defer stmt.Close()

		for _, bcgID := range req.ProductBCGIDs {
			_, err = stmt.Exec(projectID, bcgID)
			if err != nil {
				log.Error("Failed to insert product BCG: %v", err)
				return nil, fmt.Errorf("failed to insert product BCG: %v", err)
			}
		}
	}

	// Insert ISO ICS
	if len(req.ISOICSIDs) > 0 {
		stmt, err := tx.Prepare("INSERT INTO i_projects_iso_ics (project_id, iso_ics_identifier) VALUES (?, ?)")
		if err != nil {
			log.Error("Failed to prepare ISO ICS insert: %v", err)
			return nil, fmt.Errorf("failed to prepare ISO ICS insert: %v", err)
		}
		defer stmt.Close()

		for _, icsID := range req.ISOICSIDs {
			_, err = stmt.Exec(projectID, icsID)
			if err != nil {
				log.Error("Failed to insert ISO ICS: %v", err)
				return nil, fmt.Errorf("failed to insert ISO ICS: %v", err)
			}
		}
	}

	// Create log entry
	stageCode := "00.00"
	if req.StageCode != nil {
		stageCode = *req.StageCode
	}
	stageDescription := "สร้างร่าง"
	if req.StageUIMsg != nil {
		stageDescription = *req.StageUIMsg
	}

	var oldValueJSON, newValueJSON string
	if oldData != nil {
		oldDataJSON, _ := json.Marshal(oldData)
		oldValueJSON = string(oldDataJSON)
	}
	newDataJSON, _ := json.Marshal(req)
	newValueJSON = string(newDataJSON)

	logQuery := `INSERT INTO i_projects_logs (
		project_id, stage_code, stage_description, stage_date, stage_status,
		action, field_name, old_value, new_value, changed_by, remarks
	) VALUES (?, ?, ?, CURDATE(), 'Finished', ?, NULL, ?, ?, ?, ?)`

	_, err = tx.Exec(logQuery,
		projectID, stageCode, stageDescription,
		action, oldValueJSON, newValueJSON, userAuth, req.Remarks,
	)
	if err != nil {
		log.Error("Failed to insert project log: %v", err)
		return nil, fmt.Errorf("failed to insert project log: %v", err)
	}

	if err = tx.Commit(); err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get the created/updated project
	return GetProjectByID(conn, projectID)
}

// GetProjectsList retrieves a list of projects with search and pagination
func GetProjectsList(conn *sql.DB, params models.ProjectSearchParams) (*models.ProjectListResponse, error) {
	if conn == nil {
		return nil, fmt.Errorf("database connection is nil")
	}

	// Check connection health
	if err := conn.Ping(); err != nil {
		log.Error("Database connection ping failed: %v", err)
		return nil, fmt.Errorf("database connection error: %v", err)
	}

	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		id, name_thai, name_english, start_year,
		owner_id, owner_name, owner_group_id, owner_group_name,
		writer_type_id, writer_type_name,
		expected_completion_month, expected_completion_year,
		enforcement_status_id, enforcement_status_name,
		proposal_type_id, proposal_type_name,
		method_type_id, method_type_name,
		std_type_id, std_type_name,
		product_group_id, product_group_name,
		nss_sector_id, nss_sector_name,
		nss_subject_id, nss_subject_name,
		iso_deliverable_id, iso_deliverable_name, iso_deliverable_other,
		tis_reprint_no,
		committee_id, committee_name,
		sub_committee_id, sub_committee_name,
		sdos_id, sdos_name,
		bcg_reason, remarks,
		stage_code, stage_ui_msg,
		created_by, created_at, updated_by, updated_at, deleted_at
	FROM i_projects
	WHERE deleted_at IS NULL`

	if params.Search != nil && *params.Search != "" {
		conditions = append(conditions, "(name_thai LIKE ? OR name_english LIKE ?)")
		args = append(args, "%"+*params.Search+"%", "%"+*params.Search+"%")
	}

	if params.StartYear != nil && *params.StartYear != "" {
		conditions = append(conditions, "start_year = ?")
		args = append(args, *params.StartYear)
	}

	if params.StageCode != nil && *params.StageCode != "" {
		conditions = append(conditions, "stage_code = ?")
		args = append(args, *params.StageCode)
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY created_at DESC"

	// Count total
	var countQueryBuilder strings.Builder
	countQueryBuilder.WriteString(`SELECT COUNT(*) FROM i_projects WHERE deleted_at IS NULL`)
	if len(conditions) > 0 {
		countQueryBuilder.WriteString(" AND " + strings.Join(conditions, " AND "))
	}

	var total int
	err := conn.QueryRow(countQueryBuilder.String(), args...).Scan(&total)
	if err != nil {
		if err == sql.ErrNoRows {
			total = 0
		} else {
			log.Error("Failed to count projects: %v", err)
			return nil, fmt.Errorf("failed to count projects: %v", err)
		}
	}

	// Apply pagination
	page := 1
	limit := 10
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
		log.Error("Failed to query projects: %v", err)
		return nil, fmt.Errorf("failed to query projects: %v", err)
	}
	defer rows.Close()

	var projects []models.Project
	for rows.Next() {
		var p models.Project
		var nameEnglish, ownerName, ownerGroupName, writerTypeName sql.NullString
		var ownerID, ownerGroupID, writerTypeID sql.NullInt64
		var expectedCompletionMonth, expectedCompletionYear sql.NullString
		var enforcementStatusID, proposalTypeID, methodTypeID, stdTypeID sql.NullInt64
		var enforcementStatusName, proposalTypeName, methodTypeName, stdTypeName sql.NullString
		var productGroupID sql.NullInt64
		var productGroupName sql.NullString
		var nssSectorID, nssSubjectID sql.NullInt64
		var nssSectorName, nssSubjectName sql.NullString
		var isoDeliverableID sql.NullInt64
		var isoDeliverableName, isoDeliverableOther sql.NullString
		var tisReprintNo sql.NullString
		var committeeID, subCommitteeID sql.NullInt64
		var committeeName, subCommitteeName sql.NullString
		var sdosID sql.NullInt64
		var sdosName sql.NullString
		var bcgReason, remarks sql.NullString
		var stageCode, stageUIMsg sql.NullString
		var createdBy, updatedBy sql.NullInt64
		var createdAt, updatedAt, deletedAt sql.NullTime

		err := rows.Scan(
			&p.ID, &p.NameThai, &nameEnglish, &p.StartYear,
			&ownerID, &ownerName, &ownerGroupID, &ownerGroupName,
			&writerTypeID, &writerTypeName,
			&expectedCompletionMonth, &expectedCompletionYear,
			&enforcementStatusID, &enforcementStatusName,
			&proposalTypeID, &proposalTypeName,
			&methodTypeID, &methodTypeName,
			&stdTypeID, &stdTypeName,
			&productGroupID, &productGroupName,
			&nssSectorID, &nssSectorName,
			&nssSubjectID, &nssSubjectName,
			&isoDeliverableID, &isoDeliverableName, &isoDeliverableOther,
			&tisReprintNo,
			&committeeID, &committeeName,
			&subCommitteeID, &subCommitteeName,
			&sdosID, &sdosName,
			&bcgReason, &remarks,
			&stageCode, &stageUIMsg,
			&createdBy, &createdAt, &updatedBy, &updatedAt, &deletedAt,
		)
		if err != nil {
			log.Error("Failed to scan project: %v", err)
			return nil, fmt.Errorf("failed to scan project: %v", err)
		}

		if nameEnglish.Valid {
			p.NameEnglish = &nameEnglish.String
		}
		if ownerID.Valid {
			id := int(ownerID.Int64)
			p.OwnerID = &id
		}
		if ownerName.Valid {
			p.OwnerName = &ownerName.String
		}
		if ownerGroupID.Valid {
			id := int(ownerGroupID.Int64)
			p.OwnerGroupID = &id
		}
		if ownerGroupName.Valid {
			p.OwnerGroupName = &ownerGroupName.String
		}
		if writerTypeID.Valid {
			id := int(writerTypeID.Int64)
			p.WriterTypeID = &id
		}
		if writerTypeName.Valid {
			p.WriterTypeName = &writerTypeName.String
		}
		if expectedCompletionMonth.Valid {
			p.ExpectedCompletionMonth = &expectedCompletionMonth.String
		}
		if expectedCompletionYear.Valid {
			p.ExpectedCompletionYear = &expectedCompletionYear.String
		}
		if enforcementStatusID.Valid {
			id := int(enforcementStatusID.Int64)
			p.EnforcementStatusID = &id
		}
		if enforcementStatusName.Valid {
			p.EnforcementStatusName = &enforcementStatusName.String
		}
		if proposalTypeID.Valid {
			id := int(proposalTypeID.Int64)
			p.ProposalTypeID = &id
		}
		if proposalTypeName.Valid {
			p.ProposalTypeName = &proposalTypeName.String
		}
		if methodTypeID.Valid {
			id := int(methodTypeID.Int64)
			p.MethodTypeID = &id
		}
		if methodTypeName.Valid {
			p.MethodTypeName = &methodTypeName.String
		}
		if stdTypeID.Valid {
			id := int(stdTypeID.Int64)
			p.StdTypeID = &id
		}
		if stdTypeName.Valid {
			p.StdTypeName = &stdTypeName.String
		}
		if productGroupID.Valid {
			id := int(productGroupID.Int64)
			p.ProductGroupID = &id
		}
		if productGroupName.Valid {
			p.ProductGroupName = &productGroupName.String
		}
		if nssSectorID.Valid {
			id := int(nssSectorID.Int64)
			p.NSSSectorID = &id
		}
		if nssSectorName.Valid {
			p.NSSSectorName = &nssSectorName.String
		}
		if nssSubjectID.Valid {
			id := int(nssSubjectID.Int64)
			p.NSSSubjectID = &id
		}
		if nssSubjectName.Valid {
			p.NSSSubjectName = &nssSubjectName.String
		}
		if isoDeliverableID.Valid {
			id := int(isoDeliverableID.Int64)
			p.ISODeliverableID = &id
		}
		if isoDeliverableName.Valid {
			p.ISODeliverableName = &isoDeliverableName.String
		}
		if isoDeliverableOther.Valid {
			p.ISODeliverableOther = &isoDeliverableOther.String
		}
		if tisReprintNo.Valid {
			p.TISReprintNo = &tisReprintNo.String
		}
		if committeeID.Valid {
			id := int(committeeID.Int64)
			p.CommitteeID = &id
		}
		if committeeName.Valid {
			p.CommitteeName = &committeeName.String
		}
		if subCommitteeID.Valid {
			id := int(subCommitteeID.Int64)
			p.SubCommitteeID = &id
		}
		if subCommitteeName.Valid {
			p.SubCommitteeName = &subCommitteeName.String
		}
		if sdosID.Valid {
			id := int(sdosID.Int64)
			p.SDOSID = &id
		}
		if sdosName.Valid {
			p.SDOSName = &sdosName.String
		}
		if bcgReason.Valid {
			p.BCGReason = &bcgReason.String
		}
		if remarks.Valid {
			p.Remarks = &remarks.String
		}
		if stageCode.Valid {
			p.StageCode = &stageCode.String
		}
		if stageUIMsg.Valid {
			p.StageUIMsg = &stageUIMsg.String
		}
		if createdBy.Valid {
			id := int(createdBy.Int64)
			p.CreatedBy = &id
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			p.CreatedAt = &val
		}
		if updatedBy.Valid {
			id := int(updatedBy.Int64)
			p.UpdatedBy = &id
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			p.UpdatedAt = &val
		}
		if deletedAt.Valid {
			val := deletedAt.Time.Format("2006-01-02 15:04:05")
			p.DeletedAt = &val
		}

		projects = append(projects, p)
	}

	// Load array fields from junction tables for each project
	for i := range projects {
		if projects[i].ID == nil {
			continue
		}
		projectID := *projects[i].ID

		// Product Policy Groups
		policyRows, err := conn.Query(`
			SELECT pp.product_policy_id, mp.product_policy_title
			FROM i_projects_product_policy pp
			LEFT JOIN i_master_product_policy mp ON pp.product_policy_id = mp.product_policy_id
			WHERE pp.project_id = ?
			ORDER BY pp.product_policy_id
		`, projectID)
		if err == nil {
			var policyIDs []int
			var policyNames []string
			for policyRows.Next() {
				var policyID int
				var policyName sql.NullString
				if err := policyRows.Scan(&policyID, &policyName); err == nil {
					policyIDs = append(policyIDs, policyID)
					if policyName.Valid {
						policyNames = append(policyNames, policyName.String)
					}
				}
			}
			policyRows.Close()
			projects[i].ProductPolicyGroupIDs = policyIDs
			projects[i].ProductPolicyGroupNames = policyNames
		}

		// Product BCGs
		bcgRows, err := conn.Query(`
			SELECT pb.product_bcg_id, mb.product_bcg_full
			FROM i_projects_product_bcg pb
			LEFT JOIN i_master_product_bcg mb ON pb.product_bcg_id = mb.product_bcg_id
			WHERE pb.project_id = ?
			ORDER BY pb.product_bcg_id
		`, projectID)
		if err == nil {
			var bcgIDs []int
			var bcgNames []string
			for bcgRows.Next() {
				var bcgID int
				var bcgName sql.NullString
				if err := bcgRows.Scan(&bcgID, &bcgName); err == nil {
					bcgIDs = append(bcgIDs, bcgID)
					if bcgName.Valid {
						bcgNames = append(bcgNames, bcgName.String)
					}
				}
			}
			bcgRows.Close()
			projects[i].ProductBCGIDs = bcgIDs
			projects[i].ProductBCGNames = bcgNames
		}

		// ISO ICS
		icsRows, err := conn.Query(`
			SELECT 
					pi.iso_ics_identifier,
					COALESCE(mi.titleEn, mi.titleFr, '') AS name
				FROM i_projects_iso_ics pi
				LEFT JOIN i_master_iso_ics mi
					ON pi.iso_ics_identifier COLLATE utf8mb4_0900_ai_ci = mi.identifier
				WHERE pi.project_id = ? 
				ORDER BY pi.iso_ics_identifier;
		`, projectID)
		if err == nil {
			var icsIDs []string
			var icsNames []string
			for icsRows.Next() {
				var icsID string
				var icsName sql.NullString
				if err := icsRows.Scan(&icsID, &icsName); err == nil {
					icsIDs = append(icsIDs, icsID)
					if icsName.Valid {
						icsNames = append(icsNames, icsName.String)
					}
				}
			}
			icsRows.Close()
			projects[i].ISOICSIDs = icsIDs
			projects[i].ISOICSNames = icsNames
		}
	}

	pageVal := page
	limitVal := limit
	return &models.ProjectListResponse{
		Data:  projects,
		Total: &total,
		Page:  &pageVal,
		Limit: &limitVal,
	}, nil
}

// GetProjectByID retrieves a single project by ID
func GetProjectByID(conn *sql.DB, id int) (*models.Project, error) {
	query := `SELECT 
		id, name_thai, name_english, start_year,
		owner_id, owner_name, owner_group_id, owner_group_name,
		writer_type_id, writer_type_name,
		expected_completion_month, expected_completion_year,
		enforcement_status_id, enforcement_status_name,
		proposal_type_id, proposal_type_name,
		method_type_id, method_type_name,
		std_type_id, std_type_name,
		product_group_id, product_group_name,
		nss_sector_id, nss_sector_name,
		nss_subject_id, nss_subject_name,
		iso_deliverable_id, iso_deliverable_name, iso_deliverable_other,
		tis_reprint_no,
		committee_id, committee_name,
		sub_committee_id, sub_committee_name,
		sdos_id, sdos_name,
		bcg_reason, remarks,
		stage_code, stage_ui_msg,
		created_by, created_at, updated_by, updated_at, deleted_at
	FROM i_projects
	WHERE id = ? AND deleted_at IS NULL`

	var p models.Project
	var nameEnglish, ownerName, ownerGroupName, writerTypeName sql.NullString
	var ownerID, ownerGroupID, writerTypeID sql.NullInt64
	var expectedCompletionMonth, expectedCompletionYear sql.NullString
	var enforcementStatusID, proposalTypeID, methodTypeID, stdTypeID sql.NullInt64
	var enforcementStatusName, proposalTypeName, methodTypeName, stdTypeName sql.NullString
	var productGroupID sql.NullInt64
	var productGroupName sql.NullString
	var nssSectorID, nssSubjectID sql.NullInt64
	var nssSectorName, nssSubjectName sql.NullString
	var isoDeliverableID sql.NullInt64
	var isoDeliverableName, isoDeliverableOther sql.NullString
	var tisReprintNo sql.NullString
	var committeeID, subCommitteeID sql.NullInt64
	var committeeName, subCommitteeName sql.NullString
	var sdosID sql.NullInt64
	var sdosName sql.NullString
	var bcgReason, remarks sql.NullString
	var stageCode, stageUIMsg sql.NullString
	var createdBy, updatedBy sql.NullInt64
	var createdAt, updatedAt, deletedAt sql.NullTime

	err := conn.QueryRow(query, id).Scan(
		&p.ID, &p.NameThai, &nameEnglish, &p.StartYear,
		&ownerID, &ownerName, &ownerGroupID, &ownerGroupName,
		&writerTypeID, &writerTypeName,
		&expectedCompletionMonth, &expectedCompletionYear,
		&enforcementStatusID, &enforcementStatusName,
		&proposalTypeID, &proposalTypeName,
		&methodTypeID, &methodTypeName,
		&stdTypeID, &stdTypeName,
		&productGroupID, &productGroupName,
		&nssSectorID, &nssSectorName,
		&nssSubjectID, &nssSubjectName,
		&isoDeliverableID, &isoDeliverableName, &isoDeliverableOther,
		&tisReprintNo,
		&committeeID, &committeeName,
		&subCommitteeID, &subCommitteeName,
		&sdosID, &sdosName,
		&bcgReason, &remarks,
		&stageCode, &stageUIMsg,
		&createdBy, &createdAt, &updatedBy, &updatedAt, &deletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("project not found")
		}
		log.Error("Failed to get project: %v", err)
		return nil, fmt.Errorf("failed to get project: %v", err)
	}

	// Map nullable fields
	if nameEnglish.Valid {
		p.NameEnglish = &nameEnglish.String
	}
	if ownerID.Valid {
		id := int(ownerID.Int64)
		p.OwnerID = &id
	}
	if ownerName.Valid {
		p.OwnerName = &ownerName.String
	}
	if ownerGroupID.Valid {
		id := int(ownerGroupID.Int64)
		p.OwnerGroupID = &id
	}
	if ownerGroupName.Valid {
		p.OwnerGroupName = &ownerGroupName.String
	}
	if writerTypeID.Valid {
		id := int(writerTypeID.Int64)
		p.WriterTypeID = &id
	}
	if writerTypeName.Valid {
		p.WriterTypeName = &writerTypeName.String
	}
	if expectedCompletionMonth.Valid {
		p.ExpectedCompletionMonth = &expectedCompletionMonth.String
	}
	if expectedCompletionYear.Valid {
		p.ExpectedCompletionYear = &expectedCompletionYear.String
	}
	if enforcementStatusID.Valid {
		id := int(enforcementStatusID.Int64)
		p.EnforcementStatusID = &id
	}
	if enforcementStatusName.Valid {
		p.EnforcementStatusName = &enforcementStatusName.String
	}
	if proposalTypeID.Valid {
		id := int(proposalTypeID.Int64)
		p.ProposalTypeID = &id
	}
	if proposalTypeName.Valid {
		p.ProposalTypeName = &proposalTypeName.String
	}
	if methodTypeID.Valid {
		id := int(methodTypeID.Int64)
		p.MethodTypeID = &id
	}
	if methodTypeName.Valid {
		p.MethodTypeName = &methodTypeName.String
	}
	if stdTypeID.Valid {
		id := int(stdTypeID.Int64)
		p.StdTypeID = &id
	}
	if stdTypeName.Valid {
		p.StdTypeName = &stdTypeName.String
	}
	if productGroupID.Valid {
		id := int(productGroupID.Int64)
		p.ProductGroupID = &id
	}
	if productGroupName.Valid {
		p.ProductGroupName = &productGroupName.String
	}
	if nssSectorID.Valid {
		id := int(nssSectorID.Int64)
		p.NSSSectorID = &id
	}
	if nssSectorName.Valid {
		p.NSSSectorName = &nssSectorName.String
	}
	if nssSubjectID.Valid {
		id := int(nssSubjectID.Int64)
		p.NSSSubjectID = &id
	}
	if nssSubjectName.Valid {
		p.NSSSubjectName = &nssSubjectName.String
	}
	if isoDeliverableID.Valid {
		id := int(isoDeliverableID.Int64)
		p.ISODeliverableID = &id
	}
	if isoDeliverableName.Valid {
		p.ISODeliverableName = &isoDeliverableName.String
	}
	if isoDeliverableOther.Valid {
		p.ISODeliverableOther = &isoDeliverableOther.String
	}
	if tisReprintNo.Valid {
		p.TISReprintNo = &tisReprintNo.String
	}
	if committeeID.Valid {
		id := int(committeeID.Int64)
		p.CommitteeID = &id
	}
	if committeeName.Valid {
		p.CommitteeName = &committeeName.String
	}
	if subCommitteeID.Valid {
		id := int(subCommitteeID.Int64)
		p.SubCommitteeID = &id
	}
	if subCommitteeName.Valid {
		p.SubCommitteeName = &subCommitteeName.String
	}
	if sdosID.Valid {
		id := int(sdosID.Int64)
		p.SDOSID = &id
	}
	if sdosName.Valid {
		p.SDOSName = &sdosName.String
	}
	if bcgReason.Valid {
		p.BCGReason = &bcgReason.String
	}
	if remarks.Valid {
		p.Remarks = &remarks.String
	}
	if stageCode.Valid {
		p.StageCode = &stageCode.String
	}
	if stageUIMsg.Valid {
		p.StageUIMsg = &stageUIMsg.String
	}
	if createdBy.Valid {
		id := int(createdBy.Int64)
		p.CreatedBy = &id
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		p.CreatedAt = &val
	}
	if updatedBy.Valid {
		id := int(updatedBy.Int64)
		p.UpdatedBy = &id
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		p.UpdatedAt = &val
	}
	if deletedAt.Valid {
		val := deletedAt.Time.Format("2006-01-02 15:04:05")
		p.DeletedAt = &val
	}

	// Load array fields from junction tables
	// Product Policy Groups
	policyRows, err := conn.Query(`
		SELECT pp.product_policy_id, mp.product_policy_title
		FROM i_projects_product_policy pp
		LEFT JOIN i_master_product_policy mp ON pp.product_policy_id = mp.product_policy_id
		WHERE pp.project_id = ?
		ORDER BY pp.product_policy_id
	`, id)
	if err == nil {
		defer policyRows.Close()
		var policyIDs []int
		var policyNames []string
		for policyRows.Next() {
			var policyID int
			var policyName sql.NullString
			if err := policyRows.Scan(&policyID, &policyName); err == nil {
				policyIDs = append(policyIDs, policyID)
				if policyName.Valid {
					policyNames = append(policyNames, policyName.String)
				}
			}
		}
		p.ProductPolicyGroupIDs = policyIDs
		p.ProductPolicyGroupNames = policyNames
	}

	// Product BCGs
	bcgRows, err := conn.Query(`
		SELECT pb.product_bcg_id, mb.product_bcg_full
		FROM i_projects_product_bcg pb
		LEFT JOIN i_master_product_bcg mb ON pb.product_bcg_id = mb.product_bcg_id
		WHERE pb.project_id = ?
		ORDER BY pb.product_bcg_id
	`, id)
	if err == nil {
		defer bcgRows.Close()
		var bcgIDs []int
		var bcgNames []string
		for bcgRows.Next() {
			var bcgID int
			var bcgName sql.NullString
			if err := bcgRows.Scan(&bcgID, &bcgName); err == nil {
				bcgIDs = append(bcgIDs, bcgID)
				if bcgName.Valid {
					bcgNames = append(bcgNames, bcgName.String)
				}
			}
		}
		p.ProductBCGIDs = bcgIDs
		p.ProductBCGNames = bcgNames
	}

	// ISO ICS
	icsRows, err := conn.Query(`
		SELECT 
			pi.iso_ics_identifier,
			COALESCE(mi.titleEn, mi.titleFr, '') AS name
		FROM i_projects_iso_ics pi
		LEFT JOIN i_master_iso_ics mi ON pi.iso_ics_identifier = mi.identifier
		WHERE pi.project_id = ?
		ORDER BY pi.iso_ics_identifier
	`, id)
	if err == nil {
		defer icsRows.Close()
		var icsIDs []string
		var icsNames []string
		for icsRows.Next() {
			var icsID string
			var icsName sql.NullString
			if err := icsRows.Scan(&icsID, &icsName); err == nil {
				icsIDs = append(icsIDs, icsID)
				if icsName.Valid {
					icsNames = append(icsNames, icsName.String)
				}
			}
		}
		p.ISOICSIDs = icsIDs
		p.ISOICSNames = icsNames
	}

	return &p, nil
}

// DeleteProject soft deletes a project
func DeleteProject(conn *sql.DB, id int, userAuth int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Get project data before deletion
	project, err := GetProjectByID(conn, id)
	if err != nil {
		return err
	}

	// Soft delete
	query := `UPDATE i_projects SET deleted_at = CURRENT_TIMESTAMP, updated_by = ? WHERE id = ? AND deleted_at IS NULL`
	_, err = tx.Exec(query, userAuth, id)
	if err != nil {
		log.Error("Failed to delete project: %v", err)
		return fmt.Errorf("failed to delete project: %v", err)
	}

	// Create log entry
	stageCode := "99.99"
	if project.StageCode != nil {
		stageCode = *project.StageCode
	}
	stageDescription := "ลบโครงการ"

	projectJSON, _ := json.Marshal(project)
	oldValueJSON := string(projectJSON)

	logQuery := `INSERT INTO i_projects_logs (
		project_id, stage_code, stage_description, stage_date, stage_status,
		action, field_name, old_value, new_value, changed_by, remarks
	) VALUES (?, ?, ?, CURDATE(), 'Finished', 'DELETE', NULL, ?, NULL, ?, ?)`

	remarks := "ลบโครงการ"
	_, err = tx.Exec(logQuery,
		id, stageCode, stageDescription,
		oldValueJSON, userAuth, remarks,
	)
	if err != nil {
		log.Error("Failed to insert project log: %v", err)
		return fmt.Errorf("failed to insert project log: %v", err)
	}

	if err = tx.Commit(); err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

// GetProjectLogs retrieves all logs for a specific project
func GetProjectLogs(conn *sql.DB, projectID int) ([]models.ProjectLog, error) {
	query := `SELECT 
		id, project_id, stage_code, stage_description, stage_date, stage_status,
		action, field_name, old_value, new_value, changed_by, changed_at, remarks
	FROM i_projects_logs
	WHERE project_id = ?
	ORDER BY changed_at ASC`

	rows, err := conn.Query(query, projectID)
	if err != nil {
		log.Error("Failed to query project logs: %v", err)
		return nil, fmt.Errorf("failed to query project logs: %v", err)
	}
	defer rows.Close()

	var logs []models.ProjectLog
	for rows.Next() {
		var projectLog models.ProjectLog
		var id, changedBy sql.NullInt64
		var stageDescription, stageDate, stageStatus, action, fieldName sql.NullString
		var oldValue, newValue, remarks sql.NullString
		var changedAt sql.NullTime

		err := rows.Scan(
			&id, &projectLog.ProjectID, &projectLog.StageCode, &stageDescription, &stageDate, &stageStatus,
			&action, &fieldName, &oldValue, &newValue, &changedBy, &changedAt, &remarks,
		)
		if err != nil {
			log.Error("Failed to scan project log: %v", err)
			return nil, fmt.Errorf("failed to scan project log: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			projectLog.ID = &idVal
		}
		if stageDescription.Valid {
			projectLog.StageDescription = &stageDescription.String
		}
		if stageDate.Valid {
			// Format date as "DD Month YYYY" (Thai format)
			dateStr := stageDate.String
			projectLog.StageDate = &dateStr
		}
		if stageStatus.Valid {
			projectLog.StageStatus = &stageStatus.String
		}
		if action.Valid {
			projectLog.Action = &action.String
		}
		if fieldName.Valid {
			projectLog.FieldName = &fieldName.String
		}
		if oldValue.Valid {
			projectLog.OldValue = &oldValue.String
		}
		if newValue.Valid {
			projectLog.NewValue = &newValue.String
		}
		if changedBy.Valid {
			changedByVal := int(changedBy.Int64)
			projectLog.ChangedBy = &changedByVal
		}
		if changedAt.Valid {
			changedAtStr := changedAt.Time.Format("2006-01-02 15:04:05")
			projectLog.ChangedAt = &changedAtStr
		}
		if remarks.Valid {
			projectLog.Remarks = &remarks.String
		}

		logs = append(logs, projectLog)
	}

	if err = rows.Err(); err != nil {
		log.Error("Error iterating project log rows: %v", err)
		return nil, fmt.Errorf("error iterating project log rows: %v", err)
	}

	return logs, nil
}

// UpsertProjectLog creates or updates a project log entry
func UpsertProjectLog(conn *sql.DB, projectID int, req models.ProjectLog, userAuth int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Validate required fields
	if req.StageCode == "" {
		return fmt.Errorf("stageCode is required")
	}

	// Set defaults
	stageDescription := ""
	if req.StageDescription != nil {
		stageDescription = *req.StageDescription
	}
	stageStatus := "Pending"
	if req.StageStatus != nil {
		stageStatus = *req.StageStatus
	}
	action := "STAGE_CHANGE"
	if req.Action != nil {
		action = *req.Action
	}

	// Parse stage date and build query
	var query string
	var args []interface{}

	if req.StageDate != nil && *req.StageDate != "" {
		query = `INSERT INTO i_projects_logs (
			project_id, stage_code, stage_description, stage_date, stage_status,
			action, field_name, old_value, new_value, changed_by, remarks
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			stage_description = VALUES(stage_description),
			stage_date = VALUES(stage_date),
			stage_status = VALUES(stage_status),
			action = VALUES(action),
			field_name = VALUES(field_name),
			old_value = VALUES(old_value),
			new_value = VALUES(new_value),
			changed_by = VALUES(changed_by),
			remarks = VALUES(remarks),
			changed_at = CURRENT_TIMESTAMP`
		args = []interface{}{
			projectID, req.StageCode, stageDescription, *req.StageDate, stageStatus,
			action, req.FieldName, req.OldValue, req.NewValue, userAuth, req.Remarks,
		}
	} else {

		// Use CURDATE() if no date provided
		query = `INSERT INTO i_projects_logs (
			project_id, stage_code, stage_description, stage_date, stage_status,
			action, field_name, old_value, new_value, changed_by, remarks
		) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			stage_description = VALUES(stage_description),
			stage_date = VALUES(stage_date),
			stage_status = VALUES(stage_status),
			action = VALUES(action),
			field_name = VALUES(field_name),
			old_value = VALUES(old_value),
			new_value = VALUES(new_value),
			changed_by = VALUES(changed_by),
			remarks = VALUES(remarks),
			changed_at = CURRENT_TIMESTAMP`
		args = []interface{}{
			projectID, req.StageCode, stageDescription, stageStatus,
			action, req.FieldName, req.OldValue, req.NewValue, userAuth, req.Remarks,
		}
	}

	_, err = tx.Exec(query, args...)
	if err != nil {
		log.Error("Failed to upsert project log: %v", err)
		return fmt.Errorf("failed to upsert project log: %v", err)
	}

	if err = tx.Commit(); err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}

// UpdateProjectStage updates the stage code and stage UI message for a project
func UpdateProjectStage(conn *sql.DB, projectID int, req models.UpdateProjectStageRequest, userAuth int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Update stage code and stage UI message
	stageUIMsgVal := ""
	if req.StageUIMsg != nil {
		stageUIMsgVal = *req.StageUIMsg
	}

	updateStrArgs := []interface{}{req.StageCode, stageUIMsgVal, userAuth}

	query := strings.Builder{}
	query.WriteString(`UPDATE i_projects 
	SET stage_code = ?, stage_ui_msg = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP `)

	if req.GMMOSummaryRemarks != nil && *req.GMMOSummaryRemarks != "" {
		query.WriteString(", gmmo_summary_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.GMMOSummaryRemarks)
	}

	if req.SaveDraftRemarks != nil && *req.SaveDraftRemarks != "" {
		query.WriteString(", save_draft_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.SaveDraftRemarks)
	}

	if req.SaveDraftFilePath != nil && *req.SaveDraftFilePath != "" {
		query.WriteString(", save_draft_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.SaveDraftFilePath)
	}

	if req.DraftCirculationSummaryRemarks != nil && *req.DraftCirculationSummaryRemarks != "" {
		query.WriteString(", draft_circulation_summary_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.DraftCirculationSummaryRemarks)
	}
	if req.DraftCirculationSummarySubCommetteeRemarks != nil && *req.DraftCirculationSummarySubCommetteeRemarks != "" {
		query.WriteString(", draft_circulation_summary_subcommittee_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.DraftCirculationSummarySubCommetteeRemarks)
	}
	if req.DraftCirculationSummaryCommetteeRemarks != nil && *req.DraftCirculationSummaryCommetteeRemarks != "" {
		query.WriteString(", draft_circulation_summary_committee_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.DraftCirculationSummaryCommetteeRemarks)
	}

	if req.SubCommitteeSummaryFilePathWord != nil && *req.SubCommitteeSummaryFilePathWord != "" {
		query.WriteString(", sub_committee_summary_file_path_word = ?")
		updateStrArgs = append(updateStrArgs, *req.SubCommitteeSummaryFilePathWord)
	}

	if req.SubCommitteeSummaryFilePathPDF != nil && *req.SubCommitteeSummaryFilePathPDF != "" {
		query.WriteString(", sub_committee_summary_file_path_pdf = ?")
		updateStrArgs = append(updateStrArgs, *req.SubCommitteeSummaryFilePathPDF)
	}

	if req.SubCommitteeSummary != nil && *req.SubCommitteeSummary != "" {
		query.WriteString(", sub_committee_summary = ?")
		updateStrArgs = append(updateStrArgs, *req.SubCommitteeSummary)
	}

	if req.SubCommitteeSummaryRemarks != nil && *req.SubCommitteeSummaryRemarks != "" {
		query.WriteString(", sub_committee_summary_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.SubCommitteeSummaryRemarks)
	}

	if req.CommitteeSummaryFilePathWord != nil && *req.CommitteeSummaryFilePathWord != "" {
		query.WriteString(", committee_summary_file_path_word = ?")
		updateStrArgs = append(updateStrArgs, *req.CommitteeSummaryFilePathWord)
	}

	if req.CommitteeSummaryFilePathPDF != nil && *req.CommitteeSummaryFilePathPDF != "" {
		query.WriteString(", committee_summary_file_path_pdf = ?")
		updateStrArgs = append(updateStrArgs, *req.CommitteeSummaryFilePathPDF)
	}

	if req.CommitteeSummary != nil && *req.CommitteeSummary != "" {
		query.WriteString(", committee_summary = ?")
		updateStrArgs = append(updateStrArgs, *req.CommitteeSummary)
	}

	if req.CommitteeSummaryRemarks != nil && *req.CommitteeSummaryRemarks != "" {
		query.WriteString(", committee_summary_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.CommitteeSummaryRemarks)
	}

	if req.TisNumber != nil && *req.TisNumber != "" {
		query.WriteString(", tis_number = ?")
		updateStrArgs = append(updateStrArgs, *req.TisNumber)
	}

	if req.TisNumberIssueDate != nil && *req.TisNumberIssueDate != "" {
		query.WriteString(", tis_number_issue_date = ?")
		updateStrArgs = append(updateStrArgs, *req.TisNumberIssueDate)
	}

	if req.InitialDraftDate != nil && *req.InitialDraftDate != "" {
		query.WriteString(", initial_draft_date = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftDate)
	}

	if req.InitialDraftFilePath != nil && *req.InitialDraftFilePath != "" {
		query.WriteString(", initial_draft_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftFilePath)
	}

	if req.InitialDraftMeetingReportFilePath != nil && *req.InitialDraftMeetingReportFilePath != "" {
		query.WriteString(", initial_draft_meeting_report_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftMeetingReportFilePath)
	}

	if req.InitialDraftQuestionnaireSummaryFilePath != nil && *req.InitialDraftQuestionnaireSummaryFilePath != "" {
		query.WriteString(", initial_draft_questionnaire_summary_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftQuestionnaireSummaryFilePath)
	}

	if req.InitialDraftPowerpointFilePath != nil && *req.InitialDraftPowerpointFilePath != "" {
		query.WriteString(", initial_draft_powerpoint_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftPowerpointFilePath)
	}

	if req.InitialDraftDocumentFilePath != nil && *req.InitialDraftDocumentFilePath != "" {
		query.WriteString(", initial_draft_document_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftDocumentFilePath)
	}

	if req.InitialDraftRemarks != nil && *req.InitialDraftRemarks != "" {
		query.WriteString(", initial_draft_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.InitialDraftRemarks)
	}

	if req.ApproveInitialDraftBy != nil {
		query.WriteString(", approve_initial_draft_by = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveInitialDraftBy)
	}

	if req.ApproveInitialDraftAction != nil && *req.ApproveInitialDraftAction != "" {
		query.WriteString(", approve_initial_draft_action = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveInitialDraftAction)
	}

	if req.ApproveInitialDraftRemarks != nil && *req.ApproveInitialDraftRemarks != "" {
		query.WriteString(", approve_initial_draft_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveInitialDraftRemarks)
	}

	if req.ApproveProjectLv1By != nil {
		query.WriteString(", approve_project_lv1_by = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveProjectLv1By)
	}

	if req.ApproveProjectLv1Action != nil && *req.ApproveProjectLv1Action != "" {
		query.WriteString(", approve_project_lv1_action = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveProjectLv1Action)
	}

	if req.ApproveProjectLv1Remarks != nil && *req.ApproveProjectLv1Remarks != "" {
		query.WriteString(", approve_project_lv1_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveProjectLv1Remarks)
	}

	if req.ApproveProjectLv2By != nil {
		query.WriteString(", approve_project_lv2_by = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveProjectLv2By)
	}

	if req.ApproveProjectLv2Action != nil && *req.ApproveProjectLv2Action != "" {
		query.WriteString(", approve_project_lv2_action = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveProjectLv2Action)
	}

	if req.ApproveProjectLv2Remarks != nil && *req.ApproveProjectLv2Remarks != "" {
		query.WriteString(", approve_project_lv2_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.ApproveProjectLv2Remarks)
	}

	if req.FinalDraftSummaryRemarks != nil && *req.FinalDraftSummaryRemarks != "" {
		query.WriteString(", final_draft_summary_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.FinalDraftSummaryRemarks)
	}

	if req.StandardAnnouncementSendToTisDate != nil && *req.StandardAnnouncementSendToTisDate != "" {
		query.WriteString(", standard_announcement_send_to_tis_date = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementSendToTisDate)
	}

	if req.StandardAnnouncementTisSignedDate != nil && *req.StandardAnnouncementTisSignedDate != "" {
		query.WriteString(", standard_announcement_tis_signed_date = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementTisSignedDate)
	}

	if req.StandardAnnouncementRwoSignedDate != nil && *req.StandardAnnouncementRwoSignedDate != "" {
		query.WriteString(", standard_announcement_rwo_signed_date = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementRwoSignedDate)
	}

	if req.StandardAnnouncementSendToRoyalGazetteDate != nil && *req.StandardAnnouncementSendToRoyalGazetteDate != "" {
		query.WriteString(", standard_announcement_send_to_royal_gazette_date = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementSendToRoyalGazetteDate)
	}

	if req.StandardAnnouncementRoyalGazettePublishDate != nil && *req.StandardAnnouncementRoyalGazettePublishDate != "" {
		query.WriteString(", standard_announcement_royal_gazette_publish_date = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementRoyalGazettePublishDate)
	}

	if req.StandardAnnouncementEffectiveDate != nil && *req.StandardAnnouncementEffectiveDate != "" {
		query.WriteString(", standard_announcement_effective_date = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementEffectiveDate)
	}

	if req.StandardAnnouncementFinalDraftFilePath != nil && *req.StandardAnnouncementFinalDraftFilePath != "" {
		query.WriteString(", standard_announcement_final_draft_file_path = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementFinalDraftFilePath)
	}

	if req.StandardAnnouncementRemarks != nil && *req.StandardAnnouncementRemarks != "" {
		query.WriteString(", standard_announcement_remarks = ?")
		updateStrArgs = append(updateStrArgs, *req.StandardAnnouncementRemarks)
	}

	query.WriteString(` WHERE id = ? AND deleted_at IS NULL`)
	updateStrArgs = append(updateStrArgs, projectID)

	_, err = tx.Exec(query.String(), updateStrArgs...)
	if err != nil {
		log.Error("Failed to update project stage: %v", err)
		return fmt.Errorf("failed to update project stage: %v", err)
	}

	if err = tx.Commit(); err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get the updated project
	return nil
}

// CheckTISNumber checks if a TIS number already exists in tb3_tis table
func CheckTISNumber(conn *sql.DB, tisNumber string) (bool, error) {
	if tisNumber == "" {
		return false, nil
	}

	var count int
	query := `SELECT COUNT(*) FROM tb3_tis WHERE tb3_Tisno = ?`
	err := conn.QueryRow(query, tisNumber).Scan(&count)
	if err != nil {
		log.Error("Failed to check TIS number: %v", err)
		return false, fmt.Errorf("failed to check TIS number: %v", err)
	}

	return count > 0, nil
}

// SaveStandardAnnouncement saves standard announcement data to both i_projects and tb3_tis tables
func SaveStandardAnnouncement(conn *sql.DB, req models.SaveStandardAnnouncementRequest, userAuth int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Check if project has TIS number stored in i_projects
	// We need to query tis_number field from i_projects
	var tisNumber sql.NullString
	err = tx.QueryRow("SELECT tis_number FROM i_projects WHERE id = ? AND deleted_at IS NULL", req.ProjectID).Scan(&tisNumber)
	if err != nil {
		log.Error("Failed to get TIS number from project: %v", err)
		return fmt.Errorf("failed to get TIS number from project: %v", err)
	}

	if !tisNumber.Valid || tisNumber.String == "" {
		return fmt.Errorf("project does not have TIS number assigned")
	}

	// Update or insert tb3_tis
	// Check if record exists by tb3_Tisno (which should match the TIS number)
	var tb3ID int
	var exists bool
	err = tx.QueryRow("SELECT tb3_TisAutono FROM tb3_tis WHERE tb3_Tisno = ?", tisNumber.String).Scan(&tb3ID)
	if err != nil && err != sql.ErrNoRows {
		log.Error("Failed to check tb3_tis existence: %v", err)
		return fmt.Errorf("failed to check tb3_tis existence: %v", err)
	}
	exists = err == nil

	if exists {
		// UPDATE tb3_tis
		updateTb3Query := strings.Builder{}
		updateTb3Args := []interface{}{}

		updateTb3Query.WriteString(`UPDATE tb3_tis SET tb3_TisThainame = ?, tb3_TisEngname = ?`)

		if req.RoyalGazettePublishDate != nil && *req.RoyalGazettePublishDate != "" {
			updateTb3Query.WriteString(", tb3_TisGazdate = ?")
			updateTb3Args = append(updateTb3Args, *req.RoyalGazettePublishDate)
		}

		if req.EffectiveDate != nil && *req.EffectiveDate != "" {
			updateTb3Query.WriteString(", tb3_enforce = ?")
			updateTb3Args = append(updateTb3Args, *req.EffectiveDate)
		}

		if req.SystemBy != nil && *req.SystemBy != "" {
			updateTb3Query.WriteString(", system_by = ?")
			updateTb3Args = append(updateTb3Args, *req.SystemBy)
		}

		updateTb3Query.WriteString(" WHERE tb3_Tisno = ?")

		updateTb3Args = append([]interface{}{req.NameThai, req.NameEnglish}, updateTb3Args...)
		updateTb3Args = append(updateTb3Args, tisNumber.String)

		_, err = tx.Exec(updateTb3Query.String(), updateTb3Args...)
		if err != nil {
			log.Error("Failed to update tb3_tis: %v", err)
			return fmt.Errorf("failed to update tb3_tis: %v", err)
		}
	} else {
		// INSERT tb3_tis (should not happen if TIS number is assigned properly, but handle it)
		insertTb3Query := `INSERT INTO tb3_tis (
			tb3_Tisno, tb3_TisThainame, tb3_TisEngname, 
			tb3_TisGazdate, tb3_enforce, system_by,id_unit
		) VALUES (?, ?, ?, ?, ?, ?, ?)`

		var royalGazetteDate interface{}
		var effectiveDate interface{}
		if req.RoyalGazettePublishDate != nil && *req.RoyalGazettePublishDate != "" {
			royalGazetteDate = *req.RoyalGazettePublishDate
		}
		if req.EffectiveDate != nil && *req.EffectiveDate != "" {
			effectiveDate = *req.EffectiveDate
		}

		systemBy := ""
		if req.SystemBy != nil {
			systemBy = *req.SystemBy
		}

		_, err = tx.Exec(insertTb3Query,
			tisNumber.String, req.NameThai, req.NameEnglish,
			royalGazetteDate, effectiveDate, systemBy,
			"",
		)
		if err != nil {
			log.Error("Failed to insert tb3_tis: %v", err)
			return fmt.Errorf("failed to insert tb3_tis: %v", err)
		}
	}

	if err = tx.Commit(); err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get updated project
	return nil
}

// GetTISStandardsForReview retrieves TIS standards from tb3_tis table for review
func GetTISStandardsForReview(conn *sql.DB, search *string) (*models.TISStandardForReviewListResponse, error) {
	var queryBuilder strings.Builder
	var args []interface{}

	queryBuilder.WriteString(`
		SELECT 
			tb3_TisAutono,
			tb3_Tisno,
			tb3_TisThainame,
			tb3_TisEngname,
			tb3_enforce
		FROM tb3_tis
		WHERE 1=1
	`)

	if search != nil && *search != "" {
		queryBuilder.WriteString(` AND (
			tb3_Tisno LIKE ? OR 
			tb3_TisThainame LIKE ? OR 
			tb3_TisEngname LIKE ?
		)`)
		searchPattern := "%" + *search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
	}

	queryBuilder.WriteString(` ORDER BY tb3_Tisno ASC`)

	rows, err := conn.Query(queryBuilder.String(), args...)
	if err != nil {
		log.Error("Failed to query TIS standards for review: %v", err)
		return nil, fmt.Errorf("failed to query TIS standards for review: %v", err)
	}
	defer rows.Close()

	var standards []models.TISStandardForReview
	for rows.Next() {
		var std models.TISStandardForReview
		var nameEnglish sql.NullString
		var effectiveDate sql.NullTime

		err := rows.Scan(
			&std.ID,
			&std.TISNumber,
			&std.NameThai,
			&nameEnglish,
			&effectiveDate,
		)
		if err != nil {
			log.Error("Failed to scan TIS standard: %v", err)
			return nil, fmt.Errorf("failed to scan TIS standard: %v", err)
		}

		if nameEnglish.Valid && nameEnglish.String != "" {
			std.NameEnglish = &nameEnglish.String
		}

		if effectiveDate.Valid {
			dateStr := effectiveDate.Time.Format("2006-01-02")
			std.EffectiveDate = &dateStr
		}

		standards = append(standards, std)
	}

	if err = rows.Err(); err != nil {
		log.Error("Error iterating TIS standards: %v", err)
		return nil, fmt.Errorf("error iterating TIS standards: %v", err)
	}

	return &models.TISStandardForReviewListResponse{
		Data:  standards,
		Total: len(standards),
	}, nil
}

// CreateReviewFromTIS creates a new project review from TIS number
func CreateReviewFromTIS(conn *sql.DB, req models.ProjectReview, userAuth int) (*models.ProjectReview, error) {
	if req.TISNumber == "" {
		return nil, fmt.Errorf("tisNumber is required")
	}
	if req.NameThai == "" {
		return nil, fmt.Errorf("nameThai is required")
	}

	// Set default stage code if not provided
	stageCode := "90.00"
	if req.StageCode != nil && *req.StageCode != "" {
		stageCode = *req.StageCode
	}

	stageUIMsg := ""
	if req.StageUIMsg != nil {
		stageUIMsg = *req.StageUIMsg
	}

	query := `INSERT INTO i_projects_review (
		tis_number, name_thai, name_english,
		enforcement_status_id, enforcement_status_name,
		owner_group_id, owner_group_name,
		stage_code, stage_ui_msg,
		effective_date, review_start_date, review_end_date,
		remarks, created_by, updated_by
	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	res, err := conn.Exec(query,
		req.TISNumber, req.NameThai, req.NameEnglish,
		req.EnforcementStatusID, req.EnforcementStatusName,
		req.OwnerGroupID, req.OwnerGroupName,
		stageCode, stageUIMsg,
		req.EffectiveDate, req.ReviewStartDate, req.ReviewEndDate,
		req.Remarks, userAuth, userAuth,
	)
	if err != nil {
		log.Error("Failed to create project review: %v", err)
		return nil, fmt.Errorf("failed to create project review: %v", err)
	}

	lastID, err := res.LastInsertId()
	if err != nil {
		log.Error("Failed to get project review ID: %v", err)
		return nil, fmt.Errorf("failed to get project review ID: %v", err)
	}

	// Get the created review
	reviewID := int(lastID)
	review, err := GetProjectReviewByID(conn, reviewID)
	if err != nil {
		return nil, err
	}

	return review, nil
}

// GetProjectReviewByID retrieves a project review by ID
func GetProjectReviewByID(conn *sql.DB, id int) (*models.ProjectReview, error) {
	query := `SELECT 
		id, tis_number, name_thai, name_english,
		enforcement_status_id, enforcement_status_name,
		owner_group_id, owner_group_name,
		stage_code, stage_ui_msg,
		effective_date, review_start_date, review_end_date,
		remarks,
		created_at, updated_at, created_by, updated_by
	FROM i_projects_review
	WHERE id = ?`

	var r models.ProjectReview
	var nameEnglish, enforcementStatusName, ownerGroupName sql.NullString
	var enforcementStatusID sql.NullInt64
	var stageCode, stageUIMsg sql.NullString
	var effectiveDate, reviewStartDate, reviewEndDate sql.NullTime
	var remarks sql.NullString
	var createdAt, updatedAt sql.NullTime
	var createdBy, updatedBy sql.NullInt64

	err := conn.QueryRow(query, id).Scan(
		&r.ID,
		&r.TISNumber,
		&r.NameThai,
		&nameEnglish,
		&enforcementStatusID,
		&enforcementStatusName,
		&r.OwnerGroupID,
		&ownerGroupName,
		&stageCode,
		&stageUIMsg,
		&effectiveDate,
		&reviewStartDate,
		&reviewEndDate,
		&remarks,
		&createdAt,
		&updatedAt,
		&createdBy,
		&updatedBy,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("project review not found")
		}
		log.Error("Failed to get project review: %v", err)
		return nil, fmt.Errorf("failed to get project review: %v", err)
	}

	if nameEnglish.Valid {
		r.NameEnglish = &nameEnglish.String
	}
	if enforcementStatusID.Valid {
		val := int(enforcementStatusID.Int64)
		r.EnforcementStatusID = &val
	}
	if enforcementStatusName.Valid {
		r.EnforcementStatusName = &enforcementStatusName.String
	}
	if ownerGroupName.Valid {
		r.OwnerGroupName = &ownerGroupName.String
	}
	if stageCode.Valid {
		r.StageCode = &stageCode.String
	}
	if stageUIMsg.Valid {
		r.StageUIMsg = &stageUIMsg.String
	}
	if effectiveDate.Valid {
		dateStr := effectiveDate.Time.Format("2006-01-02")
		r.EffectiveDate = &dateStr
	}
	if reviewStartDate.Valid {
		dateStr := reviewStartDate.Time.Format("2006-01-02")
		r.ReviewStartDate = &dateStr
	}
	if reviewEndDate.Valid {
		dateStr := reviewEndDate.Time.Format("2006-01-02")
		r.ReviewEndDate = &dateStr
	}
	if remarks.Valid {
		r.Remarks = &remarks.String
	}
	if createdAt.Valid {
		createdAtStr := createdAt.Time.Format("2006-01-02 15:04:05")
		r.CreatedAt = &createdAtStr
	}
	if updatedAt.Valid {
		updatedAtStr := updatedAt.Time.Format("2006-01-02 15:04:05")
		r.UpdatedAt = &updatedAtStr
	}
	if createdBy.Valid {
		val := int(createdBy.Int64)
		r.CreatedBy = &val
	}
	if updatedBy.Valid {
		val := int(updatedBy.Int64)
		r.UpdatedBy = &val
	}

	return &r, nil
}

// GetProjectsReview retrieves a list of project reviews with search and pagination
func GetProjectsReview(conn *sql.DB, params models.ProjectReviewSearchParams) (*models.ProjectReviewListResponse, error) {
	if conn == nil {
		return nil, fmt.Errorf("database connection is nil")
	}

	// Check connection health
	if err := conn.Ping(); err != nil {
		log.Error("Database connection ping failed: %v", err)
		return nil, fmt.Errorf("database connection error: %v", err)
	}

	var conditions []string
	var args []interface{}

	// Build WHERE conditions
	if params.Search != nil && *params.Search != "" {
		conditions = append(conditions, `(
			tis_number LIKE ? OR 
			name_thai LIKE ? OR 
			name_english LIKE ?
		)`)
		searchPattern := "%" + *params.Search + "%"
		args = append(args, searchPattern, searchPattern, searchPattern)
	}

	if params.StageCode != nil && *params.StageCode != "" {
		conditions = append(conditions, "stage_code = ?")
		args = append(args, *params.StageCode)
	}

	if params.EnforcementStatus != nil && *params.EnforcementStatus != "" {
		conditions = append(conditions, "enforcement_status_name LIKE ?")
		args = append(args, "%"+*params.EnforcementStatus+"%")
	}

	if params.OwnerGroupID != nil && *params.OwnerGroupID > 0 {
		conditions = append(conditions, "owner_group_id = ?")
		args = append(args, *params.OwnerGroupID)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Pagination
	page := 1
	if params.Page != nil && *params.Page > 0 {
		page = *params.Page
	}
	limit := 20
	if params.Limit != nil && *params.Limit > 0 {
		limit = *params.Limit
	}
	offset := (page - 1) * limit

	// Count total records
	countQuery := `SELECT COUNT(*) FROM i_projects_review ` + whereClause
	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		if err == sql.ErrNoRows {
			total = 0
		} else {
			log.Error("Failed to count project reviews: %v", err)
			return nil, fmt.Errorf("failed to count project reviews: %v", err)
		}
	}

	// Get paginated results
	query := `SELECT 
		id, tis_number, name_thai, name_english,
		enforcement_status_id, enforcement_status_name,
		owner_group_id, owner_group_name,
		stage_code, stage_ui_msg,
		effective_date, review_start_date, review_end_date,
		remarks,
		created_at, updated_at, created_by, updated_by
	FROM i_projects_review
	` + whereClause + `
	ORDER BY created_at DESC
	LIMIT ? OFFSET ?`

	args = append(args, limit, offset)

	rows, err := conn.Query(query, args...)
	if err != nil {
		log.Error("Failed to query project reviews: %v", err)
		return nil, fmt.Errorf("failed to query project reviews: %v", err)
	}
	defer rows.Close()

	var reviews []models.ProjectReview
	for rows.Next() {
		var r models.ProjectReview
		var nameEnglish, enforcementStatusName, ownerGroupName sql.NullString
		var enforcementStatusID sql.NullInt64
		var stageCode, stageUIMsg sql.NullString
		var effectiveDate, reviewStartDate, reviewEndDate sql.NullTime
		var remarks sql.NullString
		var createdAt, updatedAt sql.NullTime
		var createdBy, updatedBy sql.NullInt64

		err := rows.Scan(
			&r.ID,
			&r.TISNumber,
			&r.NameThai,
			&nameEnglish,
			&enforcementStatusID,
			&enforcementStatusName,
			&r.OwnerGroupID,
			&ownerGroupName,
			&stageCode,
			&stageUIMsg,
			&effectiveDate,
			&reviewStartDate,
			&reviewEndDate,
			&remarks,
			&createdAt,
			&updatedAt,
			&createdBy,
			&updatedBy,
		)
		if err != nil {
			log.Error("Failed to scan project review: %v", err)
			return nil, fmt.Errorf("failed to scan project review: %v", err)
		}

		if nameEnglish.Valid {
			r.NameEnglish = &nameEnglish.String
		}
		if enforcementStatusID.Valid {
			val := int(enforcementStatusID.Int64)
			r.EnforcementStatusID = &val
		}
		if enforcementStatusName.Valid {
			r.EnforcementStatusName = &enforcementStatusName.String
		}
		if ownerGroupName.Valid {
			r.OwnerGroupName = &ownerGroupName.String
		}
		if stageCode.Valid {
			r.StageCode = &stageCode.String
		}
		if stageUIMsg.Valid {
			r.StageUIMsg = &stageUIMsg.String
		}
		if effectiveDate.Valid {
			dateStr := effectiveDate.Time.Format("2006-01-02")
			r.EffectiveDate = &dateStr
		}
		if reviewStartDate.Valid {
			dateStr := reviewStartDate.Time.Format("2006-01-02")
			r.ReviewStartDate = &dateStr
		}
		if reviewEndDate.Valid {
			dateStr := reviewEndDate.Time.Format("2006-01-02")
			r.ReviewEndDate = &dateStr
		}
		if remarks.Valid {
			r.Remarks = &remarks.String
		}
		if createdAt.Valid {
			createdAtStr := createdAt.Time.Format("2006-01-02 15:04:05")
			r.CreatedAt = &createdAtStr
		}
		if updatedAt.Valid {
			updatedAtStr := updatedAt.Time.Format("2006-01-02 15:04:05")
			r.UpdatedAt = &updatedAtStr
		}
		if createdBy.Valid {
			val := int(createdBy.Int64)
			r.CreatedBy = &val
		}
		if updatedBy.Valid {
			val := int(updatedBy.Int64)
			r.UpdatedBy = &val
		}

		reviews = append(reviews, r)
	}

	if err = rows.Err(); err != nil {
		log.Error("Error iterating project reviews: %v", err)
		return nil, fmt.Errorf("error iterating project reviews: %v", err)
	}

	pageVal := page
	limitVal := limit
	return &models.ProjectReviewListResponse{
		Data:  reviews,
		Total: &total,
		Page:  &pageVal,
		Limit: &limitVal,
	}, nil
}

// UpdateProjectReview updates a project review by ID
func UpdateProjectReview(conn *sql.DB, reviewID int, req models.ProjectReview, userAuth int) (*models.ProjectReview, error) {
	if reviewID <= 0 {
		return nil, fmt.Errorf("review ID is required")
	}

	// Check if review exists
	var exists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_projects_review WHERE id = ?", reviewID).Scan(&exists)
	if err != nil {
		log.Error("Failed to check review existence: %v", err)
		return nil, fmt.Errorf("failed to check review existence: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("project review not found")
	}

	// Build dynamic UPDATE query
	updateQuery := strings.Builder{}
	updateArgs := []interface{}{userAuth}

	updateQuery.WriteString(`UPDATE i_projects_review SET updated_by = ?, updated_at = CURRENT_TIMESTAMP`)

	if req.TISNumber != "" {
		updateQuery.WriteString(", tis_number = ?")
		updateArgs = append(updateArgs, req.TISNumber)
	}

	if req.NameThai != "" {
		updateQuery.WriteString(", name_thai = ?")
		updateArgs = append(updateArgs, req.NameThai)
	}

	if req.NameEnglish != nil && *req.NameEnglish != "" {
		updateQuery.WriteString(", name_english = ?")
		updateArgs = append(updateArgs, *req.NameEnglish)
	}

	if req.EnforcementStatusID != nil {
		updateQuery.WriteString(", enforcement_status_id = ?")
		updateArgs = append(updateArgs, *req.EnforcementStatusID)
	}

	if req.EnforcementStatusName != nil && *req.EnforcementStatusName != "" {
		updateQuery.WriteString(", enforcement_status_name = ?")
		updateArgs = append(updateArgs, *req.EnforcementStatusName)
	}

	if req.OwnerGroupID > 0 {
		updateQuery.WriteString(", owner_group_id = ?")
		updateArgs = append(updateArgs, req.OwnerGroupID)
	}

	if req.OwnerGroupName != nil && *req.OwnerGroupName != "" {
		updateQuery.WriteString(", owner_group_name = ?")
		updateArgs = append(updateArgs, *req.OwnerGroupName)
	}

	if req.StageCode != nil && *req.StageCode != "" {
		updateQuery.WriteString(", stage_code = ?")
		updateArgs = append(updateArgs, *req.StageCode)
	}

	if req.StageUIMsg != nil && *req.StageUIMsg != "" {
		updateQuery.WriteString(", stage_ui_msg = ?")
		updateArgs = append(updateArgs, *req.StageUIMsg)
	}

	if req.EffectiveDate != nil && *req.EffectiveDate != "" {
		updateQuery.WriteString(", effective_date = ?")
		updateArgs = append(updateArgs, *req.EffectiveDate)
	}

	if req.ReviewStartDate != nil && *req.ReviewStartDate != "" {
		updateQuery.WriteString(", review_start_date = ?")
		updateArgs = append(updateArgs, *req.ReviewStartDate)
	}

	if req.ReviewEndDate != nil && *req.ReviewEndDate != "" {
		updateQuery.WriteString(", review_end_date = ?")
		updateArgs = append(updateArgs, *req.ReviewEndDate)
	}

	if req.Remarks != nil && *req.Remarks != "" {
		updateQuery.WriteString(", remarks = ?")
		updateArgs = append(updateArgs, *req.Remarks)
	}

	if req.ReviewCirculationSummaryRemark != nil && *req.ReviewCirculationSummaryRemark != "" {
		updateQuery.WriteString(", review_circulation_summary_remark = ?")
		updateArgs = append(updateArgs, *req.ReviewCirculationSummaryRemark)
	}

	if req.ReviewCancelSummaryRemark != nil && *req.ReviewCancelSummaryRemark != "" {
		updateQuery.WriteString(", review_cancel_summary_remark = ?")
		updateArgs = append(updateArgs, *req.ReviewCancelSummaryRemark)
	}

	updateQuery.WriteString(" WHERE id = ?")
	updateArgs = append(updateArgs, reviewID)

	_, err = conn.Exec(updateQuery.String(), updateArgs...)
	if err != nil {
		log.Error("Failed to update project review: %v", err)
		return nil, fmt.Errorf("failed to update project review: %v", err)
	}

	// Get the updated review
	return GetProjectReviewByID(conn, reviewID)
}

// GetProjectReviewLogs retrieves all log entries for a project review
func GetProjectReviewLogs(conn *sql.DB, projectReviewID int) ([]models.ProjectReviewLog, error) {
	query := `SELECT 
		id, project_review_id, stage_code, stage_description, stage_date, stage_status,
		remarks, created_at, updated_at, created_by
	FROM i_projects_review_log
	WHERE project_review_id = ?
	ORDER BY created_at ASC`

	rows, err := conn.Query(query, projectReviewID)
	if err != nil {
		log.Error("Failed to query project review logs: %v", err)
		return nil, fmt.Errorf("failed to query project review logs: %v", err)
	}
	defer rows.Close()

	var logs []models.ProjectReviewLog
	for rows.Next() {
		var logEntry models.ProjectReviewLog
		var id, createdBy sql.NullInt64
		var stageDescription, stageDate, stageStatus, remarks sql.NullString
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(
			&id, &logEntry.ProjectReviewID, &logEntry.StageCode,
			&stageDescription, &stageDate, &stageStatus,
			&remarks, &createdAt, &updatedAt, &createdBy,
		)
		if err != nil {
			log.Error("Failed to scan project review log: %v", err)
			return nil, fmt.Errorf("failed to scan project review log: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			logEntry.ID = &idVal
		}
		if stageDescription.Valid {
			logEntry.StageDescription = &stageDescription.String
		}
		if stageDate.Valid {
			dateStr := stageDate.String
			logEntry.StageDate = &dateStr
		}
		if stageStatus.Valid {
			logEntry.StageStatus = &stageStatus.String
		}
		if remarks.Valid {
			logEntry.Remarks = &remarks.String
		}
		if createdAt.Valid {
			createdAtStr := createdAt.Time.Format("2006-01-02 15:04:05")
			logEntry.CreatedAt = &createdAtStr
		}
		if updatedAt.Valid {
			updatedAtStr := updatedAt.Time.Format("2006-01-02 15:04:05")
			logEntry.UpdatedAt = &updatedAtStr
		}
		if createdBy.Valid {
			createdByVal := int(createdBy.Int64)
			logEntry.CreatedBy = &createdByVal
		}

		logs = append(logs, logEntry)
	}

	if err = rows.Err(); err != nil {
		log.Error("Error iterating project review log rows: %v", err)
		return nil, fmt.Errorf("error iterating project review log rows: %v", err)
	}

	return logs, nil
}

// UpsertProjectReviewLog creates or updates a project review log entry
func UpsertProjectReviewLog(conn *sql.DB, projectReviewID int, req models.ProjectReviewLog, userAuth int) error {
	tx, err := conn.Begin()
	if err != nil {
		log.Error("Failed to begin transaction: %v", err)
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// Validate required fields
	if req.StageCode == "" {
		return fmt.Errorf("stageCode is required")
	}

	// Set defaults
	stageDescription := ""
	if req.StageDescription != nil {
		stageDescription = *req.StageDescription
	}

	stageStatus := "Working"
	if req.StageStatus != nil && *req.StageStatus != "" {
		stageStatus = *req.StageStatus
	}

	remarks := ""
	if req.Remarks != nil {
		remarks = *req.Remarks
	}

	// Check if log entry exists (by project_review_id and stage_code)
	var existingID sql.NullInt64
	err = tx.QueryRow(`
		SELECT id FROM i_projects_review_log 
		WHERE project_review_id = ? AND stage_code = ?
	`, projectReviewID, req.StageCode).Scan(&existingID)

	var query string
	var args []interface{}

	if err == nil && existingID.Valid {
		// UPDATE existing log
		if req.StageDate != nil && *req.StageDate != "" {
			query = `UPDATE i_projects_review_log SET
				stage_description = ?, stage_date = ?, stage_status = ?,
				remarks = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?`
			args = []interface{}{stageDescription, *req.StageDate, stageStatus, remarks, existingID.Int64}
		} else {
			query = `UPDATE i_projects_review_log SET
				stage_description = ?, stage_status = ?,
				remarks = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?`
			args = []interface{}{stageDescription, stageStatus, remarks, existingID.Int64}
		}
	} else {
		// INSERT new log
		if req.StageDate != nil && *req.StageDate != "" {
			query = `INSERT INTO i_projects_review_log (
				project_review_id, stage_code, stage_description, stage_date, stage_status,
				remarks, created_by
			) VALUES (?, ?, ?, ?, ?, ?, ?)`
			args = []interface{}{
				projectReviewID, req.StageCode, stageDescription,
				*req.StageDate, stageStatus, remarks, userAuth,
			}
		} else {
			query = `INSERT INTO i_projects_review_log (
				project_review_id, stage_code, stage_description, stage_date, stage_status,
				remarks, created_by
			) VALUES (?, ?, ?, CURDATE(), ?, ?, ?)`
			args = []interface{}{
				projectReviewID, req.StageCode, stageDescription,
				stageStatus, remarks, userAuth,
			}
		}
	}

	_, err = tx.Exec(query, args...)
	if err != nil {
		log.Error("Failed to upsert project review log: %v", err)
		return fmt.Errorf("failed to upsert project review log: %v", err)
	}

	if err = tx.Commit(); err != nil {
		log.Error("Failed to commit transaction: %v", err)
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}
