package handlers

import (
	"estisi/db"
	"estisi/log"
	"estisi/miniox"
	"estisi/models"
	"estisi/repository"
	"estisi/utils"
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// GetProvinceHandler godoc
// @Summary Get all provinces
// @Description Get list of all provinces from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.Province
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/province [get]
func GetProvinceHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetProvince(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetDistrictByProvIdHandler godoc
// @Summary Get districts by province ID
// @Description Get list of districts that belong to a specific province
// @Tags address
// @Produce json
// @Param provId path int true "Province ID"
// @Success 200 {array} models.District
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/district/{provId} [get]
func GetDistrictByProvIdHandler(c *gin.Context) {

	provId, err := strconv.Atoi(c.Param("provId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "not found provID"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetDistrictByProvId(conn, provId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetSubDistrictByProvIdDistIdHandler godoc
// @Summary Get subdistricts by province and district ID
// @Description Get list of subdistricts within a province and district
// @Tags address
// @Produce json
// @Param provId path int true "Province ID"
// @Param districtId path int true "District ID"
// @Success 200 {array} models.SubDistrict
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/subdistrict/{provId}/{districtId} [get]
func GetSubDistrictByProvIdDistIdHandler(c *gin.Context) {

	provId, err := strconv.Atoi(c.Param("provId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "not found provId"})
		return
	}

	districtId, err := strconv.Atoi(c.Param("districtId"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "not found districtId"})
		return
	}
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetSubDistrictByProvIdDistId(conn, provId, districtId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetTitlesHandler godoc
// @Summary Get all titles
// @Description Get list of all titles from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/titles [get]
func GetTitlesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetTitles(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetBanksHandler godoc
// @Summary Get all banks
// @Description Get list of all banks from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/banks [get]
func GetBanksHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetBanks(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// @Summary Upload file
// @Description Upload file to MinIO
// @Accept multipart/form-data
// @Produce json
// @Param file formData file true "File to upload"
// @Param folder formData string true "Folder name"
// @Success 200 {object} models.UploadResponse
// @Router /api/v1/estandard/uploadFile [post]
func UploadFileHandler(c *gin.Context) {
	// รับไฟล์จาก form field ชื่อ "file"
	file, err := c.FormFile("file")
	if err != nil {
		log.Error("Failed to get file from form: %v", err)
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "กรุณาเลือกไฟล์เพื่ออัปโหลด"})
		return
	}

	log.Info("Received file upload: filename=%s, size=%d, content-type=%s",
		file.Filename, file.Size, file.Header.Get("Content-Type"))

	// รับค่าชื่อ folder จาก form field
	folder := c.PostForm("folder")
	if folder == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "กรุณาเลือกโฟรเดอร์เพื่ออัปโหลด"})
		return
	}

	// รับค่าชื่อ folder จาก form field
	objectName := c.PostForm("objectName")
	if objectName == "" {
		// เรียกใช้ฟังก์ชัน UploadFileMiniO (ใส่ folder เช่น "profile" หรือ "documents")
		fileName := fmt.Sprintf("%d-%s", time.Now().Unix(), filepath.Base(file.Filename))
		objectName = fmt.Sprintf("%s/%s", folder, fileName)
	}

	log.Info("Uploading file to MinIO: objectName=%s", objectName)
	err = miniox.UploadFileMiniO(file, objectName)
	if err != nil {
		log.Error("Failed to upload file: %v", err)

		// Check for storage full error
		errMsg := err.Error()
		if strings.Contains(errMsg, "minimum free drive threshold") ||
			strings.Contains(errMsg, "Storage backend has reached") {
			c.JSON(507, models.ErrorResponse{
				Error: "พื้นที่เก็บข้อมูลเต็ม กรุณาลบไฟล์เก่าบางส่วนเพื่อดำเนินการต่อ",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: errMsg})
		return
	}

	c.JSON(http.StatusOK, models.UploadResponse{
		Message:  "อัปโหลดสำเร็จ",
		Filename: objectName,
		URL:      utils.GetFullPathFilex(objectName),
	})
}

// DeleteFileHandler godoc
// @Summary Delete file
// @Description Delete file from MinIO by objectName (JSON body)
// @Tags File
// @Accept json
// @Produce json
// @Param request body models.DeleteFileRequest true "Delete request"
// @Success 200 {object} models.MessageResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/deleteFile [delete]
func DeleteFileHandler(c *gin.Context) {
	var req models.DeleteFileRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "กรุณาระบุ objectName ของไฟล์ที่จะลบ"})
		return
	}
	req.ObjectName = strings.TrimSpace(req.ObjectName)
	if req.ObjectName == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "objectName ห้ามว่าง"})
		return
	}

	if err := miniox.DeleteFileFromMinIO(req.ObjectName); err != nil {
		// แยกกรณีไฟล์ไม่พบ (NoSuchKey) เป็น 404
		if strings.Contains(strings.ToLower(err.Error()), "nosuchkey") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "ไม่พบไฟล์ที่ต้องการลบ"})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, models.MessageResponse{Message: "delete file success"})
}

