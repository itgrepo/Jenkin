package repository

import (
	"database/sql"
	"estisi/models"
	"fmt"
)

// FindSSOUserByUsernameOrEmail finds user by username or email in sso_users table
// Returns error if user is blocked or not verified
func FindSSOUserByUsernameOrEmail(conn *sql.DB, identifier string) (*models.UserInfo, error) {
	// Query all fields from sso_users table (include password for verification, but won't be returned in response)
	query := `SELECT id, username, email, password, name, name_en, contact_name, picture, block, sendEmail, 
			  registerDate, lastvisitDate, params, lastResetTime, resetCount, applicanttype_id, 
			  juristic_status, juristic_cause_quit, check_api, date_niti, tax_number, nationality, 
			  date_of_birth, prefix_name, address_no, street, moo, soi, subdistrict, district, province, 
			  zipcode, tel, fax, latitude, longitude, contact_street, contact_address_no, contact_moo, 
			  contact_soi, contact_subdistrict, contact_district, contact_province, contact_zipcode, 
			  personfile, corporatefile, remember_token, state, person_type, branch_type, branch_code, 
			  building, contact_building, contact_tax_id, contact_prefix_name, contact_prefix_text, 
			  contact_first_name, contact_last_name, contact_position, contact_tel, contact_fax, 
			  contact_phone_number, prefix_text, person_first_name, person_last_name, google2fa_status, 
			  google2fa_secret, address_en, moo_en, soi_en, street_en, subdistrict_en, district_en, 
			  province_en, zipcode_en, contact_address_en, contact_moo_en, contact_soi_en, 
			  contact_street_en, contact_subdistrict_en, contact_district_en, contact_province_en, 
			  contact_zipcode_en
			  FROM sso_users 
			  WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) AND password != ''`

	var id int
	var username, email, password, name, contactName string
	var block, sendEmail, state, resetCount, checkApi, juristicStatus, google2faStatus sql.NullInt64
	var picture, nameEn, registerDate, lastvisitDate, params, lastResetTime, applicanttypeId sql.NullString
	var juristicCauseQuit, taxNumber, nationality, dateOfBirth, prefixName sql.NullString
	var addressNo, street, moo, soi, subdistrict, district, province, zipcode, tel, fax sql.NullString
	var latitude, longitude, contactStreet, contactAddressNo, contactMoo, contactSoi sql.NullString
	var contactSubdistrict, contactDistrict, contactProvince, contactZipcode sql.NullString
	var personfile, corporatefile, rememberToken, personType, branchType, branchCode sql.NullString
	var building, contactBuilding, contactTaxId, contactPrefixName, contactPrefixText sql.NullString
	var contactFirstName, contactLastName, contactPosition, contactTel, contactFax sql.NullString
	var contactPhoneNumber, prefixText, personFirstName, personLastName sql.NullString
	var google2faSecret, addressEn, mooEn, soiEn, streetEn, subdistrictEn, districtEn sql.NullString
	var provinceEn, zipcodeEn, contactAddressEn, contactMooEn, contactSoiEn sql.NullString
	var contactStreetEn, contactSubdistrictEn, contactDistrictEn, contactProvinceEn, contactZipcodeEn sql.NullString
	var dateNiti sql.NullString

	err := conn.QueryRow(query, identifier, identifier).Scan(
		&id, &username, &email, &password, &name, &nameEn, &contactName, &picture, &block, &sendEmail,
		&registerDate, &lastvisitDate, &params, &lastResetTime, &resetCount, &applicanttypeId,
		&juristicStatus, &juristicCauseQuit, &checkApi, &dateNiti, &taxNumber, &nationality,
		&dateOfBirth, &prefixName, &addressNo, &street, &moo, &soi, &subdistrict, &district, &province,
		&zipcode, &tel, &fax, &latitude, &longitude, &contactStreet, &contactAddressNo, &contactMoo,
		&contactSoi, &contactSubdistrict, &contactDistrict, &contactProvince, &contactZipcode,
		&personfile, &corporatefile, &rememberToken, &state, &personType, &branchType, &branchCode,
		&building, &contactBuilding, &contactTaxId, &contactPrefixName, &contactPrefixText,
		&contactFirstName, &contactLastName, &contactPosition, &contactTel, &contactFax,
		&contactPhoneNumber, &prefixText, &personFirstName, &personLastName, &google2faStatus,
		&google2faSecret, &addressEn, &mooEn, &soiEn, &streetEn, &subdistrictEn, &districtEn,
		&provinceEn, &zipcodeEn, &contactAddressEn, &contactMooEn, &contactSoiEn,
		&contactStreetEn, &contactSubdistrictEn, &contactDistrictEn, &contactProvinceEn, &contactZipcodeEn,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	// Check if user is blocked (block = 1 means blocked)
	if block.Valid && block.Int64 == 1 {
		return nil, fmt.Errorf("account is blocked")
	}

	// Check if user is verified (state = 2 means verified)
	// state: 1=รอยืนยันตัวตน, 2=ยืนยันตัวตนแล้ว, 3=รอเจ้าหน้าที่เปิดใช้งาน
	if state.Valid && state.Int64 != 2 {
		if state.Int64 == 1 {
			return nil, fmt.Errorf("account email not verified")
		}
		if state.Int64 == 3 {
			return nil, fmt.Errorf("account pending admin approval")
		}
		return nil, fmt.Errorf("account not active")
	}

	// Store password temporarily for verification (will be cleared before returning)
	passwordHash := password

	userInfo := &models.UserInfo{
		Id:           &id,
		PasswordHash: &passwordHash, // Temporary, for password verification only
		Name:         &name,
		ContactName:  &contactName,
	}

	// Set basic fields
	if nameEn.Valid && nameEn.String != "" {
		userInfo.NameEn = &nameEn.String
	}

	if block.Valid {
		blockVal := int(block.Int64)
		userInfo.Block = &blockVal
	}

	if state.Valid {
		stateVal := int(state.Int64)
		userInfo.State = &stateVal
	}

	if tel.Valid && tel.String != "" {
		userInfo.Tel = &tel.String
	}

	if picture.Valid && picture.String != "" {
		userInfo.Picture = &picture.String
	}

	if registerDate.Valid && registerDate.String != "" {
		userInfo.RegisterDate = &registerDate.String
	}

	if lastvisitDate.Valid && lastvisitDate.String != "" {
		userInfo.LastvisitDate = &lastvisitDate.String
	}

	if taxNumber.Valid && taxNumber.String != "" {
		userInfo.TaxNumber = &taxNumber.String
	}

	if nationality.Valid && nationality.String != "" {
		userInfo.Nationality = &nationality.String
	}

	if dateOfBirth.Valid && dateOfBirth.String != "" {
		userInfo.DateOfBirth = &dateOfBirth.String
	}

	if prefixName.Valid && prefixName.String != "" {
		userInfo.PrefixName = &prefixName.String
	}

	// Address fields
	if addressNo.Valid && addressNo.String != "" {
		userInfo.AddressNo = &addressNo.String
	}

	if street.Valid && street.String != "" {
		userInfo.Street = &street.String
	}

	if moo.Valid && moo.String != "" {
		userInfo.Moo = &moo.String
	}

	if soi.Valid && soi.String != "" {
		userInfo.Soi = &soi.String
	}

	if subdistrict.Valid && subdistrict.String != "" {
		userInfo.Subdistrict = &subdistrict.String
	}

	if district.Valid && district.String != "" {
		userInfo.District = &district.String
	}

	if province.Valid && province.String != "" {
		userInfo.Province = &province.String
	}

	if zipcode.Valid && zipcode.String != "" {
		userInfo.Zipcode = &zipcode.String
	}

	if fax.Valid && fax.String != "" {
		userInfo.Fax = &fax.String
	}

	if juristicStatus.Valid {
		juristicStatusVal := int(juristicStatus.Int64)
		userInfo.JuristicStatus = &juristicStatusVal
	}

	if applicanttypeId.Valid && applicanttypeId.String != "" {
		userInfo.ApplicanttypeId = &applicanttypeId.String
	}

	// Set additional fields
	if sendEmail.Valid {
		sendEmailVal := int(sendEmail.Int64)
		userInfo.SendEmail = &sendEmailVal
	}

	if params.Valid && params.String != "" {
		userInfo.Params = &params.String
	}

	if lastResetTime.Valid && lastResetTime.String != "" {
		userInfo.LastResetTime = &lastResetTime.String
	}

	if resetCount.Valid {
		resetCountVal := int(resetCount.Int64)
		userInfo.ResetCount = &resetCountVal
	}

	if juristicCauseQuit.Valid && juristicCauseQuit.String != "" {
		userInfo.JuristicCauseQuit = &juristicCauseQuit.String
	}

	if checkApi.Valid {
		checkApiVal := int(checkApi.Int64)
		userInfo.CheckApi = &checkApiVal
	}

	if dateNiti.Valid && dateNiti.String != "" {
		userInfo.DateNiti = &dateNiti.String
	}

	if latitude.Valid && latitude.String != "" {
		userInfo.Latitude = &latitude.String
	}

	if longitude.Valid && longitude.String != "" {
		userInfo.Longitude = &longitude.String
	}

	if contactStreet.Valid && contactStreet.String != "" {
		userInfo.ContactStreet = &contactStreet.String
	}

	if contactAddressNo.Valid && contactAddressNo.String != "" {
		userInfo.ContactAddressNo = &contactAddressNo.String
	}

	if contactMoo.Valid && contactMoo.String != "" {
		userInfo.ContactMoo = &contactMoo.String
	}

	if contactSoi.Valid && contactSoi.String != "" {
		userInfo.ContactSoi = &contactSoi.String
	}

	if contactSubdistrict.Valid && contactSubdistrict.String != "" {
		userInfo.ContactSubdistrict = &contactSubdistrict.String
	}

	if contactDistrict.Valid && contactDistrict.String != "" {
		userInfo.ContactDistrict = &contactDistrict.String
	}

	if contactProvince.Valid && contactProvince.String != "" {
		userInfo.ContactProvince = &contactProvince.String
	}

	if contactZipcode.Valid && contactZipcode.String != "" {
		userInfo.ContactZipcode = &contactZipcode.String
	}

	if personfile.Valid && personfile.String != "" {
		userInfo.Personfile = &personfile.String
	}

	if corporatefile.Valid && corporatefile.String != "" {
		userInfo.Corporatefile = &corporatefile.String
	}

	if rememberToken.Valid && rememberToken.String != "" {
		userInfo.RememberToken = &rememberToken.String
	}

	if personType.Valid && personType.String != "" {
		userInfo.PersonType = &personType.String
	}

	if branchType.Valid && branchType.String != "" {
		userInfo.BranchType = &branchType.String
	}

	if branchCode.Valid && branchCode.String != "" {
		userInfo.BranchCode = &branchCode.String
	}

	if building.Valid && building.String != "" {
		userInfo.Building = &building.String
	}

	if contactBuilding.Valid && contactBuilding.String != "" {
		userInfo.ContactBuilding = &contactBuilding.String
	}

	if contactTaxId.Valid && contactTaxId.String != "" {
		userInfo.ContactTaxId = &contactTaxId.String
	}

	if contactPrefixName.Valid && contactPrefixName.String != "" {
		userInfo.ContactPrefixName = &contactPrefixName.String
	}

	if contactPrefixText.Valid && contactPrefixText.String != "" {
		userInfo.ContactPrefixText = &contactPrefixText.String
	}

	if contactFirstName.Valid && contactFirstName.String != "" {
		userInfo.ContactFirstName = &contactFirstName.String
	}

	if contactLastName.Valid && contactLastName.String != "" {
		userInfo.ContactLastName = &contactLastName.String
	}

	if contactPosition.Valid && contactPosition.String != "" {
		userInfo.ContactPosition = &contactPosition.String
	}

	if contactTel.Valid && contactTel.String != "" {
		userInfo.ContactTel = &contactTel.String
	}

	if contactFax.Valid && contactFax.String != "" {
		userInfo.ContactFax = &contactFax.String
	}

	if contactPhoneNumber.Valid && contactPhoneNumber.String != "" {
		userInfo.ContactPhoneNumber = &contactPhoneNumber.String
	}

	if prefixText.Valid && prefixText.String != "" {
		userInfo.PrefixText = &prefixText.String
	}

	if personFirstName.Valid && personFirstName.String != "" {
		userInfo.PersonFirstName = &personFirstName.String
	}

	if personLastName.Valid && personLastName.String != "" {
		userInfo.PersonLastName = &personLastName.String
	}

	if google2faStatus.Valid {
		google2faStatusVal := int(google2faStatus.Int64)
		userInfo.Google2faStatus = &google2faStatusVal
	}

	if google2faSecret.Valid && google2faSecret.String != "" {
		userInfo.Google2faSecret = &google2faSecret.String
	}

	if addressEn.Valid && addressEn.String != "" {
		userInfo.AddressEn = &addressEn.String
	}

	if mooEn.Valid && mooEn.String != "" {
		userInfo.MooEn = &mooEn.String
	}

	if soiEn.Valid && soiEn.String != "" {
		userInfo.SoiEn = &soiEn.String
	}

	if streetEn.Valid && streetEn.String != "" {
		userInfo.StreetEn = &streetEn.String
	}

	if subdistrictEn.Valid && subdistrictEn.String != "" {
		userInfo.SubdistrictEn = &subdistrictEn.String
	}

	if districtEn.Valid && districtEn.String != "" {
		userInfo.DistrictEn = &districtEn.String
	}

	if provinceEn.Valid && provinceEn.String != "" {
		userInfo.ProvinceEn = &provinceEn.String
	}

	if zipcodeEn.Valid && zipcodeEn.String != "" {
		userInfo.ZipcodeEn = &zipcodeEn.String
	}

	if contactAddressEn.Valid && contactAddressEn.String != "" {
		userInfo.ContactAddressEn = &contactAddressEn.String
	}

	if contactMooEn.Valid && contactMooEn.String != "" {
		userInfo.ContactMooEn = &contactMooEn.String
	}

	if contactSoiEn.Valid && contactSoiEn.String != "" {
		userInfo.ContactSoiEn = &contactSoiEn.String
	}

	if contactStreetEn.Valid && contactStreetEn.String != "" {
		userInfo.ContactStreetEn = &contactStreetEn.String
	}

	if contactSubdistrictEn.Valid && contactSubdistrictEn.String != "" {
		userInfo.ContactSubdistrictEn = &contactSubdistrictEn.String
	}

	if contactDistrictEn.Valid && contactDistrictEn.String != "" {
		userInfo.ContactDistrictEn = &contactDistrictEn.String
	}

	if contactProvinceEn.Valid && contactProvinceEn.String != "" {
		userInfo.ContactProvinceEn = &contactProvinceEn.String
	}

	if contactZipcodeEn.Valid && contactZipcodeEn.String != "" {
		userInfo.ContactZipcodeEn = &contactZipcodeEn.String
	}

	userInfo.Email = &email

	// Set status based on state
	statusId := 6 // active
	statusName := "ผู้ประกอบการ"
	statusGroup := "user"
	userInfo.Role = models.Role{Id: statusId, Name: statusName, Group: statusGroup}

	// Note: PasswordHash is kept for verification in handler
	// Handler should clear it (set to nil) before returning response

	return userInfo, nil
}

// FindUserRegisterByID finds user by runrecno in user_register table
// Maps fields from user_register to UserInfo model
func FindUserRegisterByID(conn *sql.DB, runrecno int) (*models.UserInfo, error) {
	query := `SELECT runrecno, reg_ip, reg_13ID, reg_intital, reg_fname, reg_lname, reg_subdepart, reg_pis, 
			  reg_email, reg_phone, reg_wphone, reg_uname, reg_pword, reg_unmd5, reg_fileName, reg_update, 
			  created_at, created_by, deleted_at, params, updated_at, name, remember_token, is_no_copy, 
			  is_officer, role, status, tisbill, delete_from_temp, add_to_temp, change_sub_temp, 
			  Line_token, Line_userId, position, surety
			  FROM user_register 
			  WHERE runrecno = ? AND deleted_at IS NULL`

	var id int
	var regIP, reg13ID, regIntital, regFname, regLname, regSubdepart, regPis, regEmail, regPhone, regWphone sql.NullString
	var regUname, regPword, regUnmd5, regFileName sql.NullString
	var regUpdate, createdAt, deletedAt, updatedAt sql.NullTime
	var createdBy, params, name, rememberToken, isNoCopy sql.NullString
	var isOfficer, role, status, tisbill sql.NullInt64
	var deleteFromTemp, addToTemp, changeSubTemp, lineToken, lineUserId sql.NullString
	var position, surety sql.NullString

	err := conn.QueryRow(query, runrecno).Scan(
		&id, &regIP, &reg13ID, &regIntital, &regFname, &regLname, &regSubdepart, &regPis,
		&regEmail, &regPhone, &regWphone, &regUname, &regPword, &regUnmd5, &regFileName, &regUpdate,
		&createdAt, &createdBy, &deletedAt, &params, &updatedAt, &name, &rememberToken, &isNoCopy,
		&isOfficer, &role, &status, &tisbill, &deleteFromTemp, &addToTemp, &changeSubTemp,
		&lineToken, &lineUserId, &position, &surety,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	userInfo := &models.UserInfo{}

	// Map basic fields
	userInfo.Id = &id
	if regUname.Valid {
		userInfo.Username = regUname.String
	}
	if regEmail.Valid {
		userInfo.Email = &regEmail.String
	}

	// Map name fields
	if name.Valid && name.String != "" {
		userInfo.Name = &name.String
	} else if regFname.Valid || regLname.Valid {
		fullName := ""
		// if regIntital.Valid {
		// 	fullName = regIntital.String + " "
		// }
		if regFname.Valid {
			fullName += regFname.String
		}
		if regLname.Valid {
			fullName += " " + regLname.String
		}
		if fullName != "" {
			userInfo.Name = &fullName
		}
	}

	if regSubdepart.Valid {
		userInfo.RegSubdepart = &regSubdepart.String
	}

	// Map person first name and last name
	if regFname.Valid {
		userInfo.PersonFirstName = &regFname.String
	}
	if regLname.Valid {
		userInfo.PersonLastName = &regLname.String
	}
	if regIntital.Valid {
		userInfo.PrefixName = &regIntital.String
		userInfo.PrefixText = &regIntital.String
	}

	// Map picture
	if regFileName.Valid {
		userInfo.Picture = &regFileName.String
	}

	// Map phone numbers
	if regPhone.Valid {
		userInfo.ContactPhoneNumber = &regPhone.String
		userInfo.Tel = &regPhone.String
	}
	if regWphone.Valid {
		userInfo.ContactTel = &regWphone.String
	}

	// Map status (1=ใช้งาน, 0=ปิด) -> Block (0=ไม่ถูกบล็อก, 1=ถูกบล็อก)
	if status.Valid {
		// status = 1 means active, so block = 0 (not blocked)
		// status = 0 means inactive, so block = 1 (blocked)
		blockVal := 0
		if status.Int64 == 0 {
			blockVal = 1
		}
		userInfo.Block = &blockVal
		// Also map to State: 1=ใช้งาน=state 2, 0=ปิด=state 3
		stateVal := 2 // verified
		if status.Int64 == 0 {
			stateVal = 3 // pending admin approval
		}
		userInfo.State = &stateVal
	}

	// Map params
	if params.Valid {
		userInfo.Params = &params.String
	}

	// Map remember token
	if rememberToken.Valid {
		userInfo.RememberToken = &rememberToken.String
	}

	// Map created_at to RegisterDate
	if createdAt.Valid {
		registerDate := createdAt.Time.Format("2006-01-02 15:04:05")
		userInfo.RegisterDate = &registerDate
	}

	// Map position
	if position.Valid {
		userInfo.ContactPosition = &position.String
	}

	// Map role
	if role.Valid {
		userInfo.Role = models.Role{
			Id: int(role.Int64),
		}
	} else {
		userInfo.Role = models.Role{
			Id: 0,
		}
	}

	// Note: ID card (reg_13ID) can be stored in TaxNumber or a custom field
	if reg13ID.Valid {
		userInfo.TaxNumber = &reg13ID.String
	}

	return userInfo, nil
}

// FindUserRegisterByUsernameOrEmail finds user by username or email in user_register table
// Maps fields from user_register to UserInfo model
func FindUserRegisterByUsernameOrEmail(conn *sql.DB, identifier string) (*models.UserInfo, error) {
	query := `SELECT runrecno, reg_ip, reg_13ID, reg_intital, reg_fname, reg_lname, reg_subdepart, reg_pis, 
			  reg_email, reg_phone, reg_wphone, reg_uname, reg_pword, reg_unmd5, reg_fileName, reg_update, 
			  created_at, created_by, deleted_at, params, updated_at, name, remember_token, is_no_copy, 
			  is_officer, role, status, tisbill, delete_from_temp, add_to_temp, change_sub_temp, 
			  Line_token, Line_userId, position, surety
			  FROM user_register 
			  WHERE (LOWER(reg_uname) = LOWER(?) OR LOWER(reg_email) = LOWER(?)) AND deleted_at IS NULL`

	var id int
	var regIP, reg13ID, regIntital, regFname, regLname, regSubdepart, regPis, regEmail, regPhone, regWphone sql.NullString
	var regUname, regPword, regUnmd5, regFileName sql.NullString
	var regUpdate, createdAt, deletedAt, updatedAt sql.NullTime
	var createdBy, params, name, rememberToken, isNoCopy sql.NullString
	var isOfficer, role, status, tisbill sql.NullInt64
	var deleteFromTemp, addToTemp, changeSubTemp, lineToken, lineUserId sql.NullString
	var position, surety sql.NullString

	err := conn.QueryRow(query, identifier, identifier).Scan(
		&id, &regIP, &reg13ID, &regIntital, &regFname, &regLname, &regSubdepart, &regPis,
		&regEmail, &regPhone, &regWphone, &regUname, &regPword, &regUnmd5, &regFileName, &regUpdate,
		&createdAt, &createdBy, &deletedAt, &params, &updatedAt, &name, &rememberToken, &isNoCopy,
		&isOfficer, &role, &status, &tisbill, &deleteFromTemp, &addToTemp, &changeSubTemp,
		&lineToken, &lineUserId, &position, &surety,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, err
	}

	// Check if user is blocked (status = 0 means inactive/blocked)
	if status.Valid && status.Int64 == 0 {
		return nil, fmt.Errorf("account is blocked")
	}

	// Store password temporarily for verification (will be cleared before returning)
	passwordHash := ""
	if regPword.Valid {
		passwordHash = regPword.String
	}

	userInfo := &models.UserInfo{}

	// Map basic fields
	userInfo.Id = &id
	if regUname.Valid {
		userInfo.Username = regUname.String
	}
	if regEmail.Valid {
		userInfo.Email = &regEmail.String
	}
	if passwordHash != "" {
		userInfo.PasswordHash = &passwordHash
	}

	// Map name fields
	if name.Valid && name.String != "" {
		userInfo.Name = &name.String
	} else if regFname.Valid || regLname.Valid {
		fullName := ""
		// if regIntital.Valid {
		// 	fullName = regIntital.String + " "
		// }
		if regFname.Valid {
			fullName += regFname.String
		}
		if regLname.Valid {
			fullName += " " + regLname.String
		}
		if fullName != "" {
			userInfo.Name = &fullName
		}
	}

	if regSubdepart.Valid {
		userInfo.RegSubdepart = &regSubdepart.String
	}

	// Map person first name and last name
	if regFname.Valid {
		userInfo.PersonFirstName = &regFname.String
	}
	if regLname.Valid {
		userInfo.PersonLastName = &regLname.String
	}
	if regIntital.Valid {
		userInfo.PrefixName = &regIntital.String
		userInfo.PrefixText = &regIntital.String
	}

	// Map picture
	if regFileName.Valid {
		userInfo.Picture = &regFileName.String
	}

	// Map phone numbers
	if regPhone.Valid {
		userInfo.ContactPhoneNumber = &regPhone.String
		userInfo.Tel = &regPhone.String
	}
	if regWphone.Valid {
		userInfo.ContactTel = &regWphone.String
	}

	// Map status (1=ใช้งาน, 0=ปิด) -> Block (0=ไม่ถูกบล็อก, 1=ถูกบล็อก)
	if status.Valid {
		// status = 1 means active, so block = 0 (not blocked)
		// status = 0 means inactive, so block = 1 (blocked)
		blockVal := 0
		if status.Int64 == 0 {
			blockVal = 1
		}
		userInfo.Block = &blockVal
		// Also map to State: 1=ใช้งาน=state 2, 0=ปิด=state 3
		stateVal := 2 // verified
		if status.Int64 == 0 {
			stateVal = 3 // pending admin approval
		}
		userInfo.State = &stateVal
	}

	// Map params
	if params.Valid {
		userInfo.Params = &params.String
	}

	// Map remember token
	if rememberToken.Valid {
		userInfo.RememberToken = &rememberToken.String
	}

	// Map created_at to RegisterDate
	if createdAt.Valid {
		registerDate := createdAt.Time.Format("2006-01-02 15:04:05")
		userInfo.RegisterDate = &registerDate
	}

	// Map position
	if position.Valid {
		userInfo.ContactPosition = &position.String
	}

	// Map role
	if role.Valid {
		userInfo.Role = models.Role{
			Id: int(role.Int64),
		}
	} else {
		userInfo.Role = models.Role{
			Id: 0,
		}
	}

	// Note: ID card (reg_13ID) can be stored in TaxNumber
	if reg13ID.Valid {
		userInfo.TaxNumber = &reg13ID.String
	}

	// Set status based on state
	statusId := 5 // active
	statusName := "เจ้าหน้าที่"
	statusGroup := "admin"

	if role.Valid {
		statusIdDB := int(role.Int64)
		if statusIdDB == 5 {
			statusId = 4
			statusName = "ผอ."
		} else if statusIdDB == 6 {
			statusId = 2
			statusName = "ผก."
		}
	}

	userInfo.Role = models.Role{Id: statusId, Name: statusName, Group: statusGroup}

	return userInfo, nil
}

// Helper function to convert string to *string
func stringPtr(s string) *string {
	return &s
}

// GetUsersBySubDepartment retrieves users from user_register where SUBSTRING(reg_subdepart, 1, 2) matches
// Maps fields from user_register to UserInfo model (similar to FindUserRegisterByUsernameOrEmail)
func GetUsersBySubDepartment(conn *sql.DB, regSubdepart string) (data []models.UserInfo, err error) {
	if len(regSubdepart) < 2 {
		return nil, fmt.Errorf("reg_subdepart must be at least 2 characters")
	}

	query := `SELECT runrecno, reg_ip, reg_13ID, reg_intital, reg_fname, reg_lname, reg_subdepart, reg_pis, 
			  reg_email, reg_phone, reg_wphone, reg_uname, reg_pword, reg_unmd5, reg_fileName, reg_update, 
			  created_at, created_by, deleted_at, params, updated_at, name, remember_token, is_no_copy, 
			  is_officer, role, status, tisbill, delete_from_temp, add_to_temp, change_sub_temp, 
			  Line_token, Line_userId, position, surety
			  FROM user_register 
			  WHERE SUBSTRING(reg_subdepart, 1, 2) = SUBSTRING(?, 1, 2)
				AND deleted_at IS NULL
				AND status = '1'
			  ORDER BY reg_fname, reg_lname`

	rows, err := conn.Query(query, regSubdepart)
	if err != nil {
		return nil, fmt.Errorf("query error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var regIP, reg13ID, regIntital, regFname, regLname, regSubdepartVal, regPis, regEmail, regPhone, regWphone sql.NullString
		var regUname, regPword, regUnmd5, regFileName sql.NullString
		var regUpdate, createdAt, deletedAt, updatedAt sql.NullTime
		var createdBy, params, name, rememberToken, isNoCopy sql.NullString
		var isOfficer, role, status, tisbill sql.NullInt64
		var deleteFromTemp, addToTemp, changeSubTemp, lineToken, lineUserId sql.NullString
		var position, surety sql.NullString

		err := rows.Scan(
			&id, &regIP, &reg13ID, &regIntital, &regFname, &regLname, &regSubdepartVal, &regPis,
			&regEmail, &regPhone, &regWphone, &regUname, &regPword, &regUnmd5, &regFileName, &regUpdate,
			&createdAt, &createdBy, &deletedAt, &params, &updatedAt, &name, &rememberToken, &isNoCopy,
			&isOfficer, &role, &status, &tisbill, &deleteFromTemp, &addToTemp, &changeSubTemp,
			&lineToken, &lineUserId, &position, &surety,
		)
		if err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}

		userInfo := models.UserInfo{}

		// Map basic fields
		userInfo.Id = &id
		if regUname.Valid {
			userInfo.Username = regUname.String
		}
		if regEmail.Valid {
			userInfo.Email = &regEmail.String
		}

		// Map name fields
		if name.Valid && name.String != "" {
			userInfo.Name = &name.String
		} else if regFname.Valid || regLname.Valid {
			fullName := ""
			// if regIntital.Valid {
			// 	fullName = regIntital.String + " "
			// }
			if regFname.Valid {
				fullName += regFname.String
			}
			if regLname.Valid {
				fullName += " " + regLname.String
			}
			if fullName != "" {
				userInfo.Name = &fullName
			}
		}

		if regSubdepartVal.Valid {
			userInfo.RegSubdepart = &regSubdepartVal.String
		}

		// Map person first name and last name
		if regFname.Valid {
			userInfo.PersonFirstName = &regFname.String
		}
		if regLname.Valid {
			userInfo.PersonLastName = &regLname.String
		}
		if regIntital.Valid {
			userInfo.PrefixName = &regIntital.String
			userInfo.PrefixText = &regIntital.String
		}

		// Map picture
		if regFileName.Valid {
			userInfo.Picture = &regFileName.String
		}

		// Map phone numbers
		if regPhone.Valid {
			userInfo.ContactPhoneNumber = &regPhone.String
			userInfo.Tel = &regPhone.String
		}
		if regWphone.Valid {
			userInfo.ContactTel = &regWphone.String
		}

		// Map status (1=ใช้งาน, 0=ปิด) -> Block (0=ไม่ถูกบล็อก, 1=ถูกบล็อก)
		if status.Valid {
			blockVal := 0
			if status.Int64 == 0 {
				blockVal = 1
			}
			userInfo.Block = &blockVal
			stateVal := 2 // verified
			if status.Int64 == 0 {
				stateVal = 3 // pending admin approval
			}
			userInfo.State = &stateVal
		}

		// Map params
		if params.Valid {
			userInfo.Params = &params.String
		}

		// Map remember token
		if rememberToken.Valid {
			userInfo.RememberToken = &rememberToken.String
		}

		// Map created_at to RegisterDate
		if createdAt.Valid {
			registerDate := createdAt.Time.Format("2006-01-02 15:04:05")
			userInfo.RegisterDate = &registerDate
		}

		// Map position
		if position.Valid {
			userInfo.ContactPosition = &position.String
		}

		// Map role
		if role.Valid {
			userInfo.Role = models.Role{
				Id: int(role.Int64),
			}
		} else {
			userInfo.Role = models.Role{
				Id: 0,
			}
		}

		// Note: ID card (reg_13ID) can be stored in TaxNumber
		if reg13ID.Valid {
			userInfo.TaxNumber = &reg13ID.String
		}

		// Set status based on state
		statusId := 5 // active
		statusName := "เจ้าหน้าที่"
		statusGroup := "admin"

		if role.Valid {
			statusIdDB := int(role.Int64)
			if statusIdDB == 5 {
				statusId = 4
				statusName = "ผอ."
			} else if statusIdDB == 6 {
				statusId = 2
				statusName = "ผก."
			}
		}
		userInfo.Role = models.Role{Id: statusId, Name: statusName, Group: statusGroup}

		data = append(data, userInfo)
	}

	return
}

// GetUsersByDepartment retrieves users from user_register filtered by department id (did)
// Returns MasterData format for select box search
func GetUsersByDepartment(conn *sql.DB, did string) (data []models.MasterData, err error) {
	if did == "" {
		return nil, fmt.Errorf("department id (did) is required")
	}

	query := `SELECT runrecno, 
				CASE 
					WHEN name IS NOT NULL AND name != '' THEN name
					ELSE CONCAT(COALESCE(reg_fname, ''), ' ', COALESCE(reg_lname, ''))
				END as display_name,
				reg_uname, reg_email,reg_subdepart
			  FROM user_register 
			  WHERE SUBSTRING(reg_subdepart, 1, 2) = ?
				AND deleted_at IS NULL
				AND status = 1
			  ORDER BY reg_fname, reg_lname`

	rows, err := conn.Query(query, did)
	if err != nil {
		return nil, fmt.Errorf("query error: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id int
		var displayName, username, email, subDepart sql.NullString

		err := rows.Scan(&id, &displayName, &username, &email, &subDepart)
		if err != nil {
			return nil, fmt.Errorf("scan error: %v", err)
		}

		masterData := models.MasterData{
			Id: id,
		}

		if displayName.Valid && displayName.String != "" {
			masterData.Name = displayName.String
		} else {
			masterData.Name = ""
		}

		// Set code to username if available
		if username.Valid && username.String != "" {
			code := username.String
			masterData.Code = &code
		}

		// Set email if available
		if email.Valid && email.String != "" {
			emailVal := email.String
			masterData.NameEn = &emailVal
		}
		if subDepart.Valid && subDepart.String != "" {
			masterData.SubName = subDepart.String
		}

		data = append(data, masterData)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %v", err)
	}

	return
}
