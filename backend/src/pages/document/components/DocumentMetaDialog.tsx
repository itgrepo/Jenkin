import { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import type { MasterData } from "@models/global";
import type { Meeting } from "@models/meeting";
import type { Project } from "@models/projects";
import { getApprovedMeetings } from "@services/meetingService";
import { getProjects } from "@services/projectService";
import { upsertDocument } from "@services/documentService";
import { uploadFileServer } from "@utils/fileService";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import type { AxiosError } from "axios";
import { Close, Edit, ListAlt } from "@mui/icons-material";
import { DocumentItem } from "@models/documents";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppDocumentSubType, fetchAppDocumentType, setGlobalLoading } from "@store/globalSlice";
import { getBallotRequests } from "@services/ballotService";
import { BallotRequest } from "@models/ballot";
import { getFileNameFromPath } from "@utils/index";

dayjs.locale("th");



export interface DocumentMetaDialogProps {
  open: boolean;
  onClose: () => void;
  onBack: () => void;
  onSuccess: () => void;
  typeCode: string;
  typeName: string;
  committeeId?: number;
  documentTypeList: MasterData[];
  documentItem?: DocumentItem;
  /** ซ่อนปุ่ม Back (ใช้ในโหมดแก้ไข) */
  hideBack?: boolean;
}

