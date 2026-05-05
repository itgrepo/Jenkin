package models

type Expert struct {
	ID              *int                 `json:"id,omitempty"`
	IDCard          string               `json:"idCard"`
	Prefix          int                  `json:"prefix"`
	FirstName       string               `json:"firstName"`
	LastName        string               `json:"lastName"`
	Phone           string               `json:"phone"`
	Mobile          string               `json:"mobile"`
	Email           string               `json:"email"`
	Educations      []EducationData      `json:"educations,omitempty"`
	Trainings       []TrainingData       `json:"trainings,omitempty"`
	WorkExperiences []WorkExperienceData `json:"workExperiences,omitempty"`
	CVFile          string               `json:"cvFile"`
	IDCardAddress   AddressData          `json:"idCardAddress"`
	ContactAddress  ContactAddressData   `json:"contactAddress"`
	BankAccount     []BankAccountData    `json:"bankAccount,omitempty"`
	UserID          *int                 `json:"userId"`
	CreatedAt       *string              `json:"createdAt,omitempty"`
	UpdatedAt       *string              `json:"updatedAt,omitempty"`
	UpdateBy        int                  `json:"updateBy"`
}

type AddressData struct {
	HouseNo         string `json:"houseNo"`
	Moo             string `json:"moo"`
	Soi             string `json:"soi"`
	Road            string `json:"road"`
	SubDistrict     int    `json:"subDistrict"`
	SubDistrictName string `json:"subDistrictName"`
	District        int    `json:"district"`
	DistrictName    string `json:"districtName"`
	Province        int    `json:"province"`
	ProvinceName    string `json:"provinceName"`
	PostalCode      string `json:"postalCode"`
}

type ContactAddressData struct {
	HouseNo          string `json:"houseNo"`
	Moo              string `json:"moo"`
	Soi              string `json:"soi"`
	Road             string `json:"road"`
	SubDistrict      int    `json:"subDistrict"`
	SubDistrictName  string `json:"subDistrictName"`
	District         int    `json:"district"`
	DistrictName     string `json:"districtName"`
	Province         int    `json:"province"`
	ProvinceName     string `json:"provinceName"`
	PostalCode       string `json:"postalCode"`
	UseIdCardAddress bool   `json:"useIdCardAddress"`
}

type EducationData struct {
	ID             *int    `json:"id,omitempty"`
	ExpertID       *int    `json:"expertId,omitempty"`
	GraduationYear string  `json:"graduationYear"`
	EducationLevel int     `json:"educationLevel"`
	Institution    int     `json:"institution"`
	Qualification  string  `json:"qualification"`
	CreatedAt      *string `json:"createdAt,omitempty"`
	UpdatedAt      *string `json:"updatedAt,omitempty"`
}

type TrainingData struct {
	ID        *int    `json:"id,omitempty"`
	ExpertID  *int    `json:"expertId,omitempty"`
	Details   string  `json:"details"`
	CreatedAt *string `json:"createdAt,omitempty"`
	UpdatedAt *string `json:"updatedAt,omitempty"`
}

type WorkExperienceData struct {
	ID             *int    `json:"id,omitempty"`
	ExpertID       *int    `json:"expertId,omitempty"`
	StartYear      string  `json:"startYear"`
	EndYear        string  `json:"endYear"`
	Details        string  `json:"details"`
	Responsibility string  `json:"responsibility"`
	CreatedAt      *string `json:"createdAt,omitempty"`
	UpdatedAt      *string `json:"updatedAt,omitempty"`
}

type BankAccountData struct {
	ID                *int    `json:"id,omitempty"`
	ExpertID          *int    `json:"expertId,omitempty"`
	BankAccountNumber string  `json:"bankAccountNumber"`
	Bank              int     `json:"bank"`
	BankBranch        string  `json:"bankBranch"`
	AccountType       int     `json:"accountType"`
	Status            string  `json:"status"`
	AccountPhotoFile  string  `json:"accountPhotoFile"`
	KtbFile           string  `json:"ktbFile"`
	CreatedAt         *string `json:"createdAt,omitempty"`
	UpdatedAt         *string `json:"updatedAt,omitempty"`
}

// ExpertSearchParams for filtering experts
type ExpertSearchParams struct {
	Name   *string `form:"name"`   // Search in first_name or last_name (comma-separated for multi-search)
	Email  *string `form:"email"`  // Search in email (comma-separated for multi-search)
	IDCard *string `form:"idCard"` // Search in id_card (comma-separated for multi-search)
	Status *string `form:"status"` // Filter by status
	Page   *int    `form:"page"`
	Limit  *int    `form:"limit"`
}

// ExpertListResponse for paginated expert list
type ExpertListResponse struct {
	Data  []Expert `json:"data"`
	Total int      `json:"total"`
	Page  int      `json:"page"`
	Limit int      `json:"limit"`
}

