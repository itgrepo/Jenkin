package repository

import (
	"database/sql"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
	"time"
)

// UpsertMeetingBudget creates or updates a meeting budget
func UpsertMeetingBudget(conn *sql.DB, req models.MeetingBudget, userAuth int) (*models.MeetingBudget, error) {
	if req.FiscalYear == "" {
		return nil, fmt.Errorf("fiscal_year is required")
	}
	if req.DepartmentID <= 0 {
		return nil, fmt.Errorf("department_id is required")
	}

	var budgetID int

	if req.ID != nil && *req.ID > 0 {
		// ---------- UPDATE ----------
		query := `UPDATE i_meeting_budget SET
			fiscal_year = ?,
			department_id = ?,
			sub_department_id = ?,
			amount = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := conn.Exec(query,
			req.FiscalYear, req.DepartmentID, req.SubDepartmentID, req.Amount, userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update meeting budget: %v", err)
			return nil, fmt.Errorf("failed to update meeting budget: %v", err)
		}
		budgetID = *req.ID
	} else {
		// ---------- INSERT ----------
		query := `INSERT INTO i_meeting_budget (
			fiscal_year, department_id, sub_department_id, amount,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.FiscalYear, req.DepartmentID, req.SubDepartmentID, req.Amount,
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert meeting budget: %v", err)
			return nil, fmt.Errorf("failed to insert meeting budget: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get meeting budget ID: %v", err)
			return nil, fmt.Errorf("failed to get meeting budget ID: %v", err)
		}
		budgetID = int(lastID)
	}

	// Get the complete meeting budget record
	budget, err := GetMeetingBudgetByID(conn, budgetID)
	if err != nil {
		log.Error("Failed to get meeting budget after upsert: %v", err)
		return nil, fmt.Errorf("failed to get meeting budget after upsert: %v", err)
	}

	return budget, nil
}

// GetMeetingBudgetByID retrieves a meeting budget by ID
func GetMeetingBudgetByID(conn *sql.DB, id int) (*models.MeetingBudget, error) {
	query := `SELECT 
		mb.id, mb.fiscal_year, mb.department_id, mb.sub_department_id, mb.amount,
		mb.created_at, mb.updated_at,
		d.depart_name,
		sd.sub_departname
	FROM i_meeting_budget mb
	LEFT JOIN department d ON mb.department_id = d.did
	LEFT JOIN sub_department sd ON mb.sub_department_id = sd.sub_id
	WHERE mb.id = ?`

	var budget models.MeetingBudget
	var createdAt, updatedAt sql.NullTime
	var departmentName, subDepartmentName sql.NullString

	err := conn.QueryRow(query, id).Scan(
		&budget.ID, &budget.FiscalYear, &budget.DepartmentID, &budget.SubDepartmentID, &budget.Amount,
		&createdAt, &updatedAt,
		&departmentName, &subDepartmentName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting budget not found")
		}
		return nil, fmt.Errorf("failed to get meeting budget: %v", err)
	}

	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		budget.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		budget.UpdatedAt = &val
	}
	if departmentName.Valid {
		budget.DepartmentName = &departmentName.String
	}
	if subDepartmentName.Valid {
		budget.SubDepartmentName = &subDepartmentName.String
	}

	return &budget, nil
}

// GetMeetingBudgets retrieves meeting budgets with filtering and pagination
func GetMeetingBudgets(conn *sql.DB, params models.MeetingBudgetSearchParams) (*models.MeetingBudgetListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		mb.id, mb.fiscal_year, mb.department_id, mb.sub_department_id, mb.amount,
		mb.created_at, mb.updated_at,
		d.depart_name,
		sd.sub_departname
	FROM i_meeting_budget mb
	LEFT JOIN department d ON mb.department_id = d.did
	LEFT JOIN sub_department sd ON mb.sub_department_id = sd.sub_id`

	if params.FiscalYear != nil && *params.FiscalYear != "" {
		conditions = append(conditions, "mb.fiscal_year = ?")
		args = append(args, *params.FiscalYear)
	}

	if params.DepartmentID != nil && *params.DepartmentID != "" {
		conditions = append(conditions, "mb.department_id = ?")
		args = append(args, *params.DepartmentID)
	}

	if params.SubDepartmentID != nil && *params.SubDepartmentID != "" {
		conditions = append(conditions, "mb.sub_department_id = ?")
		args = append(args, *params.SubDepartmentID)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY mb.fiscal_year DESC, mb.department_id, mb.sub_department_id"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_meeting_budget mb`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count meeting budgets: %v", err)
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
		return nil, fmt.Errorf("failed to query meeting budgets: %v", err)
	}
	defer rows.Close()

	var budgets []models.MeetingBudget
	for rows.Next() {
		var budget models.MeetingBudget
		var createdAt, updatedAt sql.NullTime
		var departmentName, subDepartmentName sql.NullString

		err := rows.Scan(
			&budget.ID, &budget.FiscalYear, &budget.DepartmentID, &budget.SubDepartmentID, &budget.Amount,
			&createdAt, &updatedAt,
			&departmentName, &subDepartmentName,
		)
		if err != nil {
			log.Error("Failed to scan meeting budget: %v", err)
			continue
		}

		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			budget.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			budget.UpdatedAt = &val
		}
		if departmentName.Valid {
			budget.DepartmentName = &departmentName.String
		}
		if subDepartmentName.Valid {
			budget.SubDepartmentName = &subDepartmentName.String
		}

		budgets = append(budgets, budget)
	}

	return &models.MeetingBudgetListResponse{
		Data:  budgets,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// DeleteMeetingBudget deletes a meeting budget by ID
func DeleteMeetingBudget(conn *sql.DB, id int) error {
	query := `DELETE FROM i_meeting_budget WHERE id = ?`
	result, err := conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete meeting budget: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("meeting budget not found")
	}

	return nil
}

// UpsertMeeting creates or updates a meeting
func UpsertMeeting(conn *sql.DB, req models.Meeting, userAuth int) (*models.Meeting, error) {
	if req.CommitteeNumber == "" {
		return nil, fmt.Errorf("committee_number is required")
	}
	if req.CommitteeName == "" {
		return nil, fmt.Errorf("committee_name is required")
	}
	if req.InstanceNumber == "" {
		return nil, fmt.Errorf("instance_number is required")
	}
	if req.StartDate == "" {
		return nil, fmt.Errorf("start_date is required")
	}
	if req.Status == "" {
		req.Status = models.MeetingStatusDraft
	}

	// Set responsible_person_id from userAuth if not provided
	if req.ResponsiblePersonID == nil {
		req.ResponsiblePersonID = &userAuth
	}

	var meetingID int

	if req.ID != nil && *req.ID > 0 {
		// ---------- UPDATE ----------
		query := `UPDATE i_meeting SET
			committee_id = ?,
			committee_number = ?,
			committee_name = ?,
			meeting_subject = ?,
			instance_number = ?,
			start_date = ?,
			end_date = ?,
			start_time = ?,
			end_time = ?,
			host_organization = ?,
			responsible_person = ?,
			responsible_person_id = ?,
			approver_level_1_id = ?,
			approver_level_1_name = ?,
			approver_level_2_id = ?,
			approver_level_2_name = ?,
			remarks = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := conn.Exec(query,
			req.CommitteeID, req.CommitteeNumber, req.CommitteeName, req.MeetingSubject,
			req.InstanceNumber, req.StartDate, req.EndDate, req.StartTime, req.EndTime,
			req.HostOrganization, req.ResponsiblePerson, req.ResponsiblePersonID,
			req.ApproverLevel1ID, req.ApproverLevel1Name,
			req.ApproverLevel2ID, req.ApproverLevel2Name,
			req.Remarks, string(req.Status), userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update meeting: %v", err)
			return nil, fmt.Errorf("failed to update meeting: %v", err)
		}
		meetingID = *req.ID
	} else {
		// ---------- INSERT ----------
		query := `INSERT INTO i_meeting (
			committee_id, committee_number, committee_name, meeting_subject, instance_number,
			start_date, end_date, start_time, end_time,
			host_organization, responsible_person, responsible_person_id,
			approver_level_1_id, approver_level_1_name,
			approver_level_2_id, approver_level_2_name,
			remarks, status,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.CommitteeID, req.CommitteeNumber, req.CommitteeName, req.MeetingSubject, req.InstanceNumber,
			req.StartDate, req.EndDate, req.StartTime, req.EndTime,
			req.HostOrganization, req.ResponsiblePerson, req.ResponsiblePersonID,
			req.ApproverLevel1ID, req.ApproverLevel1Name,
			req.ApproverLevel2ID, req.ApproverLevel2Name,
			req.Remarks, string(req.Status),
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert meeting: %v", err)
			return nil, fmt.Errorf("failed to insert meeting: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get meeting ID: %v", err)
			return nil, fmt.Errorf("failed to get meeting ID: %v", err)
		}
		meetingID = int(lastID)
	}

	// Get the complete meeting record
	meeting, err := GetMeetingByID(conn, meetingID)
	if err != nil {
		log.Error("Failed to get meeting after upsert: %v", err)
		return nil, fmt.Errorf("failed to get meeting after upsert: %v", err)
	}

	return meeting, nil
}

// GetMeetingByID retrieves a meeting by ID
func GetMeetingByID(conn *sql.DB, id int) (*models.Meeting, error) {
	query := `SELECT 
		id, committee_id, committee_number, committee_name, meeting_subject, instance_number,
		start_date, end_date, start_time, end_time,
		host_organization, responsible_person, responsible_person_id,
		approver_level_1_id, approver_level_1_name,
		approver_level_2_id, approver_level_2_name,
		remarks, status,
		created_at, updated_at
	FROM i_meeting
	WHERE id = ?`

	var meeting models.Meeting
	var committeeID, responsiblePersonID sql.NullInt64
	var approverLevel1ID, approverLevel2ID sql.NullInt64
	var endDate, startTime, endTime sql.NullString
	var hostOrganization, responsiblePerson, meetingSubject sql.NullString
	var approverLevel1Name, approverLevel2Name sql.NullString
	var remarks sql.NullString
	var createdAt, updatedAt sql.NullTime
	var status string

	err := conn.QueryRow(query, id).Scan(
		&meeting.ID, &committeeID, &meeting.CommitteeNumber, &meeting.CommitteeName, &meetingSubject, &meeting.InstanceNumber,
		&meeting.StartDate, &endDate, &startTime, &endTime,
		&hostOrganization, &responsiblePerson, &responsiblePersonID,
		&approverLevel1ID, &approverLevel1Name,
		&approverLevel2ID, &approverLevel2Name,
		&remarks, &status,
		&createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting not found")
		}
		return nil, fmt.Errorf("failed to get meeting: %v", err)
	}

	if committeeID.Valid {
		val := int(committeeID.Int64)
		meeting.CommitteeID = &val
	}
	if endDate.Valid {
		meeting.EndDate = &endDate.String
	}
	if startTime.Valid {
		meeting.StartTime = &startTime.String
	}
	if endTime.Valid {
		meeting.EndTime = &endTime.String
	}
	if hostOrganization.Valid {
		meeting.HostOrganization = &hostOrganization.String
	}
	if responsiblePerson.Valid {
		meeting.ResponsiblePerson = &responsiblePerson.String
	}
	if meetingSubject.Valid {
		meeting.MeetingSubject = &meetingSubject.String
	}
	if responsiblePersonID.Valid {
		val := int(responsiblePersonID.Int64)
		meeting.ResponsiblePersonID = &val
	}
	if approverLevel1ID.Valid {
		val := int(approverLevel1ID.Int64)
		meeting.ApproverLevel1ID = &val
	}
	if approverLevel1Name.Valid {
		meeting.ApproverLevel1Name = &approverLevel1Name.String
	}
	if approverLevel2ID.Valid {
		val := int(approverLevel2ID.Int64)
		meeting.ApproverLevel2ID = &val
	}
	if approverLevel2Name.Valid {
		meeting.ApproverLevel2Name = &approverLevel2Name.String
	}
	if remarks.Valid {
		meeting.Remarks = &remarks.String
	}
	meeting.Status = models.MeetingStatus(status)
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		meeting.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		meeting.UpdatedAt = &val
	}

	// Check if meeting has expense
	hasExpense, err := GetHasMeetingExpense(conn, *meeting.ID)
	if err != nil {
		log.Error("Failed to get has meeting expense: %v", err)
		meeting.HasExpense = false
	} else {
		meeting.HasExpense = hasExpense
	}

	// Check if meeting has participants
	hasParticipants, err := GetHasMeetingParticipants(conn, *meeting.ID)
	if err != nil {
		log.Error("Failed to get has meeting participants: %v", err)
		meeting.HasParticipants = false
	} else {
		meeting.HasParticipants = hasParticipants
	}

	return &meeting, nil
}

