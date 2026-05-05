import { useState, useEffect, useMemo } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Grid,
  Chip,
  Tooltip,
  Autocomplete,
} from "@mui/material";
import { Close, Add, Delete, Search } from "@mui/icons-material";
import { Meeting } from "@models/meeting";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import {
  getProjects,
  getMeetingTopics,
  upsertMeetingTopic,
  closeMeeting,
  deleteMeetingTopic,
} from "@services/meetingService";
import { MeetingTopic } from "@models/meeting";
import { Project } from "@models/projects";
import { RootState } from "@store/index";
import { MasterData } from "@models/global";

interface MeetingCloseDialogProps {
  open: boolean;
  meeting: Meeting;
  onClose: () => void;
  onSave?: () => void;
}

interface ProjectSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (projects: Project[]) => void;
  selectedProjectIds: number[];
  stageCodeList: MasterData[];
}

// Project Selection Dialog
function ProjectSelectionDialog({
  open,
  onClose,
  onSelect,
  selectedProjectIds,
  stageCodeList,
}: ProjectSelectionDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedProjectIds);
  const [filterStageCode, setFilterStageCode] = useState<string>("");
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedIds(selectedProjectIds);
      loadProjects();
    }
  }, [open, selectedProjectIds]);

 
  const loadProjects = async () => {
    try {
      dispatch(setGlobalLoading(true));

      const params: any = {
        search: searchText.trim() || undefined,
      };

      // ถ้าเลือกสถานะ ให้กรองตาม stageCode
      if (filterStageCode) {
        // กรอง projects ที่ stageCode ขึ้นต้นด้วย selectedStatus
        const res = await getProjects(params);
        const filteredProjects = (res.data || []).filter((project) => {
          const stageCode = project.stageCode || "";
          return stageCode.startsWith(filterStageCode + ".");
        });
        setProjects(filteredProjects);
      } else {
        const res = await getProjects(params);
        setProjects(res.data || []);
      }
    } catch (err: any) {
      console.error("Error loading projects:", err);
      showError(err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลโครงการได้");
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const filteredProjects = useMemo(() => {
    let filtered = projects;
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nameThai?.toLowerCase().includes(search) ||
          p.owner?.toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [projects, searchText]);

  const handleToggleSelect = (projectId: number) => {
    setSelectedIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelect = () => {
    const selected = projects.filter((p) => selectedIds.includes(p.id || 0));
    onSelect(selected);
    onClose();
  };

  return (
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "white",
          py: 2,
          fontWeight: 700,
        }}
      >
        เลือกร่างมาตรฐาน
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Filter/Search */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 2,
              alignItems: isMobile ? "stretch" : "flex-end",
            }}
          >

            <Autocomplete
              options={stageCodeList?.filter((s) => !   s.code?.includes("."))||[]}
              getOptionLabel={(option) => {
                return `${option.name} [${option.code}]`;
              }}
              value={
                filterStageCode
                  ? stageCodeList?.find((s) => s.code === filterStageCode) || null
                  : null
              }
              onChange={(_, newValue) => {
                setFilterStageCode(newValue?.code || "");
                  loadProjects();
              }}
              isOptionEqualToValue={(option, value) =>
                option.code === value.code
              }
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="สถานะโครงการ"
                  sx={{
                    minWidth: 200,
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
            <TextField
              label="ชื่อร่างมาตรฐาน"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              size="small"
              fullWidth={isMobile}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={loadProjects}
              sx={{ minWidth: 100 }}
            >
              ค้นหา
            </Button>
          </Box>

          {/* Projects Table */}
          <Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, mb: 2, color: "text.primary" }}
            >
              รายการร่างมาตรฐาน
            </Typography>
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 400,
                overflowX: "auto",
                overflowY: "auto",
                "&::-webkit-scrollbar": {
                  width: "8px",
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "transparent",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "4px",
                },
                "&::-webkit-scrollbar-thumb:hover": {
                  background: "rgba(0,0,0,0.3)",
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                        minWidth: 50,
                      }}
                    >
                      เลือก
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      ชื่อโครงการ
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      ปีที่เริ่ม
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      ผู้จัดทำ
                    </TableCell>
                    <TableCell
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      สถานะ
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects?.length > 0 ? (
                    filteredProjects?.map((project) => (
                      <TableRow key={project.id} hover>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(project.id || 0)}
                            onChange={() => handleToggleSelect(project.id || 0)}
                          />
                        </TableCell>
                        <TableCell>{project.nameThai || "-"}</TableCell>
                        <TableCell>{project.startYear || "-"}</TableCell>
                        <TableCell>{project.ownerName || "-"}</TableCell>
                        <TableCell>
                          <Chip
                            label={stageCodeList?.find((s) => s.code === project.stageCode)?.name || "-"}
                            size="small"
                            color={
                              project.stageCode === "50.99"
                                ? "success"
                                : "default"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          ไม่พบข้อมูล
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          ยกเลิก
        </Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={selectedIds.length === 0}
        >
          เพิ่ม ({selectedIds.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Main Meeting Close Dialog
export default function MeetingCloseDialog({
  open,
  meeting,
  onClose,
  onSave,
}: MeetingCloseDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [topics, setTopics] = useState<MeetingTopic[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [otherTopicText, setOtherTopicText] = useState("");

  const { stageCodeList } = useAppSelector((state: RootState) => state.global);

  useEffect(() => {
    if (stageCodeList === null) {
      dispatch(fetchAppStageCode());
    }
  }, [stageCodeList, dispatch]);

  useEffect(() => {
    if (open && meeting.id) {
      loadMeetingTopics();
    }
  }, [open, meeting.id]);

  const loadMeetingTopics = async () => {
    if (!meeting.id) return;
    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));
      const res = await getMeetingTopics(meeting.id);
      setTopics(res.data || []);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error("Error loading meeting topics:", err);
      }
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const handleSelectProjects = (selectedProjects: Project[]) => {
    // Add selected projects as topics
    const newTopics: MeetingTopic[] = selectedProjects
      .filter((project) => project.id && project.nameThai) // Only add projects with id and name
      .map((project) => ({
        meetingId: meeting.id || 0,
        topicType: "project" as const,
        projectId: project.id,
        projectName: project.nameThai || "",
        projectStartYear: project.startYear || "",
        projectOwner: project.ownerName || "",
        projectStageCode: project.stageCode || "",
        topicText: project.nameThai || "", // Ensure topicText is always a string
      }));
    setTopics((prev) => [...prev, ...newTopics]);
  };

  const handleAddOtherTopic = () => {
    if (!otherTopicText.trim()) {
      showError("กรุณากรอกเรื่องการประชุม");
      return;
    }
    const newTopic: MeetingTopic = {
      meetingId: meeting.id || 0,
      topicType: "other",
      topicText: otherTopicText.trim(),
    };
    setTopics((prev) => [...prev, newTopic]);
    setOtherTopicText("");
  };

  const handleRemoveTopic = async(index: number) => {
    const topic = topics[index];
    const topicDisplayName = topic.projectName || topic.topicText || `หัวข้อที่ ${index + 1}`;
    const confirm = await showConfirm(
      "ยืนยันการลบ",
      `คุณต้องการลบหัวข้อ "${topicDisplayName}" หรือไม่?`
    );
    if (!confirm.isConfirmed) return;

    try {
      const topicId = topics[index].id;
      if (topicId) {
        await deleteMeetingTopic(topicId);
      }
      setTopics((prev) => prev.filter((_, i) => i !== index));
      showSuccess("ลบสำเร็จ", "ลบหัวข้อการประชุมเรียบร้อยแล้ว");
    } catch (err: any) {
      console.error("Error removing topic:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบหัวข้อได้"
      );
    }
  };

  const handleSaveAndClose = async () => {
    if (!meeting.id) return;

    if (topics.length === 0) {
      showError("กรุณาเพิ่มเรื่องที่ประชุมอย่างน้อย 1 เรื่อง");
      return;
    }

    const confirmResult = await showConfirm(
      "ยืนยันการปิดประชุม",
      "คุณต้องการบันทึกข้อมูลและปิดการประชุมหรือไม่?",
      "บันทึกและปิดประชุม",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      dispatch(setGlobalLoading(true));

      // Save all topics
      for (const topic of topics) {
        await upsertMeetingTopic(meeting.id, topic);
      }

      // Close meeting
      await closeMeeting(meeting.id);

      showSuccess("สำเร็จ", "บันทึกข้อมูลและปิดการประชุมเรียบร้อยแล้ว");
      if (onSave) {
        onSave();
      }
      onClose();
    } catch (err: any) {
      console.error("Error closing meeting:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถปิดการประชุมได้"
      );
    } finally {
      setLoading(false);
      dispatch(setGlobalLoading(false));
    }
  };

  const selectedProjectIds = useMemo(
    () =>
      topics
        .filter((t) => t.topicType === "project" && t.projectId)
        .map((t) => t.projectId || 0),
    [topics]
  );

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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "white",
            py: 2,
            fontWeight: 700,
          }}
        >
          สรุปการประชุม (ปิดการประชุม)
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
            </Box>

            {/* ร่างมาตรฐานที่เลือก */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "background.paper",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="body1"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  ร่างมาตรฐานที่เลือก
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setProjectDialogOpen(true)}
                  size="small"
                >
                  เลือกร่างมาตรฐาน
                </Button>
              </Box>

              {topics.filter((t) => t.topicType === "project").length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  ยังไม่ได้เลือกร่างมาตรฐาน
                </Typography>
              ) : (
                <TableContainer
                  component={Paper}
                  sx={{
                    maxHeight: 300,
                    overflowX: "auto",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": {
                      width: "8px",
                      height: "8px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(0,0,0,0.2)",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb:hover": {
                      background: "rgba(0,0,0,0.3)",
                    },
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          ชื่อโครงการ
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          ปีที่เริ่ม
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          ผู้จัดทำ
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 600,
                          }}
                        >
                          สถานะ
                        </TableCell>
                        <TableCell
                          sx={{
                            bgcolor: "primary.main",
                            color: "white",
                            fontWeight: 600,
                            minWidth: 80,
                          }}
                        >
                          การดำเนินการ
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topics
                        .filter((t) => t.topicType === "project")
                        .map((topic, index) => {
                          const originalIndex = topics.findIndex(
                            (t) => t === topic
                          );
                          return (
                            <TableRow key={index} hover>
                              <TableCell>
                                {topic.projectName || topic.topicText}
                              </TableCell>
                              <TableCell>
                                {topic.projectStartYear || "-"}
                              </TableCell>
                              <TableCell>{topic.projectOwner || "-"}</TableCell>
                              <TableCell>
                                <Chip
                                  label={stageCodeList?.find((s) => s.code === topic.projectStageCode)?.name || "-"}
                                  size="small"
                                  color="success"
                                />
                              </TableCell>
                              <TableCell>
                                <Tooltip title="ลบ">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleRemoveTopic(originalIndex)
                                    }
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* วาระอื่นๆ */}
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
                วาระอื่นๆ
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                <TextField
                  label="เรื่องการประชุม"
                  value={otherTopicText}
                  onChange={(e) => setOtherTopicText(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="กรอกเรื่องการประชุม"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddOtherTopic();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddOtherTopic}
                  disabled={!otherTopicText.trim()}
                  sx={{ minWidth: 100 }}
                >
                  เพิ่ม
                </Button>
              </Box>

              {topics.filter((t) => t.topicType === "other").length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: 600,
                            }}
                          >
                            เรื่องการประชุม
                          </TableCell>
                          <TableCell
                            sx={{
                              bgcolor: "primary.main",
                              color: "white",
                              fontWeight: 600,
                              minWidth: 80,
                            }}
                          >
                            การดำเนินการ
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topics
                          .filter((t) => t.topicType === "other")
                          .map((topic, index) => {
                            const originalIndex = topics.findIndex(
                              (t) => t === topic
                            );
                            return (
                              <TableRow key={index} hover>
                                <TableCell>{topic.topicText}</TableCell>
                                <TableCell>
                                  <Tooltip title="ลบ">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleRemoveTopic(originalIndex)
                                      }
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={onClose} variant="outlined">
            ยกเลิก
          </Button>
          <Button
            onClick={handleSaveAndClose}
            variant="contained"
            color="primary"
            disabled={loading || topics.length === 0}
            sx={{ minWidth: 180 }}
          >
            บันทึกและปิดประชุม
          </Button>
        </DialogActions>
      </Dialog>

      <ProjectSelectionDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        onSelect={handleSelectProjects}
        selectedProjectIds={selectedProjectIds}
        stageCodeList={stageCodeList || []}
      />
    </>
  );
}
