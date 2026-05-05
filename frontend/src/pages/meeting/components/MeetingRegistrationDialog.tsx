import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Add, Delete } from "@mui/icons-material";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { showError, showSuccess } from "@components/Swal";
import { registerForMeeting } from "@services/meetingService";

interface MeetingRegistrationDialogProps {
  open: boolean;
  meetingId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MeetingRegistrationDialog({
  open,
  meetingId,
  onClose,
  onSuccess,
}: MeetingRegistrationDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [followerNames, setFollowerNames] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);

  const handleAddFollower = () => {
    setFollowerNames([...followerNames, ""]);
  };

  const handleRemoveFollower = (index: number) => {
    if (followerNames.length > 1) {
      setFollowerNames(followerNames.filter((_, i) => i !== index));
    }
  };

  const handleFollowerChange = (index: number, value: string) => {
    const updated = [...followerNames];
    updated[index] = value;
    setFollowerNames(updated);
  };

  const handleRegister = async () => {
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // Filter out empty follower names
      const validFollowerNames = followerNames.filter((name) => name.trim() !== "");

      await registerForMeeting(meetingId, validFollowerNames);
      showSuccess("สำเร็จ", "ลงทะเบียนเข้าร่วมประชุมเรียบร้อยแล้ว");
      
      // Reset form
      setFollowerNames([""]);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error("Error registering for meeting:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลงทะเบียนได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleCancel = () => {
    setFollowerNames([""]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
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
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          ลงทะเบียนเข้าร่วมประชุม
        </Typography>
        <IconButton
          onClick={handleCancel}
          sx={{ color: "white" }}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3,mt:2 }}>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          กรุณากรอกชื่อผู้ติดตาม (ถ้ามี) สามารถใส่ได้หลายชื่อ
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {followerNames.map((name, index) => (
            <Box
              key={index}
              sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}
            >
              <TextField
                label={`ชื่อผู้ติดตาม ${index + 1}`}
                value={name}
                onChange={(e) => handleFollowerChange(index, e.target.value)}
                fullWidth
                size="small"
                placeholder="กรุณากรอกชื่อ-นามสกุล"
              />
              {followerNames.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => handleRemoveFollower(index)}
                  size="small"
                  sx={{ mt: 0.5 }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>

        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddFollower}
          sx={{ mt: 2 }}
          size="small"
        >
          เพิ่มผู้ติดตาม
        </Button>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel} variant="outlined" disabled={loading}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleRegister}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          ลงทะเบียน
        </Button>
      </DialogActions>
    </Dialog>
  );
}