// @Summary Download file
// @Description Download file from MinIO by file path
// @Tags File
// @Accept json
// @Produce application/octet-stream
// @Param path query string true "File path in MinIO"
// @Security BearerAuth
// @Success 200 {file} file
// @Failure 400 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/files/download [get]
func DownloadFileHandler(c *gin.Context) {
	filePath := c.Query("path")
	if filePath == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "กรุณาระบุ path ของไฟล์"})
		return
	}

	// Get file from MinIO
	fileReader, contentType, fileSize, err := miniox.GetFileFromMinIO(filePath)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "nosuchkey") || strings.Contains(err.Error(), "ไม่พบไฟล์") {
			c.JSON(http.StatusNotFound, models.ErrorResponse{Error: "ไม่พบไฟล์ที่ต้องการ"})
			return
		}
		log.Error("Failed to download file: %v", err)
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "ไม่สามารถดาวน์โหลดไฟล์: " + err.Error()})
		return
	}
	defer fileReader.Close()

	// Set response headers
	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filepath.Base(filePath)))
	c.Header("Content-Length", fmt.Sprintf("%d", fileSize))

	// Stream file to response
	c.DataFromReader(http.StatusOK, fileSize, contentType, fileReader, nil)
}

// GetAccountTypesHandler godoc
// @Summary Get all account types
// @Description Get list of all account types from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/accountTypes [get]
func GetAccountTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetAccountTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetAcademyHandler godoc
// @Summary Get all academy
// @Description Get list of all academy from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/academy [get]
func GetAcademyHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetAcademy(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetDegreesHandler godoc
// @Summary Get all degrees
// @Description Get list of all degrees from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/degrees [get]
func GetDegreesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetDegrees(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// GetYearSelectHandler godoc
// @Summary Get all year select
// @Description Get list of all year select from the database
// @Tags address
// @Produce json
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/yearSelect [get]
func GetYearSelectHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	dataList, err := repository.GetYearSelect(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dataList)
}

// @Summary Get Expert Group Types
// @Description Get list of expert group types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/committeeTypes [get]
func GetExpertGroupTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetExpertGroupTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get expert group types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get Responsible Groups
// @Description Get list of responsible groups (master data from sub_department)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/responsible-groups [get]
func GetResponsibleGroupsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	groups, err := repository.GetResponsibleGroups(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get responsible groups: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// @Summary Get Departments
// @Description Get list of departments (master data from department table)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/departments [get]
func GetDepartmentsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	departments, err := repository.GetDepartments(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get departments: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, departments)
}

// @Summary Get Sub Departments
// @Description Get list of sub departments (master data from sub_department table)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/sub-departments [get]
func GetSubDepartmentsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	subDepartments, err := repository.GetSubDepartments(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get sub departments: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, subDepartments)
}

// @Summary Get Sub Departments by DPIS ID
// @Description Get list of sub departments by DPIS ID
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param dpisId path string true "DPIS ID"
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/sub-departments/{dpisId} [get]
func GetSubDepartmentsByDPisIdHandler(c *gin.Context) {
	dpisId := c.Param("dpisId")
	if dpisId == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "dpisId parameter is required"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	subDepartments, err := repository.GetSubDepartmentsByDPisId(conn, dpisId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get sub departments: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, subDepartments)
}

// @Summary Get Product Groups
// @Description Get list of product groups (master data from product_group)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/product-groups [get]
func GetProductGroupsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	groups, err := repository.GetProductGroups(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get product groups: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// @Summary Get Group Positions
// @Description Get list of group positions (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/group_positions [get]
func GetGroupPositionsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	groups, err := repository.GetGroupPositions(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get product groups: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// @Summary Get Directive Types
// @Description Get list of directive types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/directive_types [get]
func GetDirectiveTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetDirectiveTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get directive types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get Organizations
// @Description Get list of organizations (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/organizations [get]
func GetOrganizationsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	organizations, err := repository.GetOrganizations(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get organizations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, organizations)
}

// @Summary Get Expert Member Types
// @Description Get list of expert member types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/expertMemberTypes [get]
func GetExpertMemberTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	memberTypes, err := repository.GetExpertMemberTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get expert member types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, memberTypes)
}

// @Summary Get Users by Sub Department
// @Description Get list of users from user_register where SUBSTRING(reg_subdepart, 1, 2) matches the provided reg_subdepart prefix. Returns UserInfo similar to FindUserRegisterByUsernameOrEmail
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param reg_subdepart query string true "Sub department code (e.g., 1704 - will match all starting with 17)"
// @Success 200 {array} models.UserInfo
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/users [get]
func GetUsersBySubDepartmentHandler(c *gin.Context) {
	regSubdepart := c.Query("reg_subdepart")
	if regSubdepart == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "reg_subdepart parameter is required"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	users, err := repository.GetUsersBySubDepartment(conn, regSubdepart)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get users: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// @Summary Get Users by Department
// @Description Get list of users from user_register filtered by department id (did) for select box search
// @Tags Global
// @Accept json
// @Produce json
// @Param did path string true "Department ID (e.g., 08 for กองกำหนดมาตรฐาน)"
// @Success 200 {array} models.MasterData
// @Failure 400 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /users/department/{did} [get]
// @Security BearerAuth
func GetUsersByDepartmentHandler(c *gin.Context) {
	did := c.Param("did")
	if did == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "department id (did) parameter is required"})
		return
	}

	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	users, err := repository.GetUsersByDepartment(conn, did)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get users: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}

