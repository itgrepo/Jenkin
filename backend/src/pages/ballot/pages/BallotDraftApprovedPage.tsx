import { useEffect, useState, useMemo } from "react";
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
  IconButton,
  Tooltip,
  Alert,
  Grid,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Visibility,
  Preview,
  Send,
  Close as CloseIcon,
  Search,
  AssignmentTurnedIn,
} from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/th";
import {
  BallotRequest,
  BallotDisplayStatus,
} from "@models/ballot";
import {
  getBallotRequests,
  closeBallotRequest,
  sendBallotRequestEmail,
} from "@services/ballotService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { fetchAppBallotGroupType } from "@store/globalSlice";
import BallotResponsePreviewDialog from "../components/BallotResponsePreviewDialog";
import BallotDataViewDialog from "../components/BallotDataViewDialog";

dayjs.locale("th");

// Calculate display status based on dates and approval status
const calculateDisplayStatus = (
  request: BallotRequest
): BallotDisplayStatus => {
  // ถ้ายังไม่อนุมัติจาก director → ไม่แสดง
  if (request.status !== "director_approved" && request.status !== "closed") {
    return "pending_open";
  }

  // ถ้าปิดแล้ว
  if (request.status === "closed") {
    return "closed";
  }

  const now = dayjs();
  const startDate = dayjs(request.startDate);
  const endDate = dayjs(request.endDate);

  // ยังไม่ถึงวันเริ่ม → รอเปิด
  if (now.isBefore(startDate)) {
    return "pending_open";
  }

  // อยู่ระหว่างวันที่เริ่ม-สิ้นสุด → เปิด
  if (now.isAfter(startDate) && now.isBefore(endDate) || now.isSame(startDate) || now.isSame(endDate)) {
    return "open";
  }

  // เลยวันที่สิ้นสุดแล้ว → รอปิด
  if (now.isAfter(endDate)) {
    return "pending_close";
  }

  return "pending_open";
};

// Status options for filter
const statusOptions: { value: BallotDisplayStatus | "all"; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending_open", label: "รอเปิด" },
  { value: "open", label: "เปิด" },
  { value: "pending_close", label: "รอปิด" },
  { value: "closed", label: "ปิด" },
];

