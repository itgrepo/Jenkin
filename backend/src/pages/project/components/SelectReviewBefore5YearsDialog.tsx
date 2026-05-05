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
  createReviewFromTIS,
  getTISStandardsForReview,
  upsertProjectReviewLog,
} from "@services/projectService";
import dayjs from "dayjs";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppDepartments, fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { TISStandardForReview } from "@models/projects";
import { RootState } from "@store/index";


interface SelectReviewBefore5YearsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SelectReviewBefore5YearsDialog: React.FC<SelectReviewBefore5YearsDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedStandard, setSelectedStandard] = useState<TISStandardForReview | null>(null);
  const [standards, setStandards] = useState<TISStandardForReview[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const { stageCodeList, departmentList } = useAppSelector((state: RootState) => state.global);
  const currentUser = useAppSelector((state: RootState) => state.auth.user);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }
    if (!departmentList) {
      dispatch(fetchAppDepartments());
    }
  }, [dispatch, stageCodeList, departmentList]);

  useEffect(() => {
    if (open) {
      setSelectedStandard(null);
      setSearchText("");
      loadStandards("");
    }
  }, [open]);

  // Debounce search
  useEffect(() => {
    if (!open) return;

    const timeoutId = setTimeout(() => {
      loadStandards(searchText);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText, open]);

  const loadStandards = async (search?: string) => {
    try {
      dispatch(setGlobalLoading(true));
      setSearching(true);
      const res = await getTISStandardsForReview({
        search: search?.trim() || undefined,
      });
      setStandards(res.data || []);
    } catch (err: any) {
      console.error("Error loading standards:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูล มอก. ได้"
      );
    } finally {
      setSearching(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSave = async () => {
    if (!selectedStandard) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือก มอก. ที่ต้องการทบทวน");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      `คุณต้องการบันทึกข้อมูลทบทวนมาตรฐาน "${selectedStandard.nameThai}" หรือไม่?`
    );
    if (!confirm.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));


      // กำหนด stage codes และ logs
      const newStageCode = "90.20";
      const newStageUiMsg =
        stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
        "";

      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [
          {
            stageCode: "90.00",
            stageDescription:
              stageCodeList?.find((stage) => stage.code === "90.00")?.name || "",
            stageDate: dayjs().format("YYYY-MM-DD"),
          },
          {
            stageCode: "90.20",
            stageDescription:
              stageCodeList?.find((stage) => stage.code === "90.20")?.name || "",
            stageDate: dayjs().format("YYYY-MM-DD"),
          },
        ];

      // เรียก API เพื่อ insert ข้อมูลจาก tb3_tis ไปยังตารางทบทวนมาตรฐาน และ set สถานะเป็น 90.00
      const resp = await createReviewFromTIS({
        tisNumber: selectedStandard.tisNumber,
        nameThai: selectedStandard.nameThai,
        nameEnglish: selectedStandard.nameEnglish,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        enforcementStatusId: 0,
        enforcementStatusName: "",
        ownerGroupId: departmentList?.find((department) => Number(department.id) === Number((currentUser?.reg_subdepart)?.substring(0, 2)))?.id || 0,
        ownerGroupName: departmentList?.find((department) => Number(department.id) === Number((currentUser?.reg_subdepart)?.substring(0, 2)))?.name || "",
      });

      if (resp.id) {
        for (const log of logsToCreate) {
          try {
            await upsertProjectReviewLog(resp.id, {
              projectReviewId: resp.id,
              stageCode: log.stageCode,
              stageDescription: log.stageDescription,
              stageDate: log.stageDate,
              stageStatus: "Finished",
            });
          } catch (err: any) {
            console.error(`Error creating log for stage ${log.stageCode}:`, err);
            // Continue with other logs even if one fails
          }
        }
      }
      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลทบทวนมาตรฐานเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error creating review:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          เลือกทบทวนมาตรฐานก่อน 5 ปี
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
        <Box sx={{ display: "flex", flexDirection: "column", mt: 2 }}>
          <Autocomplete
            options={standards}
            getOptionLabel={(option) =>
              `${option.tisNumber} - ${option.nameThai}`
            }
            value={selectedStandard}
            onChange={(_, newValue) => setSelectedStandard(newValue)}
            inputValue={searchText}
            onInputChange={(_, newInputValue) => {
              setSearchText(newInputValue);
            }}
            loading={searching}
            renderInput={(params) => {
              const { InputProps, ...other } = params;
              return (
                <TextField
                  {...other}
                  label="เลือก มอก. ที่ต้องการทบทวน"
                  placeholder="ค้นหาเลข มอก. หรือชื่อมาตรฐาน..."
                  slotProps={{
                    input: {
                      ...InputProps,
                    },
                  }}
                />
              );
            }}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option.id}>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {option.tisNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.nameThai}
                  </Typography>
                  {option.effectiveDate && (
                    <Typography variant="caption" color="text.secondary">
                      วันที่มีผลบังคับใช้: {option.effectiveDate}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            sx={{ mb: 2 }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, gap: 2, justifyContent: "center" }}>
        <Button
          variant="outlined"
          onClick={onClose}
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
          disabled={!selectedStandard}
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

export default SelectReviewBefore5YearsDialog;
