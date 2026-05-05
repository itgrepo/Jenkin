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
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  Tabs,
  Tab,
  Autocomplete,
  Grid,
  InputLabel,
} from "@mui/material";
import {
  Close,
  Save,
  Preview,
  Add,
  Delete,
  Upload,
  Title,
  QuestionAnswer,
  FormatListBulleted,
  AttachFile,
  Download,
  CalendarToday,
  Description,
  Group,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import {
  BallotRequest,
  BallotDraft,
  BallotDraftAttachment,
  BallotRequestRecipient,
} from "@models/ballot";
import {
  upsertBallotRequest,
  getBallotRequestById,
  getBallotDrafts,
  getBallotDraftById,
} from "@services/ballotService";
import { getProjects } from "@services/meetingService";
import { getExpertCommittees } from "@services/expertService";
import { getUsers } from "@services/userService";
import { getExperts } from "@services/expertService";
import {
  showError,
  showSuccess,
  showWarning,
  showConfirm,
} from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {
  fetchAppBallotAnswerType,
  fetchAppBallotGroupType,
  setGlobalLoading,
} from "@store/globalSlice";
import { uploadFileServer } from "@utils/fileService";
import BallotDraftPreviewDialog from "./BallotDraftPreviewDialog";
import { Committee, Expert } from "@models/expert";
import { UserInfo } from "@models/auth";
import { Project } from "@models/projects";

interface BallotRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  request?: BallotRequest | null;
  mode: "create" | "edit" | "view";
  firstPageOnly?: boolean;
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
      id={`ballot-request-tabpanel-${index}`}
      aria-labelledby={`ballot-request-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function BallotRequestDialog({
  open,
  onClose,
  onSave,
  request,
  mode,
  firstPageOnly = false,
}: BallotRequestDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<BallotRequest>({
    useDraft: false,
    draftId: undefined,
    questionText: "",
    answerType: 0,
    hasTextInput: false,
    answers: [],
    attachments: [],
    name: "",
    projectId: undefined,
    startDate: "",
    endDate: "",
    numberOfDays: undefined,
    groupType: 4,
    groupTypeId: undefined,
    committeeIds: [],
    staffRecipients: [],
    expertRecipients: [],
    status: "pending_approval",
  });

  const [loading, setLoading] = useState(false);
  const [newAnswerText, setNewAnswerText] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<BallotDraft | null>(null);

  // Dropdown data
  const [draftList, setDraftList] = useState<BallotDraft[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [committeeList, setCommitteeList] = useState<Committee[]>([]);
  const [staffList, setStaffList] = useState<UserInfo[]>([]);
  const [expertList, setExpertList] = useState<Expert[]>([]);

  // Search states
  const [draftSearchText, setDraftSearchText] = useState("");
  const [projectSearchText, setProjectSearchText] = useState("");
  const [committeeSearchText, setCommitteeSearchText] = useState("");
  const [staffSearchText, setStaffSearchText] = useState("");
  const [expertSearchText, setExpertSearchText] = useState("");

  // Selected values
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [selectedCommitteeIds, setSelectedCommitteeIds] = useState<number[]>(
    []
  );
  const [selectedStaff, setSelectedStaff] =
    useState<BallotRequestRecipient | null>(null);
  const [selectedExpert, setSelectedExpert] =
    useState<BallotRequestRecipient | null>(null);

  const { ballotAnswerTypeList, ballotGroupTypeList } = useAppSelector(
    (state) => state.global
  );

  useEffect(() => {
    if (open) {
      // Load essential data for Tab 1 first (only drafts, answer types are in Redux)
      if (draftList.length === 0) {
        loadEssentialData();
      }
      if (request && mode !== "create") {
        loadRequestData();
      } else {
        resetForm();
      }
    }
  }, [open, request, mode]);

  // Load Tab 2 data when tab is opened
  useEffect(() => {
    if (open && tabValue === 1 && projectList.length === 0) {
      loadProjects();
    }
  }, [open, tabValue]);

  useEffect(() => {
    if (!ballotAnswerTypeList) {
      dispatch(fetchAppBallotAnswerType());
    }
    if (!ballotGroupTypeList) {
      dispatch(fetchAppBallotGroupType());
    }
  }, [ballotAnswerTypeList, ballotGroupTypeList, dispatch]);

  // Load essential data for Tab 1 (drafts only, answer types are in Redux)
  const loadEssentialData = async () => {
    if (draftList.length > 0) return;
    try {
      const draftsRes = await getBallotDrafts();
      setDraftList(draftsRes.data || []);
    } catch (err) {
      console.error("Error loading essential data:", err);
    }
  };

  // Load projects - only when needed
  const loadProjects = async () => {
    if (projectList.length > 0) return;
    try {
      const projectsRes = await getProjects();
      setProjectList(projectsRes.data || []);
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  // Separate load functions for better control - on-demand loading
  const loadCommittees = async () => {
    if (committeeList.length > 0) return;
    try {
      const committeesRes = await getExpertCommittees();
      setCommitteeList(committeesRes.data || []);
    } catch (err) {
      console.error("Error loading committees:", err);
    }
  };

  const loadStaff = async () => {
    if (staffList.length > 0) return;
    try {
      const staffRes = await getUsers({
        reg_subdepart: currentUser?.reg_subdepart || "",
      });
      setStaffList(staffRes || []);
    } catch (err) {
      console.error("Error loading staff:", err);
    }
  };

  const loadExperts = async () => {
    if (expertList.length > 0) return;
    try {
      const expertsRes = await getExperts();
      setExpertList(expertsRes.data || []);
    } catch (err) {
      console.error("Error loading experts:", err);
    }
  };

  const loadRequestData = async () => {
    if (!request?.id) return;

    try {
      dispatch(setGlobalLoading(true));
      const loadedRequest = await getBallotRequestById(request.id);
      setFormData(loadedRequest);
      setSelectedDraftId(loadedRequest.draftId || null);
      setSelectedProjectId(loadedRequest.projectId || null);
      setSelectedCommitteeIds(loadedRequest.committeeIds || []);

      // Load related dropdown data in parallel if needed (don't wait, load in background)
      const loadPromises: Promise<any>[] = [];
      
      if (loadedRequest.projectId && projectList.length === 0) {
        loadPromises.push(loadProjects());
      }
      if (loadedRequest.committeeIds && loadedRequest.committeeIds.length > 0 && committeeList.length === 0) {
        loadPromises.push(loadCommittees());
      }
      if (loadedRequest.staffRecipients && loadedRequest.staffRecipients.length > 0 && staffList.length === 0) {
        loadPromises.push(loadStaff());
      }
      if (loadedRequest.expertRecipients && loadedRequest.expertRecipients.length > 0 && expertList.length === 0) {
        loadPromises.push(loadExperts());
      }

      // Load in background (don't block)
      if (loadPromises.length > 0) {
        Promise.all(loadPromises).catch((err) => {
          console.error("Error loading related data:", err);
        });
      }
    } catch (err: any) {
      console.error("Error loading request:", err);
      showError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const resetForm = () => {
    setFormData({
      useDraft: false,
      draftId: undefined,
      questionText: "",
      answerType: 0,
      hasTextInput: false,
      answers: [],
      attachments: [],
      name: "",
      projectId: undefined,
      startDate: "",
      endDate: "",
      numberOfDays: undefined,
      groupType: 4,
      groupTypeId: undefined,
      committeeIds: [],
      staffRecipients: [],
      expertRecipients: [],
      status: "pending_approval",
    });
    setSelectedDraftId(null);
    setSelectedProjectId(null);
    setSelectedCommitteeIds([]);
    setSelectedStaff(null);
    setSelectedExpert(null);
    setNewAnswerText("");
    setAttachmentFiles([]);
    setErrors({});
  };

  const handleLoadDraft = async () => {
    if (!selectedDraftId) {
      showWarning("กรุณาเลือกแบบร่าง", "กรุณาเลือกแบบร่างก่อนดึงข้อมูล");
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      const draft = await getBallotDraftById(selectedDraftId);
      setFormData((prev) => ({
        ...prev,
        questionText: draft.questionText,
        answerType: draft.answerType,
        hasTextInput: draft.hasTextInput,
        answers: draft.answers || [],
        attachments: draft.attachments || [],
      }));
      showSuccess("สำเร็จ", "ดึงข้อมูลแบบร่างเรียบร้อยแล้ว");
    } catch (err: any) {
      console.error("Error loading draft:", err);
      showError("เกิดข้อผิดพลาด", "ไม่สามารถดึงข้อมูลแบบร่างได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleAddAnswer = () => {
    const trimmedText = newAnswerText.trim();

    if (!trimmedText) {
      showWarning("แจ้งเตือน", "กรุณากรอกข้อความคำตอบ");
      return;
    }

    // ตรวจสอบว่าคำตอบซ้ำหรือไม่
    const isDuplicate = formData.answers.some(
      (answer) => answer.text.trim().toLowerCase() === trimmedText.toLowerCase()
    );

    if (isDuplicate) {
      showWarning("แจ้งเตือน", "คำตอบนี้มีอยู่ในรายการแล้ว กรุณากรอกคำตอบใหม่");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      answers: [
        ...(prev.answers || []),
        {
          text: trimmedText,
          displayOrder: (prev.answers?.length || 0) + 1,
        },
      ],
    }));
    setNewAnswerText("");
    // Clear error when user adds an answer
    if (errors.answers) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.answers;
        return newErrors;
      });
    }
  };

  const handleRemoveAnswer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      answers: prev.answers?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setAttachmentFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddStaff = () => {
    if (!selectedStaff) {
      showWarning("กรุณาเลือกเจ้าหน้าที่", "กรุณาเลือกเจ้าหน้าที่ก่อนเพิ่ม");
      return;
    }

    const exists = formData.staffRecipients?.some(
      (r) => r.userId === selectedStaff.userId
    );
    if (exists) {
      showWarning("ข้อมูลซ้ำ", "เจ้าหน้าที่รายนี้ถูกเพิ่มแล้ว");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      staffRecipients: [...(prev.staffRecipients || []), selectedStaff],
    }));
    setSelectedStaff(null);
    setStaffSearchText("");
    // Clear error when user adds staff
    if (errors.staffRecipients) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.staffRecipients;
        return newErrors;
      });
    }
  };

  const handleRemoveStaff = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      staffRecipients:
        prev.staffRecipients?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleAddExpert = () => {
    if (!selectedExpert) {
      showWarning("กรุณาเลือกผู้เชี่ยวชาญ", "กรุณาเลือกผู้เชี่ยวชาญก่อนเพิ่ม");
      return;
    }

    const exists = formData.expertRecipients?.some(
      (r) => r.userId === selectedExpert.userId
    );
    if (exists) {
      showWarning("ข้อมูลซ้ำ", "ผู้เชี่ยวชาญรายนี้ถูกเพิ่มแล้ว");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      expertRecipients: [...(prev.expertRecipients || []), selectedExpert],
    }));
    setSelectedExpert(null);
    setExpertSearchText("");
    // Clear error when user adds expert
    if (errors.expertRecipients) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.expertRecipients;
        return newErrors;
      });
    }
  };

  const handleRemoveExpert = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      expertRecipients:
        prev.expertRecipients?.filter((_, i) => i !== index) || [],
    }));
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData((prev) => ({ ...prev, numberOfDays: diffDays }));
    }
  };

  useEffect(() => {
    calculateDays();
  }, [formData.startDate, formData.endDate]);

  // Clear errors when fields have data
  useEffect(() => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      // Tab 1: Clear errors when fields have data
      if (formData.questionText.trim() && prevErrors.questionText) {
        delete newErrors.questionText;
      }
      if (
        formData.answerType &&
        formData.answerType !== 0 &&
        prevErrors.answerType
      ) {
        delete newErrors.answerType;
      }

      const selectedAnswerType = ballotAnswerTypeList?.find(
        (t: any) => t.id === formData.answerType
      );
      if (
        formData.answers &&
        formData.answers.length > 0 &&
        selectedAnswerType?.name !== "Text" &&
        prevErrors.answers
      ) {
        delete newErrors.answers;
      }

      // Tab 2: Clear errors when fields have data
      if (formData.name.trim() && prevErrors.name) {
        delete newErrors.name;
      }
      if (formData.startDate && prevErrors.startDate) {
        delete newErrors.startDate;
      }
      if (formData.endDate && prevErrors.endDate) {
        delete newErrors.endDate;
      }
      if (formData.groupType && prevErrors.groupType) {
        delete newErrors.groupType;
      }

      // Clear groupType-specific errors
      if (
        (formData.groupType === 1 || formData.groupType === 2) &&
        selectedCommitteeIds &&
        selectedCommitteeIds.length > 0 &&
        prevErrors.committeeIds
      ) {
        delete newErrors.committeeIds;
      }
      if (
        formData.groupType === 3 &&
        formData.staffRecipients &&
        formData.staffRecipients.length > 0 &&
        prevErrors.staffRecipients
      ) {
        delete newErrors.staffRecipients;
      }
      if (
        formData.groupType === 5 &&
        formData.expertRecipients &&
        formData.expertRecipients.length > 0 &&
        prevErrors.expertRecipients
      ) {
        delete newErrors.expertRecipients;
      }

      return newErrors;
    });
  }, [
    formData.questionText,
    formData.answerType,
    formData.answers,
    formData.name,
    formData.startDate,
    formData.endDate,
    formData.groupType,
    selectedCommitteeIds,
    formData.staffRecipients,
    formData.expertRecipients,
    ballotAnswerTypeList,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Tab 1 validation
    if (!formData.questionText.trim()) {
      newErrors.questionText = "กรุณากรอกข้อความคำถาม";
    }
    if (!formData.answerType || formData.answerType === 0) {
      newErrors.answerType = "กรุณาเลือกรูปแบบคำตอบ";
    }

    const selectedAnswerType = ballotAnswerTypeList?.find(
      (t: any) => t.id === formData.answerType
    );
    if (
      formData?.answers?.length === 0 &&
      selectedAnswerType?.name !== "Text"
    ) {
      newErrors.answers = "กรุณาเพิ่มข้อความคำตอบอย่างน้อย 1 รายการ";
    }

    // Tab 2 validation
    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อข้อคิดเห็น";
    }
    if (!formData.startDate) {
      newErrors.startDate = "กรุณาเลือกวันที่เริ่มสอบถาม";
    }
    if (!formData.endDate) {
      newErrors.endDate = "กรุณาเลือกวันที่สิ้นสุดสอบถาม";
    }
    if (!formData.groupType) {
      newErrors.groupType = "กรุณาเลือกกลุ่มที่ต้องการเวียนข้อคิดเห็น";
    }

    // Validate based on groupType
    if (
      (formData.groupType === 1 || formData.groupType === 2) &&
      (!selectedCommitteeIds || selectedCommitteeIds.length === 0)
    ) {
      newErrors.committeeIds = "กรุณาเลือกคณะ";
    }
    if (
      formData.groupType === 3 &&
      (!formData.staffRecipients || formData.staffRecipients.length === 0)
    ) {
      newErrors.staffRecipients = "กรุณาเพิ่มเจ้าหน้าที่อย่างน้อย 1 รายการ";
    }
    if (
      formData.groupType === 5 &&
      (!formData.expertRecipients || formData.expertRecipients.length === 0)
    ) {
      newErrors.expertRecipients = "กรุณาเพิ่มผู้เชี่ยวชาญอย่างน้อย 1 รายการ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateViewForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    // Tab 1 validation
    if (!formData.questionText.trim()) {
      newErrors.questionText = "กรุณากรอกข้อความคำถาม";
    }
    if (!formData.answerType || formData.answerType === 0) {
      newErrors.answerType = "กรุณาเลือกรูปแบบคำตอบ";
    }

    const selectedAnswerType = ballotAnswerTypeList?.find(
      (t: any) => t.id === formData.answerType
    );
    if (
      formData?.answers?.length === 0 &&
      selectedAnswerType?.name !== "Text"
    ) {
      newErrors.answers = "กรุณาเพิ่มข้อความคำตอบอย่างน้อย 1 รายการ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showWarning("กรุณาตรวจสอบข้อมูล", "กรุณากรอกข้อมูลให้ครบถ้วน");
      setTabValue(0); // Go to first tab if there are errors
      return;
    }

    const confirmResult = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อคิดเห็นหรือไม่?",
      "บันทึก",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // Upload attachment files
      const attachmentPaths: BallotDraftAttachment[] = [];
      for (const file of attachmentFiles) {
        try {
          const filePath = await uploadFileServer({
            file: file,
            folder: `ballot/request/attachments`,
          });
          attachmentPaths.push({
            fileName: file.name,
            filePath: filePath,
            displayOrder: attachmentPaths.length + 1,
          });
        } catch (err: any) {
          console.error("Error uploading attachment:", err);
          showError("เกิดข้อผิดพลาด", `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`);
          return;
        }
      }

      // Combine with existing attachments
      const allAttachments = [
        ...(formData.attachments || []),
        ...attachmentPaths,
      ];

      const requestToSave: BallotRequest = {
        ...formData,
        draftId:
          formData.useDraft && selectedDraftId
            ? (selectedDraftId as number)
            : undefined,
        projectId: selectedProjectId
          ? (selectedProjectId as number)
          : undefined,
        committeeIds: selectedCommitteeIds,
        attachments: allAttachments,
        createdBy: currentUser?.id ?? undefined,
        status: mode === "create" ? "pending_approval" : formData.status,
      };

      await upsertBallotRequest(requestToSave);
      showSuccess("สำเร็จ", "บันทึกข้อคิดเห็นเรียบร้อยแล้ว");
      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Error saving ballot request:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อคิดเห็นได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handlePreview = () => {
    if (!validateViewForm()) {
      showWarning(
        "กรุณาตรวจสอบข้อมูล",
        "กรุณากรอกข้อมูลให้ครบถ้วนก่อนดูตัวอย่าง"
      );
      return;
    }

    // Convert formData to BallotDraft format for preview
    const previewDraft: BallotDraft = {
      name: formData.name,
      questionText: formData.questionText,
      answerType: formData.answerType,
      hasTextInput: formData.hasTextInput,
      answers: formData.answers || [],
      attachments: formData.attachments || [],
    };
    setSelectedDraft(previewDraft);
    setPreviewDialogOpen(true);
  };

  const isViewMode = mode === "view";
  const isReadOnly = isViewMode;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobileDialog}
        PaperProps={{
          sx: {
            borderRadius: isMobileDialog ? 0 : 2,
            maxHeight: isMobileDialog ? "100vh" : "90vh",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QuestionAnswer />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {mode === "create"
                ? "เพิ่มการเวียนขอข้อคิดเห็น"
                : mode === "edit"
                ? "แก้ไขการเวียนขอข้อคิดเห็น"
                : "ดูการเวียนขอข้อคิดเห็น"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  minHeight: 64,
                },
              }}
            >
              <Tab label="ส่วนที่ 1: ข้อมูลชุดคำถาม" />
              {!firstPageOnly&&<Tab label="ส่วนที่ 2: เรื่อง/ประเภทการเวียน" />}
            </Tabs>
          </Box>

          {/* Tab 1: Question Data */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              {/* Radio: Use Draft or Not */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <FormControl component="fieldset" disabled={isReadOnly}>
                    <FormLabel
                      component="legend"
                      sx={{ mb: 2, fontWeight: 600 }}
                    >
                      เลือกการใช้งาน
                    </FormLabel>
                    <RadioGroup
                      row
                      value={formData.useDraft ? "use" : "not_use"}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          useDraft: e.target.value === "use",
                        }));
                      }}
                    >
                      <FormControlLabel
                        value="use"
                        control={<Radio />}
                        label="ใช้แบบร่าง"
                      />
                      <FormControlLabel
                        value="not_use"
                        control={<Radio />}
                        label="ไม่ใช้แบบร่าง"
                      />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>

              {/* If Use Draft */}
              {formData.useDraft && (
                <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                  <CardContent>
                    <Box
                      sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}
                    >
                      <Autocomplete
                        options={draftList}
                        getOptionLabel={(option) => option.name}
                        value={
                          draftList.find((d) => d.id === selectedDraftId) ||
                          null
                        }
                        onChange={(_, newValue) => {
                          setSelectedDraftId(newValue?.id || null);
                        }}
                        inputValue={draftSearchText}
                        onInputChange={(_, newValue) =>
                          setDraftSearchText(newValue)
                        }
                        disabled={isReadOnly}
                        sx={{ flex: 1 }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="แบบร่าง"
                            placeholder="ค้นหาแบบร่าง"
                            size="small"
                          />
                        )}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Download />}
                        onClick={handleLoadDraft}
                        disabled={isReadOnly || !selectedDraftId || loading}
                        sx={{ minWidth: 160, textTransform: "none" }}
                      >
                        ดึงข้อมูลแบบร่าง
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Question Form */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <QuestionAnswer />
                    ข้อความคำถาม
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={formData.questionText}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        questionText: e.target.value,
                      }))
                    }
                    disabled={isReadOnly}
                    error={!!errors.questionText}
                    helperText={errors.questionText}
                    placeholder="กรอกข้อความคำถาม"
                  />
                </CardContent>
              </Card>

              {/* Answer Type */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <FormatListBulleted />
                    รูปแบบคำตอบ
                  </Typography>
                  <FormControl fullWidth error={!!errors.answerType}>
                    <InputLabel>รูปแบบคำตอบ</InputLabel>
                    <Select
                      value={formData.answerType || ""}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          answerType: Number(e.target.value),
                        }));
                        // Clear error when user selects an option
                        if (errors.answerType && e.target.value) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.answerType;
                            return newErrors;
                          });
                        }
                      }}
                      disabled={isReadOnly}
                      label="รูปแบบคำตอบ"
                    >
                      {ballotAnswerTypeList?.map((type: any) => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {errors.answerType && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.answerType}
                    </Typography>
                  )}
                </CardContent>
              </Card>

              {/* Has Text Input */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.hasTextInput}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            hasTextInput: e.target.checked,
                          }))
                        }
                        disabled={isReadOnly}
                      />
                    }
                    label="มีช่องใส่ข้อความ"
                  />
                </CardContent>
              </Card>

              {/* Answers (if not Text type) */}
              {ballotAnswerTypeList?.find(
                (t: any) => t.id === formData.answerType
              )?.name !== "Text" && (
                <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                    >
                      <FormatListBulleted />
                      ข้อความคำตอบ
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddAnswer();
                          }
                        }}
                        disabled={isReadOnly}
                        placeholder="กรอกข้อความคำตอบ"
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Add />}
                        onClick={handleAddAnswer}
                        disabled={isReadOnly}
                        sx={{ textTransform: "none", minWidth: "20%" }}
                      >
                        เพิ่มคำตอบ
                      </Button>
                    </Box>
                    {errors.answers && (
                      <Typography
                        variant="caption"
                        color="error"
                        sx={{ mb: 1 }}
                      >
                        {errors.answers}
                      </Typography>
                    )}
                    {formData.answers && formData.answers.length > 0 && (
                      <List>
                        {formData.answers.map((answer, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              bgcolor: "action.hover",
                              mb: 1,
                              borderRadius: 1,
                            }}
                            secondaryAction={
                              !isReadOnly ? (
                                <IconButton
                                  edge="end"
                                  color="error"
                                  onClick={() => handleRemoveAnswer(index)}
                                >
                                  <Delete />
                                </IconButton>
                              ) : null
                            }
                          >
                            <ListItemText
                              primary={answer.text}
                              slotProps={{
                                primary: { sx: { fontWeight: 500 } },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Attachments */}
              <Card sx={{ bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <AttachFile />
                    รายการไฟล์แนบ
                  </Typography>
                  {!isReadOnly && (
                    <Box sx={{ mb: 2 }}>
                      <input
                        accept="*/*"
                        style={{ display: "none" }}
                        id="attachment-upload"
                        multiple
                        type="file"
                        onChange={handleAddAttachment}
                      />
                      <label htmlFor="attachment-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<Upload />}
                          sx={{ textTransform: "none" }}
                        >
                          เพิ่มไฟล์แนบ
                        </Button>
                      </label>
                    </Box>
                  )}
                  {(formData.attachments?.length > 0 ||
                    attachmentFiles.length > 0) && (
                    <List>
                      {formData.attachments?.map((attachment, index) => (
                        <ListItem
                          key={`existing-${index}`}
                          sx={{
                            bgcolor: "action.hover",
                            mb: 1,
                            borderRadius: 1,
                          }}
                          secondaryAction={
                            !isReadOnly ? (
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() =>
                                  handleRemoveExistingAttachment(index)
                                }
                              >
                                <Delete />
                              </IconButton>
                            ) : null
                          }
                        >
                          <ListItemText
                            primary={attachment.fileName}
                            slotProps={{
                              primary: { sx: { fontWeight: 500 } },
                            }}
                          />
                        </ListItem>
                      ))}
                      {attachmentFiles.map((file, index) => (
                        <ListItem
                          key={`new-${index}`}
                          sx={{
                            bgcolor: "action.hover",
                            mb: 1,
                            borderRadius: 1,
                          }}
                          secondaryAction={
                            !isReadOnly ? (
                              <IconButton
                                edge="end"
                                color="error"
                                onClick={() => handleRemoveAttachment(index)}
                              >
                                <Delete />
                              </IconButton>
                            ) : null
                          }
                        >
                          <ListItemText
                            primary={file.name}
                            slotProps={{
                              primary: { sx: { fontWeight: 500 } },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Box>
          </TabPanel>

          {/* Tab 2: Circulation Info */}
          {!firstPageOnly&&<TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              {/* Feedback Name */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <Title />
                    ชื่อข้อคิดเห็น
                  </Typography>
                  <TextField
                    fullWidth
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (errors.name && e.target.value.trim()) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.name;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={isReadOnly}
                    error={!!errors.name}
                    helperText={errors.name}
                    placeholder="กรอกชื่อข้อคิดเห็น"
                  />
                </CardContent>
              </Card>

              {/* Standard Draft (Optional) */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <Description />
                    ร่างมาตรฐาน (ไม่บังคับ)
                  </Typography>
                  <Autocomplete
                    options={projectList}
                    getOptionLabel={(option) => option.nameThai || ""}
                    value={
                      projectList.find((p) => p.id === selectedProjectId) ||
                      null
                    }
                    onChange={(_, newValue) => {
                      setSelectedProjectId(newValue?.id || null);
                    }}
                    inputValue={projectSearchText}
                    onInputChange={(_, newValue) =>
                      setProjectSearchText(newValue)
                    }
                    disabled={isReadOnly}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="ร่างมาตรฐาน"
                        placeholder="ค้นหาร่างมาตรฐาน"
                        size="small"
                      />
                    )}
                  />
                </CardContent>
              </Card>

              {/* Inquiry Dates */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <CalendarToday />
                    วันที่สอบถาม
                  </Typography>
                  <LocalizationProvider
                    dateAdapter={AdapterDayjs}
                    adapterLocale="th"
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <DatePicker
                          label="วันที่เริ่มสอบถาม"
                          value={
                            formData.startDate
                              ? dayjs(formData.startDate)
                              : null
                          }
                          onChange={(date: Dayjs | null) => {
                            const dateStr = date
                              ? date.format("YYYY-MM-DD")
                              : "";
                            setFormData((prev) => ({
                              ...prev,
                              startDate: dateStr,
                            }));
                            // Clear error when user selects a date
                            if (errors.startDate && dateStr) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.startDate;
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isReadOnly}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: !!errors.startDate,
                              helperText: errors.startDate,
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <DatePicker
                          label="วันที่สิ้นสุดสอบถาม"
                          value={
                            formData.endDate ? dayjs(formData.endDate) : null
                          }
                          onChange={(date: Dayjs | null) => {
                            const dateStr = date
                              ? date.format("YYYY-MM-DD")
                              : "";
                            setFormData((prev) => ({
                              ...prev,
                              endDate: dateStr,
                            }));
                            // Clear error when user selects a date
                            if (errors.endDate && dateStr) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.endDate;
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isReadOnly}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              size: "small",
                              error: !!errors.endDate,
                              helperText: errors.endDate,
                            },
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          fullWidth
                          label="จำนวนวัน"
                          value={formData.numberOfDays || ""}
                          slotProps={{ input: { readOnly: true } }}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </LocalizationProvider>
                </CardContent>
              </Card>

              {/* Group Type */}
              <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
                <CardContent>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                  >
                    <Group />
                    กลุ่มที่ต้องการเวียนข้อคิดเห็น
                  </Typography>
                  <Autocomplete
                    options={ballotGroupTypeList || []}
                    getOptionLabel={(option) => option.name || ""}
                    value={
                      ballotGroupTypeList?.find(
                        (type) => type.id === formData.groupType
                      ) || null
                    }
                    size="small"
                    onChange={(_, newValue) => {
                      const newGroupType = newValue ? newValue.id : 0;
                      setFormData((prev) => ({
                        ...prev,
                        groupType: newGroupType,
                      }));
                      // Clear error when user selects a group type
                      if (errors.groupType && newValue) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.groupType;
                          return newErrors;
                        });
                      }
                      // Load data on-demand based on groupType
                      if (newGroupType === 1 || newGroupType === 2) {
                        loadCommittees();
                      } else if (newGroupType === 3) {
                        loadStaff();
                      } else if (newGroupType === 5) {
                        loadExperts();
                      }
                    }}
                    disabled={isReadOnly}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="กลุ่มที่ต้องการเวียนข้อคิดเห็น"
                        error={!!errors.groupType}
                        helperText={errors.groupType}
                        required
                      />
                    )}
                  />

                  {/* Committee Selection */}
                  {(formData.groupType === 1 || formData.groupType === 2) && (
                    <Box sx={{ mt: 2 }}>
                        <Autocomplete
                          multiple
                          options={committeeList}
                          getOptionLabel={(option) => option.committeeNameTh || ""}
                          value={committeeList.filter((c) => selectedCommitteeIds.includes(c.id))}
                          onChange={(_, newValue) => {
                            const newIds = newValue.map((c) => c.id);
                            setSelectedCommitteeIds(newIds);
                            // Clear error when user selects committees
                            if (errors.committeeIds && newIds.length > 0) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.committeeIds;
                                return newErrors;
                              });
                            }
                          }}
                          inputValue={committeeSearchText}
                          onInputChange={(_, newValue) =>
                            setCommitteeSearchText(newValue)
                          }
                          disabled={isReadOnly}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="เลือกคณะ"
                              placeholder="ค้นหาคณะ"
                              size="small"
                              error={!!errors.committeeIds}
                              helperText={errors.committeeIds}
                            />
                          )}
                        />
                    </Box>
                  )}

                  {/* Staff Selection */}
                  {formData.groupType === 3 && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <Autocomplete
                          options={staffList}
                          getOptionLabel={(option) =>
                            `${option.name || ""} (${option.role?.name || ""})`
                          }
                          value={staffList.find((s) => s.id === selectedStaff?.userId) || null}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              setSelectedStaff({
                                userId: newValue.id || 0,
                                name: `${newValue.name}`,
                                email: newValue.email || "",
                                type: "staff",
                              });
                            } else {
                              setSelectedStaff(null);
                            }
                          }}
                          inputValue={staffSearchText}
                          onInputChange={(_, newValue) =>
                            setStaffSearchText(newValue)
                          }
                          disabled={isReadOnly}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="เลือกเจ้าหน้าที่"
                              placeholder="ค้นหาเจ้าหน้าที่"
                              size="small"
                            />
                          )}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Add />}
                          onClick={handleAddStaff}
                          disabled={isReadOnly || !selectedStaff}
                          sx={{ textTransform: "none" }}
                        >
                          เพิ่ม
                        </Button>
                      </Box>
                      {errors.staffRecipients && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mb: 1 }}
                        >
                          {errors.staffRecipients}
                        </Typography>
                      )}
                      {formData?.staffRecipients &&
                        formData?.staffRecipients?.length > 0 && (
                          <List>
                            {formData?.staffRecipients?.map((staff, index) => (
                              <ListItem
                                key={index}
                                sx={{
                                  bgcolor: "action.hover",
                                  mb: 1,
                                  borderRadius: 1,
                                }}
                                secondaryAction={
                                  !isReadOnly ? (
                                    <IconButton
                                      edge="end"
                                      color="error"
                                      onClick={() => handleRemoveStaff(index)}
                                    >
                                      <Delete />
                                    </IconButton>
                                  ) : null
                                }
                              >
                                <ListItemText
                                  primary={staff.name}
                                  secondary={staff.email}
                                  slotProps={{
                                    primary: { sx: { fontWeight: 500 } },
                                    secondary: { variant: "caption" },
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                    </Box>
                  )}

                  {/* Expert Selection */}
                  {formData.groupType === 5 && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <Autocomplete
                          options={expertList}
                          getOptionLabel={(option) =>
                            `${option.firstName} ${option.lastName} (${option.email})`
                          }
                          value={expertList.find((e) => e.id === selectedExpert?.id) || null}
                          onChange={(_, newValue) => {
                            if (newValue) {
                              setSelectedExpert({
                                id: newValue.id,
                                name: `${newValue.firstName} ${newValue.lastName}`,
                                email: newValue.email,
                                type: "expert",
                              });
                            } else {
                              setSelectedExpert(null);
                            }
                          }}
                          inputValue={expertSearchText}
                          onInputChange={(_, newValue) =>
                            setExpertSearchText(newValue)
                          }
                          disabled={isReadOnly}
                          sx={{ flex: 1 }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="เลือกผู้เชี่ยวชาญ"
                              placeholder="ค้นหาผู้เชี่ยวชาญ"
                              size="small"
                            />
                          )}
                        />
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Add />}
                          onClick={handleAddExpert}
                          disabled={isReadOnly || !selectedExpert}
                          sx={{ textTransform: "none" }}
                        >
                          เพิ่ม
                        </Button>
                      </Box>
                      {errors.expertRecipients && (
                        <Typography
                          variant="caption"
                          color="error"
                          sx={{ mb: 1 }}
                        >
                          {errors.expertRecipients}
                        </Typography>
                      )}
                      {formData?.expertRecipients &&
                        formData?.expertRecipients?.length > 0 && (
                          <List>
                            {formData?.expertRecipients?.map((expert, index) => (
                              <ListItem
                                key={index}
                                sx={{
                                  bgcolor: "action.hover",
                                  mb: 1,
                                  borderRadius: 1,
                                }}
                                secondaryAction={
                                  !isReadOnly ? (
                                    <IconButton
                                      edge="end"
                                      color="error"
                                      onClick={() => handleRemoveExpert(index)}
                                    >
                                      <Delete />
                                    </IconButton>
                                  ) : null
                                }
                              >
                                <ListItemText
                                  primary={expert.name}
                                  secondary={expert.email}
                                  slotProps={{
                                    primary: { sx: { fontWeight: 500 } },
                                    secondary: { variant: "caption" },
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </TabPanel>
}
        </DialogContent>

        <DialogActions sx={{ p: 3, bgcolor: "background.default" }}>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            {!isViewMode && (
              <Button
                variant="outlined"
                color="info"
                startIcon={<Preview />}
                onClick={handlePreview}
                disabled={loading}
                sx={{ textTransform: "none", borderRadius: 2 }}
              >
                Preview
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {isViewMode ? "ปิด" : "ยกเลิก"}
            </Button>
            {!isViewMode && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={loading}
                sx={{ textTransform: "none", borderRadius: 2, minWidth: 120 }}
              >
                บันทึก
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      {selectedDraft && (
        <BallotDraftPreviewDialog
          open={previewDialogOpen}
          onClose={() => {
            setPreviewDialogOpen(false);
            setSelectedDraft(null);
          }}
          draft={selectedDraft}
        />
      )}
    </>
  );
}