// GetMeetings retrieves meetings with filtering and pagination
func GetMeetings(conn *sql.DB, params models.MeetingSearchParams) (*models.MeetingListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		id, committee_id, committee_number, committee_name, meeting_subject, instance_number,
		start_date, end_date, start_time, end_time,
		host_organization, responsible_person, responsible_person_id,
		approver_level_1_id, approver_level_1_name,
		approver_level_2_id, approver_level_2_name,
		remarks, status,
		created_at, updated_at
	FROM i_meeting`

	if params.StartDate != nil && *params.StartDate != "" {
		conditions = append(conditions, "start_date >= ?")
		args = append(args, *params.StartDate)
	}

	if params.Status != nil {
		conditions = append(conditions, "status = ?")
		args = append(args, string(*params.Status))
	}

	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + *params.Search + "%"
		conditions = append(conditions, "(committee_number LIKE ? OR committee_name LIKE ? OR instance_number LIKE ?)")
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY start_date DESC, created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_meeting`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count meetings: %v", err)
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
		return nil, fmt.Errorf("failed to query meetings: %v", err)
	}
	defer rows.Close()

	var meetings []models.Meeting
	for rows.Next() {
		var meeting models.Meeting
		var committeeID, responsiblePersonID sql.NullInt64
		var approverLevel1ID, approverLevel2ID sql.NullInt64
		var endDate, startTime, endTime sql.NullString
		var hostOrganization, responsiblePerson, meetingSubject sql.NullString
		var approverLevel1Name, approverLevel2Name sql.NullString
		var remarks sql.NullString
		var createdAt, updatedAt sql.NullTime
		var status string

		err := rows.Scan(
			&meeting.ID, &committeeID, &meeting.CommitteeNumber, &meeting.CommitteeName, &meetingSubject, &meeting.InstanceNumber,
			&meeting.StartDate, &endDate, &startTime, &endTime,
			&hostOrganization, &responsiblePerson, &responsiblePersonID,
			&approverLevel1ID, &approverLevel1Name,
			&approverLevel2ID, &approverLevel2Name,
			&remarks, &status,
			&createdAt, &updatedAt,
		)
		if err != nil {
			log.Error("Failed to scan meeting: %v", err)
			continue
		}

		if committeeID.Valid {
			val := int(committeeID.Int64)
			meeting.CommitteeID = &val
		}
		if endDate.Valid {
			meeting.EndDate = &endDate.String
		}
		if startTime.Valid {
			meeting.StartTime = &startTime.String
		}
		if endTime.Valid {
			meeting.EndTime = &endTime.String
		}
		if hostOrganization.Valid {
			meeting.HostOrganization = &hostOrganization.String
		}
		if responsiblePerson.Valid {
			meeting.ResponsiblePerson = &responsiblePerson.String
		}
		if meetingSubject.Valid {
			meeting.MeetingSubject = &meetingSubject.String
		}
		if responsiblePersonID.Valid {
			val := int(responsiblePersonID.Int64)
			meeting.ResponsiblePersonID = &val
		}
		if approverLevel1ID.Valid {
			val := int(approverLevel1ID.Int64)
			meeting.ApproverLevel1ID = &val
		}
		if approverLevel1Name.Valid {
			meeting.ApproverLevel1Name = &approverLevel1Name.String
		}
		if approverLevel2ID.Valid {
			val := int(approverLevel2ID.Int64)
			meeting.ApproverLevel2ID = &val
		}
		if approverLevel2Name.Valid {
			meeting.ApproverLevel2Name = &approverLevel2Name.String
		}
		if remarks.Valid {
			meeting.Remarks = &remarks.String
		}
		meeting.Status = models.MeetingStatus(status)
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			meeting.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			meeting.UpdatedAt = &val
		}

		meetings = append(meetings, meeting)
	}

	return &models.MeetingListResponse{
		Data:  meetings,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetUnapprovedMeetings retrieves meetings that are not approved
func GetUnapprovedMeetings(conn *sql.DB, params models.MeetingSearchParams) (*models.MeetingListResponse, error) {
	var conditions []string
	var args []interface{}

	// Always exclude approved status
	// conditions = append(conditions, " im.status != 'approved'")
	conditions = append(conditions, "im.status not in('approved','meeting_invited','meeting_closed')")

	baseQuery := `SELECT 
		im.id, committee_id, im.committee_number, im.committee_name, im.meeting_subject, instance_number,
		start_date, end_date, start_time, end_time,
		host_organization, responsible_person, responsible_person_id,
		approver_level_1_id, approver_level_1_name,
		approver_level_2_id, approver_level_2_name,
		remarks, im.status,
		im.created_at, im.updated_at,
		iec.sub_committee_of 
	FROM i_meeting im 
	LEFT JOIN i_expert_committees iec ON im.committee_id =iec.id `

	if params.StartDate != nil && *params.StartDate != "" {
		conditions = append(conditions, "im.start_date >= ?")
		args = append(args, *params.StartDate)
	}

	if params.Status != nil {
		conditions = append(conditions, "im.status = ?")
		args = append(args, string(*params.Status))
	}

	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + *params.Search + "%"
		conditions = append(conditions, "(im.committee_number LIKE ? OR im.committee_name LIKE ? OR im.instance_number LIKE ?)")
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY im.start_date DESC, im.created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_meeting im 
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count unapproved meetings: %v", err)
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
		return nil, fmt.Errorf("failed to query unapproved meetings: %v", err)
	}
	defer rows.Close()

	var meetings []models.Meeting
	for rows.Next() {
		var meeting models.Meeting
		var committeeID, responsiblePersonID sql.NullInt64
		var approverLevel1ID, approverLevel2ID sql.NullInt64
		var endDate, startTime, endTime sql.NullString
		var hostOrganization, responsiblePerson, subCommitteeOf, meetingSubject sql.NullString
		var approverLevel1Name, approverLevel2Name sql.NullString
		var remarks sql.NullString
		var createdAt, updatedAt sql.NullTime
		var status string

		err := rows.Scan(
			&meeting.ID, &committeeID, &meeting.CommitteeNumber, &meeting.CommitteeName, &meetingSubject, &meeting.InstanceNumber,
			&meeting.StartDate, &endDate, &startTime, &endTime,
			&hostOrganization, &responsiblePerson, &responsiblePersonID,
			&approverLevel1ID, &approverLevel1Name,
			&approverLevel2ID, &approverLevel2Name,
			&remarks, &status,
			&createdAt, &updatedAt,
			&subCommitteeOf,
		)
		if err != nil {
			log.Error("Failed to scan meeting: %v", err)
			continue
		}

		if committeeID.Valid {
			val := int(committeeID.Int64)
			meeting.CommitteeID = &val
		}
		if endDate.Valid {
			meeting.EndDate = &endDate.String
		}
		if startTime.Valid {
			meeting.StartTime = &startTime.String
		}
		if endTime.Valid {
			meeting.EndTime = &endTime.String
		}
		if hostOrganization.Valid {
			meeting.HostOrganization = &hostOrganization.String
		}
		if responsiblePerson.Valid {
			meeting.ResponsiblePerson = &responsiblePerson.String
		}
		if meetingSubject.Valid {
			meeting.MeetingSubject = &meetingSubject.String
		}
		if responsiblePersonID.Valid {
			val := int(responsiblePersonID.Int64)
			meeting.ResponsiblePersonID = &val
		}
		if approverLevel1ID.Valid {
			val := int(approverLevel1ID.Int64)
			meeting.ApproverLevel1ID = &val
		}
		if approverLevel1Name.Valid {
			meeting.ApproverLevel1Name = &approverLevel1Name.String
		}
		if approverLevel2ID.Valid {
			val := int(approverLevel2ID.Int64)
			meeting.ApproverLevel2ID = &val
		}
		if approverLevel2Name.Valid {
			meeting.ApproverLevel2Name = &approverLevel2Name.String
		}
		if remarks.Valid {
			meeting.Remarks = &remarks.String
		}
		meeting.Status = models.MeetingStatus(status)
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			meeting.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			meeting.UpdatedAt = &val
		}

		hasExpense, err := GetHasMeetingExpense(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting expense: %v", err)
			continue
		}
		meeting.HasExpense = hasExpense

		hasParticipants, err := GetHasMeetingParticipants(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting participants: %v", err)
			continue
		}
		meeting.HasParticipants = hasParticipants

		if subCommitteeOf.Valid {
			meeting.SubCommitteeOf = &subCommitteeOf.String
		}

		meetings = append(meetings, meeting)
	}

	return &models.MeetingListResponse{
		Data:  meetings,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetApprovedMeetings retrieves meetings that are approved
func GetApprovedMeetings(conn *sql.DB, params models.MeetingSearchParams) (*models.MeetingListResponse, error) {
	var conditions []string
	var args []interface{}

	// Always include approved status
	conditions = append(conditions, "im.status in('approved','meeting_invited','meeting_closed')")

	baseQuery := `SELECT 
		im.id, committee_id, im.committee_number, im.committee_name, im.meeting_subject, instance_number,
		start_date, end_date, start_time, end_time,
		host_organization, responsible_person, responsible_person_id,
		approver_level_1_id, approver_level_1_name,
		approver_level_2_id, approver_level_2_name,
		remarks, im.status,
		im.created_at, im.updated_at,
		iec.sub_committee_of,
		mds.status AS disbursement_status
	FROM i_meeting im 
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id
	LEFT JOIN i_meeting_disbursement_summary mds ON im.id = mds.meeting_id `

	if params.StartDate != nil && *params.StartDate != "" {
		conditions = append(conditions, "im.start_date >= ?")
		args = append(args, *params.StartDate)
	}

	// if params.Status != nil {
	// 	conditions = append(conditions, "im.status = ?")
	// 	args = append(args, string(*params.Status))
	// }

	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + *params.Search + "%"
		conditions = append(conditions, "(im.committee_number LIKE ? OR im.committee_name LIKE ? OR im.instance_number LIKE ?)")
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY im.start_date DESC, im.created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_meeting im 
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count approved meetings: %v", err)
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
		return nil, fmt.Errorf("failed to query approved meetings: %v", err)
	}
	defer rows.Close()

	var meetings []models.Meeting
	for rows.Next() {
		var meeting models.Meeting
		var committeeID, responsiblePersonID sql.NullInt64
		var approverLevel1ID, approverLevel2ID sql.NullInt64
		var endDate, startTime, endTime sql.NullString
		var hostOrganization, responsiblePerson, subCommitteeOf, meetingSubject sql.NullString
		var approverLevel1Name, approverLevel2Name sql.NullString
		var remarks sql.NullString
		var disbursementStatus sql.NullString
		var createdAt, updatedAt sql.NullTime
		var status string

		err := rows.Scan(
			&meeting.ID, &committeeID, &meeting.CommitteeNumber, &meeting.CommitteeName, &meetingSubject, &meeting.InstanceNumber,
			&meeting.StartDate, &endDate, &startTime, &endTime,
			&hostOrganization, &responsiblePerson, &responsiblePersonID,
			&approverLevel1ID, &approverLevel1Name,
			&approverLevel2ID, &approverLevel2Name,
			&remarks, &status,
			&createdAt, &updatedAt,
			&subCommitteeOf, &disbursementStatus,
		)
		if err != nil {
			log.Error("Failed to scan meeting: %v", err)
			continue
		}

		if committeeID.Valid {
			val := int(committeeID.Int64)
			meeting.CommitteeID = &val
		}
		if endDate.Valid {
			meeting.EndDate = &endDate.String
		}
		if startTime.Valid {
			meeting.StartTime = &startTime.String
		}
		if endTime.Valid {
			meeting.EndTime = &endTime.String
		}
		if hostOrganization.Valid {
			meeting.HostOrganization = &hostOrganization.String
		}
		if responsiblePerson.Valid {
			meeting.ResponsiblePerson = &responsiblePerson.String
		}
		if meetingSubject.Valid {
			meeting.MeetingSubject = &meetingSubject.String
		}
		if responsiblePersonID.Valid {
			val := int(responsiblePersonID.Int64)
			meeting.ResponsiblePersonID = &val
		}
		if approverLevel1ID.Valid {
			val := int(approverLevel1ID.Int64)
			meeting.ApproverLevel1ID = &val
		}
		if approverLevel1Name.Valid {
			meeting.ApproverLevel1Name = &approverLevel1Name.String
		}
		if approverLevel2ID.Valid {
			val := int(approverLevel2ID.Int64)
			meeting.ApproverLevel2ID = &val
		}
		if approverLevel2Name.Valid {
			meeting.ApproverLevel2Name = &approverLevel2Name.String
		}
		if remarks.Valid {
			meeting.Remarks = &remarks.String
		}
		meeting.Status = models.MeetingStatus(status)
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			meeting.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			meeting.UpdatedAt = &val
		}

		hasExpense, err := GetHasMeetingExpense(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting expense: %v", err)
			continue
		}
		meeting.HasExpense = hasExpense

		// เช็คว่าต้องมี รายชื่อ ใน i_meeting_participant ของ meeting_id นั้นๆ จึงจะแสดงปุ่มส่งเมล
		hasParticipants, err := GetHasMeetingParticipants(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting participants: %v", err)
			continue
		}
		meeting.HasParticipants = hasParticipants

		if subCommitteeOf.Valid {
			meeting.SubCommitteeOf = &subCommitteeOf.String
		}
		statusVal := models.DisbursementStatus(models.DisbursementStatusPendingApproval)
		meeting.DisbursementStatus = &statusVal
		if disbursementStatus.Valid {
			statusVal := models.DisbursementStatus(disbursementStatus.String)
			meeting.DisbursementStatus = &statusVal
		}

		meetings = append(meetings, meeting)
	}

	return &models.MeetingListResponse{
		Data:  meetings,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// SendMeetingForApproval updates meeting status to sent for approval
func SendMeetingForApproval(conn *sql.DB, id int, level int, userAuth int) (*models.Meeting, error) {
	var newStatus models.MeetingStatus
	if level == 1 {
		newStatus = models.MeetingStatusSentForApprovalLevel1
	} else if level == 2 {
		newStatus = models.MeetingStatusSentForApprovalLevel2
	} else {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	query := `UPDATE i_meeting SET
		status = ?,
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	result, err := conn.Exec(query, string(newStatus), userAuth, id)
	if err != nil {
		log.Error("Failed to send meeting for approval: %v", err)
		return nil, fmt.Errorf("failed to send meeting for approval: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("meeting not found")
	}

	// Get updated meeting
	meeting, err := GetMeetingByID(conn, id)
	if err != nil {
		return nil, err
	}

	return meeting, nil
}

// DeleteMeeting deletes a meeting by ID
func DeleteMeeting(conn *sql.DB, id int) error {
	query := `DELETE FROM i_meeting WHERE id = ?`
	result, err := conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete meeting: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("meeting not found")
	}

	return nil
}

// ApproveMeeting approves a meeting at the specified level
func ApproveMeeting(conn *sql.DB, id int, level int, remarks *string, userAuth int) (*models.Meeting, error) {
	if level != 1 && level != 2 {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	// First, get the current meeting to check status and approver IDs
	var currentStatus string
	var approverLevel1ID, approverLevel2ID sql.NullInt64

	err := conn.QueryRow(`
		SELECT status, approver_level_1_id, approver_level_2_id
		FROM i_meeting
		WHERE id = ?
	`, id).Scan(&currentStatus, &approverLevel1ID, &approverLevel2ID)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting not found")
		}
		return nil, fmt.Errorf("failed to get meeting: %v", err)
	}

	var query string
	var newStatus string

	if level == 1 {
		// Level 1 approval
		query = `UPDATE i_meeting SET
			action_level_1 = 'approved',
			action_level_1_remarks = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP`

		// If there's a level 2 approver, move to level 2 approval
		// Otherwise, approve directly
		if approverLevel2ID.Valid && approverLevel2ID.Int64 > 0 {
			newStatus = string(models.MeetingStatusSentForApprovalLevel2)
		} else {
			newStatus = string(models.MeetingStatusApproved)
		}
		query += `, status = ?`
	} else {
		// Level 2 approval - final approval
		query = `UPDATE i_meeting SET
			action_level_2 = 'approved',
			action_level_2_remarks = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP`
		newStatus = string(models.MeetingStatusApproved)
	}

	query += ` WHERE id = ?`

	var result sql.Result
	if level == 1 {
		result, err = conn.Exec(query, remarks, userAuth, newStatus, id)
	} else {
		result, err = conn.Exec(query, remarks, newStatus, userAuth, id)
	}

	if err != nil {
		log.Error("Failed to approve meeting: %v", err)
		return nil, fmt.Errorf("failed to approve meeting: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("meeting not found")
	}

	// Get updated meeting
	meeting, err := GetMeetingByID(conn, id)
	if err != nil {
		return nil, err
	}

	return meeting, nil
}

// DisapproveMeeting disapproves a meeting at the specified level
func DisapproveMeeting(conn *sql.DB, id int, level int, remarks string, userAuth int) (*models.Meeting, error) {
	if level != 1 && level != 2 {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	var query string
	if level == 1 {
		query = `UPDATE i_meeting SET
			action_level_1 = 'disapprove',
			action_level_1_remarks = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`
	} else {
		query = `UPDATE i_meeting SET
			action_level_2 = 'disapprove',
			action_level_2_remarks = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`
	}

	result, err := conn.Exec(query, remarks, string(models.MeetingStatusDisapproved), userAuth, id)
	if err != nil {
		log.Error("Failed to disapprove meeting: %v", err)
		return nil, fmt.Errorf("failed to disapprove meeting: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("meeting not found")
	}

	// Get updated meeting
	meeting, err := GetMeetingByID(conn, id)
	if err != nil {
		return nil, err
	}

	return meeting, nil
}

// ReviewMeeting sends a meeting back for review at the specified level
func ReviewMeeting(conn *sql.DB, id int, level int, remarks string, userAuth int) (*models.Meeting, error) {
	if level != 1 && level != 2 {
		return nil, fmt.Errorf("invalid approval level: must be 1 or 2")
	}

	var query string
	if level == 1 {
		query = `UPDATE i_meeting SET
			action_level_1 = 'review',
			action_level_1_remarks = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`
	} else {
		query = `UPDATE i_meeting SET
			action_level_2 = 'review',
			action_level_2_remarks = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`
	}

	result, err := conn.Exec(query, remarks, string(models.MeetingStatusPendingReview), userAuth, id)
	if err != nil {
		log.Error("Failed to review meeting: %v", err)
		return nil, fmt.Errorf("failed to review meeting: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return nil, fmt.Errorf("meeting not found")
	}

	// Get updated meeting
	meeting, err := GetMeetingByID(conn, id)
	if err != nil {
		return nil, err
	}

	return meeting, nil
}

// GetMeetingExpense retrieves meeting expense by meeting ID
func GetMeetingExpense(conn *sql.DB, meetingID int) (*models.MeetingExpense, error) {
	query := `SELECT 
		me.id, me.meeting_id, me.total_budget, me.created_at, me.updated_at,
		m.committee_number, m.committee_name, m.instance_number
	FROM i_meeting_expense me
	INNER JOIN i_meeting m ON me.meeting_id = m.id
	WHERE me.meeting_id = ?`

	var expense models.MeetingExpense
	var createdAt, updatedAt sql.NullTime
	var committeeNumber, committeeName, instanceNumber sql.NullString

	err := conn.QueryRow(query, meetingID).Scan(
		&expense.ID, &expense.MeetingID, &expense.TotalBudget,
		&createdAt, &updatedAt,
		&committeeNumber, &committeeName, &instanceNumber,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting expense not found")
		}
		return nil, fmt.Errorf("failed to get meeting expense: %v", err)
	}

	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02T15:04:05Z")
		expense.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02T15:04:05Z")
		expense.UpdatedAt = &val
	}
	if committeeNumber.Valid {
		expense.CommitteeNumber = &committeeNumber.String
	}
	if committeeName.Valid {
		expense.CommitteeName = &committeeName.String
	}
	if instanceNumber.Valid {
		expense.InstanceNumber = &instanceNumber.String
	}

	// Get expense items
	itemsQuery := `SELECT 
		mei.id, mei.expense_type_id, mei.expense_type_other,
		mei.quantity, mei.unit_price, mei.total_price, mei.remarks,
		COALESCE(met.name, '') AS expense_name
	FROM i_meeting_expense_item mei
	LEFT JOIN i_master_expense met ON mei.expense_type_id = met.id
	WHERE mei.meeting_expense_id = ?
	ORDER BY mei.id`

	rows, err := conn.Query(itemsQuery, expense.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to get expense items: %v", err)
	}
	defer rows.Close()

	var items []models.MeetingExpenseItem
	for rows.Next() {
		var item models.MeetingExpenseItem
		var expenseTypeOther, remarks sql.NullString
		var expenseTypeName sql.NullString

		err := rows.Scan(
			&item.ID, &item.ExpenseTypeID, &expenseTypeOther,
			&item.Quantity, &item.UnitPrice, &item.TotalPrice, &remarks,
			&expenseTypeName,
		)
		if err != nil {
			log.Error("Failed to scan expense item: %v", err)
			continue
		}

		if expenseTypeOther.Valid {
			item.ExpenseTypeOther = &expenseTypeOther.String
		}
		if remarks.Valid {
			item.Remarks = &remarks.String
		}
		if expenseTypeName.Valid && expenseTypeName.String != "" {
			item.ExpenseTypeName = &expenseTypeName.String
		}

		items = append(items, item)
	}

	expense.Expenses = items
	return &expense, nil
}

// GetMeetingExpense retrieves meeting expense by meeting ID
func GetHasMeetingExpense(conn *sql.DB, meetingID int) (bool, error) {
	query := `SELECT COUNT(*) 
	FROM i_meeting_expense me
	WHERE me.meeting_id = ?`

	var count int

	err := conn.QueryRow(query, meetingID).Scan(&count)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("failed to get has meeting expense: %v", err)
	}

	return count > 0, nil
}

// GetHasMeetingParticipants checks if a meeting has participants in i_meeting_participant table
func GetHasMeetingParticipants(conn *sql.DB, meetingID int) (bool, error) {
	query := `SELECT COUNT(*) 
	FROM i_meeting_participant
	WHERE meeting_id = ?`

	var count int

	err := conn.QueryRow(query, meetingID).Scan(&count)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, fmt.Errorf("failed to get has meeting participants: %v", err)
	}

	return count > 0, nil
}

// UpsertMeetingExpense creates or updates meeting expense
func UpsertMeetingExpense(conn *sql.DB, req models.MeetingExpense, userAuth int) (*models.MeetingExpense, error) {
	if req.MeetingID <= 0 {
		return nil, fmt.Errorf("meeting_id is required")
	}

	// Validate expenses
	for i, expense := range req.Expenses {
		if expense.Quantity <= 0 {
			return nil, fmt.Errorf("expenses[%d].quantity must be greater than 0", i)
		}
		if expense.UnitPrice < 0 {
			return nil, fmt.Errorf("expenses[%d].unit_price must be greater than or equal to 0", i)
		}
		if expense.ExpenseTypeID <= 0 {
			return nil, fmt.Errorf("expenses[%d].expense_type_id is required", i)
		}
	}

	// Calculate total budget
	var totalBudget float64
	for _, expense := range req.Expenses {
		totalBudget += expense.TotalPrice
	}

	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT EXISTS(SELECT 1 FROM i_meeting WHERE id = ?)", req.MeetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	var expenseID int

	// Check if expense exists
	var existingID sql.NullInt64
	err = conn.QueryRow("SELECT id FROM i_meeting_expense WHERE meeting_id = ?", req.MeetingID).Scan(&existingID)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing expense: %v", err)
	}

	if existingID.Valid {
		// UPDATE
		expenseID = int(existingID.Int64)
		updateQuery := `UPDATE i_meeting_expense SET
			total_budget = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err = conn.Exec(updateQuery, totalBudget, userAuth, expenseID)
		if err != nil {
			log.Error("Failed to update meeting expense: %v", err)
			return nil, fmt.Errorf("failed to update meeting expense: %v", err)
		}

		// Delete all existing items (delete/insert strategy)
		_, err = conn.Exec("DELETE FROM i_meeting_expense_item WHERE meeting_expense_id = ?", expenseID)
		if err != nil {
			log.Error("Failed to delete expense items: %v", err)
			return nil, fmt.Errorf("failed to delete expense items: %v", err)
		}
	} else {
		// INSERT
		insertQuery := `INSERT INTO i_meeting_expense (
			meeting_id, total_budget, created_by, updated_by
		) VALUES (?, ?, ?, ?)`

		res, err := conn.Exec(insertQuery, req.MeetingID, totalBudget, userAuth, userAuth)
		if err != nil {
			log.Error("Failed to insert meeting expense: %v", err)
			return nil, fmt.Errorf("failed to insert meeting expense: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get meeting expense ID: %v", err)
			return nil, fmt.Errorf("failed to get meeting expense ID: %v", err)
		}
		expenseID = int(lastID)
	}

	// Insert expense items
	if len(req.Expenses) > 0 {
		itemQuery := `INSERT INTO i_meeting_expense_item (
			meeting_expense_id, expense_type_id, expense_type_other,
			quantity, unit_price, total_price, remarks
		) VALUES (?, ?, ?, ?, ?, ?, ?)`

		stmt, err := conn.Prepare(itemQuery)
		if err != nil {
			return nil, fmt.Errorf("failed to prepare item query: %v", err)
		}
		defer stmt.Close()

		for _, item := range req.Expenses {
			_, err = stmt.Exec(
				expenseID, item.ExpenseTypeID, item.ExpenseTypeOther,
				item.Quantity, item.UnitPrice, item.TotalPrice, item.Remarks,
			)
			if err != nil {
				log.Error("Failed to insert expense item: %v", err)
				return nil, fmt.Errorf("failed to insert expense item: %v", err)
			}
		}
	}

	// Get the complete expense record
	expense, err := GetMeetingExpense(conn, req.MeetingID)
	if err != nil {
		log.Error("Failed to get meeting expense after upsert: %v", err)
		return nil, fmt.Errorf("failed to get meeting expense after upsert: %v", err)
	}

	return expense, nil
}

// GetMeetingExpenseBudgetInfo retrieves budget information for a meeting
func GetMeetingExpenseBudgetInfo(conn *sql.DB, meetingID int) (*models.MeetingExpenseBudgetInfo, error) {
	// First, get meeting info to find fiscal year and sub_department
	// Get sub_department_id from responsible_person_id -> user_register.reg_subdepart
	var fiscalYear string
	var departmentID sql.NullString
	var startDate sql.NullString
	var responsiblePersonID sql.NullInt64

	err := conn.QueryRow(`
		SELECT 
			DATE_FORMAT(start_date, '%Y') + 543 AS fiscal_year,
			responsible_person_id,
			start_date
		FROM i_meeting
		WHERE id = ?
	`, meetingID).Scan(&fiscalYear, &responsiblePersonID, &startDate)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting not found")
		}
		return nil, fmt.Errorf("failed to get meeting info: %v", err)
	}

	if !responsiblePersonID.Valid {
		return nil, fmt.Errorf("meeting does not have responsible_person_id")
	}

	// Get sub_department_id from user_register
	err = conn.QueryRow(`
		SELECT SUBSTRING(reg_subdepart, 1, 2) AS department_id
		FROM user_register
		WHERE runrecno = ? AND deleted_at IS NULL
	`, responsiblePersonID.Int64).Scan(&departmentID)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("responsible person not found")
		}
		return nil, fmt.Errorf("failed to get sub_department_id: %v", err)
	}

	if !departmentID.Valid || departmentID.String == "" {
		return nil, fmt.Errorf("sub_department_id not found for responsible person")
	}

	// Get budget info from meeting_budget
	var budgetInfo models.MeetingExpenseBudgetInfo
	var annualBudget sql.NullFloat64

	err = conn.QueryRow(`
		SELECT amount
		FROM i_meeting_budget
		WHERE fiscal_year = ? AND department_id = ?
		LIMIT 1
	`, fiscalYear, departmentID.String).Scan(&annualBudget)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("budget not found for fiscal year %s and sub_department %s", fiscalYear, departmentID.String)
		}
		return nil, fmt.Errorf("failed to get budget: %v", err)
	}

	if annualBudget.Valid {
		budgetInfo.AnnualBudget = annualBudget.Float64
	}

	// Calculate expenses disbursed (disbursement_approved)
	// ใช้ actual_expense จาก i_meeting_disbursement_expense สำหรับ disbursement ที่ approved แล้ว
	var expensesDisbursed sql.NullFloat64
	err = conn.QueryRow(`
		SELECT COALESCE(SUM(mde.actual_expense), 0)
		FROM i_meeting_disbursement_summary mds
		INNER JOIN i_meeting m ON mds.meeting_id = m.id
		INNER JOIN i_meeting_disbursement_expense mde ON mde.disbursement_summary_id = mds.id
		INNER JOIN user_register ur ON m.responsible_person_id = ur.runrecno AND ur.deleted_at IS NULL
		INNER JOIN i_meeting_budget mb ON DATE_FORMAT(m.start_date, '%Y') + 543 = CAST(mb.fiscal_year AS UNSIGNED)
			AND SUBSTRING(ur.reg_subdepart, 1, 2) = mb.department_id
		WHERE mds.status = 'disbursement_approved'
			AND mb.fiscal_year = ? AND mb.department_id = ?
	`, fiscalYear, departmentID.String).Scan(&expensesDisbursed)

	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to calculate expenses disbursed: %v", err)
	}

	if expensesDisbursed.Valid {
		budgetInfo.ExpensesDisbursed = expensesDisbursed.Float64
	}

	// Calculate expenses advance payment (pending_approval, pending_approval_level_1, pending_approval_level_2)
	// ใช้ actual_expense จาก i_meeting_disbursement_expense สำหรับ disbursement ที่รออนุมัติ
	var expensesAdvancePayment sql.NullFloat64
	// err = conn.QueryRow(`
	// 	SELECT COALESCE(SUM(mde.actual_expense), 0)
	// 	FROM i_meeting_disbursement_summary mds
	// 	INNER JOIN i_meeting m ON mds.meeting_id = m.id
	// 	INNER JOIN i_meeting_disbursement_expense mde ON mde.disbursement_summary_id = mds.id
	// 	INNER JOIN user_register ur ON m.responsible_person_id = ur.runrecno AND ur.deleted_at IS NULL
	// 	INNER JOIN i_meeting_budget mb ON DATE_FORMAT(m.start_date, '%Y') + 543 = CAST(mb.fiscal_year AS UNSIGNED)
	// 		AND SUBSTRING(ur.reg_subdepart, 1, 2) = mb.department_id
	// 	WHERE mds.status IN ('pending_approval', 'pending_approval_level_1', 'pending_approval_level_2')
	// 		AND mb.fiscal_year = ? AND mb.department_id = ?
	// `, fiscalYear, departmentID.String).Scan(&expensesAdvancePayment)

	// 	err = conn.QueryRow(`
	// 	SELECT COALESCE(SUM(mde.budget_amount), 0)
	// 	FROM i_meeting_disbursement_summary mds
	// 	INNER JOIN i_meeting m ON mds.meeting_id = m.id
	// 	INNER JOIN i_meeting_disbursement_expense mde ON mde.disbursement_summary_id = mds.id
	// 	INNER JOIN user_register ur ON m.responsible_person_id = ur.runrecno AND ur.deleted_at IS NULL
	// 	INNER JOIN i_meeting_budget mb ON DATE_FORMAT(m.start_date, '%Y') + 543 = CAST(mb.fiscal_year AS UNSIGNED)
	// 		AND SUBSTRING(ur.reg_subdepart, 1, 2) = mb.department_id
	// 	WHERE  mb.fiscal_year = ? AND mb.department_id = ? and m.id =?
	// `, fiscalYear, departmentID.String, meetingID).Scan(&expensesAdvancePayment)

	err = conn.QueryRow(`
	SELECT COALESCE(SUM(me.total_budget), 0)
	FROM i_meeting_expense me
	WHERE  me.meeting_id =?
`, meetingID).Scan(&expensesAdvancePayment)

	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to calculate expenses advance payment: %v", err)
	}

	if expensesAdvancePayment.Valid {
		budgetInfo.ExpensesAdvancePayment = expensesAdvancePayment.Float64
	}

	// Calculate remaining budget
	//budgetInfo.RemainingBudget = budgetInfo.AnnualBudget - budgetInfo.ExpensesDisbursed - budgetInfo.ExpensesAdvancePayment
	budgetInfo.RemainingBudget = budgetInfo.AnnualBudget - budgetInfo.ExpensesDisbursed

	return &budgetInfo, nil
}

