package repository

import (
	"database/sql"
	"estisi/log"
	"estisi/models"
	"strings"
)

func GetProvince(conn *sql.DB) (data []models.Province, err error) {

	sqlStr := `
		SELECT 
			PROVINCE_ID,
			COALESCE(PROVINCE_CODE, '') AS PROVINCE_CODE,
			COALESCE(PROVINCE_NAME, '') AS PROVINCE_NAME,
			COALESCE(GEO_ID, '') AS GEO_ID
		FROM province 
		ORDER BY PROVINCE_NAME
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: %v", err)
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.Province
		err := rows.Scan(&res.Id, &res.Code, &res.Name, &res.GeoId)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetDistrictByProvId(conn *sql.DB, provid int) (data []models.District, err error) {

	sqlStr := `
	SELECT 
    a.AMPHUR_ID,
    COALESCE(a.AMPHUR_CODE, '') AS AMPHUR_CODE,
    COALESCE(a.AMPHUR_NAME, '') AS AMPHUR_NAME,
    COALESCE(a.GEO_ID, '') AS GEO_ID,
    COALESCE(a.PROVINCE_ID, '') AS PROVINCE_ID,
    COALESCE(a.POSTCODE, '') AS POSTCODE 
FROM amphur a 
WHERE a.PROVINCE_ID = ?
ORDER BY a.AMPHUR_NAME
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: %v", err)
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query(provid)
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.District
		err = rows.Scan(&res.Id, &res.Code, &res.Name, &res.GeoId, &res.ProvinceId, &res.PostCode)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return
		}
		data = append(data, res)
	}

	return
}

