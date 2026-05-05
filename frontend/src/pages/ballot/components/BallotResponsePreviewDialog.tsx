import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
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
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  Chip,
  Avatar,
  Link,
} from "@mui/material";
import {
  Close,
  ExpandMore,
  Person,
  AccessTime,
} from "@mui/icons-material";
import { BallotRequest, BallotResponse } from "@models/ballot";
import { getBallotResponses } from "@services/ballotService";
import QRCode from "qrcode";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { showError } from "@components/Swal";
import { useAppSelector } from "@hooks/useRedux";
import { fetchAppBallotAnswerType } from "@store/globalSlice";
import { getFileDownloadUrl } from "@utils/fileService";
import { getMinioFullUrl } from "@utils/index";

interface BallotResponsePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  request: BallotRequest;
}

export default function BallotResponsePreviewDialog({
  open,
  onClose,
  request,
}: BallotResponsePreviewDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const { ballotAnswerTypeList } = useAppSelector((state) => state.global);

  const [responses, setResponses] = useState<BallotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!ballotAnswerTypeList) {
      dispatch(fetchAppBallotAnswerType());
    }
  }, [ballotAnswerTypeList, dispatch]);

  useEffect(() => {
    if (open && request.id) {
      loadResponses();
      generateQRCodes();
    }
  }, [open, request.id]);

  const getAnswerTypeCode = (): string => {
    const answerType = ballotAnswerTypeList?.find(
      (t: any) => t.id === request.answerType
    );
    // ใช้ code สำหรับการเปรียบเทียบ (Single choice, Multiple choice, Text)
    return answerType?.name || "";
  };

  const loadResponses = async () => {
    if (!request.id) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const res = await getBallotResponses({
        ballotRequestId: request.id,
      });

      setResponses(res.data || []);
    } catch (err: any) {
      console.error("Error loading responses:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคำตอบได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
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

  const answerTypeCode = getAnswerTypeCode();
  const sortedAnswers = [...(request.answers || [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
  );

  // Group responses by answer to show counts
  const getAnswerCounts = () => {
    const counts: Record<string, number> = {};
    responses.forEach((response) => {
      if (response.answers && response.answers.length > 0) {
        response.answers.forEach((answer) => {
          const key = answer.answerText || "";
          if (key) {
            counts[key] = (counts[key] || 0) + 1;
          }
        });
      }
    });
    return counts;
  };

  const answerCounts = getAnswerCounts();

  const renderAnswerOptions = () => {
    if (answerTypeCode === "Text") {
      return (
        <Box>
          {responses.length === 0 ? (
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.7)", fontStyle: "italic" }}>
              ยังไม่มีผู้ตอบ
            </Typography>
          ) : (
            responses.map((response, idx) => (
              <Paper
                key={idx}
                sx={{
                  mb: 1.5,
                  p: 2,
                  bgcolor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: 1,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Typography variant="body2" sx={{ color: "white", mb: 0.5 }}>
                  <strong>{response.userName}</strong>
                </Typography>
                <Typography variant="body1" sx={{ color: "white" }}>
                  {response.answers?.[0]?.textInput || response.answers?.[0]?.answerText || "-"}
                </Typography>
              </Paper>
            ))
          )}
        </Box>
      );
    }

    if (answerTypeCode === "Single choice") {
      return (
        <RadioGroup value="">
          {sortedAnswers.map((answer, index) => {
            const count = answerCounts[answer.text] || 0;
            const percentage =
              responses.length > 0
                ? ((count / responses.length) * 100).toFixed(1)
                : "0";
            return (
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
                      checked={false}
                      disabled
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ color: "white" }}>
                        {answer.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)", ml: 1 }}
                      >
                        ({count} คน, {percentage}%)
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Paper>
            );
          })}
        </RadioGroup>
      );
    }

    if (answerTypeCode === "Multiple choice") {
      return (
        <Box>
          {sortedAnswers.map((answer, index) => {
            const count = answerCounts[answer.text] || 0;
            const percentage =
              responses.length > 0
                ? ((count / responses.length) * 100).toFixed(1)
                : "0";
            return (
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
                      checked={false}
                      disabled
                      sx={{
                        color: "white",
                        "&.Mui-checked": {
                          color: "white",
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ color: "white" }}>
                        {answer.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255, 255, 255, 0.7)", ml: 1 }}
                      >
                        ({count} คน, {percentage}%)
                      </Typography>
                    </Box>
                  }
                  sx={{ m: 0 }}
                />
              </Paper>
            );
          })}
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
        ดูคำตอบ: {request.name}
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: "#f5f5f5" }}>
        {loading ? (
          <Box
            sx={{
              p: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : (
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
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                >
                  จำนวนผู้ตอบทั้งหมด: {responses.length} คน
                </Typography>
              </Box>

              <Divider sx={{ my: 3, bgcolor: "rgba(255, 255, 255, 0.2)" }} />

              {/* ตัวเลือกคำตอบพร้อมจำนวน */}
              <Box sx={{ mb: 3 }}>
                {renderAnswerOptions()}
              </Box>

              {/* รายชื่อผู้ตอบและคำตอบของแต่ละคน */}
              {responses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    รายชื่อผู้ตอบ ({responses.length} คน)
                  </Typography>
                  <Accordion
                    defaultExpanded
                    sx={{
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                      color: "white",
                      "&:before": {
                        display: "none",
                      },
                      "&.Mui-expanded": {
                        margin: 0,
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={
                        <ExpandMore sx={{ color: "white" }} />
                      }
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: 1,
                        "&.Mui-expanded": {
                          minHeight: 48,
                        },
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: "white" }}
                      >
                        ดูรายละเอียดคำตอบของแต่ละคน
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pt: 2 }}>
                      <List sx={{ width: "100%" }}>
                        {responses.map((response, index) => (
                          <Paper
                            key={response.id || index}
                            sx={{
                              mb: 2,
                              p: 2,
                              bgcolor: "rgba(255, 255, 255, 0.08)",
                              borderRadius: 1,
                              border: "1px solid rgba(255, 255, 255, 0.15)",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  bgcolor: "primary.main",
                                  width: 40,
                                  height: 40,
                                  mr: 2,
                                }}
                              >
                                <Person />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600, color: "white" }}
                                >
                                  {response.userName}
                                </Typography>
                                {response.userEmail && (
                                  <Typography
                                    variant="caption"
                                    sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                                  >
                                    {response.userEmail}
                                  </Typography>
                                )}
                              </Box>
                              {response.submittedAt && (
                                <Chip
                                  icon={<AccessTime />}
                                  label={new Date(
                                    response.submittedAt
                                  ).toLocaleString("th-TH", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                  size="small"
                                  sx={{
                                    bgcolor: "rgba(255, 255, 255, 0.1)",
                                    color: "white",
                                    "& .MuiChip-icon": {
                                      color: "rgba(255, 255, 255, 0.7)",
                                    },
                                  }}
                                />
                              )}
                            </Box>
                            <Divider
                              sx={{
                                my: 1.5,
                                bgcolor: "rgba(255, 255, 255, 0.1)",
                              }}
                            />
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  mb: 1,
                                  fontWeight: 600,
                                  color: "rgba(255, 255, 255, 0.9)",
                                }}
                              >
                                คำตอบ:
                              </Typography>
                              {response.answers &&
                              response.answers.length > 0 ? (
                                <Box>
                                  {response.answers.map((answer, ansIndex) => (
                                    <Box key={ansIndex} sx={{ mb: 1 }}>
                                      {answer.answerText && (
                                        <Chip
                                          label={answer.answerText}
                                          size="small"
                                          sx={{
                                            bgcolor: "rgba(76, 175, 80, 0.3)",
                                            color: "white",
                                            mr: 1,
                                            mb: 0.5,
                                            border: "1px solid rgba(76, 175, 80, 0.5)",
                                          }}
                                        />
                                      )}
                                      {answer.textInput && (
                                        <Paper
                                          sx={{
                                            mt: 1,
                                            p: 1.5,
                                            bgcolor: "rgba(255, 255, 255, 0.05)",
                                            borderRadius: 1,
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              color: "white",
                                              whiteSpace: "pre-wrap",
                                            }}
                                          >
                                            {answer.textInput}
                                          </Typography>
                                        </Paper>
                                      )}
                                    </Box>
                                  ))}
                                </Box>
                              ) : (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: "rgba(255, 255, 255, 0.5)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  ไม่มีคำตอบ
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
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
                                <Typography variant="caption" sx={{ color: "#424242" }}>
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
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" fullWidth={isMobileDialog}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}