// GetMeetingInvitation retrieves meeting invitation by meeting ID
func GetMeetingInvitation(conn *sql.DB, meetingID int) (*models.MeetingInvitation, error) {
	query := `SELECT 
		id, meeting_id, meeting_format, meeting_location, meeting_room,
		meeting_id_online, passcode, meeting_link,
		agenda_file_name, agenda_file_path,
		invitation_letter_file_name, invitation_letter_file_path,
		COALESCE(email_sent_status, 'not_sent') as email_sent_status,
		created_at, updated_at
	FROM i_meeting_invitation
	WHERE meeting_id = ?`

	var invitation models.MeetingInvitation
	var meetingFormat string
	var meetingLocation, meetingRoom, meetingIDOnline, passcode, meetingLink sql.NullString
	var agendaFileName, agendaFilePath sql.NullString
	var invitationLetterFileName, invitationLetterFilePath sql.NullString
	var emailSentStatus string
	var createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, meetingID).Scan(
		&invitation.ID, &invitation.MeetingID, &meetingFormat,
		&meetingLocation, &meetingRoom, &meetingIDOnline, &passcode, &meetingLink,
		&agendaFileName, &agendaFilePath,
		&invitationLetterFileName, &invitationLetterFilePath,
		&emailSentStatus,
		&createdAt, &updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting invitation not found")
		}
		return nil, fmt.Errorf("failed to get meeting invitation: %v", err)
	}

	invitation.MeetingFormat = models.MeetingFormat(meetingFormat)
	invitation.EmailSentStatus = models.EmailSentStatus(emailSentStatus)
	if meetingLocation.Valid {
		invitation.MeetingLocation = &meetingLocation.String
	}
	if meetingRoom.Valid {
		invitation.MeetingRoom = &meetingRoom.String
	}
	if meetingIDOnline.Valid {
		invitation.MeetingIDOnline = &meetingIDOnline.String
	}
	if passcode.Valid {
		invitation.Passcode = &passcode.String
	}
	if meetingLink.Valid {
		invitation.MeetingLink = &meetingLink.String
	}
	if agendaFileName.Valid {
		invitation.AgendaFileName = &agendaFileName.String
	}
	if agendaFilePath.Valid {
		invitation.AgendaFilePath = &agendaFilePath.String
	}
	if invitationLetterFileName.Valid {
		invitation.InvitationLetterFileName = &invitationLetterFileName.String
	}
	if invitationLetterFilePath.Valid {
		invitation.InvitationLetterFilePath = &invitationLetterFilePath.String
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		invitation.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		invitation.UpdatedAt = &val
	}

	// Get supporting documents
	supportingDocsQuery := `SELECT file_name, file_path
	FROM i_meeting_invitation_supporting_document
	WHERE meeting_invitation_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(supportingDocsQuery, invitation.ID)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get supporting documents: %v", err)
	}
	defer rows.Close()

	var docNames []string
	var docPaths []string
	for rows.Next() {
		var docName, docPath string
		if err := rows.Scan(&docName, &docPath); err != nil {
			log.Error("Failed to scan supporting document: %v", err)
			continue
		}
		docNames = append(docNames, docName)
		docPaths = append(docPaths, docPath)
	}

	invitation.SupportingDocumentNames = docNames
	invitation.SupportingDocumentPaths = docPaths

	return &invitation, nil
}

// UpsertMeetingInvitation creates or updates meeting invitation
func UpsertMeetingInvitation(conn *sql.DB, req models.MeetingInvitation, userAuth int) (*models.MeetingInvitation, error) {
	if req.MeetingID <= 0 {
		return nil, fmt.Errorf("meeting_id is required")
	}

	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", req.MeetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting existence: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	var invitationID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_meeting_invitation SET
			meeting_format = ?,
			meeting_location = ?,
			meeting_room = ?,
			meeting_id_online = ?,
			passcode = ?,
			meeting_link = ?,
			agenda_file_name = ?,
			agenda_file_path = ?,
			invitation_letter_file_name = ?,
			invitation_letter_file_path = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := conn.Exec(query,
			string(req.MeetingFormat), req.MeetingLocation, req.MeetingRoom,
			req.MeetingIDOnline, req.Passcode, req.MeetingLink,
			req.AgendaFileName, req.AgendaFilePath,
			req.InvitationLetterFileName, req.InvitationLetterFilePath,
			userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update meeting invitation: %v", err)
			return nil, fmt.Errorf("failed to update meeting invitation: %v", err)
		}
		invitationID = *req.ID

		// Delete old supporting documents
		_, err = conn.Exec("DELETE FROM i_meeting_invitation_supporting_document WHERE meeting_invitation_id = ?", invitationID)
		if err != nil {
			log.Error("Failed to delete old supporting documents: %v", err)
		}
	} else {
		// INSERT
		query := `INSERT INTO i_meeting_invitation (
			meeting_id, meeting_format, meeting_location, meeting_room,
			meeting_id_online, passcode, meeting_link,
			agenda_file_name, agenda_file_path,
			invitation_letter_file_name, invitation_letter_file_path,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.MeetingID, string(req.MeetingFormat), req.MeetingLocation, req.MeetingRoom,
			req.MeetingIDOnline, req.Passcode, req.MeetingLink,
			req.AgendaFileName, req.AgendaFilePath,
			req.InvitationLetterFileName, req.InvitationLetterFilePath,
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert meeting invitation: %v", err)
			return nil, fmt.Errorf("failed to insert meeting invitation: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get meeting invitation ID: %v", err)
			return nil, fmt.Errorf("failed to get meeting invitation ID: %v", err)
		}
		invitationID = int(lastID)
	}

	// Insert supporting documents
	if len(req.SupportingDocumentNames) > 0 && len(req.SupportingDocumentPaths) > 0 {
		docCount := len(req.SupportingDocumentNames)
		if len(req.SupportingDocumentPaths) < docCount {
			docCount = len(req.SupportingDocumentPaths)
		}

		for i := 0; i < docCount; i++ {
			insertDocQuery := `INSERT INTO i_meeting_invitation_supporting_document (
				meeting_invitation_id, file_name, file_path, display_order
			) VALUES (?, ?, ?, ?)`
			_, err := conn.Exec(insertDocQuery, invitationID, req.SupportingDocumentNames[i], req.SupportingDocumentPaths[i], i)
			if err != nil {
				log.Error("Failed to insert supporting document: %v", err)
				// Continue with other documents
			}
		}
	}

	// Get the complete invitation record
	invitation, err := GetMeetingInvitation(conn, req.MeetingID)
	if err != nil {
		return nil, err
	}

	return invitation, nil
}

