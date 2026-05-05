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
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Autocomplete,
} from "@mui/material";
import {
  Visibility,
  Edit,
  Preview,
  Delete,
  Search,
  Add,
  Send,
  PendingActions,
} from "@mui/icons-material";
import {
  BallotRequest,
  BallotRequestStatus,
} from "@models/ballot";
import {
  getBallotRequests,
  deleteBallotRequest,
  sendBallotRequestForApproval,
} from "@services/ballotService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import BallotRequestDialog from "../components/BallotRequestDialog";
import BallotDraftPreviewDialog from "../components/BallotDraftPreviewDialog";
import { fetchAppBallotRequestStatus, setGlobalLoading } from "@store/globalSlice";



export default function BallotDraftNotApprovedPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const currentUser = useAppSelector((state) => state.auth.user);

  const [statusFilter, setStatusFilter] = useState<BallotRequestStatus | "all">("all");
  const [searchText, setSearchText] = useState("");
  const [requests, setRequests] = useState<BallotRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BallotRequest | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");

  const {ballotRequestStatusList} = useAppSelector((state) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!ballotRequestStatusList) {
      dispatch(fetchAppBallotRequestStatus());
    }
  }, [ballotRequestStatusList]);

  const loadRequests = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);
      const params: any = {
        createdBy: currentUser?.id, // แสดงเฉพาะของ user ที่ login
        search: searchText.trim() || undefined,
      };
      
      // Filter by status
      if (statusFilter !== "all") {
        params.status = statusFilter;
      } else {
        // ถ้าเลือก "ทั้งหมด" ให้แสดงเฉพาะที่ยังไม่อนุมัติ
        params.status = [
          "pending_approval",
          "waiting_manager_review",
          "waiting_director_review",
          "pending_review",
        ];
      }

      const res = await getBallotRequests(params);
      setRequests(res.data || []);
    } catch (err: any) {
      console.error("Error loading ballot requests:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลข้อคิดเห็นได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadRequests();
  };

  const handleCreate = () => {
    setSelectedRequest(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleView = (request: BallotRequest) => {
    setSelectedRequest(request);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEdit = (request: BallotRequest) => {
    setSelectedRequest(request);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handlePreview = (request: BallotRequest) => {
    setSelectedRequest(request);
    setPreviewDialogOpen(true);
  };

  const handleSend = async (request: BallotRequest) => {
    if (!request.id) return;

    const confirmResult = await showConfirm(
      "ยืนยันการส่งอนุมัติ",
      "คุณต้องการส่งข้อคิดเห็นเพื่ออนุมัติหรือไม่?",
      "ส่ง",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await sendBallotRequestForApproval(request.id,"waiting_manager_review" as BallotRequestStatus);
      showSuccess("สำเร็จ", "ส่งข้อคิดเห็นเพื่ออนุมัติเรียบร้อยแล้ว");
      loadRequests();
    } catch (err: any) {
      console.error("Error sending ballot request:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถส่งข้อคิดเห็นได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (request: BallotRequest) => {
    if (!request.id) return;

    const confirmResult = await showConfirm(
      "ยืนยันการลบ",
      `คุณต้องการลบข้อคิดเห็น "${request.name}" หรือไม่?`,
      "ลบ",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await deleteBallotRequest(request.id);
      showSuccess("สำเร็จ", "ลบข้อคิดเห็นเรียบร้อยแล้ว");
      loadRequests();
    } catch (err: any) {
      console.error("Error deleting ballot request:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบข้อคิดเห็นได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: BallotRequestStatus) => {
    const statusMap: Record<
      BallotRequestStatus,
      {
        label: string;
        color: "default" | "primary" | "warning" | "error" | "success" | "info";
      }
    > = {
      pending_approval: { label: "รอส่งอนุมัติ", color: "warning" },
      waiting_manager_review: { label: "รอ ผก. พิจารณา", color: "info" },
      waiting_director_review: { label: "รอ ผอ. พิจารณา", color: "primary" },
      manager_approved: { label: "ผก. อนุมัติ", color: "success" },
      manager_disapproved: { label: "ผก. ไม่อนุมัติ", color: "error" },
      director_approved: { label: "ผอ. อนุมัติ", color: "success" },
      director_disapproved: { label: "ผอ. ไม่อนุมัติ", color: "error" },
      pending_review: { label: "รอแก้ไข", color: "warning" },
      closed: { label: "ปิดแล้ว", color: "default" },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      color: "default" as const,
    };
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const canEdit = (request: BallotRequest) => {
    return (
      request.status === "pending_approval" ||
      request.status === "pending_review"
    );
  };

  const canSend = (request: BallotRequest) => {
    return (
      request.status === "pending_approval" ||
      request.status === "pending_review"
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <PendingActions sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการเวียนข้อคิดเห็นที่ยังไม่อนุมัติ
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
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, md: 3 }}>
            <Autocomplete
              options={[
                { id: 0, code: "all", name: "ทั้งหมด" },
                ...(ballotRequestStatusList || []),
              ]}
              getOptionLabel={(option) => option.name || ""}
              value={
                ballotRequestStatusList?.find(
                  (option) => option.code === statusFilter
                ) ||
                { id: 0, code: "all", name: "ทั้งหมด" }
              }
              onChange={(_, newValue) => {
                setStatusFilter(
                  (newValue?.code as BallotRequestStatus | "all") || "all"
                );
              }}
              size="small"
              renderInput={(params) => (
                <TextField {...params} label="สถานะ" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              ชื่อข้อคิดเห็น
            </Typography>
            <TextField
              size="small"
              placeholder="ค้นหาชื่อข้อคิดเห็น"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              fullWidth
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
              }}
            >
              ค้นหา
            </Button>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<Add />}
              onClick={handleCreate}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                minWidth: 180,
              }}
            >
              เพิ่มข้อคิดเห็น
            </Button>
          </Grid>
        </Grid>
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
                ลำดับที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อข้อคิดเห็น
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                สถานะ
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
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลข้อคิดเห็น
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request, index) => (
                <TableRow
                  key={request.id || index}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>{getStatusChip(request.status)}</TableCell>
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
                          onClick={() => handleView(request)}
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
                      <Tooltip title="แก้ไข">
                        <span>
                          <IconButton
                            color="success"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleEdit(request)}
                            disabled={!canEdit(request)}
                            sx={{
                              "&:hover": {
                                bgcolor: "success.light",
                                color: "white",
                              },
                              "&:disabled": {
                                opacity: 0.5,
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Edit fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="ดูวิว">
                        <IconButton
                          color="warning"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handlePreview(request)}
                          sx={{
                            "&:hover": {
                              bgcolor: "warning.light",
                              color: "white",
                            },
                            padding: isMobile ? 0.5 : 1,
                          }}
                        >
                          <Preview fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ส่ง">
                        <span>
                          <IconButton
                            color="info"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleSend(request)}
                            disabled={!canSend(request)}
                            sx={{
                              "&:hover": {
                                bgcolor: "info.light",
                                color: "white",
                              },
                              "&:disabled": {
                                opacity: 0.5,
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Send fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleDelete(request)}
                          sx={{
                            "&:hover": {
                              bgcolor: "error.light",
                              color: "white",
                            },
                            padding: isMobile ? 0.5 : 1,
                          }}
                          disabled={!canEdit(request)}
                        >
                          
                          <Delete fontSize={isMobile ? "small" : "medium"} />
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

      {/* Create/Edit/View Dialog */}
      {dialogOpen &&
        <BallotRequestDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedRequest(null);
          }}
          onSave={loadRequests}
          request={selectedRequest}
          mode={dialogMode}
        />
}

      {/* Preview Dialog */}
      {previewDialogOpen && (
        <BallotDraftPreviewDialog
          open={previewDialogOpen}
          onClose={() => {
            setPreviewDialogOpen(false);
            setSelectedRequest(null);
          }}
          draft={selectedRequest as any}
        />
      )}
    </Container>
  );
}

