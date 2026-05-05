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
  Grid,
} from "@mui/material";
import { Close, CloudUpload } from "@mui/icons-material";
import { Project } from "@models/projects";
import {
  updateProjectStage,
  upsertProjectLog,
  saveStandardAnnouncement,
} from "@services/projectService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import  { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/th";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { uploadFileServer } from "@utils/fileService";

interface SaveStandardAnnouncementDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: () => void;
}

const SaveStandardAnnouncementDialog: React.FC<SaveStandardAnnouncementDialogProps> = ({
  open,
  onClose,
  project,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sendToTISDate, setSendToTISDate] = useState<Dayjs | null>(null);
  const [tissignedDate, setTissignedDate] = useState<Dayjs | null>(null);
  const [rwosignedDate, setRwosignedDate] = useState<Dayjs | null>(null);
  const [sendToRoyalGazetteDate, setSendToRoyalGazetteDate] = useState<Dayjs | null>(null);
  const [royalGazettePublishDate, setRoyalGazettePublishDate] = useState<Dayjs | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<Dayjs | null>(null);
  const [finalDraftFile, setFinalDraftFile] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (stageCodeList === null) {
      dispatch(fetchAppStageCode());
    }
  }, [stageCodeList, dispatch]);

  useEffect(() => {
    if (open && project) {
      setSendToTISDate(null);
      setTissignedDate(null);
      setRwosignedDate(null);
      setSendToRoyalGazetteDate(null);
      setRoyalGazettePublishDate(null);
      setEffectiveDate(null);
      setFinalDraftFile(null);
      setRemarks("");
    }
  }, [open, project]);

  const handleFinalDraftFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFinalDraftFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    if (!sendToTISDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่ส่งเอกสารไป ลมอ.");
      return;
    }

    if (!tissignedDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่ ลมอ. ลงนาม");
      return;
    }

    if (!rwosignedDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่ รวอ. ลงนาม");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลประกาศมาตรฐานหรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const sendToTISDateStr = sendToTISDate.format("YYYY-MM-DD");
      const tissignedDateStr = tissignedDate.format("YYYY-MM-DD");
      const rwosignedDateStr = rwosignedDate.format("YYYY-MM-DD");
      const sendToRoyalGazetteDateStr = sendToRoyalGazetteDate
        ? sendToRoyalGazetteDate.format("YYYY-MM-DD")
        : null;
      const royalGazettePublishDateStr = royalGazettePublishDate
        ? royalGazettePublishDate.format("YYYY-MM-DD")
        : null;
      const effectiveDateStr = effectiveDate
        ? effectiveDate.format("YYYY-MM-DD")
        : null;

      // Upload final draft file to MinIO
      let uploadedFinalDraftFile: string | undefined;

      try {
        if (finalDraftFile) {
          uploadedFinalDraftFile = await uploadFileServer({
            file: finalDraftFile,
            folder: `projects/standard-announcement`,
          });
        }
      } catch (uploadError: any) {
        console.error("Error uploading file:", uploadError);
        showError(
          "เกิดข้อผิดพลาด",
          uploadError?.message || "ไม่สามารถอัปโหลดไฟล์ได้"
        );
        return;
      }

      // กำหนด stage codes และ logs
      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [
        {
          stageCode: "60.20",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "60.20")?.name || "",
          stageDate: sendToTISDateStr,
        },
        {
          stageCode: "60.40",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "60.40")?.name || "",
          stageDate: tissignedDateStr, // วันที่ ผก. อนุมัติ (วันที่ ลมอ. ลงนาม)
        },
        {
          stageCode: "60.60",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "60.60")?.name || "",
          stageDate: rwosignedDateStr, // วันที่ ผก. อนุมัติ (วันที่ รวอ. ลงนาม)
        },
      ];

      const newStageCode = "60.60";
      const newStageUiMsg =
        stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
        "";

      // อัปเดตโครงการ
      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        standard_announcement_send_to_tis_date: sendToTISDateStr,
        standard_announcement_tis_signed_date: tissignedDateStr,
        standard_announcement_rwo_signed_date: rwosignedDateStr,
        standard_announcement_send_to_royal_gazette_date: sendToRoyalGazetteDateStr || undefined,
        standard_announcement_royal_gazette_publish_date: royalGazettePublishDateStr || undefined,
        standard_announcement_effective_date: effectiveDateStr || undefined,
        standard_announcement_final_draft_file_path: uploadedFinalDraftFile,
        standard_announcement_remarks: remarks,
      };

      await updateProjectStage(updatedProject);

      // บันทึกข้อมูลใน i_projects_logs table
      for (const log of logsToCreate) {
        try {
          await upsertProjectLog(project.id, {
            projectId: project.id,
            stageCode: log.stageCode,
            stageDescription: log.stageDescription,
            stageDate: log.stageDate,
            stageStatus: "Finished",
            remarks: remarks || undefined,
          });
        } catch (err: any) {
          console.error(`Error creating log for stage ${log.stageCode}:`, err);
          // Continue with other logs even if one fails
        }
      }

      // บันทึกข้อมูลใน Table tb3_tis
      try {
        await saveStandardAnnouncement({
          projectId: project.id,
          tisNumber: project.tis_number,
          nameThai: project.nameThai || project.name || "",
          nameEnglish: project.nameEnglish || "",
          sendToTISDate: sendToTISDateStr,
          tissignedDate: tissignedDateStr,
          rwosignedDate: rwosignedDateStr,
          sendToRoyalGazetteDate: sendToRoyalGazetteDateStr || undefined,
          royalGazettePublishDate: royalGazettePublishDateStr || undefined,
          effectiveDate: effectiveDateStr || undefined,
          finalDraftFilePath: uploadedFinalDraftFile,
          remarks: remarks,
          systemBy: "e-standard", // ระบุว่าเพิ่มโดยระบบ e-standard
        });
      } catch (err: any) {
        console.error("Error saving to tb3_tis:", err);
        // Continue even if tb3_tis save fails
      }

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลประกาศมาตรฐานเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving standard announcement:", err);
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
          บันทึกประกาศมาตรฐาน
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
              sx={{ fontWeight: 700, minWidth: { xs: "auto", md: "25%" } }}
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

          {/* Date Fields */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                <DatePicker
                  label="วันที่ส่งเอกสารไป ลมอ."
                  value={sendToTISDate}
                  onChange={(newValue) => setSendToTISDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                <DatePicker
                  label="วันที่ ลมอ. ลงนาม"
                  value={tissignedDate}
                  onChange={(newValue) => setTissignedDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                <DatePicker
                  label="วันที่ รวอ. ลงนาม"
                  value={rwosignedDate}
                  onChange={(newValue) => setRwosignedDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                <DatePicker
                  label="วันที่ส่งไปราชกิจจา"
                  value={sendToRoyalGazetteDate}
                  onChange={(newValue) => setSendToRoyalGazetteDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                <DatePicker
                  label="วันที่ลงราชกิจจา"
                  value={royalGazettePublishDate}
                  onChange={(newValue) => setRoyalGazettePublishDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
                <DatePicker
                  label="วันที่มีผลบังคับใช้"
                  value={effectiveDate}
                  onChange={(newValue) => setEffectiveDate(newValue)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>

          {/* ไฟล์เอกสารร่าง Final */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexDirection: { xs: "column", md: "row" },
              mb: 2,
            }}
          >
            <Typography
              component="div"
              sx={{ fontWeight: 700, minWidth: { xs: "auto", md: "25%" } }}
            >
              ไฟล์เอกสารร่าง Final
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={finalDraftFile?.name || ""}
                placeholder="ยังไม่ได้เลือกไฟล์"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "grey.50",
                  },
                  width: "60%",
                }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  width: "40%",
                }}
              >
                อัพโหลดไฟล์
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleFinalDraftFileChange}
                />
              </Button>
            </Box>
          </Box>

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
          disabled={
            loading ||
            !sendToTISDate ||
            !tissignedDate ||
            !rwosignedDate
          }
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

export default SaveStandardAnnouncementDialog;
