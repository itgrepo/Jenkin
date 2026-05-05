package models

type MeetingBudget struct {
	ID                *int    `json:"id,omitempty"`
	FiscalYear        string  `json:"fiscalYear"`
	DepartmentID      int     `json:"departmentId"`
	DepartmentName    *string `json:"departmentName,omitempty"`
	SubDepartmentID   int     `json:"subDepartmentId"`
	SubDepartmentName *string `json:"subDepartmentName,omitempty"`
	Amount            float64 `json:"amount"`
	CreatedAt         *string `json:"createdAt,omitempty"`
	UpdatedAt         *string `json:"updatedAt,omitempty"`
}

type MeetingBudgetSearchParams struct {
	FiscalYear      *string `form:"fiscalYear"`
	DepartmentID    *string `form:"departmentId"`
	SubDepartmentID *string `form:"subDepartmentId"`
	Page            *int    `form:"page"`
	Limit           *int    `form:"limit"`
}

type MeetingBudgetListResponse struct {
	Data  []MeetingBudget `json:"data"`
	Total int             `json:"total"`
	Page  int             `json:"page"`
	Limit int             `json:"limit"`
}

type MeetingStatus string

const (
	MeetingStatusDraft                 MeetingStatus = "draft"
	MeetingStatusSentForApprovalLevel1 MeetingStatus = "sent_for_approval_level_1"
	MeetingStatusSentForApprovalLevel2 MeetingStatus = "sent_for_approval_level_2"
	MeetingStatusApproved              MeetingStatus = "approved"
	MeetingStatusDisapproved           MeetingStatus = "disapproved"
	MeetingStatusPendingReview         MeetingStatus = "pending_review"
	MeetingStatusMeetingInvited        MeetingStatus = "meeting_invited"
	MeetingStatusMeetingClosed         MeetingStatus = "meeting_closed"
)

type Meeting struct {
	ID                  *int                `json:"id,omitempty"`
	CommitteeID         *int                `json:"committeeId,omitempty"`
	CommitteeNumber     string              `json:"committeeNumber"`
	CommitteeName       string              `json:"committeeName"`
	SubCommitteeOf      *string             `json:"subCommitteeOf,omitempty"`
	MeetingSubject      *string             `json:"meetingSubject,omitempty"`
	InstanceNumber      string              `json:"instanceNumber"`
	StartDate           string              `json:"startDate"`
	EndDate             *string             `json:"endDate,omitempty"`
	StartTime           *string             `json:"startTime,omitempty"`
	EndTime             *string             `json:"endTime,omitempty"`
	HostOrganization    *string             `json:"hostOrganization,omitempty"`
	ResponsiblePerson   *string             `json:"responsiblePerson,omitempty"`
	ResponsiblePersonID *int                `json:"responsiblePersonId,omitempty"`
	ApproverLevel1ID    *int                `json:"approverLevel1Id,omitempty"`
	ApproverLevel1Name  *string             `json:"approverLevel1Name,omitempty"`
	ApproverLevel2ID    *int                `json:"approverLevel2Id,omitempty"`
	ApproverLevel2Name  *string             `json:"approverLevel2Name,omitempty"`
	Remarks             *string             `json:"remarks,omitempty"`
	Status              MeetingStatus       `json:"status"`
	HasExpense          bool                `json:"hasExpense"`
	HasParticipants     bool                `json:"hasParticipants"`
	DisbursementStatus  *DisbursementStatus `json:"disbursementStatus,omitempty"`
	CreatedAt           *string             `json:"createdAt,omitempty"`
	UpdatedAt           *string             `json:"updatedAt,omitempty"`
}

// MeetingWithRegistration extends Meeting with registration information
type MeetingWithRegistration struct {
	Meeting
	RegistrationStatus    *string `json:"registrationStatus,omitempty"`    // "registered" | "not_registered"
	RegistrationID        *int    `json:"registrationId,omitempty"`        // ID ของ registration
	RegisteredCount       *int    `json:"registeredCount,omitempty"`       // จำนวนผู้ลงทะเบียนแล้ว
	TotalMeetingAttendees *int    `json:"totalMeetingAttendees,omitempty"` // จำนวนผู้เข้าร่วมประชุม
}

// MeetingRegisterRequest for meeting registration
type MeetingRegisterRequest struct {
	FollowerNames []string `json:"followerNames,omitempty"` // ชื่อผู้ติดตาม (optional)
}

// RegistrationFollower represents a follower in registration
type RegistrationFollower struct {
	ID           *int   `json:"id,omitempty"`
	Name         string `json:"name"`
	DisplayOrder *int   `json:"displayOrder,omitempty"`
}

// RegisterResponse for meeting registration response
type RegisterResponse struct {
	ID           *int                   `json:"id,omitempty"`
	MeetingID    int                    `json:"meetingId"`
	UserID       int                    `json:"userId"`
	Status       string                 `json:"status"`
	RegisteredAt *string                `json:"registeredAt,omitempty"`
	CreatedAt    *string                `json:"createdAt,omitempty"`
	UpdatedAt    *string                `json:"updatedAt,omitempty"`
	Followers    []RegistrationFollower `json:"followers,omitempty"`
}

