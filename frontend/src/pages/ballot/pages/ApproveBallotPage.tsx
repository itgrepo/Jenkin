import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import {
  CheckCircle,
  Cancel,
  RateReview,
  Search,
  CheckCircle as CheckCircleIcon,
  Preview,
  CalendarToday,
  Group,
} from "@mui/icons-material";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import {
  BallotRequest,
  BallotRequestStatus,
} from "@models/ballot";
import {
  getBallotRequests,
  approveBallotRequest,
  disapproveBallotRequest,
  reviewBallotRequest,
} from "@services/ballotService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { fetchAppBallotGroupType } from "@store/globalSlice";
import BallotDraftPreviewDialog from "../components/BallotDraftPreviewDialog";
import { BallotDraft } from "@models/ballot";

dayjs.locale("th");

export default function ApproveBallotPage() {
  const dispatch = useAppDispatch();
  const roleId = useAppSelector((state) => state.auth.user?.role?.id);
//   const currentUser = useAppSelector((state) => state.auth.user);
  const { ballotGroupTypeList } = useAppSelector((state) => state.global);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [requests, setRequests] = useState<BallotRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BallotRequest | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "disapprove" | "review"
  >("approve");
  const [remarks, setRemarks] = useState("");

  // Preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<BallotDraft | null>(null);

  useEffect(() => {
    if (!ballotGroupTypeList) {
      dispatch(fetchAppBallotGroupType());
    }
    loadRequests();
  }, [dispatch, ballotGroupTypeList]);

  const loadRequests = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);

      console.log("roleId:",roleId)
      
      // Filter status ตาม role
      let statusFilter: BallotRequestStatus;
      if (roleId === 2) {
        // Director (role 2) → filter เฉพาะ waiting_director_review
        statusFilter = "waiting_manager_review";
      } else if (roleId === 4) {
        // Manager (role 4) → filter เฉพาะ waiting_manager_review
        statusFilter = "waiting_director_review";
      } else {
        // ถ้าไม่มี role หรือ role อื่น → ไม่แสดงอะไร
        setRequests([]);
        return;
      }

      const params: any = {
        status: statusFilter,
      };

      if (startDate) {
        params.startDate = startDate.format("YYYY-MM-DD");
      }
      if (endDate) {
        params.endDate = endDate.format("YYYY-MM-DD");
      }

      const res = await getBallotRequests(params);
      let filteredRequests = res.data || [];

      // Filter เฉพาะการเวียนขอข้อคิดเห็นที่ตัวเองต้อง approve
    //   if (currentUser?.id) {
    //     filteredRequests = filteredRequests.filter((r) => {
    //       if (roleId === 2) {
    //         // Director → ตรวจสอบ directorId
    //         return r.directorId === currentUser.id;
    //       } else if (roleId === 4) {
    //         // Manager → ตรวจสอบ managerId
    //         return r.managerId === currentUser.id;
    //       }
    //       return false;
    //     });
    //   }

      setRequests(filteredRequests);
    } catch (err: any) {
      console.error("Error loading requests:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลการเวียนขอข้อคิดเห็นได้"
      );
    } finally {
        dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadRequests();
  };

  const handleAction = (
    request: BallotRequest,
    type: "approve" | "disapprove" | "review"
  ) => {
    setSelectedRequest(request);
    setActionType(type);
    setRemarks("");
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest?.id) return;

    const actionText =
      actionType === "approve"
        ? "อนุมัติ"
        : actionType === "disapprove"
        ? "ไม่อนุมัติ"
        : "ทบทวน";

    const confirmResult = await showConfirm(
      `ยืนยันการ${actionText}`,
      `คุณต้องการ${actionText}การเวียนขอข้อคิดเห็น "${selectedRequest.name}" ใช่หรือไม่?`
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      const level =
        selectedRequest?.status === "waiting_manager_review" ? 1 : 2;

      if (actionType === "approve") {
        await approveBallotRequest(
          selectedRequest.id,
          level,
          remarks || undefined
        );
      } else if (actionType === "disapprove") {
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการไม่อนุมัติ");
          return;
        }
        await disapproveBallotRequest(selectedRequest.id, level, remarks);
      } else {
        // review
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการทบทวน");
          return;
        }
        await reviewBallotRequest(selectedRequest.id, level, remarks);
      }

      showSuccess("สำเร็จ", `ได้${actionText}การเวียนขอข้อคิดเห็นเรียบร้อยแล้ว`);
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setRemarks("");
      loadRequests();
    } catch (err: any) {
      console.error("Error processing action:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถดำเนินการได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handlePreview = (request: BallotRequest) => {
    // Convert request to draft format for preview
    const draft: BallotDraft = {
      name: request.name,
      questionText: request.questionText,
      answerType: request.answerType,
      hasTextInput: request.hasTextInput,
      answers: request.answers || [],
      attachments: request.attachments || [],
    };
    setPreviewDraft(draft);
    setPreviewDialogOpen(true);
  };

  const getStatusChip = (status: BallotRequestStatus) => {
    const statusMap: Record<
      BallotRequestStatus,
      {
        label: string;
        color: "default" | "primary" | "warning" | "error" | "success" | "info";
      }
    > = {
      pending_approval: { label: "รอส่งอนุมัติ", color: "default" },
      waiting_manager_review: {
        label: "รอ ผก. พิจารณา",
        color: "info",
      },
      waiting_director_review: {
        label: "รอ ผอ. พิจารณา",
        color: "primary",
      },
      manager_approved: { label: "ผก. อนุมัติแล้ว", color: "success" },
      manager_disapproved: { label: "ผก. ไม่อนุมัติ", color: "error" },
      director_approved: { label: "ผอ. อนุมัติแล้ว", color: "success" },
      director_disapproved: { label: "ผอ. ไม่อนุมัติ", color: "error" },
      pending_review: { label: "รอแก้ไข", color: "warning" },
      closed: { label: "ปิดแล้ว", color: "default" },
    };
    const statusInfo = statusMap[status] || statusMap.pending_approval;
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const getGroupTypeName = (groupTypeId: number): string => {
    return (
      ballotGroupTypeList?.find((g) => g.id === groupTypeId)?.name ||
      `กลุ่ม ${groupTypeId}`
    );
  };

  // Filter requests ที่รออนุมัติ
  const pendingRequests = requests.filter(
    (r) =>
      r.status === "waiting_manager_review" ||
      r.status === "waiting_director_review"
  );

  // Calculate stats
  // const approvedCount = requests.filter(
  //   (r) => r.status === "manager_approved" || r.status === "director_approved"
  // ).length;
  // const disapprovedCount = requests.filter(
  //   (r) =>
  //     r.status === "manager_disapproved" ||
  //     r.status === "director_disapproved"
  // ).length;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            รายการอนุมัติการเวียนขอข้อคิดเห็น
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {pendingRequests.length}
              </Typography>
              <Typography variant="body1">รอการอนุมัติ</Typography>
            </Paper>
          </Box>
          {/* <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "success.main",
                color: "white",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {approvedCount}
              </Typography>
              <Typography variant="body1">อนุมัติแล้ว</Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "error.main",
                color: "white",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {disapprovedCount}
              </Typography>
              <Typography variant="body1">ปฏิเสธแล้ว</Typography>
            </Paper>
          </Box> */}
        </Box>

        {/* Filter Section */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          }}
        >
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, md: 4 }}>
              <DatePicker
                label="วันที่เริ่มสอบถาม"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DatePicker
                label="วันที่สิ้นสุดสอบถาม"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
                fullWidth
                sx={{ height: "40px" }}
              >
                ค้นหา
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Requests List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          { pendingRequests.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                ไม่มีรายการการเวียนขอข้อคิดเห็นที่รออนุมัติ
              </Typography>
            </Paper>
          ) : (
            pendingRequests.map((request) => {
              return (
                <Card
                  key={request.id}
                  sx={{
                    boxShadow: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Section 1: Request Details */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {request.name}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          {getStatusChip(request.status)}
                          <Tooltip title="ดูตัวอย่าง">
                            <IconButton
                              size="small"
                              onClick={() => handlePreview(request)}
                              color="primary"
                            >
                              <Preview fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>วันที่เริ่มต้น - วันที่สิ้นสุด:</strong>{" "}
                              {dayjs(request.startDate).format("DD/MM/YYYY")} -{" "}
                              {dayjs(request.endDate).format("DD/MM/YYYY")}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Group fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>กลุ่มที่ต้องการเวียนข้อคิดเห็น:</strong>{" "}
                              {getGroupTypeName(request.groupType)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          {request.projectName && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>ร่างมาตรฐาน:</strong> {request.projectName}
                            </Typography>
                          )}
                          {request.createdByName && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>ผู้สร้าง:</strong> {request.createdByName}
                            </Typography>
                          )}
                          {request.createdAt && (
                            <Typography variant="body2">
                              <strong>วันที่สร้าง:</strong>{" "}
                              {dayjs(request.createdAt).format("DD/MM/YYYY HH:mm")}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Section 2: Approval Actions */}
                    <Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAction(request, "approve")}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleAction(request, "disapprove")}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          ไม่อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<RateReview />}
                          onClick={() => handleAction(request, "review")}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          ทบทวน
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>

        {/* Action Dialog */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => {
            setActionDialogOpen(false);
            setRemarks("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <Box
            component="div"
            sx={{
              bgcolor:
                actionType === "approve"
                  ? "success.main"
                  : actionType === "disapprove"
                  ? "error.main"
                  : "warning.main",
              color: "white",
              p: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {actionType === "approve"
                ? "อนุมัติการเวียนขอข้อคิดเห็น"
                : actionType === "disapprove"
                ? "ไม่อนุมัติการเวียนขอข้อคิดเห็น"
                : "ทบทวนการเวียนขอข้อคิดเห็น"}
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" gutterBottom>
              การเวียนขอข้อคิดเห็น: <strong>{selectedRequest?.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedRequest?.startDate &&
                selectedRequest?.endDate &&
                `${dayjs(selectedRequest.startDate).format("DD/MM/YYYY")} - ${dayjs(selectedRequest.endDate).format("DD/MM/YYYY")}`}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={
                actionType === "approve" ? "หมายเหตุ (ไม่บังคับ)" : "เหตุผล *"
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required={actionType !== "approve"}
              sx={{ mt: 2 }}
            />
          </Box>
          <Box
            sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              onClick={() => {
                setActionDialogOpen(false);
                setRemarks("");
              }}
              sx={{ textTransform: "none" }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              color={
                actionType === "approve"
                  ? "success"
                  : actionType === "disapprove"
                  ? "error"
                  : "warning"
              }
              onClick={confirmAction}
              disabled={
                (actionType === "disapprove" || actionType === "review") &&
                !remarks.trim()
              }
              startIcon={
                actionType === "approve" ? (
                  <CheckCircle />
                ) : actionType === "disapprove" ? (
                  <Cancel />
                ) : (
                  <RateReview />
                )
              }
              sx={{ textTransform: "none" }}
            >
              {actionType === "approve"
                ? "อนุมัติ"
                : actionType === "disapprove"
                ? "ไม่อนุมัติ"
                : "ทบทวน"}
            </Button>
          </Box>
        </Dialog>

        {/* Preview Dialog */}
        {previewDraft && (
          <BallotDraftPreviewDialog
            open={previewDialogOpen}
            onClose={() => {
              setPreviewDialogOpen(false);
              setPreviewDraft(null);
            }}
            draft={previewDraft}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
}

