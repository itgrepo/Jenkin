package models

type Role struct {
	Id    int    `json:"id"`
	Name  string `json:"name"`
	Group string `json:"group"`
}

type Token struct {
	Value  string `json:"value"`
	Expire string `json:"expire"`
}

type UserInfo struct {
	// SSO Users fields (sso_users table) - All fields except password
	Id                   *int    `json:"id,omitempty"`
	Username             string  `json:"username"`
	PasswordHash         *string `json:"passwordHash,omitempty"`
	Password             *string `json:"password,omitempty"`
	Role                 Role    `json:"role"`
	Name                 *string `json:"name,omitempty"`                   // ชื่อ/บริษัท
	NameEn               *string `json:"name_en,omitempty"`                // En ชื่อ/บริษัท
	ContactName          *string `json:"contact_name,omitempty"`           // ชื่อผู้ติดต่อเจ้าของ E-mail
	Picture              *string `json:"picture,omitempty"`                // ชื่อไฟล์ภาพประจำตัว
	Block                *int    `json:"block,omitempty"`                  // 0=ไม่ถูกบล็อก, 1=ถูกบล็อก
	SendEmail            *int    `json:"sendEmail,omitempty"`              // ส่งอีเมล
	State                *int    `json:"state,omitempty"`                  // 1=รอยืนยัน, 2=ยืนยันแล้ว, 3=รอเจ้าหน้าที่เปิดใช้งาน
	RegisterDate         *string `json:"registerDate,omitempty"`           // วันที่สมัคร
	LastvisitDate        *string `json:"lastvisitDate,omitempty"`          // วันที่เข้าใช้งานล่าสุด
	Params               *string `json:"params,omitempty"`                 // Parameters
	LastResetTime        *string `json:"lastResetTime,omitempty"`          // Date of last password reset
	ResetCount           *int    `json:"resetCount,omitempty"`             // Count of password resets since lastResetTime
	ApplicanttypeId      *string `json:"applicanttype_id,omitempty"`       // ประเภทผู้สมัคร
	JuristicStatus       *int    `json:"juristic_status,omitempty"`        // สถานะนิติบุคคล 1.ยังดำเนินกิจการอยู่, 2.ฟื้นฟู, 3.คืนสู่ทะเบียน, 4.เลิกกิจการ
	JuristicCauseQuit    *string `json:"juristic_cause_quit,omitempty"`    // สาเหตุที่เลิกกิจการ กรณี juristic_status=4
	CheckApi             *int    `json:"check_api,omitempty"`              // เช็คสถานะ API 1.API
	DateNiti             *string `json:"date_niti,omitempty"`              // วันที่นิติบุคคล
	TaxNumber            *string `json:"tax_number,omitempty"`             // เลขประจำตัวผู้เสียภาษี
	Nationality          *string `json:"nationality,omitempty"`            // สัญชาติ
	DateOfBirth          *string `json:"date_of_birth,omitempty"`          // วันเกิด
	PrefixName           *string `json:"prefix_name,omitempty"`            // คำนำหน้าชื่อ
	AddressNo            *string `json:"address_no,omitempty"`             // เลขที่ อาคาร ชั้น ห้อง ชื่อหมู่บ้าน
	Street               *string `json:"street,omitempty"`                 // ถนน
	Moo                  *string `json:"moo,omitempty"`                    // หมู่
	Soi                  *string `json:"soi,omitempty"`                    // ตรอก/ซอย
	Subdistrict          *string `json:"subdistrict,omitempty"`            // แขวง/ตำบล
	District             *string `json:"district,omitempty"`               // เขต/อำเภอ
	Province             *string `json:"province,omitempty"`               // จังหวัด
	Zipcode              *string `json:"zipcode,omitempty"`                // รหัสไปรษณีย์
	Tel                  *string `json:"tel,omitempty"`                    // โทรศัพท์
	Fax                  *string `json:"fax,omitempty"`                    // แฟกซ์
	Latitude             *string `json:"latitude,omitempty"`               // พิกัดที่ตั้ง (ลองจิจูด)
	Longitude            *string `json:"longitude,omitempty"`              // พิกัดที่ตั้ง (ละติจูด)
	ContactStreet        *string `json:"contact_street,omitempty"`         // ถนน (ที่อยู่ที่ติดต่อได้)
	ContactAddressNo     *string `json:"contact_address_no,omitempty"`     // เลขที่ (ที่อยู่ที่ติดต่อได้)
	ContactMoo           *string `json:"contact_moo,omitempty"`            // หมู่ (ที่อยู่ที่ติดต่อได้)
	ContactSoi           *string `json:"contact_soi,omitempty"`            // ตรอก/ซอย (ที่อยู่ที่ติดต่อได้)
	ContactSubdistrict   *string `json:"contact_subdistrict,omitempty"`    // แขวง/ตำบล (ที่อยู่ที่ติดต่อได้)
	ContactDistrict      *string `json:"contact_district,omitempty"`       // เขต/อำเภอ (ที่อยู่ที่ติดต่อได้)
	ContactProvince      *string `json:"contact_province,omitempty"`       // จังหวัด (ที่อยู่ที่ติดต่อได้)
	ContactZipcode       *string `json:"contact_zipcode,omitempty"`        // รหัสไปรษณีย์ (ที่อยู่ที่ติดต่อได้)
	Personfile           *string `json:"personfile,omitempty"`             // สำเนาบัตรประจำตัวประชาชน
	Corporatefile        *string `json:"corporatefile,omitempty"`          // หนังสือรับรองหรือสำเนาใบสำคัญ
	RememberToken        *string `json:"remember_token,omitempty"`         // Remember token
	PersonType           *string `json:"person_type,omitempty"`            // ประเภทบุคคล
	BranchType           *string `json:"branch_type,omitempty"`            // ประเภทสาขา 1.สำนักงานใหญ่, 2.สาขา
	BranchCode           *string `json:"branch_code,omitempty"`            // รหัสสาขา
	Building             *string `json:"building,omitempty"`               // อาคาร
	ContactBuilding      *string `json:"contact_building,omitempty"`       // อาคาร (ที่อยู่ที่ติดต่อได้)
	ContactTaxId         *string `json:"contact_tax_id,omitempty"`         // เลขประจำตัวผู้เสียภาษี (ผู้ติดต่อ)
	ContactPrefixName    *string `json:"contact_prefix_name,omitempty"`    // คำนำหน้าชื่อ (ผู้ติดต่อ)
	ContactPrefixText    *string `json:"contact_prefix_text,omitempty"`    // คำนำหน้าชื่อ (ผู้ติดต่อ) text
	ContactFirstName     *string `json:"contact_first_name,omitempty"`     // ชื่อ (ผู้ติดต่อ)
	ContactLastName      *string `json:"contact_last_name,omitempty"`      // นามสกุล (ผู้ติดต่อ)
	ContactPosition      *string `json:"contact_position,omitempty"`       // ตำแหน่ง (ผู้ติดต่อ)
	ContactTel           *string `json:"contact_tel,omitempty"`            // โทรศัพท์ (ผู้ติดต่อ)
	ContactFax           *string `json:"contact_fax,omitempty"`            // แฟกซ์ (ผู้ติดต่อ)
	ContactPhoneNumber   *string `json:"contact_phone_number,omitempty"`   // เบอร์โทรศัพท์ (ผู้ติดต่อ)
	PrefixText           *string `json:"prefix_text,omitempty"`            // คำนำหน้าชื่อ text
	PersonFirstName      *string `json:"person_first_name,omitempty"`      // ชื่อ (บุคคล)
	PersonLastName       *string `json:"person_last_name,omitempty"`       // นามสกุล (บุคคล)
	Google2faStatus      *int    `json:"google2fa_status,omitempty"`       // Login 2 ขั้นตอน Google Authenticator 0=ปิดใช้, 1=เปิดใช้
	Google2faSecret      *string `json:"google2fa_secret,omitempty"`       // Login 2 ขั้นตอน Google Authenticator รหัสลับ
	AddressEn            *string `json:"address_en,omitempty"`             // En เลขที่ อาคาร ชั้น ห้อง ชื่อหมู่บ้าน
	MooEn                *string `json:"moo_en,omitempty"`                 // En หมู่
	SoiEn                *string `json:"soi_en,omitempty"`                 // En ตรอก/ซอย
	StreetEn             *string `json:"street_en,omitempty"`              // En ถนน
	SubdistrictEn        *string `json:"subdistrict_en,omitempty"`         // En แขวง/ตำบล
	DistrictEn           *string `json:"district_en,omitempty"`            // En เขต/อำเภอ
	ProvinceEn           *string `json:"province_en,omitempty"`            // En จังหวัด
	ZipcodeEn            *string `json:"zipcode_en,omitempty"`             // En รหัสไปรษณีย์
	ContactAddressEn     *string `json:"contact_address_en,omitempty"`     // En เลขที่ (ที่อยู่ที่ติดต่อได้)
	ContactMooEn         *string `json:"contact_moo_en,omitempty"`         // En หมู่ (ที่อยู่ที่ติดต่อได้)
	ContactSoiEn         *string `json:"contact_soi_en,omitempty"`         // En ตรอก/ซอย (ที่อยู่ที่ติดต่อได้)
	ContactStreetEn      *string `json:"contact_street_en,omitempty"`      // En ถนน (ที่อยู่ที่ติดต่อได้)
	ContactSubdistrictEn *string `json:"contact_subdistrict_en,omitempty"` // En แขวง/ตำบล (ที่อยู่ที่ติดต่อได้)
	ContactDistrictEn    *string `json:"contact_district_en,omitempty"`    // En เขต/อำเภอ (ที่อยู่ที่ติดต่อได้)
	ContactProvinceEn    *string `json:"contact_province_en,omitempty"`    // En จังหวัด (ที่อยู่ที่ติดต่อได้)
	ContactZipcodeEn     *string `json:"contact_zipcode_en,omitempty"`     // En รหัสไปรษณีย์ (ที่อยู่ที่ติดต่อได้)
	Email                *string `json:"email,omitempty"`
	RegSubdepart         *string `json:"reg_subdepart,omitempty"`
}
