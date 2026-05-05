package models

type Province struct {
	Id    int    `json:"id"`
	Code  string `json:"code"`
	Name  string `json:"name"`
	GeoId string `json:"geoId"`
}

type District struct {
	Id         int    `json:"id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	GeoId      string `json:"geoId"`
	ProvinceId string `json:"provinceId"`
	PostCode   string `json:"postCode"`
}

type SubDistrict struct {
	Id         int    `json:"id"`
	Code       string `json:"code"`
	Name       string `json:"name"`
	GeoId      string `json:"geoId"`
	DistrictId string `json:"districtId"`
	ProvinceId string `json:"provinceId"`
}

type DeleteFileRequest struct {
	ObjectName string `json:"objectName" binding:"required"`
}

type MasterData struct {
	Id      int     `json:"id"`
	Name    string  `json:"name"`
	SubName string  `json:"subName"`
	Code    *string `json:"code"`
	NameTh  *string `json:"nameTh"`
	NameEn  *string `json:"nameEn"`
	Icon    *string `json:"icon"`
}

type UploadResponse struct {
	Message  string `json:"message"`
	Filename string `json:"filename"`
	URL      string `json:"url"`
}
