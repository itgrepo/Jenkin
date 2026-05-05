import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import MeetingCreateDialog from "../components/MeetingCreateDialog";
import MeetingExpenseDialog from "../components/MeetingExpenseDialog";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import { Meeting, MeetingSearchParams, MeetingStatus } from "@models/meeting";
import {
  getUnapprovedMeetings,
  upsertMeeting,
  deleteMeeting,
  sendMeetingForApproval,
} from "@services/meetingService";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";

dayjs.locale("th");

export default function MeetingNotApprovedPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [searchText, setSearchText] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

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

      const res = await getUnapprovedMeetings(params);
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

  const handleAddMeeting = () => {
    setCreateDialogOpen(true);
  };

  const handleSaveMeeting = async (meeting: Meeting) => {
    try {
      dispatch(setGlobalLoading(true));
      await upsertMeeting(meeting);
      showSuccess(
        "สำเร็จ",
        meeting.id === 0
          ? "สร้างคำขอประชุมใหม่เรียบร้อยแล้ว"
          : "แก้ไขคำขอประชุมเรียบร้อยแล้ว"
      );
      setCreateDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedMeeting(null);
      loadMeetings();
    } catch (err: any) {
      console.error("Error saving meeting:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleView = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setViewDialogOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setEditDialogOpen(true);
  };

  const handleExpenses = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setExpenseDialogOpen(true);
  };

  const handleSend = async (meeting: Meeting) => {
    const confirmResult = await showConfirm(
      "ยืนยันการส่ง",
      "คุณต้องการส่งการประชุมนี้เพื่ออนุมัติหรือไม่?"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await sendMeetingForApproval(meeting.id || 0, 1);
      showSuccess("สำเร็จ", "ส่งการประชุมเพื่ออนุมัติเรียบร้อยแล้ว");
      loadMeetings();
    } catch (err: any) {
      console.error("Error sending meeting:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถส่งการประชุมได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleDelete = async (id: number) => {
    const confirmResult = await showConfirm(
      "ยืนยันการลบ",
      "คุณต้องการลบการประชุมนี้หรือไม่?"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await deleteMeeting(id);
      showSuccess("สำเร็จ", "ลบการประชุมเรียบร้อยแล้ว");
      loadMeetings();
    } catch (err: any) {
      console.error("Error deleting meeting:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบการประชุมได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format("DD/MM/YYYY");
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

  const canEdit = (status: MeetingStatus) => {
    return (
      status === "draft" ||
      status === "pending_review" ||
      status === "disapproved"
    );
  };

  const canSend = (status: MeetingStatus, hasExpense?: boolean) => {
    const statusAllowed = status === "draft" || status === "pending_review";
    return statusAllowed && (hasExpense === true);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <PendingActionsIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            รายการประชุมที่ยังไม่อนุมัติ
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
                ค้นหา
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
                fullWidth
              />
            </Box>

            {/* Search Button */}
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              sx={{
                minWidth: isMobile ? "100%" : 120,
                height: "40px",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              ค้นหา
            </Button>

            {/* Add Meeting Button */}
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleAddMeeting}
              sx={{
                minWidth: isMobile ? "100%" : 180,
                height: "40px",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              เพิ่มการประชุมใหม่
            </Button>
          </Box>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Results Table */}
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
                  align="center"
                >
                  การทำงาน
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
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
                    <TableCell
                      title={meeting.committeeName}
                    >
                      {meeting.committeeName}
                    </TableCell>
                    <TableCell >
                      {meeting.instanceNumber}
                    </TableCell>
                    <TableCell>
                      {formatDate(meeting.startDate)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(meeting.status)}
                    </TableCell>
                    <TableCell
                      align="center">
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
                            <VisibilityIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="แก้ไข">
                          <span>
                            <IconButton
                              color="success"
                              size={isMobile ? "small" : "medium"}
                              onClick={() => handleEdit(meeting)}
                              disabled={!canEdit(meeting.status)}
                              sx={{
                                "&:hover": {
                                  bgcolor: "success.light",
                                  color: "white",
                                },
                                padding: isMobile ? 0.5 : 1,
                              }}
                            >
                              <EditIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="ค่าใช้จ่าย">
                          <IconButton
                            color="secondary"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleExpenses(meeting)}
                            sx={{
                              "&:hover": {
                                bgcolor: "secondary.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <AttachMoneyIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip 
                          title={
                            !canSend(meeting.status, meeting.hasExpense)
                              ? meeting.hasExpense === false
                                ? "กรุณาบันทึกค่าใช้จ่ายก่อนส่ง"
                                : "ไม่สามารถส่งได้"
                              : "ส่ง"
                          }
                        >
                          <span>
                            <IconButton
                              color="warning"
                              size={isMobile ? "small" : "medium"}
                              onClick={() => handleSend(meeting)}
                              disabled={!canSend(meeting.status, meeting.hasExpense)}
                              sx={{
                                "&:hover": {
                                  bgcolor: "warning.light",
                                  color: "white",
                                },
                                padding: isMobile ? 0.5 : 1,
                              }}
                            >
                              <SendIcon fontSize={isMobile ? "small" : "medium"} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="ลบ">
                          <IconButton
                            color="error"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleDelete(meeting.id || 0)}
                            disabled={!canEdit(meeting.status)}
                            sx={{
                              "&:hover": {
                                bgcolor: "error.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
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

        {/* Create Meeting Dialog */}
        {createDialogOpen && (
          <MeetingCreateDialog
            open={createDialogOpen}
            onClose={() => {
              setCreateDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={handleSaveMeeting}
            mode="create"
          />
        )}

        {/* View Meeting Dialog */}
        {viewDialogOpen && (
          <MeetingCreateDialog
            open={viewDialogOpen}
            onClose={() => {
              setViewDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={handleSaveMeeting}
            mode="view"
            initialData={selectedMeeting || undefined}
          />
        )}

        {/* Edit Meeting Dialog */}
        {editDialogOpen && (
          <MeetingCreateDialog
            open={editDialogOpen}
            onClose={() => {
              setEditDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onSave={handleSaveMeeting}
            mode="edit"
            initialData={selectedMeeting || undefined}
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
            onSave={() => {
              // Reload meetings to update hasExpense status
              loadMeetings();
              // Optionally reload meetings or refresh data
            }}
            canEdit={canEdit(selectedMeeting?.status || "draft")}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
}