// @Summary Get Ballot Group Types
// @Description Get list of ballot group types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-group-types [get]
func GetBallotGroupTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetBallotGroupTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot group types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get Ballot Request Statuses
// @Description Get list of ballot request statuses (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-request-statuses [get]
func GetBallotRequestStatusesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	statuses, err := repository.GetBallotRequestStatuses(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot request statuses: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, statuses)
}

// @Summary Get Ballot Answer Types
// @Description Get list of ballot answer types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/ballot-answer-types [get]
func GetBallotAnswerTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetBallotAnswerTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ballot answer types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get Writer Types
// @Description Get list of writer types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/writer-types [get]
func GetWriterTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetWriterTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get writer types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get Standard Types
// @Description Get list of standard types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/std-types [get]
func GetStdTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetStdTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get standard types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get Product Policy Groups
// @Description Get list of product policy groups (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/product-policy-groups [get]
func GetProductPolicyGroupsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	groups, err := repository.GetProductPolicyGroups(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get product policy groups: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// @Summary Get Product BCGs
// @Description Get list of product BCGs (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/product-bcgs [get]
func GetProductBCGsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	bcgs, err := repository.GetProductBCGs(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get product BCGs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, bcgs)
}

// @Summary Get Regulations
// @Description Get list of regulations (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/regulations [get]
func GetRegulationsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	regulations, err := repository.GetRegulations(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get regulations: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, regulations)
}

// @Summary Get Method Types
// @Description Get list of method types (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/method-types [get]
func GetMethodTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	types, err := repository.GetMethodTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get method types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// @Summary Get TIS Product Groups
// @Description Get list of TIS product groups (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/tis-product-groups [get]
func GetTISProductGroupsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	groups, err := repository.GetTISProductGroups(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get TIS product groups: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// @Summary Get NSS Sectors
// @Description Get list of NSS sectors (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/nss-sectors [get]
func GetNSSSectorsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	sectors, err := repository.GetNSSSectors(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get NSS sectors: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, sectors)
}

// @Summary Get ISO Deliverables
// @Description Get list of ISO deliverables (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/iso-deliverables [get]
func GetISODeliverablesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	deliverables, err := repository.GetISODeliverables(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ISO deliverables: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, deliverables)
}

// @Summary Get ISO ICS
// @Description Get list of ISO ICS (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/iso-ics [get]
func GetISOICSHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	ics, err := repository.GetISOICS(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get ISO ICS: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, ics)
}

// @Summary Get TIS Numbers
// @Description Get list of TIS numbers (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/tis-numbers [get]
func GetTISNumbersHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	numbers, err := repository.GetTISNumbers(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get TIS numbers: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, numbers)
}

// @Summary Get SDOS
// @Description Get list of SDOS (master data)
// @Tags Global
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/sdos [get]
func GetSDOSHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	sdos, err := repository.GetSDOS(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get SDOS: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, sdos)
}

// @Summary Get NSS Subjects
// @Description Get list of NSS subjects (master data). Optionally filter by sector ID.
// @Tags Global
// @Accept json
// @Produce json
// @Param sectorId path int false "Sector ID to filter subjects"
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 401 {object} models.ErrorResponse
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/nss-subjects [get]
// @Router /api/v1/estandard/nss-subjects/{sectorId} [get]
func GetNSSSubjectsHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	var sectorId *int
	if sectorIdParam := c.Param("sectorId"); sectorIdParam != "" {
		id, err := strconv.Atoi(sectorIdParam)
		if err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResponse{Error: "Invalid sector ID"})
			return
		}
		sectorId = &id
	}

	subjects, err := repository.GetNSSSubjects(conn, sectorId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get NSS subjects: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, subjects)
}

// @Summary Get Stage Codes
// @Description Get all active stage codes from master table
// @Tags Master Data
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/stage-codes [get]
func GetStageCodesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	stageCodes, err := repository.GetStageCodes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get stage codes: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, stageCodes)
}

// @Summary Get Document Types
// @Description Get all active document types from master table
// @Tags Master Data
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/document-types [get]
func GetDocumentTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	documentTypes, err := repository.GetDocumentTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get document types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, documentTypes)
}

// @Summary Get Document Sub Types
// @Description Get all active document sub types from master table
// @Tags Master Data
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {array} models.MasterData
// @Failure 500 {object} models.ErrorResponse
// @Router /api/v1/estandard/document-sub-types [get]
func GetDocumentSubTypesHandler(c *gin.Context) {
	conn := db.GetConnectionDB()
	if conn == nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Database connection error"})
		return
	}

	documentSubTypes, err := repository.GetDocumentSubTypes(conn)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{Error: "Failed to get document sub types: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, documentSubTypes)
}