// GetMeetingCommitteeMemberEmails retrieves email addresses of committee members for a meeting
func GetMeetingCommitteeMemberEmails(conn *sql.DB, meetingID int) ([]string, error) {
	query := `SELECT DISTINCT e.email
	FROM i_meeting m
	INNER JOIN i_expert_committee_members ecm ON m.committee_id = ecm.committee_id
	INNER JOIN i_experts e ON ecm.expert_id = e.id
	WHERE m.id = ?
		AND ecm.status = 'active'
		AND e.status = 'active'
		AND e.email IS NOT NULL
		AND e.email != ''`

	rows, err := conn.Query(query, meetingID)
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

// GetMeetingParticipantEmails retrieves email addresses from i_meeting_participant table
func GetMeetingParticipantEmails(conn *sql.DB, meetingID int) ([]string, error) {
	query := `SELECT DISTINCT email
	FROM i_meeting_participant
	WHERE meeting_id = ?
		AND email IS NOT NULL
		AND email != ''`

	rows, err := conn.Query(query, meetingID)
	if err != nil {
		return nil, fmt.Errorf("failed to query meeting participant emails: %v", err)
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

// UpdateEmailSentStatus updates email_sent_status for a meeting invitation
func UpdateEmailSentStatus(conn *sql.DB, meetingID int, status models.EmailSentStatus) error {
	query := `UPDATE i_meeting_invitation 
	SET email_sent_status = ?, updated_at = CURRENT_TIMESTAMP
	WHERE meeting_id = ?`

	result, err := conn.Exec(query, string(status), meetingID)
	if err != nil {
		log.Error("Failed to update email sent status: %v", err)
		return fmt.Errorf("failed to update email sent status: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("meeting invitation not found")
	}

	return nil
}

// GetMeetingTopics retrieves all topics for a meeting
func GetMeetingTopics(conn *sql.DB, meetingID int) (*models.MeetingTopicListResponse, error) {
	query := `SELECT 
		id, meeting_id, topic_type, project_id,
		project_name, project_start_year, project_owner,
		project_stage_code, topic_text, display_order,
		created_at, updated_at
	FROM i_meeting_topic
	WHERE meeting_id = ?
	ORDER BY display_order, id`

	rows, err := conn.Query(query, meetingID)
	if err != nil {
		return nil, fmt.Errorf("failed to query meeting topics: %v", err)
	}
	defer rows.Close()

	var topics []models.MeetingTopic
	for rows.Next() {
		var topic models.MeetingTopic
		var topicType string
		var projectID sql.NullInt64
		var projectName, projectStartYear, projectOwner, projectStageCode sql.NullString
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(
			&topic.ID, &topic.MeetingID, &topicType,
			&projectID, &projectName, &projectStartYear, &projectOwner,
			&projectStageCode, &topic.TopicText, &topic.DisplayOrder,
			&createdAt, &updatedAt,
		)
		if err != nil {
			log.Error("Failed to scan meeting topic: %v", err)
			continue
		}

		topic.TopicType = models.TopicType(topicType)
		if projectID.Valid {
			val := int(projectID.Int64)
			topic.ProjectID = &val
		}
		if projectName.Valid {
			topic.ProjectName = &projectName.String
		}
		if projectStartYear.Valid {
			topic.ProjectStartYear = &projectStartYear.String
		}
		if projectOwner.Valid {
			topic.ProjectOwner = &projectOwner.String
		}
		if projectStageCode.Valid {
			topic.ProjectStageCode = &projectStageCode.String
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			topic.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			topic.UpdatedAt = &val
		}

		topics = append(topics, topic)
	}

	return &models.MeetingTopicListResponse{
		Data:  topics,
		Total: len(topics),
	}, nil
}

// UpsertMeetingTopic creates or updates a meeting topic
func UpsertMeetingTopic(conn *sql.DB, req models.MeetingTopic, userAuth int) (*models.MeetingTopic, error) {
	if req.MeetingID <= 0 {
		return nil, fmt.Errorf("meeting_id is required")
	}
	if req.TopicText == "" {
		return nil, fmt.Errorf("topic_text is required")
	}

	// Validate topic type
	if req.TopicType == models.TopicTypeProject {
		if req.ProjectID == nil || *req.ProjectID <= 0 {
			return nil, fmt.Errorf("project_id is required for project topic type")
		}
	}

	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", req.MeetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting existence: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	var topicID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_meeting_topic SET
			topic_type = ?,
			project_id = ?,
			project_name = ?,
			project_start_year = ?,
			project_owner = ?,
			project_stage_code = ?,
			topic_text = ?,
			display_order = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND meeting_id = ?`

		_, err := conn.Exec(query,
			string(req.TopicType), req.ProjectID, req.ProjectName,
			req.ProjectStartYear, req.ProjectOwner, req.ProjectStageCode, req.TopicText,
			req.DisplayOrder, userAuth, req.ID, req.MeetingID,
		)
		if err != nil {
			log.Error("Failed to update meeting topic: %v", err)
			return nil, fmt.Errorf("failed to update meeting topic: %v", err)
		}
		topicID = *req.ID
	} else {
		// INSERT
		// Get next display_order if not provided
		if req.DisplayOrder == 0 {
			var maxOrder sql.NullInt64
			err := conn.QueryRow("SELECT MAX(display_order) FROM i_meeting_topic WHERE meeting_id = ?", req.MeetingID).Scan(&maxOrder)
			if err != nil && err != sql.ErrNoRows {
				log.Error("Failed to get max display order: %v", err)
			}
			if maxOrder.Valid {
				req.DisplayOrder = int(maxOrder.Int64) + 1
			} else {
				req.DisplayOrder = 1
			}
		}

		query := `INSERT INTO i_meeting_topic (
			meeting_id, topic_type, project_id,
			project_name, project_start_year, project_owner,
			project_stage_code, topic_text, display_order,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.MeetingID, string(req.TopicType), req.ProjectID,
			req.ProjectName, req.ProjectStartYear, req.ProjectOwner,
			req.ProjectStageCode, req.TopicText, req.DisplayOrder,
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert meeting topic: %v", err)
			return nil, fmt.Errorf("failed to insert meeting topic: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get meeting topic ID: %v", err)
			return nil, fmt.Errorf("failed to get meeting topic ID: %v", err)
		}
		topicID = int(lastID)
	}

	// Get the complete topic record
	topic, err := GetMeetingTopicByID(conn, topicID)
	if err != nil {
		return nil, err
	}

	return topic, nil
}

// GetMeetingTopicByID retrieves a meeting topic by ID
func GetMeetingTopicByID(conn *sql.DB, id int) (*models.MeetingTopic, error) {
	query := `SELECT 
		id, meeting_id, topic_type, project_id,
		project_name, project_start_year, project_owner,
		project_stage_code, topic_text, display_order,
		created_at, updated_at
	FROM i_meeting_topic
	WHERE id = ?`

	var topic models.MeetingTopic
	var topicType string
	var projectID sql.NullInt64
	var projectName, projectStartYear, projectOwner, projectStageCode sql.NullString
	var createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, id).Scan(
		&topic.ID, &topic.MeetingID, &topicType,
		&projectID, &projectName, &projectStartYear, &projectOwner,
		&projectStageCode, &topic.TopicText, &topic.DisplayOrder,
		&createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting topic not found")
		}
		return nil, fmt.Errorf("failed to get meeting topic: %v", err)
	}

	topic.TopicType = models.TopicType(topicType)
	if projectID.Valid {
		val := int(projectID.Int64)
		topic.ProjectID = &val
	}
	if projectName.Valid {
		topic.ProjectName = &projectName.String
	}
	if projectStartYear.Valid {
		topic.ProjectStartYear = &projectStartYear.String
	}
	if projectOwner.Valid {
		topic.ProjectOwner = &projectOwner.String
	}
	if projectStageCode.Valid {
		topic.ProjectStageCode = &projectStageCode.String
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		topic.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		topic.UpdatedAt = &val
	}

	return &topic, nil
}

// DeleteMeetingTopic deletes a meeting topic by ID
func DeleteMeetingTopic(conn *sql.DB, topicID int) error {
	// Check if topic exists
	var exists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting_topic WHERE id = ?", topicID).Scan(&exists)
	if err != nil {
		log.Error("Failed to check topic existence: %v", err)
		return fmt.Errorf("failed to check topic existence: %v", err)
	}
	if !exists {
		return fmt.Errorf("meeting topic not found")
	}

	// Delete the topic
	query := `DELETE FROM i_meeting_topic WHERE id = ?`
	_, err = conn.Exec(query, topicID)
	if err != nil {
		log.Error("Failed to delete meeting topic: %v", err)
		return fmt.Errorf("failed to delete meeting topic: %v", err)
	}

	return nil
}

// BatchUpsertMeetingTopics creates or updates multiple meeting topics
func BatchUpsertMeetingTopics(conn *sql.DB, meetingID int, topics []models.MeetingTopic, userAuth int) (*models.BatchUpsertMeetingTopicsResponse, error) {
	if len(topics) == 0 {
		return nil, fmt.Errorf("topics list cannot be empty")
	}

	created := 0
	updated := 0
	var resultTopics []models.MeetingTopic

	for _, topic := range topics {
		topic.MeetingID = meetingID
		result, err := UpsertMeetingTopic(conn, topic, userAuth)
		if err != nil {
			log.Error("Failed to upsert topic: %v", err)
			continue
		}

		if topic.ID != nil && *topic.ID > 0 {
			updated++
		} else {
			created++
		}

		resultTopics = append(resultTopics, *result)
	}

	return &models.BatchUpsertMeetingTopicsResponse{
		Success: true,
		Message: "บันทึกข้อมูลเรียบร้อยแล้ว",
		Data: models.BatchUpsertData{
			Created: created,
			Updated: updated,
			Topics:  resultTopics,
		},
	}, nil
}

// CloseMeeting updates meeting status to meeting_closed
func CloseMeeting(conn *sql.DB, meetingID int, remarks *string, userAuth int) (*models.Meeting, error) {
	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", meetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting existence: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	// Check if meeting has at least one topic
	var topicCount int
	err = conn.QueryRow("SELECT COUNT(*) FROM i_meeting_topic WHERE meeting_id = ?", meetingID).Scan(&topicCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check topics: %v", err)
	}
	if topicCount == 0 {
		return nil, fmt.Errorf("cannot close meeting: no topics found. Please add at least one topic before closing")
	}

	// Update meeting status
	query := `UPDATE i_meeting SET
		status = ?,
		remarks = COALESCE(?, remarks),
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	_, err = conn.Exec(query, string(models.MeetingStatusMeetingClosed), remarks, userAuth, meetingID)
	if err != nil {
		log.Error("Failed to close meeting: %v", err)
		return nil, fmt.Errorf("failed to close meeting: %v", err)
	}

	// Get updated meeting
	meeting, err := GetMeetingByID(conn, meetingID)
	if err != nil {
		return nil, err
	}

	return meeting, nil
}

// UpdateMeetingStatusToInvited updates meeting status to meeting_invited
func UpdateMeetingStatusToInvited(conn *sql.DB, meetingID int, userAuth int) (*models.Meeting, error) {
	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", meetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting existence: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	// Update meeting status
	query := `UPDATE i_meeting SET
		status = ?,
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	_, err = conn.Exec(query, string(models.MeetingStatusMeetingInvited), userAuth, meetingID)
	if err != nil {
		log.Error("Failed to update meeting status to invited: %v", err)
		return nil, fmt.Errorf("failed to update meeting status to invited: %v", err)
	}

	// Get updated meeting
	meeting, err := GetMeetingByID(conn, meetingID)
	if err != nil {
		return nil, err
	}

	return meeting, nil
}

// GetMeetingParticipants retrieves all participants for a meeting
// Participants are loaded from meeting > i_expert_committee_members > i_experts
func GetMeetingParticipants(conn *sql.DB, meetingID int) (*models.MeetingParticipantListResponse, error) {
	// First, get participants from database if they exist
	query := `SELECT 
		id, meeting_id, user_id, name, email,
		attended, sent_representative, meeting_allowance,
		created_at, updated_at
	FROM i_meeting_participant
	WHERE meeting_id = ?
	ORDER BY id`

	rows, err := conn.Query(query, meetingID)
	if err != nil {
		return nil, fmt.Errorf("failed to query meeting participants: %v", err)
	}
	defer rows.Close()

	var participants []models.MeetingParticipant
	var participantIDs []int

	for rows.Next() {
		var participant models.MeetingParticipant
		var userID sql.NullInt64
		var email sql.NullString
		var meetingAllowance sql.NullString
		var createdAt, updatedAt sql.NullTime

		err := rows.Scan(
			&participant.ID, &participant.MeetingID, &userID,
			&participant.Name, &email,
			&participant.Attended, &participant.SentRepresentative, &meetingAllowance,
			&createdAt, &updatedAt,
		)
		if err != nil {
			log.Error("Failed to scan meeting participant: %v", err)
			continue
		}

		if userID.Valid {
			val := int(userID.Int64)
			participant.UserID = &val
			participantIDs = append(participantIDs, val)
		}
		if email.Valid {
			participant.Email = &email.String
		}
		if meetingAllowance.Valid {
			participant.MeetingAllowance = &meetingAllowance.String
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			participant.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			participant.UpdatedAt = &val
		}

		participants = append(participants, participant)
	}

	// If no participants found in database, load from committee members
	if len(participants) == 0 {
		committeeQuery := `SELECT DISTINCT
			e.user_id AS expert_id,
			CONCAT(COALESCE(t.title_name, ''), ' ', e.first_name, ' ', e.last_name) AS name,
			e.email
		FROM i_meeting m
		INNER JOIN i_expert_committee_members ecm ON m.committee_id = ecm.committee_id
		INNER JOIN i_experts e ON ecm.expert_id = e.id
		LEFT JOIN tr6_titlename t ON e.prefix = t.id
		WHERE m.id = ?
			AND ecm.status = 'active'
			AND e.status = 'active'
		ORDER BY e.user_id`

		committeeRows, err := conn.Query(committeeQuery, meetingID)
		if err != nil {
			return nil, fmt.Errorf("failed to query committee members: %v", err)
		}
		defer committeeRows.Close()

		for committeeRows.Next() {
			var participant models.MeetingParticipant
			var expertID int
			var email sql.NullString

			err := committeeRows.Scan(&expertID, &participant.Name, &email)
			if err != nil {
				log.Error("Failed to scan committee member: %v", err)
				continue
			}

			participant.MeetingID = meetingID
			participant.UserID = &expertID
			participant.Attended = false
			participant.SentRepresentative = false
			if email.Valid {
				participant.Email = &email.String
			}

			participants = append(participants, participant)
		}
	}

	return &models.MeetingParticipantListResponse{
		Data:  participants,
		Total: len(participants),
	}, nil
}

// UpsertMeetingParticipant creates or updates a meeting participant
func UpsertMeetingParticipant(conn *sql.DB, req models.MeetingParticipant, userAuth int) (*models.MeetingParticipant, error) {
	if req.MeetingID <= 0 {
		return nil, fmt.Errorf("meeting_id is required")
	}
	if req.Name == "" {
		return nil, fmt.Errorf("name is required")
	}

	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", req.MeetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting existence: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	var participantID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_meeting_participant SET
			user_id = ?,
			name = ?,
			email = ?,
			attended = ?,
			sent_representative = ?,
			meeting_allowance = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND meeting_id = ?`

		_, err := conn.Exec(query,
			req.UserID, req.Name, req.Email,
			req.Attended, req.SentRepresentative, req.MeetingAllowance,
			userAuth, req.ID, req.MeetingID,
		)
		if err != nil {
			log.Error("Failed to update meeting participant: %v", err)
			return nil, fmt.Errorf("failed to update meeting participant: %v", err)
		}
		participantID = *req.ID
	} else {
		// INSERT
		query := `INSERT INTO i_meeting_participant (
			meeting_id, user_id, name, email,
			attended, sent_representative, meeting_allowance,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.MeetingID, req.UserID, req.Name, req.Email,
			req.Attended, req.SentRepresentative, req.MeetingAllowance,
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert meeting participant: %v", err)
			return nil, fmt.Errorf("failed to insert meeting participant: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get meeting participant ID: %v", err)
			return nil, fmt.Errorf("failed to get meeting participant ID: %v", err)
		}
		participantID = int(lastID)
	}

	// Get the complete participant record
	participant, err := GetMeetingParticipantByID(conn, participantID)
	if err != nil {
		return nil, err
	}

	return participant, nil
}

