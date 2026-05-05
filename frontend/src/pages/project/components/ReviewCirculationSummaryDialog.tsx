import React, { useEffect, useState } from "react";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { Project } from "@models/projects";
import {
  updateProjectReview,
  upsertProjectReviewLog,
} from "@services/projectService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { RootState } from "@store/index";

dayjs.extend(buddhistEra);
dayjs.locale("th");

interface ReviewCirculationSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  review: Project | null;
  onSuccess?: () => void;
}

const ReviewCirculationSummaryDialog: React.FC<ReviewCirculationSummaryDialogProps> = ({
  open,
  onClose,
  review,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [summaryDate, setSummaryDate] = useState<Dayjs | null>(
    dayjs()
  );
  const [decision, setDecision] = useState<string>("review");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  useEffect(() => {
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }
  }, [dispatch, stageCodeList]);

  const handleSave = async () => {
    if (!review || !review.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลทบทวนมาตรฐาน");
      return;
    }

    if (!summaryDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่สรุปผลทบทวน");
      return;
    }

    if (!decision) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกการตัดสินใจ");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลสรุปผลการเวียนหรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const summaryDateStr = summaryDate.format("YYYY-MM-DD");
      const logsToCreate: any[] = [];
      let newStageCode = review.stageCode || "";
      let newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";

      // บันทึก log 90.60
      logsToCreate.push({
        projectId: review.id,
        stageCode: "90.60",
        stageDescription:
          stageCodeList?.find((stage) => stage.code === "90.60")?.name || "",
        stageDate: summaryDateStr,
        remarks: remarks || undefined,
      });

      if (decision === "review") {
        // ทบทวนมาตรฐาน
        logsToCreate.push({
          projectId: review.id,
          stageCode: "90.92",
          stageDescription: stageCodeList?.find((stage) => stage.code === "90.92")?.name || "",
          stageDate: summaryDateStr,
          remarks: remarks || undefined,
        });
        newStageCode = "90.92";
        newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";

        // TODO: สร้าง Project ใหม่โดยดึงข้อมูลจาก tb3_tis
        // และ set proposal_type เป็น "ยกเลิกและกำหนด" หรือ "ยกเลิกและกำหนด (ก่อน 5 ปี)"
      } else if (decision === "confirm") {
        // ยืนยันมาตรฐาน
        logsToCreate.push({
          projectId: review.id,
          stageCode: "90.93",
          stageDescription: stageCodeList?.find((stage) => stage.code === "90.93")?.name || "",
          stageDate: summaryDateStr,
          remarks: remarks || undefined,
        });
        newStageCode = "90.93";
        newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";
      } else if (decision === "cancel") {
        // ยกเลิกมาตรฐาน
        logsToCreate.push({
          projectId: review.id,
          stageCode: "90.99",
          stageDescription: stageCodeList?.find((stage) => stage.code === "90.99")?.name || "",
          stageDate: summaryDateStr,
          remarks: remarks || undefined,
        });
        logsToCreate.push({
          projectId: review.id,
          stageCode: "95.00",
          stageDescription: stageCodeList?.find((stage) => stage.code === "95.00")?.name || "",
          stageDate: summaryDateStr,
          remarks: remarks || undefined,
        });
        newStageCode = "95.00";
        newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";
      }

      // อัปเดตสถานะโครงการ
      await updateProjectReview({
        id: review.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        review_circulation_summary_remark: remarks,
      });

      // บันทึก logs
      for (const log of logsToCreate) {
        try {
          await upsertProjectReviewLog(review.id, {
            projectReviewId: review.id,
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

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลสรุปผลการเวียนเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving circulation summary:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setLoading(false);
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
          สรุปผลการเวียน
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
          {/* ชื่อร่างมาตรฐาน */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ชื่อร่างมาตรฐาน
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={review?.nameThai || review?.name || ""}
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

          {/* วันที่สรุปผลทบทวน */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              วันที่สรุปผลทบทวน
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <DatePicker
                value={summaryDate}
                onChange={(newValue) => setSummaryDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* การตัดสินใจ */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ mb: 1 }}>
              การตัดสินใจ
            </FormLabel>
            <RadioGroup
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <FormControlLabel
                value="review"
                control={<Radio />}
                label="ทบทวนมาตรฐาน"
              />
              <FormControlLabel
                value="confirm"
                control={<Radio />}
                label="ยืนยันมาตรฐาน"
              />
              <FormControlLabel
                value="cancel"
                control={<Radio />}
                label="ยกเลิกมาตรฐาน"
              />
            </RadioGroup>
          </FormControl>

          {/* หมายเหตุ */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              หมายเหตุ
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="กรุณาระบุหมายเหตุ..."
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
          disabled={loading || !summaryDate || !decision}
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

export default ReviewCirculationSummaryDialog;