// MeetingWithRegistrationListResponse for list of meetings with registration info
type MeetingWithRegistrationListResponse struct {
	Data  []MeetingWithRegistration `json:"data"`
	Total int                       `json:"total,omitempty"`
	Page  int                       `json:"page,omitempty"`
	Limit int                       `json:"limit,omitempty"`
}

type MeetingSearchParams struct {
	StartDate       *string        `form:"startDate"`
	EndDate         *string        `form:"endDate"`
	Search          *string        `form:"search"`
	Status          *MeetingStatus `form:"status"`
	SubDepartmentID *int           `form:"subDepartmentId"`
	Page            *int           `form:"page"`
	Limit           *int           `form:"limit"`
}

type MeetingListResponse struct {
	Data  []Meeting `json:"data"`
	Total int       `json:"total"`
	Page  int       `json:"page"`
	Limit int       `json:"limit"`
}

type SendApprovalRequest struct {
	Level int `json:"level" binding:"required"` // 1 or 2
}

type ApproveMeetingRequest struct {
	Level   int     `json:"level" binding:"required"` // 1 or 2
	Remarks *string `json:"remarks,omitempty"`
}

type DisapproveMeetingRequest struct {
	Level   int    `json:"level" binding:"required"` // 1 or 2
	Remarks string `json:"remarks" binding:"required"`
}

type ReviewMeetingRequest struct {
	Level   int    `json:"level" binding:"required"` // 1 or 2
	Remarks string `json:"remarks" binding:"required"`
}

type MeetingExpenseItem struct {
	ID               *int    `json:"id,omitempty"`
	ExpenseTypeID    int     `json:"expenseTypeId"`
	ExpenseTypeName  *string `json:"expenseTypeName,omitempty"`
	ExpenseTypeOther *string `json:"expenseTypeOther,omitempty"`
	Quantity         float64 `json:"quantity"`
	UnitPrice        float64 `json:"unitPrice"`
	TotalPrice       float64 `json:"totalPrice"`
	Remarks          *string `json:"remarks,omitempty"`
}

type MeetingExpense struct {
	ID              *int                 `json:"id,omitempty"`
	MeetingID       int                  `json:"meetingId"`
	CommitteeNumber *string              `json:"committeeNumber,omitempty"`
	CommitteeName   *string              `json:"committeeName,omitempty"`
	InstanceNumber  *string              `json:"instanceNumber,omitempty"`
	Expenses        []MeetingExpenseItem `json:"expenses"`
	TotalBudget     float64              `json:"totalBudget"`
	CreatedAt       *string              `json:"createdAt,omitempty"`
	UpdatedAt       *string              `json:"updatedAt,omitempty"`
}

type MeetingExpenseBudgetInfo struct {
	AnnualBudget           float64 `json:"annualBudget"`
	ExpensesDisbursed      float64 `json:"expensesDisbursed"`
	ExpensesAdvancePayment float64 `json:"expensesAdvancePayment"`
	RemainingBudget        float64 `json:"remainingBudget"`
}

type MeetingFormat string

const (
	MeetingFormatOnsite MeetingFormat = "onsite"
	MeetingFormatOnline MeetingFormat = "online"
	MeetingFormatHybrid MeetingFormat = "hybrid"
)

type EmailSentStatus string

const (
	EmailSentStatusNotSent EmailSentStatus = "not_sent"
	EmailSentStatusSent    EmailSentStatus = "sent"
	EmailSentStatusFailed  EmailSentStatus = "failed"
)

type MeetingInvitation struct {
	ID                       *int            `json:"id,omitempty"`
	MeetingID                int             `json:"meetingId"`
	MeetingFormat            MeetingFormat   `json:"meetingFormat"`
	MeetingLocation          *string         `json:"meetingLocation,omitempty"`
	MeetingRoom              *string         `json:"meetingRoom,omitempty"`
	MeetingIDOnline          *string         `json:"meetingIdOnline,omitempty"`
	Passcode                 *string         `json:"passcode,omitempty"`
	MeetingLink              *string         `json:"meetingLink,omitempty"`
	AgendaFileName           *string         `json:"agendaFileName,omitempty"`
	AgendaFilePath           *string         `json:"agendaFilePath,omitempty"`
	InvitationLetterFileName *string         `json:"invitationLetterFileName,omitempty"`
	InvitationLetterFilePath *string         `json:"invitationLetterFilePath,omitempty"`
	EmailSentStatus          EmailSentStatus `json:"emailSentStatus,omitempty"`
	SupportingDocumentNames  []string        `json:"supportingDocumentNames,omitempty"`
	SupportingDocumentPaths  []string        `json:"supportingDocumentPaths,omitempty"`
	CreatedAt                *string         `json:"createdAt,omitempty"`
	UpdatedAt                *string         `json:"updatedAt,omitempty"`
}

type GenerateInvitationLetterResponse struct {
	FileName string `json:"fileName"`
	FilePath string `json:"filePath"`
}

type SendInvitationEmailResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type TopicType string

const (
	TopicTypeProject TopicType = "project"
	TopicTypeOther   TopicType = "other"
)

