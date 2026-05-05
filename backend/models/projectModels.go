package models

// Project represents a project in i_projects table
type Project struct {
	ID                      *int     `json:"id,omitempty"`
	NameThai                string   `json:"nameThai" binding:"required"`
	NameEnglish             *string  `json:"nameEnglish,omitempty"`
	StartYear               string   `json:"startYear" binding:"required"`
	OwnerID                 *int     `json:"ownerId,omitempty"`
	OwnerName               *string  `json:"ownerName,omitempty"`
	OwnerGroupID            *int     `json:"ownerGroupId,omitempty"`
	OwnerGroupName          *string  `json:"ownerGroupName,omitempty"`
	WriterTypeID            *int     `json:"writerTypeId,omitempty"`
	WriterTypeName          *string  `json:"writerTypeName,omitempty"`
	ExpectedCompletionMonth *string  `json:"expectedCompletionMonth,omitempty"`
	ExpectedCompletionYear  *string  `json:"expectedCompletionYear,omitempty"`
	EnforcementStatusID     *int     `json:"enforcementStatusId,omitempty"`
	EnforcementStatusName   *string  `json:"enforcementStatusName,omitempty"`
	ProposalTypeID          *int     `json:"proposalTypeId,omitempty"`
	ProposalTypeName        *string  `json:"proposalTypeName,omitempty"`
	MethodTypeID            *int     `json:"methodTypeId,omitempty"`
	MethodTypeName          *string  `json:"methodTypeName,omitempty"`
	StdTypeID               *int     `json:"stdTypeId,omitempty"`
	StdTypeName             *string  `json:"stdTypeName,omitempty"`
	ProductPolicyGroupIDs   []int    `json:"productPolicyGroupIds,omitempty"`
	ProductPolicyGroupNames []string `json:"productPolicyGroupNames,omitempty"`
	ProductBCGIDs           []int    `json:"productBCGIds,omitempty"`
	ProductBCGNames         []string `json:"productBCGNames,omitempty"`
	BCGReason               *string  `json:"bcgReason,omitempty"`
	ProductGroupID          *int     `json:"productGroupId,omitempty"`
	ProductGroupName        *string  `json:"productGroupName,omitempty"`
	NSSSectorID             *int     `json:"nssSectorId,omitempty"`
	NSSSectorName           *string  `json:"nssSectorName,omitempty"`
	NSSSubjectID            *int     `json:"nssSubjectId,omitempty"`
	NSSSubjectName          *string  `json:"nssSubjectName,omitempty"`
	ISODeliverableID        *int     `json:"isoDeliverableId,omitempty"`
	ISODeliverableName      *string  `json:"isoDeliverableName,omitempty"`
	ISODeliverableOther     *string  `json:"isoDeliverableOther,omitempty"`
	ISOICSIDs               []string `json:"isoIcsIds,omitempty"`
	ISOICSNames             []string `json:"isoIcsNames,omitempty"`
	TISReprintNo            *string  `json:"tisReprintNo,omitempty"`
	CommitteeID             *int     `json:"committeeId,omitempty"`
	CommitteeName           *string  `json:"committeeName,omitempty"`
	SubCommitteeID          *int     `json:"subCommitteeId,omitempty"`
	SubCommitteeName        *string  `json:"subCommitteeName,omitempty"`
	SDOSID                  *int     `json:"sdosId,omitempty"`
	SDOSName                *string  `json:"sdosName,omitempty"`
	Remarks                 *string  `json:"remarks,omitempty"`
	StageCode               *string  `json:"stageCode,omitempty"`
	StageUIMsg              *string  `json:"stageUiMsg,omitempty"`
	CreatedBy               *int     `json:"createdBy,omitempty"`
	CreatedAt               *string  `json:"createdAt,omitempty"`
	UpdatedBy               *int     `json:"updatedBy,omitempty"`
	UpdatedAt               *string  `json:"updatedAt,omitempty"`
	DeletedAt               *string  `json:"deletedAt,omitempty"`
}

type ProjectSearchParams struct {
	Search    *string `json:"search,omitempty"`
	StartYear *string `json:"startYear,omitempty"`
	StageCode *string `json:"stageCode,omitempty"`
	Page      *int    `json:"page,omitempty"`
	Limit     *int    `json:"limit,omitempty"`
}

type ProjectListResponse struct {
	Data  []Project `json:"data"`
	Total *int      `json:"total,omitempty"`
	Page  *int      `json:"page,omitempty"`
	Limit *int      `json:"limit,omitempty"`
}

// ProjectLog represents a project log entry in i_projects_logs table
type ProjectLog struct {
	ID               *int    `json:"id,omitempty"`
	ProjectID        int     `json:"projectId"`
	StageCode        string  `json:"stageCode"`
	StageDescription *string `json:"stageDescription,omitempty"`
	StageDate        *string `json:"stageDate,omitempty"`
	StageStatus      *string `json:"stageStatus,omitempty"`
	Action           *string `json:"action,omitempty"`
	FieldName        *string `json:"fieldName,omitempty"`
	OldValue         *string `json:"oldValue,omitempty"`
	NewValue         *string `json:"newValue,omitempty"`
	ChangedBy        *int    `json:"changedBy,omitempty"`
	ChangedAt        *string `json:"changedAt,omitempty"`
	Remarks          *string `json:"remarks,omitempty"`
}