// GetMeetingParticipantByID retrieves a meeting participant by ID
func GetMeetingParticipantByID(conn *sql.DB, id int) (*models.MeetingParticipant, error) {
	query := `SELECT 
		id, meeting_id, user_id, name, email,
		attended, sent_representative, meeting_allowance,
		created_at, updated_at
	FROM i_meeting_participant
	WHERE id = ?`

	var participant models.MeetingParticipant
	var userID sql.NullInt64
	var email sql.NullString
	var meetingAllowance sql.NullString
	var createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, id).Scan(
		&participant.ID, &participant.MeetingID, &userID,
		&participant.Name, &email,
		&participant.Attended, &participant.SentRepresentative, &meetingAllowance,
		&createdAt, &updatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("meeting participant not found")
		}
		return nil, fmt.Errorf("failed to get meeting participant: %v", err)
	}

	if userID.Valid {
		val := int(userID.Int64)
		participant.UserID = &val
	}
	if email.Valid {
		participant.Email = &email.String
	}
	if meetingAllowance.Valid {
		participant.MeetingAllowance = &meetingAllowance.String
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		participant.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		participant.UpdatedAt = &val
	}

	return &participant, nil
}

// GetDisbursementSummary retrieves disbursement summary for a meeting
func GetDisbursementSummary(conn *sql.DB, meetingID int) (*models.DisbursementSummary, error) {
	query := `SELECT 
		id, meeting_id, status,
		created_at, updated_at
	FROM i_meeting_disbursement_summary
	WHERE meeting_id = ?`

	var summary models.DisbursementSummary
	var status sql.NullString
	var createdAt, updatedAt sql.NullTime

	err := conn.QueryRow(query, meetingID).Scan(
		&summary.ID, &summary.MeetingID, &status,
		&createdAt, &updatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("disbursement summary not found")
		}
		return nil, fmt.Errorf("failed to get disbursement summary: %v", err)
	}

	if status.Valid {
		summary.Status = models.DisbursementStatus(status.String)
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		summary.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		summary.UpdatedAt = &val
	}

	// Get expenses
	expensesQuery := `SELECT 
		id, expense_type_id, expense_type_name,
		budget_amount, actual_expense
	FROM i_meeting_disbursement_expense
	WHERE disbursement_summary_id = ?
	ORDER BY display_order, id`

	expenseRows, err := conn.Query(expensesQuery, summary.ID)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get expenses: %v", err)
	}
	defer expenseRows.Close()

	var expenses []models.DisbursementExpense
	for expenseRows.Next() {
		var expense models.DisbursementExpense
		err := expenseRows.Scan(
			&expense.ID, &expense.ExpenseTypeID, &expense.ExpenseTypeName,
			&expense.BudgetAmount, &expense.ActualExpense,
		)
		if err != nil {
			log.Error("Failed to scan expense: %v", err)
			continue
		}
		expenses = append(expenses, expense)
	}
	summary.Expenses = expenses

	// Get files
	filesQuery := `SELECT file_name, file_path
	FROM i_meeting_disbursement_file
	WHERE disbursement_summary_id = ?
	ORDER BY display_order, id`

	fileRows, err := conn.Query(filesQuery, summary.ID)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to get files: %v", err)
	}
	defer fileRows.Close()

	var fileNames []string
	var filePaths []string
	for fileRows.Next() {
		var fileName, filePath string
		if err := fileRows.Scan(&fileName, &filePath); err != nil {
			log.Error("Failed to scan file: %v", err)
			continue
		}
		fileNames = append(fileNames, fileName)
		filePaths = append(filePaths, filePath)
	}
	summary.ExpenseFileNames = fileNames
	summary.ExpenseFilePaths = filePaths

	return &summary, nil
}