type MeetingTopic struct {
	ID               *int      `json:"id,omitempty"`
	MeetingID        int       `json:"meetingId"`
	TopicType        TopicType `json:"topicType"`
	ProjectID        *int      `json:"projectId,omitempty"`
	ProjectName      *string   `json:"projectName,omitempty"`
	ProjectStartYear *string   `json:"projectStartYear,omitempty"`
	ProjectOwner     *string   `json:"projectOwner,omitempty"`
	ProjectStageCode *string   `json:"projectStageCode,omitempty"`
	TopicText        string    `json:"topicText"`
	DisplayOrder     int       `json:"displayOrder"`
	CreatedAt        *string   `json:"createdAt,omitempty"`
	UpdatedAt        *string   `json:"updatedAt,omitempty"`
}

type MeetingTopicListResponse struct {
	Data  []MeetingTopic `json:"data"`
	Total int            `json:"total"`
}

type BatchUpsertMeetingTopicsRequest struct {
	Topics []MeetingTopic `json:"topics" binding:"required"`
}

type BatchUpsertMeetingTopicsResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    BatchUpsertData `json:"data"`
}

type BatchUpsertData struct {
	Created int            `json:"created"`
	Updated int            `json:"updated"`
	Topics  []MeetingTopic `json:"topics"`
}

type CloseMeetingRequest struct {
	Remarks *string `json:"remarks,omitempty"`
}

type CloseMeetingResponse struct {
	Success bool     `json:"success"`
	Message string   `json:"message"`
	Data    *Meeting `json:"data,omitempty"`
}

type MeetingParticipant struct {
	ID                 *int    `json:"id,omitempty"`
	MeetingID          int     `json:"meetingId"`
	UserID             *int    `json:"userId,omitempty"`
	Name               string  `json:"name"`
	Email              *string `json:"email,omitempty"`
	Attended           bool    `json:"attended"`
	SentRepresentative bool    `json:"sentRepresentative"`
	MeetingAllowance   *string `json:"meetingAllowance,omitempty"`
	CreatedAt          *string `json:"createdAt,omitempty"`
	UpdatedAt          *string `json:"updatedAt,omitempty"`
}

type MeetingParticipantListResponse struct {
	Data  []MeetingParticipant `json:"data"`
	Total int                  `json:"total"`
}

type DisbursementStatus string

const (
	DisbursementStatusPendingApproval       DisbursementStatus = "pending_approval"
	DisbursementStatusPendingApprovalLevel1 DisbursementStatus = "pending_approval_level_1"
	DisbursementStatusPendingApprovalLevel2 DisbursementStatus = "pending_approval_level_2"
	DisbursementStatusApproved              DisbursementStatus = "disbursement_approved"
	DisbursementStatusDisapproved           DisbursementStatus = "disbursement_disapproved"
	DisbursementStatusReview                DisbursementStatus = "disbursement_review"
)

type DisbursementExpense struct {
	ID              *int    `json:"id,omitempty"`
	ExpenseTypeID   int     `json:"expenseTypeId"`
	ExpenseTypeName string  `json:"expenseTypeName"`
	BudgetAmount    float64 `json:"budgetAmount"`
	ActualExpense   float64 `json:"actualExpense"`
}

type DisbursementSummary struct {
	ID               *int                  `json:"id,omitempty"`
	MeetingID        int                   `json:"meetingId"`
	Status           DisbursementStatus    `json:"status,omitempty"`
	Expenses         []DisbursementExpense `json:"expenses"`
	ExpenseFileNames []string              `json:"expenseFileNames,omitempty"`
	ExpenseFilePaths []string              `json:"expenseFilePaths,omitempty"`
	CreatedAt        *string               `json:"createdAt,omitempty"`
	UpdatedAt        *string               `json:"updatedAt,omitempty"`
}

type SubmitDisbursementRequest struct {
	Level int `json:"level" binding:"required"` // 1 or 2
}

type SubmitDisbursementResponse struct {
	Success bool                 `json:"success"`
	Message string               `json:"message"`
	Data    *DisbursementSummary `json:"data,omitempty"`
}

type GenerateExpenseDocumentResponse struct {
	FileName string `json:"fileName"`
	FilePath string `json:"filePath"`
}

type ApproveDisbursementRequest struct {
	Level   int     `json:"level" binding:"required"` // 1 or 2
	Remarks *string `json:"remarks,omitempty"`
}

type DisapproveDisbursementRequest struct {
	Level   int    `json:"level" binding:"required"` // 1 or 2
	Remarks string `json:"remarks" binding:"required"`
}

type ReviewDisbursementRequest struct {
	Level   int    `json:"level" binding:"required"` // 1 or 2
	Remarks string `json:"remarks" binding:"required"`
}

type DisbursementSummaryWithMeeting struct {
	DisbursementSummary
	Meeting Meeting `json:"meeting"`
}

type DisbursementSummaryListResponse struct {
	Data  []DisbursementSummaryWithMeeting `json:"data"`
	Total int                              `json:"total,omitempty"`
	Page  int                              `json:"page,omitempty"`
	Limit int                              `json:"limit,omitempty"`
}
