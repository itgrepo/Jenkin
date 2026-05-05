import { useState, useEffect } from "react";
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
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { showConfirm, showSuccess, showError } from "@components/Swal";
import CommitteeDialog from "../components/CommitteeDialog";

import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppCommitteeType, setGlobalLoading } from "@store/globalSlice";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import { Committee, CommitteeSearchParams } from "@models/expert";
import { MasterData } from "@models/global";
import {
  deleteExpertCommittee,
  getExpertCommittees,
  upsertExpertCommittee,
} from "@services/expertService";

export default function CommitteeManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [committeeType, setCommitteeType] = useState<number | null>(null);
  const [committeeName, setCommitteeName] = useState("");
  const [committees, setCommittees] = useState<Committee[]>([]);
  const { committeeTypeList } = useAppSelector((state) => state.global);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "view" | "edit">("add");
  const [selectedCommittee, setSelectedCommittee] = useState<
    Committee | undefined
  >(undefined);

  // Load initial data
  useEffect(() => {
    loadCommittees();
  }, []);

  useEffect(() => {
    if (!committeeTypeList) {
      dispatch(fetchAppCommitteeType());
    }
  }, [dispatch, committeeTypeList]);

  const loadCommittees = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: CommitteeSearchParams = {};
      if (committeeType) params.committeeType = committeeType;
      if (committeeName) params.committeeName = committeeName;

      const response = await getExpertCommittees(params);
      setCommittees(response.data);
    } catch (err: any) {
      console.error("Error loading committees:", err);
      setError(err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลได้");
      // showError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลคณะผู้เชี่ยวชาญได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCommittees();
  };

  const handleAddCommittee = () => {
    setDialogMode("add");
    setSelectedCommittee(undefined);
    setDialogOpen(true);
  };

  const handleView = async (dataItem: Committee) => {
    setSelectedCommittee(dataItem);
    setDialogOpen(true);
    setDialogMode("view");
  };

  const handleEdit = async (dataItem: Committee) => {
    setSelectedCommittee(dataItem);
    setDialogOpen(true);
    setDialogMode("edit");
  };


  const handleMembers = (item: Committee) => {
    navigate("/expert-management/committeegroup", {
      state: {
        committeeId: item.id,
        directiveId: 0,
      },
    });
  };

  const handleDelete = async (id: number) => {
    const confirmResult = await showConfirm(
      `ยืนยันการลบ`,
      `คุณต้องการลบคณะนี้หรือไม่?`
    );

    if (confirmResult.isConfirmed) {
      try {
        dispatch(setGlobalLoading(true));
        await deleteExpertCommittee(id);
       // loadCommittees();
       const list=committees.filter((a)=>a.id!==id);
       showSuccess("สำเร็จ", "ลบคณะผู้เชี่ยวชาญเรียบร้อยแล้ว");
       setCommittees(list);
      } catch (err: any) {
        console.error("Error deleting committee:", err);
        showError(
          "เกิดข้อผิดพลาด",
          err?.response?.data?.message || "ไม่สามารถลบคณะผู้เชี่ยวชาญได้"
        );
      } finally {
        dispatch(setGlobalLoading(false));
      }
    }
  };

  const handleSaveCommittee = async (formData: Committee) => {
    const isEdit = !!formData?.id;

    const isConfirmed = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการเพิ่ม",
      isEdit
        ? "คุณต้องการอัปเดตคณะผู้เชี่ยวชาญนี้หรือไม่?"
        : "คุณต้องการเพิ่มคณะผู้เชี่ยวชาญนี้หรือไม่?"
    );
    if (!isConfirmed.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      await upsertExpertCommittee(formData);
      showSuccess(
        "สำเร็จ",
        isEdit
          ? "อัปเดตคณะผู้เชี่ยวชาญเรียบร้อยแล้ว"
          : "เพิ่มคณะผู้เชี่ยวชาญเรียบร้อยแล้ว"
      );

      setDialogOpen(false);
      setSelectedCommittee(undefined);
      loadCommittees();
    } catch (err: any) {
      console.error("Error saving committee:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.error || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCommittee(undefined);
  };

  const getStatusChip = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: "success" | "warning" | "default" }
    > = {
      active: { label: "ใช้งาน", color: "success" },
      suspended: { label: "ระงับ", color: "warning" },
      inactive: { label: "ไม่ใช้งาน", color: "default" },
    };
    const statusInfo = statusMap[status] || statusMap.inactive;
    return (
      <Chip
        label={statusInfo.label}
        color={statusInfo.color}
        size="small"
        variant="outlined"
      />
    );
  };
  


  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <GroupIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการคณะผู้เชี่ยวชาญ
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
              ประเภทคณะ
            </Typography>
            <Autocomplete
              options={committeeTypeList || []}
              getOptionLabel={(option) => option.name}
              value={
                committeeTypeList?.find((a) => a.id === committeeType) || null
              }
              onChange={(_, newValue) => setCommitteeType(newValue?.id || null)}
              isOptionEqualToValue={(option: MasterData, value: MasterData) =>
                option.id === value.id
              }
              size="small"
              title="ประเภทคณะ"
              renderInput={(params: any) => (
                <TextField {...params} label="ประเภทคณะ" fullWidth />
              )}
            />
          </Box>

          {/* Committee Name Input */}
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
              ชื่อคณะ
            </Typography>
            <TextField
              value={committeeName}
              size="small"
              onChange={(e) => setCommitteeName(e.target.value)}
              placeholder="กรอกชื่อคณะ (สามารถค้นหาหลายรายการได้)"
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

          {/* Add Committee Button */}
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddCommittee}
            sx={{
              minWidth: isMobile ? "100%" : 140,
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
            เพิ่มคณะ
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
                คณะเลขที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                คณะที่อยู่ภายใต้
              </TableCell>
              <TableCell
               sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ประเภท
              </TableCell>
              <TableCell
               sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อคณะ
              </TableCell>
              <TableCell
                 sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                กลุ่มผลิตภัณฑ์
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
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : committees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลคณะผู้เชี่ยวชาญ
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              committees &&
              committees.map((committee) => (
                <TableRow
                  key={committee.id}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {/* {committee?.committeeType===2?committee.subCommitteeOf:committee.committeeNumber} */}
                    {committee?.committeeNumber}
                  </TableCell>
                  <TableCell>
                  {/* {committee?.committeeType===1?committee.subCommitteeNumber||"":""} */}
                  {committee?.subCommitteeOf||""}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        committeeTypeList?.find(
                          (a) => a.id === Number(committee.committeeType)
                        )?.name || "-"
                      }
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </TableCell>
                  <TableCell
                    title={committee.committeeNameTh}
                  >
                    <Typography
                      variant="body2"
                      noWrap
                      title={committee.committeeNameTh}
                    >
                      {committee.committeeNameTh}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {committee.productGroup || "-"}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(committee.status)}
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
                          onClick={() => handleView(committee)}
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
                          onClick={() => handleEdit(committee)}
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
                      <Tooltip title="สมาชิก">
                        <IconButton
                          color="warning"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleMembers(committee)}
                          sx={{
                            "&:hover": {
                              bgcolor: "warning.light",
                              color: "white",
                            },
                            padding: isMobile ? 0.5 : 1,
                          }}
                        >
                          <GroupIcon fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleDelete(committee.id)}
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
        <CommitteeDialog
          open={dialogOpen}
          mode={dialogMode}
          committee={selectedCommittee}
          onClose={handleCloseDialog}
          onSave={handleSaveCommittee}
        />
      )}
    </Container>
  );
}