// Committee represents an expert committee
type Committee struct {
	ID                 *int    `json:"id,omitempty"`
	CommitteeNumber    string  `json:"committeeNumber"`
	CommitteeType      int     `json:"committeeType"`
	CommitteeTypeName  *string `json:"committeeTypeName,omitempty"`
	SubCommitteeOf     *string `json:"subCommitteeOf,omitempty"`
	SubCommitteeOfName *string `json:"subCommitteeOfName,omitempty"`
	SubCommitteeNumber *string `json:"subCommitteeNumber,omitempty"`
	CommitteeNameTh    string  `json:"committeeNameTh"`
	CommitteeNameEn    *string `json:"committeeNameEn,omitempty"`
	ResponsibleGroup   *string `json:"responsibleGroup,omitempty"`
	ResponsibleGroupID *string `json:"responsibleGroupId,omitempty"`
	ProductGroup       *string `json:"productGroup,omitempty"`
	ProductGroupID     *int    `json:"productGroupId,omitempty"`
	ISO                *string `json:"iso,omitempty"`
	IEC                *string `json:"iec,omitempty"`
	ScopeOfWork        *string `json:"scopeOfWork,omitempty"`
	Status             string  `json:"status"` // active, suspended, inactive
	CreatedBy          *int    `json:"createdBy,omitempty"`
	UpdatedBy          *int    `json:"updatedBy,omitempty"`
	CreatedAt          *string `json:"createdAt,omitempty"`
	UpdatedAt          *string `json:"updatedAt,omitempty"`
}

// CommitteeSearchParams for filtering committees
type CommitteeSearchParams struct {
	CommitteeType *int    `form:"committeeType"`
	CommitteeName *string `form:"committeeName"`
	Status        *string `form:"status"`
	Page          *int    `form:"page"`
	Limit         *int    `form:"limit"`
}

// CommitteeListResponse for paginated committee list
type CommitteeListResponse struct {
	Data  []Committee `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

// Directive represents an expert directive
type Directive struct {
	ID                *int    `json:"id,omitempty"`
	OrderNumber       string  `json:"orderNumber"`
	DirectiveTypeID   int     `json:"directiveTypeId"`
	DirectiveTypeName *string `json:"directiveTypeName,omitempty"`
	SigningDate       string  `json:"signingDate"` // Date format: YYYY-MM-DD
	EndDate           string  `json:"endDate"`     // Date format: YYYY-MM-DD
	CommitteeID       int     `json:"committeeId"`
	SubCommitteeOf    string  `json:"subCommitteeOf"`
	Edition           string  `json:"edition"` // Default: "0"
	Amd               string  `json:"amd"`     // Default: "0"
	MeetingRound      *string `json:"meetingRound,omitempty"`
	MeetingSource     string  `json:"meetingSource"` // enum: 'emeeting', 'manual'
	MeetingRef        *string `json:"meetingRef,omitempty"`
	MeetingDate       *string `json:"meetingDate,omitempty"` // Date format: YYYY-MM-DD
	FilePath          *string `json:"filePath,omitempty"`
	CreatedAt         *string `json:"createdAt,omitempty"`
	CreatedBy         *int    `json:"createdBy,omitempty"`
	UpdatedAt         *string `json:"updatedAt,omitempty"`
	UpdatedBy         *int    `json:"updatedBy,omitempty"`
}

// DirectiveSearchParams for filtering directives
type DirectiveSearchParams struct {
	DirectiveTypeId *int    `form:"directiveTypeId"` // Filter by directive_type_id
	OrderNumber     *string `form:"orderNumber"`     // Search in order_number (comma-separated for multi-search)
	Page            *int    `form:"page"`
	Limit           *int    `form:"limit"`
}

// DirectiveListResponse for paginated directive list
type DirectiveListResponse struct {
	Data  []Directive `json:"data"`
	Total int         `json:"total"`
	Page  int         `json:"page"`
	Limit int         `json:"limit"`
}

// CommitteeMember represents a member of an expert committee
type CommitteeMember struct {
	ID                   *int    `json:"id,omitempty"`
	CommitteeID          int     `json:"committeeId"`
	ExpertID             int     `json:"expertId"`
	ExpertName           *string `json:"expertName,omitempty"`
	IDCard               *string `json:"idCard,omitempty"`
	PositionID           int     `json:"positionId"`
	PositionName         *string `json:"positionName,omitempty"`
	DirectiveID          *int    `json:"directiveId,omitempty"`
	DirectiveNumber      *string `json:"directiveNumber,omitempty"`
	OrganizationID       *int    `json:"organizationId,omitempty"`
	OrganizationName     *string `json:"organizationName,omitempty"`
	MemberTypeID         *int    `json:"memberTypeId,omitempty"`
	MemberTypeName       *string `json:"memberTypeName,omitempty"`
	RepresentativeOrder  *int    `json:"representativeOrder,omitempty"` // 1-5 (เฉพาะผู้แทน)
	IsSecretary          bool    `json:"isSecretary"`
	IsAssistantSecretary bool    `json:"isAssistantSecretary"`
	Status               string  `json:"status"` // active, inactive
	AssignmentFile       *string `json:"assignmentFile,omitempty"`
	Remarks              *string `json:"remarks,omitempty"`
	CreatedAt            *string `json:"createdAt,omitempty"`
	UpdatedAt            *string `json:"updatedAt,omitempty"`
}

// CommitteeMemberSearchParams for filtering committee members
type CommitteeMemberSearchParams struct {
	CommitteeID *int    `form:"committeeId"`
	ExpertID    *int    `form:"expertId"`
	PositionID  *int    `form:"positionId"`
	Status      *string `form:"status"`
	Page        *int    `form:"page"`
	Limit       *int    `form:"limit"`
}

// CommitteeMemberListResponse for paginated committee member list
type CommitteeMemberListResponse struct {
	Data  []CommitteeMember `json:"data"`
	Total int               `json:"total"`
	Page  int               `json:"page"`
	Limit int               `json:"limit"`
}
