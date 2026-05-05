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
  Link,
} from "@mui/material";
import { Close, Save } from "@mui/icons-material";
import {
  BallotRequest,
  BallotResponse,
  BallotResponseAnswer,
} from "@models/ballot";
import {
  upsertBallotResponse,
  getBallotResponseByRequestAndUser,
} from "@services/ballotService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { fetchAppBallotAnswerType } from "@store/globalSlice";
import QRCode from "qrcode";
import { getFileDownloadUrl } from "@utils/fileService";
import { getMinioFullUrl } from "@utils/index";

interface BallotResponseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  request: BallotRequest;
}

export default function BallotResponseDialog({
  open,
  onClose,
  onSave,
  request,
}: BallotResponseDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { ballotAnswerTypeList } = useAppSelector((state) => state.global);

  const [formData, setFormData] = useState<BallotResponse>({
    ballotRequestId: request.id!,
    userId: currentUser?.id || 0,
    userName: currentUser?.name || "",
    userEmail: currentUser?.email || "",
    answers: [],
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [textInput, setTextInput] = useState("");
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<number, string>>({});
  const [existingResponse, setExistingResponse] =
    useState<BallotResponse | null>(null);

  useEffect(() => {
    if (open && request.id) {
      loadExistingResponse();
      generateQRCodes();
      resetForm();
    }
  }, [open, request.id]);

  useEffect(() => {
    if (!ballotAnswerTypeList) {
      dispatch(fetchAppBallotAnswerType());
    }
  }, [ballotAnswerTypeList, dispatch]);

  const getAnswerTypeCode = (): string => {
    const answerType = ballotAnswerTypeList?.find(
      (t: any) => t.id === request.answerType
    );
    return answerType?.name || "";
  };

  const loadExistingResponse = async () => {
    if (!request.id || !currentUser?.id) return;

    try {
      // Check if user already responded
      const response = await getBallotResponseByRequestAndUser(
        request.id,
        currentUser.id
      );
      if (response) {
        setExistingResponse(response);
        const answerTypeCode = getAnswerTypeCode();
        // Load existing answers
        if (response.answers && response.answers.length > 0) {
          const firstAnswer = response.answers[0];
          if (firstAnswer.answerText) {
            if (answerTypeCode === "Single choice") {
              setSelectedAnswer(firstAnswer.answerText);
            } else if (answerTypeCode === "Multiple choice") {
              setSelectedAnswers(
                response.answers
                  .map((a: BallotResponseAnswer) => a.answerText)
                  .filter((a: string | undefined): a is string => !!a)
              );
            }
          }
          if (firstAnswer.textInput) {
            setTextInput(firstAnswer.textInput);
          }
        }
      } else {
        setExistingResponse(null);
      }
    } catch (err) {
      // No existing response
      setExistingResponse(null);
    }
  };

  const resetForm = () => {
    setSelectedAnswer("");
    setSelectedAnswers([]);
    setTextInput("");
    setFormData({
      ballotRequestId: request.id!,
      userId: currentUser?.id || 0,
      userName: currentUser?.name || "",
      userEmail: currentUser?.email || "",
      answers: [],
    });
  };

  const generateQRCodes = async () => {
    if (!request.attachments || request.attachments.length === 0) return;

    const qrCodes: Record<number, string> = {};
    for (const attachment of request.attachments) {
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(getMinioFullUrl(attachment.filePath || "") || "");
        qrCodes[attachment.id || 0] = qrCodeDataUrl;
      } catch (err) {
        console.error("Error generating QR code:", err);
      }
    }
    setQrCodeUrls(qrCodes);
  };

  const handleSave = async () => {
    // Validate based on answer type
    const answerTypeCode = getAnswerTypeCode();

    if (answerTypeCode === "Single choice" && !selectedAnswer) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกคำตอบ");
      return;
    }

    if (answerTypeCode === "Multiple choice" && selectedAnswers.length === 0) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกคำตอบอย่างน้อย 1 ข้อ");
      return;
    }

    if (answerTypeCode === "Text" && !textInput.trim()) {
      showError("เกิดข้อผิดพลาด", "กรุณากรอกคำตอบ");
      return;
    }

    const confirmResult = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกคำตอบหรือไม่?",
      "บันทึก",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      // Prepare answers
      const answers: BallotResponseAnswer[] = [];

      if (answerTypeCode === "Single choice") {
        const selectedAnswerObj = request.answers?.find(
          (a) => a.text === selectedAnswer
        );
        if (selectedAnswerObj) {
          answers.push({
            ballotDraftAnswerId: selectedAnswerObj.id,
            answerText: selectedAnswer,
            textInput: request.hasTextInput ? textInput : undefined,
            displayOrder: selectedAnswerObj.displayOrder,
          });
        }
      } else if (answerTypeCode === "Multiple choice") {
        selectedAnswers.forEach((answerText) => {
          const answerObj = request.answers?.find((a) => a.text === answerText);
          if (answerObj) {
            answers.push({
              ballotDraftAnswerId: answerObj.id,
              answerText: answerText,
              displayOrder: answerObj.displayOrder,
            });
          }
        });
        if (request.hasTextInput && textInput) {
          answers.push({
            textInput: textInput,
            displayOrder: (request.answers?.length || 0) + 1,
          });
        }
      } else if (answerTypeCode === "Text") {
        answers.push({
          textInput: textInput,
          displayOrder: 1,
        });
      }

      const responseToSave: BallotResponse = {
        ...formData,
        id: existingResponse?.id, // Update if exists
        answers: answers,
      };

      await upsertBallotResponse(responseToSave);
      showSuccess("สำเร็จ", "บันทึกคำตอบเรียบร้อยแล้ว");
      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Error saving response:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกคำตอบได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const answerTypeCode = getAnswerTypeCode();
  const sortedAnswers = [...(request.answers || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

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
            maxHeight: isMobileDialog ? "100vh" : "90vh",
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
        ตอบข้อคิดเห็น: {request.name}
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

            {/* ข้อความคำถาม */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" sx={{ mb: 2, color: "white" }}>
                คำถาม : <strong>{request.questionText}</strong>
              </Typography>
            </Box>

            {/* ตัวเลือกคำตอบ */}
            <Box sx={{ mb: 3 }}>
              {answerTypeCode === "Single choice" && (
                <RadioGroup
                  value={selectedAnswer}
                  onChange={(e) => setSelectedAnswer(e.target.value)}
                >
                  {sortedAnswers.map((answer, index) => (
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
              )}

              {answerTypeCode === "Multiple choice" && (
                <Box>
                  {sortedAnswers.map((answer, index) => (
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
                                setSelectedAnswers([
                                  ...selectedAnswers,
                                  answer.text,
                                ]);
                              } else {
                                setSelectedAnswers(
                                  selectedAnswers.filter(
                                    (a) => a !== answer.text
                                  )
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
              )}

              {answerTypeCode === "Text" && (
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
                      color: "white",
                      "& fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "rgba(255, 255, 255, 0.7)",
                      },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "rgba(255, 255, 255, 0.5)",
                    },
                  }}
                />
              )}
            </Box>

            {/* ช่องใส่ข้อความ (ถ้ามี) */}
            {request.hasTextInput &&
              answerTypeCode !== "Text" &&
              (answerTypeCode === "Single choice"
                ? selectedAnswer
                : selectedAnswers.length > 0) && (
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
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.7)",
                        },
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "rgba(255, 255, 255, 0.5)",
                      },
                    }}
                  />
                </Box>
              )}

            {/* สิ่งที่ส่งมาด้วย */}
            {request.attachments && request.attachments.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1.5, fontWeight: 600, color: "white" }}
                >
                  สิ่งที่ส่งมาด้วย
                </Typography>
                {request.attachments.map((attachment, index) => (
                  <Box key={index} sx={{ ml: 2, mb: 0.5 }}>
                    <Link
                     href={getFileDownloadUrl(attachment.filePath || "")}
                      rel="noopener noreferrer"
                      sx={{
                        color: "#90caf9",
                        textDecoration: "underline",
                        "&:hover": {
                          color: "#bbdefb",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {index + 1}. {attachment.fileName || `ไฟล์ ${index + 1}`}
                    </Link>
                  </Box>
                ))}
              </Box>
            )}

            {/* QR Code สำหรับดาวน์โหลดเอกสาร */}
            {request.attachments && request.attachments.length > 0 && (
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
                  {request.attachments.map((attachment, index) => (
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
                          {qrCodeUrls[attachment.id || 0] ? (
                            <img
                              src={qrCodeUrls[attachment.id || 0]}
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
                              <Typography
                                variant="caption"
                                sx={{ color: "#424242" }}
                              >
                                Loading QR...
                              </Typography>
                            </Box>
                          )}
                        </Paper>
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
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ textTransform: "none" }}
          fullWidth={isMobileDialog}
        >
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Save />}
          onClick={handleSave}
          sx={{ textTransform: "none" }}
          fullWidth={isMobileDialog}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