// UpsertDisbursementSummary creates or updates disbursement summary
func UpsertDisbursementSummary(conn *sql.DB, req models.DisbursementSummary, userAuth int) (*models.DisbursementSummary, error) {
	if req.MeetingID <= 0 {
		return nil, fmt.Errorf("meeting_id is required")
	}

	// Check if meeting exists
	var meetingExists bool
	err := conn.QueryRow("SELECT COUNT(*) > 0 FROM i_meeting WHERE id = ?", req.MeetingID).Scan(&meetingExists)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting existence: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	var summaryID int

	if req.ID != nil && *req.ID > 0 {
		// UPDATE
		query := `UPDATE i_meeting_disbursement_summary SET
			status = COALESCE(?, status),
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ? AND meeting_id = ?`

		statusStr := ""
		if req.Status != "" {
			statusStr = string(req.Status)
		}

		_, err := conn.Exec(query, statusStr, userAuth, req.ID, req.MeetingID)
		if err != nil {
			log.Error("Failed to update disbursement summary: %v", err)
			return nil, fmt.Errorf("failed to update disbursement summary: %v", err)
		}
		summaryID = *req.ID

		// Delete old expenses
		_, err = conn.Exec("DELETE FROM i_meeting_disbursement_expense WHERE disbursement_summary_id = ?", summaryID)
		if err != nil {
			log.Error("Failed to delete old expenses: %v", err)
		}

		// Delete old files
		_, err = conn.Exec("DELETE FROM i_meeting_disbursement_file WHERE disbursement_summary_id = ?", summaryID)
		if err != nil {
			log.Error("Failed to delete old files: %v", err)
		}
	} else {
		// INSERT
		query := `INSERT INTO i_meeting_disbursement_summary (
			meeting_id, status, created_by, updated_by
		) VALUES (?, ?, ?, ?)`

		statusStr := string(req.Status)
		if statusStr == "" {
			statusStr = string(models.DisbursementStatusPendingApproval)
		}

		res, err := conn.Exec(query, req.MeetingID, statusStr, userAuth, userAuth)
		if err != nil {
			log.Error("Failed to insert disbursement summary: %v", err)
			return nil, fmt.Errorf("failed to insert disbursement summary: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get disbursement summary ID: %v", err)
			return nil, fmt.Errorf("failed to get disbursement summary ID: %v", err)
		}
		summaryID = int(lastID)
	}

	// Insert expenses
	if len(req.Expenses) > 0 {
		for i, expense := range req.Expenses {
			insertExpenseQuery := `INSERT INTO i_meeting_disbursement_expense (
				disbursement_summary_id, expense_type_id, expense_type_name,
				budget_amount, actual_expense, display_order
			) VALUES (?, ?, ?, ?, ?, ?)`
			_, err := conn.Exec(insertExpenseQuery,
				summaryID, expense.ExpenseTypeID, expense.ExpenseTypeName,
				expense.BudgetAmount, expense.ActualExpense, i,
			)
			if err != nil {
				log.Error("Failed to insert expense: %v", err)
				// Continue with other expenses
			}
		}
	}

	// Insert files
	if len(req.ExpenseFileNames) > 0 && len(req.ExpenseFilePaths) > 0 {
		fileCount := len(req.ExpenseFileNames)
		if len(req.ExpenseFilePaths) < fileCount {
			fileCount = len(req.ExpenseFilePaths)
		}

		for i := 0; i < fileCount; i++ {
			insertFileQuery := `INSERT INTO i_meeting_disbursement_file (
				disbursement_summary_id, file_name, file_path, display_order
			) VALUES (?, ?, ?, ?)`
			_, err := conn.Exec(insertFileQuery, summaryID, req.ExpenseFileNames[i], req.ExpenseFilePaths[i], i)
			if err != nil {
				log.Error("Failed to insert file: %v", err)
				// Continue with other files
			}
		}
	}

	// Get the complete summary record
	summary, err := GetDisbursementSummary(conn, req.MeetingID)
	if err != nil {
		return nil, err
	}

	return summary, nil
}

