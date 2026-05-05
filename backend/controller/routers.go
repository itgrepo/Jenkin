package controller

import (
	"estisi/handlers"
	"estisi/middleware"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/logger"
	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "estisi/docs" // import เอกสารที่สร้างโดย swag
	// swagger handler
	// swagger embed files
)

func NewRouter() *gin.Engine {
	// ตั้งระดับ log
	zerolog.SetGlobalLevel(zerolog.InfoLevel)
	if gin.IsDebugging() {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	log.Logger = log.Output(
		zerolog.ConsoleWriter{
			Out:     os.Stderr,
			NoColor: false,
		},
	)

	r := gin.New()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:5174", "http://203.154.78.224:9000", "https://dev.tisi.go.th:9000", "http://dev.tisi.go.th:9000", "http://dev.tisi.go.th", "http://134.185.172.107"}, // ระบุ origin React
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	r.Use(logger.SetLogger())
	r.Use(gin.Recovery())

	// SSO login (sso_users table)
	r.POST("/api/v1/estandard/sso/login", handlers.SSOLoginHandler)
	r.POST("/api/v1/estandard/sso/profile", handlers.SSOProfileHandler)
	// SSO Profile Admin (user_register table)
	r.POST("/api/v1/estandard/sso/profile-admin", handlers.SSOProfileAdminHandler)

	rGroup := r.Group("/api/v1/estandard")
	rGroup.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	rGroup.GET("/hello", handlers.HelloHandler)

	rGroup.Use(middleware.AuthMiddleware())
	{
		rGroup.POST("/auth/logout", handlers.LogoutHandler)

		//global
		rGroup.GET("/province", handlers.GetProvinceHandler)
		rGroup.GET("/district/:provId", handlers.GetDistrictByProvIdHandler)
		rGroup.GET("/subDistrict/:provId/:districtId", handlers.GetSubDistrictByProvIdDistIdHandler)
		rGroup.POST("/uploadFile", handlers.UploadFileHandler)
		rGroup.GET("/files/download", handlers.DownloadFileHandler)
		rGroup.DELETE("/deleteFile", handlers.DeleteFileHandler)

		//Master Data APIs
		rGroup.GET("/titles", handlers.GetTitlesHandler)
		rGroup.GET("/banks", handlers.GetBanksHandler)
		rGroup.GET("/accountTypes", handlers.GetAccountTypesHandler)
		rGroup.GET("/academy", handlers.GetAcademyHandler)
		rGroup.GET("/degrees", handlers.GetDegreesHandler)
		rGroup.GET("/yearSelect", handlers.GetYearSelectHandler)
		rGroup.GET("/committeeTypes", handlers.GetExpertGroupTypesHandler)
		rGroup.GET("/responsible-groups", handlers.GetResponsibleGroupsHandler)
		rGroup.GET("/departments", handlers.GetDepartmentsHandler)
		rGroup.GET("/sub-departments", handlers.GetSubDepartmentsHandler)
		rGroup.GET("/sub-departments/:dpisId", handlers.GetSubDepartmentsByDPisIdHandler)
		rGroup.GET("/product-groups", handlers.GetProductGroupsHandler)
		rGroup.GET("/groupPositions", handlers.GetGroupPositionsHandler)
		rGroup.GET("/directiveTypes", handlers.GetDirectiveTypesHandler)
		rGroup.GET("/organizations", handlers.GetOrganizationsHandler)
		rGroup.GET("/expert-member-types", handlers.GetExpertMemberTypesHandler)
		rGroup.GET("/ballot-group-types", handlers.GetBallotGroupTypesHandler)
		rGroup.GET("/ballot-answer-types", handlers.GetBallotAnswerTypesHandler)
		rGroup.GET("/ballot-request-statuses", handlers.GetBallotRequestStatusesHandler)
		rGroup.GET("/writer-types", handlers.GetWriterTypesHandler)
		rGroup.GET("/std-types", handlers.GetStdTypesHandler)
		rGroup.GET("/product-policy-groups", handlers.GetProductPolicyGroupsHandler)
		rGroup.GET("/product-bcgs", handlers.GetProductBCGsHandler)
		rGroup.GET("/regulations", handlers.GetRegulationsHandler)
		rGroup.GET("/method-types", handlers.GetMethodTypesHandler)
		rGroup.GET("/tis-product-groups", handlers.GetTISProductGroupsHandler)
		rGroup.GET("/nss-sectors", handlers.GetNSSSectorsHandler)
		rGroup.GET("/iso-deliverables", handlers.GetISODeliverablesHandler)
		rGroup.GET("/iso-ics", handlers.GetISOICSHandler)
		rGroup.GET("/tis-numbers", handlers.GetTISNumbersHandler)
		rGroup.GET("/sdos", handlers.GetSDOSHandler)
		rGroup.GET("/nss-subjects", handlers.GetNSSSubjectsHandler)
		rGroup.GET("/nss-subjects/:sectorId", handlers.GetNSSSubjectsHandler)
		rGroup.GET("/stage-codes", handlers.GetStageCodesHandler)
		rGroup.GET("/document-types", handlers.GetDocumentTypesHandler)
		rGroup.GET("/document-sub-types", handlers.GetDocumentSubTypesHandler)
		rGroup.GET("/users", handlers.GetUsersBySubDepartmentHandler)
		rGroup.GET("/users/department/:did", handlers.GetUsersByDepartmentHandler)

		// Ballot Draft APIs
		rGroup.GET("/ballot-draft", handlers.GetBallotDraftsHandler)
		rGroup.GET("/ballot-draft/:id", handlers.GetBallotDraftByIDHandler)
		rGroup.POST("/ballot-draft", handlers.UpsertBallotDraftHandler)
		rGroup.DELETE("/ballot-draft/:id", handlers.DeleteBallotDraftHandler)

		// Ballot Request APIs
		rGroup.GET("/ballot-request", handlers.GetBallotRequestsHandler)
		rGroup.GET("/ballot-request/:id", handlers.GetBallotRequestByIDHandler)
		rGroup.POST("/ballot-request", handlers.UpsertBallotRequestHandler)
		rGroup.DELETE("/ballot-request/:id", handlers.DeleteBallotRequestHandler)
		rGroup.POST("/ballot-request/:id/send-approval", handlers.SendBallotRequestForApprovalHandler)
		rGroup.POST("/ballot-request/:id/approve", handlers.ApproveBallotRequestHandler)
		rGroup.POST("/ballot-request/:id/disapprove", handlers.DisapproveBallotRequestHandler)
		rGroup.POST("/ballot-request/:id/review", handlers.ReviewBallotRequestHandler)
		rGroup.POST("/ballot-request/:id/close", handlers.CloseBallotRequestHandler)
		rGroup.POST("/ballot-request/:id/send-email", handlers.SendBallotRequestEmailHandler)
		rGroup.GET("/ballot-request/available", handlers.GetAvailableBallotRequestsHandler)

		// Ballot Response APIs
		rGroup.GET("/ballot-response", handlers.GetBallotResponsesHandler)
		rGroup.GET("/ballot-response/request/:requestId/user/:userId", handlers.GetBallotResponseByRequestAndUserHandler)
		rGroup.GET("/ballot-response/:id", handlers.GetBallotResponseByIDHandler)
		rGroup.POST("/ballot-response", handlers.UpsertBallotResponseHandler)

		// Expert APIs
		rGroup.GET("/expert", handlers.GetExpertsHandler)
		rGroup.POST("/expert", handlers.UpsertExpertHandler)
		rGroup.DELETE("/expert/:id", handlers.DeleteExpertHandler)
		rGroup.GET("/expert/:id", handlers.GetExpertByIDHandler)
		rGroup.GET("/expert/user/:userId", handlers.GetExpertByUserIDHandler)

		// Committee APIs
		rGroup.POST("/expert/committees", handlers.UpsertCommitteeHandler)
		rGroup.GET("/expert/committees", handlers.GetCommitteesHandler)
		rGroup.GET("/expert/committees/my", handlers.GetMyExpertCommitteesHandler)
		rGroup.GET("/expert/committees/:id", handlers.GetCommitteeByIDHandler)
		rGroup.GET("/expert/committees/number/:committeeNumber", handlers.GetCommitteeByCommitteeNumberHandler)
		rGroup.GET("/expert/committees/subNumber/:committeeId", handlers.GetCommitteeByCommitteeSubNumberHandler)
		rGroup.DELETE("/expert/committees/:id", handlers.DeleteCommitteeHandler)

		// Committee Member APIs
		rGroup.GET("/expert/committees/members", handlers.GetCommitteeMembersHandler)
		rGroup.POST("/expert/committees/members", handlers.UpsertCommitteeMemberHandler)
		rGroup.GET("/expert/committees/members/:id", handlers.GetCommitteeMemberByIDHandler)
		rGroup.DELETE("/expert/committees/members/:id", handlers.DeleteCommitteeMemberHandler)

		// Directive APIs
		rGroup.GET("/expert/directives", handlers.GetDirectivesHandler)
		rGroup.POST("/expert/directives", handlers.UpsertDirectiveHandler)
		rGroup.GET("/expert/directives/:id", handlers.GetDirectiveByIDHandler)
		rGroup.DELETE("/expert/directives/:id", handlers.DeleteDirectiveHandler)

		// Meeting Budget APIs
		rGroup.GET("/meeting-budget", handlers.GetMeetingBudgetsHandler)
		rGroup.POST("/meeting-budget", handlers.UpsertMeetingBudgetHandler)
		rGroup.DELETE("/meeting-budget/:id", handlers.DeleteMeetingBudgetHandler)

		// Meeting APIs
		rGroup.GET("/meeting/unapproved", handlers.GetUnapprovedMeetingsHandler)
		rGroup.GET("/meeting/approved", handlers.GetApprovedMeetingsHandler)
		rGroup.GET("/meeting/upcoming-invited", handlers.GetUpcomingInvitedMeetingsHandler)
		rGroup.GET("/meeting/disbursement-summary/pending-approval", handlers.GetPendingDisbursementMeetingsHandler)
		rGroup.POST("/meeting", handlers.UpsertMeetingHandler)

		// Meeting Expense APIs (must be before /meeting/:id to avoid route conflict)
		rGroup.GET("/meeting/:id/expense", handlers.GetMeetingExpenseHandler)
		rGroup.POST("/meeting/expense", handlers.UpsertMeetingExpenseHandler)
		rGroup.GET("/meeting/:id/expense/budget-info", handlers.GetMeetingExpenseBudgetInfoHandler)

		// Meeting Invitation APIs (must be before /meeting/:id to avoid route conflict)
		rGroup.GET("/meeting/:id/invitation", handlers.GetMeetingInvitationHandler)
		rGroup.POST("/meeting/:id/invitation", handlers.UpsertMeetingInvitationHandler)
		rGroup.POST("/meeting/:id/invitation/generate-letter", handlers.GenerateInvitationLetterHandler)
		rGroup.POST("/meeting/:id/invitation/send-email", handlers.SendInvitationEmailHandler)

		// Meeting Topic APIs (must be before /meeting/:id to avoid route conflict)
		rGroup.GET("/meeting/:id/topics", handlers.GetMeetingTopicsHandler)
		rGroup.POST("/meeting/:id/topics", handlers.UpsertMeetingTopicHandler)
		rGroup.POST("/meeting/:id/topics/batch", handlers.BatchUpsertMeetingTopicsHandler)
		rGroup.DELETE("/meeting/topic/:id", handlers.DeleteMeetingTopicHandler)
		rGroup.POST("/meeting/:id/close", handlers.CloseMeetingHandler)

		// Meeting Disbursement APIs (must be before /meeting/:id to avoid route conflict)
		rGroup.GET("/meeting/:id/participants", handlers.GetMeetingParticipantsHandler)
		rGroup.POST("/meeting/:id/participants", handlers.UpsertMeetingParticipantHandler)
		rGroup.GET("/meeting/:id/disbursement-summary", handlers.GetDisbursementSummaryHandler)
		rGroup.POST("/meeting/:id/disbursement-summary", handlers.UpsertDisbursementSummaryHandler)
		rGroup.POST("/meeting/:id/disbursement-summary/submit", handlers.SubmitDisbursementForApprovalHandler)
		rGroup.POST("/meeting/:id/disbursement-summary/approve", handlers.ApproveDisbursementHandler)
		rGroup.POST("/meeting/:id/disbursement-summary/disapprove", handlers.DisapproveDisbursementHandler)
		rGroup.POST("/meeting/:id/disbursement-summary/review", handlers.ReviewDisbursementHandler)
		rGroup.POST("/meeting/:id/disbursement-summary/generate-document", handlers.GenerateExpenseDocumentHandler)

		// Meeting Attendee APIs (must be before /meeting/:id to avoid route conflict)
		rGroup.GET("/meeting/:id/attendee-details", handlers.GetMeetingDetailsForAttendeeHandler)
		rGroup.POST("/meeting/:id/register", handlers.RegisterForMeetingHandler)

		// Projects API (i_projects table)
		rGroup.GET("/projects/check-tis-number", handlers.CheckTISNumberHandler)
		rGroup.GET("/projects/tis-standards-for-review", handlers.GetTISStandardsForReviewHandler)
		rGroup.POST("/projects/create-review-from-tis", handlers.CreateReviewFromTISHandler)
		rGroup.GET("/project-review", handlers.GetProjectsReviewHandler)
		rGroup.GET("/project-review/:id/logs", handlers.GetProjectReviewLogsHandler)
		rGroup.POST("/project-review/:id/logs", handlers.UpsertProjectReviewLogHandler)
		rGroup.PUT("/project-review/:id", handlers.UpdateProjectReviewHandler)
		rGroup.GET("/projects", handlers.GetProjectsListHandler)
		rGroup.GET("/projects/:id/logs", handlers.GetProjectLogsHandler)
		rGroup.POST("/projects/:id/logs", handlers.UpsertProjectLogHandler)
		rGroup.POST("/projects/:id/save-standard-announcement", handlers.SaveStandardAnnouncementHandler)
		rGroup.GET("/projects/:id", handlers.GetProjectByIDHandler)
		rGroup.POST("/projects", handlers.UpsertProjectHandler)
		rGroup.PUT("/projects/stage", handlers.UpdateProjectStageHandler)
		rGroup.DELETE("/projects/:id", handlers.DeleteProjectHandler)

		// Document APIs (i_documents table)
		rGroup.GET("/documents", handlers.GetDocumentsHandler)
		rGroup.GET("/documents/path-groups", handlers.GetDocumentPathGroupsHandler)
		rGroup.GET("/documents/max-n-number", handlers.GetMaxNNumberHandler)
		rGroup.POST("/documents", handlers.UpsertDocumentHandler)
		rGroup.GET("/documents/:id/logs", handlers.GetDocumentLogsHandler)
		rGroup.DELETE("/documents/:id", handlers.DeleteDocumentHandler)
		rGroup.POST("/documents/:id/notify", handlers.NotifyDocumentHandler)

		// Meeting general APIs (must be after specific routes)
		rGroup.GET("/meeting/:id", handlers.GetMeetingByIDHandler)
		rGroup.DELETE("/meeting/:id", handlers.DeleteMeetingHandler)
		rGroup.POST("/meeting/:id/send-approval", handlers.SendMeetingForApprovalHandler)
		rGroup.POST("/meeting/:id/approve", handlers.ApproveMeetingHandler)
		rGroup.POST("/meeting/:id/disapprove", handlers.DisapproveMeetingHandler)
		rGroup.POST("/meeting/:id/review", handlers.ReviewMeetingHandler)
	}

	// Return router instead of running server
	// Server will be started in main.go for graceful shutdown
	return r
}
