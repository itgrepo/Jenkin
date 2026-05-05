package models

type BallotDraftAnswer struct {
	ID           *int   `json:"id,omitempty"`
	Text         string `json:"text"`
	DisplayOrder *int   `json:"displayOrder,omitempty"`
}

type BallotDraftAttachment struct {
	ID           *int   `json:"id,omitempty"`
	FileName     string `json:"fileName"`
	FilePath     string `json:"filePath"`
	DisplayOrder *int   `json:"displayOrder,omitempty"`
}

type BallotDraft struct {
	ID           *int                    `json:"id,omitempty"`
	Name         string                  `json:"name"`
	QuestionText string                  `json:"questionText"`
	AnswerTypeID int                     `json:"answerType"`
	HasTextInput bool                    `json:"hasTextInput"`
	Answers      []BallotDraftAnswer     `json:"answers"`
	Attachments  []BallotDraftAttachment `json:"attachments"`
	NoteText     *string                 `json:"noteText,omitempty"`
	CreatedAt    *string                 `json:"createdAt,omitempty"`
	UpdatedAt    *string                 `json:"updatedAt,omitempty"`
}

type BallotDraftSearchParams struct {
	Search *string `form:"search"`
	Page   *int    `form:"page"`
	Limit  *int    `form:"limit"`
}

type BallotDraftListResponse struct {
	Data  []BallotDraft `json:"data"`
	Total int           `json:"total,omitempty"`
	Page  int           `json:"page,omitempty"`
	Limit int           `json:"limit,omitempty"`
}

// BallotRequest models
type BallotRequestStatus string

const (
	BallotRequestStatusPendingApproval       BallotRequestStatus = "pending_approval"
	BallotRequestStatusWaitingManagerReview  BallotRequestStatus = "waiting_manager_review"
	BallotRequestStatusWaitingDirectorReview BallotRequestStatus = "waiting_director_review"
	BallotRequestStatusManagerApproved       BallotRequestStatus = "manager_approved"
	BallotRequestStatusManagerDisapproved    BallotRequestStatus = "manager_disapproved"
	BallotRequestStatusDirectorApproved      BallotRequestStatus = "director_approved"
	BallotRequestStatusDirectorDisapproved   BallotRequestStatus = "director_disapproved"
	BallotRequestStatusPendingReview         BallotRequestStatus = "pending_review"
)

type BallotRequestRecipient struct {
	ID          *int    `json:"id,omitempty"`
	UserID      *int    `json:"userId,omitempty"`
	CommitteeID *int    `json:"committeeId,omitempty"`
	Name        string  `json:"name"`
	Email       *string `json:"email,omitempty"`
	Type        string  `json:"type"` // "committee" | "staff" | "expert" | "public"
}

type BallotRequest struct {
	ID               *int                     `json:"id,omitempty"`
	UseDraft         bool                     `json:"useDraft"`
	DraftID          *int                     `json:"draftId,omitempty"`
	QuestionText     string                   `json:"questionText"`
	AnswerType       int                      `json:"answerType"`
	HasTextInput     bool                     `json:"hasTextInput"`
	Answers          []BallotDraftAnswer      `json:"answers"`
	Attachments      []BallotDraftAttachment  `json:"attachments"`
	Name             string                   `json:"name"`
	ProjectID        *int                     `json:"projectId,omitempty"`
	ProjectName      *string                  `json:"projectName,omitempty"`
	StartDate        string                   `json:"startDate"`
	EndDate          string                   `json:"endDate"`
	NumberOfDays     *int                     `json:"numberOfDays,omitempty"`
	GroupType        int                      `json:"groupType"`
	GroupTypeID      *int                     `json:"groupTypeId,omitempty"`
	CommitteeIDs     []int                    `json:"committeeIds,omitempty"`
	StaffRecipients  []BallotRequestRecipient `json:"staffRecipients,omitempty"`
	ExpertRecipients []BallotRequestRecipient `json:"expertRecipients,omitempty"`
	Status           BallotRequestStatus      `json:"status"`
	CreatedBy        *int                     `json:"createdBy,omitempty"`
	CreatedByName    *string                  `json:"createdByName,omitempty"`
	ManagerID        *int                     `json:"managerId,omitempty"`
	DirectorID       *int                     `json:"directorId,omitempty"`
	CreatedAt        *string                  `json:"createdAt,omitempty"`
	UpdatedAt        *string                  `json:"updatedAt,omitempty"`
}

type BallotRequestSearchParams struct {
	Status    *string `form:"status"` // Can be single status or comma-separated
	Search    *string `form:"search"`
	CreatedBy *int    `form:"createdBy"`
	Page      *int    `form:"page"`
	Limit     *int    `form:"limit"`
}

type BallotRequestListResponse struct {
	Data  []BallotRequest `json:"data"`
	Total int             `json:"total,omitempty"`
	Page  int             `json:"page,omitempty"`
	Limit int             `json:"limit,omitempty"`
}

type SendBallotRequestForApprovalRequest struct {
	Status BallotRequestStatus `json:"status" binding:"required"`
}

type ApproveBallotRequestRequest struct {
	Level   int     `json:"level" binding:"required"` // 1 = manager, 2 = director
	Remarks *string `json:"remarks,omitempty"`
}

type DisapproveBallotRequestRequest struct {
	Level   int    `json:"level" binding:"required"` // 1 = manager, 2 = director
	Remarks string `json:"remarks" binding:"required"`
}

type ReviewBallotRequestRequest struct {
	Level   int    `json:"level" binding:"required"` // 1 = manager, 2 = director
	Remarks string `json:"remarks" binding:"required"`
}

// Ballot Response models
type BallotResponseAnswer struct {
	ID                  *int    `json:"id,omitempty"`
	BallotDraftAnswerID *int    `json:"ballotDraftAnswerId,omitempty"` // FK to i_ballot_draft_answer (ถ้าเป็น choice answer)
	AnswerText          *string `json:"answerText,omitempty"`          // ข้อความคำตอบ (สำหรับ choice answer)
	TextInput           *string `json:"textInput,omitempty"`           // ข้อความที่ผู้ตอบพิมพ์เพิ่มเติม
	DisplayOrder        *int    `json:"displayOrder,omitempty"`
}

type BallotResponse struct {
	ID              *int                   `json:"id,omitempty"`
	BallotRequestID int                    `json:"ballotRequestId"`       // FK to i_ballot_request
	UserID          int                    `json:"userId"`                // FK to user (ผู้ตอบ)
	UserName        string                 `json:"userName"`              // ชื่อผู้ตอบ
	UserEmail       *string                `json:"userEmail,omitempty"`   // อีเมลผู้ตอบ
	Answers         []BallotResponseAnswer `json:"answers"`               // รายการคำตอบ
	SubmittedAt     *string                `json:"submittedAt,omitempty"` // วันที่ตอบ
	CreatedAt       *string                `json:"createdAt,omitempty"`
	UpdatedAt       *string                `json:"updatedAt,omitempty"`
}

type BallotResponseSearchParams struct {
	BallotRequestID *int `form:"ballotRequestId"` // Filter by ballot request
	UserID          *int `form:"userId"`          // Filter by user
	Page            *int `form:"page"`
	Limit           *int `form:"limit"`
}

type BallotResponseListResponse struct {
	Data  []BallotResponse `json:"data"`
	Total int              `json:"total,omitempty"`
	Page  int              `json:"page,omitempty"`
	Limit int              `json:"limit,omitempty"`
}
