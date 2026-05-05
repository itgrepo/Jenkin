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
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
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
  Note,
} from "@mui/icons-material";
import { BallotDraft, BallotDraftAttachment } from "@models/ballot";
import { upsertBallotDraft, getBallotDraftById } from "@services/ballotService";
import {
  showError,
  showSuccess,
  showWarning,
  showConfirm,
} from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppBallotAnswerType, setGlobalLoading } from "@store/globalSlice";
import { uploadFileServer } from "@utils/fileService";
import BallotDraftPreviewDialog from "./BallotDraftPreviewDialog";

interface BallotDraftDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  draft?: BallotDraft | null;
  mode: "create" | "edit" | "view";
}

export default function BallotDraftDialog({
  open,
  onClose,
  onSave,
  draft,
  mode,
}: BallotDraftDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<BallotDraft>({
    name: "",
    questionText: "",
    answerType: 0,
    answerTypeId: undefined,
    hasTextInput: false,
    answers: [],
    attachments: [],
    noteText: "",
  });

  const [loading, setLoading] = useState(false);
  const [newAnswerText, setNewAnswerText] = useState("");
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<BallotDraft | null>(null);

  const { ballotAnswerTypeList } = useAppSelector((state) => state.global);

  useEffect(() => {
    if (open) {
      if (!ballotAnswerTypeList) {
        dispatch(fetchAppBallotAnswerType());
      }

      if (draft && mode !== "create") {
        loadDraftData();
      } else {
        resetForm();
      }
    }
  }, [open, draft, mode, ballotAnswerTypeList]);

  const loadDraftData = async () => {
    if (!draft?.id) return;
    try {
      dispatch(setGlobalLoading(true));
      const loadedDraft = await getBallotDraftById(draft.id);
      setFormData(loadedDraft);
    } catch (err: any) {
      console.error("Error loading draft:", err);
      showError("เกิดข้อผิดพลาด", "ไม่สามารถโหลดข้อมูลแบบร่างได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      questionText: "",
      answerType: 0,
      answerTypeId: undefined,
      hasTextInput: false,
      answers: [],
      attachments: [],
      noteText: "",
    });
    setNewAnswerText("");
    setAttachmentFiles([]);
    setErrors({});
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
        ...prev.answers,
        {
          text: trimmedText,
          displayOrder: prev.answers.length + 1,
        },
      ],
    }));
    setNewAnswerText("");
  };

  const handleRemoveAnswer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      answers: prev?.answers?.filter((_, i) => i !== index),
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);

      const maxSizeBytes = 5 * 1024 * 1024; // 5MB
      const allowedExtensions = new Set([
        "pdf",
        "doc",
        "docx",
        "xls",
        "xlsx",
        "jpg",
        "jpeg",
        "png",
      ]);

      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const sizeOk = file.size <= maxSizeBytes;
        const extOk = allowedExtensions.has(ext);

        if (!extOk) {
          errors.push(`ไฟล์ "${file.name}" ไม่รองรับนามสกุล .${ext}`);
          continue;
        }

        if (!sizeOk) {
          errors.push(`ไฟล์ "${file.name}" ขนาดเกิน 5MB`);
          continue;
        }

        validFiles.push(file);
      }

      if (errors.length > 0) {
        showError("ไฟล์แนบไม่ถูกต้อง", errors[0]);
      }

      if (validFiles.length > 0) {
        setAttachmentFiles((prev) => [...prev, ...validFiles]);
      }

      // เคลียร์ค่า input เพื่อให้เลือกไฟล์ซ้ำได้
      event.target.value = "";
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "กรุณากรอกชื่อแบบร่าง";
    }
    if (!formData.questionText.trim()) {
      newErrors.questionText = "กรุณากรอกข้อความคำถาม";
    }
    if (!formData.answerType || formData.answerType === 0) {
      newErrors.answerType = "กรุณาเลือกรูปแบบคำตอบ";
    }
    // ตรวจสอบว่าถ้าไม่ใช่ Text type ต้องมีคำตอบอย่างน้อย 1 รายการ
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

    // Show confirm dialog before save
    const confirmResult = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกแบบร่างการเวียนขอข้อคิดเห็นหรือไม่?",
      "บันทึก",
      "ยกเลิก"
    );

    // If user cancels, don't save
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
            folder: `ballot/draft/attachments`,
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

      const draftToSave: BallotDraft = {
        ...formData,
        attachments: allAttachments,
      };

      await upsertBallotDraft(draftToSave);
      showSuccess("สำเร็จ", "บันทึกแบบร่างเรียบร้อยแล้ว");
      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error("Error saving ballot draft:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกแบบร่างได้"
      );
      // if (attachmentFiles.length > 0) {
      //   for (const file of attachmentFiles) {
      //     await deletefile("ballot/draft/attachments/" + file.name);
      //   }
      // }
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handlePreview = () => {
    if (!validateForm()) {
      showWarning(
        "กรุณาตรวจสอบข้อมูล",
        "กรุณากรอกข้อมูลให้ครบถ้วนก่อนดูตัวอย่าง"
      );
      return;
    }
    setSelectedDraft(formData);

    setPreviewDialogOpen(true);
  };

  const isViewMode = mode === "view";

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
        {mode === "create"
          ? "เพิ่มแบบร่าง"
          : mode === "edit"
          ? "แก้ไขแบบร่าง"
          : "ดูแบบร่าง"}
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          mt: 2,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "10px",
            "&:hover": {
              background: "#555",
            },
          },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Section 1: ข้อมูลพื้นฐาน */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Title sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                ข้อมูลพื้นฐาน
              </Typography>
            </Box>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {/* ชื่อแบบร่าง */}
                <TextField
                  label="ชื่อแบบร่าง"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (errors.name) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                  fullWidth
                  size="small"
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  slotProps={{ input: { readOnly: isViewMode } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: isViewMode
                        ? "action.disabledBackground"
                        : "background.paper",
                    },
                  }}
                />

                {/* ข้อความคำถาม */}
                <TextField
                  label="ข้อความคำถาม"
                  value={formData.questionText}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      questionText: e.target.value,
                    }));
                    if (errors.questionText) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.questionText;
                        return newErrors;
                      });
                    }
                  }}
                  fullWidth
                  multiline
                  rows={3}
                  required
                  error={!!errors.questionText}
                  helperText={errors.questionText}
                  slotProps={{ input: { readOnly: isViewMode } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: isViewMode
                        ? "action.disabledBackground"
                        : "background.paper",
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Section 2: รูปแบบคำตอบ */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <FormatListBulleted sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                รูปแบบคำตอบ
              </Typography>
            </Box>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <FormControl
                  fullWidth
                  size="small"
                  required
                  error={!!errors.answerType}
                >
                  <FormLabel sx={{ mb: 1, fontWeight: 500 }}>
                    เลือกรูปแบบคำตอบ
                  </FormLabel>
                  <Select
                    value={formData.answerType || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        answerType: Number(e.target.value),
                        answerTypeId: Number(e.target.value), // Keep for backward compatibility
                      }));
                      if (errors.answerType) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.answerType;
                          return newErrors;
                        });
                      }
                    }}
                    disabled={isViewMode}
                    sx={{
                      bgcolor: isViewMode
                        ? "action.disabledBackground"
                        : "background.paper",
                    }}
                  >
                    {ballotAnswerTypeList?.map((type: any) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    )) || []}
                  </Select>
                  {errors.answerType && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.75 }}
                    >
                      {errors.answerType}
                    </Typography>
                  )}
                </FormControl>

                {/* มีช่องใส่ข้อความ */}
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    bgcolor: formData.hasTextInput
                      ? "action.selected"
                      : "background.paper",
                    transition: "background-color 0.2s",
                  }}
                >
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
                        disabled={isViewMode}
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        มีช่องใส่ข้อความเพิ่มเติม
                      </Typography>
                    }
                  />
                </Paper>
              </Box>
            </CardContent>
          </Card>

          {/* Section 3: ข้อความคำตอบ */}
          {(() => {
            const selectedAnswerType = ballotAnswerTypeList?.find(
              (t: any) => t.id === formData.answerType
            );
            return selectedAnswerType?.name !== "Text";
          })() && (
            <Card
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <QuestionAnswer sx={{ fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  ข้อความคำตอบ
                </Typography>
                {formData?.answers?.length > 0 && (
                  <Chip
                    label={formData?.answers?.length}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.3)",
                      color: "white",
                      ml: "auto",
                    }}
                  />
                )}
              </Box>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {!isViewMode && (
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        p: 1.5,
                        bgcolor: "action.hover",
                        borderRadius: 1,
                      }}
                    >
                      <TextField
                        value={newAnswerText}
                        onChange={(e) => setNewAnswerText(e.target.value)}
                        placeholder="กรอกข้อความคำตอบ..."
                        size="small"
                        fullWidth
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddAnswer();
                          }
                        }}
                        sx={{
                          bgcolor: "background.paper",
                        }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddAnswer}
                        sx={{
                          minWidth: 130,
                          borderRadius: 1,
                          textTransform: "none",
                          fontWeight: 600,
                        }}
                      >
                        เพิ่มคำตอบ
                      </Button>
                    </Box>
                  )}
                  {formData?.answers?.length > 0 ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 0,
                        maxHeight: 300,
                        overflow: "auto",
                        "&::-webkit-scrollbar": {
                          width: "6px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "#f1f1f1",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: "#888",
                          borderRadius: "3px",
                        },
                      }}
                    >
                      <List dense>
                        {formData.answers.map((answer, index) => (
                          <ListItem
                            key={index}
                            sx={{
                              borderBottom:
                                index < formData.answers.length - 1
                                  ? "1px solid"
                                  : "none",
                              borderColor: "divider",
                              "&:hover": {
                                bgcolor: "action.hover",
                              },
                              transition: "background-color 0.2s",
                            }}
                            secondaryAction={
                              !isViewMode ? (
                                <IconButton
                                  edge="end"
                                  onClick={() => handleRemoveAnswer(index)}
                                  color="error"
                                  size="small"
                                  sx={{
                                    "&:hover": {
                                      bgcolor: "error.light",
                                      color: "white",
                                    },
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              ) : undefined
                            }
                          >
                            <Box
                              sx={{
                                minWidth: 32,
                                height: 32,
                                borderRadius: "50%",
                                bgcolor: "primary.main",
                                color: "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                mr: 2,
                                fontWeight: 600,
                                fontSize: "0.875rem",
                              }}
                            >
                              {index + 1}
                            </Box>
                            <ListItemText
                              primary={answer.text}
                              slotProps={{
                                primary: {
                                  sx: { fontWeight: 500 },
                                },
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "action.hover",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        ยังไม่มีข้อความคำตอบ
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        กรุณาเพิ่มข้อความคำตอบอย่างน้อย 1 รายการ
                      </Typography>
                    </Paper>
                  )}
                  {errors.answers && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.answers}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Section 4: รายการเอกสารแนบ */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AttachFile sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                รายการเอกสารแนบ
              </Typography>
              {(formData?.attachments?.length > 0 ||
                attachmentFiles?.length > 0) && (
                <Chip
                  label={formData?.attachments?.length + attachmentFiles?.length}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.3)",
                    color: "white",
                    ml: "auto",
                  }}
                />
              )}
            </Box>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {!isViewMode && (
                  <>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload />}
                      sx={{
                        borderRadius: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        borderStyle: "dashed",
                        borderWidth: 2,
                        "&:hover": {
                          borderStyle: "dashed",
                          borderWidth: 2,
                          bgcolor: "action.hover",
                        },
                      }}
                    >
                      เพิ่มเอกสารแนบ
                      <input
                        type="file"
                        hidden
                        multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                      />
                    </Button>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                    หมายเหตุ: รองรับไฟล์ .xlsx, .pdf, .docx, .jpg และ .png (ไม่เกิน 5MB)
                    </Typography>
                  </>
                )}
                {formData?.attachments?.length > 0 ||
                attachmentFiles.length > 0 ? (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 0,
                      maxHeight: 250,
                      overflow: "auto",
                      "&::-webkit-scrollbar": {
                        width: "6px",
                      },
                      "&::-webkit-scrollbar-track": {
                        background: "#f1f1f1",
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "#888",
                        borderRadius: "3px",
                      },
                    }}
                  >
                    <List dense>
                      {formData?.attachments?.map((attachment, index) => (
                        <ListItem
                          key={`existing-${index}`}
                          sx={{
                            borderBottom:
                              index <
                              formData?.attachments?.length +
                                attachmentFiles?.length -
                                1
                                ? "1px solid"
                                : "none",
                            borderColor: "divider",
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                            transition: "background-color 0.2s",
                          }}
                          secondaryAction={
                            !isViewMode ? (
                              <IconButton
                                edge="end"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    attachments: prev?.attachments?.filter(
                                      (_, i) => i !== index
                                    ),
                                  }));
                                }}
                                color="error"
                                size="small"
                                sx={{
                                  "&:hover": {
                                    bgcolor: "error.light",
                                    color: "white",
                                  },
                                }}
                              >
                                <Delete />
                              </IconButton>
                            ) : undefined
                          }
                        >
                          <AttachFile
                            sx={{ mr: 2, color: "text.secondary" }}
                            fontSize="small"
                          />
                          <ListItemText
                            primary={attachment.fileName}
                            slotProps={{
                              primary: {
                                sx: { fontWeight: 500 },
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                      {attachmentFiles?.map((file, index) => (
                        <ListItem
                          key={`new-${index}`}
                          sx={{
                            borderBottom:
                              index < attachmentFiles?.length - 1
                                ? "1px solid"
                                : "none",
                            borderColor: "divider",
                            "&:hover": {
                              bgcolor: "action.hover",
                            },
                            transition: "background-color 0.2s",
                          }}
                          secondaryAction={
                            !isViewMode ? (
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveAttachment(index)}
                                color="error"
                                size="small"
                                sx={{
                                  "&:hover": {
                                    bgcolor: "error.light",
                                    color: "white",
                                  },
                                }}
                              >
                                <Delete />
                              </IconButton>
                            ) : undefined
                          }
                        >
                          <AttachFile
                            sx={{ mr: 2, color: "primary.main" }}
                            fontSize="small"
                          />
                          <ListItemText
                            primary={file.name}
                            secondary="ไฟล์ใหม่"
                            slotProps={{
                              primary: {
                                sx: { fontWeight: 500 },
                              },
                              secondary: {
                                variant: "caption",
                                sx: { color: "primary.main" },
                              },
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: "action.hover",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีเอกสารแนบ
                    </Typography>
                  </Paper>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Section 5: หมายเหตุ */}
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "white",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Note sx={{ fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                หมายเหตุ
              </Typography>
            </Box>
            <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
              <TextField
                label="หมายเหตุ (สามารถแก้ไขได้)"
                value={formData?.noteText || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    noteText: e.target.value,
                  }))
                }
                fullWidth
                multiline
                rows={3}
                slotProps={{ input: { readOnly: isViewMode } }}
                helperText="ข้อความนี้จะแสดงในหน้าดูตัวอย่าง"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: isViewMode
                      ? "action.disabledBackground"
                      : "background.paper",
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          gap: 1.5,
          bgcolor: "grey.50",
          borderTop: "1px solid",
          borderColor: "divider",
          flexDirection: isMobileDialog ? "column" : "row",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          fullWidth={isMobileDialog}
          sx={{
            borderRadius: 1,
            textTransform: "none",
            fontWeight: 600,
            minWidth: 120,
          }}
        >
          {isViewMode ? "ปิด" : "ยกเลิก"}
        </Button>
        {!isViewMode && (
          <>
            <Button
              onClick={handlePreview}
              variant="contained"
              color="info"
              startIcon={<Preview />}
              disabled={loading}
              fullWidth={isMobileDialog}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 140,
              }}
            >
              ดูตัวอย่าง
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              color="primary"
              startIcon={<Save />}
              disabled={loading}
              fullWidth={isMobileDialog}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                fontWeight: 600,
                minWidth: 120,
                boxShadow: 2,
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              บันทึก
            </Button>
          </>
        )}
      </DialogActions>
      {previewDialogOpen && (
        <BallotDraftPreviewDialog
          open={previewDialogOpen}
          onClose={() => setPreviewDialogOpen(false)}
          draft={selectedDraft || null}
        />
      )}
    </Dialog>
  );
}
