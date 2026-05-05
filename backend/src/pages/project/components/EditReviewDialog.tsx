import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Autocomplete,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import {
  updateProjectReview,
  getProjectReview,
} from "@services/projectService";

import { ProjectReview } from "@models/projects";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { setGlobalLoading, fetchAppDepartments } from "@store/globalSlice";
import { MasterData } from "@models/global";
import { getRegulations } from "@services/globalService";

interface EditReviewDialogProps {
  open: boolean;
  onClose: () => void;
  review: ProjectReview | null;
  onSuccess?: () => void;
}

const EditReviewDialog: React.FC<EditReviewDialogProps> = ({
  open,
  onClose,
  review,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedOwnerGroup, setSelectedOwnerGroup] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [regulations, setRegulations] = useState<MasterData[]>([]);

  const [formData, setFormData] = useState({
    enforcementStatusId: null as number | null,
    enforcementStatusName: "",
  })

  const { departmentList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();


  // Load master data
  useEffect(() => {
    if (open) {
      loadMasterData();
    }
  }, [open]);

  const loadMasterData = async () => {
    try {
      dispatch(setGlobalLoading(true));
      const [
        regulationsRes,
      ] = await Promise.all([
        getRegulations()
      ]);


      setRegulations(regulationsRes || []);

    } catch (err: any) {
      console.error("Error loading master data:", err);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  useEffect(() => {
    if (departmentList === null) {
      dispatch(fetchAppDepartments());
    }
  }, [departmentList, dispatch]);

  useEffect(() => {
    if (open && review) {
      // Load review data if only ID is provided
      if (review.id && !review.tisNumber) {
        loadReviewData(review.id);
      } else {
        // Set default owner group from review data
        if (review.ownerGroupId && departmentList) {
          const defaultGroup = departmentList.find(
            (d) => d.id === review.ownerGroupId
          );
          setSelectedOwnerGroup(defaultGroup || null);
          setFormData((prev) => ({
            ...prev,
            enforcementStatusId: review.enforcementStatusId || null,
            enforcementStatusName: review.enforcementStatusName || "",
          }));
        } else {
          setSelectedOwnerGroup(null);
        }
      }
    }
  }, [open, review, departmentList]);

  const loadReviewData = async (id: number) => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));
      const reviewData = await getProjectReview(id);
      // Set default owner group
      if (reviewData.ownerGroupId && departmentList) {
        const defaultGroup = departmentList.find(
          (d) => d.id === reviewData.ownerGroupId
        );
        setSelectedOwnerGroup(defaultGroup || null);
      }
    } catch (err: any) {
      console.error("Error loading review:", err);
      showError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลทบทวนมาตรฐานได้");
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSave = async () => {
    if (!review || !review.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลทบทวนมาตรฐาน");
      return;
    }

    if (!selectedOwnerGroup) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกกลุ่มเจ้าหน้าที่");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลแก้ไขทบทวนมาตรฐานหรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // อัปเดตเฉพาะกลุ่มเจ้าหน้าที่
      const updatedReview: Partial<ProjectReview> = {
        id: review.id,
        ownerGroupId: selectedOwnerGroup.id,
        ownerGroupName: selectedOwnerGroup.name,
        enforcementStatusId: formData?.enforcementStatusId || undefined, // สถานะเกี่ยวกับการบังคับ
        enforcementStatusName: formData?.enforcementStatusName || undefined, // สถานะเกี่ยวกับการบังคับ (ชื่อ)

      };

      await updateProjectReview(updatedReview);


      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลแก้ไขทบทวนมาตรฐานเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error updating review:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const getSelectedEnforcementStatus = () => {
    return (
      regulations.find((r) => r.id === formData?.enforcementStatusId) || null
    );
  };

  // Filter เฉพาะกองกำหนดมาตรฐาน (Standard Setting Division)
  // กองกำหนดมาตรฐาน = department code "08"
  // TODO: ต้อง filter ตาม department ID ที่เป็นกองกำหนดมาตรฐาน
  // ตอนนี้แสดงทั้งหมดก่อน ต้องเพิ่ม logic filter ตาม department code
  const filteredSubDepartments = departmentList || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
          px: 3,
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          แก้ไขข้อมูลทบทวนมาตรฐาน
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: "#fff",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", mt: 2, gap: 3 }}>
          {/* เลข มอก. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              เลข มอก.
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={review?.tisNumber || ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "grey.50",
                },
              }}
            />
          </Box>

          {/* ชื่อมาตรฐาน */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              ชื่อมาตรฐาน
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={review?.nameThai || ""}
              slotProps={{
                input: {
                  readOnly: true,
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "grey.50",
                },
              }}
            />
          </Box>

          {/* สถานะเกี่ยวกับการบังคับ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              สถานะเกี่ยวกับการบังคับ
            </Typography>
            <Autocomplete
              options={regulations}
              getOptionLabel={(option) => option.name || ""}
              value={getSelectedEnforcementStatus()}
              onChange={(_, newValue) => {
                setFormData({
                  ...formData,
                  enforcementStatusId: newValue?.id as number | null,
                  enforcementStatusName: newValue?.name || "",
                });
              }}
              sx={{ minWidth: 300 }}
              renderInput={(params) => {
                const { InputProps, ...other } = params;
                return (
                  <TextField
                    {...other}
                    slotProps={{
                      input: {
                        ...InputProps,
                      },
                    }}
                  />
                );
              }}
            />
          </Box>

          {/* กลุ่มเจ้าหน้าที่ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              กลุ่มเจ้าหน้าที่
            </Typography>
            <Autocomplete
              options={filteredSubDepartments}
              getOptionLabel={(option) => option.name || ""}
              value={selectedOwnerGroup}
              onChange={(_, newValue) => setSelectedOwnerGroup(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  size="small"
                  fullWidth
                  placeholder="เลือกกลุ่มเจ้าหน้าที่"
                />
              )}
              sx={{ flex: 1 }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, gap: 2, justifyContent: "center" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !selectedOwnerGroup}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditReviewDialog;
