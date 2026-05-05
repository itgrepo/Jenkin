import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  useMediaQuery,
  useTheme,
  Grid,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import { Search, Visibility, Info } from "@mui/icons-material";
import { MeetingWithRegistration, MeetingSearchParams } from "@models/meeting";
import { getUpcomingInvitedMeetings } from "@services/meetingService";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import MeetingDetailsAttendeeDialog from "../components/MeetingDetailsAttendeeDialog";

dayjs.locale("th");

export default function MeetingNotReachedDatePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [searchText, setSearchText] = useState("");
  const [meetings, setMeetings] = useState<MeetingWithRegistration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] =
    useState<MeetingWithRegistration | null>(null);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);
      const params: MeetingSearchParams = {};
      if (startDate) {
        params.startDate = startDate.format("YYYY-MM-DD");
      }
      if (searchText.trim()) {
        params.search = searchText.trim();
      }

      const res = await getUpcomingInvitedMeetings(params);
      // Filter meetings that haven't reached the meeting date yet
      const today = dayjs().startOf("day");
      const filteredMeetings = (res.data || []).filter((meeting) => {
        const meetingDate = dayjs(meeting.startDate).startOf("day");
        return meetingDate.isAfter(today) || meetingDate.isSame(today);
      });
      setMeetings(filteredMeetings);
    } catch (err: any) {
      console.error("Error loading meetings:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลการประชุมได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadMeetings();
  };

  const handleViewDetails = (meeting: MeetingWithRegistration) => {
    setSelectedMeeting(meeting);
    setDetailsDialogOpen(true);
  };

  const getStatusChip = (status?: "registered" | "not_registered") => {
    if (status === "registered") {
      return <Chip label="ลงทะเบียน" color="success" size="small" />;
    }
    return <Chip label="ยังไม่ลงทะเบียน" color="default" size="small" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Info sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            รายการประชุมที่ยังไม่ถึงวันที่ประชุม
          </Typography>
        </Box>

        {/* Filter Section */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
          }}
        >
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                วันที่เริ่มประชุม
              </Typography>
              <DatePicker
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                ค้นหา
              </Typography>
              <TextField
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="ค้นหาจาก คณะที่, ชื่อคณะ, หรือครั้งที่"
                size="small"
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
                fullWidth
                sx={{ height: "40px" }}
              >
                ค้นหา
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Meetings Table */}
        <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            borderRadius: 2,
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: isMobile ? "70vh" : "75vh",
            "&::-webkit-scrollbar": {
              width: "10px",
              height: "10px",
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
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "primary.main" }}>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                  align="center"
                >
                  คณะที่
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                >
                  ชื่อคณะ
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                  align="center"
                >
                  ครั้งที่
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                  align="center"
                >
                  วันที่เริ่มประชุม
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                  align="center"
                >
                  สถานะ
                </TableCell>
                <TableCell
                  sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                  align="center"
                >
                  การทำงาน
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meetings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      ไม่พบข้อมูลการประชุม
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                meetings.map((meeting) => (
                  <TableRow key={meeting.id} hover>
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {meeting.committeeNumber}
                      {meeting?.subCommitteeOf
                        ? ` - ${meeting.subCommitteeOf} `
                        : ""}
                    </TableCell>
                    <TableCell>{meeting.committeeName}</TableCell>
                    <TableCell align="center">
                      {meeting.instanceNumber}
                    </TableCell>
                    <TableCell align="center">
                      {dayjs(meeting.startDate).format("DD/MM/YYYY")}
                    </TableCell>
                    <TableCell align="center">
                      {getStatusChip(meeting.registrationStatus)}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="รายละเอียด">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(meeting)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Meeting Details Dialog */}
        {selectedMeeting && (
          <MeetingDetailsAttendeeDialog
            open={detailsDialogOpen}
            meeting={selectedMeeting}
            onClose={() => {
              setDetailsDialogOpen(false);
              setSelectedMeeting(null);
            }}
            onRegister={() => {
              loadMeetings();
            }}
          />
        )}
      </Container>
    </LocalizationProvider>
  );
}
