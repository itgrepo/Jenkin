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
  Grid,
  Chip,
  Link,
  Paper,
} from "@mui/material";
import { Close, Event, Description } from "@mui/icons-material";
import { MeetingWithRegistration, MeetingInvitation } from "@models/meeting";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import { showError } from "@components/Swal";
import {
  getMeetingDetailsForAttendee,
  getMeetingInvitation,
} from "@services/meetingService";
import dayjs from "dayjs";
import MeetingRegistrationDialog from "./MeetingRegistrationDialog";
import { getMinioFullUrl } from "@utils/index";

interface MeetingDetailsAttendeeDialogProps {
  open: boolean;
  meeting: MeetingWithRegistration;
  onClose: () => void;
  onRegister?: () => void;
}

export default function MeetingDetailsAttendeeDialog({
  open,
  meeting: initialMeeting,
  onClose,
  onRegister,
}: MeetingDetailsAttendeeDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [meeting, setMeeting] = useState<MeetingWithRegistration>(initialMeeting);
  const [invitation, setInvitation] = useState<MeetingInvitation | null>(null);
  const [registrationDialogOpen, setRegistrationDialogOpen] = useState(false);

  useEffect(() => {
    if (open && initialMeeting.id) {
      loadMeetingDetails();
    }
  }, [open, initialMeeting.id]);

  const loadMeetingDetails = async () => {
    if (!initialMeeting.id) return;
    try {
      dispatch(setGlobalLoading(true));

      const [detailsRes, invitationRes] = await Promise.all([
        getMeetingDetailsForAttendee(initialMeeting.id).catch(() => null),
        getMeetingInvitation(initialMeeting.id).catch(() => null),
      ]);

      if (detailsRes) {
        setMeeting(detailsRes);
      }

      if (invitationRes) {
        setInvitation(invitationRes);
      }
    } catch (err: any) {
      console.error("Error loading meeting details:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลการประชุมได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleRegister = () => {
    setRegistrationDialogOpen(true);
  };

  const handleRegistrationSuccess = () => {
    setRegistrationDialogOpen(false);
    loadMeetingDetails();
    if (onRegister) {
      onRegister();
    }
  };

  const getMeetingFormatLabel = (format?: string) => {
    switch (format) {
      case "onsite":
        return "Onsite";
      case "online":
        return "Online";
      case "hybrid":
        return "Hybrid";
      default:
        return "-";
    }
  };

  const getStatusChip = (status?: "registered" | "not_registered") => {
    if (status === "registered") {
      return <Chip label="ลงทะเบียน" color="success" size="small" />;
    }
    return <Chip label="ยังไม่ลงทะเบียน" color="default" size="small" />;
  };

  return (
    <>
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
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            รายละเอียดการประชุม (ผู้เข้าร่วมประชุม)
          </Typography>
          <IconButton
            onClick={onClose}
            sx={{ color: "white" }}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3,mt:2 }}>
          {/* Section 1: General Meeting Information */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}
            >
              ข้อมูลการประชุมทั่วไป
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>คณะที่:</strong> {meeting.subCommitteeOf ? `${meeting.subCommitteeOf} - ` : ""} {meeting.committeeNumber}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>ชื่อคณะ:</strong> {meeting.committeeName}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>ครั้งที่ประชุม:</strong> {meeting.instanceNumber}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>หัวข้อการประชุม:</strong> {meeting.meetingSubject}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>วันที่เริ่มประชุม:</strong>{" "}
                  {dayjs(meeting.startDate).format("DD/MM/YYYY")}
                </Typography>
                {meeting.startTime && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>เวลาเริ่ม:</strong> {meeting.startTime}
                  </Typography>
                )}
                {meeting.endTime && (
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>เวลาสิ้นสุด:</strong> {meeting.endTime}
                  </Typography>
                )}
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant={meeting.registrationStatus === "registered" ? "outlined" : "contained"}
                color="primary"
                onClick={handleRegister}
                disabled={meeting.registrationStatus === "registered"}
                startIcon={<Event />}
              >
                {meeting.registrationStatus === "registered" ? "ลงทะเบียนแล้ว" : "ลงทะเบียน"}
              </Button>
              {getStatusChip(meeting.registrationStatus)}
            </Box>
          </Paper>

          {/* Section 2: Meeting Location Information */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}
            >
              ข้อมูลสถานที่การประชุม
            </Typography>
            {invitation && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>ประเภทการประชุม:</strong>{" "}
                  {getMeetingFormatLabel(invitation.meetingFormat)}
                </Typography>
                {(invitation.meetingFormat === "onsite" ||
                  invitation.meetingFormat === "hybrid") && (
                  <>
                    {invitation.meetingLocation && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>สถานที่:</strong> {invitation.meetingLocation}
                      </Typography>
                    )}
                    {invitation.meetingRoom && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>ห้องที่ประชุม:</strong> {invitation.meetingRoom}
                      </Typography>
                    )}
                  </>
                )}
                {(invitation.meetingFormat === "online" ||
                  invitation.meetingFormat === "hybrid") && (
                  <>
                    {invitation.meetingIdOnline && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Meeting ID:</strong> {invitation.meetingIdOnline}
                      </Typography>
                    )}
                    {invitation.passcode && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Passcode:</strong> {invitation.passcode}
                      </Typography>
                    )}
                    {invitation.meetingLink && (
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Link Meeting:</strong>{" "}
                        <Link
                          href={invitation.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {invitation.meetingLink}
                        </Link>
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
            {!invitation && (
              <Typography variant="body2" color="text.secondary">
                ยังไม่มีข้อมูลสถานที่การประชุม
              </Typography>
            )}
          </Paper>

          {/* Section 3: Supporting Documents */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}
            >
              ข้อมูลเอกสารประกอบการประชุม
            </Typography>
            {invitation && (
              <Box>
                {invitation.agendaFilePath && (
                  <Box sx={{ mb: 1 }}>
                    <Link
                      href={getMinioFullUrl(invitation.agendaFilePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Description fontSize="small" />
                      <Typography variant="body2">
                        {invitation.agendaFileName || "วาระการประชุม"}
                      </Typography>
                    </Link>
                  </Box>
                )}
                {invitation.supportingDocumentPaths &&
                  invitation.supportingDocumentPaths.length > 0 && (
                    <Box>
                      {invitation.supportingDocumentPaths.map((path, index) => (
                        <Box key={index} sx={{ mb: 1 }}>
                          <Link
                            href={getMinioFullUrl(path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: "flex", alignItems: "center", gap: 1 }}
                          >
                            <Description fontSize="small" />
                            <Typography variant="body2">
                              {invitation.supportingDocumentNames?.[index] ||
                                `เอกสารประกอบ ${index + 1}`}
                            </Typography>
                          </Link>
                        </Box>
                      ))}
                    </Box>
                  )}
                {invitation.invitationLetterFilePath && (
                  <Box sx={{ mb: 1 }}>
                    <Link
                      href={getMinioFullUrl(invitation.invitationLetterFilePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Description fontSize="small" />
                      <Typography variant="body2">
                        {invitation.invitationLetterFileName || "หนังสือเชิญประชุม"}
                      </Typography>
                    </Link>
                  </Box>
                )}
                {!invitation.agendaFilePath &&
                  (!invitation.supportingDocumentPaths ||
                    invitation.supportingDocumentPaths.length === 0) &&
                  !invitation.invitationLetterFilePath && (
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีเอกสารประกอบการประชุม
                    </Typography>
                  )}
              </Box>
            )}
            {!invitation && (
              <Typography variant="body2" color="text.secondary">
                ยังไม่มีเอกสารประกอบการประชุม
              </Typography>
            )}
          </Paper>

          {/* Section 4: Attendee Information */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, color: "primary.main" }}
            >
              ข้อมูลผู้เข้าร่วมประชุม
            </Typography>
            <Typography variant="body2">
              <strong>จำนวนรวมผู้ที่ลงทะเบียนแล้ว:</strong>{" "}
              {meeting.registeredCount || 0}/{meeting.totalMeetingAttendees || 0} คน
            </Typography>
          </Paper>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      {/* Registration Dialog */}
      {meeting.id && (
        <MeetingRegistrationDialog
          open={registrationDialogOpen}
          meetingId={meeting.id}
          onClose={() => setRegistrationDialogOpen(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </>
  );
}