// UpdateProjectStageRequest represents a request to update project stage
type UpdateProjectStageRequest struct {
	ID                                          int     `json:"id" binding:"required"`
	StageCode                                   string  `json:"stageCode" binding:"required"`
	StageUIMsg                                  *string `json:"stageUiMsg,omitempty"`
	GMMOSummaryRemarks                          *string `json:"gmmo_summary_remarks,omitempty"`
	SaveDraftRemarks                            *string `json:"save_draft_remarks,omitempty"`
	SaveDraftFilePath                           *string `json:"save_draft_file_path,omitempty"`
	DraftCirculationSummaryRemarks              *string `json:"draft_circulation_summary_remarks,omitempty"`
	DraftCirculationSummarySubCommetteeRemarks  *string `json:"draft_circulation_summary_subcommittee_remarks,omitempty"`
	DraftCirculationSummaryCommetteeRemarks     *string `json:"draft_circulation_summary_committee_remarks,omitempty"`
	SubCommitteeSummaryFilePathWord             *string `json:"sub_committee_summary_file_path_word,omitempty"`
	SubCommitteeSummaryFilePathPDF              *string `json:"sub_committee_summary_file_path_pdf,omitempty"`
	SubCommitteeSummary                         *string `json:"sub_committee_summary,omitempty"`
	SubCommitteeSummaryRemarks                  *string `json:"sub_committee_summary_remarks,omitempty"`
	CommitteeSummaryFilePathWord                *string `json:"committee_summary_file_path_word,omitempty"`
	CommitteeSummaryFilePathPDF                 *string `json:"committee_summary_file_path_pdf,omitempty"`
	CommitteeSummary                            *string `json:"committee_summary,omitempty"`
	CommitteeSummaryRemarks                     *string `json:"committee_summary_remarks,omitempty"`
	TisNumber                                   *string `json:"tis_number,omitempty"`
	TisNumberIssueDate                          *string `json:"tis_number_issue_date,omitempty"`
	InitialDraftDate                            *string `json:"initial_draft_date,omitempty"`
	InitialDraftFilePath                        *string `json:"initial_draft_file_path,omitempty"`
	InitialDraftMeetingReportFilePath           *string `json:"initial_draft_meeting_report_file_path,omitempty"`
	InitialDraftQuestionnaireSummaryFilePath    *string `json:"initial_draft_questionnaire_summary_file_path,omitempty"`
	InitialDraftPowerpointFilePath              *string `json:"initial_draft_powerpoint_file_path,omitempty"`
	InitialDraftDocumentFilePath                *string `json:"initial_draft_document_file_path,omitempty"`
	InitialDraftRemarks                         *string `json:"initial_draft_remarks,omitempty"`
	ApproveInitialDraftBy                       *int    `json:"approve_initial_draft_by,omitempty"`
	ApproveInitialDraftAction                   *string `json:"approve_initial_draft_action,omitempty"`
	ApproveInitialDraftRemarks                  *string `json:"approve_initial_draft_remarks,omitempty"`
	ApproveProjectLv1By                         *int    `json:"approve_project_lv1_by,omitempty"`
	ApproveProjectLv1Action                     *string `json:"approve_project_lv1_action,omitempty"`
	ApproveProjectLv1Remarks                    *string `json:"approve_project_lv1_remarks,omitempty"`
	ApproveProjectLv2By                         *int    `json:"approve_project_lv2_by,omitempty"`
	ApproveProjectLv2Action                     *string `json:"approve_project_lv2_action,omitempty"`
	ApproveProjectLv2Remarks                    *string `json:"approve_project_lv2_remarks,omitempty"`
	FinalDraftSummaryRemarks                    *string `json:"final_draft_summary_remarks,omitempty"`
	StandardAnnouncementSendToTisDate           *string `json:"standard_announcement_send_to_tis_date,omitempty"`           // วันที่ส่งเอกสารไป ลมอ.
	StandardAnnouncementTisSignedDate           *string `json:"standard_announcement_tis_signed_date,omitempty"`            // วันที่ ลมอ. ลงนาม
	StandardAnnouncementRwoSignedDate           *string `json:"standard_announcement_rwo_signed_date,omitempty"`            // วันที่ รวอ. ลงนาม
	StandardAnnouncementSendToRoyalGazetteDate  *string `json:"standard_announcement_send_to_royal_gazette_date,omitempty"` // วันที่ส่งไปราชกิจจา
	StandardAnnouncementRoyalGazettePublishDate *string `json:"standard_announcement_royal_gazette_publish_date,omitempty"` // วันที่ลงราชกิจจา
	StandardAnnouncementEffectiveDate           *string `json:"standard_announcement_effective_date,omitempty"`             // วันที่มีผลบังคับใช้
	StandardAnnouncementFinalDraftFilePath      *string `json:"standard_announcement_final_draft_file_path,omitempty"`      // ไฟล์เอกสารร่าง Final
	StandardAnnouncementRemarks                 *string `json:"standard_announcement_remarks,omitempty"`                    // หมายเหตุ
}