// SubmitDisbursementForApproval updates disbursement summary status to pending_approval_level_1 or pending_approval_level_2
func SubmitDisbursementForApproval(conn *sql.DB, meetingID int, level int, userAuth int) (*models.DisbursementSummary, error) {

	// Check if disbursement summary exists
	summary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	// Determine status based on level
	var status models.DisbursementStatus
	if level == 1 {
		status = models.DisbursementStatusPendingApprovalLevel1
	} else if level == 2 {
		status = models.DisbursementStatusPendingApprovalLevel2
	} else {
		return nil, fmt.Errorf("invalid level: must be 1 or 2")
	}

	// Update status
	query := `UPDATE i_meeting_disbursement_summary SET
		status = ?,
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	_, err = conn.Exec(query, string(status), userAuth, summary.ID)
	if err != nil {
		log.Error("Failed to submit disbursement for approval: %v", err)
		return nil, fmt.Errorf("failed to submit disbursement for approval: %v", err)
	}

	// Get updated summary
	updatedSummary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	return updatedSummary, nil
}

// GetPendingDisbursementMeetings retrieves disbursement summaries with pending approval and their meetings
func GetPendingDisbursementMeetings(conn *sql.DB, params models.MeetingSearchParams) (*models.DisbursementSummaryListResponse, error) {
	var conditions []string
	var args []interface{}

	// Always include pending approval statuses
	conditions = append(conditions, `mds.status IN ('pending_approval_level_1', 'pending_approval_level_2')`)

	baseQuery := `SELECT 
		mds.id AS disbursement_id, mds.meeting_id, mds.status AS disbursement_status,
		mds.created_at AS disbursement_created_at, mds.updated_at AS disbursement_updated_at,
		im.id, committee_id, im.committee_number, im.committee_name, instance_number,
		start_date, end_date, start_time, end_time,
		host_organization, responsible_person, responsible_person_id,
		approver_level_1_id, approver_level_1_name,
		approver_level_2_id, approver_level_2_name,
		remarks, im.status,
		im.created_at, im.updated_at,
		iec.sub_committee_of
	FROM i_meeting_disbursement_summary mds
	INNER JOIN i_meeting im ON mds.meeting_id = im.id
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id`

	if params.StartDate != nil && *params.StartDate != "" {
		conditions = append(conditions, "im.start_date >= ?")
		args = append(args, *params.StartDate)
	}

	if params.EndDate != nil && *params.EndDate != "" {
		conditions = append(conditions, "im.start_date <= ?")
		args = append(args, *params.EndDate)
	}

	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + *params.Search + "%"
		conditions = append(conditions, "(im.committee_number LIKE ? OR im.committee_name LIKE ? OR im.instance_number LIKE ?)")
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if params.SubDepartmentID != nil && *params.SubDepartmentID > 0 {
		conditions = append(conditions, "SUBSTRING(im.host_organization, 1, 2) = ?")
		args = append(args, fmt.Sprintf("%02d", *params.SubDepartmentID))
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY im.start_date DESC, im.created_at DESC"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_meeting_disbursement_summary mds
	INNER JOIN i_meeting im ON mds.meeting_id = im.id
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count pending disbursement meetings: %v", err)
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
		return nil, fmt.Errorf("failed to query pending disbursement meetings: %v", err)
	}
	defer rows.Close()

	var results []models.DisbursementSummaryWithMeeting
	for rows.Next() {
		var summary models.DisbursementSummary
		var meeting models.Meeting
		var committeeID, responsiblePersonID sql.NullInt64
		var approverLevel1ID, approverLevel2ID sql.NullInt64
		var endDate, startTime, endTime sql.NullString
		var hostOrganization, responsiblePerson sql.NullString
		var approverLevel1Name, approverLevel2Name sql.NullString
		var remarks sql.NullString
		var subCommitteeOf sql.NullString
		var disbursementStatus sql.NullString
		var disbursementCreatedAt, disbursementUpdatedAt sql.NullTime
		var meetingCreatedAt, meetingUpdatedAt sql.NullTime
		var status string

		err := rows.Scan(
			&summary.ID, &summary.MeetingID, &disbursementStatus,
			&disbursementCreatedAt, &disbursementUpdatedAt,
			&meeting.ID, &committeeID, &meeting.CommitteeNumber, &meeting.CommitteeName, &meeting.InstanceNumber,
			&meeting.StartDate, &endDate, &startTime, &endTime,
			&hostOrganization, &responsiblePerson, &responsiblePersonID,
			&approverLevel1ID, &approverLevel1Name,
			&approverLevel2ID, &approverLevel2Name,
			&remarks, &status,
			&meetingCreatedAt, &meetingUpdatedAt,
			&subCommitteeOf,
		)
		if err != nil {
			log.Error("Failed to scan disbursement summary: %v", err)
			continue
		}

		// Map disbursement summary fields
		if disbursementStatus.Valid {
			summary.Status = models.DisbursementStatus(disbursementStatus.String)
		}
		if disbursementCreatedAt.Valid {
			val := disbursementCreatedAt.Time.Format("2006-01-02 15:04:05")
			summary.CreatedAt = &val
		}
		if disbursementUpdatedAt.Valid {
			val := disbursementUpdatedAt.Time.Format("2006-01-02 15:04:05")
			summary.UpdatedAt = &val
		}

		// Map meeting fields
		if committeeID.Valid {
			val := int(committeeID.Int64)
			meeting.CommitteeID = &val
		}
		if endDate.Valid {
			meeting.EndDate = &endDate.String
		}
		if startTime.Valid {
			meeting.StartTime = &startTime.String
		}
		if endTime.Valid {
			meeting.EndTime = &endTime.String
		}
		if hostOrganization.Valid {
			meeting.HostOrganization = &hostOrganization.String
		}
		if responsiblePerson.Valid {
			meeting.ResponsiblePerson = &responsiblePerson.String
		}
		if responsiblePersonID.Valid {
			val := int(responsiblePersonID.Int64)
			meeting.ResponsiblePersonID = &val
		}
		if approverLevel1ID.Valid {
			val := int(approverLevel1ID.Int64)
			meeting.ApproverLevel1ID = &val
		}
		if approverLevel1Name.Valid {
			meeting.ApproverLevel1Name = &approverLevel1Name.String
		}
		if approverLevel2ID.Valid {
			val := int(approverLevel2ID.Int64)
			meeting.ApproverLevel2ID = &val
		}
		if approverLevel2Name.Valid {
			meeting.ApproverLevel2Name = &approverLevel2Name.String
		}
		if remarks.Valid {
			meeting.Remarks = &remarks.String
		}
		meeting.Status = models.MeetingStatus(status)
		if meetingCreatedAt.Valid {
			val := meetingCreatedAt.Time.Format("2006-01-02 15:04:05")
			meeting.CreatedAt = &val
		}
		if meetingUpdatedAt.Valid {
			val := meetingUpdatedAt.Time.Format("2006-01-02 15:04:05")
			meeting.UpdatedAt = &val
		}
		if subCommitteeOf.Valid {
			meeting.SubCommitteeOf = &subCommitteeOf.String
		}

		// Check if meeting has expense
		hasExpense, err := GetHasMeetingExpense(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting expense: %v", err)
			continue
		}
		meeting.HasExpense = hasExpense

		// Check if meeting has participants
		hasParticipants, err := GetHasMeetingParticipants(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting participants: %v", err)
			continue
		}
		meeting.HasParticipants = hasParticipants

		// Get disbursement expenses
		if summary.ID != nil {
			expensesQuery := `SELECT 
				id, expense_type_id, expense_type_name,
				budget_amount, actual_expense
			FROM i_meeting_disbursement_expense
			WHERE disbursement_summary_id = ?
			ORDER BY display_order, id`

			expenseRows, err := conn.Query(expensesQuery, summary.ID)
			if err != nil && err != sql.ErrNoRows {
				log.Error("Failed to get expenses: %v", err)
			} else if err == nil {
				defer expenseRows.Close()
				var expenses []models.DisbursementExpense
				for expenseRows.Next() {
					var expense models.DisbursementExpense
					if err := expenseRows.Scan(
						&expense.ID, &expense.ExpenseTypeID, &expense.ExpenseTypeName,
						&expense.BudgetAmount, &expense.ActualExpense,
					); err != nil {
						log.Error("Failed to scan expense: %v", err)
						continue
					}
					expenses = append(expenses, expense)
				}
				summary.Expenses = expenses
			}

			// Get disbursement files
			filesQuery := `SELECT file_name, file_path
			FROM i_meeting_disbursement_file
			WHERE disbursement_summary_id = ?
			ORDER BY display_order, id`

			fileRows, err := conn.Query(filesQuery, summary.ID)
			if err != nil && err != sql.ErrNoRows {
				log.Error("Failed to get files: %v", err)
			} else if err == nil {
				defer fileRows.Close()
				var fileNames []string
				var filePaths []string
				for fileRows.Next() {
					var fileName, filePath string
					if err := fileRows.Scan(&fileName, &filePath); err != nil {
						log.Error("Failed to scan file: %v", err)
						continue
					}
					fileNames = append(fileNames, fileName)
					filePaths = append(filePaths, filePath)
				}
				summary.ExpenseFileNames = fileNames
				summary.ExpenseFilePaths = filePaths
			}
		}

		// Combine into DisbursementSummaryWithMeeting
		result := models.DisbursementSummaryWithMeeting{
			DisbursementSummary: summary,
			Meeting:             meeting,
		}

		results = append(results, result)
	}

	return &models.DisbursementSummaryListResponse{
		Data:  results,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// ApproveDisbursement approves disbursement at specified level
func ApproveDisbursement(conn *sql.DB, meetingID int, level int, remarks *string, userAuth int) (*models.DisbursementSummary, error) {
	summary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	// Determine next status based on level
	var newStatus models.DisbursementStatus
	if level == 1 {
		// After level 1 approval, move to level 2
		newStatus = models.DisbursementStatusPendingApprovalLevel2
	} else if level == 2 {
		// After level 2 approval, fully approved
		newStatus = models.DisbursementStatusApproved
	} else {
		return nil, fmt.Errorf("invalid level: must be 1 or 2")
	}

	query := `UPDATE i_meeting_disbursement_summary SET
		status = ?,
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	_, err = conn.Exec(query, string(newStatus), userAuth, summary.ID)
	if err != nil {
		log.Error("Failed to approve disbursement: %v", err)
		return nil, fmt.Errorf("failed to approve disbursement: %v", err)
	}

	updatedSummary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	return updatedSummary, nil
}

