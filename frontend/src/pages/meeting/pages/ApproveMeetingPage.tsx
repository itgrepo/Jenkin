import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Collapse,
  Grid,
  Card,
  CardContent,
  Divider,
  Autocomplete,
  Alert,
  Dialog,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  RateReview,
  Search,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import {
  Meeting,
  MeetingSearchParams,
  MeetingStatus,
  MeetingExpenseBudgetInfo,
} from "@models/meeting";
import {
  getUnapprovedMeetings,
  getMeetingExpense,
  getMeetingExpenseBudgetInfo,
  approveMeeting,
  disapproveMeeting,
  reviewMeeting,
} from "@services/meetingService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppDepartments, setGlobalLoading } from "@store/globalSlice";
import { fetchAppSubDepartments } from "@store/globalSlice";
import { MasterData } from "@models/global";
import MeetingCreateDialog from "../components/MeetingCreateDialog";

dayjs.locale("th");

export default function ApproveMeetingPage() {
  const dispatch = useAppDispatch();
  const roleId = useAppSelector((state) => state.auth.user?.role?.id);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { subDepartmentList, departmentList } = useAppSelector(
    (state) => state.global
  );

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MasterData | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<number>>(
    new Set()
  );
  const [budgetInfoMap, setBudgetInfoMap] = useState<
    Map<number, MeetingExpenseBudgetInfo>
  >(new Map());
  const [expenseMap, setExpenseMap] = useState<Map<number, any>>(new Map());

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "disapprove" | "review"
  >("approve");
  const [remarks, setRemarks] = useState("");

  // View meeting dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (!subDepartmentList) {
      // ผอ. (role id 2) ต้องโหลดกลุ่ม
      dispatch(fetchAppSubDepartments());
    }
    if (!departmentList) {
      dispatch(fetchAppDepartments());
    }
    loadMeetings();
  }, [dispatch, roleId, subDepartmentList, departmentList]);



  const loadMeetings = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);
      const params: MeetingSearchParams = {};
      if (startDate) {
        params.startDate = startDate.format("YYYY-MM-DD");
      }
      if (endDate) {
        params.endDate = endDate.format("YYYY-MM-DD");
      }
      if (selectedGroup) {
        params.subDepartmentId = selectedGroup.id;
      }

      const res = await getUnapprovedMeetings(params);
      let filteredMeetings = res.data || [];

      // Filter เฉพาะการประชุมที่ตัวเองต้อง approve
      // ผู้ใช้สามารถเป็นได้ทั้ง ผก. (role 4) และ ผอ. (role 2) ได้ในเวลาเดียวกัน
      // ใช้ OR เพราะผู้ใช้สามารถเป็น approver ได้ทั้ง level 1 และ level 2
      if (currentUser?.id) {
        filteredMeetings = filteredMeetings.filter((m) => {
          // เงื่อนไขสำหรับ level 1 approver (ผก.)
          const isLevel1Approver =
            m.approverLevel1Id === currentUser.id &&
            (m.status === "sent_for_approval_level_1");

          // เงื่อนไขสำหรับ level 2 approver (ผอ.)
          const isLevel2Approver =
            m.approverLevel2Id === currentUser.id &&
            (m.status === "sent_for_approval_level_2");

          // ใช้ OR เพราะผู้ใช้สามารถเป็นได้ทั้งสอง role
          return isLevel1Approver || isLevel2Approver;
        });
      }

      setMeetings(filteredMeetings);
    } catch (err: any) {
      console.error("Error loading meetings:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลการประชุมได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadMeetings();
  };

  const toggleBudgetSection = (meetingId: number) => {
    const newExpanded = new Set(expandedMeetings);
    if (newExpanded.has(meetingId)) {
      newExpanded.delete(meetingId);
    } else {
      newExpanded.add(meetingId);
      // Load budget info if not already loaded
      if (!budgetInfoMap.has(meetingId)) {
        loadBudgetInfo(meetingId);
      }
    }
    setExpandedMeetings(newExpanded);
  };

  const loadBudgetInfo = async (meetingId: number) => {
    try {
      const [expenseRes, budgetRes] = await Promise.all([
        getMeetingExpense(meetingId).catch(() => null),
        getMeetingExpenseBudgetInfo(meetingId).catch(() => null),
      ]);

      if (expenseRes) {
        setExpenseMap((prev) => new Map(prev).set(meetingId, expenseRes));
      }

      if (budgetRes) {
        setBudgetInfoMap((prev) => new Map(prev).set(meetingId, budgetRes));
      }
    } catch (err: any) {
      console.error("Error loading budget info:", err);
    }
  };

  const handleAction = (
    meeting: Meeting,
    type: "approve" | "disapprove" | "review"
  ) => {
    setSelectedMeeting(meeting);
    setActionType(type);
    setRemarks("");
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedMeeting?.id) return;

    const actionText =
      actionType === "approve"
        ? "อนุมัติ"
        : actionType === "disapprove"
        ? "ไม่อนุมัติ"
        : "ทบทวน";

    const confirmResult = await showConfirm(
      `ยืนยันการ${actionText}`,
      `คุณต้องการ${actionText}การประชุม "${selectedMeeting.committeeName} - ${selectedMeeting.instanceNumber}" ใช่หรือไม่?`
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      const level =
        selectedMeeting?.status === "sent_for_approval_level_1" ? 1 : 2;

      if (actionType === "approve") {
        await approveMeeting(selectedMeeting.id, level, remarks || undefined);
      } else if (actionType === "disapprove") {
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการไม่อนุมัติ");
          return;
        }
        await disapproveMeeting(selectedMeeting.id, level, remarks);
      } else {
        // review
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการทบทวน");
          return;
        }
        await reviewMeeting(selectedMeeting.id, level, remarks);
      }

      showSuccess("สำเร็จ", `ได้${actionText}การประชุมเรียบร้อยแล้ว`);
      setActionDialogOpen(false);
      setSelectedMeeting(null);
      setRemarks("");
      loadMeetings();
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

  const handleViewMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const getStatusChip = (status: MeetingStatus) => {
    const statusMap: Record<
      MeetingStatus,
      {
        label: string;
        color: "default" | "primary" | "warning" | "error" | "success" | "info";
      }
    > = {
      draft: { label: "ร่าง", color: "default" },
      sent_for_approval_level_1: {
        label: "ส่งอนุมัติระดับ 1",
        color: "info",
      },
      sent_for_approval_level_2: {
        label: "ส่งอนุมัติระดับ 2",
        color: "primary",
      },
      approved: { label: "อนุมัติแล้ว", color: "success" },
      disapproved: { label: "ไม่อนุมัติ", color: "error" },
      pending_review: { label: "รอแก้ไข", color: "warning" },
      meeting_invited: { label: "เชิญประชุม", color: "info" },
      meeting_closed: { label: "ปิดประชุม", color: "default" },
    };
    const statusInfo = statusMap[status] || statusMap.draft;
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Filter meetings ที่รออนุมัติ (ควร filter แล้วใน loadMeetings แต่ filter อีกครั้งเพื่อความแน่ใจ)
  const pendingMeetings = meetings.filter(
    (m) =>
      m.status === "sent_for_approval_level_1" ||
      m.status === "sent_for_approval_level_2" ||
      m.status === "pending_review"
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <AssignmentTurnedIn sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            รายการอนุมัติการประชุม
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
                {pendingMeetings.length}
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
                {meetings.filter((m) => m.status === "approved").length}
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
                {meetings.filter((m) => m.status === "disapproved").length}
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
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="วันที่เริ่มประชุม"
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
            <Grid size={{ xs: 12, md: 3 }}>
              <DatePicker
                label="วันที่สิ้นสุดประชุม"
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
            {/* {roleId === 2 && ( */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Autocomplete
                options={subDepartmentList || []}
                getOptionLabel={(option) => option.name || ""}
                value={selectedGroup}
                onChange={(_, newValue) => setSelectedGroup(newValue)}
                renderInput={(params) => (
                  <TextField {...params} label="กลุ่ม" size="small" fullWidth />
                )}
              />
            </Grid>
            {/* )} */}
            <Grid size={{ xs: 12, md: 3 }}>
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

        {/* Meetings List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {pendingMeetings.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                ไม่มีรายการประชุมที่รออนุมัติ
              </Typography>
            </Paper>
          ) : (
            pendingMeetings.map((meeting) => {
              const isBudgetExpanded = expandedMeetings.has(meeting.id || 0);
              const budgetInfo = budgetInfoMap.get(meeting.id || 0);
              const expense = expenseMap.get(meeting.id || 0);

              return (
                <Card
                  key={meeting.id}
                  sx={{
                    boxShadow: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Section 1: Meeting Details */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {meeting.committeeName}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          {getStatusChip(meeting.status)}
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton
                              size="small"
                              onClick={() => handleViewMeeting(meeting)}
                            >
                              <Search fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            คณะที่ {meeting.committeeNumber}
                            {meeting?.subCommitteeOf
                              ? ` - ${meeting.subCommitteeOf} `
                              : ""}
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            ครั้งที่ {meeting.instanceNumber}
                          </Typography>
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>วันที่เริ่ม:</strong>{" "}
                            {dayjs(meeting.startDate).format("DD/MM/YYYY")}
                          </Typography>
                          {meeting.endDate && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>วันที่สิ้นสุด:</strong>{" "}
                              {dayjs(meeting.endDate).format("DD/MM/YYYY")}
                            </Typography>
                          )}
                          {meeting.startTime && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>เวลา:</strong> {meeting.startTime}
                              {meeting.endTime && ` - ${meeting.endTime}`}
                            </Typography>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>หน่วยงาน:</strong>{" "}
                            {departmentList?.find(
                              (d) =>
                                d.id ===
                                Number(
                                  (meeting.hostOrganization || "").substring(
                                    0,
                                    2
                                  )
                                )
                            )?.name || "-"}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>ผู้รับผิดชอบ:</strong>{" "}
                            {meeting.responsiblePerson || "-"}
                          </Typography>
                          {meeting.remarks && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>หมายเหตุ:</strong> {meeting.remarks}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Section 2: Budget Details (Collapsible) */}
                    <Box sx={{ mb: 2 }}>
                      <Button
                        startIcon={
                          isBudgetExpanded ? <ExpandLess /> : <ExpandMore />
                        }
                        onClick={() => toggleBudgetSection(meeting.id || 0)}
                        size="small"
                        sx={{ mb: 1 }}
                      >
                        {isBudgetExpanded ? "ซ่อน" : "แสดง"} รายละเอียดงบประมาณ
                      </Button>
                      <Collapse in={isBudgetExpanded}>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: "background.default",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                          }}
                        >
                          {budgetInfo ? (
                            <Grid container spacing={2}>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>งบประมาณที่ตั้งเบิก:</strong>{" "}
                                  {expense?.totalBudget?.toLocaleString() ||
                                    "0"}{" "}
                                  บาท
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>งบประมาณประจำปี:</strong>{" "}
                                  {budgetInfo.annualBudget.toLocaleString()} บาท
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>ค่าใช้จ่ายที่เบิกจ่ายไปแล้ว:</strong>{" "}
                                  {budgetInfo.expensesDisbursed.toLocaleString()}{" "}
                                  บาท
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>ค่าใช้จ่ายที่ตั้งเบิก:</strong>{" "}
                                  {budgetInfo.expensesAdvancePayment.toLocaleString()}{" "}
                                  บาท
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    mb: 1,
                                    color:
                                      budgetInfo.remainingBudget < 0
                                        ? "error.main"
                                        : "text.primary",
                                    fontWeight: 600,
                                  }}
                                >
                                  <strong>ยอดคงเหลือ:</strong>{" "}
                                  {budgetInfo.remainingBudget.toLocaleString()}{" "}
                                  บาท
                                </Typography>
                              </Grid>
                            </Grid>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              กำลังโหลดข้อมูลงบประมาณ...
                            </Typography>
                          )}
                        </Paper>
                      </Collapse>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Section 3: Approval Actions */}
                    <Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAction(meeting, "approve")}
                          size="small"
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleAction(meeting, "disapprove")}
                          size="small"
                        >
                          ไม่อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<RateReview />}
                          onClick={() => handleAction(meeting, "review")}
                          size="small"
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
                ? "อนุมัติการประชุม"
                : actionType === "disapprove"
                ? "ไม่อนุมัติการประชุม"
                : "ทบทวนการประชุม"}
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" gutterBottom>
              การประชุม: <strong>{selectedMeeting?.committeeName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedMeeting?.instanceNumber}
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
            >
              {actionType === "approve"
                ? "อนุมัติ"
                : actionType === "disapprove"
                ? "ไม่อนุมัติ"
                : "ทบทวน"}
            </Button>
          </Box>
        </Dialog>

        {/* View Meeting Dialog */}
        {selectedMeeting && (
          <MeetingCreateDialog
            open={viewDialogOpen}
            onClose={() => {
              setViewDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={() => {
              loadMeetings();
            }}
            mode="view"
            initialData={selectedMeeting}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
}
