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
  Chip,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import {
  Visibility,
  AttachMoney,
  Mail,
  Close,
  Summarize,
  Search,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import {
  Meeting,
  MeetingSearchParams,
  MeetingStatus,
  DisbursementStatus,
} from "@models/meeting";
import { getApprovedMeetings } from "@services/meetingService";
import MeetingCreateDialog from "../components/MeetingCreateDialog";
import MeetingExpenseDialog from "../components/MeetingExpenseDialog";
import MeetingInviteDialog from "../components/MeetingInviteDialog";
import MeetingCloseDialog from "../components/MeetingCloseDialog";
import MeetingDisbursementSummaryDialog from "../components/MeetingDisbursementSummaryDialog";
import { useAppSelector } from "@hooks/useRedux";
import { fetchAppDepartments } from "@store/globalSlice";
import { useAppDispatch } from "@hooks/useRedux";

dayjs.locale("th");

export default function MeetingApprovedPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const { departmentList } = useAppSelector((state) => state.global);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [searchText, setSearchText] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [disbursementDialogOpen, setDisbursementDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    if (!departmentList) {
      dispatch(fetchAppDepartments());
    }
    loadMeetings();
  }, [dispatch, departmentList]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: MeetingSearchParams = {};
      if (startDate) {
        params.startDate = startDate.format("YYYY-MM-DD");
      }
      if (searchText.trim()) {
        params.search = searchText.trim();
      }
      params.status = "approved"; // Filter only approved meetings

      const res = await getApprovedMeetings(params);
      setMeetings(res.data || []);
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

  const handleView = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const handleExpenses = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setExpenseDialogOpen(true);
  };

  const handleInviteMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setInviteDialogOpen(true);
  };

  const handleCloseMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setCloseDialogOpen(true);
  };

  const handleSummarizeDisbursement = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setDisbursementDialogOpen(true);
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
      approved: { label: "อนุมัติประชุม", color: "success" },
      disapproved: { label: "ไม่อนุมัติ", color: "error" },
      pending_review: { label: "รอแก้ไข", color: "warning" },
      meeting_invited: { label: "เชิญประชุม", color: "info" },
      meeting_closed: { label: "ปิดประชุม", color: "default" },
    };

    const statusInfo = statusMap[status] || { label: status, color: "default" };
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getDisbursementStatusChip = (status?: DisbursementStatus) => {
    if (!status) {
      return <Chip label="-" size="small" color="default" />;
    }

    const statusMap: Record<
      DisbursementStatus,
      {
        label: string;
        color: "default" | "primary" | "warning" | "error" | "success" | "info";
      }
    > = {
      pending_approval: { label: "รอส่งอนุมัติ", color: "warning" },
      pending_approval_level_1: { label: "รออนุมัติระดับ 1", color: "info" },
      pending_approval_level_2: { label: "รออนุมัติระดับ 2", color: "primary" },
      disbursement_approved: { label: "อนุมัติ", color: "success" },
      disbursement_disapproved: { label: "ไม่อนุมัติ", color: "error" },
      disbursement_review: { label: "ทบทวน", color: "warning" },
    };

    const statusInfo = statusMap[status] || { label: status, color: "default" };
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

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
            หน้าจอแสดงรายการประชุมที่อนุมัติแล้ว
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
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
              alignItems: isMobile ? "stretch" : "flex-end",
              flexWrap: "wrap",
            }}
          >
            {/* Date Filter */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: isMobile ? "100%" : 200,
                flex: isMobile ? "1 1 100%" : "0 0 auto",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                วันที่เริ่มประชุม
              </Typography>
              <DatePicker
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
            </Box>

            {/* Search Field */}
            <Box
              sx={{
                flex: isMobile ? "1 1 100%" : "1 1 300px",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: isMobile ? "100%" : 300,
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                ค้นหา (คณะที่, ชื่อคณะ, หรือครั้งที่)
              </Typography>
              <TextField
                size="small"
                placeholder="ค้นหาจาก คณะที่ ชื่อคณะ หรือครั้งที่"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                sx={{ minWidth: isMobile ? "100%" : 300 }}
              />
            </Box>

            {/* Search Button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{
                minWidth: isMobile ? "100%" : 120,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                alignSelf: isMobile ? "stretch" : "flex-end",
              }}
            >
              ค้นหา
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table */}
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
                >
                  คณะที่
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  ชื่อคณะ
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  ครั้งที่
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  วันที่เริ่มประชุม
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  สถานะเรื่อง
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  สถานะเบิกจ่าย
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                  align="center"
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
              ) : meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      ไม่พบข้อมูลการประชุม
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow
                    key={meeting.id}
                    hover
                    sx={{
                      "&:nth-of-type(even)": { bgcolor: "action.hover" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {meeting.committeeNumber}
                      {meeting?.subCommitteeOf
                        ? ` - ${meeting.subCommitteeOf} `
                        : ""}
                    </TableCell>
                    <TableCell title={meeting.committeeName}>
                      {meeting.committeeName}
                    </TableCell>
                    <TableCell>{meeting.instanceNumber}</TableCell>
                    <TableCell>
                      {dayjs(meeting.startDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>{getStatusChip(meeting.status)}</TableCell>
                    <TableCell>
                      {getDisbursementStatusChip(meeting.disbursementStatus)}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          gap: isMobile ? 0.25 : 0.5,
                          justifyContent: "center",
                          flexWrap: "nowrap",
                        }}
                      >
                        <Tooltip title="ดู">
                          <IconButton
                            color="primary"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleView(meeting)}
                            sx={{
                              "&:hover": {
                                bgcolor: "primary.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Visibility
                              fontSize={isMobile ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ค่าใช้จ่าย">
                          <IconButton
                            color="success"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleExpenses(meeting)}
                            sx={{
                              "&:hover": {
                                bgcolor: "success.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <AttachMoney
                              fontSize={isMobile ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="เชิญประชุม">
                          <IconButton
                            color="info"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleInviteMeeting(meeting)}
                            sx={{
                              "&:hover": {
                                bgcolor: "info.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Mail fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ปิดประชุม">
                          <IconButton
                            color="error"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleCloseMeeting(meeting)}
                            sx={{
                              "&:hover": {
                                bgcolor: "error.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Close fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="สรุปเบิกจ่าย">
                          <IconButton
                            color="warning"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleSummarizeDisbursement(meeting)}
                            sx={{
                              "&:hover": {
                                bgcolor: "warning.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Summarize
                              fontSize={isMobile ? "small" : "medium"}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* View Meeting Dialog */}
        {selectedMeeting && (
          <MeetingCreateDialog
            open={viewDialogOpen}
            onClose={() => {
              setViewDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={() => {}}
            mode="view"
            initialData={selectedMeeting}
          />
        )}

        {/* Expense Dialog */}
        {selectedMeeting && (
          <MeetingExpenseDialog
            open={expenseDialogOpen}
            meeting={selectedMeeting}
            onClose={() => {
              setExpenseDialogOpen(false);
              setSelectedMeeting(null);
            }}
            canEdit={false}
          />
        )}

        {/* Invite Meeting Dialog */}
        {selectedMeeting && (
          <MeetingInviteDialog
            open={inviteDialogOpen}
            meeting={selectedMeeting}
            onClose={() => {
              setInviteDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={() => {
              loadMeetings();
            }}
          />
        )}

        {/* Close Meeting Dialog */}
        {selectedMeeting && (
          <MeetingCloseDialog
            open={closeDialogOpen}
            meeting={selectedMeeting}
            onClose={() => {
              setCloseDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={() => {
              loadMeetings();
            }}
          />
        )}

        {/* Disbursement Summary Dialog */}
        {selectedMeeting && (
          <MeetingDisbursementSummaryDialog
            open={disbursementDialogOpen}
            meeting={selectedMeeting}
            onClose={() => {
              setDisbursementDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={() => {
              loadMeetings();
            }}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
}
