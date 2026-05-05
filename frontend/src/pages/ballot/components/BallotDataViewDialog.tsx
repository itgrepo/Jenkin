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
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  Download,
} from "@mui/icons-material";
import { BallotRequest, BallotResponse } from "@models/ballot";
import { getBallotResponses } from "@services/ballotService";
import * as XLSX from "xlsx";
import { showSuccess, showError } from "@components/Swal";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";

interface BallotDataViewDialogProps {
  open: boolean;
  onClose: () => void;
  request: BallotRequest;
}

export default function BallotDataViewDialog({
  open,
  onClose,
  request,
}: BallotDataViewDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const [responses, setResponses] = useState<BallotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && request.id) {
      loadResponseData();
    }
  }, [open, request.id]);

  const loadResponseData = async () => {
    if (!request.id) return;

    try {
      setLoading(true);
      setError(null);
      dispatch(setGlobalLoading(true));

      const res = await getBallotResponses({
        ballotRequestId: request.id,
      });

      setResponses(res.data || []);
    } catch (err: any) {
      console.error("Error loading ballot responses:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคำตอบได้"
      );
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคำตอบได้"
      );
      setResponses([]);
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const summary: Record<string, number> = {};
    responses.forEach((response) => {
      if (response.answers && response.answers.length > 0) {
        response.answers.forEach((answer) => {
          const key = answer.answerText || answer.textInput || "ไม่มีคำตอบ";
          summary[key] = (summary[key] || 0) + 1;
        });
      } else {
        // ถ้าไม่มีคำตอบเลย
        summary["ไม่มีคำตอบ"] = (summary["ไม่มีคำตอบ"] || 0) + 1;
      }
    });
    return summary;
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = responses.map((response, index) => {
        const row: any = {
          "ลำดับ": index + 1,
          "ชื่อผู้ตอบ": response.userName,
          "อีเมล": response.userEmail || "",
          "วันที่ตอบ": response.submittedAt
            ? new Date(response.submittedAt).toLocaleString("th-TH")
            : "-",
        };

        // Add answers
        if (response.answers && response.answers.length > 0) {
          response.answers.forEach((answer, ansIndex) => {
            row[`คำตอบ ${ansIndex + 1}`] = answer.answerText || answer.textInput || "";
            if (answer.textInput && answer.answerText) {
              row[`ข้อความเพิ่มเติม ${ansIndex + 1}`] = answer.textInput;
            }
          });
        } else {
          row["คำตอบ"] = "ไม่มีคำตอบ";
        }

        return row;
      });

      // Add summary sheet
      const summary = calculateSummary();
      const summaryData = Object.entries(summary).map(([answer, count]) => ({
        คำตอบ: answer,
        จำนวน: count,
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws1 = XLSX.utils.json_to_sheet(exportData);
      const ws2 = XLSX.utils.json_to_sheet([
        { รายการ: "จำนวนผู้ตอบทั้งหมด", จำนวน: responses.length },
        ...summaryData,
      ]);

      XLSX.utils.book_append_sheet(wb, ws1, "ข้อมูลคำตอบ");
      XLSX.utils.book_append_sheet(wb, ws2, "สรุปผล");

      // Export
      const fileName = `ข้อคิดเห็น_${request.name}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showSuccess("สำเร็จ", "ส่งออกข้อมูลเป็น Excel เรียบร้อยแล้ว");
    } catch (err) {
      console.error("Error exporting Excel:", err);
      showError("เกิดข้อผิดพลาด", "ไม่สามารถส่งออกข้อมูลได้");
    }
  };

  const summary = calculateSummary();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          ดูข้อมูลข้อคิดเห็น: {request.name}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>กำลังโหลดข้อมูล...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography color="error">{error}</Typography>
            <Button
              variant="outlined"
              onClick={loadResponseData}
              sx={{ mt: 2 }}
            >
              ลองอีกครั้ง
            </Button>
          </Box>
        ) : (
          <>
            {/* Question Section */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                คำถาม:
              </Typography>
              <Typography variant="body1">{request.questionText}</Typography>
            </Paper>

            {/* Responses Table */}
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "primary.main" }}>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      ลำดับ
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      ชื่อผู้ตอบ
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      อีเมล
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      คำตอบ
                    </TableCell>
                    <TableCell sx={{ color: "white", fontWeight: 700 }}>
                      วันที่ตอบ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {responses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          ยังไม่มีผู้ตอบ
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    responses.map((response, index) => (
                      <TableRow key={response.id} hover>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{response.userName}</TableCell>
                        <TableCell>{response.userEmail || "-"}</TableCell>
                        <TableCell>
                          <Box>
                            {response.answers && response.answers.length > 0 ? (
                              response.answers.map((answer, ansIndex) => (
                                <Box key={ansIndex} sx={{ mb: 1 }}>
                                  <Typography variant="body2">
                                    {answer.answerText || answer.textInput || "-"}
                                  </Typography>
                                  {answer.textInput && answer.answerText && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block", mt: 0.5 }}
                                    >
                                      {answer.textInput}
                                    </Typography>
                                  )}
                                </Box>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                ไม่มีคำตอบ
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {response.submittedAt
                            ? new Date(response.submittedAt).toLocaleString(
                                "th-TH"
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary Section */}
            <Paper sx={{ p: 3, bgcolor: "background.default" }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                สรุปผล
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                จำนวนผู้ตอบแบบสอบถามทั้งหมด:{" "}
                <strong>{responses.length} คน</strong>
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                สรุปคำตอบแต่ละข้อ:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {Object.entries(summary).map(([answer, count]) => (
                  <Chip
                    key={answer}
                    label={`${answer}: ${count} คน`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: "background.default" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ textTransform: "none" }}
        >
          ปิด
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<Download />}
          onClick={handleExportExcel}
          disabled={responses.length === 0}
          sx={{ textTransform: "none" }}
        >
          Export Excel
        </Button>
      </DialogActions>
    </Dialog>
  );
}

