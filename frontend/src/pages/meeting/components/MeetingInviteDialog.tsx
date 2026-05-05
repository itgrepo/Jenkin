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
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from "@mui/material";
import { Close, Upload, Description, Email, Save } from "@mui/icons-material";
import { Meeting, MeetingInvitation, MeetingParticipant } from "@models/meeting";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import {
  showError,
  showSuccess,
  showWarning,
  showConfirm,
} from "@components/Swal";
import {
  getMeetingInvitation,
  upsertMeetingInvitation,
  sendMeetingInvitationEmail,
  getMeetingParticipants,
  upsertMeetingParticipant,
} from "@services/meetingService";
import { uploadFileServer } from "@utils/fileService";
import { generateInvitationLetterPDFMultiPage } from "@utils/pdfGenerator";

interface MeetingInviteDialogProps {
  open: boolean;
  meeting: Meeting;
  onClose: () => void;
  onSave?: () => void;
}

type MeetingFormat = "onsite" | "online" | "hybrid";

export default function MeetingInviteDialog({
  open,
  meeting,
  onClose,
  onSave,
}: MeetingInviteDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState<MeetingInvitation>({
    id: 0,
    meetingId: 0, // Will be set from meeting.id
    meetingFormat: "onsite",
    meetingLocation: "",
    meetingRoom: "",
    meetingIdOnline: "",
    passcode: "",
    meetingLink: "",
    agendaFilePath: "",
    agendaFileName: "",
    supportingDocumentPaths: [],
    supportingDocumentNames: [],
    invitationLetterFilePath: "",
    invitationLetterFileName: "",
  });

  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // เก็บ File objects สำหรับอัปโหลด (ไม่ได้อยู่ใน MeetingInvitation interface)
  const [agendaFile, setAgendaFile] = useState<File | null>(null);
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([]);
  const [invitationLetterFile, setInvitationLetterFile] = useState<File | null>(
    null
  );
  const [participants, setParticipants] = useState<MeetingParticipant[]>([]);

  // เก็บ file paths เก่าสำหรับลบเมื่ออัปโหลดไฟล์ใหม่
  const [oldAgendaFilePath, setOldAgendaFilePath] = useState<string>("");
  const [oldInvitationLetterFilePath, setOldInvitationLetterFilePath] =
    useState<string>("");
  const [oldSupportingDocumentPaths, setOldSupportingDocumentPaths] = useState<
    string[]
  >([]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && meeting.id) {
      loadMeetingInvitation();
      setIsSaved(false);
      // Reset file objects
      setAgendaFile(null);
      setSupportingDocuments([]);
      setInvitationLetterFile(null);
      // Reset old file paths
      setOldAgendaFilePath("");
      setOldInvitationLetterFilePath("");
      setOldSupportingDocumentPaths([]);
      // Reset errors
      setErrors({});
    }
  }, [open, meeting.id]);

  const loadMeetingInvitation = async () => {
    if (!meeting.id) return;
    try {
      dispatch(setGlobalLoading(true));
      const participantsRes = await getMeetingParticipants(meeting.id);
      const participants = participantsRes.data || [];
      setParticipants(participants);
      const res = await getMeetingInvitation(meeting.id);
      setFormData({
        id: res.id,
        meetingId: meeting.id,
        meetingFormat: res.meetingFormat || "onsite",
        meetingLocation: res.meetingLocation || "",
        meetingRoom: res.meetingRoom || "",
        meetingIdOnline: res.meetingIdOnline || "",
        passcode: res.passcode || "",
        meetingLink: res.meetingLink || "",
        agendaFileName: res.agendaFileName || "",
        agendaFilePath: res.agendaFilePath || "",
        supportingDocumentNames: res.supportingDocumentNames || [],
        supportingDocumentPaths: res.supportingDocumentPaths || [],
        invitationLetterFileName: res.invitationLetterFileName || "",
        invitationLetterFilePath: res.invitationLetterFilePath || "",
        emailSentStatus: res.emailSentStatus || "",
      });
      // Reset file objects when loading existing data
      setAgendaFile(null);
      setSupportingDocuments([]);
      setInvitationLetterFile(null);
      // เก็บ file paths เก่าสำหรับลบเมื่ออัปโหลดไฟล์ใหม่
      setOldAgendaFilePath(res.agendaFilePath || "");
      setOldInvitationLetterFilePath(res.invitationLetterFilePath || "");
      setOldSupportingDocumentPaths(res.supportingDocumentPaths || []);
      setIsSaved(true); // มีข้อมูลแล้ว แสดงว่าบันทึกแล้ว
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error("Error loading meeting invitation:", err);
      }
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleFileUpload = (
    field: "agendaFile" | "invitationLetterFile",
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (field === "agendaFile") {
        setAgendaFile(file);
        setFormData((prev) => ({
          ...prev,
          agendaFileName: file.name,
        }));
        // Clear error when user uploads file
        if (errors.agendaFile) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.agendaFile;
            return newErrors;
          });
        }
      } else {
        setInvitationLetterFile(file);
        setFormData((prev) => ({
          ...prev,
          invitationLetterFileName: file.name,
        }));
      }
    }
  };

  const handleSupportingDocumentsUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSupportingDocuments((prev) => [...prev, ...fileArray]);
      setFormData((prev) => ({
        ...prev,
        supportingDocumentNames: [
          ...(prev.supportingDocumentNames || []),
          ...fileArray.map((f) => f.name),
        ],
      }));
    }
  };

  const removeSupportingDocument = (index: number) => {
    setSupportingDocuments((prev) => {
      const newDocs = [...prev];
      newDocs.splice(index, 1);
      return newDocs;
    });
    setFormData((prev) => {
      const newNames = [...(prev.supportingDocumentNames || [])];
      newNames.splice(index, 1);
      return {
        ...prev,
        supportingDocumentNames: newNames,
      };
    });
  };

  const handleGenerateInvitationLetter = async () => {
    if (!meeting.id) return;
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // ดึงข้อมูลผู้เข้าร่วมประชุม
      // const participantsRes = await getMeetingParticipants(meeting.id);
      // const participants = participantsRes.data || [];

      if (participants.length === 0) {
        showWarning("แจ้งเตือน", "ไม่พบผู้เข้าร่วมประชุม กรุณาเพิ่มผู้เข้าร่วมประชุมก่อน");
        return;
      }

      // สร้าง PDF หลายหน้า (รวมทุกผู้เข้าร่วมประชุมในไฟล์เดียว)
      const pdfBlob = await generateInvitationLetterPDFMultiPage(
        {
          // Meeting info
          committeeNumber: meeting.committeeNumber || "",
          committeeName: meeting.committeeName || "",
          instanceNumber: meeting.instanceNumber || "",
          startDate: meeting.startDate || "",
          endDate: meeting.endDate || "",
          startTime: meeting.startTime || "",
          endTime: meeting.endTime || "",
          meetingSubject: meeting.meetingSubject,
          
          // Invitation info
          meetingFormat: formData.meetingFormat,
          meetingLocation: formData.meetingLocation,
          meetingRoom: formData.meetingRoom,
          meetingIdOnline: formData.meetingIdOnline,
          passcode: formData.passcode,
          meetingLink: formData.meetingLink,
          
          // Document info (จาก meeting หรือ default)
          documentNumber: `ที่ อก 0704/ว 0105`, // TODO: ดึงจาก API หรือ config
          responsiblePerson: meeting.responsiblePerson || "",
          responsiblePersonTitle: `กรรมการและผู้ช่วยเลขานุการ กว. ${meeting.committeeNumber || ""}`,
          department: "กองกำหนดมาตรฐาน\nกลุ่มกำหนดมาตรฐาน 8", // TODO: ดึงจาก API
          phone: "0 2430 6828 ต่อ 1780", // TODO: ดึงจาก API
          email: "korn@tisi.mail.go.th", // TODO: ดึงจาก API
        },
        participants.map((p) => ({
          name: p.name,
          email: p.email,
        }))
      );

      // Download PDF
      const fileName = `หนังสือเชิญประชุม_${meeting.committeeNumber}_${meeting.instanceNumber}_${participants.length}คน.pdf`;
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // showSuccess(
      //   "สำเร็จ",
      //   `สร้างและดาวน์โหลดหนังสือเชิญประชุมเรียบร้อยแล้ว ${participants.length} ฉบับ (รวมในไฟล์เดียว)`
      // );
    } catch (err: any) {
      console.error("Error generating invitation letter:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถสร้างหนังสือเชิญประชุมได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate meeting format (always required, but has default value)
    if (!formData.meetingFormat) {
      newErrors.meetingFormat = "กรุณาเลือกรูปแบบการประชุม";
    }

    // Validate location and room for onsite/hybrid
    if (
      formData.meetingFormat === "onsite" ||
      formData.meetingFormat === "hybrid"
    ) {
      if (!formData.meetingLocation?.trim()) {
        newErrors.meetingLocation = "กรุณากรอกสถานที่ประชุม";
      }
      if (!formData.meetingRoom?.trim()) {
        newErrors.meetingRoom = "กรุณากรอกห้องที่ประชุม";
      }
    }

    // Validate online meeting details for online/hybrid
    if (
      formData.meetingFormat === "online" ||
      formData.meetingFormat === "hybrid"
    ) {
      if (!formData.meetingIdOnline?.trim() && !formData.meetingLink?.trim()) {
        newErrors.meetingId = "กรุณากรอก Meeting ID หรือ Link Meeting";
        newErrors.meetingLink = "กรุณากรอก Meeting ID หรือ Link Meeting";
      }
    }

    // Validate agenda file (required)
    if (!agendaFile && !formData.agendaFileName && !oldAgendaFilePath) {
      newErrors.agendaFile = "กรุณาอัปโหลดไฟล์วาระการประชุม";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleSave = async () => {
    if (!meeting.id) return;

    // Validate form before save
    if (!validateForm()) {
      showWarning("กรุณาตรวจสอบข้อมูล", "กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    // Show confirm dialog before save
    const confirmResult = await showConfirm(
      "ยืนยันการบันทึก",
      "คุณต้องการบันทึกข้อมูลเชิญประชุมหรือไม่?",
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

      for (const participant of participants) {
        await upsertMeetingParticipant(meeting.id, {...participant,attended:true});
      }

      // Upload files to MinIO
      let agendaFilePath = "";
      let invitationLetterFilePath = "";
      const supportingDocumentPaths: string[] = [];

      // Upload agenda file
      if (agendaFile) {
        try {
          agendaFilePath = await uploadFileServer({
            file: agendaFile,
            folder: `meetings/invitation/agenda`,
            oldFile: oldAgendaFilePath, // ลบไฟล์เก่าก่อนอัปโหลดไฟล์ใหม่
          });
        } catch (err: any) {
          console.error("Error uploading agenda file:", err);
          showError("เกิดข้อผิดพลาด", "ไม่สามารถอัปโหลดไฟล์วาระการประชุมได้");
          return;
        }
      } else if (oldAgendaFilePath) {
        // ถ้าไม่มีการอัปโหลดไฟล์ใหม่ แต่มีไฟล์เก่า ให้ใช้ไฟล์เก่า
        agendaFilePath = oldAgendaFilePath;
      }

      // Upload supporting documents
      // ถ้ามีการอัปโหลดไฟล์ใหม่ทั้งหมด ให้ลบไฟล์เก่าทั้งหมดก่อน
      if (supportingDocuments.length > 0) {
        // ลบไฟล์เก่าทั้งหมดก่อน
        const { deletefile } = await import("@services/globalService");
        for (const oldPath of oldSupportingDocumentPaths) {
          try {
            if (oldPath) {
              await deletefile(oldPath);
            }
          } catch (err: any) {
            console.warn("Error deleting old supporting document:", err);
            // ไม่ throw error เพราะอาจจะไม่มีไฟล์เก่า
          }
        }

        // อัปโหลดไฟล์ใหม่ทั้งหมด
        for (const file of supportingDocuments) {
          try {
            const filePath = await uploadFileServer({
              file: file,
              folder: `meetings/invitation/supporting-documents`,
            });
            supportingDocumentPaths.push(filePath);
          } catch (err: any) {
            console.error("Error uploading supporting document:", err);
            showError(
              "เกิดข้อผิดพลาด",
              `ไม่สามารถอัปโหลดไฟล์ ${file.name} ได้`
            );
            return;
          }
        }
      } else if (oldSupportingDocumentPaths.length > 0) {
        // ถ้าไม่มีการอัปโหลดไฟล์ใหม่ แต่มีไฟล์เก่า ให้ใช้ไฟล์เก่า
        supportingDocumentPaths.push(...oldSupportingDocumentPaths);
      }

      // Upload invitation letter file
      if (invitationLetterFile) {
        try {
          invitationLetterFilePath = await uploadFileServer({
            file: invitationLetterFile,
            folder: `meetings/invitation/invitation-letter`,
            oldFile: oldInvitationLetterFilePath, // ลบไฟล์เก่าก่อนอัปโหลดไฟล์ใหม่
          });
        } catch (err: any) {
          console.error("Error uploading invitation letter file:", err);
          showError(
            "เกิดข้อผิดพลาด",
            "ไม่สามารถอัปโหลดไฟล์หนังสือเชิญประชุมได้"
          );
          return;
        }
      } else if (oldInvitationLetterFilePath) {
        // ถ้าไม่มีการอัปโหลดไฟล์ใหม่ แต่มีไฟล์เก่า ให้ใช้ไฟล์เก่า
        invitationLetterFilePath = oldInvitationLetterFilePath;
      }

      // Prepare data to send as JSON object
      // All file paths are sent as strings, empty strings for optional fields
      const invitationData: MeetingInvitation = {
        meetingId: meeting.id,
        meetingFormat: formData.meetingFormat,
        meetingLocation: formData.meetingLocation || "",
        meetingRoom: formData.meetingRoom || "",
        meetingIdOnline: formData.meetingIdOnline || "",
        passcode: formData.passcode || "",
        meetingLink: formData.meetingLink || "",
        agendaFileName: agendaFilePath
          ? agendaFile
            ? agendaFile.name
            : formData.agendaFileName || ""
          : "",
        agendaFilePath: agendaFilePath || "",
        supportingDocumentNames:
          supportingDocuments.length > 0
            ? supportingDocuments.map((f) => f.name)
            : formData.supportingDocumentNames || [],
        supportingDocumentPaths: supportingDocumentPaths || [],
        invitationLetterFileName: invitationLetterFilePath
          ? invitationLetterFile
            ? invitationLetterFile.name
            : formData.invitationLetterFileName || ""
          : "",
        invitationLetterFilePath: invitationLetterFilePath || "",
      };
      

      await upsertMeetingInvitation(meeting.id, invitationData);

      // อัปเดต old file paths หลังจากบันทึกสำเร็จ
      if (agendaFilePath) {
        setOldAgendaFilePath(agendaFilePath);
      }
      if (invitationLetterFilePath) {
        setOldInvitationLetterFilePath(invitationLetterFilePath);
      }
      if (supportingDocumentPaths.length > 0) {
        setOldSupportingDocumentPaths(supportingDocumentPaths);
      }

      setIsSaved(true);
      showSuccess("สำเร็จ", "บันทึกข้อมูลเชิญประชุมเรียบร้อยแล้ว");
      if (onSave) {
        console.log('savvvvvv3333')
        onSave();
      }
      loadMeetingInvitation();
    } catch (err: any) {
      console.error("Error saving meeting invitation:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลเชิญประชุมได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSendEmail = async () => {
    if (!meeting.id) return;

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      await sendMeetingInvitationEmail(meeting.id);
      showSuccess("สำเร็จ", "ส่งคำเชิญทางอีเมลเรียบร้อยแล้ว");
      loadMeetingInvitation();
    } catch (err: any) {
      console.error("Error sending invitation email:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถส่งคำเชิญทางอีเมลได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
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
        เชิญประชุม
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* ข้อมูลคณะ (Readonly) */}
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
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                {/* หัวข้อการประชุม */}
                <TextField
                  label="หัวข้อการประชุม"
                  value={meeting.meetingSubject || ""}
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  sx={{ mt: 2 }}
                  slotProps={{ input: { readOnly: true } }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* รูปแบบการประชุม */}
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
              รูปแบบการประชุม
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row={!isMobileDialog}
                value={formData.meetingFormat}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    meetingFormat: e.target.value as MeetingFormat,
                  }))
                }
              >
                <FormControlLabel
                  value="onsite"
                  control={<Radio />}
                  label="Onsite"
                />
                <FormControlLabel
                  value="online"
                  control={<Radio />}
                  label="Online"
                />
                <FormControlLabel
                  value="hybrid"
                  control={<Radio />}
                  label="Hybrid"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* สถานที่ประชุม และ ห้องที่ประชุม */}
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
              สถานที่ประชุม
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="สถานที่ประชุม"
                  value={formData.meetingLocation}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      meetingLocation: e.target.value,
                    }));
                    // Clear error when user types
                    if (errors.meetingLocation) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.meetingLocation;
                        return newErrors;
                      });
                    }
                  }}
                  fullWidth
                  size="small"
                  placeholder="กรอกสถานที่ประชุม"
                  error={!!errors.meetingLocation}
                  helperText={errors.meetingLocation}
                  required={
                    formData.meetingFormat === "onsite" ||
                    formData.meetingFormat === "hybrid"
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="ห้องที่ประชุม"
                  value={formData.meetingRoom}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      meetingRoom: e.target.value,
                    }));
                    // Clear error when user types
                    if (errors.meetingRoom) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.meetingRoom;
                        return newErrors;
                      });
                    }
                  }}
                  fullWidth
                  size="small"
                  placeholder="กรอกห้องที่ประชุม"
                  error={!!errors.meetingRoom}
                  helperText={errors.meetingRoom}
                  required={
                    formData.meetingFormat === "onsite" ||
                    formData.meetingFormat === "hybrid"
                  }
                />
              </Grid>
            </Grid>
          </Box>

          {/* Meeting ID และ Passcode */}
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
              Meeting ID, Passcode และ Link
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Meeting ID"
                  value={formData.meetingIdOnline}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      meetingIdOnline: e.target.value,
                    }));
                    // Clear error when user types
                    if (errors.meetingId) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.meetingId;
                        return newErrors;
                      });
                    }
                  }}
                  fullWidth
                  size="small"
                  placeholder="กรอก Meeting ID"
                  error={!!errors.meetingId}
                  helperText={errors.meetingId}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Passcode"
                  value={formData.passcode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      passcode: e.target.value,
                    }))
                  }
                  fullWidth
                  size="small"
                  placeholder="กรอก Passcode"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Link Meeting"
                  value={formData.meetingLink}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      meetingLink: e.target.value,
                    }));
                    // Clear error when user types
                    if (errors.meetingLink) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.meetingLink;
                        return newErrors;
                      });
                    }
                  }}
                  fullWidth
                  size="small"
                  placeholder="กรอก Link Meeting (เช่น MS Teams, Google Meet)"
                  helperText={
                    errors.meetingLink ||
                    "ตัวอย่าง: https://teams.microsoft.com/l/meetup-join/... หรือ https://meet.google.com/..."
                  }
                  error={!!errors.meetingLink}
                />
              </Grid>
            </Grid>
          </Box>

          {/* วาระการประชุม */}
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
              วาระการประชุม
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                flexDirection: isMobileDialog ? "column" : "row",
              }}
            >
              <TextField
                value={formData.agendaFileName || "ยังไม่ได้เลือกไฟล์"}
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{ flex: 1 }}
                error={!!errors.agendaFile}
                helperText={errors.agendaFile}
                required
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                sx={{ minWidth: "30%" }}
              >
                อัพโหลด
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload("agendaFile", e)}
                />
              </Button>
            </Box>
          </Box>

          {/* เอกสารประกอบการประชุม */}
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
              เอกสารประกอบการประชุม
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleSupportingDocumentsUpload}
                />
              </Button>
              {(formData.supportingDocumentNames?.length || 0) > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(formData.supportingDocumentNames || []).map(
                    (name, index) => (
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
                        <Description fontSize="small" color="action" />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeSupportingDocument(index)}
                          sx={{ color: "error.main" }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    )
                  )}
                </Box>
              )}
            </Box>
          </Box>

          {/* หนังสือเชิญประชุม */}
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
              หนังสือเชิญประชุม
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobileDialog ? "column" : "row",
                gap: 2,
                alignItems: isMobileDialog ? "stretch" : "center",
              }}
            >
              <TextField
                value={
                  formData.invitationLetterFileName || "ยังไม่ได้เลือกไฟล์"
                }
                fullWidth
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                sx={{ minWidth: "20%" }}
              >
                อัพโหลด
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload("invitationLetterFile", e)}
                />
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Description />}
                onClick={handleGenerateInvitationLetter}
                disabled={loading|| !isSaved|| participants.length === 0}
                sx={{ minWidth: 200 }}
              >
                สร้างหนังสือเชิญประชุม
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{ p: 2, gap: 1, flexDirection: isMobileDialog ? "column" : "row" }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            minWidth: 100,
            order: isMobileDialog ? 3 : 1,
          }}
        >
          ปิดหน้าต่าง
        </Button>
        <Button
          onClick={handleSendEmail}
          variant="contained"
          color={formData.emailSentStatus === "sent" ? "success" : "info"}
          startIcon={<Email />}
          disabled={loading || !isSaved || participants.length === 0}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            minWidth: 180,
            order: isMobileDialog ? 2 : 2,
          }}
          title={
            !isSaved || participants.length === 0
              ? "กรุณาบันทึกข้อมูลและเพิ่มรายชื่อผู้เข้าร่วมประชุมก่อนส่งอีเมล"
              : ""
          }
        >
          {formData.emailSentStatus === "sent"
            ? "ส่งคำเชิญทางอีเมลแล้ว/ส่งอีกครั้ง"
            : "ส่งคำเชิญทางอีเมล"}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          startIcon={<Save />}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            minWidth: 100,
            fontWeight: 600,
            order: isMobileDialog ? 1 : 3,
          }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
