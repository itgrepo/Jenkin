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
  Autocomplete,
  IconButton,
  Tooltip,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import MeetingBudgetDialog from "../components/MeetingBudgetDialog";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { MeetingBudget, MeetingBudgetSearchParams } from "@models/meeting";
import {
  getMeetingBudgets,
  upsertMeetingBudget,
  deleteMeetingBudget,
} from "@services/meetingService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppYearSelect, setGlobalLoading, fetchAppDepartments, fetchAppSubDepartments } from "@store/globalSlice";
import { MasterData } from "@models/global";

export default function MeetingBudgetPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [fiscalYear, setFiscalYear] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [subDepartmentId, setSubDepartmentId] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<MeetingBudget[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "view" | "edit">("add");
  const [selectedBudget, setSelectedBudget] = useState<MeetingBudget | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { yearSelectList, departmentList,subDepartmentList } =
    useAppSelector((state) => state.global);

  useEffect(() => {
    loadBudgets();
  }, []);

  useEffect(() => {
    if (!yearSelectList) {
      dispatch(fetchAppYearSelect());
    }
    if (!departmentList) {
      dispatch(fetchAppDepartments());
    }
    if(!subDepartmentList){
      dispatch(fetchAppSubDepartments());
    }
  }, [dispatch, yearSelectList, departmentList,subDepartmentList]);

  // useEffect(() => {
  //   if (departmentCode) {
  //     dispatch(fetchAppSubDepartmentsByDPisId(departmentCode.toString()));
  //   }
  // }, [departmentCode]);

  type BudgetQueryOverrides = {
    fiscalYear?: string | null;
    departmentId?: number | null;
    subDepartmentId?: number | null;
  };

  const loadBudgets = async (overrides?: BudgetQueryOverrides) => {
    try {
      setLoading(true);
      setError(null);
      const params: MeetingBudgetSearchParams = {};
      const nextFiscalYear =
        overrides && overrides.fiscalYear !== undefined
          ? overrides.fiscalYear
          : fiscalYear;
      const nextDepartmentId =
        overrides && overrides.departmentId !== undefined
          ? overrides.departmentId
          : departmentId;
      const nextSubDepartmentId =
        overrides && overrides.subDepartmentId !== undefined
          ? overrides.subDepartmentId
          : subDepartmentId;

      if (nextFiscalYear) params.fiscalYear = nextFiscalYear;
      if (nextDepartmentId) params.departmentId = nextDepartmentId;
      if (nextSubDepartmentId) params.subDepartmentId = nextSubDepartmentId;

      const res = await getMeetingBudgets(params);
      setBudgets(res.data || []);
    } catch (err: any) {
      console.error("Error loading meeting budgets:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลงบประมาณการประชุมได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadBudgets();
  };

  const handleAddBudget = () => {
    setDialogMode("add");
    setSelectedBudget(undefined);
    setDialogOpen(true);
  };

  const handleView = (budget: MeetingBudget) => {
    setDialogMode("view");
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleEdit = (budget: MeetingBudget) => {
    setDialogMode("edit");
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmResult = await showConfirm(
      "ยืนยันการลบ",
      "คุณต้องการลบงบประมาณการประชุมนี้หรือไม่?"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await deleteMeetingBudget(id);
      showSuccess("สำเร็จ", "ลบงบประมาณการประชุมเรียบร้อยแล้ว");
      loadBudgets();
    } catch (err: any) {
      console.error("Error deleting meeting budget:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบงบประมาณการประชุมได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSaveBudget = async (formData: MeetingBudget) => {
    const isEdit = !!formData.id;

    const confirmResult = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการเพิ่ม",
      isEdit
        ? "คุณต้องการอัปเดตงบประมาณการประชุมนี้หรือไม่?"
        : "คุณต้องการเพิ่มงบประมาณการประชุมนี้หรือไม่?"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      await upsertMeetingBudget(formData);
      showSuccess(
        "สำเร็จ",
        isEdit
          ? "อัปเดตงบประมาณการประชุมเรียบร้อยแล้ว"
          : "เพิ่มงบประมาณการประชุมเรียบร้อยแล้ว"
      );
      setDialogOpen(false);
      setSelectedBudget(undefined);
      loadBudgets();
    } catch (err: any) {
      console.error("Error saving meeting budget:", err);
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
    setSelectedBudget(undefined);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <MonetizationOnIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการงบประมาณการประชุม
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
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
            alignItems: isMobile ? "stretch" : "flex-start",
            flexWrap: "wrap",
          }}
        >
          {/* Fiscal Year */}
          <Autocomplete
            options={yearSelectList || []}
            getOptionLabel={(option) => option.name}
            value={
              yearSelectList?.find((y) => y.name === fiscalYear) || null
            }
            onChange={(_, newValue) => {
              const nextFiscalYear = newValue?.name || null;
              setFiscalYear(nextFiscalYear);
              loadBudgets({
                fiscalYear: nextFiscalYear,
              });
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.name === value.name
            }
            sx={{ minWidth: isMobile ? "100%" : 200 }}
            size="small"
            renderInput={(params: any) => (
              <TextField {...params} label="ปีงบประมาณ" fullWidth />
            )}
          />

          {/* Department */}
          <Autocomplete
            options={departmentList || []}
            getOptionLabel={(option) => option.name}
            value={
              departmentList?.find((d) => d.id === departmentId) || null
            }
            onChange={(_, newValue) => {
              const nextDepartmentId = newValue?.id || null;
              setDepartmentId(nextDepartmentId);
              // setDepartmentCode(newValue?.code || "");
              // เปลี่ยนกองแล้ว ให้ reset กลุ่ม เพื่อไม่ให้ query ใช้ค่าค้าง
              setSubDepartmentId(null);

              loadBudgets({
                fiscalYear: fiscalYear ?? null,
                departmentId: nextDepartmentId,
                subDepartmentId: null,
              });
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.id === value.id
            }
            sx={{ minWidth: isMobile ? "100%" : 250 }}
            size="small"
            renderInput={(params: any) => (
              <TextField {...params} label="กอง" fullWidth />
            )}
          />

          {/* Sub Department */}
          <Autocomplete
            options={subDepartmentList || []}
            getOptionLabel={(option) => option.name}
            getOptionKey={(option: MasterData) =>
              String(option.id ?? option.name)
            }
            value={
              subDepartmentList?.find((sd) => sd.id === subDepartmentId) || null
            }
            onChange={(_, newValue) => {
              const nextSubDepartmentId = newValue?.id || null;
              setSubDepartmentId(nextSubDepartmentId);
              loadBudgets({
                fiscalYear: fiscalYear ?? null,
                departmentId: departmentId ?? null,
                subDepartmentId: nextSubDepartmentId,
              });
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.id === value.id
            }
            sx={{ minWidth: isMobile ? "100%" : 200 }}
            size="small"
            renderInput={(params: any) => (
              <TextField {...params} label="กลุ่ม" fullWidth />
            )}
          />

          {/* Search Button */}
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            sx={{
              minWidth: isMobile ? "100%" : 120,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            ค้นหา
          </Button>

          {/* Add Budget Button */}
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddBudget}
            sx={{
              minWidth: isMobile ? "100%" : 140,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: 2,
            }}
          >
            เพิ่มงบประมาณ
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
                ลำดับ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ปีงบประมาณ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                กอง
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                กลุ่ม
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="right"
              >
                จำนวนเงิน
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
            ) : budgets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลงบประมาณการประชุม
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              budgets.map((budget, index) => (
                <TableRow
                  key={budget.id}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell>{budget.fiscalYear}</TableCell>
                  <TableCell>
                    {budget.departmentName ||
                      departmentList?.find(
                        (d) => d.id === budget.departmentId
                      )?.name ||
                      "-"}
                  </TableCell>
                  <TableCell>
                    {budget.subDepartmentName ||
                      subDepartmentList?.find(
                        (sd) => sd.id === budget.subDepartmentId
                      )?.name ||
                      "-"}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(budget.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5,
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Tooltip title="ดู">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleView(budget)}
                          sx={{
                            "&:hover": {
                              bgcolor: "primary.light",
                              color: "white",
                            },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="แก้ไข">
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => handleEdit(budget)}
                          sx={{
                            "&:hover": {
                              bgcolor: "success.light",
                              color: "white",
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(budget.id || 0)}
                          sx={{
                            "&:hover": {
                              bgcolor: "error.light",
                              color: "white",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
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
        <MeetingBudgetDialog
          open={dialogOpen}
          mode={dialogMode}
          budget={selectedBudget}
          onClose={handleCloseDialog}
          onSave={handleSaveBudget}
        />
      )}
    </Container>
  );
}

