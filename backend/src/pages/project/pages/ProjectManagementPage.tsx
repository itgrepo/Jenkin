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
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
  Chip,
  Autocomplete,
  Grid,
  IconButton,
} from "@mui/material";

import { Edit, Search, Description, Visibility } from "@mui/icons-material";
import { getProjects, upsertProject } from "@services/projectService";
import { showError, showSuccess } from "@components/Swal";
import { Project } from "@models/projects";
import ProjectDialog from "../components/ProjectDialog";
import ProjectLogsDialog from "../components/ProjectLogsDialog";
import GMMOSummaryDialog from "../components/GMMOSummaryDialog";
import SaveDraftDialog from "../components/SaveDraftDialog";
import DraftCirculationSummaryDialog from "../components/DraftCirculationSummaryDialog";
import SubCommitteeSummaryDialog from "../components/SubCommitteeSummaryDialog";
import IssueTISNumberDialog from "../components/IssueTISNumberDialog";
import SaveInitialDraftDialog from "../components/SaveInitialDraftDialog";
import SaveFinalDraftDialog from "../components/SaveFinalDraftDialog";
import SaveStandardAnnouncementDialog from "../components/SaveStandardAnnouncementDialog";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { renderStatusChip } from "./ProjectDraftPage";


// Interface for action buttons
interface ActionButton {
  label: string;
  color: "success" | "info" | "warning" | "error" | "primary" | "secondary";
  onClick: () => void;
}

