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
  Alert,
  Grid,
} from "@mui/material";
import {
  Search,
  Info,
  Reply,
} from "@mui/icons-material";
import dayjs from "dayjs";
import "dayjs/locale/th";
import {
  BallotRequest,
  BallotDisplayStatus,
} from "@models/ballot";
import {
  getAvailableBallotRequests,
} from "@services/ballotService";
import { useAppDispatch } from "@hooks/useRedux";
import { setGlobalLoading } from "@store/globalSlice";
import BallotResponseDialog from "../components/BallotResponseDialog";

dayjs.locale("th");

// Calculate display status based on dates and approval status
const calculateDisplayStatus = (
  request: BallotRequest
): BallotDisplayStatus => {
  // ถ้ายังไม่อนุมัติจาก director → ไม่แสดง
  if (request.status !== "director_approved" && request.status !== "closed") {
    return "pending_open";
  }

  // ถ้าปิดแล้ว
  if (request.status === "closed") {
    return "closed";
  }

  const now = dayjs();
  const startDate = dayjs(request.startDate);
  const endDate = dayjs(request.endDate);

  // ยังไม่ถึงวันเริ่ม → รอเปิด
  if (now.isBefore(startDate)) {
    return "pending_open";
  }

  // อยู่ระหว่างวันที่เริ่ม-สิ้นสุด → เปิด
  if (
    (now.isAfter(startDate) && now.isBefore(endDate)) ||
    now.isSame(startDate) ||
    now.isSame(endDate)
  ) {
    return "open";
  }

  // เลยวันที่สิ้นสุดแล้ว → รอปิด
  if (now.isAfter(endDate)) {
    return "pending_close";
  }

  return "pending_open";
};

export default function BallotListPage() {
  const dispatch = useAppDispatch();

  const [searchText, setSearchText] = useState("");
  const [requests, setRequests] = useState<BallotRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BallotRequest | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);

      const params: any = {
        search: searchText.trim() || undefined,
      };

      const res = await getAvailableBallotRequests(params);
      
      // Filter เฉพาะสถานะ "เปิด" (open) เท่านั้น
      const filteredRequests = (res.data || []).filter((request) => {
        const displayStatus = calculateDisplayStatus(request);
        return displayStatus === "open";
      });

      setRequests(filteredRequests);
    } catch (err: any) {
      console.error("Error loading requests:", err);
      setError(
        err?.response?.data?.message ||
          "ไม่สามารถโหลดข้อมูลการเวียนขอข้อคิดเห็นได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadRequests();
  };

  const handleReply = (request: BallotRequest) => {
    setSelectedRequest(request);
    setResponseDialogOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Info sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          แสดงรายการเวียนขอข้อคิดเห็น
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
          <Grid size={{ xs: 12, md: 10 }}>
            <TextField
              fullWidth
              size="small"
              label="ชื่อข้อคิดเห็น"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              placeholder="ค้นหาชื่อข้อคิดเห็น"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              fullWidth
              sx={{ height: "40px", textTransform: "none" }}
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

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                ลำดับที่
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                ชื่อข้อคิดเห็น
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                วันที่เริ่ม
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                วันที่สิ้นสุด
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, textAlign: "center" }}
              >
                การทำงาน
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูล
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request, index) => (
                <TableRow key={request.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{request.name}</TableCell>
                  <TableCell>
                    {dayjs(request.startDate).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell>
                    {dayjs(request.endDate).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={<Reply />}
                      onClick={() => handleReply(request)}
                      sx={{ textTransform: "none" }}
                    >
                      ตอบ
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Response Dialog */}
      {selectedRequest && responseDialogOpen&&(
        <BallotResponseDialog
          open={responseDialogOpen}
          onClose={() => {
            setResponseDialogOpen(false);
            setSelectedRequest(null);
          }}
          onSave={() => {
            loadRequests();
          }}
          request={selectedRequest}
        />
      )}
    </Container>
  );
}

