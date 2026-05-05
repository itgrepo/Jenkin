package models

// DocumentItem represents a document record in i_documents table

type DocumentItem struct {
	ID       *int   `json:"id,omitempty"`
	NNumber  *int   `json:"nNumber,omitempty"` // N Number index
	Title    string `json:"title"`
	TypeCode string `json:"typeCode"` // GENERAL / MEETING / PROJECT / BALLOT / RESOLUTION / FILE / FOLDER
	TypeName string `json:"typeName"`

	SubTypeCode *string `json:"subTypeCode,omitempty"`
	SubTypeName *string `json:"subTypeName,omitempty"`

	MeetingName *string `json:"meetingName,omitempty"`
	MeetingID   *int    `json:"meetingId,omitempty"`

	ProjectName *string `json:"projectName,omitempty"`
	ProjectID   *int    `json:"projectId,omitempty"`

	BallotName *string `json:"ballotName,omitempty"`
	BallotID   *int    `json:"ballotId,omitempty"`

	ExpectedAction *string `json:"expectedAction,omitempty"`
	ExpectedDate   *string `json:"expectedDate,omitempty"` // keep as string if frontend sends YYYY-MM-DD

	Description *string `json:"description,omitempty"`
	Replaces    *string `json:"replaces,omitempty"`

	Status *string `json:"status,omitempty"` // To be notified / Notified / Draft / Deleted

	FilePath *string `json:"filePath,omitempty"`
	MimeType *string `json:"mimeType,omitempty"`

	CommitteeID *int `json:"committeeId,omitempty"`

	ModifiedAt    *string  `json:"modifiedAt,omitempty"`
	CreatedAt     *string  `json:"createdAt,omitempty"`
	CreatedBy     *int     `json:"createdBy,omitempty"`
	Version       *float64 `json:"version,omitempty"`
	CreatedByName *string  `json:"createdByName,omitempty"`
	UpdatedByName *string  `json:"updatedByName,omitempty"`
}

// DocumentSearchParams represents search parameters for documents list
type DocumentSearchParams struct {
	CommitteeID *string `json:"committeeId,omitempty"`
	Title       *string `json:"title,omitempty"`
	Type        *string `json:"type,omitempty"`
	FolderPath  *string `json:"folderPath,omitempty"`
}

// DocumentListResponse represents a list of documents
type DocumentListResponse struct {
	Data []DocumentItem `json:"data"`
}

// DocumentPathGroupsResponse represents distinct path prefixes (group by folder under documents/)
// e.g. ["documents/meeting", "documents/resolution", "documents/aaaaaa"]
type DocumentPathGroupsResponse struct {
	Data []string `json:"data"`
}

// DocumentLog represents an action log entry in i_documents_log table
type DocumentLog struct {
	ID               *int    `json:"id,omitempty"`
	DocumentID       int     `json:"documentId"`
	Action           string  `json:"action"`
	ActionDetail     *string `json:"actionDetail,omitempty"`
	ActionAt         *string `json:"actionAt,omitempty"`
	ActionBy         *int    `json:"actionBy,omitempty"`
	ActionByName     *string `json:"actionByName,omitempty"`
	ActionByRoleID   *int    `json:"actionByRoleID,omitempty"`
	ActionByRoleName *string `json:"actionByRoleName,omitempty"`
}

// DocumentLogListResponse represents a list of document logs
type DocumentLogListResponse struct {
	Data []DocumentLog `json:"data"`
}

// MaxNNumberResponse represents the response for max n_number query
type MaxNNumberResponse struct {
	MaxNNumber int `json:"maxNNumber"`
}

// NotifyDocumentRequest represents the request for notifying document (optional email)
type NotifyDocumentRequest struct {
	Subject *string `json:"subject,omitempty"` // Optional: if provided, send email
	Body    *string `json:"body,omitempty"`    // Optional: if provided, send email
}

// NotifyDocumentResponse represents the response for notifying document
type NotifyDocumentResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	SentTo  *int   `json:"sentTo,omitempty"` // Number of email recipients (if email was sent)
}