export default function ProjectManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );

  // Log Dialog states
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [selectedProjectForLog, setSelectedProjectForLog] =
    useState<Project | null>(null);

  // GMMO Summary Dialog states
  const [gmmoDialogOpen, setGmmoDialogOpen] = useState(false);
  const [selectedProjectForGMMO, setSelectedProjectForGMMO] =
    useState<Project | null>(null);

  // Save Draft Dialog states
  const [saveDraftDialogOpen, setSaveDraftDialogOpen] = useState(false);
  const [selectedProjectForSaveDraft, setSelectedProjectForSaveDraft] =
    useState<Project | null>(null);

  // Draft Circulation Summary Dialog states
  const [draftCirculationDialogOpen, setDraftCirculationDialogOpen] =
    useState(false);
  const [selectedProjectForDraftCirculation, setSelectedProjectForDraftCirculation] =
    useState<Project | null>(null);
  const [draftCirculationType, setDraftCirculationType] = useState<string>("25");

  // Sub-Committee Summary Dialog states
  const [subCommitteeDialogOpen, setSubCommitteeDialogOpen] = useState(false);
  const [selectedProjectForSubCommittee, setSelectedProjectForSubCommittee] =
    useState<Project | null>(null);
  const [subCommitteeType, setSubCommitteeType] = useState<string>("30");

  // Issue TIS Number Dialog states
  const [issueTISDialogOpen, setIssueTISDialogOpen] = useState(false);
  const [selectedProjectForIssueTIS, setSelectedProjectForIssueTIS] =
    useState<Project | null>(null);

  // Save Initial Draft Dialog states
  const [saveInitialDraftDialogOpen, setSaveInitialDraftDialogOpen] = useState(false);
  const [selectedProjectForSaveInitialDraft, setSelectedProjectForSaveInitialDraft] =
    useState<Project | null>(null);

  // Save Final Draft Dialog states
  const [saveFinalDraftDialogOpen, setSaveFinalDraftDialogOpen] = useState(false);
  const [selectedProjectForSaveFinalDraft, setSelectedProjectForSaveFinalDraft] =
    useState<Project | null>(null);

  // Save Standard Announcement Dialog states
  const [saveStandardAnnouncementDialogOpen, setSaveStandardAnnouncementDialogOpen] = useState(false);
  const [selectedProjectForSaveStandardAnnouncement, setSelectedProjectForSaveStandardAnnouncement] =
    useState<Project | null>(null);
  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }
  }, [dispatch, stageCodeList]);


  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProject(null);
  };

  const handleSave = async (item: Partial<Project>) => {
    try {
      const isEdit = !!item.id;
    dispatch(setGlobalLoading(true));

      await upsertProject(item);
      showSuccess(
        isEdit ? "อัปเดตสำเร็จ" : "บันทึกสำเร็จ",
        isEdit
          ? "อัปเดตข้อมูลโครงการเรียบร้อยแล้ว"
          : "บันทึกข้อมูลโครงการเรียบร้อยแล้ว"
      );

      // Reload projects list
      await loadProjects();

      // Close dialog
      handleDialogClose();
    } catch (err: any) {
      console.error("Error saving project:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกโครงการได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  // ฟังก์ชันสำหรับแสดงปุ่มการทำงานตามสถานะ
  const getActionButtons = (project: Project): ActionButton | undefined => {
    const stageCode = project.stageCode || "";
    const stagePrefix = stageCode.split(".")[0];
    //const stagePrefix=stageCode;
    // ตรวจสอบสถานะและแสดงปุ่มตามที่กำหนด
    let buttons: ActionButton = {
      label: "",
      color: "info",
      onClick: () => { },
    };

    // ปุ่มอื่นๆ - ขึ้นอยู่กับสถานะ
    if (stagePrefix === "10") {
      buttons = {
        label: "กมอ. สรุปผล",
        color: "info",
        onClick: () => handleGMMOSummary(project),
      };
    } else if (stagePrefix === "20") {
      buttons = {
        label: "บันทึกเตรียมร่าง",
        color: "info",
        onClick: () => handleSaveDraft(project),
      };
    } else if (stagePrefix === "25") {
      buttons = {
        label: "สรุปการเวียนร่าง(เตรียมร่าง)",
        color: "info",
        onClick: () => handleDraftCirculationSummary(project, "25"),
      };
    } else if (stagePrefix === "30") {
      buttons = {
        label: "สรุปผลอนุ กว.",
        color: "info",
        onClick: () => handleSubCommitteeSummary(project, "30"),
      };
    } else if (stagePrefix === "35") {
      buttons = {
        label: "สรุปการเวียนร่าง(อนุ กว.)",
        color: "info",
        onClick: () => handleDraftCirculationSummary(project, "35"),
      };
    } else if (stagePrefix === "40") {
      buttons = {
        label: "สรุปผล กว.",
        color: "info",
        onClick: () => handleSubCommitteeSummary(project, "40"),
      };
    } else if (stagePrefix === "45") {
      buttons = {
        label: "สรุปการเวียนร่าง(กว.)",
        color: "info",
        onClick: () => handleDraftCirculationSummary(project, "45"),
      };
    } else if (stagePrefix === "47") {
      buttons = {
        label: "ออกเลข มอก.",
        color: "info",
        onClick: () => handleIssueTISNumber(project),
      };
    } else if (stagePrefix === "48") {
      buttons = {
        label: "บันทึกร่างขั้นต้น",
        color: "info",
        onClick: () => handleSaveInitialDraft(project),
      };
    } else if (stagePrefix === "50") {
      buttons = {
        label: "บันทึกร่างขั้นสุดท้าย",
        color: "info",
        onClick: () => handleSaveFinalDraft(project),
      };
    } else if (stagePrefix === "60") {
      buttons = {
        label: "บันทึกประกาศมาตรฐาน",
        color: "info",
        onClick: () => handleSaveStandardAnnouncement(project),
      };
    }

    return buttons;
  };

  // Handler functions (placeholder - จะต้องสร้างหน้าต่างๆ เหล่านี้ภายหลัง)
  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleGMMOSummary = (project: Project) => {
    setSelectedProjectForGMMO(project);
    setGmmoDialogOpen(true);
  };

  const handleGMMODialogClose = () => {
    setGmmoDialogOpen(false);
    setSelectedProjectForGMMO(null);
  };

  const handleGMMOSuccess = () => {
    loadProjects();
  };

  const handleSaveDraft = (project: Project) => {
    setSelectedProjectForSaveDraft(project);
    setSaveDraftDialogOpen(true);
  };

  const handleSaveDraftDialogClose = () => {
    setSaveDraftDialogOpen(false);
    setSelectedProjectForSaveDraft(null);
  };

  const handleSaveDraftSuccess = () => {
    loadProjects();
  };

  const handleDraftCirculationSummary = (project: Project, type: string) => {
    setSelectedProjectForDraftCirculation(project);
    setDraftCirculationType(type);
    setDraftCirculationDialogOpen(true);
  };

  const handleDraftCirculationDialogClose = () => {
    setDraftCirculationDialogOpen(false);
    setSelectedProjectForDraftCirculation(null);
    setDraftCirculationType("25");
  };

  const handleDraftCirculationSuccess = () => {
    loadProjects();
  };

  const handleSubCommitteeSummary = (project: Project, type: string) => {
    setSelectedProjectForSubCommittee(project);
    setSubCommitteeType(type);
    setSubCommitteeDialogOpen(true);
  };

  const handleSubCommitteeDialogClose = () => {
    setSubCommitteeDialogOpen(false);
    setSelectedProjectForSubCommittee(null);
  };

  const handleSubCommitteeSuccess = () => {
    loadProjects();
  };


  const handleIssueTISNumber = (project: Project) => {
    setSelectedProjectForIssueTIS(project);
    setIssueTISDialogOpen(true);
  };

  const handleIssueTISDialogClose = () => {
    setIssueTISDialogOpen(false);
    setSelectedProjectForIssueTIS(null);
  };

  const handleIssueTISSuccess = () => {
    loadProjects();
  };

  const handleSaveInitialDraft = (project: Project) => {
    setSelectedProjectForSaveInitialDraft(project);
    setSaveInitialDraftDialogOpen(true);
  };

  const handleSaveInitialDraftDialogClose = () => {
    setSaveInitialDraftDialogOpen(false);
    setSelectedProjectForSaveInitialDraft(null);
  };

  const handleSaveInitialDraftSuccess = () => {
    loadProjects();
  };

  const handleSaveFinalDraft = (project: Project) => {
    setSelectedProjectForSaveFinalDraft(project);
    setSaveFinalDraftDialogOpen(true);
  };

  const handleSaveFinalDraftDialogClose = () => {
    setSaveFinalDraftDialogOpen(false);
    setSelectedProjectForSaveFinalDraft(null);
  };

  const handleSaveFinalDraftSuccess = () => {
    loadProjects();
  };

  const handleSaveStandardAnnouncement = (project: Project) => {
    setSelectedProjectForSaveStandardAnnouncement(project);
    setSaveStandardAnnouncementDialogOpen(true);
  };

  const handleSaveStandardAnnouncementDialogClose = () => {
    setSaveStandardAnnouncementDialogOpen(false);
    setSelectedProjectForSaveStandardAnnouncement(null);
  };

  const handleSaveStandardAnnouncementSuccess = () => {
    loadProjects();
  };

  const handleViewLog = (project: Project) => {
    if (!project.id) {
      showError("เกิดข้อผิดพลาด", "ไม่พบ ID ของโครงการ");
      return;
    }

    setSelectedProjectForLog(project);
    setLogDialogOpen(true);
  };

  const handleLogDialogClose = () => {
    setLogDialogOpen(false);
    setSelectedProjectForLog(null);
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const loadProjects = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);
      const params: any = {
        search: searchText.trim() || undefined,
      };

      // ถ้าเลือกสถานะ ให้กรองตาม stageCode
      if (selectedStatus) {
        // กรอง projects ที่ stageCode ขึ้นต้นด้วย selectedStatus
        const res = await getProjects(params);

        const filteredProjects = (res.data || []).filter((project) => {
          const stageCode = project.stageCode || "";
          return stageCode.startsWith(selectedStatus + ".");
        });
        setProjects(filteredProjects);
      } else {
        const res = await getProjects(params);

        const resSend = (res.data || []).filter((project) => { return project.stageCode !== "00.00" })
        setProjects(resSend || []);
      }
    } catch (err: any) {
      console.error("Error loading projects:", err);
      setError(err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลโครงการได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSearch = () => {
    loadProjects();
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  // นับจำนวนโครงการตามสถานะ
  //   const statusCounts = useMemo(() => {
  //     const counts: Record<string, number> = {};
  //     projects.forEach((project) => {
  //       const stageCode = project.stageCode || "";
  //       const stagePrefix = stageCode.split(".")[0];
  //       if (stagePrefix) {
  //         counts[stagePrefix] = (counts[stagePrefix] || 0) + 1;
  //       }
  //     });
  //     return counts;
  //   }, [projects]);



  // Render enforcement status
  const renderEnforcementStatus = (project: Project) => {
    const status = project.enforcementStatusName || project.enforcementStatus;
    if (!status) return "-";

    let color:
      | "default"
      | "primary"
      | "secondary"
      | "error"
      | "info"
      | "success"
      | "warning" = "default";
    if (status === "บังคับ" || status === "enforced") color = "error";
    else if (status === "ทั่วไป" || status === "general") color = "info";
    else if (status === "วางแผนบังคับ" || status === "planned_enforcement")
      color = "warning";

    return <Chip label={status} size="small" color={color} />;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Description sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          จัดการโครงการ
        </Typography>
      </Box>

      {/* Search and Filter Section */}
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
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              สถานะ
            </Typography>
            <Autocomplete
              options={(stageCodeList?.filter((s) => !s.code?.includes(".")) || [])}
              getOptionLabel={(option) => {
                return `${option.name} [${option.code}]`;
              }}
              value={
                selectedStatus
                  ? stageCodeList?.find((s) => s.code === selectedStatus) || null
                  : null
              }
              onChange={(_, newValue) => {
                handleStatusChange(newValue?.code || "");
              }}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="เลือกสถานะ"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                      "&:hover": {
                        "& > fieldset": {
                          borderColor: "primary.main",
                        },
                      },
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              ชื่อโครงการ
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาชื่อโครงการ"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                  "&:hover": {
                    "& > fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                height: "40px",
                "&:hover": {
                  boxShadow: 4,
                },
              }}
            >
              ค้นหา
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Projects Table */}
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
                width={80}
              >
                ลำดับที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อร่างมาตรฐาน
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={150}
              >
                สถานะเกี่ยวกับการบังคับ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={180}
              >
                กลุ่มผลิตภัณฑ์นโยบาย
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={150}
              >
                กลุ่มเจ้าหน้าที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={150}
              >
                สถานะ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={200}
              >
                การทำงาน
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    ไม่พบข้อมูลโครงการ
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              projects.map((project, index) => {
                const actionButtons = getActionButtons(project);
                return (
                  <TableRow
                    key={project.id || index}
                    hover
                    sx={{
                      "&:nth-of-type(even)": { bgcolor: "action.hover" },
                      transition: "background-color 0.2s",
                    }}
                  >
                    <TableCell align="center" sx={{ fontWeight: 500 }}>
                      {index + 1}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {project.nameThai || project.name || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {renderEnforcementStatus(project)}
                    </TableCell>
                    <TableCell align="center">
                      {project.productPolicyGroupNames?.join(", ") || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {project.ownerGroupName || "-"}
                    </TableCell>
                    <TableCell align="center">
                      {renderStatusChip(stageCodeList || [], project.stageCode)}
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 350 }}>
                      <Box
                        sx={{
                          display: "flex",
                          gap: isMobile ? 0.5 : 1,
                          justifyContent: "flex-end",
                          flexWrap: isMobile ? "wrap" : "nowrap",
                        }}
                      >

                        {/* ปุ่มอื่นๆ */}
                        {actionButtons?.label && (
                          <Tooltip title={actionButtons.label}>
                            <Button
                              variant="outlined"
                              color={actionButtons.color}
                              size={isMobile ? "small" : "medium"}
                              onClick={() => actionButtons.onClick()}
                              sx={{
                                minWidth: "auto",
                                px: isMobile ? 1 : 1.5,
                                py: isMobile ? 0.5 : 1,
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                boxShadow: 1,
                                "&:hover": {
                                  boxShadow: 3,
                                  backgroundColor:
                                    actionButtons.color + ".dark",
                                  color: "white",
                                },
                              }}
                            >
                              {actionButtons.label}
                            </Button>
                          </Tooltip>
                        )}
                        {/* ปุ่ม Log */}
                        <Tooltip title="ดู Log">
                          <IconButton
                            color="warning"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleViewLog(project)}
                            sx={{
                              "&:hover": {
                                bgcolor: "warning.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {/* ปุ่มแก้ไข */}
                        <Tooltip title="แก้ไข">
                          <IconButton
                            color="success"
                            size={isMobile ? "small" : "medium"}
                            onClick={() => handleEdit(project)}
                            sx={{
                              "&:hover": {
                                bgcolor: "success.light",
                                color: "white",
                              },
                              padding: isMobile ? 0.5 : 1,
                            }}
                          >
                            <Edit fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      {selectedProject !== null || dialogMode === "create" ? (
        <ProjectDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSave={handleSave}
          projectData={selectedProject}
          mode={dialogMode === "view" ? "edit" : dialogMode}
        />
      ) : null}

      {/* Project Logs Dialog */}
      {logDialogOpen && (
        <ProjectLogsDialog
          open={logDialogOpen}
          onClose={handleLogDialogClose}
          projectId={selectedProjectForLog?.id}
          projectName={
            selectedProjectForLog?.nameThai || selectedProjectForLog?.name || ""
          }
        />
      )}

      {/* GMMO Summary Dialog */}
      {gmmoDialogOpen && (
        <GMMOSummaryDialog
          open={gmmoDialogOpen}
          onClose={handleGMMODialogClose}
          project={selectedProjectForGMMO}
          onSuccess={handleGMMOSuccess}
        />
      )}

      {/* Save Draft Dialog */}
      {saveDraftDialogOpen && (
        <SaveDraftDialog
          open={saveDraftDialogOpen}
          onClose={handleSaveDraftDialogClose}
          project={selectedProjectForSaveDraft}
          onSuccess={handleSaveDraftSuccess}
        />
      )}

      {/* Draft Circulation Summary Dialog */}
      {draftCirculationDialogOpen && (
        <DraftCirculationSummaryDialog
          open={draftCirculationDialogOpen}
          onClose={handleDraftCirculationDialogClose}
          project={selectedProjectForDraftCirculation}
          type={draftCirculationType}
          onSuccess={handleDraftCirculationSuccess}
        />
      )}

      {/* Sub-Committee Summary Dialog */}
      {subCommitteeDialogOpen && (
        <SubCommitteeSummaryDialog
          open={subCommitteeDialogOpen}
          onClose={handleSubCommitteeDialogClose}
          project={selectedProjectForSubCommittee}
          type={subCommitteeType}
          onSuccess={handleSubCommitteeSuccess}
        />
      )}

      {/* Issue TIS Number Dialog */}
      {issueTISDialogOpen && (
        <IssueTISNumberDialog
          open={issueTISDialogOpen}
          onClose={handleIssueTISDialogClose}
          project={selectedProjectForIssueTIS}
          onSuccess={handleIssueTISSuccess}
        />
      )}

      {/* Save Initial Draft Dialog */}
      {saveInitialDraftDialogOpen && (
        <SaveInitialDraftDialog
          open={saveInitialDraftDialogOpen}
          onClose={handleSaveInitialDraftDialogClose}
          project={selectedProjectForSaveInitialDraft}
          onSuccess={handleSaveInitialDraftSuccess}
        />
      )}

      {/* Save Final Draft Dialog */}
      {saveFinalDraftDialogOpen && (
        <SaveFinalDraftDialog
          open={saveFinalDraftDialogOpen}
          onClose={handleSaveFinalDraftDialogClose}
          project={selectedProjectForSaveFinalDraft}
          onSuccess={handleSaveFinalDraftSuccess}
        />
      )}

      {/* Save Standard Announcement Dialog */}
      {saveStandardAnnouncementDialogOpen && (
        <SaveStandardAnnouncementDialog
          open={saveStandardAnnouncementDialogOpen}
          onClose={handleSaveStandardAnnouncementDialogClose}
          project={selectedProjectForSaveStandardAnnouncement}
          onSuccess={handleSaveStandardAnnouncementSuccess}
        />
      )}
    </Container>
  );
}