export default function BallotDraftApprovedPage() {
 
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { ballotGroupTypeList } = useAppSelector((state) => state.global);

  const [statusFilter, setStatusFilter] = useState<BallotDisplayStatus | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [requests, setRequests] = useState<BallotRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [dataViewDialogOpen, setDataViewDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BallotRequest | null>(null);
  const [previewRequest, setPreviewRequest] = useState<BallotRequest | null>(null);

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

      // Load only approved requests created by current user
      const params: any = {
        status: ["director_approved", "closed"],
        createdBy: currentUser?.id, // แสดงเฉพาะของ user ที่ login
        search: searchText.trim() || undefined,
      };

      const res = await getBallotRequests(params);
      setRequests(res.data || []);
    } catch (err: any) {
      console.error("Error loading requests:", err);
      setError(
        err?.response?.data?.message ||
          "ไม่สามารถโหลดข้อมูลการเวียนขอข้อคิดเห็นได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  // Filter requests by display status
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const displayStatus = calculateDisplayStatus(request);
      if (statusFilter === "all") return true;
      return displayStatus === statusFilter;
    });
  }, [requests, statusFilter]);

  const getGroupTypeName = (groupTypeId: number): string => {
    return (
      ballotGroupTypeList?.find((g) => g.id === groupTypeId)?.name ||
      `กลุ่ม ${groupTypeId}`
    );
  };

  const getStatusChip = (status: BallotDisplayStatus) => {
    const statusMap: Record<
      BallotDisplayStatus,
      {
        label: string;
        color: "default" | "primary" | "warning" | "error" | "success" | "info";
      }
    > = {
      pending_open: { label: "รอเปิด", color: "warning" },
      open: { label: "เปิด", color: "success" },
      pending_close: { label: "รอปิด", color: "info" },
      closed: { label: "ปิด", color: "default" },
    };
    const statusInfo = statusMap[status] || statusMap.pending_open;
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const handlePreview = (request: BallotRequest) => {
    setPreviewRequest(request);
    setPreviewDialogOpen(true);
  };

  const handleViewData = (request: BallotRequest) => {
    setSelectedRequest(request);
    setDataViewDialogOpen(true);
  };

  const handleSendEmail = async (request: BallotRequest) => {
    const confirmResult = await showConfirm(
      "ยืนยันการส่งอีเมล",
      `คุณต้องการส่งอีเมลไปยังกลุ่มที่ต้องการเวียนข้อคิดเห็น "${request.name}" ใช่หรือไม่?`
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await sendBallotRequestEmail(request.id!);
      showSuccess("สำเร็จ", "ส่งอีเมลเรียบร้อยแล้ว");
    } catch (err: any) {
      console.error("Error sending email:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถส่งอีเมลได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleClose = (request: BallotRequest) => {
    setSelectedRequest(request);
    setCloseDialogOpen(true);
  };

  const confirmClose = async () => {
    if (!selectedRequest?.id) return;

    const confirmResult = await showConfirm(
      "ยืนยันการปิด",
      `คุณต้องการปิดการเวียนขอข้อคิดเห็น "${selectedRequest.name}" ใช่หรือไม่?\n\nเมื่อปิดแล้วจะไม่สามารถรับความคิดเห็นได้อีก`
    );

    if (!confirmResult.isConfirmed) {
      setCloseDialogOpen(false);
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await closeBallotRequest(selectedRequest.id);
      showSuccess("สำเร็จ", "ปิดการเวียนขอข้อคิดเห็นเรียบร้อยแล้ว");
      setCloseDialogOpen(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (err: any) {
      console.error("Error closing request:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถปิดได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <AssignmentTurnedIn sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการเวียนขอข้อคิดเห็นที่อนุมัติแล้ว
        </Typography>
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
            <Autocomplete
              fullWidth
              size="small"
              options={statusOptions}
              getOptionLabel={(option) => option.label}
              value={
                statusOptions.find((s) => s.value === statusFilter) ||
                statusOptions[0]
              }
              onChange={(_, newValue) => {
                setStatusFilter(
                  (newValue?.value as BallotDisplayStatus | "all") || "all"
                );
              }}
              renderInput={(params) => (
                <TextField {...params} label="สถานะ" placeholder="เลือกสถานะ" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="ชื่อข้อคิดเห็น"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="ค้นหาชื่อข้อคิดเห็น"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={loadRequests}
              fullWidth
              sx={{ height: "40px", textTransform: "none" }}
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

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                ลำดับที่
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                ชื่อข้อคิดเห็น
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                วันที่เริ่ม
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                วันที่สิ้นสุด
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                กลุ่ม
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                สถานะ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, textAlign: "center" }}
              >
                การทำงาน
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูล
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request, index) => {
                const displayStatus = calculateDisplayStatus(request);
                return (
                  <TableRow key={request.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>
                      {dayjs(request.startDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>
                      {dayjs(request.endDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell>{getGroupTypeName(request.groupType)}</TableCell>
                    <TableCell>{getStatusChip(displayStatus)}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Tooltip title="ดูวิว">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handlePreview(request)}
                          >
                            <Preview fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ดูข้อมูล">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleViewData(request)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ส่งเมล">
                          <IconButton
                            color="warning"
                            size="small"
                            disabled={displayStatus === "closed"}
                            onClick={() => handleSendEmail(request)}
                          >
                            <Send fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="ปิด">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleClose(request)}
                            disabled={displayStatus === "closed"}
                          >
                            <CloseIcon fontSize="small" />
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

      {/* Preview Dialog - แสดงคำตอบจริงๆ */}
      {previewRequest && (
        <BallotResponsePreviewDialog
          open={previewDialogOpen}
          onClose={() => {
            setPreviewDialogOpen(false);
            setPreviewRequest(null);
          }}
          request={previewRequest}
        />
      )}

      {/* Data View Dialog */}
      {selectedRequest && (
        <BallotDataViewDialog
          open={dataViewDialogOpen}
          onClose={() => {
            setDataViewDialogOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}

      {/* Close Confirmation Dialog */}
      <Dialog
        open={closeDialogOpen}
        onClose={() => {
          setCloseDialogOpen(false);
          setSelectedRequest(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "error.main", color: "white" }}>
          ยืนยันการปิด
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" gutterBottom>
            คุณต้องการปิดการเวียนขอข้อคิดเห็น:{" "}
            <strong>{selectedRequest?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            เมื่อปิดแล้วจะไม่สามารถรับความคิดเห็นได้อีก และสถานะจะเปลี่ยนเป็น
            "ปิด"
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setCloseDialogOpen(false);
              setSelectedRequest(null);
            }}
            sx={{ textTransform: "none" }}
          >
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmClose}
            startIcon={<CloseIcon />}
            sx={{ textTransform: "none" }}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

