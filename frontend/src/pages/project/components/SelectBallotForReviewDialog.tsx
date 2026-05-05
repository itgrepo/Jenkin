import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Autocomplete,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  Close,
  QuestionAnswer,
  FormatListBulleted,
  AttachFile,
  Add,
  Delete,
  Upload,
  Preview,
  Download,
} from "@mui/icons-material";
import { showError, showSuccess, showConfirm, showWarning } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import {
  setGlobalLoading,
  fetchAppBallotAnswerType,
} from "@store/globalSlice";
import {
  BallotDraft,
  BallotDraftAnswer,
  BallotDraftAttachment,
} from "@models/ballot";
import { getBallotDrafts, getBallotDraftById } from "@services/ballotService";
import { saveReviewBallot } from "@services/projectService";
import { uploadFileServer } from "@utils/fileService";
import BallotDraftPreviewDialog from "@pages/ballot/components/BallotDraftPreviewDialog";


interface SelectBallotForReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SelectBallotForReviewDialog: React.FC<SelectBallotForReviewDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    ballotName: "",
    circulationDays: 30,
    useDraft: false,
    draftId: null as number | null,
    questionText: "",
    answerType: 0,
    hasTextInput: false,
    answers: [] as BallotDraftAnswer[],
    attachments: [] as BallotDraftAttachment[],
  });

  const [newAnswerText, setNewAnswerText] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  // Dropdown data
  const [draftList, setDraftList] = useState<BallotDraft[]>([]);
  const [draftSearchText, setDraftSearchText] = useState("");
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);

  const dispatch = useAppDispatch();
  const { ballotAnswerTypeList } = useAppSelector(
    (state: RootState) => state.global
  );

  useEffect(() => {
    if (open) {
      resetForm();
      if (ballotAnswerTypeList === null) {
        dispatch(fetchAppBallotAnswerType());
      }
      loadDrafts();
    }
  }, [open, dispatch, ballotAnswerTypeList]);

  const resetForm = () => {
    setFormData({
      ballotName: "",
      circulationDays: 30,
      useDraft: false,
      draftId: null,
      questionText: "",
      answerType: 0,
      hasTextInput: false,
      answers: [],
      attachments: [],
    });
    setNewAnswerText("");
    setAttachmentFiles([]);
    setSelectedDraftId(null);
    setDraftSearchText("");
    setErrors({});
  };

  const loadDrafts = async () => {
    try {
      setLoadingDrafts(true);
      const res = await getBallotDrafts({ search: draftSearchText });
      setDraftList(res.data || []);
    } catch (err: any) {
      console.error("Error loading drafts:", err);
    } finally {
      setLoadingDrafts(false);
    }
  };

  useEffect(() => {
    if (open && draftSearchText !== undefined) {
      loadDrafts();
    }
  }, [draftSearchText]);

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

  // Clear errors when fields have data
  useEffect(() => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (formData.ballotName.trim() && prevErrors.ballotName) {
        delete newErrors.ballotName;
      }
      if (formData.circulationDays > 0 && prevErrors.circulationDays) {
        delete newErrors.circulationDays;
      }
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

      return newErrors;
    });
  }, [
    formData.ballotName,
    formData.circulationDays,
    formData.questionText,
    formData.answerType,
    formData.answers,
    ballotAnswerTypeList,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ballotName.trim()) {
      newErrors.ballotName = "กรุณากรอกชื่อข้อคิดเห็น";
    }
    if (!formData.circulationDays || formData.circulationDays <= 0) {
      newErrors.circulationDays = "กรุณากรอกจำนวนวันที่เวียนที่ถูกต้อง";
    }
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

  const validateViewForm = (): boolean => {
    const newErrors: Record<string, string> = {};
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
      return;
    }

    const confirmResult = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึก Ballot สำหรับเวียนทบทวนมาตรฐานหรือไม่?",
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
            folder: `ballot/review/attachments`,
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

      // เรียก API เพื่อบันทึก Ballot สำหรับเวียนทบทวนมาตรฐาน
      await saveReviewBallot({
        name: formData.ballotName,
        circulationDays: formData.circulationDays,
        questionText: formData.questionText,
        answerType: formData.answerType,
        hasTextInput: formData.hasTextInput,
        answers: formData.answers.map((a, idx) => ({
          text: a.text,
          displayOrder: idx + 1,
        })),
        attachments: allAttachments.map((a, idx) => ({
          fileName: a.fileName,
          filePath: a.filePath,
          displayOrder: idx + 1,
        })),
      });

      showSuccess("บันทึกสำเร็จ", "บันทึก Ballot สำหรับเวียนทบทวนมาตรฐานเรียบร้อยแล้ว");

      if (onSuccess) {
        onSuccess();
      }

      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Error saving review ballot:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้"
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
    // const previewDraft: BallotDraft = {
    //   name: formData.ballotName,
    //   questionText: formData.questionText,
    //   answerType: formData.answerType,
    //   hasTextInput: formData.hasTextInput,
    //   answers: formData.answers || [],
    //   attachments: formData.attachments || [],
    // };
    setPreviewDialogOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            maxHeight: isMobile ? "100vh" : "90vh",
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
              เพิ่มการเวียนขอข้อคิดเห็น
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            {/* ชื่อข้อคิดเห็น */}
            <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                >
                  ชื่อข้อคิดเห็น
                </Typography>
                <TextField
                  fullWidth
                  value={formData.ballotName}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      ballotName: e.target.value,
                    }));
                    if (errors.ballotName && e.target.value.trim()) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.ballotName;
                        return newErrors;
                      });
                    }
                  }}
                  error={!!errors.ballotName}
                  helperText={errors.ballotName}
                  placeholder="กรอกชื่อข้อคิดเห็น"
                />
              </CardContent>
            </Card>

            {/* จำนวนวันที่เวียน */}
            <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
              <CardContent>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, mb: 2, display: "flex", gap: 1 }}
                >
                  จำนวนวันที่เวียน
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  value={formData.circulationDays}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setFormData((prev) => ({
                        ...prev,
                        circulationDays: value,
                      }));
                    } else if (e.target.value === "") {
                      setFormData((prev) => ({
                        ...prev,
                        circulationDays: 0,
                      }));
                    }
                    if (errors.circulationDays && value > 0) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.circulationDays;
                        return newErrors;
                      });
                    }
                  }}
                  error={!!errors.circulationDays}
                  helperText={errors.circulationDays}
                  placeholder="กรอกจำนวนวันที่เวียน"
                  slotProps={{
                    input: {
                      inputProps: {
                        min: 1,
                      },
                    },
                  }}
                />
              </CardContent>
            </Card>

            {/* Section Title */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <QuestionAnswer />
                ส่วนที่ 1: ข้อมูลชุดคำถาม
              </Typography>
            </Box>

            {/* Radio: Use Draft or Not */}
            <Card sx={{ mb: 3, bgcolor: "background.paper" }}>
              <CardContent>
                <FormControl component="fieldset">
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
                        setFormData((prev) => ({
                          ...prev,
                          draftId: newValue?.id || null,
                        }));
                      }}
                      inputValue={draftSearchText}
                      onInputChange={(_, newValue) =>
                        setDraftSearchText(newValue)
                      }
                      loading={loadingDrafts}
                      sx={{ flex: 1 }}
                      renderInput={(params) => {
                        const { InputProps, ...other } = params;
                        return (
                          <TextField
                            {...other}
                            label="แบบร่าง"
                            placeholder="ค้นหาแบบร่าง"
                            size="small"
                            slotProps={{
                              input: {
                                ...InputProps,
                                endAdornment: (
                                  <>
                                    {loadingDrafts ? (
                                      <CircularProgress color="inherit" size={20} />
                                    ) : null}
                                    {InputProps.endAdornment}
                                  </>
                                ),
                              },
                            }}
                          />
                        );
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download />}
                      onClick={handleLoadDraft}
                      disabled={!selectedDraftId || loading}
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
                      // ถ้าเป็น Text type ให้ล้าง answers
                      if (Number(e.target.value) === 3) {
                        setFormData((prev) => ({
                          ...prev,
                          answers: [],
                        }));
                      }
                    }}
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
                      placeholder="กรอกข้อความคำตอบ"
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={handleAddAnswer}
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
                            <IconButton
                              edge="end"
                              color="error"
                              onClick={() => handleRemoveAnswer(index)}
                            >
                              <Delete />
                            </IconButton>
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
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() =>
                              handleRemoveExistingAttachment(index)
                            }
                          >
                            <Delete />
                          </IconButton>
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
                          <IconButton
                            edge="end"
                            color="error"
                            onClick={() => handleRemoveAttachment(index)}
                          >
                            <Delete />
                          </IconButton>
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
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3, gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={handlePreview}
            disabled={loading}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            Preview
          </Button>
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

      {/* Preview Dialog */}
      {previewDialogOpen && (
        <BallotDraftPreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          draft={{
            name: formData.ballotName,
            questionText: formData.questionText,
            answerType: formData.answerType,
            hasTextInput: formData.hasTextInput,
            answers: formData.answers || [],
            attachments: formData.attachments || [],
          }}
        />
      )}
    </>
  );
};

export default SelectBallotForReviewDialog;
