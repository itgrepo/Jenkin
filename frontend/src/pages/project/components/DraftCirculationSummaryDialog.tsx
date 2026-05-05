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

interface DraftCirculationSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  type?: string; // "25" for draft preparation, "35" for sub-committee, "45" for committee
  onSuccess?: () => void;
}

const DraftCirculationSummaryDialog: React.FC<DraftCirculationSummaryDialogProps> = ({
  open,
  onClose,
  project,
  type = "25",
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [summaryDate, setSummaryDate] = useState<Dayjs | null>(null);
  const [decision, setDecision] = useState<string>("back");
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
      setSummaryDate(dayjs());
      setDecision("back");
      setRemarks("");
    }
  }, [open, project]);

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    if (!summaryDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่สรุปเวียนร่าง");
      return;
    }

    if (!decision) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกการตัดสินใจ");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลสรุปการเวียนร่างหรือไม่?"
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
        stageDate: string;
      }> = [];

      switch (decision) {
        case "back":
          // กลับไปทำขั้นตอนก่อนหน้า
          if (type === "25") {
            // เตรียมร่าง
            newStageCode = "20.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "25.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.20")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "25.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.40")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "25.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.60")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "25.92",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.92")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "20.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              }
            );
          } else if (type === "35") {
            // อนุ กว.
            newStageCode = "30.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "35.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.20")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.40")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.60")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.92",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.92")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "30.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              }
            );
          } else if (type === "45") {
            // กว.
            newStageCode = "40.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "45.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.20")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.40")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.60")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.92",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.92")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "40.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              }
            );
          }
          break;
        case "next":
          // ทำขั้นต่อไป
          if (type === "25") {
            // เตรียมร่าง
            logsToCreate.push(
              {
                stageCode: "25.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.20")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "25.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.40")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "25.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.60")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "25.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "25.99")
                    ?.name || "",
                stageDate: summaryDateStr,
              }
            );

            // ตรวจสอบว่ามีการเลือก อนุ กว. หรือ กว. หรือไม่
            const hasSubCommittee = project.subCommitteeId !== null;
            const hasCommittee = project.committeeId !== null;

            if (hasSubCommittee) {
              newStageCode = "30.00";
              newStageUiMsg =
                stageCodeList?.find((stage) => stage.code === newStageCode)
                  ?.name || "";
              logsToCreate.push({
                stageCode: "30.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              });
            } else if (hasCommittee) {
              newStageCode = "40.00";
              newStageUiMsg =
                stageCodeList?.find((stage) => stage.code === newStageCode)
                  ?.name || "";
              logsToCreate.push({
                stageCode: "40.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              });
            } else {
              newStageCode = "47.00";
              newStageUiMsg =
                stageCodeList?.find((stage) => stage.code === newStageCode)
                  ?.name || "";
              logsToCreate.push({
                stageCode: "47.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "47.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              });
            }
          } else if (type === "35") {
            // อนุ กว.
            newStageCode = "40.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "35.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.20")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.40")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.60")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.99")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "40.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              }
            );
          } else if (type === "45") {
            // กว.
            newStageCode = "47.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)
                ?.name || "";
            logsToCreate.push(
              {
                stageCode: "45.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.20")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.40")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.60")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.99")
                    ?.name || "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "47.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "47.00")
                    ?.name || "",
                stageDate: summaryDateStr,
              }
            );
          }
          break;
      }

      // อัปเดตโครงการ

      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        draft_circulation_summary_remarks: type === "25"?remarks:undefined,
        draft_circulation_summary_subcommittee_remarks: type === "35"?remarks:undefined,
        draft_circulation_summary_committee_remarks: type === "45"?remarks:undefined
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

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลสรุปการเวียนร่างเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving draft circulation summary:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setLoading(false);
    }
  };

  // กำหนด title ตาม type
  const getDialogTitle = () => {
    if (type === "25") return "สรุปการเวียนร่าง(เตรียมร่าง)";
    if (type === "35") return "สรุปการเวียนร่าง(อนุ กว.)";
    if (type === "45") return "สรุปการเวียนร่าง(กว.)";
    return "สรุปการเวียนร่าง";
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
          {getDialogTitle()}
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

          {/* วันที่สรุปเวียนร่าง */}
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
              วันที่สรุปเวียนร่าง
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
          <FormControl component="fieldset" sx={{ mb: 2 }}>
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

export default DraftCirculationSummaryDialog;
