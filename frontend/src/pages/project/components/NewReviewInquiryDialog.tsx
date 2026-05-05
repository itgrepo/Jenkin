import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import dayjs from "dayjs";
import { Project, ProjectReview } from "@models/projects";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { RootState } from "@store/index";
import { updateProjectReview, upsertProjectReviewLog } from "@services/projectService";

interface NewReviewInquiryDialogProps {
  open: boolean;
  onClose: () => void;
  review: Project | null;
  onSuccess?: () => void;
}

const NewReviewInquiryDialog: React.FC<NewReviewInquiryDialogProps> = ({
  open,
  onClose,
  review,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  useEffect(() => {
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }
  }, [dispatch, stageCodeList]);

  useEffect(() => {
    if (open) {
      setActiveTab(0);
    }
  }, [open]);

  const handleSave = async () => {
    if (!review || !review.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลทบทวนมาตรฐาน");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการแก้ไข Ballot เพื่อเวียนสอบถามต่อไปหรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // TODO: เรียก API เพื่อแก้ไข Ballot เดิมเพื่อเวียนสอบถามต่อไป
      // await updateReviewBallot({
      //   reviewId: review.id,
      //   // ... other ballot data
      // });

      const newStageCode = "90.40";
      const newStageUiMsg =
        stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
        "";

      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [
          {
            stageCode: "90.40",
            stageDescription:
              stageCodeList?.find((stage) => stage.code === "90.40")?.name || "",
            stageDate: dayjs().format("YYYY-MM-DD"),
          },
        ];

        const updatedReview: Partial<ProjectReview> = {
          id: review.id,
          stageCode: newStageCode,
          stageUiMsg: newStageUiMsg,
        };
  
        await updateProjectReview(updatedReview);

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

      showSuccess("บันทึกสำเร็จ", "แก้ไข Ballot เพื่อเวียนสอบถามเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error updating review ballot:", err);
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
          เพิ่มการเวียนขอข้อคิดเห็น
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

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
              },
            }}
          >
            <Tab label="ส่วนที่ 1: ข้อมูลชุดคำถาม" />
            <Tab label="ส่วนที่ 2: เรื่อง/ประเภทการเวียน" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                ส่วนที่ 1: ข้อมูลชุดคำถาม
              </Typography>
              {/* TODO: แสดงข้อมูล Ballot ที่สร้างไว้ก่อนหน้านี้ (Section 1 และ Section 2) */}
              {/* ข้อมูลเรื่องที่ต้องการทบทวน(ร่างมาตรฐาน) เป็น readonly */}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                ส่วนที่ 2: เรื่อง/ประเภทการเวียน
              </Typography>
              {/* TODO: แสดงข้อมูล Ballot ที่สร้างไว้ก่อนหน้านี้ (Section 2) */}
            </Box>
          )}
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
          disabled={loading}
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

export default NewReviewInquiryDialog;
