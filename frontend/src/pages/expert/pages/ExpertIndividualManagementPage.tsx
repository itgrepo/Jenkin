import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
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
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
// import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

import { showConfirm, showError, showSuccess } from "@components/Swal";
import ExpertDialog from "../components/ExpertDialog";
import { Expert } from "@models/expert";
import {
  getExperts,
  upsertExpert,
  deleteExpert,
} from "@services/expertService";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";

export default function ExpertIndividualManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [expertName, setExpertName] = useState("");
  const [experts, setExperts] = useState<Expert[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "view" | "edit">("add");
  const [selectedExpert, setSelectedExpert] = useState<Expert | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExperts({
        name: expertName || undefined,
      });
      setExperts(data?.data || []);
    } catch (err: any) {
      console.error("Error loading experts:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลผู้เชี่ยวชาญได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadExperts();
  };

  // const handleAddExpert = () => {
  //   setDialogMode("add");
  //   setSelectedExpert(undefined);
  //   setDialogOpen(true);
  // };

  const handleView = (id: number) => {
    const expert = experts.find((e) => e.id === id);
    if (expert) {
      setDialogMode("view");
      setSelectedExpert(expert);
      setDialogOpen(true);
    }
  };

  const handleEdit = (id: number) => {
    const expert = experts.find((e) => e.id === id);
    if (expert) {
      setDialogMode("edit");
      setSelectedExpert(expert);
      setDialogOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmResult = await showConfirm(
      "ยืนยันการลบ",
      "คุณต้องการลบผู้เชี่ยวชาญนี้หรือไม่?"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await deleteExpert(id);
      showSuccess("สำเร็จ", "ลบผู้เชี่ยวชาญเรียบร้อยแล้ว");
      loadExperts();
    } catch (err: any) {
      console.error("Error deleting expert:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบผู้เชี่ยวชาญได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSaveExpert = async (formData: Expert) => {
    console.log("formData:", formData);
    const isEdit = !!formData?.id;

    const confirmResult = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการเพิ่ม",
      isEdit
        ? "คุณต้องการอัปเดตข้อมูลผู้เชี่ยวชาญนี้หรือไม่?"
        : "คุณต้องการเพิ่มผู้เชี่ยวชาญนี้หรือไม่?"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await upsertExpert(formData);
      showSuccess(
        "สำเร็จ",
        isEdit
          ? "อัปเดตข้อมูลผู้เชี่ยวชาญเรียบร้อยแล้ว"
          : "เพิ่มผู้เชี่ยวชาญเรียบร้อยแล้ว"
      );
      setDialogOpen(false);
      setSelectedExpert(undefined);
      loadExperts();
    } catch (err: any) {
      console.error("Error saving expert:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedExpert(undefined);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <PersonIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการผู้เชี่ยวชาญ
        </Typography>
      </Box>

      {/* Search/Filter Section */}
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
          {/* Expert Name Input */}
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
              ชื่อผู้เชี่ยวชาญ
            </Typography>
            <TextField
              value={expertName}
              size="small"
              onChange={(e) => setExpertName(e.target.value)}
              placeholder="กรอกชื่อผู้เชี่ยวชาญ (สามารถค้นหาหลายรายการได้)"
              fullWidth
              //helperText="สามารถค้นหาหลายรายการได้ โดยคั่นด้วยเครื่องหมายจุลภาค (,) เช่น ชื่อ1,ชื่อ2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
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

          {/* Add Expert Button */}
          {/* <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddExpert}
            sx={{
              minWidth: 160,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            เพิ่มผู้เชี่ยวชาญ
          </Button> */}
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
                เลขบัตรประชาชน
              </TableCell>
              <TableCell
             sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อ-นามสกุล
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                เบอร์โทรศัพท์
              </TableCell>
              <TableCell
               sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                อีเมล
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
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : experts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลผู้เชี่ยวชาญ
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              experts.map((expert) => (
                <TableRow
                  key={expert.id}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                           <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {expert.idCard}
                  </TableCell>
                  <TableCell
                    title={`${expert.firstName || ""} ${expert.lastName || ""}`}
                  >
                    {`${expert.firstName || ""} ${expert.lastName || ""}`}
                  </TableCell>
                  <TableCell>
                    {expert.mobile || expert.phone || "-"}
                  </TableCell>
                  <TableCell
                    title={expert.email || "-"}
                  >
                    {expert.email || "-"}
                  </TableCell>
                  <TableCell
                    align="center"
                  >
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
                          onClick={() => handleView(expert.id || 0)}
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
                        <IconButton
                          color="success"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleEdit(expert.id || 0)}
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
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleDelete(expert.id || 0)}
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

      {/* Dialog for Add/View/Edit */}
      {dialogOpen && (
        <ExpertDialog
          open={dialogOpen}
          mode={dialogMode}
          expert={selectedExpert}
          onClose={handleCloseDialog}
          onSave={handleSaveExpert}
        />
      )}
    </Container>
  );
}
