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
} from "@mui/material";
import {
  Visibility,
  Edit,
  Preview,
  Delete,
  Search,
  Add,
  Description,
} from "@mui/icons-material";
import { BallotDraft } from "@models/ballot";
import {
  getBallotDrafts,
  deleteBallotDraft,
} from "@services/ballotService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import BallotDraftDialog from "../components/BallotDraftDialog";
import BallotDraftPreviewDialog from "../components/BallotDraftPreviewDialog";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppBallotAnswerType } from "@store/globalSlice";

export default function BallotDraftPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { ballotAnswerTypeList } = useAppSelector((state) => state.global);
  const [searchText, setSearchText] = useState("");
  const [drafts, setDrafts] = useState<BallotDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<BallotDraft | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");

  const dispatch = useAppDispatch();

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: searchText.trim() || undefined,
      };
      const res = await getBallotDrafts(params);
      setDrafts(res.data || []);
    } catch (err: any) {
      console.error("Error loading ballot drafts:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลแบบร่างได้"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ballotAnswerTypeList) {
      dispatch(fetchAppBallotAnswerType());
    }
  }, [ballotAnswerTypeList]);

  const handleSearch = () => {
    loadDrafts();
  };

  const handleCreate = () => {
    setSelectedDraft(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleView = (draft: BallotDraft) => {
    setSelectedDraft(draft);
    setDialogMode("view");
    setDialogOpen(true);
  };

  const handleEdit = (draft: BallotDraft) => {
    setSelectedDraft(draft);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handlePreview = (draft: BallotDraft) => {
    setSelectedDraft(draft);
    setPreviewDialogOpen(true);
  };

  const handleDelete = async (draft: BallotDraft) => {
    if (!draft.id) return;

    const confirmResult = await showConfirm(
      "ยืนยันการลบ",
      `คุณต้องการลบแบบร่าง "${draft.name}" หรือไม่?`,
      "ลบ",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      await deleteBallotDraft(draft.id);
      showSuccess("สำเร็จ", "ลบแบบร่างเรียบร้อยแล้ว");
      loadDrafts();
    } catch (err: any) {
      console.error("Error deleting ballot draft:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบแบบร่างได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedDraft(null);
  };

  const handlePreviewDialogClose = () => {
    setPreviewDialogOpen(false);
    setSelectedDraft(null);
  };

  const handleSave = () => {
    loadDrafts();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Description sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการแบบร่างการเวียนขอข้อคิดเห็น
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
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              ชื่อแบบร่าง
            </Typography>
            <TextField
              size="small"
              placeholder="ค้นหาชื่อแบบร่าง"
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
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
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
                minWidth: 150,
              }}
            >
              เพิ่มแบบร่าง
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
                ชื่อแบบร่าง
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                เรื่อง
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                รูปแบบคำตอบ
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
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลแบบร่าง
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              drafts.map((draft, index) => (
                <TableRow
                  key={draft.id || index}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell >{draft.name}</TableCell>
                  <TableCell >{draft.questionText}</TableCell>
                  <TableCell >{ballotAnswerTypeList?.find((type: any) => type.id === draft.answerType)?.name}</TableCell>
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
                          onClick={() => handleView(draft)}
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
                        <IconButton
                          color="success"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleEdit(draft)}
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
                      <Tooltip title="ดูวิว">
                        <IconButton
                          color="warning"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handlePreview(draft)}
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
                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleDelete(draft)}
                          sx={{
                            "&:hover": {
                              bgcolor: "error.light",
                              color: "white",
                            },
                            padding: isMobile ? 0.5 : 1,
                          }}
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
      {selectedDraft !== null || dialogMode === "create" ? (
        <BallotDraftDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSave={handleSave}
          draft={selectedDraft}
          mode={dialogMode}
        />
      ) : null}

      {/* Preview Dialog */}
      {selectedDraft && (
        <BallotDraftPreviewDialog
          open={previewDialogOpen}
          onClose={handlePreviewDialogClose}
          draft={selectedDraft}
        />
      )}
    </Container>
  );
}