func GetSubDistrictByProvIdDistId(conn *sql.DB, provid, districtid int) (data []models.SubDistrict, err error) {

	sqlStr := `
		SELECT 
			COALESCE(DISTRICT_ID, '') AS DISTRICT_ID,
			COALESCE(DISTRICT_CODE, '') AS DISTRICT_CODE,
			COALESCE(DISTRICT_NAME, '') AS DISTRICT_NAME,
			COALESCE(GEO_ID, '') AS GEO_ID,
			COALESCE(PROVINCE_ID, '') AS PROVINCE_ID,
			COALESCE(AMPHUR_ID, '') AS AMPHUR_ID
		FROM district 
		WHERE PROVINCE_ID = ? AND AMPHUR_ID = ?
		ORDER BY DISTRICT_NAME
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error:" + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query(provid, districtid)
	if err != nil {
		log.Error("Query error:" + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.SubDistrict
		err = rows.Scan(&res.Id, &res.Code, &res.Name, &res.GeoId, &res.ProvinceId, &res.DistrictId)
		if err != nil {
			log.Error("Scan error:" + err.Error())
			return
		}
		data = append(data, res)
	}

	return
}

func GetTitles(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			ID,
			COALESCE(title_name, '') AS NAME
		FROM tr6_titlename
		ORDER BY title_name
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: %v", err)
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: %v", err)
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetBanks(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			id,
			COALESCE(title, '') AS title
		FROM basic_banks
		WHERE state = 1
		ORDER BY title
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: %v", err)
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: %v", err)
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetAccountTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			account_type_id,
			COALESCE(account_type_title, '') AS title
		FROM i_master_bank_account_type
		WHERE account_type_isactive = 1
		ORDER BY account_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: %v", err)
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: %v", err)
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetAcademy(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			academy_id,
			COALESCE(academy_name, '') AS title
		FROM i_master_academy
		WHERE academy_isactive = 1
		ORDER BY academy_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetDegrees(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			degree_id,
			COALESCE(degree_name, '') AS title
		FROM i_master_degree
		WHERE degree_isactive = 1
		ORDER BY degree_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetYearSelect(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			year_id,
			COALESCE(year_title, '') AS title
		FROM i_master_year_select
		WHERE year_isactive = 1
		ORDER BY year_title DESC
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetExpertGroupTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			ex_group_type_id,
			COALESCE(ex_group_type_title, '') AS title
		FROM i_master_expert_group_type
		WHERE ex_group_type_isactive = 1
		ORDER BY ex_group_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetResponsibleGroups(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			CAST(sub_id AS UNSIGNED) AS id,
			sub_id AS code,
			COALESCE(sub_departname, '') AS name
		FROM sub_department
	WHERE did = '08' AND sub_id <> '0800'
	ORDER BY sub_id
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		err := rows.Scan(&res.Id, &code, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid {
			res.Code = &code.String
		}
		data = append(data, res)
	}

	return
}

func GetSubDepartments(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			CAST(sub_id AS UNSIGNED) AS id,
			sub_id AS code,
			COALESCE(sub_departname, '') AS name
		FROM sub_department 
	ORDER BY sub_departname
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		err := rows.Scan(&res.Id, &code, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid {
			res.Code = &code.String
		}
		data = append(data, res)
	}

	return
}

func GetSubDepartmentsByDPisId(conn *sql.DB, dpisId string) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			CAST(sub_id AS UNSIGNED) AS id,
			sub_id AS code,
			COALESCE(sub_departname, '') AS name
		FROM sub_department
	WHERE dpis_id = ?
	ORDER BY sub_departname
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query(dpisId)
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		err := rows.Scan(&res.Id, &code, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid {
			res.Code = &code.String
		}
		data = append(data, res)
	}

	return
}

func GetDepartments(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			did AS  id,
			dpis_id AS code,
			COALESCE(depart_name, '') AS name,
			COALESCE(depart_nameShort, '') AS name_short,
			COALESCE(depart_name_engshort, '') AS name_eng_short
		FROM department
		ORDER BY depart_name
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		var nameShort, nameEngShort sql.NullString
		err := rows.Scan(&res.Id, &code, &res.Name, &nameShort, &nameEngShort)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid {
			res.Code = &code.String
		}
		if nameShort.Valid && nameShort.String != "" {
			res.NameTh = &nameShort.String
		}
		if nameEngShort.Valid && nameEngShort.String != "" {
			res.NameEn = &nameEngShort.String
		}
		data = append(data, res)
	}

	return
}

func GetProductGroups(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			id,
			COALESCE(product_group, '') AS title
		FROM tb3_tis_productgroup
	WHERE status = 1
	ORDER BY product_group
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetGroupPositions(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			ex_group_pos_id,
			COALESCE(ex_group_pos_title, '') AS title
		FROM i_master_expert_group_pos
	WHERE ex_group_pos_isactive = 1
	ORDER BY ex_group_pos_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetDirectiveTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			directive_type_id,
			COALESCE(directive_type_title, '') AS title
		FROM i_master_directive_type
	WHERE directive_type_isactive = 1
	ORDER BY directive_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetOrganizations(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			org_id,
			COALESCE(org_title, '') AS title
		FROM i_master_org
	WHERE org_isactive = 1
	ORDER BY org_title
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetExpertMemberTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			ex_member_type_id,
			COALESCE(ex_member_type_title, '') AS title
		FROM i_master_expert_member_type
	WHERE ex_member_type_isactive = 1
	ORDER BY ex_member_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetBallotGroupTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			ballot_group_type_id,
			COALESCE(ballot_group_type_name, '') AS name
		FROM i_master_ballot_group_type
		WHERE ballot_group_type_isactive = '1'
		ORDER BY ballot_group_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetBallotAnswerTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			ballot_ans_type_id,
			COALESCE(ballot_ans_type_name, '') AS name
		FROM i_master_ballot_ans_type
		WHERE ballot_ans_type_isactive = '1'
		ORDER BY ballot_ans_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetBallotRequestStatuses(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			id,
			COALESCE(name, '') AS name,
			COALESCE(code, '') AS code
		FROM i_master_ballot_request_status
		ORDER BY id
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		err := rows.Scan(&res.Id, &res.Name, &code)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid {
			res.Code = &code.String
		}
		data = append(data, res)
	}

	return
}

func GetWriterTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			wtype_id,
			COALESCE(wtype_name_full, wtype_name_short, '') AS name
		FROM i_master_writer_type
		WHERE wtype_isactive = '1'
		ORDER BY wtype_order
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetStdTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			std_type_id,
			COALESCE(std_type_name_full, std_type_name_short, '') AS name
		FROM i_master_std_type
		WHERE std_type_isactive = '1'
		ORDER BY std_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetProductPolicyGroups(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			product_policy_id,
			COALESCE(product_policy_title, '') AS name
		FROM i_master_product_policy
		WHERE product_policy_isactive = '1'
		ORDER BY product_policy_title
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetProductBCGs(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			product_bcg_id,
			COALESCE(product_bcg_full, product_bcg_short, '') AS name
		FROM i_master_product_bcg
		WHERE product_bcg_isactive = '1'
		ORDER BY product_bcg_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetRegulations(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			regulation_id,
			COALESCE(regulation_name, '') AS name
		FROM i_master_regulation
		WHERE regulation_isactive = '1'
		ORDER BY regulation_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetMethodTypes(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			method_type_id,
			COALESCE(method_type_name, '') AS name
		FROM i_master_method_type
		WHERE method_type_isactive = '1'
		ORDER BY method_type_orderby
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetTISProductGroups(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			id,
			COALESCE(product_group, '') AS name
		FROM tb3_tis_productgroup
		WHERE status = 1
		ORDER BY no
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetNSSSectors(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			nss_id,
			CONCAT(COALESCE(nss_code, ''), ' ', COALESCE(nss_secter, '')) AS name,
			COALESCE(nss_subject, '') AS subName 
		FROM i_master_nss
		WHERE nss_isactive = '1'
		ORDER BY nss_id
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name, &res.SubName)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetISODeliverables(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			id,
			COALESCE(reference, '') AS name
		FROM i_master_iso_deliverables
		WHERE id IS NOT NULL
		ORDER BY id
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		err := rows.Scan(&res.Id, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

func GetISOICS(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			identifier,
			COALESCE(titleEn, titleFr, '') AS name,
			COALESCE(scopeEn, '') AS subName
		FROM i_master_iso_ics
		WHERE identifier IS NOT NULL
		ORDER BY identifier
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	count_ := 0
	for rows.Next() {
		count_++
		var res models.MasterData
		err := rows.Scan(&res.Code, &res.Name, &res.SubName)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		res.Id = count_

		data = append(data, res)
	}

	return
}

func GetTISNumbers(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			tb3_TisAutono,
			COALESCE(tb3_Tisno, '') AS name,
			COALESCE(tb3_TisThainame, '') AS nameTh,
			COALESCE(tb3_TisEngname, '') AS nameEn
		FROM tb3_tis
		WHERE status = '1'
		ORDER BY tb3_Tisno
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var nameTh, nameEn sql.NullString
		err := rows.Scan(&res.Id, &res.Name, &nameTh, &nameEn)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if nameTh.Valid && nameTh.String != "" {
			res.NameTh = &nameTh.String
		}
		if nameEn.Valid && nameEn.String != "" {
			res.NameEn = &nameEn.String
		}
		data = append(data, res)
	}

	return
}

func GetSDOS(conn *sql.DB) (data []models.MasterData, err error) {

	sqlStr := `
		SELECT 
			sdos_id,
			COALESCE(sdos_std_branch_name, '') AS name,
			COALESCE(sdos_std_branch_name, '') AS subName,
			sdos_register_id AS code
		FROM i_master_sdos
		ORDER BY sdos_std_org_full
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		err := rows.Scan(&res.Id, &res.Name, &res.SubName, &code)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid && code.String != "" {
			res.Code = &code.String
		}
		data = append(data, res)
	}

	return
}