// DisapproveDisbursement disapproves disbursement at specified level
func DisapproveDisbursement(conn *sql.DB, meetingID int, level int, remarks string, userAuth int) (*models.DisbursementSummary, error) {
	summary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	query := `UPDATE i_meeting_disbursement_summary SET
		status = ?,
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	_, err = conn.Exec(query, string(models.DisbursementStatusDisapproved), userAuth, summary.ID)
	if err != nil {
		log.Error("Failed to disapprove disbursement: %v", err)
		return nil, fmt.Errorf("failed to disapprove disbursement: %v", err)
	}

	updatedSummary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	return updatedSummary, nil
}

// ReviewDisbursement sends disbursement back for review
func ReviewDisbursement(conn *sql.DB, meetingID int, level int, remarks string, userAuth int) (*models.DisbursementSummary, error) {
	summary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	query := `UPDATE i_meeting_disbursement_summary SET
		status = ?,
		updated_by = ?,
		updated_at = CURRENT_TIMESTAMP
	WHERE id = ?`

	_, err = conn.Exec(query, string(models.DisbursementStatusReview), userAuth, summary.ID)
	if err != nil {
		log.Error("Failed to review disbursement: %v", err)
		return nil, fmt.Errorf("failed to review disbursement: %v", err)
	}

	updatedSummary, err := GetDisbursementSummary(conn, meetingID)
	if err != nil {
		return nil, err
	}

	return updatedSummary, nil
}

// GetUpcomingInvitedMeetings retrieves meetings that user is invited to and not yet reached meeting date
func GetUpcomingInvitedMeetings(conn *sql.DB, userID int, params models.MeetingSearchParams) (*models.MeetingWithRegistrationListResponse, error) {
	var conditions []string
	var args []interface{}

	// Always include invited/approved status and future dates
	conditions = append(conditions, "im.status IN ('meeting_invited', 'approved','meeting_closed')")
	conditions = append(conditions, "im.start_date >= CURDATE()")

	// User must be in i_meeting_participant
	conditions = append(conditions, `EXISTS (
		SELECT 1 FROM i_meeting_participant imp 
		WHERE imp.meeting_id = im.id 
		AND imp.user_id = ?
	)`)
	args = append(args, userID)

	baseQuery := `SELECT 
		im.id, committee_id, im.committee_number, im.committee_name, im.meeting_subject, instance_number,
		start_date, end_date, start_time, end_time,
		host_organization, responsible_person, responsible_person_id,
		approver_level_1_id, approver_level_1_name,
		approver_level_2_id, approver_level_2_name,
		remarks, im.status,
		im.created_at, im.updated_at,
		iec.sub_committee_of,
		mds.status AS disbursement_status,
		COALESCE(mr.id, NULL) AS registration_id,
		COALESCE(mr.status, 'not_registered') AS registration_status,
		(SELECT COUNT(*) FROM i_meeting_registration WHERE meeting_id = im.id AND status = 'registered') AS registered_count
	FROM i_meeting im 
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id
	LEFT JOIN i_meeting_disbursement_summary mds ON im.id = mds.meeting_id
	LEFT JOIN i_meeting_registration mr ON im.id = mr.meeting_id AND mr.user_id = ?`

	if params.StartDate != nil && *params.StartDate != "" {
		conditions = append(conditions, "im.start_date >= ?")
		args = append(args, *params.StartDate)
	}

	if params.EndDate != nil && *params.EndDate != "" {
		conditions = append(conditions, "im.start_date <= ?")
		args = append(args, *params.EndDate)
	}

	if params.Search != nil && *params.Search != "" {
		searchTerm := "%" + *params.Search + "%"
		conditions = append(conditions, "(im.committee_number LIKE ? OR im.committee_name LIKE ? OR im.instance_number LIKE ?)")
		args = append(args, searchTerm, searchTerm, searchTerm)
	}

	if params.SubDepartmentID != nil && *params.SubDepartmentID > 0 {
		conditions = append(conditions, "SUBSTRING(im.host_organization, 1, 2) = ?")
		args = append(args, fmt.Sprintf("%02d", *params.SubDepartmentID))
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY im.start_date ASC, im.start_time ASC"

	// Count total
	countQuery := `SELECT COUNT(DISTINCT im.id)
	FROM i_meeting im 
	LEFT JOIN i_expert_committees iec ON im.committee_id = iec.id
	LEFT JOIN i_meeting_disbursement_summary mds ON im.id = mds.meeting_id`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count upcoming invited meetings: %v", err)
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

	// Add userID to args for LEFT JOIN
	queryArgs := append([]interface{}{userID}, args...)
	rows, err := conn.Query(baseQuery, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("failed to query upcoming invited meetings: %v", err)
	}
	defer rows.Close()

	var meetings []models.MeetingWithRegistration
	for rows.Next() {
		var meeting models.MeetingWithRegistration
		var committeeID, responsiblePersonID sql.NullInt64
		var approverLevel1ID, approverLevel2ID sql.NullInt64
		var endDate, startTime, endTime sql.NullString
		var hostOrganization, responsiblePerson, subCommitteeOf, meetingSubject sql.NullString
		var approverLevel1Name, approverLevel2Name sql.NullString
		var remarks sql.NullString
		var disbursementStatus sql.NullString
		var createdAt, updatedAt sql.NullTime
		var status string
		var registrationID sql.NullInt64
		var registrationStatus sql.NullString
		var registeredCount sql.NullInt64

		err := rows.Scan(
			&meeting.ID, &committeeID, &meeting.CommitteeNumber, &meeting.CommitteeName, &meetingSubject, &meeting.InstanceNumber,
			&meeting.StartDate, &endDate, &startTime, &endTime,
			&hostOrganization, &responsiblePerson, &responsiblePersonID,
			&approverLevel1ID, &approverLevel1Name,
			&approverLevel2ID, &approverLevel2Name,
			&remarks, &status,
			&createdAt, &updatedAt,
			&subCommitteeOf, &disbursementStatus,
			&registrationID, &registrationStatus, &registeredCount,
		)
		if err != nil {
			log.Error("Failed to scan meeting: %v", err)
			continue
		}

		if committeeID.Valid {
			val := int(committeeID.Int64)
			meeting.CommitteeID = &val
		}
		if endDate.Valid {
			meeting.EndDate = &endDate.String
		}
		if startTime.Valid {
			meeting.StartTime = &startTime.String
		}
		if endTime.Valid {
			meeting.EndTime = &endTime.String
		}
		if hostOrganization.Valid {
			meeting.HostOrganization = &hostOrganization.String
		}
		if responsiblePerson.Valid {
			meeting.ResponsiblePerson = &responsiblePerson.String
		}
		if meetingSubject.Valid {
			meeting.MeetingSubject = &meetingSubject.String
		}
		if responsiblePersonID.Valid {
			val := int(responsiblePersonID.Int64)
			meeting.ResponsiblePersonID = &val
		}
		if approverLevel1ID.Valid {
			val := int(approverLevel1ID.Int64)
			meeting.ApproverLevel1ID = &val
		}
		if approverLevel1Name.Valid {
			meeting.ApproverLevel1Name = &approverLevel1Name.String
		}
		if approverLevel2ID.Valid {
			val := int(approverLevel2ID.Int64)
			meeting.ApproverLevel2ID = &val
		}
		if approverLevel2Name.Valid {
			meeting.ApproverLevel2Name = &approverLevel2Name.String
		}
		if remarks.Valid {
			meeting.Remarks = &remarks.String
		}
		meeting.Status = models.MeetingStatus(status)
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			meeting.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			meeting.UpdatedAt = &val
		}
		if subCommitteeOf.Valid {
			meeting.SubCommitteeOf = &subCommitteeOf.String
		}
		if disbursementStatus.Valid {
			statusVal := models.DisbursementStatus(disbursementStatus.String)
			meeting.DisbursementStatus = &statusVal
		}

		// Set registration info
		if registrationID.Valid {
			val := int(registrationID.Int64)
			meeting.RegistrationID = &val
		}
		if registrationStatus.Valid {
			meeting.RegistrationStatus = &registrationStatus.String
		} else {
			status := "not_registered"
			meeting.RegistrationStatus = &status
		}
		if registeredCount.Valid {
			val := int(registeredCount.Int64)
			meeting.RegisteredCount = &val
		} else {
			val := 0
			meeting.RegisteredCount = &val
		}

		// Check if meeting has expense
		hasExpense, err := GetHasMeetingExpense(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting expense: %v", err)
			continue
		}
		meeting.HasExpense = hasExpense

		// Check if meeting has participants
		hasParticipants, err := GetHasMeetingParticipants(conn, *meeting.ID)
		if err != nil {
			log.Error("Failed to get has meeting participants: %v", err)
			continue
		}
		meeting.HasParticipants = hasParticipants

		meetings = append(meetings, meeting)
	}

	return &models.MeetingWithRegistrationListResponse{
		Data:  meetings,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetMeetingDetailsForAttendee retrieves meeting details with registration status for an attendee
func GetMeetingDetailsForAttendee(conn *sql.DB, meetingID int, userID int) (*models.MeetingWithRegistration, error) {
	// Get meeting details
	meeting, err := GetMeetingByID(conn, meetingID)
	if err != nil {
		return nil, err
	}

	result := &models.MeetingWithRegistration{
		Meeting: *meeting,
	}

	// Check if user is registered
	var registrationID sql.NullInt64
	var registrationStatus sql.NullString
	registrationQuery := `SELECT id, status FROM i_meeting_registration 
		WHERE meeting_id = ? AND user_id = ?`
	err = conn.QueryRow(registrationQuery, meetingID, userID).Scan(&registrationID, &registrationStatus)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check registration: %v", err)
	}

	if registrationID.Valid {
		val := int(registrationID.Int64)
		result.RegistrationID = &val
		if registrationStatus.Valid {
			result.RegistrationStatus = &registrationStatus.String
		} else {
			status := "registered"
			result.RegistrationStatus = &status
		}
	} else {
		status := "not_registered"
		result.RegistrationStatus = &status
	}

	// Get registered count (all participants for this meeting)
	var registeredCount int
	countQuery := `SELECT COUNT(*) FROM i_meeting_registration WHERE meeting_id = ? AND status = 'registered'`
	err = conn.QueryRow(countQuery, meetingID).Scan(&registeredCount)
	if err != nil {
		log.Error("Failed to get registered count: %v", err)
		registeredCount = 0
	}
	result.RegisteredCount = &registeredCount

	// Get total meeting attendees (from i_meeting_participant)
	var totalMeetingAttendees int
	attendeesQuery := `SELECT COUNT(*) FROM i_meeting_participant WHERE meeting_id = ?`
	err = conn.QueryRow(attendeesQuery, meetingID).Scan(&totalMeetingAttendees)
	if err != nil {
		log.Error("Failed to get total meeting attendees: %v", err)
		totalMeetingAttendees = 0
	}
	result.TotalMeetingAttendees = &totalMeetingAttendees

	return result, nil
}

// RegisterForMeeting registers a user for a meeting with optional followers
func RegisterForMeeting(conn *sql.DB, meetingID int, userID int, followerNames []string, createdBy int) (*models.RegisterResponse, error) {
	// Check if meeting exists and is valid for registration
	var meetingExists bool
	var startDate sql.NullString
	err := conn.QueryRow("SELECT EXISTS(SELECT 1 FROM i_meeting WHERE id = ?), start_date FROM i_meeting WHERE id = ?", meetingID, meetingID).Scan(&meetingExists, &startDate)
	if err != nil {
		return nil, fmt.Errorf("failed to check meeting: %v", err)
	}
	if !meetingExists {
		return nil, fmt.Errorf("meeting not found")
	}

	// Check if meeting date has passed
	if startDate.Valid {
		meetingDate, err := time.Parse("2006-01-02", startDate.String)
		if err == nil {
			today := time.Now().Truncate(24 * time.Hour)
			if meetingDate.Before(today) {
				return nil, fmt.Errorf("การประชุมนี้ยังไม่ถึงวันประชุม")
			}
		}
	}

	// Check if user is already registered
	var existingID sql.NullInt64
	err = conn.QueryRow("SELECT id FROM i_meeting_registration WHERE meeting_id = ? AND user_id = ?", meetingID, userID).Scan(&existingID)
	if err != nil && err != sql.ErrNoRows {
		return nil, fmt.Errorf("failed to check existing registration: %v", err)
	}
	if existingID.Valid {
		return nil, fmt.Errorf("คุณได้ลงทะเบียนเข้าร่วมประชุมนี้แล้ว")
	}

	// Check if user is invited (in i_meeting_participant)
	var isInvited bool
	err = conn.QueryRow("SELECT EXISTS(SELECT 1 FROM i_meeting_participant WHERE meeting_id = ? AND user_id = ?)", meetingID, userID).Scan(&isInvited)
	if err != nil {
		return nil, fmt.Errorf("failed to check invitation: %v", err)
	}
	if !isInvited {
		return nil, fmt.Errorf("คุณไม่มีสิทธิ์ลงทะเบียนเข้าร่วมประชุมนี้")
	}

	// Start transaction
	tx, err := conn.Begin()
	if err != nil {
		return nil, fmt.Errorf("failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Insert registration
	insertQuery := `INSERT INTO i_meeting_registration 
		(meeting_id, user_id, status, registered_at, created_by) 
		VALUES (?, ?, 'registered', NOW(), ?)`
	res, err := tx.Exec(insertQuery, meetingID, userID, createdBy)
	if err != nil {
		return nil, fmt.Errorf("failed to insert registration: %v", err)
	}

	registrationID, err := res.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("failed to get registration ID: %v", err)
	}

	// Insert followers
	if len(followerNames) > 0 {
		// Filter out empty names
		validFollowers := []string{}
		for _, name := range followerNames {
			if strings.TrimSpace(name) != "" {
				validFollowers = append(validFollowers, strings.TrimSpace(name))
			}
		}

		if len(validFollowers) > 0 {
			followerQuery := `INSERT INTO i_meeting_registration_follower 
				(meeting_registration_id, follower_name, display_order) 
				VALUES (?, ?, ?)`
			stmt, err := tx.Prepare(followerQuery)
			if err != nil {
				return nil, fmt.Errorf("failed to prepare follower query: %v", err)
			}
			defer stmt.Close()

			for i, name := range validFollowers {
				_, err = stmt.Exec(registrationID, name, i+1)
				if err != nil {
					return nil, fmt.Errorf("failed to insert follower: %v", err)
				}
			}
		}
	}

	// Commit transaction
	if err = tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %v", err)
	}

	// Get the complete registration record
	var registeredAt, createdAt, updatedAt sql.NullTime
	err = conn.QueryRow("SELECT registered_at, created_at, updated_at FROM i_meeting_registration WHERE id = ?", registrationID).Scan(&registeredAt, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get registration details: %v", err)
	}

	response := &models.RegisterResponse{
		ID:        func() *int { v := int(registrationID); return &v }(),
		MeetingID: meetingID,
		UserID:    userID,
		Status:    "registered",
	}

	if registeredAt.Valid {
		val := registeredAt.Time.Format("2006-01-02 15:04:05")
		response.RegisteredAt = &val
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		response.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		response.UpdatedAt = &val
	}

	// Get followers
	if len(followerNames) > 0 {
		rows, err := conn.Query("SELECT id, follower_name, display_order FROM i_meeting_registration_follower WHERE meeting_registration_id = ? ORDER BY display_order", registrationID)
		if err != nil {
			log.Error("Failed to get followers: %v", err)
		} else {
			defer rows.Close()
			var followers []models.RegistrationFollower
			for rows.Next() {
				var follower models.RegistrationFollower
				var id sql.NullInt64
				var displayOrder sql.NullInt64
				err := rows.Scan(&id, &follower.Name, &displayOrder)
				if err != nil {
					log.Error("Failed to scan follower: %v", err)
					continue
				}
				if id.Valid {
					val := int(id.Int64)
					follower.ID = &val
				}
				if displayOrder.Valid {
					val := int(displayOrder.Int64)
					follower.DisplayOrder = &val
				}
				followers = append(followers, follower)
			}
			response.Followers = followers
		}
	}

	return response, nil
}
