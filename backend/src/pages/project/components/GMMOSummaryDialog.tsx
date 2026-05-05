import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { Project } from "@models/projects";
import {
  updateProjectStage,
  upsertProjectLog,
} from "@services/projectService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/th";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode } from "@store/globalSlice";

interface GMMOSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: () => void;
}

const GMMOSummaryDialog: React.FC<GMMOSummaryDialogProps> = ({
  open,
  onClose,
  project,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [summaryDate, setSummaryDate] = useState<Dayjs | null>(null);
  const [decision, setDecision] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const {stageCodeList} = useAppSelector((state: RootState) => state.global);

  const dispatch=useAppDispatch();

  useEffect(() => {
    if(stageCodeList===null){
      dispatch(fetchAppStageCode());
    }
  }, [stageCodeList]);

  useEffect(() => {
    if (open && project) {
      setSummaryDate(dayjs());
      setDecision("");
      setRemarks("");
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    if (!summaryDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่สรุปผล กมอ.");
      return;
    }

    if (!decision) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกการตัดสินใจ");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลสรุปผล กมอ. หรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const summaryDateStr = summaryDate.format("YYYY-MM-DD");

      // กำหนด stage codes และ logs ตามการตัดสินใจ
      let newStageCode = "";
      let newStageUiMsg = "";
      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
      }> = [];

      switch (decision) {
        case "back":
          // กลับไปทำขั้นตอนก่อนหน้า
          newStageCode = "00.00";
          newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";
          logsToCreate.push(
            {
              stageCode: "10.20",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.20")?.name || "",
            },
            {
              stageCode: "10.40",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.40")?.name || "",
            },
            { stageCode: "10.60", stageDescription: stageCodeList?.find((stage) => stage.code === "10.60")?.name || "" },
            { stageCode: "10.92", stageDescription: stageCodeList?.find((stage) => stage.code === "10.92")?.name || "" },
            { stageCode: "00.00", stageDescription: stageCodeList?.find((stage) => stage.code === "00.00")?.name || "" }
          );
          break;
        case "disapprove":
          // ไม่เห็นชอบ
          newStageCode = "10.98";
          newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";
          logsToCreate.push(
            {
              stageCode: "10.20",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.20")?.name || "",
            },
            {
              stageCode: "10.40",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.40")?.name || "",
            },
            { stageCode: "10.60", stageDescription: stageCodeList?.find((stage) => stage.code === "10.60")?.name || "" },
            { stageCode: "10.98", stageDescription: stageCodeList?.find((stage) => stage.code === "10.98")?.name || "" }
          );
          break;
        case "approve":
          // เห็นชอบและทำขั้นต่อไป
          newStageCode = "20.00";
          newStageUiMsg = stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "";
          logsToCreate.push(
            {
              stageCode: "10.20",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.20")?.name || "",
            },
            {
              stageCode: "10.40",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.40")?.name || "",
            },
            { stageCode: "10.60", stageDescription: stageCodeList?.find((stage) => stage.code === "10.60")?.name || "" },
            {
              stageCode: "10.99",
              stageDescription: stageCodeList?.find((stage) => stage.code === "10.99")?.name || "",
            },
            {
              stageCode: "20.00",
              stageDescription: stageCodeList?.find((stage) => stage.code === "20.00")?.name || "",
            }
          );
          break;
      }

      // อัปเดตโครงการ
      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        gmmo_summary_remarks: remarks,
      };

      await updateProjectStage(updatedProject);

      // บันทึกข้อมูลใน i_projects_logs table
      for (const log of logsToCreate) {
        try {
          await upsertProjectLog(project.id, {
            projectId: project.id,
            stageCode: log.stageCode,
            stageDescription: log.stageDescription,
            stageDate: summaryDateStr,
            stageStatus: "Finished",
          });
        } catch (err: any) {
          console.error(`Error creating log for stage ${log.stageCode}:`, err);
          // Continue with other logs even if one fails
        }
      }

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลสรุปผล กมอ. เรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving GMMO summary:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setLoading(false);
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
          กมอ. สรุปผล
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
          {/* ชื่อร่างมาตรฐาน */}
          <Box
            sx={{
              my: 2,
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              ชื่อร่างมาตรฐาน
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={project?.nameThai || project?.name || ""}
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

          {/* วันที่สรุปผล กมอ. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
              mb: 3,
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              วันที่สรุปผล กมอ.
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
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              การตัดสินใจ
            </FormLabel>
            <RadioGroup
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <FormControlLabel
                value="back"
                control={<Radio />}
                label="กลับไปทำขั้นตอนก่อนหน้า"
              />
              <FormControlLabel
                value="disapprove"
                control={<Radio />}
                label="ไม่เห็นชอบ"
              />
              <FormControlLabel
                value="approve"
                control={<Radio />}
                label="เห็นชอบและทำขั้นต่อไป"
              />
            </RadioGroup>
          </FormControl>

          {/* หมายเหตุ */}
          <TextField
            fullWidth
            label="หมายเหตุ"
            multiline
            rows={4}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="กรุณาระบุหมายเหตุ..."
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3 ,gap:2,justifyContent:"center"}}>
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

export default GMMOSummaryDialog;
