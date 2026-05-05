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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Visibility,
  Download,
} from "@mui/icons-material";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import {
  Meeting,
  MeetingSearchParams,
  DisbursementStatus,
  MeetingParticipant,
  DisbursementSummaryWithMeeting,
} from "@models/meeting";
import {
  getPendingDisbursementMeetings,
  getMeetingParticipants,
  approveDisbursement,
  disapproveDisbursement,
  reviewDisbursement,
} from "@services/meetingService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppDepartments, fetchAppSubDepartments, setGlobalLoading } from "@store/globalSlice";
import { MasterData } from "@models/global";
import MeetingCreateDialog from "../components/MeetingCreateDialog";

dayjs.locale("th");

export default function ApproveDisbursementPage() {
  const dispatch = useAppDispatch();
  const roleId = useAppSelector((state) => state.auth.user?.role?.id);
  const currentUser = useAppSelector((state) => state.auth.user);
  const { subDepartmentList, departmentList } = useAppSelector(
    (state) => state.global
  );

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<MasterData | null>(null);
  const [disbursementSummaries, setDisbursementSummaries] = useState<
    DisbursementSummaryWithMeeting[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<number>>(
    new Set()
  );
  const [participantsMap, setParticipantsMap] = useState<
    Map<number, MeetingParticipant[]>
  >(new Map());

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [selectedSummaryStatus, setSelectedSummaryStatus] = useState<DisbursementStatus | undefined>(undefined);
  const [actionType, setActionType] = useState<
    "approve" | "disapprove" | "review"
  >("approve");
  const [remarks, setRemarks] = useState("");

  // View meeting dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (!subDepartmentList && roleId === 2) {
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
      setLoading(true);
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

      const res = await getPendingDisbursementMeetings(params);
      let filteredSummaries = res.data || [];

      // Filter เฉพาะการประชุมที่ตัวเองต้อง approve
      // ผู้ใช้สามารถเป็นได้ทั้ง ผก. (role 4) และ ผอ. (role 2) ได้ในเวลาเดียวกัน
      if (currentUser?.id) {
        filteredSummaries = filteredSummaries.filter((summary) => {
          const meeting = summary.meeting;
          // เงื่อนไขสำหรับ level 1 approver (ผก.)

          if(currentUser?.role?.id===2){  
            return meeting.hostOrganization === (currentUser?.reg_subdepart)?.substring(0, 2) &&  currentUser?.role?.id===2&&
            summary.status === "pending_approval_level_1";
          }else if(currentUser?.role?.id===4){
            return meeting.hostOrganization === (currentUser?.reg_subdepart)?.substring(0, 2) &&  currentUser?.role?.id===4&&
            summary.status === "pending_approval_level_2";
          }
          return false;
        });
      }

      setDisbursementSummaries(filteredSummaries);
    } catch (err: any) {
      console.error("Error loading meetings:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลการประชุมได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMeetings();
  };

  const toggleDetailsSection = (meetingId: number) => {
    const newExpanded = new Set(expandedMeetings);
    if (newExpanded.has(meetingId)) {
      newExpanded.delete(meetingId);
    } else {
      newExpanded.add(meetingId);
      // Load participants and disbursement summary if not already loaded
      if (!participantsMap.has(meetingId)) {
        loadMeetingDetails(meetingId);
      }
    }
    setExpandedMeetings(newExpanded);
  };

  const loadMeetingDetails = async (meetingId: number) => {
    try {
      const participantsRes = await getMeetingParticipants(meetingId).catch(() => null);

      if (participantsRes) {
        setParticipantsMap((prev) =>
          new Map(prev).set(meetingId, participantsRes.data || [])
        );
      }

      // Disbursement data is already in the summary, no need to load separately
    } catch (err: any) {
      console.error("Error loading meeting details:", err);
    }
  };

  const handleAction = (
    summary: DisbursementSummaryWithMeeting,
    type: "approve" | "disapprove" | "review"
  ) => {
    setSelectedMeeting(summary.meeting);
    setActionType(type);
    setRemarks("");
    setActionDialogOpen(true);
    // Store the summary status for determining level
    setSelectedSummaryStatus(summary.status);
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
      `คุณต้องการ${actionText}การเบิกจ่ายการประชุม "${selectedMeeting.committeeName} - ${selectedMeeting.instanceNumber}" ใช่หรือไม่?`
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      const level =
        selectedSummaryStatus === "pending_approval_level_1"
          ? 1
          : 2;

      if (actionType === "approve") {
        await approveDisbursement(
          selectedMeeting.id,
          level,
          remarks || undefined
        );
      } else if (actionType === "disapprove") {
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการไม่อนุมัติ");
          return;
        }
        await disapproveDisbursement(selectedMeeting.id, level, remarks);
      } else {
        // review
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการทบทวน");
          return;
        }
        await reviewDisbursement(selectedMeeting.id, level, remarks);
      }

      showSuccess("สำเร็จ", `ได้${actionText}การเบิกจ่ายเรียบร้อยแล้ว`);
      setActionDialogOpen(false);
      setSelectedMeeting(null);
      setSelectedSummaryStatus(undefined);
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

  const getDisbursementStatusChip = (status?: DisbursementStatus) => {
    const statusMap: Record<
      DisbursementStatus,
      {
        label: string;
        color: "default" | "primary" | "warning" | "error" | "success" | "info";
      }
    > = {
      pending_approval: { label: "รอส่งอนุมัติ", color: "warning" },
      pending_approval_level_1: {
        label: "รออนุมัติระดับ 1",
        color: "info",
      },
      pending_approval_level_2: {
        label: "รออนุมัติระดับ 2",
        color: "primary",
      },
      disbursement_approved: { label: "อนุมัติแล้ว", color: "success" },
      disbursement_disapproved: { label: "ไม่อนุมัติ", color: "error" },
      disbursement_review: { label: "รอแก้ไข", color: "warning" },
    };
    if (!status) return null;
    const statusInfo = statusMap[status] || statusMap.pending_approval_level_1;
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  // Filter summaries ที่รออนุมัติการเบิกจ่าย
  const pendingSummaries = disbursementSummaries.filter(
    (summary) =>
      summary.status === "pending_approval_level_1" ||
      summary.status === "pending_approval_level_2"
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
            รายการอนุมัติการเบิกจ่าย
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
                {pendingSummaries.length}
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
                {disbursementSummaries.filter(
                  (summary) => summary.status === "disbursement_approved"
                ).length}
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
                {disbursementSummaries.filter(
                  (summary) => summary.status === "disbursement_disapproved"
                ).length}
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
            {roleId === 2 && (
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
            )}
            <Grid size={{ xs: 12, md: roleId === 2 ? 3 : 6 }}>
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
          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography>กำลังโหลดข้อมูล...</Typography>
            </Box>
          ) : pendingSummaries.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                ไม่มีรายการเบิกจ่ายที่รออนุมัติ
              </Typography>
            </Paper>
          ) : (
            pendingSummaries.map((summary) => {
              const meeting = summary.meeting;
              const isDetailsExpanded = expandedMeetings.has(meeting.id || 0);
              const participants = participantsMap.get(meeting.id || 0) || [];
              // Use summary directly since it already contains all disbursement data
              const disbursement = summary;

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
                          {getDisbursementStatusChip(summary.status)}
                          <Tooltip title="ดูรายละเอียด">
                            <IconButton
                              size="small"
                              onClick={() => handleViewMeeting(meeting)}
                            >
                              <Visibility fontSize="small" />
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
                            คณะที่{" "}
                            {meeting?.subCommitteeOf
                              ? meeting?.subCommitteeOf + " - "
                              : ""}{" "}
                            {meeting.committeeNumber}
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

                      {/* Button to toggle Sections 2 and 3 */}
                      <Box sx={{ mt: 2 }}>
                        <Button
                          startIcon={
                            isDetailsExpanded ? <ExpandLess /> : <ExpandMore />
                          }
                          onClick={() => toggleDetailsSection(meeting.id || 0)}
                          size="small"
                          variant="outlined"
                        >
                          {isDetailsExpanded ? "ซ่อน" : "แสดง"} รายละเอียดผู้เข้าร่วมและค่าใช้จ่าย
                        </Button>
                      </Box>
                    </Box>

                    {/* Section 2: Participants Details (Collapsible) */}
                    <Collapse in={isDetailsExpanded}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          รายละเอียดผู้เข้าร่วมประชุม
                        </Typography>
                        <TableContainer
                          component={Paper}
                          sx={{
                            maxHeight: 300,
                            overflowX: "auto",
                            overflowY: "auto",
                            "&::-webkit-scrollbar": {
                              width: "8px",
                              height: "8px",
                            },
                            "&::-webkit-scrollbar-track": {
                              background: "transparent",
                            },
                            "&::-webkit-scrollbar-thumb": {
                              background: "rgba(0,0,0,0.2)",
                              borderRadius: "4px",
                            },
                            "&::-webkit-scrollbar-thumb:hover": {
                              background: "rgba(0,0,0,0.3)",
                            },
                          }}
                        >
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell
                                  sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                >
                                  ชื่อ-นามสกุล
                                </TableCell>
                                <TableCell
                                  sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                >
                                  อีเมล
                                </TableCell>
                                <TableCell
                                  sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontWeight: 600,
                                    textAlign: "center",
                                  }}
                                >
                                  เข้าร่วม
                                </TableCell>
                                <TableCell
                                  sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontWeight: 600,
                                    textAlign: "center",
                                  }}
                                >
                                  ส่งตัวแทน
                                </TableCell>
                                <TableCell
                                  sx={{
                                    bgcolor: "primary.main",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                >
                                  ค่าเบี้ยประชุม
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {participants.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" color="text.secondary">
                                      ไม่พบข้อมูลผู้เข้าร่วมประชุม
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                participants.map((participant, index) => (
                                  <TableRow key={participant.id || index} hover>
                                    <TableCell>{participant.name || "-"}</TableCell>
                                    <TableCell>
                                      <Typography variant="body2" color="text.secondary">
                                        {participant.email || "-"}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      {participant.attended ? "✓" : "-"}
                                    </TableCell>
                                    <TableCell align="center">
                                      {participant.sentRepresentative ? "✓" : "-"}
                                    </TableCell>
                                    <TableCell>
                                      {participant.meetingAllowance
                                        ? parseFloat(participant.meetingAllowance).toLocaleString()
                                        : "-"}{" "}
                                      บาท
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>

                    {/* Section 3: Disbursement Summary (Collapsible) */}
                    <Collapse in={isDetailsExpanded}>
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, mb: 2 }}
                        >
                          สรุปค่าใช้จ่าย
                        </Typography>
                        {disbursement ? (
                          <>
                            <TableContainer
                              component={Paper}
                              sx={{
                                maxHeight: 300,
                                overflowX: "auto",
                                overflowY: "auto",
                                "&::-webkit-scrollbar": {
                                  width: "8px",
                                  height: "8px",
                                },
                                "&::-webkit-scrollbar-track": {
                                  background: "transparent",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                  background: "rgba(0,0,0,0.2)",
                                  borderRadius: "4px",
                                },
                                "&::-webkit-scrollbar-thumb:hover": {
                                  background: "rgba(0,0,0,0.3)",
                                },
                              }}
                            >
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell
                                      sx={{
                                        bgcolor: "primary.main",
                                        color: "white",
                                        fontWeight: 600,
                                      }}
                                    >
                                      ประเภทค่าใช้จ่าย
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        bgcolor: "primary.main",
                                        color: "white",
                                        fontWeight: 600,
                                        textAlign: "right",
                                      }}
                                    >
                                      งบประมาณ
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        bgcolor: "primary.main",
                                        color: "white",
                                        fontWeight: 600,
                                        textAlign: "right",
                                      }}
                                    >
                                      ค่าใช้จ่ายจริง
                                    </TableCell>
                                    <TableCell
                                      sx={{
                                        bgcolor: "primary.main",
                                        color: "white",
                                        fontWeight: 600,
                                        textAlign: "right",
                                      }}
                                    >
                                      ส่วนต่าง
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {disbursement.expenses && disbursement.expenses.length > 0 ? (
                                    disbursement.expenses.map((expense, index) => {
                                      const diff =
                                        (expense.budgetAmount || 0) -
                                        (expense.actualExpense || 0);
                                      return (
                                        <TableRow key={expense.id || index} hover>
                                          <TableCell>
                                            {expense.expenseTypeName || "-"}
                                          </TableCell>
                                          <TableCell align="right">
                                            {(expense.budgetAmount || 0).toLocaleString()} บาท
                                          </TableCell>
                                          <TableCell align="right">
                                            {(expense.actualExpense || 0).toLocaleString()} บาท
                                          </TableCell>
                                          <TableCell
                                            align="right"
                                            sx={{
                                              color:
                                                diff < 0 ? "error.main" : "success.main",
                                              fontWeight: 600,
                                            }}
                                          >
                                            {diff.toLocaleString()} บาท
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center">
                                        <Typography variant="body2" color="text.secondary">
                                          ไม่พบข้อมูลค่าใช้จ่าย
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </TableContainer>

                            {/* Expense Files */}
                            {disbursement.expenseFileNames &&
                              disbursement.expenseFileNames.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 600, mb: 1 }}
                                  >
                                    เอกสารค่าใช้จ่าย:
                                  </Typography>
                                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                    {disbursement.expenseFileNames.map((fileName, index) => (
                                      <Chip
                                        key={index}
                                        label={fileName}
                                        icon={<Download />}
                                        size="small"
                                        component="a"
                                        href={
                                          disbursement.expenseFilePaths?.[index]
                                            ? `${import.meta.env.VITE_MINIO_BASE_URL}/${disbursement.expenseFilePaths[index]}`
                                            : "#"
                                        }
                                        target="_blank"
                                        clickable
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            กำลังโหลดข้อมูลค่าใช้จ่าย...
                          </Typography>
                        )}
                      </Box>
                    </Collapse>

                    <Divider sx={{ my: 2 }} />

                    {/* Section 4: Approval Actions */}
                    <Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAction(summary, "approve")}
                          size="small"
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleAction(summary, "disapprove")}
                          size="small"
                        >
                          ไม่อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="warning"
                          startIcon={<RateReview />}
                          onClick={() => handleAction(summary, "review")}
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
                ? "อนุมัติการเบิกจ่าย"
                : actionType === "disapprove"
                ? "ไม่อนุมัติการเบิกจ่าย"
                : "ทบทวนการเบิกจ่าย"}
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

