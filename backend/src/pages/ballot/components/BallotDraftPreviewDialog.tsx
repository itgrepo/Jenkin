import { useState, useEffect } from "react";
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
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { BallotDraft } from "@models/ballot";
import QRCode from "qrcode";
import { getMinioFullUrl } from "@utils/index";

interface BallotDraftPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  draft: BallotDraft | null;
}

export default function BallotDraftPreviewDialog({
  open,
  onClose,
  draft,
}: BallotDraftPreviewDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [textInput, setTextInput] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<number, string>>({});


  useEffect(() => {
    if (open) {
      setSelectedAnswer("");
      setTextInput("");
      setSelectedAnswers([]);
      generateQRCodes();
    }
  }, [open, draft]);

  const generateQRCodes = async () => {
    if (!draft?.attachments || draft?.attachments.length === 0) return;
    
    const urls: Record<number, string> = {};
    for (let i = 0; i < draft.attachments.length; i++) {
      const attachment = draft.attachments[i];
      try {
        const dataUrl = await QRCode.toDataURL(getMinioFullUrl(attachment.filePath || "") || "", {
          width: 120,
          margin: 1,
        });

        console.log("qrcode:",dataUrl)
        urls[i] = dataUrl;
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    }
    setQrCodeUrls(urls);
  };

  const renderAnswerOptions = () => {
    if (draft?.answerType === 3) {
      return (
        <TextField
          fullWidth
          multiline
          rows={4}
          placeholder="กรอกข้อความ"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.1)",
            "& .MuiOutlinedInput-root": {
              bgcolor: "rgba(255, 255, 255, 0.1)",
            },
          }}
        />
      );
    }

    if (draft?.answerType === 2) {
      return (
        <RadioGroup
          value={selectedAnswer}
          onChange={(e) => setSelectedAnswer(e.target.value)}
        >
          {draft?.answers?.map((answer, index) => (
            <Paper
              key={index}
              sx={{
                mb: 1.5,
                p: 2,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <FormControlLabel
                value={answer.text}
                control={
                  <Radio
                    sx={{
                      color: "white",
                      "&.Mui-checked": {
                        color: "white",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body1" sx={{ color: "white" }}>
                    {answer.text}
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Paper>
          ))}
        </RadioGroup>
      );
    }

    if (draft?.answerType === 1) {
      return (
        <Box>
          {draft?.answers?.map((answer, index) => (
            <Paper
              key={index}
              sx={{
                mb: 1.5,
                p: 2,
                bgcolor: "rgba(255, 255, 255, 0.1)",
                borderRadius: 1,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedAnswers.includes(answer.text)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAnswers([...selectedAnswers, answer.text]);
                      } else {
                        setSelectedAnswers(
                          selectedAnswers.filter((a) => a !== answer.text)
                        );
                      }
                    }}
                    sx={{
                      color: "white",
                      "&.Mui-checked": {
                        color: "white",
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body1" sx={{ color: "white" }}>
                    {answer.text}
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Paper>
          ))}
        </Box>
      );
    }

    return null;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobileDialog}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobileDialog ? 0 : 2,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          py: 2,
          fontWeight: 700,
        }}
      >
        ตัวอย่างหน้าจอ Preview
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: "#f5f5f5" }}>
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 800,
              bgcolor: "#424242",
              borderRadius: 2,
              p: 4,
              color: "white",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                mb: 4,
                textAlign: "center",
                color: "white",
              }}
            >
              แบบเสนอข้อคิดเห็น
            </Typography>

            {/* เรื่อง (ชื่อแบบร่าง) */}
            {/* <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "white" }}
              >
                เรื่อง {draft?.name}
              </Typography>
            </Box> */}

            {/* ข้อความคำถาม */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2, color: "white" }}>
              เรื่อง {draft?.questionText}
              </Typography>
            </Box>

            {/* ตัวเลือกคำตอบ */}
            <Box sx={{ mb: 3 }}>
              {renderAnswerOptions()}
            </Box>

          {/* ช่องใส่ข้อความ (ถ้ามี) */}
          {draft?.hasTextInput && (
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="กรอกข้อความเพิ่มเติม..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    "& fieldset": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                  },
                }}
              />
            </Box>
          )}

          {/* สิ่งที่ส่งมาด้วย */}
          {draft?.attachments && draft?.attachments.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ mb: 1.5, fontWeight: 600, color: "white" }}
              >
                สิ่งที่ส่งมาด้วย
              </Typography>
              {draft?.attachments.map((attachment, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{ ml: 2, mb: 0.5, color: "white" }}
                >
                  {index + 1}. {attachment.fileName}
                </Typography>
              ))}
            </Box>
          )}

          {/* หมายเหตุ */}
          {draft?.noteText && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 600, color: "white" }}
              >
                หมายเหตุ
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-line", color: "white" }}
              >
                {draft?.noteText}
              </Typography>
            </Box>
          )}

          {/* QR Code สำหรับดาวน์โหลดเอกสาร */}
          {draft?.attachments && draft?.attachments?.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography
                variant="body2"
                sx={{
                  mb: 2,
                  fontWeight: 600,
                  textAlign: "center",
                  color: "white",
                }}
              >
                QR code สำหรับดาวน์โหลดเอกสารประกอบการพิจารณา
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {draft?.attachments?.map((_, index) => (
                  <Grid key={index} size={{ xs: 6, sm: 4 }}>
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          bgcolor: "white",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          borderRadius: 1,
                        }}
                      >
                        {qrCodeUrls[index] ? (
                          <img
                            src={qrCodeUrls[index]}
                            alt={`QR Code ${index + 1}`}
                            style={{ width: 120, height: 120 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 120,
                              height: 120,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#424242" }}>
                              Loading QR...
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                      {index === 0 && (
                        <Typography
                          variant="caption"
                          sx={{
                            textAlign: "center",
                            fontSize: "0.7rem",
                            color: "white",
                          }}
                        >
                          (ตารางสำหรับ comment)
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobileDialog}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}

