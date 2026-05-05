import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
  Grid,
  IconButton,
} from "@mui/material";
import {
  Edit,
  Search,
  Assignment,
  History,
  Visibility,
} from "@mui/icons-material";
import { getProjectsReview } from "@services/projectService";
import { showError } from "@components/Swal";
import { ProjectReview } from "@models/projects";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode } from "@store/globalSlice";
import { renderStatusChip } from "./ProjectDraftPage";
import EditReviewDialog from "../components/EditReviewDialog";
import SelectReviewBefore5YearsDialog from "../components/SelectReviewBefore5YearsDialog";
import ReviewCirculationSummaryDialog from "../components/ReviewCirculationSummaryDialog";
import CancelStandardResolutionDialog from "../components/CancelStandardResolutionDialog";
import NewReviewInquiryDialog from "../components/NewReviewInquiryDialog";
import BallotRequestDialog from "@pages/ballot/components/BallotRequestDialog";
import ProjectReviewLogsDialog from "../components/ProjectReviewLogsDialog";

// Interface for action buttons
interface ActionButton {
  label: string;
  color: "success" | "info" | "warning" | "error" | "primary" | "secondary";
  onClick: () => void;
}

export default function ProjectReviewPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [reviews, setReviews] = useState<ProjectReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Log Dialog states
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedReviewForLog, setSelectedReviewForLog] =
    useState<ProjectReview | null>(null);

  const [selectReviewBefore5YearsDialogOpen, setSelectReviewBefore5YearsDialogOpen] =
    useState(false);
  const [selectBallotForReviewDialogOpen, setSelectBallotForReviewDialogOpen] =
    useState(false);

  const [reviewCirculationSummaryDialogOpen, setReviewCirculationSummaryDialogOpen] =
    useState(false);
  const [selectedReviewForCirculationSummary, setSelectedReviewForCirculationSummary] =
    useState<ProjectReview | null>(null);

  const [cancelStandardResolutionDialogOpen, setCancelStandardResolutionDialogOpen] =
    useState(false);
  const [selectedReviewForCancelResolution, setSelectedReviewForCancelResolution] =
    useState<ProjectReview | null>(null);

  const [newReviewInquiryDialogOpen, setNewReviewInquiryDialogOpen] =
    useState(false);
  const [selectedReviewForNewInquiry, setSelectedReviewForNewInquiry] =
    useState<ProjectReview | null>(null);

  const [editReviewDialogOpen, setEditReviewDialogOpen] = useState(false);
  const [selectedReviewForEdit, setSelectedReviewForEdit] =
    useState<ProjectReview | null>(null);

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }
  }, [dispatch, stageCodeList]);


  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        search: searchText.trim() || undefined,
      };

      // ถ้าเลือกสถานะ ให้กรองตาม stageCode
      if (selectedStatus) {
        // กรอง reviews ที่ stageCode ขึ้นต้นด้วย selectedStatus
        const res = await getProjectsReview(params);
        const filteredReviews = (res.data || []).filter((review) => {
          const stageCode = review.stageCode || "";
          return stageCode.startsWith(selectedStatus + ".");
        });
        setReviews(filteredReviews);
      } else {
        const res = await getProjectsReview(params);
        // Filter เฉพาะ stage codes 90.xx และ 95.xx
        const filteredReviews = (res.data || []).filter(
          (review) =>
            review.stageCode?.startsWith("90.") || review.stageCode?.startsWith("95.")
        );
        setReviews(filteredReviews);
      }
    } catch (err: any) {
      console.error("Error loading reviews:", err);
      setError(err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลทบทวนมาตรฐานได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadReviews();
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleSelectReviewBefore5Years = () => {
    setSelectReviewBefore5YearsDialogOpen(true);
  };

  const handleSelectBallotForReview = () => {
    setSelectBallotForReviewDialogOpen(true);
  };

  // Handler functions
  const handleEdit = (review: ProjectReview) => {
    setSelectedReviewForEdit(review);
    setEditReviewDialogOpen(true);
  };

  const handleEditReviewDialogClose = () => {
    setEditReviewDialogOpen(false);
    setSelectedReviewForEdit(null);
  };

  const handleEditReviewSuccess = () => {
    loadReviews();
  };

  const handleNewInquiry = (review: ProjectReview) => {
    setSelectedReviewForNewInquiry(review);
    setNewReviewInquiryDialogOpen(true);
  };

  const handleNewInquiryDialogClose = () => {
    setNewReviewInquiryDialogOpen(false);
    setSelectedReviewForNewInquiry(null);
  };

  const handleNewInquirySuccess = () => {
    loadReviews();
  };

  const handleCirculationSummary = (review: ProjectReview) => {
    setSelectedReviewForCirculationSummary(review);
    setReviewCirculationSummaryDialogOpen(true);
  };

  const handleCirculationSummaryDialogClose = () => {
    setReviewCirculationSummaryDialogOpen(false);
    setSelectedReviewForCirculationSummary(null);
  };

  const handleCirculationSummarySuccess = () => {
    loadReviews();
  };

  const handleCancelResolution = (review: ProjectReview) => {
    setSelectedReviewForCancelResolution(review);
    setCancelStandardResolutionDialogOpen(true);
  };

  const handleCancelResolutionDialogClose = () => {
    setCancelStandardResolutionDialogOpen(false);
    setSelectedReviewForCancelResolution(null);
  };

  const handleCancelResolutionSuccess = () => {
    loadReviews();
  };

  const handleViewLog = (review: ProjectReview) => {
    if (!review.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบ ID ของทบทวนมาตรฐาน");
      return;
    }

    setSelectedReviewForLog(review);
    setLogDialogOpen(true);
  };

  const handleLogDialogClose = () => {
    setLogDialogOpen(false);
    setSelectedReviewForLog(null);
  };

  // ฟังก์ชันสำหรับแสดงปุ่มการทำงานตามสถานะ
  const getActionButtons = (review: ProjectReview): ActionButton | undefined => {
    const stageCode = review.stageCode || "";
    const stagePrefix = stageCode.split(".")[0];

    // ตรวจสอบสถานะและแสดงปุ่มตามที่กำหนด
    let buttons: ActionButton = {
      label: "",
      color: "info",
      onClick: () => { },
    };

    // ปุ่มอื่นๆ - ขึ้นอยู่กับสถานะ
    if (stagePrefix === "90") {
      if (stageCode === "90.00" || stageCode === "90.20") {
        buttons = {
          label: "เวียนสอบถามใหม่",
          color: "info",
          onClick: () => handleNewInquiry(review),
        };
      } else if (stageCode === "90.40") {
        buttons = {
          label: "สรุปผลการเวียน",
          color: "info",
          onClick: () => handleCirculationSummary(review),
        };
      }
    } else if (stagePrefix === "95") {
      if (stageCode === "95.00") {
        buttons = {
          label: "ลงมติยกเลิกมาตรฐาน",
          color: "warning",
          onClick: () => handleCancelResolution(review),
        };
      }
    }

    return buttons;
  };

  // Render enforcement status
  const renderEnforcementStatus = (review: ProjectReview) => {
    const status = review.enforcementStatusName;
    if (!status) return "-";

    let color:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning" = "default";
    if (status === "บังคับ" || status === "enforced") color = "error";
    else if (status === "ทั่วไป" || status === "general") color = "info";
    else if (status === "วางแผนบังคับ" || status === "planned_enforcement")
      color = "warning";

    return <Chip label={status} size="small" color={color} />;
  };

  // Filter stage codes สำหรับทบทวนมาตรฐาน
  const reviewStageCodes = stageCodeList?.filter(
    (stage) =>
      stage?.code?.startsWith("90.") || stage?.code?.startsWith("95.")
  ) || [];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Assignment sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการทบทวนมาตรฐาน
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        }}
      >
        <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              สถานะ
            </Typography>
            <Autocomplete
              options={reviewStageCodes}
              getOptionLabel={(option) => `${option.name} [${option.code}]`}
              value={
                reviewStageCodes.find((s) => s.code === selectedStatus) || null
              }
              onChange={(_, newValue) => {
                handleStatusChange(newValue?.code || "");
              }}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="เลือกสถานะ"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      "&:hover": {
                        "& > fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              ชื่อมาตรฐาน
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาชื่อมาตรฐาน"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  "&:hover": {
                    "& > fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                height: "40px",
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              ค้นหา
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={2} alignItems="center">
          <Grid
            size={{ xs: 12, md: 12 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >

            <Button
              variant="contained"
              startIcon={<Assignment />}
              onClick={handleSelectBallotForReview}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.5,
              }}
            >
              เลือก Ballot ที่ใช้เวียน
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<History />}
              onClick={handleSelectReviewBefore5Years}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3,
                py: 1.5,
              }}
            >
              เลือกทบทวนมาตรฐานก่อน 5 ปี
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Reviews Table */}
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 2,
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: isMobile ? "70vh" : "75vh",
          "&::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "10px",
            "&:hover": {
              background: "#555",
            },
          },
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={80}
              >
                ลำดับที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                เลข มอก.
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อมาตรฐาน
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={150}
              >
                สถานะเกี่ยวกับการบังคับ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={150}
              >
                กลุ่มเจ้าหน้าที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={150}
              >
                สถานะ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={200}
              >
                การทำงาน
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลทบทวนมาตรฐาน
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review, index) => {
                const actionButtons = getActionButtons(review);
                return (
                  <TableRow
                    key={review.id || index}
                    hover
                    sx={{
                      "&:nth-of-type(even)": { bgcolor: "action.hover" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {review.tisNumber || "-"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {review.nameThai || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {renderEnforcementStatus(review)}
                    </TableCell>
                    <TableCell align="center">
                      {review.ownerGroupName || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {renderStatusChip(stageCodeList || [], review.stageCode)}
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 350 }}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: isMobile ? 0.5 : 1,
                          justifyContent: "flex-end",
                          flexWrap: isMobile ? "wrap" : "nowrap",
                        }}
                      >
                        {/* ปุ่มแก้ไข */}
                        {!["90.92", "90.93", "95.92", "95.99"].includes(review.stageCode || "") && (
                          <Tooltip title="แก้ไข">
                            <IconButton
                              color="success"
                              size={isMobile ? "small" : "medium"}
                              onClick={() => handleEdit(review)}
                              sx={{
                                "&:hover": {
                                  bgcolor: "success.light",
                                  color: "white",
                                },
                                padding: isMobile ? 0.5 : 1,
                              }}
                            >
                              <Edit fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {/* ปุ่มอื่นๆ */}
                        {actionButtons?.label && (
                          <Tooltip title={actionButtons.label}>
                            <Button
                              variant="outlined"
                              color={actionButtons.color}
                              size={isMobile ? "small" : "medium"}
                              onClick={() => actionButtons.onClick()}
                              sx={{
                                minWidth: "auto",
                                px: isMobile ? 1 : 1.5,
                                py: isMobile ? 0.5 : 1,
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                boxShadow: 1,
                                "&:hover": {
                                  boxShadow: 3,
                                  backgroundColor:
                                    actionButtons.color + ".dark",
                                  color: "white",
                                },
                              }}
                            >
                              {actionButtons.label}
                            </Button>
                          </Tooltip>
                        )}
                        {/* ปุ่ม Log */}
                        <Tooltip title="ดู Log">
                          <IconButton
                            color="warning"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleViewLog(review)}
                            sx={{
                              "&:hover": {
                                bgcolor: "warning.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Visibility fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialogs */}
      {/* Select Review Before 5 Years Dialog */}
      {selectReviewBefore5YearsDialogOpen && (
        <SelectReviewBefore5YearsDialog
          open={selectReviewBefore5YearsDialogOpen}
          onClose={() => setSelectReviewBefore5YearsDialogOpen(false)}
          onSuccess={loadReviews}
        />
      )}

      {/* Select Ballot for Review Dialog */}
      {selectBallotForReviewDialogOpen && (
        // <SelectBallotForReviewDialog
        //   open={selectBallotForReviewDialogOpen}
        //   onClose={() => setSelectBallotForReviewDialogOpen(false)}
        //   onSuccess={() => { }}
        // />
        <BallotRequestDialog
          open={selectBallotForReviewDialogOpen}
          onClose={() => {
            setSelectBallotForReviewDialogOpen(false);
          }}
          onSave={loadReviews}
          request={null}
          mode="create"
          firstPageOnly={true}
        />
      )}

      {/* Edit Review Dialog */}
      {editReviewDialogOpen && (
        <EditReviewDialog
          open={editReviewDialogOpen}
          onClose={handleEditReviewDialogClose}
          review={selectedReviewForEdit as any}
          onSuccess={handleEditReviewSuccess}
        />
      )}

      {/* New Review Inquiry Dialog */}
      {newReviewInquiryDialogOpen && (
        <NewReviewInquiryDialog
          open={newReviewInquiryDialogOpen}
          onClose={handleNewInquiryDialogClose}
          review={selectedReviewForNewInquiry}
          onSuccess={handleNewInquirySuccess}
        />
      )}

      {/* Review Circulation Summary Dialog */}
      {reviewCirculationSummaryDialogOpen && (
        <ReviewCirculationSummaryDialog
          open={reviewCirculationSummaryDialogOpen}
          onClose={handleCirculationSummaryDialogClose}
          review={selectedReviewForCirculationSummary}
          onSuccess={handleCirculationSummarySuccess}
        />
      )}

      {/* Cancel Standard Resolution Dialog */}
      {cancelStandardResolutionDialogOpen && (
        <CancelStandardResolutionDialog
          open={cancelStandardResolutionDialogOpen}
          onClose={handleCancelResolutionDialogClose}
          review={selectedReviewForCancelResolution}
          onSuccess={handleCancelResolutionSuccess}
        />
      )}

      {/* Log Dialog */}
      {logDialogOpen && (
        <ProjectReviewLogsDialog
          open={logDialogOpen}
          onClose={handleLogDialogClose}
          projectId={selectedReviewForLog?.id}
          projectName={selectedReviewForLog?.nameThai}
        />
      )}
    </Container>
  );
}
