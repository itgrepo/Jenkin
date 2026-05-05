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
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AppointmentOrderDialog from "../components/AppointmentOrderDialog";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import AssignmentIcon from "@mui/icons-material/Assignment";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import GroupIcon from "@mui/icons-material/Group";
import { Directive, DirectiveSearchParams } from "@models/expert";
import {
  deleteDirective,
  getDirectives,
  upsertDirective,
} from "@services/expertService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppDirectiveType } from "@store/globalSlice";
import { MasterData } from "@models/global";
import { useNavigate } from "react-router-dom";

export default function AppointmentManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [directiveTypeId, setDirectiveTypeId] = useState(0);
  const [orderNumber, setOrderNumber] = useState("");
  const [orders, setOrders] = useState<Directive[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "view" | "edit">("add");
  const [selectedOrder, setSelectedOrder] = useState<Directive | undefined>(
    undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { directiveTypeList } = useAppSelector((state) => state.global);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (!directiveTypeList) {
      dispatch(fetchAppDirectiveType());
    }
  }, [directiveTypeList]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: DirectiveSearchParams = {};
      if (directiveTypeId) params.directiveTypeId = directiveTypeId;
      if (orderNumber) params.orderNumber = orderNumber; // comma-separated for multi-search

      const res = await getDirectives(params);
      setOrders(res.data);
    } catch (err: any) {
      console.error("Error loading directives:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคำสั่งแต่งตั้งได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadOrders();
  };

  const handleAddOrder = () => {
    setDialogMode("add");
    setSelectedOrder(undefined);
    setDialogOpen(true);
  };

  const handleView = (item: Directive) => {
    setDialogMode("view");
    setSelectedOrder(item);
    setDialogOpen(true);
  };

  const handleEdit = (item: Directive) => {
    setDialogMode("edit");
    setSelectedOrder(item);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const confirmResult = await showConfirm(
      `ยืนยันการลบ`,
      `คุณต้องการลบคำสั่งนี้หรือไม่?`
    );

    if (!confirmResult.isConfirmed) return;

    try {
      setLoading(true);
      await deleteDirective(id);
      showSuccess("สำเร็จ", "ลบคำสั่งแต่งตั้งเรียบร้อยแล้ว");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err: any) {
      console.error("Error deleting directive:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบคำสั่งแต่งตั้งได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrder = async (formData: Directive) => {
    const isEdit = !!formData.id;

    const confirm = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการเพิ่ม",
      isEdit
        ? "คุณต้องการอัปเดตคำสั่งแต่งตั้งนี้หรือไม่?"
        : "คุณต้องการเพิ่มคำสั่งแต่งตั้งนี้หรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      await upsertDirective(formData);
      showSuccess(
        "สำเร็จ",
        isEdit
          ? "อัปเดตคำสั่งแต่งตั้งเรียบร้อยแล้ว"
          : "เพิ่มคำสั่งแต่งตั้งเรียบร้อยแล้ว"
      );

      setDialogOpen(false);
      setSelectedOrder(undefined);
      loadOrders();
    } catch (err: any) {
      console.error("Error saving directive:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกคำสั่งแต่งตั้งได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedOrder(undefined);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMembers = (item: Directive) => {
    navigate("/expert-management/committeegroup", {
      state: {
        committeeId: item.committeeId,
        directiveId: item.id,
      },
    });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <AssignmentIcon sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการคำสั่งแต่งตั้ง
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
          {/* Order Type Dropdown */}
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
              ประเภทคำสั่ง
            </Typography>
            <Autocomplete
              options={directiveTypeList || []}
              getOptionLabel={(option) => option.name}
              value={
                directiveTypeList?.find((t) => t.id === directiveTypeId) || null
              }
              onChange={(_, newValue) => setDirectiveTypeId(newValue?.id || 0)}
              isOptionEqualToValue={(option: MasterData, value: MasterData) =>
                option.name === value.name
              }
              size="small"
              title="ประเภทคำสั่ง"
              renderInput={(params: any) => (
                <TextField {...params} label="ประเภทคำสั่ง" fullWidth />
              )}
            />
          </Box>

          {/* Order Number Input */}
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
              เลขที่คำสั่ง
            </Typography>
            <TextField
              value={orderNumber}
              size="small"
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="กรอกเลขที่คำสั่ง (สามารถค้นหาหลายรายการได้)"
              fullWidth
           //   helperText="สามารถค้นหาหลายรายการได้ โดยคั่นด้วยเครื่องหมายจุลภาค (,) เช่น 001/2568,002/2568"
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

          {/* Add Order Button */}
          <Button
            variant="contained"
            color="warning"
            size="large"
            startIcon={<AddIcon />}
            onClick={handleAddOrder}
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
            เพิ่มคำสั่ง
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
                คำสั่งเลขที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ประเภทคำสั่ง
              </TableCell>
              <TableCell
                 sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ลงนามวันที่
              </TableCell>
              <TableCell
                 sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                edition/amd
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
            ) : orders?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลคำสั่งแต่งตั้ง
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders &&
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                  }}
                >
                   <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {order.orderNumber}
                  </TableCell>
                  <TableCell
                  >
                    <Chip
                      label={
                        directiveTypeList?.find(
                          (t) => t.id === order.directiveTypeId
                        )?.name || "-"
                      }
                      size="small"
                      variant="outlined"
                      color={
                        order.directiveTypeId === 1 ? "primary" : "warning"
                      }
                    />
                  </TableCell>
                  <TableCell
                  >
                    {formatDate(order.signingDate)}
                  </TableCell>
                  <TableCell
                  >
                    {`${order.edition || "-"} / ${order.amd || "-"}`}
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
                          onClick={() => handleView(order)}
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
                          onClick={() => handleEdit(order)}
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
                      <Tooltip title="จัดการเพิ่ม/เปลี่ยนแปลงผู้เชี่ยวชาญในกลุ่ม">
                        <IconButton
                          color="warning"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleMembers(order)}
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
                          onClick={() => handleDelete(order.id || 0)}
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
      {dialogMode && (
        <AppointmentOrderDialog
          open={dialogOpen}
          mode={dialogMode}
          order={selectedOrder}
          onClose={handleCloseDialog}
          onSave={handleSaveOrder}
        />
      )}
    </Container>
  );
}
