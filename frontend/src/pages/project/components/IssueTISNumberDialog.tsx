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
import { Close, Search } from "@mui/icons-material";
import { Project } from "@models/projects";
import {
  updateProjectStage,
  upsertProjectLog,
  checkTISNumber,
} from "@services/projectService";
import { showError, showSuccess, showConfirm, showWarning } from "@components/Swal";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/th";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";

interface IssueTISNumberDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: () => void;
}

const IssueTISNumberDialog: React.FC<IssueTISNumberDialogProps> = ({
  open,
  onClose,
  project,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tisNumberPart1, setTisNumberPart1] = useState<string>("");
  const [tisNumberPart2, setTisNumberPart2] = useState<string>("");
  const [tisNumberPart3, setTisNumberPart3] = useState<string>("");
  const [tisNumberPart4, setTisNumberPart4] = useState<string>("");
  const [issueDate, setIssueDate] = useState<Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [isTISNumberVerified, setIsTISNumberVerified] = useState(false);

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (stageCodeList === null) {
      dispatch(fetchAppStageCode());
    }
  }, [stageCodeList, dispatch]);

  useEffect(() => {
    if (open && project) {
      setTisNumberPart1("");
      setTisNumberPart2("");
      setTisNumberPart3("");
      setTisNumberPart4("");
      setIssueDate(dayjs());
      setIsTISNumberVerified(false);
    }
  }, [open, project]);

  const handleCheckDuplicate = async () => {
    const tisNumber = `${tisNumberPart1}-${tisNumberPart2}-${tisNumberPart3}-${tisNumberPart4}`.replace(
      /^-+|-+$/g,
      ""
    );

    if (!tisNumber || tisNumber === "--") {
      showWarning("แจ้งเตือน", "กรุณากรอกเลข มอก.");
      return;
    }

    try {
      setChecking(true);
      dispatch(setGlobalLoading(true));

      // ตรวจสอบข้อมูลซ้ำจาก Table tb3_tis
      const result = await checkTISNumber(tisNumber);

      if (result.exists) {
        setIsTISNumberVerified(false);
        showError(
          "ข้อมูลซ้ำ",
          `เลข มอก. ${tisNumber} มีอยู่ในระบบแล้ว กรุณาใช้เลขอื่น`
        );
      } else {
        setIsTISNumberVerified(true);
        showSuccess("ตรวจสอบสำเร็จ", `เลข มอก. ${tisNumber} สามารถใช้ได้`);
      }
    } catch (err: any) {
      console.error("Error checking TIS number:", err);
      if (err?.response?.status === 404) {
        // ถ้าไม่พบข้อมูลซ้ำ (404) แสดงว่าสามารถใช้ได้
        setIsTISNumberVerified(true);
        showSuccess("ตรวจสอบสำเร็จ", `เลข มอก. ${tisNumber} สามารถใช้ได้`);
      } else {
        setIsTISNumberVerified(false);
        showError(
          "เกิดข้อผิดพลาด",
          err?.response?.data?.message || "ไม่สามารถตรวจสอบเลข มอก. ได้"
        );
      }
    } finally {
      setChecking(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    const tisNumber = `${tisNumberPart1}-${tisNumberPart2}-${tisNumberPart3}-${tisNumberPart4}`.replace(
      /^-+|-+$/g,
      ""
    );

    if (!tisNumber || tisNumber === "--") {
      showError("เกิดข้อผิดพลาด", "กรุณากรอกเลข มอก.");
      return;
    }

    if (!issueDate) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกวันที่ออกเลข มอก.");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลออกเลข มอก. หรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const issueDateStr = issueDate.format("YYYY-MM-DD");

      // กำหนด stage codes และ logs
      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [
        {
          stageCode: "47.20",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "47.20")?.name || "",
          stageDate: issueDateStr,
        },
        {
          stageCode: "47.60",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "47.60")?.name || "",
          stageDate: issueDateStr,
        },
        {
          stageCode: "47.99",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "47.99")?.name || "",
          stageDate: issueDateStr,
        },
        {
          stageCode: "48.00",
          stageDescription:
            stageCodeList?.find((stage) => stage.code === "48.00")?.name || "",
          stageDate: issueDateStr,
        },
      ];

      const newStageCode = "48.00";
      const newStageUiMsg =
        stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
        "";

      // อัปเดตโครงการ
      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        tis_number: tisNumber, // เก็บเลข มอก. ใน project
        tis_number_issue_date:issueDateStr,
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

      showSuccess("บันทึกสำเร็จ", "บันทึกข้อมูลออกเลข มอก. เรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving TIS number:", err);
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
          ออกเลข มอก.
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

          {/* ออกเลข มอก. */}
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
              ออกเลข มอก.
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
              }}
            >
              <TextField
                size="small"
                value={tisNumberPart1}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setTisNumberPart1(value);
                  setIsTISNumberVerified(false); // Reset verification when number changes
                }}
                placeholder="XXXX"
                sx={{ width: "80px" }}
                inputProps={{ maxLength: 4 }}
              />
              <Typography sx={{ mx: 0.5 }}>-</Typography>
              <TextField
                size="small"
                value={tisNumberPart2}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setTisNumberPart2(value);
                  setIsTISNumberVerified(false); // Reset verification when number changes
                }}
                placeholder="YYYY"
                sx={{ width: "80px" }}
                inputProps={{ maxLength: 4 }}
              />
              <Typography sx={{ mx: 0.5 }}>-</Typography>
              <TextField
                size="small"
                value={tisNumberPart3}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setTisNumberPart3(value);
                  setIsTISNumberVerified(false); // Reset verification when number changes
                }}
                placeholder="ZZ"
                sx={{ width: "60px" }}
                inputProps={{ maxLength: 2 }}
              />
              <Typography sx={{ mx: 0.5 }}>-</Typography>
              <TextField
                size="small"
                value={tisNumberPart4}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                  setTisNumberPart4(value);
                  setIsTISNumberVerified(false); // Reset verification when number changes
                }}
                placeholder="AA"
                sx={{ width: "60px" }}
                inputProps={{ maxLength: 2 }}
              />
              <Button
                variant="outlined"
                startIcon={<Search />}
                onClick={handleCheckDuplicate}
                disabled={checking || loading}
                sx={{
                  textTransform: "none",
                  ml: 2,
                  whiteSpace: "nowrap",
                }}
              >
                ตรวจสอบ
              </Button>
            </Box>
          </Box>

          {/* วันที่ออกเลข มอก. */}
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
              วันที่ออกเลข มอก.
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <DatePicker
                value={issueDate}
                onChange={(newValue) => setIssueDate(newValue)}
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
            !issueDate ||
            !tisNumberPart1 ||
            !tisNumberPart2 ||
            !tisNumberPart3 ||
            !tisNumberPart4 ||
            !isTISNumberVerified
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

export default IssueTISNumberDialog;
