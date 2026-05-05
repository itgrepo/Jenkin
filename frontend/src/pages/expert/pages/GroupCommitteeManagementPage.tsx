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
  Checkbox,
  IconButton,
  Stack,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import CommitteeExpertDialog from "../components/CommitteeExpertDialog";
import ExpertSelectionDialog from "../components/ExpertSelectionDialog";
import {
  fetchAppCommitteeType,
  setGlobalLoading,
} from "@store/globalSlice";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {
  getExpertCommitteeById,
  getExpertGroupMembers,
  upsertExpertGroupMember,
  deleteExpertGroupMember,
  getDirectiveById,
} from "@services/expertService";
import { Committee, Directive, ExpertGroupMember } from "@models/expert";
import GroupIcon from "@mui/icons-material/Group";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function GroupCommitteeManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();
  const state = location.state as {
    committeeId?: number;
    directiveId?: number; // ถ้ามาจากหน้า 7 (AppointmentManagementPage)
  } | null;

  const dispatch = useAppDispatch();

  // Experts list
  const [members, setMembers] = useState<ExpertGroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [directive, setDirective] = useState<Directive|null>(null);
  const [committee, setCommittee] = useState<Committee|null>(null);

  const { committeeTypeList } = useAppSelector((state) => state.global);


  // Dialog state for edit/view existing expert
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "view" | "edit">("add");
  const [selectedMember, setSelectedMember] = useState<
    ExpertGroupMember | undefined
  >(undefined);

  // Dialog state for selecting experts to add
  const [selectionDialogOpen, setSelectionDialogOpen] = useState(false);

  useEffect(() => {
    if (!committeeTypeList) {
      dispatch(fetchAppCommitteeType());
    }
  }, [dispatch, committeeTypeList]);

  // Load experts when committee changes AND committeeTypeList is ready
  useEffect(() => {
    if (state && committeeTypeList && committeeTypeList.length > 0) {
      loadCommittee();
      loadDirective();
      loadMembers();
    } else if (!state) {
      setMembers([]);
    }
  }, [state, committeeTypeList]);

  const loadCommittee = async () => {
    if (!state?.committeeId || !committeeTypeList || committeeTypeList.length === 0) {
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      const res = await getExpertCommitteeById(state.committeeId);
      setCommittee(res);
    } catch (err: any) {
      console.error("Error loading committee:", err);
      setError(err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคณะได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const loadDirective = async () => {
    if (!state?.directiveId) {
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      const res = await getDirectiveById(state.directiveId);
      setDirective(res);
    } catch (err: any) {
      console.error("Error loading directive:", err);
      setError(err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคำสั่งแต่งตั้งได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };


  const loadMembers = async () => {
    if (!state?.committeeId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await getExpertGroupMembers({ committeeId: state.committeeId });
      setMembers(res.data);
    } catch (err: any) {
      console.error("Error loading members:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลสมาชิกได้"
      );
    } finally {
      setLoading(false);
    }
  };


  const handleAddExpert = () => {
    setDialogMode("add");
    setSelectedMember(undefined);
    setDialogOpen(true);
  };

  const handleView = (member: ExpertGroupMember) => {
    setDialogMode("view");
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleEdit = (member: ExpertGroupMember) => {
    setDialogMode("edit");
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    const result = await showConfirm(
      "ยืนยันการลบ",
      "คุณต้องการลบผู้เชี่ยวชาญนี้หรือไม่?"
    );
    if (!result.isConfirmed) return;

    try {
      setLoading(true);
      await deleteExpertGroupMember(id);
      showSuccess("สำเร็จ", "ลบผู้เชี่ยวชาญเรียบร้อยแล้ว");
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error("Error deleting member:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบผู้เชี่ยวชาญได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMember = async (formData: ExpertGroupMember) => {
    if (!state?.committeeId) return;

    const isEdit = !!selectedMember?.id;


    try {
      setLoading(true);
      await upsertExpertGroupMember(formData);
      showSuccess(
        "สำเร็จ",
        isEdit
          ? "อัปเดตผู้เชี่ยวชาญเรียบร้อยแล้ว"
          : "เพิ่มผู้เชี่ยวชาญเรียบร้อยแล้ว"
      );

      setDialogOpen(false);
      setSelectedMember(undefined);
      loadMembers();
    } catch (err: any) {
      console.error("Error saving member:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกผู้เชี่ยวชาญได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedMember(undefined);
  };

  const handleToggleStatus = async (member: ExpertGroupMember) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    const confirm = await showConfirm(
      newStatus === "active" ? "ยืนยันการเปิดใช้งาน" : "ยืนยันการปิดใช้งาน",
      `คุณต้องการ${newStatus === "active" ? "เปิดใช้งาน" : "ปิดใช้งาน"}ผู้เชี่ยวชาญนี้หรือไม่?`
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      const updatedMember: ExpertGroupMember = {
        ...member,
        status: newStatus,
      };
      await upsertExpertGroupMember(updatedMember);
      showSuccess("สำเร็จ", `อัปเดตสถานะเรียบร้อยแล้ว`);
      loadMembers();
    } catch (err: any) {
      console.error("Error updating status:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถอัปเดตสถานะได้"
      );
    } finally {
      setLoading(false);
    }
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
          จัดกลุ่มผู้เชี่ยวชาญ
        </Typography>
      </Box>

      {/* Committee Info Section */}
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
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* First Row */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
              alignItems: isMobile ? "stretch" : "center",
              flexWrap: "wrap",
            }}
          >
            {/* Committee Number - readonly */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: isMobile ? "100%" : 150,
                flex: isMobile ? "1 1 100%" : "0 0 auto",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                คณะเลขที่
              </Typography>
              <TextField
                value={committee?.committeeNumber || ""}
                size="small"
                fullWidth
                slotProps={{
                  input: { readOnly: true },
                }}
              />
            </Box>

            {/* Committee Type - readonly */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: isMobile ? "100%" : 250,
                flex: isMobile ? "1 1 100%" : "0 0 auto",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500 }}
              >
                ประเภท
              </Typography>
              <TextField
                size="small"
                value={committeeTypeList?.find((t) => t.id === committee?.committeeType)?.name || ""}
                fullWidth
                slotProps={{
                  input: { readOnly: true },
                }}
              />
            </Box>

            {/* Add Expert Button */}
            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleAddExpert}
              sx={{
                minWidth: isMobile ? "100%" : 180,
                height: "40px",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                alignSelf: isMobile ? "stretch" : "flex-end",
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              เพิ่มผู้เชี่ยวชาญ
            </Button>
          </Box>

          {/* Second Row */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
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
              value={committee?.committeeNameTh || ""}
              size="small"
              fullWidth
              slotProps={{
                input: { readOnly: true },
              }}
            />
          </Box>
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
                บัตรประชาชน
              </TableCell>
              <TableCell
               sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อผู้เชี่ยวชาญ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ประเภท
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ลำดับ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                หน่วยงาน
              </TableCell>
              <TableCell
             sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
              >
                เลขานุการ
              </TableCell>
              <TableCell
              sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
              >
                ผู้ช่วยเลขา
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
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : members?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลสมาชิก
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              members&&members.map((member) => (
                <TableRow
                  key={member.id}
                  hover
                  sx={{
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    transition: "background-color 0.2s",
                    color: member.status === "inactive" ? "text.disabled" : "inherit",
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {member.idCard || "-"}
                  </TableCell>
                  <TableCell
                    title={member.expertName || "-"}
                  >
                    <Stack direction="row" display="flex" alignItems="center" spacing={0.5}>
                      <span>{member.expertName || "-"}</span>
                      <IconButton
                        size={isMobile ? "small" : "medium"}
                        onClick={() => handleToggleStatus(member)}
                        sx={{ p: isMobile ? 0.25 : 0.5 }}
                      >
                        {member.status === "active" ? (
                          <CheckCircleIcon color="success" fontSize={isMobile ? "small" : "medium"} />
                        ) : (
                          <CancelIcon color="disabled" fontSize={isMobile ? "small" : "medium"} />
                        )}
                      </IconButton>
                    </Stack>
                  </TableCell>
                  <TableCell
                  >
                    <Chip
                      label={member.memberTypeName || "-"}
                      size="small"
                      variant="outlined"
                      color={
                        member.memberTypeName === "ผู้ทรงคุณวุฒิ"
                          ? "primary"
                          : "warning"
                      }
                    />
                  </TableCell>
                  <TableCell
                  >
                    {member.representativeOrder || "-"}
                  </TableCell>
                  <TableCell
                    title={member.organizationName || "-"}
                  >
                    {member.organizationName || "-"}
                  </TableCell>
                  <TableCell
                    align="center"
                  >
                    <Checkbox
                      checked={member.isSecretary}
                      disabled
                      size={isMobile ? "small" : "medium"}
                    />
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Checkbox
                      checked={member.isAssistantSecretary}
                      disabled
                      size={isMobile ? "small" : "medium"}
                    />
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
                          onClick={() => handleView(member)}
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
                          onClick={() => handleEdit(member)}
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
                          onClick={() => handleDelete(member.id || 0)}
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

      {/* Dialog for Add/View/Edit Expert */}
      {dialogOpen && (
        <CommitteeExpertDialog
          open={dialogOpen}
          mode={dialogMode}
          expertGroupMember={selectedMember
            ? {
                ...selectedMember,
              }
            : undefined}
          committee={committee|| undefined}
          directive={directive || undefined}
          onClose={handleCloseDialog}
          onSave={handleSaveMember}
        />
      )}

      {/* Dialog for Selecting Experts from List */}
      {selectionDialogOpen && (
        <ExpertSelectionDialog
          open={selectionDialogOpen}
          availableExperts={[]}
          selectedExpertIds={members.map((m) => String(m.expertId))}
          onClose={() => setSelectionDialogOpen(false)}
          onSelect={() => {
            // Handle expert selection
            setSelectionDialogOpen(false);
          }}
        />
      )}
    </Container>
  );
}
