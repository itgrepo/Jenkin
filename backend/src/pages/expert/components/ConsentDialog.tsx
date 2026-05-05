import  { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";

interface ConsentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

interface ConsentPart {
  id: string;
  title: string;
  description: string;
  checked: boolean;
}

export default function ConsentDialog({
  open,
  onClose,
  onConfirm,
}: ConsentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [consentParts, setConsentParts] = useState<ConsentPart[]>([
    {
      id: "part1",
      title: "ส่วนที่ 1: การเก็บรวบรวมข้อมูลส่วนบุคคล",
      description:
        "ยินยอมให้เก็บรวบรวมข้อมูลส่วนบุคคลเพื่อใช้ในการลงทะเบียนเป็นผู้เชี่ยวชาญ",
      checked: false,
    },
    {
      id: "part2",
      title: "ส่วนที่ 2: การใช้ข้อมูลส่วนบุคคล",
      description:
        "ยินยอมให้ใช้ข้อมูลส่วนบุคคลเพื่อการติดต่อและประสานงานในฐานะผู้เชี่ยวชาญ",
      checked: false,
    },
    {
      id: "part3",
      title: "ส่วนที่ 3: การทำธุรกรรมทางอิเล็กทรอนิกส์",
      description:
        "ยินยอมให้ใช้ข้อมูลส่วนบุคคลเพื่อการทำธุรกรรมทางอิเล็กทรอนิกส์ เช่น การชำระเงิน การส่งเอกสาร",
      checked: false,
    },
  ]);

  const handlePartChange = (id: string) => {
    setConsentParts((prev) =>
      prev.map((part) =>
        part.id === id ? { ...part, checked: !part.checked } : part
      )
    );
  };

  const handleSelectAll = () => {
    const allChecked = consentParts.every((part) => part.checked);
    setConsentParts((prev) =>
      prev.map((part) => ({ ...part, checked: !allChecked }))
    );
  };

  const allPartsChecked = consentParts.every((part) => part.checked);

  const handleConfirm = () => {
    if (allPartsChecked) {
      onConfirm();
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
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? "100vh" : "90vh",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 3,
          px: 4,
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
          ยินยอมให้ใช้ข้อมูลส่วนบุคคล
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

      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" paragraph>
            เพื่อให้การลงทะเบียนเป็นผู้เชี่ยวชาญเป็นไปอย่างสมบูรณ์
            กรุณาให้ความยินยอมในการใช้ข้อมูลส่วนบุคคลตามรายละเอียดด้านล่าง
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={allPartsChecked}
                onChange={handleSelectAll}
                indeterminate={
                  consentParts.some((p) => p.checked) && !allPartsChecked
                }
              />
            }
            label={
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ยินยอมทั้งหมด
              </Typography>
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {consentParts.map((part) => (
            <Paper
              key={part.id}
              elevation={1}
              sx={{
                p: 2,
                border: part.checked ? "2px solid #1976d2" : "1px solid #e0e0e0",
                borderRadius: 2,
                bgcolor: part.checked ? "rgba(25, 118, 210, 0.05)" : "#fff",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={part.checked}
                    onChange={() => handlePartChange(part.id)}
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {part.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {part.description}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", m: 0 }}
              />
            </Paper>
          ))}
        </Box>

        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: "info.light",
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "info.main",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            <strong>หมายเหตุ:</strong> ใน consent ควรระบุข้อมูลการทำธุระกรรมทาง
            Electronic ด้วย
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!allPartsChecked}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
        >
          ยืนยัน
        </Button>
      </DialogActions>
    </Dialog>
  );
}

