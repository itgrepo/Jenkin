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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Tabs,
  Tab,
  Grid,
  Tooltip,
} from "@mui/material";
import {
  Close,
  Save,
  Upload,
  Delete,
  Send,
  Description,
} from "@mui/icons-material";
import { Meeting } from "@models/meeting";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { showError, showSuccess, showConfirm, showWarning } from "@components/Swal";
import {
  getMeetingParticipants,
  upsertMeetingParticipant,
  getDisbursementSummary,
  upsertDisbursementSummary,
  submitDisbursementForApproval,
  getMeetingExpense,
} from "@services/meetingService";
import { generateExpenseClaimDocument } from "@utils/expenseDocumentGenerator";
import { uploadFileServer } from "@utils/fileService";
import {
  MeetingParticipant,
  DisbursementSummary,
  DisbursementExpenseItem,
} from "@models/meeting";

interface MeetingDisbursementSummaryDialogProps {
  open: boolean;
  meeting: Meeting;
  onClose: () => void;
  onSave?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`disbursement-tabpanel-${index}`}
      aria-labelledby={`disbursement-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function MeetingDisbursementSummaryDialog({
  open,
  meeting,
  onClose,
  onSave,
}: MeetingDisbursementSummaryDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);
  const [disbursementSummary, setDisbursementSummary] =
    useState<DisbursementSummary | null>(null);
  const [expenseFiles, setExpenseFiles] = useState<File[]>([]);
  const [expenseFileNames, setExpenseFileNames] = useState<string[]>([]);
  const [participantsSaved, setParticipantsSaved] = useState(false);
  const [expensesSaved, setExpensesSaved] = useState(false);

  useEffect(() => {
    if (open && meeting.id) {
      loadData();
    }
  }, [open, meeting.id]);

  const loadData = async () => {
    if (!meeting.id) return;
    try {
      dispatch(setGlobalLoading(true));
      
      // Load participants
      let participantsRes;
      try {
        participantsRes = await getMeetingParticipants(meeting.id);
        const loadedParticipants = participantsRes.data || [];
        setParticipants(loadedParticipants);
        // ถ้ามี participants และมี id แสดงว่าบันทึกแล้ว
        setParticipantsSaved(loadedParticipants.length > 0 && loadedParticipants.some(p => p.id));
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error("Error loading participants:", err);
        }
        setParticipants([]);
        setParticipantsSaved(false);
      }

      // Load disbursement summary
      let summaryRes;
      try {
        summaryRes = await getDisbursementSummary(meeting.id);
        setDisbursementSummary(summaryRes);
        if (summaryRes?.expenseFileNames) {
          setExpenseFileNames(summaryRes.expenseFileNames);
        }
        // ถ้ามี id แสดงว่าบันทึกแล้ว
        setExpensesSaved(!!summaryRes?.id);
      } catch (err: any) {
        // If no disbursement summary exists, create from meeting expense
        if (err?.response?.status === 404) {
          try {
            const expenseRes = await getMeetingExpense(meeting.id);
            if (expenseRes && expenseRes.expenses) {
              // Create disbursement summary from meeting expense
              const expenses: DisbursementExpenseItem[] = expenseRes.expenses.map(
                (exp) => ({
                  expenseTypeId: exp.expenseTypeId,
                  expenseTypeName: exp.expenseTypeName,
                  budgetAmount: exp.totalPrice,
                  actualExpense: exp.totalPrice || 0, // Default เป็นงบประมาณ
                })
              );
              setDisbursementSummary({
                meetingId: meeting.id,
                expenses: expenses,
                expenseFileNames: [],
                expenseFilePaths: [],
              });
              setExpensesSaved(false); // ยังไม่ได้บันทึก
            }
          } catch (expenseErr: any) {
            console.error("Error loading meeting expense:", expenseErr);
          }
        } else {
          console.error("Error loading disbursement summary:", err);
        }
        setExpensesSaved(false);
      }
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleParticipantChange = (
    index: number,
    field: "attended" | "sentRepresentative" | "meetingAllowance",
    value: boolean | string
  ) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      
      // ถ้าเลือก attended หรือ sentRepresentative ให้อีกตัวหนึ่งเป็น false
      if (field === "attended" && value === true) {
        updated[index].sentRepresentative = false;
      } else if (field === "sentRepresentative" && value === true) {
        updated[index].attended = false;
      }
      
      return updated;
    });
  };

  const handleSaveParticipants = async () => {
    if (!meeting.id) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      for (const participant of participants) {
        await upsertMeetingParticipant(meeting.id, participant);
      }

      await loadData();
      setParticipantsSaved(true);
      showSuccess("สำเร็จ", "บันทึกสรุปรายชื่อผู้เข้าร่วมประชุมเรียบร้อยแล้ว");
      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error("Error saving participants:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message ||
          "ไม่สามารถบันทึกสรุปรายชื่อผู้เข้าร่วมประชุมได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleExpenseChange = (
    index: number,
    field: "actualExpense",
    value: number
  ) => {
    if (!disbursementSummary) return;
    setDisbursementSummary((prev) => {
      if (!prev) return null;
      const updated = { ...prev };
      updated.expenses[index] = {
        ...updated.expenses[index],
        [field]: value,
      };
      return updated;
    });
  };

  const handleExpenseFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setExpenseFiles((prev) => [...prev, ...fileArray]);
      setExpenseFileNames((prev) => [
        ...prev,
        ...fileArray.map((f) => f.name),
      ]);
    }
  };

  const handleRemoveExpenseFile = (index: number) => {
    setExpenseFiles((prev) => prev.filter((_, i) => i !== index));
    setExpenseFileNames((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveExpenses = async () => {
    if (!meeting.id || !disbursementSummary) return;

    // Validate: ตรวจสอบว่าทุก expense มีค่าใช้จ่ายจริง
    const hasEmptyExpense = disbursementSummary.expenses.some(
      (exp) => !exp.actualExpense || exp.actualExpense === 0
    );

    if (hasEmptyExpense) {
      showError(
        "เกิดข้อผิดพลาด",
        "กรุณากรอกค่าใช้จ่ายจริงทุกรายการก่อนบันทึก"
      );
      return;
    }

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // Upload expense files
      const expenseFilePaths: string[] = [];
      for (const file of expenseFiles) {
        try {
          const filePath = await uploadFileServer({
            file: file,
            folder: `meeting-disbursement/${meeting.id}/expense-files`,
          });
          expenseFilePaths.push(filePath);
        } catch (err: any) {
          console.error("Error uploading expense file:", err);
          showError("เกิดข้อผิดพลาด", `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
          return;
        }
      }

      // Update disbursement summary with file paths
      const summaryToSave: DisbursementSummary = {
        ...disbursementSummary,
        expenseFileNames: expenseFileNames,
        expenseFilePaths: expenseFilePaths,
      };

      await upsertDisbursementSummary(meeting.id, summaryToSave);
      await loadData();
      setExpensesSaved(true);
      setExpenseFiles([]); // Clear uploaded files after saving

      showSuccess("สำเร็จ", "บันทึกสรุปค่าใช้จ่ายเรียบร้อยแล้ว");
      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error("Error saving expenses:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกสรุปค่าใช้จ่ายได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSubmitForApproval = async () => {
    if (!meeting.id) return;

    const confirmResult = await showConfirm(
      "ยืนยันการส่งอนุมัติ",
      "คุณต้องการส่งค่าใช้จ่ายเพื่ออนุมัติหรือไม่?",
      "ส่งอนุมัติ",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));
      await submitDisbursementForApproval(meeting.id, 1);
      showSuccess("สำเร็จ", "ส่งค่าใช้จ่ายเพื่ออนุมัติเรียบร้อยแล้ว");
      if (onSave) {
        onSave();
      }
      loadData();
    } catch (err: any) {
      console.error("Error submitting for approval:", err);
      if(err?.response?.data?.error==="Disbursement summary not found"){
        showWarning(
          "ตรวจสอบ",
          "กรุณากรอกข้อมูล ค่าใช้จ่ายจริงและกดบันทึก ก่อนการส่งอนุมัติ"
        );

      }else{
        showError(
          "เกิดข้อผิดพลาด",
          err?.response?.data?.error || "ไม่สามารถส่งค่าใช้จ่ายเพื่ออนุมัติได้"
        );
      }
    
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleGenerateDocument = async () => {
    if (!meeting.id || !disbursementSummary) {
      showError("เกิดข้อผิดพลาด", "กรุณาบันทึกสรุปค่าใช้จ่ายก่อนสร้างเอกสาร");
      return;
    }

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      const costCenterCode="2200700018";
      // สร้างเอกสาร PDF
      const pdfBlob = await generateExpenseClaimDocument({
        meeting,
        disbursementSummary,
        participants,
        requesterName: currentUser?.name || "",
        requesterPosition: "",
        department: meeting.responsiblePerson || "กำหนดมาตรฐาน",
        phone: "1780",
        costCenterCode: costCenterCode,
        projectName: "พื้นฐานด้านการสร้างความสามารถในการแข่งขัน",
        budgetCode: "22007290008002000000",
        expenseCategoryName: "งบดำเนินงาน",
        fundSourceCode: "6511200",
        mainActivityName: "กำหนดมาตรฐาน",
        mainActivityCode: "22007660000800000",
        subActivityName: "งานกำหนดมาตรฐานผลิตภัณฑ์อุตสาหกรรม",
        subActivityCode: "660000800000110",
        vendorCode: "",
        poNumber: "",
        migoNumber: "",
        bankAccountNumber: "",
        documentReference: `P${new Date().getFullYear() + 543}-${costCenterCode}`,
      });

      // ดาวน์โหลดไฟล์
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ใบเบิกค่าใช้จ่าย_${meeting.committeeNumber}_${meeting.instanceNumber}_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

     // showSuccess("สำเร็จ", "สร้างเอกสารค่าใช้จ่ายเรียบร้อยแล้ว");
    } catch (err: any) {
      console.error("Error generating document:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.message || "ไม่สามารถสร้างเอกสารค่าใช้จ่ายได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  // ต้องบันทึกทั้ง participants และ expenses ก่อนถึงจะส่งอนุมัติได้
  const canSubmitForApproval =
    !disbursementSummary?.status ||
    disbursementSummary?.status === "pending_approval" ||
    disbursementSummary?.status === "disbursement_review";
  const canGenerateDocument =
    disbursementSummary?.status === "disbursement_approved";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          py: 2,
          fontWeight: 700,
        }}
      >
        สรุปการเบิกจ่าย
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
          >
            <Tab label="สรุปรายชื่อผู้เข้าร่วมประชุม" />
            <Tab label="สรุปค่าใช้จ่ายที่ใช้ในการประชุม" />
          </Tabs>
        </Box>

        {/* Tab 1: Participants */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
              >
                ข้อมูลคณะ
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="คณะที่"
                    value={meeting.committeeNumber}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="ชื่อคณะ"
                    value={meeting.committeeName}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="การประชุมครั้งที่"
                    value={meeting.instanceNumber}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
              >
                รายชื่อผู้เข้าร่วมประชุม
              </Typography>
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 400,
                  overflowX: "auto",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": {
                    width: "8px",
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "transparent",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    background: "rgba(0,0,0,0.3)",
                  },
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        ชื่อ-นามสกุล
                      </TableCell>
                      <TableCell
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        อีเมล
                      </TableCell>
                      <TableCell
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        เข้าร่วมประชุม
                      </TableCell>
                      <TableCell
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                          textAlign: "center",
                        }}
                      >
                        ส่งตัวแทนเข้าร่วม
                      </TableCell>
                      <TableCell
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        ค่าเบี้ยประชุม
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            ไม่พบข้อมูลผู้เข้าร่วมประชุม
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      participants.map((participant, index) => (
                        <TableRow key={participant.id || index} hover>
                          <TableCell>{participant.name || "-"}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {participant.email || "-"}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={participant.attended || false}
                              onChange={(e) =>
                                handleParticipantChange(
                                  index,
                                  "attended",
                                  e.target.checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Checkbox
                              checked={participant.sentRepresentative || false}
                              onChange={(e) =>
                                handleParticipantChange(
                                  index,
                                  "sentRepresentative",
                                  e.target.checked
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              value={participant.meetingAllowance || ""}
                              onChange={(e) =>
                                handleParticipantChange(
                                  index,
                                  "meetingAllowance",
                                  e.target.value
                                )
                              }
                              size="small"
                              type="number"
                              slotProps={{
                                input: {
                                  inputProps: {
                                    min: 0,
                                    step: 0.01,
                                  },
                                },
                              }}
                              disabled={!participant.attended}
                              sx={{ width: 150 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </TabPanel>

        {/* Tab 2: Expenses */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
              }}
            >
              <Typography
                variant="body1"
                sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
              >
                ข้อมูลคณะ
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="คณะที่"
                    value={meeting.committeeNumber}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="ชื่อคณะ"
                    value={meeting.committeeName}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label="การประชุมครั้งที่"
                    value={meeting.instanceNumber}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              </Grid>
            </Box>

            {disbursementSummary && (
              <>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
                  >
                    รายการค่าใช้จ่าย
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      maxHeight: 400,
                      overflowX: "auto",
                      overflowY: "auto",
                      "&::-webkit-scrollbar": {
                        width: "8px",
                        height: "8px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "transparent",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "4px",
                      },
                      "&::-webkit-scrollbar-thumb:hover": {
                        background: "rgba(0,0,0,0.3)",
                      },
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: 600,
                            }}
                          >
                            ประเภทค่าใช้จ่าย
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: 600,
                              textAlign: "right",
                            }}
                          >
                            งบประมาณ
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: 600,
                              textAlign: "right",
                            }}
                          >
                            ค่าใช้จ่ายจริง
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {disbursementSummary?.expenses.map((expense, index) => (
                          <TableRow key={expense.id || index} hover>
                            <TableCell>{expense.expenseTypeName}</TableCell>
                            <TableCell align="right">
                              {expense.budgetAmount?.toLocaleString() || 0}
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                value={expense.actualExpense || ""}
                                onChange={(e) =>
                                  handleExpenseChange(
                                    index,
                                    "actualExpense",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                size="small"
                                type="number"
                                required
                                error={
                                  !expense.actualExpense ||
                                  expense.actualExpense === 0
                                }
                                helperText={
                                  !expense.actualExpense ||
                                  expense.actualExpense === 0
                                    ? "กรุณากรอกค่าใช้จ่ายจริง"
                                    : ""
                                }
                                slotProps={{
                                  input: {
                                    inputProps: {
                                      min: 0,
                                      step: 0.01,
                                      required: true,
                                    },
                                  },
                                }}
                                sx={{ width: 150 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
                  >
                    ไฟล์ค่าใช้จ่าย
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      อัพโหลดไฟล์
                      <input
                        type="file"
                        hidden
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleExpenseFileUpload}
                      />
                    </Button>
                    {expenseFileNames.length > 0 && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {expenseFileNames.map((name, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              p: 1,
                              bgcolor: "grey.50",
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {name}
                            </Typography>
                            <Tooltip title="ลบ">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveExpenseFile(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, flexDirection: "column" }}>
        {/* Tab-specific save buttons */}
        {tabValue === 0 && (
          <Button
            onClick={handleSaveParticipants}
            variant="contained"
            color="primary"
            startIcon={<Save />}
            disabled={loading}
            fullWidth={isMobile}
            sx={{ minWidth: 250 }}
          >
            บันทึกสรุปรายชื่อผู้เข้าร่วมประชุม
          </Button>
        )}
        {tabValue === 1 && (
          <Button
            onClick={handleSaveExpenses}
            variant="contained"
            color="primary"
            startIcon={<Save />}
            disabled={loading}
            fullWidth={isMobile}
            sx={{ minWidth: 250 }}
          >
            บันทึกสรุปค่าใช้จ่าย
          </Button>
        )}

        {/* Action buttons outside tabs */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            width: "100%",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "flex-end",
          }}
        >
          <Button onClick={onClose} variant="outlined" fullWidth={isMobile}>
            ปิดหน้าต่าง
          </Button>
          {canSubmitForApproval && (
            <Button
              onClick={handleSubmitForApproval}
              variant="contained"
              color="info"
              startIcon={<Send />}
              disabled={loading || !participantsSaved || !expensesSaved}
              fullWidth={isMobile}
              title={
                !participantsSaved
                  ? "กรุณาบันทึกสรุปรายชื่อผู้เข้าร่วมประชุมก่อน"
                  : !expensesSaved
                  ? "กรุณาบันทึกสรุปค่าใช้จ่ายก่อน"
                  : ""
              }
            >
              ส่งอนุมัติค่าใช้จ่าย
            </Button>
          )}
          {canGenerateDocument && (
            <Button
              onClick={handleGenerateDocument}
              variant="contained"
              color="success"
              startIcon={<Description />}
              disabled={loading}
              fullWidth={isMobile}
            >
              สร้างเอกสารค่าใช้จ่าย
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

