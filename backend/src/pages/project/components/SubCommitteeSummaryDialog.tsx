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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from "@mui/material";
import { Close, CloudUpload } from "@mui/icons-material";
import { Project } from "@models/projects";
import { updateProjectStage, upsertProjectLog } from "@services/projectService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/th";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { uploadFileServer } from "@utils/fileService";
import { Meeting, MeetingSearchParams } from "@models/meeting";
import { getApprovedMeetings } from "@services/meetingService";
import { getBallotRequests } from "@services/ballotService";
import { BallotRequest, BallotRequestSearchParams } from "@models/ballot";

interface SubCommitteeSummaryDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  type?: string; // "30" for sub-committee, "40" for committee
  onSuccess?: () => void;
}

const SubCommitteeSummaryDialog: React.FC<SubCommitteeSummaryDialogProps> = ({
  open,
  onClose,
  project,
  type = "30", // Default to sub-committee
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Select meeting/questionnaire, Step 2: Summary form
  const [selectedItem, setSelectedItem] = useState<Meeting | null>(null);
  const [selectedBallotRequest, setSelectedBallotRequest] = useState<BallotRequest | null>(null);
  const [meetingDate, setMeetingDate] = useState<Dayjs | null>(null);
  const [ballotStartDate, setBallotStartDate] = useState<Dayjs | null>(null);
  const [ballotEndDate, setBallotEndDate] = useState<Dayjs | null>(null);
  const [summaryDate, setSummaryDate] = useState<Dayjs | null>(null);
  const [decision, setDecision] = useState<string>("circulate");
  const [wordFile, setWordFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [questionnaires, setQuestionnaires] = useState<BallotRequest[]>([]);

  // Mock data - TODO: Replace with API calls

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (stageCodeList === null) {
      dispatch(fetchAppStageCode());
    }
  }, [stageCodeList, dispatch]);

  useEffect(() => {
    if (open && project) {
      setStep(1);
      setSelectedItem(null);
      setMeetingDate(null);
      setBallotStartDate(null);
      setBallotEndDate(null);
      setSummaryDate(dayjs());
      setDecision("circulate");
      setWordFile(null);
      setPdfFile(null);
      setSummary("");
      setRemarks("");
    }
  }, [open, project]);

  useEffect(() => {
    loadMeetings();
    loadBallotRequests();
  }, []);

  const loadMeetings = async () => {
    try {
      setGlobalLoading(true);
      const params: MeetingSearchParams = {};

      params.status = "meeting_closed"; // Filter only approved meetings

      const res = await getApprovedMeetings(params);

      setMeetings(res.data || []);
    } catch (err: any) {
      console.error("Error loading meetings:", err);
      showError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลการประชุมได้"
      );
    } finally {
      setGlobalLoading(false);
    }
  };

  const loadBallotRequests = async () => {
    try {
      dispatch(setGlobalLoading(true));

      // Load only approved requests created by current user
      const params: BallotRequestSearchParams = {
        status: ["director_approved", "closed"],
      };

      const res = await getBallotRequests(params);
      setQuestionnaires(res.data || []);
    } catch (err: any) {
      console.error("Error loading requests:", err);
      showConfirm(
        err?.response?.data?.message ||
          "ไม่สามารถโหลดข้อมูลการเวียนขอข้อคิดเห็นได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSelectItemMeeting = (item: Meeting) => {
    setSelectedItem(item);
    setMeetingDate(dayjs(item.createdAt));
  };

  const handleSelectItemBallotRequest = (item: BallotRequest) => {
    setSelectedBallotRequest(item);
    setBallotStartDate(dayjs(item.startDate));
    setBallotEndDate(dayjs(item.endDate));
  };

  const handleWordFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setWordFile(event.target.files[0]);
    }
  };

  const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setPdfFile(event.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!project || !project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบข้อมูลโครงการ");
      return;
    }

    if (!selectedItem && !selectedBallotRequest) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกรายการประชุมหรือแบบสอบถาม");
      return;
    }

    if (!summaryDate) {
      showError(
        "เกิดข้อผิดพลาด",
        `กรุณาเลือกวันที่${type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."}`
      );
      return;
    }

    if (!decision) {
      showError("เกิดข้อผิดพลาด", "กรุณาเลือกการตัดสินใจ");
      return;
    }

    if (!wordFile || !pdfFile) {
      showError("เกิดข้อผิดพลาด", "กรุณาอัพโหลดไฟล์ Word และ PDF");
      return;
    }

    const confirm = await showConfirm(
      "ยืนยันการบันทึก",
      `คุณต้องการบันทึกข้อมูล${type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."} หรือไม่?`
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);

      const summaryDateStr = summaryDate.format("YYYY-MM-DD");
      // ใช้วันที่ประชุมหรือวันเริ่ม Ballot ที่เลือก
      const dateForLogs = meetingDate
        ? meetingDate.format("YYYY-MM-DD")
        : ballotStartDate
        ? ballotStartDate.format("YYYY-MM-DD")
        : summaryDateStr;

      // ใช้วันที่ประชุมหรือวันสิ้นสุด Ballot ที่เลือก
      const endDateForLogs = meetingDate
        ? meetingDate.format("YYYY-MM-DD")
        : ballotEndDate
        ? ballotEndDate.format("YYYY-MM-DD")
        : summaryDateStr;

      // กำหนด stage codes และ logs ตามการตัดสินใจและ type
      let newStageCode = "";
      let newStageUiMsg = "";
      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [];

      if (type === "30") {
        // สรุปผลอนุ กว. (Sub-Committee)
        switch (decision) {
          case "circulate":
            // เวียนร่าง
            newStageCode = "35.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "30.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "30.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.99")?.name ||
                  "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "35.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "35.00")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
          case "revert":
            // ย้อนไปเตรียมร่าง
            newStageCode = "20.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "30.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "30.92",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.92")?.name ||
                  "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "20.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "20.00")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
          case "disapprove":
            // ไม่เห็นชอบ
            newStageCode = "30.98";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "30.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "30.98",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.98")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
          case "approve":
            // เห็นชอบและทำขั้นต่อไป
            newStageCode = "40.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "30.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "30.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "30.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.99")?.name ||
                  "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "40.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.00")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
        }
      } else if (type === "40") {
        // สรุปผล กว. (Committee)
        switch (decision) {
          case "circulate":
            // เวียนร่าง
            newStageCode = "45.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "40.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "40.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.99")?.name ||
                  "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "45.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "45.00")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
          case "revert":
            // ย้อนไปเตรียมร่าง
            newStageCode = "30.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "40.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "40.92",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.92")?.name ||
                  "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "30.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "30.00")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
          case "disapprove":
            // ไม่เห็นชอบ
            newStageCode = "40.98";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "40.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "40.98",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.98")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
          case "approve":
            // เห็นชอบและทำขั้นต่อไป
            newStageCode = "47.00";
            newStageUiMsg =
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
              "";
            logsToCreate.push(
              {
                stageCode: "40.20",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.20")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.40",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.40")?.name ||
                  "",
                stageDate: dateForLogs,
              },
              {
                stageCode: "40.60",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.60")?.name ||
                  "",
                stageDate: endDateForLogs,
              },
              {
                stageCode: "40.99",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "40.99")?.name ||
                  "",
                stageDate: summaryDateStr,
              },
              {
                stageCode: "47.00",
                stageDescription:
                  stageCodeList?.find((stage) => stage.code === "47.00")?.name ||
                  "",
                stageDate: summaryDateStr,
              }
            );
            break;
        }
      }

      // Upload files to MinIO
      let wordFilePath = "";
      let pdfFilePath = "";

      try {
        const folderPath =
          type === "30"
            ? `projects/sub-committee/pre-final`
            : `projects/committee/pre-final`;
        wordFilePath = await uploadFileServer({
          file: wordFile,
          folder: folderPath,
        });
        pdfFilePath = await uploadFileServer({
          file: pdfFile,
          folder: folderPath,
        });
      } catch (uploadError: any) {
        console.error("Error uploading files:", uploadError);
        showError(
          "เกิดข้อผิดพลาด",
          uploadError?.message || "ไม่สามารถอัปโหลดไฟล์ได้"
        );
        return;
      }

      // อัปเดตโครงการ
      const updatedProject: Partial<Project> = {
        id: project.id,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
        ...(type === "30"
          ? {
              sub_committee_summary_remarks: remarks,
              sub_committee_summary_file_path_word: wordFilePath,
              sub_committee_summary_file_path_pdf: pdfFilePath,
              sub_committee_summary: summary,
            }
          : {
              committee_summary_remarks: remarks,
              committee_summary_file_path_word: wordFilePath,
              committee_summary_file_path_pdf: pdfFilePath,
              committee_summary: summary,
            }),
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

      showSuccess(
        "บันทึกสำเร็จ",
        `บันทึกข้อมูล${type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."} เรียบร้อยแล้ว`
      );

      if (onSuccess) {
        onSuccess();
      }

      onClose();
    } catch (err: any) {
      console.error("Error saving sub-committee summary:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    // setSelectedItem(null);
    // setSelectedBallotRequest(null);
  };

  const handleNextToStep2 = () => {
    setStep(2);
  };

  // Step 1: Select Meeting/Questionnaire
  const renderStep1 = () => (
    <>
      <Box
        sx={{
          my: 2,
          display: "flex",
          alignItems: "center",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Typography component="div" sx={{ fontWeight: 700, minWidth: "25%" }}>
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

      {/* Meeting List */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          รายการประชุม
        </Typography>
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "grey.800",color:"white", fontWeight: 700 }}>ชื่อการประชุม</TableCell>
                <TableCell sx={{ bgcolor: "grey.800",color:"white", fontWeight: 700 }}>วันที่</TableCell>
                <TableCell align="center" sx={{ bgcolor: "grey.800",color:"white", fontWeight: 700 }}>
                  การดำเนินการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings?.map((meeting) => (
                <TableRow key={meeting.id} hover>
                  <TableCell>{meeting.meetingSubject}</TableCell>
                  <TableCell>{meeting.createdAt}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleSelectItemMeeting(meeting)}
                      sx={{ textTransform: "none" ,bgcolor:selectedItem?.id === meeting.id?"grey.50":"grey.700",color:selectedItem?.id === meeting.id?"grey.700":"white", "&:hover": { bgcolor: "grey.900" } }}
                      disabled={selectedItem?.id === meeting.id}
                    >
                      เลือก
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Questionnaire List */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          รายการแบบสอบถาม
        </Typography>
        <TableContainer component={Paper} elevation={1}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: "grey.800",color:"white", fontWeight: 700 }}>ชื่อแบบสอบถาม</TableCell>
                <TableCell sx={{ bgcolor: "grey.800",color:"white", fontWeight: 700 }}>วันที่</TableCell>
                <TableCell align="center" sx={{ bgcolor: "grey.800",color:"white", fontWeight: 700 }}>
                  การดำเนินการ
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questionnaires.map((ballotRequest) => (
                <TableRow key={ballotRequest.id} hover>
                  <TableCell>{ballotRequest.name}</TableCell>
                  <TableCell>{ballotRequest.startDate}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleSelectItemBallotRequest(ballotRequest)}
                      sx={{ textTransform: "none" ,bgcolor:selectedBallotRequest?.id === ballotRequest.id?"grey.50":"grey.700",color:selectedBallotRequest?.id === ballotRequest.id?"grey.700":"white", "&:hover": { bgcolor: "grey.900" } }}
                      disabled={selectedBallotRequest?.id === ballotRequest.id}
                    >
                      เลือก
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );

  // Step 2: Summary Form
  const renderStep2 = () => (
    <>
      <Box
        sx={{
          my: 2,
          display: "flex",
          alignItems: "center",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        <Typography component="div" sx={{ fontWeight: 700, minWidth: "25%" }}>
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

      {/* วันที่สรุปผล */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flexDirection: { xs: "column", md: "row" },
          mb: 2,
        }}
      >
        <Typography component="div" sx={{ fontWeight: 700, minWidth: "25%" }}>
          {type === "30" ? "วันที่สรุปผลอนุ กว." : "วันที่สรุปผล กว."}
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

      {/* File Upload Section */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          แนบไฟล์บังคับ
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            1. Word ไฟล์ร่างมาตรฐาน Pre-final ({type === "30" ? "อนุ กว." : "กว."})
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              fullWidth
              size="small"
              value={wordFile?.name || ""}
              placeholder="ยังไม่ได้เลือกไฟล์"
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
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
            >
              อัพโหลดไฟล์
              <input
                type="file"
                hidden
                accept=".doc,.docx"
                onChange={handleWordFileChange}
              />
            </Button>
          </Box>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            2. PDF ไฟล์ร่างมาตรฐาน Pre-final ({type === "30" ? "อนุ กว." : "กว."})
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              fullWidth
              size="small"
              value={pdfFile?.name || ""}
              placeholder="ยังไม่ได้เลือกไฟล์"
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
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUpload />}
              sx={{
                textTransform: "none",
                whiteSpace: "nowrap",
              }}
            >
              อัพโหลดไฟล์
              <input
                type="file"
                hidden
                accept=".pdf"
                onChange={handlePdfFileChange}
              />
            </Button>
          </Box>
        </Box>
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
            value="circulate"
            control={<Radio />}
            label="เวียนร่าง"
          />
          <FormControlLabel
            value="revert"
            control={<Radio />}
            label="ย้อนไปเตรียมร่าง"
          />
          <FormControlLabel
            value="disapprove"
            control={<Radio />}
            label="ไม่เห็นชอบ"
          />
          <FormControlLabel
            value="approve"
            control={<Radio />}
            label="เห็นชอบ และทำขั้นต่อไป"
          />
        </RadioGroup>
      </FormControl>

      {/* สรุปผล */}
      <TextField
        fullWidth
        label={type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."}
        multiline
        rows={4}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={`กรุณาระบุ${type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."}...`}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
          },
        }}
      />

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
    </>
  );

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
          {step === 1
            ? `โครงการหรือแบบสอบถามเพื่อ${type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."}`
            : `หน้าจอแสดง${type === "30" ? "สรุปผลอนุ กว." : "สรุปผล กว."}`}
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
          {step === 1 ? renderStep1() : renderStep2()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, gap: 2, justifyContent: "center" }}>
      {step === 1 && (
          <Button
            variant="outlined"
            onClick={handleNextToStep2}
            disabled={loading||!selectedItem||!selectedBallotRequest}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            ถัดไป
          </Button>
        )}
        {step === 2 && (
          <Button
            variant="outlined"
            onClick={handleBackToStep1}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            ย้อนกลับ
          </Button>
        )}
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
          {step === 1 ? "ปิด" : "ยกเลิก"}
        </Button>
        {step === 2 && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              loading || !summaryDate || !decision || !wordFile || !pdfFile
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
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SubCommitteeSummaryDialog;
