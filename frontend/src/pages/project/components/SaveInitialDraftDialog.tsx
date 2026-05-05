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
} from "@mui/material";
import { Close, CloudUpload } from "@mui/icons-material";
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
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { uploadFileServer } from "@utils/fileService";

interface SaveInitialDraftDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: () => void;
}

const SaveInitialDraftDialog: React.FC<SaveInitialDraftDialogProps> = ({
  open,
  onClose,
  project,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [draftDate, setDraftDate] = useState<Dayjs | null>(null);
  const [draftFile, setDraftFile] = useState<File | null>(null);
  const [meetingReportFile, setMeetingReportFile] = useState<File | null>(null);
  const [questionnaireSummaryFile, setQuestionnaireSummaryFile] = useState<File | null>(null);
  const [powerpointFile, setPowerpointFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
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
      setDraftDate(dayjs());
      setDraftFile(null);
      setMeetingReportFile(null);
      setQuestionnaireSummaryFile(null);
      setPowerpointFile(null);
      setDocumentFile(null);
      setRemarks("");
    }
  }, [open, project]);

  const handleDraftFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDraftFile(event.target.files[0]);
    }
  };

  const handleMeetingReportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMeetingReportFile(event.target.files[0]);
    }
  };

  const handleQuestionnaireSummaryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setQuestionnaireSummaryFile(event.target.files[0]);
    }
  };

  const handlePowerpointFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPowerpointFile(event.target.files[0]);
    }
  };

  const handleDocumentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocumentFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    if (!draftDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่บันทึกร่างขั้นต้น");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลบันทึกร่างขั้นต้นหรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const draftDateStr = draftDate.format("YYYY-MM-DD");

      // Upload files to MinIO
      let uploadedFiles: {
        draftFile?: string;
        meetingReportFile?: string;
        questionnaireSummaryFile?: string;
        powerpointFile?: string;
        documentFile?: string;
      } = {};

      try {
        if (draftFile) {
          uploadedFiles.draftFile = await uploadFileServer({
            file: draftFile,
            folder: `projects/initial-draft`,
          });
        }
        if (meetingReportFile) {
          uploadedFiles.meetingReportFile = await uploadFileServer({
            file: meetingReportFile,
            folder: `projects/initial-draft`,
          });
        }
        if (questionnaireSummaryFile) {
          uploadedFiles.questionnaireSummaryFile = await uploadFileServer({
            file: questionnaireSummaryFile,
            folder: `projects/initial-draft`,
          });
        }
        if (powerpointFile) {
          uploadedFiles.powerpointFile = await uploadFileServer({
            file: powerpointFile,
            folder: `projects/initial-draft`,
          });
        }
        if (documentFile) {
          uploadedFiles.documentFile = await uploadFileServer({
            file: documentFile,
            folder: `projects/initial-draft`,
          });
        }
      } catch (uploadError: any) {
        console.error("Error uploading files:", uploadError);
        showError(
          "เกิดข้อผิดพลาด",
          uploadError?.message || "ไม่สามารถอัปโหลดไฟล์ได้"
        );
        return;
      }

      // กำหนด stage codes และ logs
      const newStageCode = "48.20";
      const newStageUiMsg =
        stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
        "";

      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [
        {
          stageCode: "48.20",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "48.20")?.name || "",
          stageDate: draftDateStr,
        },
      ];

      // อัปเดตโครงการ
      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        initial_draft_date: draftDateStr,
        initial_draft_file_path: uploadedFiles.draftFile,
        initial_draft_meeting_report_file_path: uploadedFiles.meetingReportFile,
        initial_draft_questionnaire_summary_file_path: uploadedFiles.questionnaireSummaryFile,
        initial_draft_powerpoint_file_path: uploadedFiles.powerpointFile,
        initial_draft_document_file_path: uploadedFiles.documentFile,
        initial_draft_remarks: remarks,
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
          });
        } catch (err: any) {
          console.error(`Error creating log for stage ${log.stageCode}:`, err);
          // Continue with other logs even if one fails
        }
      }

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลบันทึกร่างขั้นต้นเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving initial draft:", err);
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
          บันทึกร่างขั้นต้น
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

          {/* วันที่บันทึกร่างขั้นต้น */}
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
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              วันที่บันทึกร่างขั้นต้น
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <DatePicker
                value={draftDate}
                onChange={(newValue) => setDraftDate(newValue)}
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

          {/* ไฟล์ร่างมาตรฐาน */}
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
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              ไฟล์ร่างมาตรฐาน
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={draftFile?.name || ""}
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
                  onChange={handleDraftFileChange}
                />
              </Button>
            </Box>
          </Box>

          {/* รายงานการประชุม */}
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
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              รายงานการประชุม
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={meetingReportFile?.name || ""}
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
                  onChange={handleMeetingReportFileChange}
                />
              </Button>
            </Box>
          </Box>

          {/* สรุปแบบสอบถาม */}
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
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              สรุปแบบสอบถาม
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={questionnaireSummaryFile?.name || ""}
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
                  onChange={handleQuestionnaireSummaryFileChange}
                />
              </Button>
            </Box>
          </Box>

          {/* Power Point เสนอ กมอ. */}
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
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              Power Point เสนอ กมอ.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={powerpointFile?.name || ""}
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
                  accept=".ppt,.pptx"
                  onChange={handlePowerpointFileChange}
                />
              </Button>
            </Box>
          </Box>

          {/* เอกสารเสนอ กมอ. */}
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
              sx={{ fontWeight: 700, minWidth: "25%" }}
            >
              เอกสารเสนอ กมอ.
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
              <TextField
                fullWidth
                size="small"
                value={documentFile?.name || ""}
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
                  onChange={handleDocumentFileChange}
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
          ปิด
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading || !draftDate}
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

export default SaveInitialDraftDialog;