export default function DocumentMetaDialog({
  open,
  onClose,
  onBack,
  onSuccess,
  typeCode,
  typeName,
  committeeId,
  documentItem,
  hideBack = false,
}: DocumentMetaDialogProps) {

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(documentItem?.title || "");
  const [description, setDescription] = useState(documentItem?.description || "");
  const [subTypeCode, setSubTypeCode] = useState(documentItem?.subTypeCode || "");
  const [subTypeName, setSubTypeName] = useState(documentItem?.subTypeName || "");
  const [meetingId, setMeetingId] = useState<number | "">(documentItem?.meetingId || "");
  const [meetingName, setMeetingName] = useState(documentItem?.meetingName || "");
  const [projectId, setProjectId] = useState<number | "">(documentItem?.projectId || "");
  const [projectName, setProjectName] = useState(documentItem?.projectName || "");
  const [ballotId, setBallotId] = useState<number | "">(documentItem?.ballotId || "");
  const [ballotName, setBallotName] = useState(documentItem?.ballotName || "");
  const [replaces, setReplaces] = useState(documentItem?.replaces || "");
  const [expectedAction, setExpectedAction] = useState(documentItem?.expectedAction || "");
  const [expectedDate, setExpectedDate] = useState<Dayjs | null>(documentItem?.expectedDate ? dayjs(documentItem.expectedDate) : null);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [ballots, setBallots] = useState<BallotRequest[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showMeeting = typeCode === "MEETING" || typeCode === "BALLOT";
  const showProject = typeCode === "PROJECT";
  const showBallot = typeCode === "RESOLUTION";
  const subTypeRequired = typeCode !== "GENERAL" && typeCode !== "FILE" && typeCode !== "FOLDER";
  const isFolder = typeCode === "FOLDER"
  const isFile = typeCode === "FILE"

  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  const { documentSubTypeList,documentTypeList } = useAppSelector((state) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!documentTypeList) {
      dispatch(fetchAppDocumentType());
    }
    if (!documentSubTypeList) {
      dispatch(fetchAppDocumentSubType());
    }
  }, [documentTypeList, documentSubTypeList, dispatch]);


  const loadMeetings = useCallback(async () => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getApprovedMeetings({});
      setMeetings(res.data || []);
    } catch (e) {
      console.error("Load meetings:", e);
      setMeetings([]);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getProjects({ stageCode: "60.60", limit: 500 });
      setProjects(res.data || []);
    } catch (e) {
      console.error("Load projects:", e);
      setProjects([]);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }, []);

  const loadBallots = useCallback(async () => {
    try {

      dispatch(setGlobalLoading(true));
      const params: any = {
        status: ["director_approved", "closed"],
      };

      const res = await getBallotRequests(params);
      setBallots(res.data || []);
    } catch (e) {
      console.error("Load ballots:", e);
      setBallots([]);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  }, []);
  useEffect(() => {
    if (!open) return;
    setFile(null);
    setErrors({});
    if (documentItem?.id && documentItem?.typeCode !== "FOLDER") {
      setTitle(documentItem.title ?? "");
      setDescription(documentItem.description ?? "");
      setSubTypeCode(documentItem.subTypeCode ?? "");
      setSubTypeName(documentItem.subTypeName ?? "");
      setMeetingId(documentItem.meetingId != null ? documentItem.meetingId : "");
      setMeetingName(documentItem.meetingName ?? "");
      setProjectId(documentItem.projectId != null ? documentItem.projectId : "");
      setProjectName(documentItem.projectName ?? "");
      setBallotId(documentItem.ballotId != null ? documentItem.ballotId : "");
      setBallotName(documentItem.ballotName ?? "");
      setReplaces(documentItem.replaces ?? "");
      setExpectedAction(documentItem.expectedAction ?? "");
      setExpectedDate(documentItem.expectedDate ? dayjs(documentItem.expectedDate) : null);
    } else {
      setTitle("");
      setDescription("");
      setSubTypeCode("");
      setSubTypeName("");
      setMeetingId("");
      setMeetingName("");
      setProjectId("");
      setProjectName("");
      setBallotName("");
      setBallotId("");
      setReplaces("");
      setExpectedAction("");
      setExpectedDate(null);
    }
    if (showMeeting) loadMeetings();
    if (showProject) loadProjects();
    if (showBallot) loadBallots();
  }, [open, documentItem?.id, showMeeting, showProject, showBallot, loadMeetings, loadProjects, loadBallots]);

  const checkTitleContainsTypeCode = (titleValue: string): string | null => {
    if (!documentTypeList || !titleValue.trim()) return null;
    const titleLower = titleValue.trim().toLowerCase();
    const forbiddenCode = documentTypeList.find(
      (type) => {
        if (!type.code) return false;
        return titleLower.includes(type.code.toLowerCase());
      }
    );
    return forbiddenCode?.code ?? null;
  };

  const MAX_FILE_SIZE_MB = 20;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) {
      e.title = "กรุณากรอก Title";
    } else {
      const forbiddenCode = checkTitleContainsTypeCode(title);
      if (forbiddenCode) {
        e.title = `ห้ามใช้คำ "${forbiddenCode}" ใน Title/Folder Name`;
      }
    }
    if (!description.trim()) e.description = "กรุณากรอก Description";

    if (!isFolder && !isFile) {
      if (subTypeRequired && !subTypeCode) e.subType = "กรุณาเลือก SubType";
      if (showMeeting && !meetingId) e.meeting = "กรุณาเลือก Meeting";
      if (!replaces.trim()) e.replaces = "กรุณากรอก Replaces";
      if (!expectedAction.trim()) e.expectedAction = "กรุณากรอก Expected action";
      if (!expectedDate) e.expectedDate = "กรุณาเลือก Expected date";
    }

    // Validate file upload (เมื่อมีส่วน upload)
    if (!isFolder) {
      if (!documentItem?.id) {
        // สร้างใหม่: ต้องมีไฟล์
        if (!file) {
          e.file = "กรุณาอัปโหลดไฟล์ (PDF)";
        }
      }
      if (file) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          e.file = `ขนาดไฟล์ไม่เกิน ${MAX_FILE_SIZE_MB} MB`;
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    const isEdit = !!documentItem?.id;
    const confirm = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการบันทึก",
      isEdit
        ? "คุณต้องการอัปเดตข้อมูลเอกสารนี้หรือไม่?"
        : "คุณต้องการสร้างเอกสารนี้หรือไม่?"
    );
    if (!confirm.isConfirmed) return;
    setSaving(true);
    setErrors({});
    try {
      let filePath: string | undefined;
      let mimeType: string | undefined;

      // จัดการ filePath สำหรับ FOLDER
      if (typeCode === "FOLDER") {
        if (isEdit && documentItem?.filePath) {
          // แก้ไข FOLDER: ใช้ path เดิม + ชื่อใหม่
          filePath = `${documentItem.filePath}/${title.trim()}`;
        } else if (!isEdit && documentItem?.typeCode === "FOLDER" && documentItem?.filePath) {
          // สร้าง FOLDER ใหม่ภายใต้ FOLDER อื่น: ใช้ filePath ของ parent folder
          filePath = `${documentItem.filePath}/${title.trim()}`;
        } else {
          // สร้าง FOLDER ใหม่ที่ root: documents/{folderName}
          filePath = `documents/${title.trim()}`;
        }
      } else {
        // จัดการ filePath สำหรับเอกสาร (ไม่ใช่ FOLDER)
        if (file) {
          // อัปโหลดไฟล์ใหม่
          filePath = await uploadFileServer({
            file,
            folder: documentItem?.typeCode === "FOLDER" ? `${documentItem.filePath}/${typeCode.toLowerCase()}` : `documents/${typeCode.toLowerCase()}`,
           // oldFile: documentItem?.filePath || undefined,
          });
          mimeType = file.type || undefined;
        } else if (isEdit && documentItem?.filePath) {
          // แก้ไขแต่ไม่เปลี่ยนไฟล์: ใช้ไฟล์เดิม
          filePath = documentItem.filePath;
          mimeType = documentItem.mimeType ?? undefined;
        }
        // ถ้าไม่ใช่ทั้งสองกรณี (สร้างใหม่ไม่มีไฟล์) filePath จะเป็น undefined
      }

      // สร้าง payload ตาม typeCode
      let payload: DocumentItem;

      if (typeCode === "FOLDER") {
        // FOLDER: payload เฉพาะที่จำเป็น
        payload = {
          title: title.trim(),
          typeCode,
          typeName,
          committeeId,
          description: description.trim(),
          filePath: filePath || undefined,
        } as DocumentItem;
      } else if (isEdit && documentItem?.typeCode === "FOLDER") {
        // สร้างเอกสารใหม่ใน FOLDER (เปลี่ยนจาก FOLDER เป็นเอกสาร)
        payload = {
          nNumber: documentItem?.nNumber || undefined,
          title: title.trim(),
          typeCode,
          typeName,
          subTypeCode: subTypeCode || undefined,
          subTypeName: subTypeName || undefined,
          meetingId: meetingId || undefined,
          meetingName: meetingName || undefined,
          projectId: projectId || undefined,
          projectName: projectName || undefined,
          ballotId: ballotId || undefined,
          ballotName: ballotName || undefined,
          replaces: replaces.trim(),
          expectedAction: expectedAction.trim(),
          expectedDate: expectedDate ? expectedDate.format("YYYY-MM-DD") : undefined,
          description: description.trim(),
          committeeId,
          filePath,
          mimeType,
        } as DocumentItem;
      } else {
        // เอกสารปกติ (ไม่ใช่ FOLDER)
        payload = {
          id: documentItem?.id || undefined,
          nNumber: documentItem?.nNumber || undefined,
          title: title.trim(),
          typeCode,
          typeName,
          subTypeCode: subTypeCode || undefined,
          subTypeName: subTypeName || undefined,
          meetingId: meetingId || undefined,
          meetingName: meetingName || undefined,
          projectId: projectId || undefined,
          projectName: projectName || undefined,
          ballotId: ballotId || undefined,
          ballotName: ballotName || undefined,
          replaces: replaces.trim(),
          expectedAction: expectedAction.trim(),
          expectedDate: expectedDate ? expectedDate.format("YYYY-MM-DD") : undefined,
          description: description.trim(),
          committeeId,
          filePath,
          mimeType,
        };
      }
      await upsertDocument(payload);
      showSuccess("บันทึกสำเร็จ", isEdit ? "อัปเดตเอกสารเรียบร้อยแล้ว" : "สร้างเอกสารเรียบร้อยแล้ว");
      onSuccess();
      handleClose();
    } catch (err: unknown) {
      const ax = err as AxiosError<{ message?: string; error?: string }>;
      showError(
        "เกิดข้อผิดพลาด",
        ax?.response?.data?.message || ax?.response?.data?.error || "ไม่สามารถสร้างเอกสารได้"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle("");
    setDescription("");
    setSubTypeCode("");
    setSubTypeName("");
    setMeetingId("");
    setMeetingName("");
    setProjectId("");
    setProjectName("");
    setBallotName("");
    setBallotId("");
    setReplaces("");
    setExpectedAction("");
    setExpectedDate(null);
    setErrors({});
    onClose();
  };

  const handleBack = () => {
    handleClose();
    onBack();
  };

  const handleSubTypeChange = (opt: MasterData | null) => {
    setSubTypeCode(opt?.code ?? "");
    setSubTypeName(opt?.name ?? "");
  };

  const selectedSubType =
    subTypeCode && documentSubTypeList
      ? documentSubTypeList.find((o) => o.code === subTypeCode) ?? null
      : null;

  const handleMeetingChange = (m: Meeting | null) => {
    setMeetingId(m?.id ?? "");
    setMeetingName(m ? `${m.meetingSubject||"-"}` : "");
  };

  const selectedMeeting =
    meetingId !== "" ? meetings.find((m) => m.id === meetingId) ?? null : null;

  const handleProjectChange = (p: Project | null) => {
    setProjectId(p?.id ?? "");
    setProjectName(p?.nameThai ?? p?.name ?? "");
  };

  const selectedProject =
    projectId !== "" ? (projects || []).find((p) => p.id === projectId) ?? null : null;

  const handleBallotChange = (b: BallotRequest | null) => {
    setBallotId(b?.id ?? "");
    setBallotName(b?.name ?? "");
  };

  const selectedBallot =
    ballotId !== "" ? (ballots || []).find((b) => b.id === ballotId) ?? null : null;

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
            borderRadius: isMobileDialog ? 0 : 3,
            maxHeight: isMobileDialog ? "100vh" : "90vh",
            background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
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
          gap: 2,
          py: 3,
          px: 4,
        }}
      >
        <ListAlt sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography component="span" variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {documentItem?.id ? "แก้ไขข้อมูลเอกสาร" : "เลือกประเภทเอกสาร"}
          </Typography>
        </Box>
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
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mt: 2 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            <Grid container spacing={2}>
              {/* Content / File upload */}

              {!isFolder &&
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Content</Typography>
                  {documentItem?.filePath && !file && documentItem?.typeCode !== "FOLDER" ? (
                    <Box
                      sx={{
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        bgcolor: "grey.50",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          ไฟล์ปัจจุบัน:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {documentItem?.typeCode !== "FOLDER"&&getFileNameFromPath(documentItem.filePath)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => document.getElementById("doc-meta-file")?.click()}
                        sx={{ color: "primary.main" }}
                        aria-label="แก้ไขไฟล์"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                  ) : (
                    <Box
                      onClick={() => document.getElementById("doc-meta-file")?.click()}
                      sx={{
                        border: "2px dashed",
                        borderColor: errors.file ? "error.main" : "divider",
                        borderRadius: 2,
                        p: 3,
                        textAlign: "center",
                        cursor: "pointer",
                        bgcolor: errors.file ? "error.light" : "action.hover",
                        "&:hover": {
                          borderColor: errors.file ? "error.main" : "primary.main",
                          bgcolor: errors.file ? "error.light" : "action.selected",
                        },
                      }}
                    >
                      <Typography component="span" color="primary" sx={{ textDecoration: "underline" }}>
                        Upload main file
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {documentItem?.id ? "Optional — หากไม่เลือกจะใช้ไฟล์เดิม" : "กรุณาอัปโหลดไฟล์ PDF,Word,Excel,PowerPoint (ไม่เกิน 20 MB)"}
                      </Typography>
                      {file && (
                        <Typography variant="body2" sx={{ mt: 1 }}>{file.name}</Typography>
                      )}
                      {errors.file && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                          {errors.file}
                        </Typography>
                      )}
                    </Box>
                  )}
                  <input
                    id="doc-meta-file"
                    type="file"
                    hidden
                    onChange={(e) => {
                      setFile(e.target.files?.[0] ?? null);
                      if (errors.file) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.file;
                          return next;
                        });
                      }
                    }}
                    accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.ppt"
                  />
                </Grid>
              }
              {isFolder && (
                <Typography component="span" variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  Folder path : {(documentItem?.filePath || "") + "/" + title.trim()}
                </Typography>
              )}
              <Grid size={12}>
                <TextField
                  fullWidth
                  label={isFolder ? "Folder Name" : "Title"}
                  value={title}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setTitle(newValue);
                    // Clear title error when user types
                    if (errors.title && errors.title !== "กรุณากรอก Title") {
                      const forbiddenCode = checkTitleContainsTypeCode(newValue);
                      if (!forbiddenCode) {
                        const newErrors = { ...errors };
                        delete newErrors.title;
                        setErrors(newErrors);
                      }
                    }
                  }}
                  error={!!errors.title}
                  helperText={errors.title}
                  required
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                />
              </Grid>

              <Grid size={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Type"
                  value={typeCode}
                  disabled
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
              {!isFolder && !isFile &&
                <>

                  <Grid size={6}>
                    <Autocomplete
                      options={documentSubTypeList ?? []}
                      getOptionLabel={(o) => o.name ?? ""}
                      value={selectedSubType}
                      onChange={(_, v) => handleSubTypeChange(v)}
                      isOptionEqualToValue={(a, b) => (a?.code ?? "") === (b?.code ?? "")}
                      size="small"
                      renderOption={(props, o) => (
                        <li {...props} key={o.id ?? o.code ?? props.id}>
                          {o.name ?? ""}
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="SubType *"
                          required={subTypeRequired}
                          error={!!errors.subType}
                          helperText={errors.subType}
                        />
                      )}
                    />
                  </Grid>

                  {showMeeting && (
                    <Grid size={12}>
                      <Autocomplete
                        options={meetings}
                        getOptionLabel={(m) => `${m.meetingSubject||"-"}`}
                        value={selectedMeeting}
                        onChange={(_, v) => handleMeetingChange(v)}
                        isOptionEqualToValue={(a, b) => (a?.id ?? null) === (b?.id ?? null)}
                        size="small"
                        renderOption={(props, m) => (
                          <li {...props} key={m.id}>
                            {m.meetingSubject||"-"}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Meeting *"
                            required
                            error={!!errors.meeting}
                            helperText={errors.meeting}
                          />
                        )}
                      />
                    </Grid>
                  )}
                  {showProject && (
                    <Grid size={12}>
                      <Autocomplete
                        options={projects || []}
                        getOptionLabel={(p) => p.nameThai ?? p.name ?? "-"}
                        value={selectedProject}
                        onChange={(_, v) => handleProjectChange(v)}
                        isOptionEqualToValue={(a, b) => (a?.id ?? null) === (b?.id ?? null)}
                        size="small"
                        renderOption={(props, p) => (
                          <li {...props} key={p.id}>
                            {p.nameThai ?? p.name ?? "-"}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField {...params} label="Project" />
                        )}
                      />
                    </Grid>
                  )}
                  {showBallot && (
                    <Grid size={12}>
                      <Autocomplete
                        options={ballots || []}
                        getOptionLabel={(b) => b.name ?? "-"}
                        value={selectedBallot}
                        onChange={(_, v) => handleBallotChange(v)}
                        isOptionEqualToValue={(a, b) => (a?.id ?? null) === (b?.id ?? null)}
                        size="small"
                        renderOption={(props, b) => (
                          <li {...props} key={b.id}>
                            {b.name ?? "-"}
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField {...params} label="Ballot" />
                        )}
                      />
                    </Grid>
                  )}

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Replaces"
                      value={replaces}
                      onChange={(e) => setReplaces(e.target.value)}
                      error={!!errors.replaces}
                      helperText={errors.replaces}
                      required
                    />
                  </Grid>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Expected action"
                      value={expectedAction}
                      onChange={(e) => setExpectedAction(e.target.value)}
                      error={!!errors.expectedAction}
                      helperText={errors.expectedAction}
                      required
                    />
                  </Grid>
                  <Grid size={12}>
                    <DatePicker
                      label="Expected date"
                      value={expectedDate}
                      onChange={(v) => setExpectedDate(v)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: !!errors.expectedDate,
                          helperText: errors.expectedDate,
                          required: true,
                        },
                      }}
                    />
                  </Grid>
                </>
              }
            </Grid>
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">CANCEL</Button>
        {!hideBack && <Button onClick={handleBack} color="inherit">BACK</Button>}
        <Button variant="contained" onClick={handleCreate} disabled={saving}>
          {saving ? "กำลังบันทึก..." : documentItem?.id && documentItem?.typeCode !== "FOLDER" ? "อัปเดต" : "CREATE"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