func GetNSSSubjects(conn *sql.DB, sectorId *int) (data []models.MasterData, err error) {
	var queryBuilder strings.Builder
	var args []interface{}

	queryBuilder.WriteString(`
		SELECT 
			nss_id,
			COALESCE(nss_subject, '') AS name 
		FROM i_master_nss
		WHERE nss_isactive = '1'
	`)

	if sectorId != nil && *sectorId > 0 {
		queryBuilder.WriteString(` AND nss_id = ?`)
		args = append(args, *sectorId)
	}

	queryBuilder.WriteString(` ORDER BY nss_subject`)

	stmt, err := conn.Prepare(queryBuilder.String())
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query(args...)
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		if err = rows.Scan(&res.Id, &res.Name); err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		data = append(data, res)
	}

	return
}

// GetStageCodes retrieves all active stage codes from i_master_stagecode
func GetStageCodes(conn *sql.DB) (data []models.MasterData, err error) {
	sqlStr := `
		SELECT 
			stage_id,
			COALESCE(stage_title_th, stage_title_en, '') AS name,
			COALESCE(stage_ui_msg, '') AS subName,
			stage_code AS code,
			stage_title_th AS nameTh,
			stage_title_en AS nameEn
		FROM i_master_stagecode
		WHERE stage_isactive = '1'
		ORDER BY stage_code
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code, nameTh, nameEn sql.NullString
		err := rows.Scan(&res.Id, &res.Name, &res.SubName, &code, &nameTh, &nameEn)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid {
			res.Code = &code.String
		}
		if nameTh.Valid {
			res.NameTh = &nameTh.String
		}
		if nameEn.Valid {
			res.NameEn = &nameEn.String
		}
		data = append(data, res)
	}

	return
}

// GetDocumentTypes retrieves all active document types from i_master_document_type
func GetDocumentTypes(conn *sql.DB) (data []models.MasterData, err error) {
	sqlStr := `
		SELECT 
			document_type_id,
			document_type_code,
			COALESCE(document_type_name, '') AS document_type_name ,
			COALESCE(document_type_icon, '') AS document_type_icon 
		FROM i_master_document_type
		WHERE document_type_isactive = '1'
		ORDER BY document_type_orderby, document_type_name
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		var icon sql.NullString
		err := rows.Scan(&res.Id, &code, &res.Name, &icon)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid && code.String != "" {
			res.Code = &code.String
		}
		if icon.Valid && icon.String != "" {
			res.Icon = &icon.String
		}
		data = append(data, res)
	}

	return
}

func GetDocumentSubTypes(conn *sql.DB) (data []models.MasterData, err error) {
	sqlStr := `
		SELECT 
			document_sub_type_id,
			document_sub_type_code,
			COALESCE(document_sub_type_name, '') AS document_sub_type_name 
		FROM i_master_document_sub_type
		WHERE document_sub_type_isactive = '1'
		ORDER BY document_sub_type_orderby, document_sub_type_name
	`

	stmt, err := conn.Prepare(sqlStr)
	if err != nil {
		log.Error("Prepare error: " + err.Error())
		return
	}
	defer stmt.Close()

	rows, err := stmt.Query()
	if err != nil {
		log.Error("Query error: " + err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var res models.MasterData
		var code sql.NullString
		err := rows.Scan(&res.Id, &code, &res.Name)
		if err != nil {
			log.Error("Scan error: " + err.Error())
			return nil, err
		}
		if code.Valid && code.String != "" {
			res.Code = &code.String
		}
		data = append(data, res)
	}

	return
}
