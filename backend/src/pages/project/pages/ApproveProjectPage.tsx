import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
  Dialog,
  TextField,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import {
  CheckCircle,
  Cancel,
  RateReview,
  Search,
  CheckCircle as CheckCircleIcon,
  CalendarToday,
  Person,
  Business,
  Category,
  Folder,
} from "@mui/icons-material";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import { Project, ProjectSearchParams } from "@models/projects";

/** พารามิเตอร์ค้นหาโครงการ (รองรับช่วงวันที่ตามที่ API ใช้จริง) */
type ProjectListQuery = ProjectSearchParams & {
  startDate?: string;
  endDate?: string;
};
import {
  getProjects,
  updateProjectStage,
  upsertProjectLog,
} from "@services/projectService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { setGlobalLoading, fetchAppStageCode } from "@store/globalSlice";
import { RootState } from "@store/index";

dayjs.locale("th");

export default function ApproveProjectPage() {
  const dispatch = useAppDispatch();
  const roleId = useAppSelector((state) => state.auth.user?.role?.id);
  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  /** ยอดแยกตาม stage — ไม่ใช้จาก `projects` อย่างเดียว เพราะโหลดเฉพาะรายการรออนุมัติ */
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    disapproved: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const currentUser = useAppSelector((state: RootState) => state.auth.user);

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [actionType, setActionType] = useState<
    "approve" | "disapprove" | "review"
  >("approve");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (stageCodeList === null) {
      dispatch(fetchAppStageCode());
    }
    loadProjects();
  }, [dispatch, stageCodeList, roleId]);

  const buildListParams = (stageCode: string): ProjectListQuery => {
    const params: ProjectListQuery = {
      stageCode,
      page: 1,
      limit: 500,
    };
    if (startDate) {
      params.startDate = startDate.format("YYYY-MM-DD");
    }
    if (endDate) {
      params.endDate = endDate.format("YYYY-MM-DD");
    }
    return params;
  };

  const countFromResponse = (res: { data?: Project[]; total?: number }) =>
    typeof res.total === "number" ? res.total : res.data?.length ?? 0;

  const loadProjects = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);

      const pendingStage = roleId === 2 ? "00.20" : "00.60";
      /** ตรงกับ updateProjectStage หลังอนุมัติ: lv1 → 00.60, lv2 → 10.00 */
      const approvedStage = roleId === 2 ? "00.60" : "10.00";
      const rejectedStage = "00.98";

      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getProjects(buildListParams(pendingStage) as ProjectSearchParams),
        getProjects(buildListParams(approvedStage) as ProjectSearchParams),
        getProjects(buildListParams(rejectedStage) as ProjectSearchParams),
      ]);

      setProjects(pendingRes.data || []);
      setStats({
        pending: countFromResponse(pendingRes),
        approved: countFromResponse(approvedRes),
        disapproved: countFromResponse(rejectedRes),
      });
    } catch (err: any) {
      console.error("Error loading projects:", err);
      setError(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลโครงการได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadProjects();
  };

  const handleAction = (
    project: Project,
    type: "approve" | "disapprove" | "review"
  ) => {
    setSelectedProject(project);
    setActionType(type);
    setRemarks("");
    setActionDialogOpen(true);
  };


  const confirmAction = async () => {
    if (!selectedProject?.id) return;

    const actionText =
      actionType === "approve"
        ? "อนุมัติ"
        : actionType === "disapprove"
        ? "ไม่อนุมัติ"
        : "ทบทวน";

    const confirmResult = await showConfirm(
      `ยืนยันการ${actionText}`,
      `คุณต้องการ${actionText}โครงการ "${selectedProject.nameThai || selectedProject.name}" ใช่หรือไม่?`
    );

    if (!confirmResult.isConfirmed) return;


    try {
      dispatch(setGlobalLoading(true));

      if (actionType === "approve") {
        // เรียก API approve
        // บันทึก logs สำหรับ stage codes 48.60, 48.99, 50.00
        const approvalDate = dayjs().format("YYYY-MM-DD");

        const newStageCode =roleId === 2 ? "00.60":"10.00";
        const newStageUiMsg =
          stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
          "";


        const logsToCreate: Array<{
          stageCode: string;
          stageDescription: string;
          stageDate: string;
        }> = roleId === 2 ? [
          {
            stageCode: newStageCode,
            stageDescription:
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "",
            stageDate: approvalDate,
          },
        ]:[
          {
            stageCode: "00.99",
            stageDescription:
              stageCodeList?.find((stage) => stage.code === "00.99")?.name || "",
            stageDate: approvalDate,
          },
          {
            stageCode: newStageCode,
            stageDescription:
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "",
            stageDate: approvalDate,
          },
        ];


        await updateProjectStage({
          id: selectedProject.id,
          stageCode: newStageCode,
          stageUiMsg: newStageUiMsg,
          ...(roleId === 2 ? {
            approve_project_lv1_by: currentUser?.id || 0,
            approve_project_lv1_action: actionType,
            approve_project_lv1_remarks: remarks,
          } : {
            approve_project_lv2_by: currentUser?.id || 0,
            approve_project_lv2_action: actionType,
            approve_project_lv2_remarks: remarks,
          }),

        });

        // บันทึก logs
        for (const log of logsToCreate) {
          try {
            await upsertProjectLog(selectedProject.id, {
              projectId: selectedProject.id,
              stageCode: log.stageCode,
              stageDescription: log.stageDescription,
              stageDate: log.stageDate,
              stageStatus: "Finished",
              remarks: remarks || undefined,
            });
          } catch (err: any) {
            console.error(`Error creating log for stage ${log.stageCode}:`, err);
            // Continue with other logs even if one fails
          }
        }
      } else if (actionType === "disapprove") {
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการไม่อนุมัติ");
          return;
        }
        const approvalDate = dayjs().format("YYYY-MM-DD");
        const newStageCode =roleId === 2 ? "00.98":"00.98";
        const newStageUiMsg =
          stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
          "";
        const logsToCreate: Array<{
          stageCode: string;
          stageDescription: string;
          stageDate: string;
        }> = [
          {
            stageCode:newStageCode,
            stageDescription:
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "",
            stageDate: approvalDate,
          },
        ];


          stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
          "";

          await updateProjectStage({
            id: selectedProject.id,
            stageCode: newStageCode,
            stageUiMsg: newStageUiMsg,
            ...(roleId === 2 ? {
              approve_project_lv1_by: currentUser?.id || 0,
              approve_project_lv1_action: actionType,
              approve_project_lv1_remarks: remarks,
            } : {
              approve_project_lv2_by: currentUser?.id || 0,
              approve_project_lv2_action: actionType,
              approve_project_lv2_remarks: remarks,
            }),
  
          });

        // บันทึก logs
        for (const log of logsToCreate) {
          try {
            await upsertProjectLog(selectedProject.id, {
              projectId: selectedProject.id,
              stageCode: log.stageCode,
              stageDescription: log.stageDescription,
              stageDate: log.stageDate,
              stageStatus: "Finished",
              remarks: remarks || undefined,
            });
          } catch (err: any) {
            console.error(`Error creating log for stage ${log.stageCode}:`, err);
            // Continue with other logs even if one fails
          }
        }
      } else {
        // review
        if (!remarks.trim()) {
          showError("เกิดข้อผิดพลาด", "กรุณากรอกเหตุผลในการทบทวน");
          return;
        }
        const approvalDate = dayjs().format("YYYY-MM-DD");
        const newStageCode =roleId === 2 ? "00.98":"00.98";
        const newStageUiMsg =
          stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
          "";
        const logsToCreate: Array<{
          stageCode: string;
          stageDescription: string;
          stageDate: string;
        }> = [
          {
            stageCode: newStageCode,
            stageDescription:
              stageCodeList?.find((stage) => stage.code === newStageCode)?.name || "",
            stageDate: approvalDate,
          },
        ];


        await updateProjectStage({
          id: selectedProject.id,
          stageCode: newStageCode,
          stageUiMsg: newStageUiMsg,
          ...(roleId === 2 ? {
            approve_project_lv1_by: currentUser?.id || 0,
            approve_project_lv1_action: actionType,
            approve_project_lv1_remarks: remarks,
          } : {
            approve_project_lv2_by: currentUser?.id || 0,
            approve_project_lv2_action: actionType,
            approve_project_lv2_remarks: remarks,
          }),

        });

        // บันทึก logs
        for (const log of logsToCreate) {
          try {
            await upsertProjectLog(selectedProject.id, {
              projectId: selectedProject.id,
              stageCode: log.stageCode,
              stageDescription: log.stageDescription,
              stageDate: log.stageDate,
              stageStatus: "Finished",
              remarks: remarks || undefined,
            });
          } catch (err: any) {
            console.error(`Error creating log for stage ${log.stageCode}:`, err);
            // Continue with other logs even if one fails
          }
        }
      }

      showSuccess("สำเร็จ", `ได้${actionText}โครงการเรียบร้อยแล้ว`);
      setActionDialogOpen(false);
      setSelectedProject(null);
      setRemarks("");
      loadProjects();
    } catch (err: any) {
      console.error("Error processing action:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถดำเนินการได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };


  const getStatusChip = (stageCode?: string) => {
    const stage = stageCodeList?.find((s) => s.code === stageCode);
    return (
      <Chip
        label={stage?.name || stageCode || "ไม่ระบุ"}
        color="info"
        size="small"
        variant="outlined"
      />
    );
  };

  // รายการในตาราง = โหลดเฉพาะ pending แล้ว — กรองซ้ำเพื่อความชัดเจน
  const pendingStageFilter = roleId === 2 ? "00.20" : "00.60";
  const pendingProjects = projects.filter(
    (p) => p.stageCode === pendingStageFilter
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <CheckCircleIcon sx={{ fontSize: 32, color: "primary.main" }} />
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main" }}
          >
            รายการอนุมัติโครงการ
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mb: 3 }}>
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "primary.main",
                color: "white",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.pending}
              </Typography>
              <Typography variant="body1">รอการอนุมัติ</Typography>
            </Paper>
          </Box>
          {/* <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "success.main",
                color: "white",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.approved}
              </Typography>
              <Typography variant="body1">อนุมัติแล้ว</Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: "1 1 300px", minWidth: 0 }}>
            <Paper
              sx={{
                p: 3,
                textAlign: "center",
                bgcolor: "error.main",
                color: "white",
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {stats.disapproved}
              </Typography>
              <Typography variant="body1">ปฏิเสธแล้ว</Typography>
            </Paper>
          </Box> */}
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
            <Grid size={{ xs: 12, md: 4 }}>
              <DatePicker
                label="วันที่เริ่มต้น"
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
            <Grid size={{ xs: 12, md: 4 }}>
              <DatePicker
                label="วันที่สิ้นสุด"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="DD/MM/YYYY"
                slotProps={{
                  textField: {
                    size: "small",
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
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

        {/* Projects List */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {pendingProjects.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                ไม่มีรายการโครงการที่รออนุมัติ
              </Typography>
            </Paper>
          ) : (
            pendingProjects?.map((project) => {
              return (
                <Card
                  key={project.id}
                  sx={{
                    boxShadow: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Section 1: Project Details */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 1 }}
                          >
                            {project.nameThai || project.name}
                          </Typography>
                          {project.nameEnglish && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {project.nameEnglish}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{ display: "flex", gap: 1, alignItems: "center" }}
                        >
                          {getStatusChip(project.stageCode)}
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          {project.ownerName && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Person fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>ผู้ยื่นคำขอ:</strong> {project.ownerName}
                              </Typography>
                            </Box>
                          )}
                          {project.ownerGroupName && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <Business fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>กลุ่ม:</strong> {project.ownerGroupName}
                              </Typography>
                            </Box>
                          )}
                          {project.productGroupName && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Category fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>กลุ่มผลิตภัณฑ์:</strong>{" "}
                                {project.productGroupName}
                              </Typography>
                            </Box>
                          )}
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          {project.startYear && (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 1,
                              }}
                            >
                              <CalendarToday fontSize="small" color="action" />
                              <Typography variant="body2">
                                <strong>ปีที่เริ่ม:</strong> {project.startYear}
                              </Typography>
                            </Box>
                          )}
                          {project.productPolicyGroupNames &&
                            project.productPolicyGroupNames.length > 0 && (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 1,
                                }}
                              >
                                <Folder fontSize="small" color="action" />
                                <Typography variant="body2">
                                  <strong>กลุ่มผลิตภัณฑ์นโยบาย:</strong>{" "}
                                  {project.productPolicyGroupNames.join(", ")}
                                </Typography>
                              </Box>
                            )}
                          {project.createdAt && (
                            <Typography variant="body2">
                              <strong>วันที่สร้าง:</strong>{" "}
                              {dayjs(project.createdAt).format("DD/MM/YYYY HH:mm")}
                            </Typography>
                          )}
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Section 2: Approval Actions */}
                    <Box>
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleAction(project, "approve")}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleAction(project, "disapprove")}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          ไม่อนุมัติ
                        </Button>
                        {/* <Button
                          variant="contained"
                          color="warning"
                          startIcon={<RateReview />}
                          onClick={() => handleAction(project, "review")}
                          size="small"
                          sx={{ textTransform: "none" }}
                        >
                          ทบทวน
                        </Button> */}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })
          )}
        </Box>

        {/* Action Dialog */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => {
            setActionDialogOpen(false);
            setRemarks("");
          }}
          maxWidth="sm"
          fullWidth
        >
          <Box
            component="div"
            sx={{
              bgcolor:
                actionType === "approve"
                  ? "success.main"
                  : actionType === "disapprove"
                  ? "error.main"
                  : "warning.main",
              color: "white",
              p: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {actionType === "approve"
                ? "อนุมัติโครงการ"
                : actionType === "disapprove"
                ? "ไม่อนุมัติโครงการ"
                : "ทบทวนโครงการ"}
            </Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="body1" gutterBottom>
              โครงการ: <strong>{selectedProject?.nameThai || selectedProject?.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedProject?.startYear &&
                `ปีที่เริ่ม: ${selectedProject.startYear}`}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={
                actionType === "approve" ? "หมายเหตุ (ไม่บังคับ)" : "เหตุผล *"
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required={actionType !== "approve"}
              sx={{ mt: 2 }}
            />
          </Box>
          <Box
            sx={{ p: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
          >
            <Button
              onClick={() => {
                setActionDialogOpen(false);
                setRemarks("");
              }}
              sx={{ textTransform: "none" }}
            >
              ยกเลิก
            </Button>
            <Button
              variant="contained"
              color={
                actionType === "approve"
                  ? "success"
                  : actionType === "disapprove"
                  ? "error"
                  : "warning"
              }
              onClick={confirmAction}
              disabled={
                (actionType === "disapprove" || actionType === "review") &&
                !remarks.trim()
              }
              startIcon={
                actionType === "approve" ? (
                  <CheckCircle />
                ) : actionType === "disapprove" ? (
                  <Cancel />
                ) : (
                  <RateReview />
                )
              }
              sx={{ textTransform: "none" }}
            >
              {actionType === "approve"
                ? "อนุมัติ"
                : actionType === "disapprove"
                ? "ไม่อนุมัติ"
                : "ทบทวน"}
            </Button>
          </Box>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
}
