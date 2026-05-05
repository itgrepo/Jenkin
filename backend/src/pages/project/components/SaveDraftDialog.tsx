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
import { fetchAppStageCode } from "@store/globalSlice";
import { uploadFileServer } from "@utils/fileService";

interface SaveDraftDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: () => void;
}

const SaveDraftDialog: React.FC<SaveDraftDialogProps> = ({
  open,
  onClose,
  project,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [completionDate, setCompletionDate] = useState<Dayjs | null>(null);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [decision, setDecision] = useState<string>("circulate");
  const [draftFile, setDraftFile] = useState<File | null>(null);
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
      setCompletionDate(dayjs());
      setStartDate(dayjs());
      setDecision("circulate");
      setDraftFile(null);
      setRemarks("");
    }
  }, [open, project]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDraftFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    if (!completionDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่เตรียมร่างเสร็จ");
      return;
    }

    if (!startDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่เริ่มเตรียมร่าง");
      return;
    }

    if (!decision) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกการตัดสินใจ");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลเตรียมร่างเสร็จหรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const completionDateStr = completionDate.format("YYYY-MM-DD");
      const startDateStr = startDate.format("YYYY-MM-DD");

      // กำหนด stage codes และ logs ตามการตัดสินใจ
      let newStageCode = "";
      let newStageUiMsg = "";
      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [];

      switch (decision) {
        case "circulate":
          // เวียนร่าง
          newStageCode = "25.00";
          newStageUiMsg =
            stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
            "";
          logsToCreate.push(
            {
              stageCode: "20.20",
              stageDescription:
                stageCodeList?.find((stage) => stage.code === "20.20")?.name ||
                "",
              stageDate: startDateStr,
            },
            {
              stageCode: "20.40",
              stageDescription:
                stageCodeList?.find((stage) => stage.code === "20.40")?.name ||
                "",
              stageDate: startDateStr,
            },
            {
              stageCode: "20.60",
              stageDescription:
                stageCodeList?.find((stage) => stage.code === "20.60")?.name ||
                "",
              stageDate: completionDateStr,
            },
            {
              stageCode: "20.99",
              stageDescription:
                stageCodeList?.find((stage) => stage.code === "20.99")?.name ||
                "",
              stageDate: completionDateStr,
            },
            {
              stageCode: "25.00",
              stageDescription:
                stageCodeList?.find((stage) => stage.code === "25.00")?.name ||
                "",
              stageDate: completionDateStr,
            }
          );
          break;
        case "next":
          // ทำขั้นต่อไป
          // ตรวจสอบว่ามีการเลือก อนุ กว. หรือ กว. หรือไม่
          const hasSubCommittee = project.subCommitteeId !== null;
          const hasCommittee = project.committeeId !== null;

          if (hasSubCommittee) {
            newStageCode = "30.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "20.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.20")
                    ?.name || "",
                stageDate: startDateStr,
              },
              {
                stageCode: "20.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.40")
                    ?.name || "",
                stageDate: startDateStr,
              },
              {
                stageCode: "20.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.60")
                    ?.name || "",
                stageDate: completionDateStr,
              },
              {
                stageCode: "20.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.99")
                    ?.name || "",
                stageDate: completionDateStr,
              },
              {
                stageCode: "30.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.00")
                    ?.name || "",
                stageDate: completionDateStr,
              }
            );
          } else if (hasCommittee) {
            newStageCode = "40.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "20.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.20")
                    ?.name || "",
                stageDate: startDateStr,
              },
              {
                stageCode: "20.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.40")
                    ?.name || "",
                stageDate: startDateStr,
              },
              {
                stageCode: "20.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.60")
                    ?.name || "",
                stageDate: completionDateStr,
              },
              {
                stageCode: "20.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.99")
                    ?.name || "",
                stageDate: completionDateStr,
              },
              {
                stageCode: "40.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.00")
                    ?.name || "",
                stageDate: completionDateStr,
              }
            );
          } else {
            newStageCode = "47.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "20.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.20")
                    ?.name || "",
                stageDate: startDateStr,
              },
              {
                stageCode: "20.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.40")
                    ?.name || "",
                stageDate: startDateStr,
              },
              {
                stageCode: "20.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.60")
                    ?.name || "",
                stageDate: completionDateStr,
              },
              {
                stageCode: "20.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.99")
                    ?.name || "",
                stageDate: completionDateStr,
              },
              {
                stageCode: "47.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "47.00")
                    ?.name || "",
                stageDate: completionDateStr,
              }
            );
          }
          break;
      }

      // Upload draft file to MinIO if provided
      let uploadedFilePath = "";
      if (draftFile) {
        try {
          uploadedFilePath = await uploadFileServer({
            file: draftFile,
            folder: `projects/drafts`,
          });
          console.log("Draft file uploaded successfully:", uploadedFilePath);
        } catch (uploadError: any) {
          console.error("Error uploading draft file:", uploadError);
          showError(
            "เกิดข้อผิดพลาด",
            uploadError?.message || "ไม่สามารถอัปโหลดไฟล์ได้"
          );
          // Continue with saving logs even if file upload fails
        }
      }

      // อัปเดตโครงการ
      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        save_draft_remarks: remarks,
        save_draft_file_path: uploadedFilePath,
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

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลเตรียมร่างเสร็จเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving draft:", err);
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
          บันทึกเตรียมร่างเสร็จ
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

          {/* วันที่เริ่มเตรียมร่าง */}
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
              วันที่เริ่มเตรียมร่าง
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <DatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
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

          {/* วันที่เตรียมร่างเสร็จ */}
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
              วันที่เตรียมร่างเสร็จ
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <DatePicker
                value={completionDate}
                onChange={(newValue) => setCompletionDate(newValue)}
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
          {/* เอกสารร่าง */}
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
              เอกสารร่าง
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
                  onChange={handleFileChange}
                />
              </Button>
            </Box>
          </Box>

          {/* การตัดสินใจ */}
          <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              การตัดสินใจ
            </FormLabel>
            <RadioGroup
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            >
              <FormControlLabel
                value="circulate"
                control={<Radio />}
                label="เวียนร่าง"
              />
              <FormControlLabel
                value="next"
                control={<Radio />}
                label="ทำขั้นต่อไป"
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
          disabled={loading || !completionDate || !startDate || !decision}
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

export default SaveDraftDialog;
