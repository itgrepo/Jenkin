import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Paper,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import {  getProjectLogs } from "@services/projectService";
import { showError} from "@components/Swal";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { ProjectLog } from "@models/projects";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode } from "@store/globalSlice";

dayjs.extend(buddhistEra);
dayjs.locale("th");

interface ProjectLogsDialogProps {
  open: boolean;
  onClose: () => void;
  projectId?: number;
  projectName?: string;
}


// Format date to Thai Buddhist calendar
const formatThaiDate = (dateString?: string) => {
  if (!dateString) return "-";
  const date = dayjs(dateString);
  // Format: D MMM YYYY (Thai Buddhist calendar)
  const thaiMonths = [
    "ม.ค.",
    "ก.พ.",
    "มี.ค.",
    "เม.ย.",
    "พ.ค.",
    "มิ.ย.",
    "ก.ค.",
    "ส.ค.",
    "ก.ย.",
    "ต.ค.",
    "พ.ย.",
    "ธ.ค.",
  ];
  const day = date.date();
  const month = thaiMonths[date.month()];
  const year = date.year() + 543; // Convert to Buddhist era
  return `${day} ${month} ${year}`;
};

const ProjectLogsDialog: React.FC<ProjectLogsDialogProps> = ({
  open,
  onClose,
  projectId,
  projectName = "",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [projectLogs, setProjectLogs] = useState<ProjectLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearchText, setLogSearchText] = useState(projectName);

  const {stageCodeList} = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }
  }, [stageCodeList]);

  useEffect(() => {
    if (open && projectId) {
      loadProjectLogs(projectId);
      setLogSearchText(projectName);
    } else {
      setProjectLogs([]);
      setLogSearchText("");
    }
  }, [open, projectId, projectName]);

  const loadProjectLogs = async (id: number) => {
    try {
      setLogsLoading(true);
      const logs = await getProjectLogs(id);
      // Sort logs by stageCode
      // const sortedLogs = [...logs].sort((a, b) => {
      //   const aCode = parseFloat(a.stageCode || "0");
      //   const bCode = parseFloat(b.stageCode || "0");
      //   return aCode - bCode;
      // });
      setProjectLogs(logs);
    } catch (err: any) {
      //console.error("Error loading project logs:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูล Log ได้"
      );
    } finally {
      setLogsLoading(false);
    }
  };

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
            minHeight: isMobile ? "100vh" : "auto",
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
          Project Logs
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
        {/* Search Field */}
        <Box
          sx={{
            my: 3,
            display: "flex",
            alignItems: "center",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Typography component="div" sx={{ fontWeight: 700, minWidth: "10%" }}>
           ชื่อร่างมาตรฐาน
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={logSearchText}
            onChange={(e) => setLogSearchText(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
              },
            }}
            slotProps={{
              input: { readOnly: true },
            }}
          />
        </Box>

        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 700, my: 2 }}
        >
          การดำเนินการ
        </Typography>
        {/* Logs Table */}
        <TableContainer
          component={Paper}
          elevation={1}
          sx={{
            maxHeight: isMobile ? "60vh" : "500px",
            "&::-webkit-scrollbar": {
              width: "10px",
              height: "10px",
            },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "10px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#",
              borderRadius: "10px",
              "&:hover": {
                background: "#555",
              },
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    bgcolor: "grey.900",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    minWidth: 100,
                  }}
                  align="center"
                >
                  Stages Number
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "grey.900",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    minWidth: 250,
                  }}
                >
                  Stages Description
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "grey.900",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    minWidth: 150,
                  }}
                  align="center"
                >
                  Stages Date
                </TableCell>
                <TableCell
                  sx={{
                    bgcolor: "grey.900",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    minWidth: 120,
                  }}
                  align="center"
                >
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : projectLogs?.length > 0 ? (
                projectLogs?.map((log, index) => (
                  <TableRow
                    key={log.id || index}
                    hover
                    sx={{
                      "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    }}
                  >
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {log.stageCode}
                    </TableCell>
                    <TableCell>
                    {stageCodeList?.find((stage) => stage.code === log.stageCode)?.name}
                    </TableCell>
                    <TableCell align="center">
                      {formatThaiDate(log.stageDate)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={log.stageStatus || "Working"}
                        size="small"
                        color={
                          log.stageStatus === "Finished"
                            ? "success"
                            : log.stageStatus === "Working"
                            ? "warning"
                            : "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      ไม่พบข้อมูล Log
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3, bgcolor: "grey.50" }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectLogsDialog;