// SaveStandardAnnouncementRequest represents a request to save standard announcement
type SaveStandardAnnouncementRequest struct {
	ProjectID               int     `json:"projectId" binding:"required"`
	NameThai                string  `json:"nameThai" binding:"required"`
	NameEnglish             string  `json:"nameEnglish" binding:"required"`
	SendToTISDate           *string `json:"sendToTISDate,omitempty"`
	TISSignedDate           *string `json:"tissignedDate,omitempty"`
	RWOSignedDate           *string `json:"rwosignedDate,omitempty"`
	SendToRoyalGazetteDate  *string `json:"sendToRoyalGazetteDate,omitempty"`
	RoyalGazettePublishDate *string `json:"royalGazettePublishDate,omitempty"`
	EffectiveDate           *string `json:"effectiveDate,omitempty"`
	Remarks                 *string `json:"remarks,omitempty"`
	SystemBy                *string `json:"systemBy,omitempty"`
}

// TISStandardForReview represents a TIS standard for review
type TISStandardForReview struct {
	ID            int     `json:"id"`
	TISNumber     string  `json:"tisNumber"`
	NameThai      string  `json:"nameThai"`
	NameEnglish   *string `json:"nameEnglish,omitempty"`
	EffectiveDate *string `json:"effectiveDate,omitempty"`
}

// TISStandardForReviewListResponse represents a list of TIS standards for review
type TISStandardForReviewListResponse struct {
	Data  []TISStandardForReview `json:"data"`
	Total int                    `json:"total"`
}

// ProjectReview represents a project review in i_projects_review table
type ProjectReview struct {
	ID                             *int    `json:"id,omitempty"`
	TISNumber                      string  `json:"tisNumber"`
	NameThai                       string  `json:"nameThai"`
	NameEnglish                    *string `json:"nameEnglish,omitempty"`
	EnforcementStatusID            *int    `json:"enforcementStatusId,omitempty"`
	EnforcementStatusName          *string `json:"enforcementStatusName,omitempty"`
	OwnerGroupID                   int     `json:"ownerGroupId"`
	OwnerGroupName                 *string `json:"ownerGroupName,omitempty"`
	StageCode                      *string `json:"stageCode,omitempty"`
	StageUIMsg                     *string `json:"stageUiMsg,omitempty"`
	EffectiveDate                  *string `json:"effectiveDate,omitempty"`
	ReviewStartDate                *string `json:"reviewStartDate,omitempty"`
	ReviewEndDate                  *string `json:"reviewEndDate,omitempty"`
	Remarks                        *string `json:"remarks,omitempty"`
	CreatedAt                      *string `json:"createdAt,omitempty"`
	UpdatedAt                      *string `json:"updatedAt,omitempty"`
	CreatedBy                      *int    `json:"createdBy,omitempty"`
	UpdatedBy                      *int    `json:"updatedBy,omitempty"`
	ReviewCirculationSummaryRemark *string `json:"review_circulation_summary_remark,omitempty"` // วันที่สรุปผลการเวียน
	ReviewCancelSummaryRemark      *string `json:"review_cancel_summary_remark,omitempty"`      // วันที่ยกเลิกสรุปผลการเวียน
}

// ProjectReviewSearchParams represents search parameters for project reviews
type ProjectReviewSearchParams struct {
	Search            *string `json:"search,omitempty"`
	StageCode         *string `json:"stageCode,omitempty"`
	EnforcementStatus *string `json:"enforcementStatus,omitempty"`
	OwnerGroupID      *int    `json:"ownerGroupId,omitempty"`
	Page              *int    `json:"page,omitempty"`
	Limit             *int    `json:"limit,omitempty"`
}

// ProjectReviewListResponse represents a list of project reviews
type ProjectReviewListResponse struct {
	Data  []ProjectReview `json:"data"`
	Total *int            `json:"total,omitempty"`
	Page  *int            `json:"page,omitempty"`
	Limit *int            `json:"limit,omitempty"`
}

// ProjectReviewLog represents a project review log entry in i_projects_review_log table
type ProjectReviewLog struct {
	ID               *int    `json:"id,omitempty"`
	ProjectReviewID  int     `json:"projectReviewId"`
	StageCode        string  `json:"stageCode"`
	StageDescription *string `json:"stageDescription,omitempty"`
	StageDate        *string `json:"stageDate,omitempty"`
	StageStatus      *string `json:"stageStatus,omitempty"`
	Remarks          *string `json:"remarks,omitempty"`
	CreatedAt        *string `json:"createdAt,omitempty"`
	UpdatedAt        *string `json:"updatedAt,omitempty"`
	CreatedBy        *int    `json:"createdBy,omitempty"`
}
