package repository

import (
	"database/sql"
	"estisi/log"
	"estisi/models"
	"fmt"
	"strings"
)

func UpsertExpert(conn *sql.DB, req models.Expert, userAuth int) (*models.Expert, error) {
	useIdCardAddress := 0
	if req.ContactAddress.UseIdCardAddress {
		useIdCardAddress = 1
	}

	var expertID int

	if req.ID != nil && *req.ID > 0 {
		// ---------- UPDATE ----------
		query := `UPDATE i_experts SET
            id_card = ?,
            prefix = ?,
            first_name = ?,
            last_name = ?,
            phone = ?,
            mobile = ?,
            email = ?,
            cv_file = ?,
            id_card_address_house_no = ?,
            id_card_address_moo = ?,
            id_card_address_soi = ?,
            id_card_address_road = ?,
            id_card_address_subdistrict = ?,
			id_card_address_subdistrict_name = ?,
            id_card_address_district = ?,
			id_card_address_district_name = ?,
            id_card_address_province = ?,
			id_card_address_province_name = ?,
            id_card_address_postal_code = ?,
            use_id_card_address = ?,
            contact_address_house_no = ?,
            contact_address_moo = ?,
            contact_address_soi = ?,
            contact_address_road = ?,
            contact_address_subdistrict = ?,
			contact_address_subdistrict_name = ?,
            contact_address_district = ?,
			contact_address_district_name = ?,
            contact_address_province = ?,
			contact_address_province_name = ?,
            contact_address_postal_code = ?,
            updated_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`

		_, err := conn.Exec(query,
			req.IDCard, req.Prefix, req.FirstName, req.LastName,
			req.Phone, req.Mobile, req.Email, req.CVFile,
			req.IDCardAddress.HouseNo, req.IDCardAddress.Moo, req.IDCardAddress.Soi, req.IDCardAddress.Road,
			req.IDCardAddress.SubDistrict, req.IDCardAddress.SubDistrictName, req.IDCardAddress.District, req.IDCardAddress.DistrictName, req.IDCardAddress.Province, req.IDCardAddress.ProvinceName, req.IDCardAddress.PostalCode,
			useIdCardAddress,
			req.ContactAddress.HouseNo, req.ContactAddress.Moo, req.ContactAddress.Soi, req.ContactAddress.Road,
			req.ContactAddress.SubDistrict, req.ContactAddress.SubDistrictName, req.ContactAddress.District, req.ContactAddress.DistrictName, req.ContactAddress.Province, req.ContactAddress.ProvinceName, req.ContactAddress.PostalCode,
			userAuth,
			req.ID,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to update expert: %v", err)
		}
		expertID = *req.ID
	} else {
		// ---------- INSERT ----------
		status := "active"

		// Handle userID - convert *int to interface{} for nil handling
		var userID interface{}
		if req.UserID != nil && *req.UserID > 0 {
			userID = *req.UserID
		} else {
			userID = nil // Will become NULL in DB
		}

		query := `INSERT INTO i_experts (
            user_id, id_card, prefix, first_name, last_name, phone, mobile, email, cv_file, status,
            id_card_address_house_no, id_card_address_moo, id_card_address_soi, id_card_address_road,
            id_card_address_subdistrict, id_card_address_subdistrict_name, id_card_address_district, id_card_address_district_name, id_card_address_province, id_card_address_province_name, id_card_address_postal_code,
            use_id_card_address, contact_address_house_no, contact_address_moo, contact_address_soi, contact_address_road,
            contact_address_subdistrict, contact_address_subdistrict_name, contact_address_district, contact_address_district_name, contact_address_province, contact_address_province_name, contact_address_postal_code,
            updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			userID, req.IDCard, req.Prefix, req.FirstName, req.LastName,
			req.Phone, req.Mobile, req.Email, req.CVFile, status,
			req.IDCardAddress.HouseNo, req.IDCardAddress.Moo, req.IDCardAddress.Soi, req.IDCardAddress.Road,
			req.IDCardAddress.SubDistrict, req.IDCardAddress.SubDistrictName, req.IDCardAddress.District, req.IDCardAddress.DistrictName, req.IDCardAddress.Province, req.IDCardAddress.ProvinceName, req.IDCardAddress.PostalCode,
			useIdCardAddress,
			req.ContactAddress.HouseNo, req.ContactAddress.Moo, req.ContactAddress.Soi, req.ContactAddress.Road,
			req.ContactAddress.SubDistrict, req.ContactAddress.SubDistrictName, req.ContactAddress.District, req.ContactAddress.DistrictName, req.ContactAddress.Province, req.ContactAddress.ProvinceName, req.ContactAddress.PostalCode,
			userAuth,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to insert expert: %v", err)
		}

		lastID, _ := res.LastInsertId()
		expertID = int(lastID)
	}

	// upsert ตารางลูก
	if err := upsertExpertRelatedData(conn, expertID, req); err != nil {
		return nil, fmt.Errorf("failed to upsert related data: %v", err)
	}

	return GetExpertByID(conn, expertID)
}

// // UpsertExpert creates a new expert record or updates an existing one using ON DUPLICATE KEY UPDATE
// func UpsertExpert(conn *sql.DB, req models.Expert, userAuth int) (*models.Expert, error) {
// 	// if req.UserID <= 0 {
// 	// 	return nil, fmt.Errorf("user_id is required for upsert")
// 	// }

// 	var userID interface{}
// 	if req.UserID != nil && *req.UserID > 0 {
// 		userID = *req.UserID
// 	} else {
// 		userID = nil // จะกลายเป็น NULL ใน DB
// 	}

// 	useIdCardAddress := 0
// 	if req.ContactAddress.UseIdCardAddress {
// 		useIdCardAddress = 1
// 	}

// 	// Use INSERT ... ON DUPLICATE KEY UPDATE based on UNIQUE KEY (user_id)
// 	query := `INSERT INTO i_experts (
// 		user_id, id_card, prefix, first_name, last_name, phone, mobile, email, cv_file, status,
// 		id_card_address_house_no, id_card_address_moo, id_card_address_soi, id_card_address_road,
// 		id_card_address_subdistrict, id_card_address_district, id_card_address_province, id_card_address_postal_code,
// 		use_id_card_address, contact_address_house_no, contact_address_moo, contact_address_soi, contact_address_road,
// 		contact_address_subdistrict, contact_address_district, contact_address_province, contact_address_postal_code
// 	) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// 	ON DUPLICATE KEY UPDATE
// 		id_card = VALUES(id_card),
// 		prefix = VALUES(prefix),
// 		first_name = VALUES(first_name),
// 		last_name = VALUES(last_name),
// 		phone = VALUES(phone),
// 		mobile = VALUES(mobile),
// 		email = VALUES(email),
// 		cv_file = VALUES(cv_file),
// 		status = VALUES(status),
// 		id_card_address_house_no = VALUES(id_card_address_house_no),
// 		id_card_address_moo = VALUES(id_card_address_moo),
// 		id_card_address_soi = VALUES(id_card_address_soi),
// 		id_card_address_road = VALUES(id_card_address_road),
// 		id_card_address_subdistrict = VALUES(id_card_address_subdistrict),
// 		id_card_address_district = VALUES(id_card_address_district),
// 		id_card_address_province = VALUES(id_card_address_province),
// 		id_card_address_postal_code = VALUES(id_card_address_postal_code),
// 		use_id_card_address = VALUES(use_id_card_address),
// 		contact_address_house_no = VALUES(contact_address_house_no),
// 		contact_address_moo = VALUES(contact_address_moo),
// 		contact_address_soi = VALUES(contact_address_soi),
// 		contact_address_road = VALUES(contact_address_road),
// 		contact_address_subdistrict = VALUES(contact_address_subdistrict),
// 		contact_address_district = VALUES(contact_address_district),
// 		contact_address_province = VALUES(contact_address_province),
// 		contact_address_postal_code = VALUES(contact_address_postal_code),
// 		updated_at = CURRENT_TIMESTAMP,
// 		updated_by = ?`

// 	status := "active" // Default status

// 	result, err := conn.Exec(query,
// 		userID, req.IDCard, req.Prefix, req.FirstName, req.LastName, req.Phone, req.Mobile, req.Email, req.CVFile, status,
// 		req.IDCardAddress.HouseNo, req.IDCardAddress.Moo, req.IDCardAddress.Soi, req.IDCardAddress.Road,
// 		req.IDCardAddress.SubDistrict, req.IDCardAddress.District, req.IDCardAddress.Province, req.IDCardAddress.PostalCode,
// 		useIdCardAddress,
// 		req.ContactAddress.HouseNo, req.ContactAddress.Moo, req.ContactAddress.Soi, req.ContactAddress.Road,
// 		req.ContactAddress.SubDistrict, req.ContactAddress.District, req.ContactAddress.Province, req.ContactAddress.PostalCode,
// 		userAuth,
// 	)

// 	if err != nil {
// 		return nil, fmt.Errorf("failed to upsert expert: %v", err)
// 	}

// 	// Get the expert ID (either newly inserted or existing)
// 	expertID, err := result.LastInsertId()
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get expert after upsert: %v", err)
// 	}
// 	// Handle related tables (educations, trainings, work_experiences, bank_accounts)
// 	if err := upsertExpertRelatedData(conn, int(expertID), req); err != nil {
// 		return nil, fmt.Errorf("failed to upsert related data: %v", err)
// 	}

// 	// Return updated expert with all related data
// 	return GetExpertByID(conn, int(expertID))
// }

// upsertExpertRelatedData handles related tables (educations, trainings, work_experiences, bank_accounts)
func upsertExpertRelatedData(conn *sql.DB, expertID int, req models.Expert) error {
	// Delete existing related data and insert new ones
	// This approach ensures data consistency

	// Handle educations
	if len(req.Educations) > 0 {
		// Delete existing educations
		if _, err := conn.Exec("DELETE FROM i_expert_educations WHERE expert_id = ?", expertID); err != nil {
			return fmt.Errorf("failed to delete existing educations: %v", err)
		}

		// Insert new educations
		for _, edu := range req.Educations {
			query := `INSERT INTO i_expert_educations (expert_id, graduation_year, education_level, institution, qualification)
				VALUES (?, ?, ?, ?, ?)`
			if _, err := conn.Exec(query, expertID, edu.GraduationYear, edu.EducationLevel, edu.Institution, edu.Qualification); err != nil {
				return fmt.Errorf("failed to insert education: %v", err)
			}
		}
	}

	// Handle trainings
	if len(req.Trainings) > 0 {
		// Delete existing trainings
		if _, err := conn.Exec("DELETE FROM i_expert_trainings WHERE expert_id = ?", expertID); err != nil {
			return fmt.Errorf("failed to delete existing trainings: %v", err)
		}

		// Insert new trainings
		for _, training := range req.Trainings {
			query := `INSERT INTO i_expert_trainings (expert_id, details) VALUES (?, ?)`
			if _, err := conn.Exec(query, expertID, training.Details); err != nil {
				return fmt.Errorf("failed to insert training: %v", err)
			}
		}
	}

	// Handle work experiences
	if len(req.WorkExperiences) > 0 {
		// Delete existing work experiences
		if _, err := conn.Exec("DELETE FROM i_expert_work_experiences WHERE expert_id = ?", expertID); err != nil {
			return fmt.Errorf("failed to delete existing work experiences: %v", err)
		}

		// Insert new work experiences
		for _, workExp := range req.WorkExperiences {
			query := `INSERT INTO i_expert_work_experiences (expert_id, start_year, end_year, details, responsibility)
				VALUES (?, ?, ?, ?, ?)`
			if _, err := conn.Exec(query, expertID, workExp.StartYear, workExp.EndYear, workExp.Details, workExp.Responsibility); err != nil {
				return fmt.Errorf("failed to insert work experience: %v", err)
			}
		}
	}

	// Handle bank accounts
	if len(req.BankAccount) > 0 {
		// Delete existing bank accounts
		if _, err := conn.Exec("DELETE FROM i_expert_bank_accounts WHERE expert_id = ?", expertID); err != nil {
			return fmt.Errorf("failed to delete existing bank accounts: %v", err)
		}

		// Insert new bank accounts
		for _, bankAcc := range req.BankAccount {
			query := `INSERT INTO i_expert_bank_accounts (expert_id, bank_account_number, bank, bank_branch, account_type, status, accountPhotoFile, ktbFile)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
			status := bankAcc.Status
			if status == "" {
				status = "active"
			}
			if _, err := conn.Exec(query, expertID, bankAcc.BankAccountNumber, bankAcc.Bank, bankAcc.BankBranch, bankAcc.AccountType, status, bankAcc.AccountPhotoFile, bankAcc.KtbFile); err != nil {
				return fmt.Errorf("failed to insert bank account: %v", err)
			}
		}
	}

	return nil
}

// loadExpertRelatedData loads related data (educations, trainings, work_experiences, bank_accounts)
func loadExpertRelatedData(conn *sql.DB, expert *models.Expert) error {
	if expert.ID == nil {
		return fmt.Errorf("expert ID is nil")
	}
	expertID := *expert.ID

	// Load educations
	eduRows, err := conn.Query(`SELECT id, expert_id, graduation_year, education_level, institution, qualification, created_at, updated_at
		FROM i_expert_educations WHERE expert_id = ? ORDER BY id`, expertID)
	if err != nil {
		return fmt.Errorf("failed to load educations: %v", err)
	}
	defer eduRows.Close()

	for eduRows.Next() {
		var edu models.EducationData
		var id, expertID sql.NullInt64
		var graduationYear sql.NullString
		var educationLevel, institution sql.NullInt64
		var qualification, createdAt, updatedAt sql.NullString

		if err := eduRows.Scan(&id, &expertID, &graduationYear, &educationLevel, &institution, &qualification, &createdAt, &updatedAt); err != nil {
			return fmt.Errorf("failed to scan education: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			edu.ID = &idVal
		}
		if expertID.Valid {
			expertIDVal := int(expertID.Int64)
			edu.ExpertID = &expertIDVal
		}
		if graduationYear.Valid {
			edu.GraduationYear = graduationYear.String
		}
		if educationLevel.Valid {
			edu.EducationLevel = int(educationLevel.Int64)
		}
		if institution.Valid {
			edu.Institution = int(institution.Int64)
		}
		if qualification.Valid {
			edu.Qualification = qualification.String
		}
		if createdAt.Valid {
			edu.CreatedAt = &createdAt.String
		}
		if updatedAt.Valid {
			edu.UpdatedAt = &updatedAt.String
		}
		expert.Educations = append(expert.Educations, edu)
	}

	// Load trainings
	trainingRows, err := conn.Query(`SELECT id, expert_id, details, created_at, updated_at
		FROM i_expert_trainings WHERE expert_id = ? ORDER BY id`, expertID)
	if err != nil {
		return fmt.Errorf("failed to load trainings: %v", err)
	}
	defer trainingRows.Close()

	for trainingRows.Next() {
		var training models.TrainingData
		var id, expertID sql.NullInt64
		var details, createdAt, updatedAt sql.NullString

		if err := trainingRows.Scan(&id, &expertID, &details, &createdAt, &updatedAt); err != nil {
			return fmt.Errorf("failed to scan training: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			training.ID = &idVal
		}
		if expertID.Valid {
			expertIDVal := int(expertID.Int64)
			training.ExpertID = &expertIDVal
		}
		if details.Valid {
			training.Details = details.String
		}
		if createdAt.Valid {
			training.CreatedAt = &createdAt.String
		}
		if updatedAt.Valid {
			training.UpdatedAt = &updatedAt.String
		}
		expert.Trainings = append(expert.Trainings, training)
	}

	// Load work experiences
	workExpRows, err := conn.Query(`SELECT id, expert_id, start_year, end_year, details, responsibility, created_at, updated_at
		FROM i_expert_work_experiences WHERE expert_id = ? ORDER BY id`, expertID)
	if err != nil {
		return fmt.Errorf("failed to load work experiences: %v", err)
	}
	defer workExpRows.Close()

	for workExpRows.Next() {
		var workExp models.WorkExperienceData
		var id, expertID sql.NullInt64
		var startYear, endYear, details, responsibility, createdAt, updatedAt sql.NullString

		if err := workExpRows.Scan(&id, &expertID, &startYear, &endYear, &details, &responsibility, &createdAt, &updatedAt); err != nil {
			return fmt.Errorf("failed to scan work experience: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			workExp.ID = &idVal
		}
		if expertID.Valid {
			expertIDVal := int(expertID.Int64)
			workExp.ExpertID = &expertIDVal
		}
		if startYear.Valid {
			workExp.StartYear = startYear.String
		}
		if endYear.Valid {
			workExp.EndYear = endYear.String
		}
		if details.Valid {
			workExp.Details = details.String
		}
		if responsibility.Valid {
			workExp.Responsibility = responsibility.String
		}
		if createdAt.Valid {
			workExp.CreatedAt = &createdAt.String
		}
		if updatedAt.Valid {
			workExp.UpdatedAt = &updatedAt.String
		}
		expert.WorkExperiences = append(expert.WorkExperiences, workExp)
	}

	// Load bank accounts
	bankAccRows, err := conn.Query(`SELECT id, expert_id, bank_account_number, bank, bank_branch, account_type, status, accountPhotoFile, ktbFile, created_at, updated_at
		FROM i_expert_bank_accounts WHERE expert_id = ? ORDER BY id`, expertID)
	if err != nil {
		return fmt.Errorf("failed to load bank accounts: %v", err)
	}
	defer bankAccRows.Close()

	for bankAccRows.Next() {
		var bankAcc models.BankAccountData
		var id, expertID, bank, accountType sql.NullInt64
		var bankAccountNumber, bankBranch, status, accountPhotoFile, ktbFile, createdAt, updatedAt sql.NullString

		if err := bankAccRows.Scan(&id, &expertID, &bankAccountNumber, &bank, &bankBranch, &accountType, &status, &accountPhotoFile, &ktbFile, &createdAt, &updatedAt); err != nil {
			return fmt.Errorf("failed to scan bank account: %v", err)
		}

		if id.Valid {
			idVal := int(id.Int64)
			bankAcc.ID = &idVal
		}
		if expertID.Valid {
			expertIDVal := int(expertID.Int64)
			bankAcc.ExpertID = &expertIDVal
		}
		if bankAccountNumber.Valid {
			bankAcc.BankAccountNumber = bankAccountNumber.String
		}
		if bank.Valid {
			bankAcc.Bank = int(bank.Int64)
		}
		if bankBranch.Valid {
			bankAcc.BankBranch = bankBranch.String
		}
		if accountType.Valid {
			bankAcc.AccountType = int(accountType.Int64)
		}
		if status.Valid {
			bankAcc.Status = status.String
		}
		if accountPhotoFile.Valid {
			bankAcc.AccountPhotoFile = accountPhotoFile.String
		}
		if ktbFile.Valid {
			bankAcc.KtbFile = ktbFile.String
		}
		if createdAt.Valid {
			bankAcc.CreatedAt = &createdAt.String
		}
		if updatedAt.Valid {
			bankAcc.UpdatedAt = &updatedAt.String
		}
		expert.BankAccount = append(expert.BankAccount, bankAcc)
	}

	return nil
}

// DeleteExpert soft deletes an expert record (sets status to 'inactive')
func DeleteExpert(conn *sql.DB, id int, userId int) error {
	query := `UPDATE i_experts SET status = 'inactive', updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'`

	result, err := conn.Exec(query, userId, id)
	if err != nil {
		return fmt.Errorf("failed to delete expert: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("expert not found or already deleted")
	}

	return nil
}

// getExpertByCondition is a helper function to retrieve expert with WHERE condition
func getExpertByCondition(conn *sql.DB, whereClause string, args ...interface{}) (*models.Expert, error) {
	// query := `SELECT id, user_id, id_card, prefix, first_name, last_name, phone, mobile, email, cv_file, status,
	// 	id_card_address_house_no, id_card_address_moo, id_card_address_soi, id_card_address_road,
	// 	id_card_address_subdistrict, id_card_address_district, id_card_address_province, id_card_address_postal_code,
	// 	use_id_card_address, contact_address_house_no, contact_address_moo, contact_address_soi, contact_address_road,
	// 	contact_address_subdistrict, contact_address_district, contact_address_province, contact_address_postal_code,
	// 	created_at, updated_at, update_by
	// 	FROM i_experts WHERE ` + whereClause

	query := `SELECT ie.id, user_id, su.contact_tax_id, su.contact_prefix_name , su.contact_first_name , su.contact_last_name , su.contact_tel , su.contact_phone_number , su.email, cv_file, status,
		su.address_no , su.moo , su.soi , su.street ,
		id_card_address_subdistrict,su.subdistrict , id_card_address_district,su.district , id_card_address_province,su.province , su.zipcode ,
		use_id_card_address, su.contact_address_no , su.contact_moo , su.contact_soi , su.contact_street ,
		contact_address_subdistrict,su.contact_subdistrict , contact_address_district,su.contact_district , contact_address_province,su.contact_province , su.contact_zipcode ,
		created_at, updated_at, updated_by
		FROM i_experts ie  
		LEFT JOIN sso_users su on  ie.user_id = su.id 
		WHERE status = 'active' AND ` + whereClause

	expert := &models.Expert{}
	var expertID, userId, prefix sql.NullInt64
	var idCard, firstName, lastName, phone, mobile, email, cvFile, status sql.NullString
	var idCardHouseNo, idCardMoo, idCardSoi, idCardRoad, idCardPostalCode sql.NullString
	var idCardSubdistrict, idCardDistrict, idCardProvince sql.NullInt64
	var useIdCardAddress sql.NullBool
	var contactHouseNo, contactMoo, contactSoi, contactRoad, contactPostalCode sql.NullString
	var contactSubdistrict, contactDistrict, contactProvince sql.NullInt64
	var createdAt, updatedAt sql.NullTime
	var updateBy sql.NullInt64
	var subDistictName, districtName, provinceName, contactSubdistrictName, contactDistrictName, contactProvinceName sql.NullString
	err := conn.QueryRow(query, args...).Scan(
		&expertID, &userId, &idCard, &prefix, &firstName, &lastName, &phone, &mobile, &email, &cvFile, &status,
		&idCardHouseNo, &idCardMoo, &idCardSoi, &idCardRoad,
		&idCardSubdistrict, &subDistictName, &idCardDistrict, &districtName, &idCardProvince, &provinceName, &idCardPostalCode,
		&useIdCardAddress,
		&contactHouseNo, &contactMoo, &contactSoi, &contactRoad,
		&contactSubdistrict, &contactSubdistrictName, &contactDistrict, &contactDistrictName, &contactProvince, &contactProvinceName, &contactPostalCode,
		&createdAt, &updatedAt,
		&updateBy,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("expert not found")
		}
		return nil, fmt.Errorf("failed to get expert: %v", err)
	}

	// Map basic fields
	if expertID.Valid {
		expertIDVal := int(expertID.Int64)
		expert.ID = &expertIDVal
	}
	if userId.Valid {
		userIDVal := int(userId.Int64)
		expert.UserID = &userIDVal
	}
	if idCard.Valid {
		expert.IDCard = idCard.String
	}
	if prefix.Valid {
		expert.Prefix = int(prefix.Int64)
	}
	if firstName.Valid {
		expert.FirstName = firstName.String
	}
	if lastName.Valid {
		expert.LastName = lastName.String
	}
	if phone.Valid {
		expert.Phone = phone.String
	}
	if mobile.Valid {
		expert.Mobile = mobile.String
	}
	if email.Valid {
		expert.Email = email.String
	}
	if cvFile.Valid {
		expert.CVFile = cvFile.String
	}
	if createdAt.Valid {
		createdAtStr := createdAt.Time.Format("2006-01-02 15:04:05")
		expert.CreatedAt = &createdAtStr
	}
	if updatedAt.Valid {
		updatedAtStr := updatedAt.Time.Format("2006-01-02 15:04:05")
		expert.UpdatedAt = &updatedAtStr
	}

	// Map address fields
	if idCardHouseNo.Valid {
		expert.IDCardAddress.HouseNo = idCardHouseNo.String
	}
	if idCardMoo.Valid {
		expert.IDCardAddress.Moo = idCardMoo.String
	}
	if idCardSoi.Valid {
		expert.IDCardAddress.Soi = idCardSoi.String
	}
	if idCardRoad.Valid {
		expert.IDCardAddress.Road = idCardRoad.String
	}
	if idCardSubdistrict.Valid {
		expert.IDCardAddress.SubDistrict = int(idCardSubdistrict.Int64)
	}
	if idCardDistrict.Valid {
		expert.IDCardAddress.District = int(idCardDistrict.Int64)
	}
	if idCardProvince.Valid {
		expert.IDCardAddress.Province = int(idCardProvince.Int64)
	}
	if idCardPostalCode.Valid {
		expert.IDCardAddress.PostalCode = idCardPostalCode.String
	}

	if useIdCardAddress.Valid {
		expert.ContactAddress.UseIdCardAddress = useIdCardAddress.Bool
	}
	if contactHouseNo.Valid {
		expert.ContactAddress.HouseNo = contactHouseNo.String
	}
	if contactMoo.Valid {
		expert.ContactAddress.Moo = contactMoo.String
	}
	if contactSoi.Valid {
		expert.ContactAddress.Soi = contactSoi.String
	}
	if contactRoad.Valid {
		expert.ContactAddress.Road = contactRoad.String
	}
	if contactSubdistrict.Valid {
		expert.ContactAddress.SubDistrict = int(contactSubdistrict.Int64)
	}
	if contactDistrict.Valid {
		expert.ContactAddress.District = int(contactDistrict.Int64)
	}
	if contactProvince.Valid {
		expert.ContactAddress.Province = int(contactProvince.Int64)
	}
	if contactPostalCode.Valid {
		expert.ContactAddress.PostalCode = contactPostalCode.String
	}
	if updateBy.Valid {
		expert.UpdateBy = int(updateBy.Int64)
	}

	if subDistictName.Valid {
		expert.IDCardAddress.SubDistrictName = subDistictName.String
	}
	if districtName.Valid {
		expert.IDCardAddress.DistrictName = districtName.String
	}
	if provinceName.Valid {
		expert.IDCardAddress.ProvinceName = provinceName.String
	}
	if contactSubdistrictName.Valid {
		expert.ContactAddress.SubDistrictName = contactSubdistrictName.String
	}
	if contactDistrictName.Valid {
		expert.ContactAddress.DistrictName = contactDistrictName.String
	}
	if contactProvinceName.Valid {
		expert.ContactAddress.ProvinceName = contactProvinceName.String
	}
	// Load related data
	if err := loadExpertRelatedData(conn, expert); err != nil {
		return nil, fmt.Errorf("failed to load related data: %v", err)
	}

	return expert, nil
}

// GetExpertByID retrieves an expert by ID with all related data
func GetExpertByID(conn *sql.DB, id int) (*models.Expert, error) {
	return getExpertByCondition(conn, "ie.id = ?", id)
}

// GetExpertByUserID retrieves an expert by user_id with all related data
func GetExpertByUserID(conn *sql.DB, userID int) (*models.Expert, error) {
	return getExpertByCondition(conn, "ie.user_id = ?", userID)
}

// GetExperts retrieves experts with filtering and pagination
func GetExperts(conn *sql.DB, params models.ExpertSearchParams) (*models.ExpertListResponse, error) {
	var conditions []string
	var args []interface{}

	// baseQuery := `SELECT id, user_id, id_card, prefix, first_name, last_name, phone, mobile, email, cv_file, status,
	// 	id_card_address_house_no, id_card_address_moo, id_card_address_soi, id_card_address_road,
	// 	id_card_address_subdistrict, id_card_address_district, id_card_address_province, id_card_address_postal_code,
	// 	use_id_card_address, contact_address_house_no, contact_address_moo, contact_address_soi, contact_address_road,
	// 	contact_address_subdistrict, contact_address_district, contact_address_province, contact_address_postal_code,
	// 	created_at, updated_at, update_by
	// 	FROM i_experts
	// 	WHERE status = 'active'`

	baseQuery := `SELECT ie.id, user_id, su.contact_tax_id, su.contact_prefix_name , su.contact_first_name , su.contact_last_name , su.contact_tel , su.contact_phone_number , su.email, cv_file, status,
		su.address_no , su.moo , su.soi , su.street ,
		id_card_address_subdistrict,su.subdistrict , id_card_address_district,su.district , id_card_address_province,su.province , su.zipcode ,
		use_id_card_address, su.contact_address_no , su.contact_moo , su.contact_soi , su.contact_street ,
		contact_address_subdistrict,su.contact_subdistrict , contact_address_district,su.contact_district , contact_address_province,su.contact_province , su.contact_zipcode ,
		created_at, updated_at, updated_by
		FROM i_experts ie  
		LEFT JOIN sso_users su on  ie.user_id = su.id 
		WHERE status = 'active'`

	// Search by name (first_name or last_name) - comma-separated
	if params.Name != nil && *params.Name != "" {
		names := strings.Split(*params.Name, ",")
		var nameConditions []string
		for _, name := range names {
			name = strings.TrimSpace(name)
			if name != "" {
				nameConditions = append(nameConditions, "(first_name LIKE ? OR last_name LIKE ?)")
				searchPattern := "%" + name + "%"
				args = append(args, searchPattern, searchPattern)
			}
		}
		if len(nameConditions) > 0 {
			conditions = append(conditions, "("+strings.Join(nameConditions, " OR ")+")")
		}
	}

	// Search by email - comma-separated
	if params.Email != nil && *params.Email != "" {
		emails := strings.Split(*params.Email, ",")
		var emailConditions []string
		for _, email := range emails {
			email = strings.TrimSpace(email)
			if email != "" {
				emailConditions = append(emailConditions, "email LIKE ?")
				searchPattern := "%" + email + "%"
				args = append(args, searchPattern)
			}
		}
		if len(emailConditions) > 0 {
			conditions = append(conditions, "("+strings.Join(emailConditions, " OR ")+")")
		}
	}

	// Search by ID card - comma-separated
	if params.IDCard != nil && *params.IDCard != "" {
		idCards := strings.Split(*params.IDCard, ",")
		var idCardConditions []string
		for _, idCard := range idCards {
			idCard = strings.TrimSpace(idCard)
			if idCard != "" {
				idCardConditions = append(idCardConditions, "id_card LIKE ?")
				searchPattern := "%" + idCard + "%"
				args = append(args, searchPattern)
			}
		}
		if len(idCardConditions) > 0 {
			conditions = append(conditions, "("+strings.Join(idCardConditions, " OR ")+")")
		}
	}

	// Filter by status
	if params.Status != nil && *params.Status != "" {
		conditions = append(conditions, "status = ?")
		args = append(args, *params.Status)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY id DESC"

	// Count total
	countQuery := `SELECT COUNT(*) FROM i_experts WHERE status = 'active'`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count experts: %v", err)
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
		return nil, fmt.Errorf("failed to query experts: %v", err)
	}
	defer rows.Close()

	var experts []models.Expert
	for rows.Next() {
		var expert models.Expert
		var expertID, userId, prefix sql.NullInt64
		var idCard, firstName, lastName, phone, mobile, email, cvFile, status sql.NullString
		var idCardHouseNo, idCardMoo, idCardSoi, idCardRoad, idCardPostalCode sql.NullString
		var idCardSubdistrict, idCardDistrict, idCardProvince sql.NullInt64
		var useIdCardAddress sql.NullBool
		var contactHouseNo, contactMoo, contactSoi, contactRoad, contactPostalCode sql.NullString
		var contactSubdistrict, contactDistrict, contactProvince sql.NullInt64
		var createdAt, updatedAt sql.NullTime
		var updateBy sql.NullInt64
		var subDistictName, districtName, provinceName, contactSubdistrictName, contactDistrictName, contactProvinceName sql.NullString

		err := rows.Scan(
			&expertID, &userId, &idCard, &prefix, &firstName, &lastName, &phone, &mobile, &email, &cvFile, &status,
			&idCardHouseNo, &idCardMoo, &idCardSoi, &idCardRoad,
			&idCardSubdistrict, &subDistictName, &idCardDistrict, &districtName, &idCardProvince, &provinceName, &idCardPostalCode,
			&useIdCardAddress,
			&contactHouseNo, &contactMoo, &contactSoi, &contactRoad,
			&contactSubdistrict, &contactSubdistrictName, &contactDistrict, &contactDistrictName, &contactProvince, &contactProvinceName, &contactPostalCode,
			&createdAt, &updatedAt,
			&updateBy,
		)
		if err != nil {
			log.Error("Failed to scan expert: %v", err)
			continue
		}

		// Map basic fields
		if expertID.Valid {
			expertIDVal := int(expertID.Int64)
			expert.ID = &expertIDVal
		}
		if userId.Valid {
			userIDVal := int(userId.Int64)
			expert.UserID = &userIDVal
		}
		if idCard.Valid {
			expert.IDCard = idCard.String
		}
		if prefix.Valid {
			expert.Prefix = int(prefix.Int64)
		}
		if firstName.Valid {
			expert.FirstName = firstName.String
		}
		if lastName.Valid {
			expert.LastName = lastName.String
		}
		if phone.Valid {
			expert.Phone = phone.String
		}
		if mobile.Valid {
			expert.Mobile = mobile.String
		}
		if email.Valid {
			expert.Email = email.String
		}
		if cvFile.Valid {
			expert.CVFile = cvFile.String
		}
		if createdAt.Valid {
			createdAtStr := createdAt.Time.Format("2006-01-02 15:04:05")
			expert.CreatedAt = &createdAtStr
		}
		if updatedAt.Valid {
			updatedAtStr := updatedAt.Time.Format("2006-01-02 15:04:05")
			expert.UpdatedAt = &updatedAtStr
		}
		if updateBy.Valid {
			expert.UpdateBy = int(updateBy.Int64)
		}

		// Map address fields
		if idCardHouseNo.Valid {
			expert.IDCardAddress.HouseNo = idCardHouseNo.String
		}
		if idCardMoo.Valid {
			expert.IDCardAddress.Moo = idCardMoo.String
		}
		if idCardSoi.Valid {
			expert.IDCardAddress.Soi = idCardSoi.String
		}
		if idCardRoad.Valid {
			expert.IDCardAddress.Road = idCardRoad.String
		}
		if idCardSubdistrict.Valid {
			expert.IDCardAddress.SubDistrict = int(idCardSubdistrict.Int64)
		}
		if idCardDistrict.Valid {
			expert.IDCardAddress.District = int(idCardDistrict.Int64)
		}
		if idCardProvince.Valid {
			expert.IDCardAddress.Province = int(idCardProvince.Int64)
		}
		if idCardPostalCode.Valid {
			expert.IDCardAddress.PostalCode = idCardPostalCode.String
		}

		if useIdCardAddress.Valid {
			expert.ContactAddress.UseIdCardAddress = useIdCardAddress.Bool
		}
		if contactHouseNo.Valid {
			expert.ContactAddress.HouseNo = contactHouseNo.String
		}
		if contactMoo.Valid {
			expert.ContactAddress.Moo = contactMoo.String
		}
		if contactSoi.Valid {
			expert.ContactAddress.Soi = contactSoi.String
		}
		if contactRoad.Valid {
			expert.ContactAddress.Road = contactRoad.String
		}
		if contactSubdistrict.Valid {
			expert.ContactAddress.SubDistrict = int(contactSubdistrict.Int64)
		}
		if contactDistrict.Valid {
			expert.ContactAddress.District = int(contactDistrict.Int64)
		}
		if contactProvince.Valid {
			expert.ContactAddress.Province = int(contactProvince.Int64)
		}

		if subDistictName.Valid {
			expert.IDCardAddress.SubDistrictName = subDistictName.String
		}
		if districtName.Valid {
			expert.IDCardAddress.DistrictName = districtName.String
		}
		if provinceName.Valid {
			expert.IDCardAddress.ProvinceName = provinceName.String
		}
		if contactSubdistrictName.Valid {
			expert.ContactAddress.SubDistrictName = contactSubdistrictName.String
		}
		if contactDistrictName.Valid {
			expert.ContactAddress.DistrictName = contactDistrictName.String
		}
		if contactProvinceName.Valid {
			expert.ContactAddress.ProvinceName = contactProvinceName.String
		}
		if contactPostalCode.Valid {
			expert.ContactAddress.PostalCode = contactPostalCode.String
		}

		// Load related data (educations, trainings, work experiences, bank accounts)
		if err := loadExpertRelatedData(conn, &expert); err != nil {
			log.Error("Failed to load related data for expert %d: %v", expert.ID, err)
			// Continue without related data rather than failing
		}

		experts = append(experts, expert)
	}

	return &models.ExpertListResponse{
		Data:  experts,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// UpsertCommittee creates or updates a committee
func UpsertCommittee(conn *sql.DB, req models.Committee, userAuth int) (*models.Committee, error) {
	if req.CommitteeNumber == "" {
		return nil, fmt.Errorf("committee_number is required")
	} else {
		//Validate that the referenced committee exists if sub_committee_of is not null
		var exists int
		err := conn.QueryRow("SELECT COUNT(*) FROM i_expert_committees WHERE committee_number = ?", req.CommitteeNumber).Scan(&exists)
		if err != nil {
			log.Error("Failed to validate committee_number: %v", err)
			return nil, fmt.Errorf("failed to validate committee_number: %v", err)
		}
		if exists > 0 && req.CommitteeType == 1 && req.ID == nil {
			return nil, fmt.Errorf("committee_number %s already exists", req.CommitteeNumber)
		}
		if exists == 0 && req.CommitteeType == 2 && req.ID == nil {
			return nil, fmt.Errorf("committee_number %s does not exists", req.CommitteeNumber)
		}
	}
	if req.CommitteeNameTh == "" {
		return nil, fmt.Errorf("committee_name_th is required")
	}

	// Handle nullable fields using sql.NullInt64 or sql.NullString
	var subCommitteeOf sql.NullString
	if req.SubCommitteeOf != nil && *req.SubCommitteeOf != "" {
		subCommitteeOf.String = *req.SubCommitteeOf
		subCommitteeOf.Valid = true
	}

	var committeeNameEn sql.NullString
	if req.CommitteeNameEn != nil && *req.CommitteeNameEn != "" {
		committeeNameEn.String = *req.CommitteeNameEn
		committeeNameEn.Valid = true
	}

	var responsibleGroupID sql.NullString
	if req.ResponsibleGroupID != nil {
		responsibleGroupID.String = *req.ResponsibleGroupID
		responsibleGroupID.Valid = true
	}

	var productGroupID sql.NullInt64
	if req.ProductGroupID != nil && *req.ProductGroupID > 0 {
		productGroupID.Int64 = int64(*req.ProductGroupID)
		productGroupID.Valid = true
	}

	var iso sql.NullString
	if req.ISO != nil && *req.ISO != "" {
		iso.String = *req.ISO
		iso.Valid = true
	}

	var iec sql.NullString
	if req.IEC != nil && *req.IEC != "" {
		iec.String = *req.IEC
		iec.Valid = true
	}

	var scopeOfWork sql.NullString
	if req.ScopeOfWork != nil && *req.ScopeOfWork != "" {
		scopeOfWork.String = *req.ScopeOfWork
		scopeOfWork.Valid = true
	}

	status := "active"
	if req.Status != "" {
		status = req.Status
	}

	var committeeID int

	if req.ID != nil && *req.ID > 0 {
		// ---------- UPDATE ----------
		// Get old committee_number before update
		var oldCommitteeNumber string
		err := conn.QueryRow("SELECT committee_number FROM i_expert_committees WHERE id = ?", req.ID).Scan(&oldCommitteeNumber)
		if err != nil {
			log.Error("Failed to get old committee_number: %v", err)
			return nil, fmt.Errorf("failed to get old committee_number: %v", err)
		}

		query := `UPDATE i_expert_committees SET
			committee_number = ?,
			committee_type_id = ?,
			sub_committee_of = ?,
			committee_name_th = ?,
			committee_name_en = ?,
			responsible_group_id = ?,
			product_group_id = ?,
			iso = ?,
			iec = ?,
			scope_of_work = ?,
			status = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err = conn.Exec(query,
			req.CommitteeNumber, req.CommitteeType, subCommitteeOf, req.CommitteeNameTh, committeeNameEn,
			responsibleGroupID, productGroupID, iso, iec, scopeOfWork, status, userAuth,
			req.ID,
		)
		if err != nil {
			log.Error("Failed to update committee: %v", err)
			return nil, fmt.Errorf("failed to update committee: %v", err)
		}

		// If committee_number changed, update committee_number in related tables
		if oldCommitteeNumber != req.CommitteeNumber {
			// Update committee_number in i_expert_committees
			updateSubCommitteeQuery := `UPDATE i_expert_committees SET
				committee_number = ?
			WHERE committee_number = ?`

			_, err = conn.Exec(updateSubCommitteeQuery,
				req.CommitteeNumber,
				oldCommitteeNumber,
			)
			if err != nil {
				log.Error("Failed to update committee_number in i_expert_committees: %v", err)
				return nil, fmt.Errorf("failed to update committee_number in i_expert_committees: %v", err)
			}

		}
		committeeID = *req.ID
	} else {
		// ---------- INSERT ----------
		query := `INSERT INTO i_expert_committees (
			committee_number, committee_type_id, sub_committee_of, committee_name_th, committee_name_en,
			responsible_group_id, product_group_id, iso, iec, scope_of_work, status, created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.CommitteeNumber, req.CommitteeType, subCommitteeOf, req.CommitteeNameTh, committeeNameEn,
			responsibleGroupID, productGroupID, iso, iec, scopeOfWork, status, userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert committee: %v", err)
			return nil, fmt.Errorf("failed to insert committee: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get committee ID: %v", err)
			return nil, fmt.Errorf("failed to get committee ID: %v", err)
		}
		committeeID = int(lastID)
	}

	// Get the complete committee record
	committee, err := GetCommitteeByID(conn, committeeID)
	if err != nil {
		log.Error("Failed to get committee after upsert: %v", err)
		return nil, fmt.Errorf("failed to get committee after upsert: %v", err)
	}

	return committee, nil
}

// GetCommitteeByID retrieves a committee by ID
func GetCommitteeByID(conn *sql.DB, id int) (*models.Committee, error) {
	query := `SELECT 
		c.id, c.committee_number, c.committee_type_id, c.sub_committee_of,
		c.committee_name_th, c.committee_name_en, c.responsible_group_id, c.product_group_id,
		c.iso, c.iec, c.scope_of_work, c.status, c.created_by, c.updated_by,
		c.created_at, c.updated_at,
		t.ex_group_type_title,
		s.sub_departname,
		p.product_group
	FROM i_expert_committees c
	LEFT JOIN i_master_expert_group_type t ON c.committee_type_id = t.ex_group_type_id
	LEFT JOIN sub_department s ON c.responsible_group_id = s.sub_id
	LEFT JOIN tb3_tis_productgroup p ON c.product_group_id = p.id
	WHERE c.id = ?`

	var committee models.Committee
	var subCommitteeOf sql.NullString
	var createdBy, updatedBy sql.NullInt64
	var committeeNameEn, responsibleGroupID sql.NullString
	var productGroupID sql.NullInt64
	var iso, iec, scopeOfWork sql.NullString
	var createdAt, updatedAt sql.NullTime
	var committeeTypeName, responsibleGroupName, productGroupName sql.NullString

	err := conn.QueryRow(query, id).Scan(
		&committee.ID, &committee.CommitteeNumber, &committee.CommitteeType, &subCommitteeOf,
		&committee.CommitteeNameTh, &committeeNameEn, &responsibleGroupID, &productGroupID,
		&iso, &iec, &scopeOfWork, &committee.Status, &createdBy, &updatedBy,
		&createdAt, &updatedAt,
		&committeeTypeName, &responsibleGroupName, &productGroupName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("committee not found")
		}
		return nil, fmt.Errorf("failed to get committee: %v", err)
	}

	if subCommitteeOf.Valid {
		committee.SubCommitteeOf = &subCommitteeOf.String
	}
	if committeeNameEn.Valid {
		committee.CommitteeNameEn = &committeeNameEn.String
	}
	if responsibleGroupID.Valid {
		// Convert string to int for JSON response
		var val string
		if _, err := fmt.Sscanf(responsibleGroupID.String, "%d", &val); err == nil {
			committee.ResponsibleGroupID = &val
		}
		if responsibleGroupName.Valid {
			committee.ResponsibleGroup = &responsibleGroupName.String
		}
	}
	if productGroupID.Valid {
		val := int(productGroupID.Int64)
		committee.ProductGroupID = &val
	}
	if iso.Valid {
		committee.ISO = &iso.String
	}
	if iec.Valid {
		committee.IEC = &iec.String
	}
	if scopeOfWork.Valid {
		committee.ScopeOfWork = &scopeOfWork.String
	}
	if createdBy.Valid {
		val := int(createdBy.Int64)
		committee.CreatedBy = &val
	}
	if updatedBy.Valid {
		val := int(updatedBy.Int64)
		committee.UpdatedBy = &val
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		committee.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		committee.UpdatedAt = &val
	}
	if committeeTypeName.Valid {
		committee.CommitteeTypeName = &committeeTypeName.String
	}
	if productGroupName.Valid {
		committee.ProductGroup = &productGroupName.String
	}

	return &committee, nil
}

// GetCommitteeByCommitteeNumber retrieves a committee by committee_number
func GetCommitteeByCommitteeNumber(conn *sql.DB, committeeNumber string) (string, error) {

	var committeeResult string
	query := `SELECT 
		  COALESCE(c.sub_committee_of,'')
	FROM i_expert_committees c
	WHERE c.committee_number = ? and committee_type_id=2`

	rows, err := conn.Query(query, committeeNumber)
	if err != nil {
		return committeeResult, fmt.Errorf("failed to get committees: %v", err)
	}
	defer rows.Close()
	var subNames []string
	for rows.Next() {
		var result string
		err := rows.Scan(&result)
		if err != nil {
			return "", fmt.Errorf("failed to scan committee: %v", err)
		}

		subNames = append(subNames, result)
	}
	joined := strings.Join(subNames, ", ")
	committeeResult = joined

	return committeeResult, nil
}

// GetCommitteeByCommitteeSubNumber retrieves a committee by committee_number
func GetCommitteeByCommitteeSubNumber(conn *sql.DB, committeeId string) ([]string, error) {

	var committeeResult []string
	query := `SELECT 
		 c.sub_committee_of 
	FROM i_expert_committees c
	WHERE c.id = ? and committee_type_id=2`

	rows, err := conn.Query(query, committeeId)
	if err != nil {
		return committeeResult, fmt.Errorf("failed to get committees: %v", err)
	}
	defer rows.Close()
	for rows.Next() {
		var result sql.NullString
		err := rows.Scan(&result)
		if err != nil {
			return committeeResult, fmt.Errorf("failed to scan committee: %v", err)
		}

		if result.Valid && result.String != "" {
			committeeResult = append(committeeResult, result.String)
		}
	}

	return committeeResult, nil
}

// GetCommittees retrieves committees with filtering and pagination
func GetCommittees(conn *sql.DB, params models.CommitteeSearchParams) (*models.CommitteeListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		c.id, c.committee_number, c.committee_type_id, c.sub_committee_of,
		c.committee_name_th, c.committee_name_en, c.responsible_group_id, c.product_group_id,
		c.iso, c.iec, c.scope_of_work, c.status, c.created_by, c.updated_by,
		c.created_at, c.updated_at,
		t.ex_group_type_title,
		s.sub_departname,
		p.product_group
	FROM i_expert_committees c
	LEFT JOIN i_master_expert_group_type t ON c.committee_type_id = t.ex_group_type_id
	LEFT JOIN sub_department s ON c.responsible_group_id = s.sub_id
	LEFT JOIN tb3_tis_productgroup p ON c.product_group_id = p.id`

	if params.CommitteeType != nil {
		conditions = append(conditions, "c.committee_type_id = ?")
		args = append(args, *params.CommitteeType)
	}

	if params.CommitteeName != nil && *params.CommitteeName != "" {
		names := strings.Split(*params.CommitteeName, ",")
		var nameConditions []string
		for _, name := range names {
			name = strings.TrimSpace(name)
			if name != "" {
				nameConditions = append(nameConditions, "(c.committee_name_th LIKE ? OR c.committee_name_en LIKE ?)")
				searchPattern := "%" + name + "%"
				args = append(args, searchPattern, searchPattern)
			}
		}
		if len(nameConditions) > 0 {
			conditions = append(conditions, "("+strings.Join(nameConditions, " OR ")+")")
		}
	}

	if params.Status != nil && *params.Status != "" {
		conditions = append(conditions, "c.status = ?")
		args = append(args, *params.Status)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY c.committee_number"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_expert_committees c`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count committees: %v", err)
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
		return nil, fmt.Errorf("failed to query committees: %v", err)
	}
	defer rows.Close()

	var committees []models.Committee
	for rows.Next() {
		var committee models.Committee
		var subCommitteeOf sql.NullString
		var createdBy, updatedBy sql.NullInt64
		var committeeNameEn, responsibleGroupID sql.NullString
		var productGroupID sql.NullInt64
		var iso, iec, scopeOfWork sql.NullString
		var createdAt, updatedAt sql.NullTime
		var committeeTypeName, responsibleGroupName, productGroupName sql.NullString

		err := rows.Scan(
			&committee.ID, &committee.CommitteeNumber, &committee.CommitteeType, &subCommitteeOf,
			&committee.CommitteeNameTh, &committeeNameEn, &responsibleGroupID, &productGroupID,
			&iso, &iec, &scopeOfWork, &committee.Status, &createdBy, &updatedBy,
			&createdAt, &updatedAt,
			&committeeTypeName, &responsibleGroupName, &productGroupName,
		)
		if err != nil {
			log.Error("Failed to scan committee: %v", err)
			continue
		}

		if subCommitteeOf.Valid {
			committee.SubCommitteeOf = &subCommitteeOf.String
		}
		if committeeNameEn.Valid {
			committee.CommitteeNameEn = &committeeNameEn.String
		}
		if responsibleGroupID.Valid {
			if responsibleGroupID.Valid {
				committee.ResponsibleGroupID = &responsibleGroupID.String
			}

			if responsibleGroupName.Valid {
				committee.ResponsibleGroup = &responsibleGroupName.String
			}
		}
		if productGroupID.Valid {
			val := int(productGroupID.Int64)
			committee.ProductGroupID = &val
			if productGroupName.Valid {
				committee.ProductGroup = &productGroupName.String
			}
		}
		if iso.Valid {
			committee.ISO = &iso.String
		}
		if iec.Valid {
			committee.IEC = &iec.String
		}
		if scopeOfWork.Valid {
			committee.ScopeOfWork = &scopeOfWork.String
		}
		if createdBy.Valid {
			val := int(createdBy.Int64)
			committee.CreatedBy = &val
		}
		if updatedBy.Valid {
			val := int(updatedBy.Int64)
			committee.UpdatedBy = &val
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			committee.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			committee.UpdatedAt = &val
		}
		if committeeTypeName.Valid {
			committee.CommitteeTypeName = &committeeTypeName.String
		}

		// committee.CommitteeNumber is already a string, no need to format
		if committee.CommitteeType == 1 {
			subCommittee, err := GetCommitteeByCommitteeNumber(conn, committee.CommitteeNumber)
			if err != nil {
				log.Error("Failed to get committee by committee number: %v", err)
			}
			committee.SubCommitteeNumber = &subCommittee
		}
		committees = append(committees, committee)

	}

	return &models.CommitteeListResponse{
		Data:  committees,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// GetMyExpertCommittees retrieves committees that current logged-in user is a member of
func GetMyExpertCommittees(conn *sql.DB, userID int, params models.CommitteeSearchParams) (*models.CommitteeListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		c.id, c.committee_number, c.committee_type_id, c.sub_committee_of,
		c.committee_name_th, c.committee_name_en, c.responsible_group_id, c.product_group_id,
		c.iso, c.iec, c.scope_of_work, c.status, c.created_by, c.updated_by,
		c.created_at, c.updated_at,
		t.ex_group_type_title,
		s.sub_departname,
		p.product_group
	FROM i_expert_committees c
	INNER JOIN i_expert_committee_members m ON c.id = m.committee_id
	INNER JOIN i_experts e ON m.expert_id = e.id
	LEFT JOIN i_master_expert_group_type t ON c.committee_type_id = t.ex_group_type_id
	LEFT JOIN sub_department s ON c.responsible_group_id = s.sub_id
	LEFT JOIN tb3_tis_productgroup p ON c.product_group_id = p.id
	WHERE m.status = 'active' AND c.status = 'active' AND e.user_id = ?`

	args = append(args, userID)

	if params.CommitteeType != nil {
		conditions = append(conditions, "c.committee_type_id = ?")
		args = append(args, *params.CommitteeType)
	}

	if params.CommitteeName != nil && *params.CommitteeName != "" {
		names := strings.Split(*params.CommitteeName, ",")
		var nameConditions []string
		for _, name := range names {
			name = strings.TrimSpace(name)
			if name != "" {
				nameConditions = append(nameConditions, "(c.committee_name_th LIKE ? OR c.committee_name_en LIKE ?)")
				searchPattern := "%" + name + "%"
				args = append(args, searchPattern, searchPattern)
			}
		}
		if len(nameConditions) > 0 {
			conditions = append(conditions, "("+strings.Join(nameConditions, " OR ")+")")
		}
	}

	// Optional override status filter (default already active)
	if params.Status != nil && *params.Status != "" {
		conditions = append(conditions, "c.status = ?")
		args = append(args, *params.Status)
	}

	if len(conditions) > 0 {
		baseQuery += " AND " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY c.committee_number"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_expert_committees c
	INNER JOIN i_expert_committee_members m ON c.id = m.committee_id
	INNER JOIN i_experts e ON m.expert_id = e.id
	WHERE m.status = 'active' AND c.status = 'active' AND e.user_id = ?`

	countArgs := []interface{}{userID}
	if len(conditions) > 0 {
		countQuery += " AND " + strings.Join(conditions, " AND ")
		countArgs = append(countArgs, args[1:]...) // skip first userID
	}

	var total int
	err := conn.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count my committees: %v", err)
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
		return nil, fmt.Errorf("failed to query my committees: %v", err)
	}
	defer rows.Close()

	var committees []models.Committee
	for rows.Next() {
		var committee models.Committee
		var subCommitteeOf sql.NullString
		var createdBy, updatedBy sql.NullInt64
		var committeeNameEn, responsibleGroupID sql.NullString
		var productGroupID sql.NullInt64
		var iso, iec, scopeOfWork sql.NullString
		var createdAt, updatedAt sql.NullTime
		var committeeTypeName, responsibleGroupName, productGroupName sql.NullString

		err := rows.Scan(
			&committee.ID, &committee.CommitteeNumber, &committee.CommitteeType, &subCommitteeOf,
			&committee.CommitteeNameTh, &committeeNameEn, &responsibleGroupID, &productGroupID,
			&iso, &iec, &scopeOfWork, &committee.Status, &createdBy, &updatedBy,
			&createdAt, &updatedAt,
			&committeeTypeName, &responsibleGroupName, &productGroupName,
		)
		if err != nil {
			log.Error("Failed to scan my committee: %v", err)
			continue
		}

		if subCommitteeOf.Valid {
			committee.SubCommitteeOf = &subCommitteeOf.String
		}
		if committeeNameEn.Valid {
			committee.CommitteeNameEn = &committeeNameEn.String
		}
		if responsibleGroupID.Valid {
			committee.ResponsibleGroupID = &responsibleGroupID.String
			if responsibleGroupName.Valid {
				committee.ResponsibleGroup = &responsibleGroupName.String
			}
		}
		if productGroupID.Valid {
			val := int(productGroupID.Int64)
			committee.ProductGroupID = &val
			if productGroupName.Valid {
				committee.ProductGroup = &productGroupName.String
			}
		}
		if iso.Valid {
			committee.ISO = &iso.String
		}
		if iec.Valid {
			committee.IEC = &iec.String
		}
		if scopeOfWork.Valid {
			committee.ScopeOfWork = &scopeOfWork.String
		}
		if createdBy.Valid {
			val := int(createdBy.Int64)
			committee.CreatedBy = &val
		}
		if updatedBy.Valid {
			val := int(updatedBy.Int64)
			committee.UpdatedBy = &val
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			committee.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			committee.UpdatedAt = &val
		}
		if committeeTypeName.Valid {
			committee.CommitteeTypeName = &committeeTypeName.String
		}

		committees = append(committees, committee)
	}

	return &models.CommitteeListResponse{
		Data:  committees,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// DeleteCommittee deletes a committee by ID
func DeleteCommittee(conn *sql.DB, id int) error {
	query := `DELETE FROM i_expert_committees WHERE id = ?`
	result, err := conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete committee: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("committee not found")
	}

	return nil
}

// UpsertDirective creates or updates a directive
func UpsertDirective(conn *sql.DB, req models.Directive, userAuth int) (*models.Directive, error) {
	if req.OrderNumber == "" {
		return nil, fmt.Errorf("order_number is required")
	}
	if req.SigningDate == "" {
		return nil, fmt.Errorf("signing_date is required")
	}
	if req.EndDate == "" {
		return nil, fmt.Errorf("end_date is required")
	}

	// Handle nullable fields

	var meetingRound sql.NullString
	if req.MeetingRound != nil && *req.MeetingRound != "" {
		meetingRound.String = *req.MeetingRound
		meetingRound.Valid = true
	}

	var meetingRef sql.NullString
	if req.MeetingRef != nil && *req.MeetingRef != "" {
		meetingRef.String = *req.MeetingRef
		meetingRef.Valid = true
	}

	var meetingDate sql.NullString
	if req.MeetingDate != nil && *req.MeetingDate != "" {
		meetingDate.String = *req.MeetingDate
		meetingDate.Valid = true
	}

	var filePath sql.NullString
	if req.FilePath != nil && *req.FilePath != "" {
		filePath.String = *req.FilePath
		filePath.Valid = true
	}

	// Set defaults
	edition := req.Edition
	if edition == "" {
		edition = "0"
	}
	amd := req.Amd
	if amd == "" {
		amd = "0"
	}
	meetingSource := req.MeetingSource
	if meetingSource == "" {
		meetingSource = "emeeting"
	}

	var directiveID int

	if req.ID != nil && *req.ID > 0 {
		// ---------- UPDATE ----------
		query := `UPDATE i_expert_directives SET
			order_number = ?,
			directive_type_id = ?,
			signing_date = ?,
			end_date = ?,
			committee_id = ?,
			sub_committee_of = ?,
			edition = ?,
			amd = ?,
			meeting_round = ?,
			meeting_source = ?,
			meeting_ref = ?,
			meeting_date = ?,
			file_path = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := conn.Exec(query,
			req.OrderNumber, req.DirectiveTypeID, req.SigningDate, req.EndDate,
			req.CommitteeID, req.SubCommitteeOf, edition, amd,
			meetingRound, meetingSource, meetingRef, meetingDate, filePath,
			userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update directive: %v", err)
			return nil, fmt.Errorf("failed to update directive: %v", err)
		}
		directiveID = *req.ID
	} else {
		// ---------- INSERT ----------
		query := `INSERT INTO i_expert_directives (
			order_number, directive_type_id, signing_date, end_date,committee_id, sub_committee_of, edition, amd,
			meeting_round, meeting_source, meeting_ref, meeting_date, file_path,
			created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.OrderNumber, req.DirectiveTypeID, req.SigningDate, req.EndDate,
			req.CommitteeID, req.SubCommitteeOf, edition, amd,
			meetingRound, meetingSource, meetingRef, meetingDate, filePath,
			userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert directive: %v", err)
			return nil, fmt.Errorf("failed to insert directive: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get directive ID: %v", err)
			return nil, fmt.Errorf("failed to get directive ID: %v", err)
		}
		directiveID = int(lastID)
	}

	// Get the complete directive record
	directive, err := GetDirectiveByID(conn, directiveID)
	if err != nil {
		log.Error("Failed to get directive after upsert: %v", err)
		return nil, fmt.Errorf("failed to get directive after upsert: %v", err)
	}

	return directive, nil
}

// GetDirectiveByID retrieves a directive by ID
func GetDirectiveByID(conn *sql.DB, id int) (*models.Directive, error) {
	query := `SELECT 
		d.id, d.order_number, d.directive_type_id, d.signing_date, d.end_date,d.committee_id,d.sub_committee_of,d.edition, d.amd,
		d.meeting_round, d.meeting_source, d.meeting_ref, d.meeting_date, d.file_path,
		d.created_by, d.updated_by, d.created_at, d.updated_at,
		t.directive_type_title
	FROM i_expert_directives d
	LEFT JOIN i_master_directive_type t ON d.directive_type_id = t.directive_type_id
	WHERE d.id = ?`

	var directive models.Directive
	var meetingRound, meetingRef, filePath, subCommitteeOf sql.NullString
	var signingDate, endDate, meetingDate sql.NullTime
	var createdBy, updatedBy sql.NullInt64
	var createdAt, updatedAt sql.NullTime
	var directiveTypeName sql.NullString

	err := conn.QueryRow(query, id).Scan(
		&directive.ID, &directive.OrderNumber, &directive.DirectiveTypeID, &signingDate, &endDate, &directive.CommitteeID,
		&subCommitteeOf, &directive.Edition, &directive.Amd,
		&meetingRound, &directive.MeetingSource, &meetingRef, &meetingDate, &filePath,
		&createdBy, &updatedBy, &createdAt, &updatedAt,
		&directiveTypeName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("directive not found")
		}
		return nil, fmt.Errorf("failed to get directive: %v", err)
	}

	// Map date fields
	if signingDate.Valid {
		directive.SigningDate = signingDate.Time.Format("2006-01-02")
	} else {
		directive.SigningDate = ""
	}
	if endDate.Valid {
		directive.EndDate = endDate.Time.Format("2006-01-02")
	} else {
		directive.EndDate = ""
	}

	// Map nullable fields
	if subCommitteeOf.Valid {
		directive.SubCommitteeOf = subCommitteeOf.String
	} else {
		directive.SubCommitteeOf = ""
	}

	if meetingRound.Valid {
		directive.MeetingRound = &meetingRound.String
	}
	if meetingRef.Valid {
		directive.MeetingRef = &meetingRef.String
	}
	if meetingDate.Valid {
		dateStr := meetingDate.Time.Format("2006-01-02")
		directive.MeetingDate = &dateStr
	}
	if filePath.Valid {
		directive.FilePath = &filePath.String
	}
	if createdBy.Valid {
		val := int(createdBy.Int64)
		directive.CreatedBy = &val
	}
	if updatedBy.Valid {
		val := int(updatedBy.Int64)
		directive.UpdatedBy = &val
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		directive.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		directive.UpdatedAt = &val
	}
	if directiveTypeName.Valid {
		directive.DirectiveTypeName = &directiveTypeName.String
	}

	return &directive, nil
}

// DeleteDirective deletes a directive by ID
func DeleteDirective(conn *sql.DB, id int) error {
	query := `DELETE FROM i_expert_directives WHERE id = ?`
	result, err := conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete directive: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("directive not found")
	}

	return nil
}

// GetDirectives retrieves a list of directives with filtering and pagination
func GetDirectives(conn *sql.DB, params models.DirectiveSearchParams) (*models.DirectiveListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		d.id, d.order_number, d.directive_type_id, d.signing_date, d.end_date,d.committee_id,d.sub_committee_of,d.edition, d.amd,
		d.meeting_round, d.meeting_source, d.meeting_ref, d.meeting_date, d.file_path,
		d.created_by, d.updated_by, d.created_at, d.updated_at,
		t.directive_type_title
	FROM i_expert_directives d
	LEFT JOIN i_master_directive_type t ON d.directive_type_id = t.directive_type_id`

	if params.DirectiveTypeId != nil {
		conditions = append(conditions, "d.directive_type_id = ?")
		args = append(args, *params.DirectiveTypeId)
	}

	if params.OrderNumber != nil && *params.OrderNumber != "" {
		orderNumbers := strings.Split(*params.OrderNumber, ",")
		var orderConditions []string
		for _, orderNum := range orderNumbers {
			orderNum = strings.TrimSpace(orderNum)
			if orderNum != "" {
				orderConditions = append(orderConditions, "d.order_number LIKE ?")
				searchPattern := "%" + orderNum + "%"
				args = append(args, searchPattern)
			}
		}
		if len(orderConditions) > 0 {
			conditions = append(conditions, "("+strings.Join(orderConditions, " OR ")+")")
		}
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY d.order_number"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_expert_directives d`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count directives: %v", err)
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
		return nil, fmt.Errorf("failed to query directives: %v", err)
	}
	defer rows.Close()

	var directives []models.Directive
	for rows.Next() {
		var directive models.Directive
		var meetingRound, meetingRef, filePath, subCommitteeOf sql.NullString
		var signingDate, endDate, meetingDate sql.NullTime
		var createdBy, updatedBy sql.NullInt64
		var createdAt, updatedAt sql.NullTime
		var directiveTypeName sql.NullString

		err := rows.Scan(
			&directive.ID, &directive.OrderNumber, &directive.DirectiveTypeID, &signingDate, &endDate,
			&directive.CommitteeID,
			&subCommitteeOf, &directive.Edition, &directive.Amd,
			&meetingRound, &directive.MeetingSource, &meetingRef, &meetingDate, &filePath,
			&createdBy, &updatedBy, &createdAt, &updatedAt,
			&directiveTypeName,
		)
		if err != nil {
			log.Error("Failed to scan directive: %v", err)
			continue
		}

		// Map date fields
		if signingDate.Valid {
			directive.SigningDate = signingDate.Time.Format("2006-01-02")
		} else {
			directive.SigningDate = ""
		}
		if endDate.Valid {
			directive.EndDate = endDate.Time.Format("2006-01-02")
		} else {
			directive.EndDate = ""
		}

		// Map nullable fields
		if subCommitteeOf.Valid {
			directive.SubCommitteeOf = subCommitteeOf.String
		} else {
			directive.SubCommitteeOf = ""
		}

		if meetingRound.Valid {
			directive.MeetingRound = &meetingRound.String
		}
		if meetingRef.Valid {
			directive.MeetingRef = &meetingRef.String
		}
		if meetingDate.Valid {
			dateStr := meetingDate.Time.Format("2006-01-02")
			directive.MeetingDate = &dateStr
		}
		if filePath.Valid {
			directive.FilePath = &filePath.String
		}
		if createdBy.Valid {
			val := int(createdBy.Int64)
			directive.CreatedBy = &val
		}
		if updatedBy.Valid {
			val := int(updatedBy.Int64)
			directive.UpdatedBy = &val
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			directive.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			directive.UpdatedAt = &val
		}
		if directiveTypeName.Valid {
			directive.DirectiveTypeName = &directiveTypeName.String
		}

		directives = append(directives, directive)
	}

	return &models.DirectiveListResponse{
		Data:  directives,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// UpsertCommitteeMember creates or updates a committee member
func UpsertCommitteeMember(conn *sql.DB, req models.CommitteeMember, userAuth int) (*models.CommitteeMember, error) {
	if req.CommitteeID == 0 {
		return nil, fmt.Errorf("committee_id is required")
	}
	if req.ExpertID == 0 {
		return nil, fmt.Errorf("expert_id is required")
	}
	if req.PositionID == 0 {
		return nil, fmt.Errorf("position_id is required")
	}

	status := "active"
	if req.Status != "" {
		status = req.Status
	}

	// Handle nullable fields
	var directiveID sql.NullInt64
	if req.DirectiveID != nil && *req.DirectiveID > 0 {
		directiveID.Int64 = int64(*req.DirectiveID)
		directiveID.Valid = true
	}

	var organizationID sql.NullInt64
	if req.OrganizationID != nil && *req.OrganizationID > 0 {
		organizationID.Int64 = int64(*req.OrganizationID)
		organizationID.Valid = true
	}

	var memberTypeID sql.NullInt64
	if req.MemberTypeID != nil && *req.MemberTypeID > 0 {
		memberTypeID.Int64 = int64(*req.MemberTypeID)
		memberTypeID.Valid = true
	}

	var representativeOrder sql.NullInt64
	if req.RepresentativeOrder != nil && *req.RepresentativeOrder > 0 {
		representativeOrder.Int64 = int64(*req.RepresentativeOrder)
		representativeOrder.Valid = true
	}

	var assignmentFile sql.NullString
	if req.AssignmentFile != nil && *req.AssignmentFile != "" {
		assignmentFile.String = *req.AssignmentFile
		assignmentFile.Valid = true
	}

	var remarks sql.NullString
	if req.Remarks != nil && *req.Remarks != "" {
		remarks.String = *req.Remarks
		remarks.Valid = true
	}

	isSecretary := 0
	if req.IsSecretary {
		isSecretary = 1
	}

	isAssistantSecretary := 0
	if req.IsAssistantSecretary {
		isAssistantSecretary = 1
	}

	var memberID int

	if req.ID != nil && *req.ID > 0 {
		// ---------- UPDATE ----------
		query := `UPDATE i_expert_committee_members SET
			committee_id = ?,
			expert_id = ?,
			position_id = ?,
			directive_id = ?,
			organization_id = ?,
			member_type_id = ?,
			representative_order = ?,
			is_secretary = ?,
			is_assistant_secretary = ?,
			status = ?,
			assignment_file = ?,
			remarks = ?,
			updated_by = ?,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = ?`

		_, err := conn.Exec(query,
			req.CommitteeID, req.ExpertID, req.PositionID,
			directiveID, organizationID, memberTypeID, representativeOrder,
			isSecretary, isAssistantSecretary, status,
			assignmentFile, remarks, userAuth, req.ID,
		)
		if err != nil {
			log.Error("Failed to update committee member: %v", err)
			return nil, fmt.Errorf("failed to update committee member: %v", err)
		}
		memberID = *req.ID
	} else {
		// ---------- INSERT ----------
		query := `INSERT INTO i_expert_committee_members (
			committee_id, expert_id, position_id,
			directive_id, organization_id, member_type_id, representative_order,
			is_secretary, is_assistant_secretary, status,
			assignment_file, remarks, created_by, updated_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

		res, err := conn.Exec(query,
			req.CommitteeID, req.ExpertID, req.PositionID,
			directiveID, organizationID, memberTypeID, representativeOrder,
			isSecretary, isAssistantSecretary, status,
			assignmentFile, remarks, userAuth, userAuth,
		)
		if err != nil {
			log.Error("Failed to insert committee member: %v", err)
			return nil, fmt.Errorf("failed to insert committee member: %v", err)
		}

		lastID, err := res.LastInsertId()
		if err != nil {
			log.Error("Failed to get committee member ID: %v", err)
			return nil, fmt.Errorf("failed to get committee member ID: %v", err)
		}
		memberID = int(lastID)
	}

	// Get the complete committee member record
	member, err := GetCommitteeMemberByID(conn, memberID)
	if err != nil {
		log.Error("Failed to get committee member after upsert: %v", err)
		return nil, fmt.Errorf("failed to get committee member after upsert: %v", err)
	}

	return member, nil
}

// GetCommitteeMemberByID retrieves a committee member by ID
func GetCommitteeMemberByID(conn *sql.DB, id int) (*models.CommitteeMember, error) {
	query := `SELECT 
		m.id, m.committee_id, m.expert_id, m.position_id,
		m.directive_id, m.organization_id, m.member_type_id, m.representative_order,
		m.is_secretary, m.is_assistant_secretary, m.status,
		m.assignment_file, m.remarks, m.created_at, m.updated_at,
		CONCAT(e.first_name, ' ', e.last_name) AS expert_name,
		e.id_card,
		pos.ex_group_pos_title AS position_name,
		d.order_number AS directive_number,
		org.org_title AS organization_name,
		mt.ex_member_type_title
	FROM i_expert_committee_members m
	LEFT JOIN i_experts e ON m.expert_id = e.id
	LEFT JOIN i_master_expert_group_pos pos ON m.position_id = pos.ex_group_pos_id
	LEFT JOIN i_expert_directives d ON m.directive_id = d.id
	LEFT JOIN i_master_org org ON m.organization_id = org.org_id
	LEFT JOIN i_master_expert_member_type mt ON m.member_type_id = mt.ex_member_type_id 
	WHERE m.id = ?`

	var member models.CommitteeMember
	var expertName, idCard, positionName, directiveNumber, organizationName, memberTypeName sql.NullString
	var directiveID, organizationID, memberTypeID, representativeOrder sql.NullInt64
	var assignmentFile, remarks sql.NullString
	var createdAt, updatedAt sql.NullTime
	var isSecretary, isAssistantSecretary int

	err := conn.QueryRow(query, id).Scan(
		&member.ID, &member.CommitteeID, &member.ExpertID, &member.PositionID,
		&directiveID, &organizationID, &memberTypeID, &representativeOrder,
		&isSecretary, &isAssistantSecretary, &member.Status,
		&assignmentFile, &remarks, &createdAt, &updatedAt,
		&expertName, &idCard, &positionName, &directiveNumber, &organizationName, &memberTypeName,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("committee member not found")
		}
		return nil, fmt.Errorf("failed to get committee member: %v", err)
	}

	// Map nullable fields
	if expertName.Valid {
		member.ExpertName = &expertName.String
	}
	if idCard.Valid {
		member.IDCard = &idCard.String
	}
	if positionName.Valid {
		member.PositionName = &positionName.String
	}
	if directiveID.Valid {
		val := int(directiveID.Int64)
		member.DirectiveID = &val
	}
	if directiveNumber.Valid {
		member.DirectiveNumber = &directiveNumber.String
	}
	if organizationID.Valid {
		val := int(organizationID.Int64)
		member.OrganizationID = &val
	}
	if organizationName.Valid {
		member.OrganizationName = &organizationName.String
	}
	if memberTypeID.Valid {
		val := int(memberTypeID.Int64)
		member.MemberTypeID = &val
	}
	if memberTypeName.Valid {
		member.MemberTypeName = &memberTypeName.String
	}
	if representativeOrder.Valid {
		val := int(representativeOrder.Int64)
		member.RepresentativeOrder = &val
	}
	if assignmentFile.Valid {
		member.AssignmentFile = &assignmentFile.String
	}
	if remarks.Valid {
		member.Remarks = &remarks.String
	}
	if createdAt.Valid {
		val := createdAt.Time.Format("2006-01-02 15:04:05")
		member.CreatedAt = &val
	}
	if updatedAt.Valid {
		val := updatedAt.Time.Format("2006-01-02 15:04:05")
		member.UpdatedAt = &val
	}

	member.IsSecretary = isSecretary == 1
	member.IsAssistantSecretary = isAssistantSecretary == 1

	return &member, nil
}

// GetCommitteeMembers retrieves a list of committee members with filtering and pagination
func GetCommitteeMembers(conn *sql.DB, params models.CommitteeMemberSearchParams) (*models.CommitteeMemberListResponse, error) {
	var conditions []string
	var args []interface{}

	baseQuery := `SELECT 
		m.id, m.committee_id, m.expert_id, m.position_id,
		m.directive_id, m.organization_id, m.member_type_id, m.representative_order,
		m.is_secretary, m.is_assistant_secretary, m.status,
		m.assignment_file, m.remarks, m.created_at, m.updated_at,
		CONCAT(e.first_name, ' ', e.last_name) AS expert_name,
		e.id_card,
		pos.ex_group_pos_title AS position_name,
		d.order_number AS directive_number,
		org.org_title AS organization_name,
		mt.ex_member_type_title
	FROM i_expert_committee_members m
	LEFT JOIN i_experts e ON m.expert_id = e.id
	LEFT JOIN i_master_expert_group_pos pos ON m.position_id = pos.ex_group_pos_id
	LEFT JOIN i_expert_directives d ON m.directive_id = d.id
	LEFT JOIN i_master_org org ON m.organization_id = org.org_id
	LEFT JOIN i_master_expert_member_type mt ON m.member_type_id = mt.ex_member_type_id`

	if params.CommitteeID != nil {
		conditions = append(conditions, "m.committee_id = ?")
		args = append(args, *params.CommitteeID)
	}

	if params.ExpertID != nil {
		conditions = append(conditions, "m.expert_id = ?")
		args = append(args, *params.ExpertID)
	}

	if params.PositionID != nil {
		conditions = append(conditions, "m.position_id = ?")
		args = append(args, *params.PositionID)
	}

	if params.Status != nil && *params.Status != "" {
		conditions = append(conditions, "m.status = ?")
		args = append(args, *params.Status)
	}

	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	baseQuery += " ORDER BY m.id DESC"

	// Count total
	countQuery := `SELECT COUNT(*)
	FROM i_expert_committee_members m`
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	err := conn.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("failed to count committee members: %v", err)
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
		return nil, fmt.Errorf("failed to query committee members: %v", err)
	}
	defer rows.Close()

	var members []models.CommitteeMember
	for rows.Next() {
		var member models.CommitteeMember
		var expertName, idCard, positionName, directiveNumber, organizationName, memberTypeName sql.NullString
		var directiveID, organizationID, memberTypeID, representativeOrder sql.NullInt64
		var assignmentFile, remarks sql.NullString
		var createdAt, updatedAt sql.NullTime
		var isSecretary, isAssistantSecretary int

		err := rows.Scan(
			&member.ID, &member.CommitteeID, &member.ExpertID, &member.PositionID,
			&directiveID, &organizationID, &memberTypeID, &representativeOrder,
			&isSecretary, &isAssistantSecretary, &member.Status,
			&assignmentFile, &remarks, &createdAt, &updatedAt,
			&expertName, &idCard, &positionName, &directiveNumber, &organizationName, &memberTypeName,
		)
		if err != nil {
			log.Error("Failed to scan committee member: %v", err)
			continue
		}

		// Map nullable fields
		if expertName.Valid {
			member.ExpertName = &expertName.String
		}
		if idCard.Valid {
			member.IDCard = &idCard.String
		}
		if positionName.Valid {
			member.PositionName = &positionName.String
		}
		if directiveID.Valid {
			val := int(directiveID.Int64)
			member.DirectiveID = &val
		}
		if directiveNumber.Valid {
			member.DirectiveNumber = &directiveNumber.String
		}
		if organizationID.Valid {
			val := int(organizationID.Int64)
			member.OrganizationID = &val
		}
		if organizationName.Valid {
			member.OrganizationName = &organizationName.String
		}
		if memberTypeID.Valid {
			val := int(memberTypeID.Int64)
			member.MemberTypeID = &val
		}
		if memberTypeName.Valid {
			member.MemberTypeName = &memberTypeName.String
		}
		if representativeOrder.Valid {
			val := int(representativeOrder.Int64)
			member.RepresentativeOrder = &val
		}
		if assignmentFile.Valid {
			member.AssignmentFile = &assignmentFile.String
		}
		if remarks.Valid {
			member.Remarks = &remarks.String
		}
		if createdAt.Valid {
			val := createdAt.Time.Format("2006-01-02 15:04:05")
			member.CreatedAt = &val
		}
		if updatedAt.Valid {
			val := updatedAt.Time.Format("2006-01-02 15:04:05")
			member.UpdatedAt = &val
		}

		member.IsSecretary = isSecretary == 1
		member.IsAssistantSecretary = isAssistantSecretary == 1

		members = append(members, member)
	}

	return &models.CommitteeMemberListResponse{
		Data:  members,
		Total: total,
		Page:  page,
		Limit: limit,
	}, nil
}

// DeleteCommitteeMember deletes a committee member by ID
func DeleteCommitteeMember(conn *sql.DB, id int) error {
	query := `DELETE FROM i_expert_committee_members WHERE id = ?`
	result, err := conn.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete committee member: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %v", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("committee member not found")
	}

	return nil
}
