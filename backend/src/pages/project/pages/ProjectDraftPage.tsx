import React, { useEffect, useState } from "react";
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
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Alert,
  Grid,
  Chip,
} from "@mui/material";
import {
  ContentCopy,
  Edit,
  Delete,
  Search,
  Add,
  Assignment,
  Download,
  Upload,
} from "@mui/icons-material";
import {
  getProjects,
  deleteProject,
  upsertProject,
} from "@services/projectService";
import {
  getStandardizationUsers,
  getWriterTypes,
  getStdTypes,
  getProductPolicyGroups,
  getProductBCGs,
  getRegulations,
  getMethodTypes,
  getTISProductGroups,
  getNSSSectors,
  getNSSSubjects,
  getISODeliverables,
  getISOICS,
  getSDOS,
  getTISNumbers,
} from "@services/globalService";
import { getExpertCommittees } from "@services/expertService";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import ProjectDialog from "../components/ProjectDialog";
import * as XLSX from "xlsx";
import { Project } from "@models/projects";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppStageCode, setGlobalLoading } from "@store/globalSlice";
import { MasterData } from "@models/global";
import { getFileDownloadUrl } from "@utils/fileService";
import { alpha } from "@mui/material/styles";

export const renderStatusChip = (stageCodeList: MasterData[],stageCode?: string) => {
  if (!stageCode) return <Chip label="ไม่ระบุ" size="small" />;

  const stagePrefix = stageCode.split(".")[0];
  const status = stageCodeList?.find((s) => s.code === stagePrefix);

  if (!status) return <Chip label={stageCode} size="small" />;

  let color:
    | "default"
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning" = "default";


  // กำหนดสีตามสถานะ
  if (stagePrefix === "10") color = "info";
  else if (stagePrefix === "20" || stagePrefix === "25") color = "primary";
  else if (stagePrefix === "30" || stagePrefix === "35") color = "secondary";
  else if (stagePrefix === "40" || stagePrefix === "45") color = "warning";
  else if (
    stagePrefix === "47" ||
    stagePrefix === "48" ||
    stagePrefix === "50"
  )
    color = "success";
  else if (stagePrefix === "60") color = "success";

  return <Chip label={status.name} size="small" color={color} />;
};

export default function ProjectDraftPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchText, setSearchText] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  /** ไฮไลต์แถวที่เพิ่งคัดลอกจากโปรเจกต์เดิม */
  const [highlightCopiedProjectId, setHighlightCopiedProjectId] = useState<
    number | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );

  const {stageCodeList} = useAppSelector((state: RootState) => state.global);

  const dispatch=useAppDispatch();

  useEffect(() => {
    if(!stageCodeList){
      dispatch(fetchAppStageCode());
    }
  }, [dispatch,stageCodeList]);


  useEffect(() => {
    loadProjects();
  }, []);

  /** เลื่อนมองเห็นแถวที่คัดลอกใหม่เมื่อรายการโหลดแล้ว */
  useEffect(() => {
    if (highlightCopiedProjectId == null) return;
    const el = document.querySelector<HTMLElement>(
      `[data-copied-highlight-row="${highlightCopiedProjectId}"]`
    );
    if (el) {
      requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      );
    }
  }, [highlightCopiedProjectId, projects]);

  /** ล้างไฮไลต์หลังสักครู่ */
  useEffect(() => {
    if (highlightCopiedProjectId == null) return;
    const t = window.setTimeout(() => setHighlightCopiedProjectId(null), 24000);
    return () => window.clearTimeout(t);
  }, [highlightCopiedProjectId]);

  const loadProjects = async () => {
    try {
      dispatch(setGlobalLoading(true));
      setError(null);
      const params = {
        search: searchText.trim() || undefined,
        stageCode:"00.00"
      };
      const res = await getProjects(params);
      // กรองสถานะ 00.99 และ 10.00 ตาม spec (ไม่แสดงในหน้านี้)
      const filteredProjects = (res.data || []).filter(
        (project) =>
          project.stageCode !== "00.99" && project.stageCode !== "10.00"
      );
      setProjects(filteredProjects);
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

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (project: Project) => {
    if (!project.id) return;

    const confirmResult = await showConfirm(
      "ยืนยันการลบ",
      `คุณต้องการลบโครงการ "${project.name}" หรือไม่?`,
      "ลบ",
      "ยกเลิก"
    );

    if (!confirmResult.isConfirmed) {
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      await deleteProject(project.id);
      showSuccess("สำเร็จ", "ลบโครงการเรียบร้อยแล้ว");
      loadProjects();
    } catch (err: any) {
      console.error("Error deleting project:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถลบโครงการได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleCopy = async (project: Project) => {
    if (!project.id) return;

    const confirm = await showConfirm(
      "ยืนยันการคัดลอก",
      `คุณต้องการคัดลอกโครงการ "${project.nameThai || project.name || "ไม่ระบุชื่อ"}" หรือไม่?`
    );
    if (!confirm.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));
      const copiedProject = {
        ...project,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        createdBy: undefined,
      };
      const created = await upsertProject(copiedProject);
      if (created?.id != null) {
        setHighlightCopiedProjectId(created.id);
      }
      showSuccess("สำเร็จ", "คัดลอกโครงการเรียบร้อยแล้ว");
      await loadProjects();
    } catch (err: any) {
      console.error("Error copying project:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถคัดลอกโครงการได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

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

  // Render status chip based on stage code
  
  // Render status chip
  


  // Excel Bulk Upload Handler
  const handleBulkExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showError(
        "รูปแบบไฟล์ไม่ถูกต้อง",
        "กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls)"
      );
      event.target.value = "";
      return;
    }

    // Show confirmation dialog before uploading
    const confirm = await showConfirm(
      "ยืนยันการอัปโหลด",
      `คุณต้องการอัปโหลดไฟล์ "${file.name}" หรือไม่?`
    );
    if (!confirm.isConfirmed) {
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        dispatch(setGlobalLoading(true));
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showError("ไฟล์ว่าง", "ไม่พบข้อมูลในไฟล์ Excel");
          dispatch(setGlobalLoading(false));
          return;
        }

        // Load master data for mapping
        const [
          usersRes,
          writerTypesRes,
          stdTypesRes,
          productPolicyGroupsRes,
          productBCGsRes,
          regulationsRes,
          methodTypesRes,
          productGroupsRes,
          nssSectorsRes,
          isoDeliverablesRes,
          isoICSRes,
          tisNumbersRes,
          committeesRes,
          sdosRes,
        ] = await Promise.all([
          getStandardizationUsers("08"),
          getWriterTypes(),
          getStdTypes(),
          getProductPolicyGroups(),
          getProductBCGs(),
          getRegulations(),
          getMethodTypes(),
          getTISProductGroups(),
          getNSSSectors(),
          getISODeliverables(),
          getISOICS(),
          getTISNumbers(),
          getExpertCommittees(),
          getSDOS(),
        ]);

        // Helper function to parse comma-separated values
        const parseCommaSeparated = (value: any): string[] => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
          return String(value)
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v.length > 0);
        };

        // Helper function to find ID by name
        const findIdByName = (name: string, options: any[]): number | undefined => {
          if (!name) return undefined;
          const found = options.find((opt) => opt.name === name || opt.nameTh === name);
          return found?.id as number | undefined;
        };

        // Helper function to find IDs by names (for multi-select)
        const findIdsByNames = (names: string[], options: any[]): number[] => {
          return names
            .map((name) => findIdByName(name, options))
            .filter((id): id is number => id !== undefined);
        };

        // Helper function to find ISO ICS codes by names
        const findISOCodesByNames = (names: string[], options: any[]): string[] => {
          return names
            .map((name) => {
              const found = options.find((opt) => opt.name === name);
              return found?.code || "";
            })
            .filter((code) => code.length > 0);
        };

        // Convert Excel data to Project format
        const newProjects: Partial<Project>[] = await Promise.all(
          jsonData.map(async (row: any) => {
            // Parse multi-select fields
            const productPolicyGroupNames = parseCommaSeparated(
              row["กลุ่มผลิตภัณฑ์นโยบาย (คั่นด้วยเครื่องหมายจุลภาค)"]
            );
            const productBCGNames = parseCommaSeparated(
              row["ประเภท BCG (คั่นด้วยเครื่องหมายจุลภาค)"]
            );
            const isoIcsNames = parseCommaSeparated(
              row["เลข ICS (คั่นด้วยเครื่องหมายจุลภาค)"]
            );

            const isoAdoptNames = parseCommaSeparated(
              row["มาตรฐานที่นำมา Adopt"]
            );

            const tisReprintNames = parseCommaSeparated(
              row["มาตรฐานเดิมที่ถูกแทนที่"]
            );

            // Find owner ID by name
            let ownerId: number | undefined;
            if (row["ชื่อเจ้าหน้าที่"]) {
              const owner = usersRes.find(
                (u: any) => u.name === row["ชื่อเจ้าหน้าที่"]
              );
              ownerId = owner?.id as number | undefined;
            }

            // Find NSS Subject ID (need to load based on sector first)
            let nssSubjectId: number | undefined;
            let nssSubjectName = row["กลุ่มผลิตภัณฑ์ NSS Secter (กลุ่มย่อย)"] || "";
            if (row["กลุ่มผลิตภัณฑ์ NSS Secter"]) {
              const sector = nssSectorsRes.find(
                (s: any) => s.name === row["กลุ่มผลิตภัณฑ์ NSS Secter"]
              );
              if (sector) {
                // Load subjects for this sector
                const subjects = await getNSSSubjects(sector.id);
                const subject = subjects.find(
                  (s: any) => s.name === nssSubjectName
                );
                nssSubjectId = subject?.id as number | undefined;
              }
            }

            // Find committee IDs by name (for both committee and sub-committee)
            const committeeId = findIdByName(row["ชื่อ กว."], committeesRes.data || []);
            const subCommitteeId = findIdByName(row["ชื่อ อนุ กว."], committeesRes.data || []);

            const project: Partial<Project> = {
              nameThai: row["ชื่อภาษาไทย"] || "",
              nameEnglish: row["ชื่อภาษาอังกฤษ"] || "",
              startYear: row["ปีที่เริ่มโปรเจค"]?.toString() || new Date().getFullYear().toString(),
              ownerId: ownerId,
              ownerName: row["ชื่อเจ้าหน้าที่"] || "",
              ownerGroupName: row["กลุ่มของเจ้าหน้าที่"] || "",
              writerTypeId: findIdByName(row["ประเภทผู้จัดทำ"], writerTypesRes),
              writerTypeName: row["ประเภทผู้จัดทำ"] || "",
              expectedCompletionMonth: row["เดือนที่คาดว่าจะทำเสร็จ"]?.toString().padStart(2, "0") || "",
              expectedCompletionYear: row["ปีที่คาดว่าจะทำเสร็จ"]?.toString() || new Date().getFullYear().toString(),
              enforcementStatusId: findIdByName(row["สถานะเกี่ยวกับการบังคับ"], regulationsRes),
              enforcementStatusName: row["สถานะเกี่ยวกับการบังคับ"] || "",
              proposalTypeId: findIdByName(row["ประเภทของ proposal"], regulationsRes),
              proposalTypeName: row["ประเภทของ proposal"] || "",
              methodTypeId: findIdByName(row["วิธีจัดทำ"], methodTypesRes),
              methodTypeName: row["วิธีจัดทำ"] || "",
              stdTypeId: findIdByName(row["ชนิดของ มอก."], stdTypesRes),
              stdTypeName: row["ชนิดของ มอก."] || "",
              productPolicyGroupIds: findIdsByNames(productPolicyGroupNames, productPolicyGroupsRes),
              productPolicyGroupNames: productPolicyGroupNames,
              productBCGIds: findIdsByNames(productBCGNames, productBCGsRes),
              productBCGNames: productBCGNames,
              bcgReason: row["เหตุผลของ BCG"] || "",
              productGroupId: findIdByName(row["กลุ่มผลิตภัณฑ์"], productGroupsRes),
              productGroupName: row["กลุ่มผลิตภัณฑ์"] || "",
              nssSectorId: findIdByName(row["กลุ่มผลิตภัณฑ์ NSS Secter"], nssSectorsRes),
              nssSectorName: row["กลุ่มผลิตภัณฑ์ NSS Secter"] || "",
              nssSubjectId: nssSubjectId,
              nssSubjectName: nssSubjectName,
              isoDeliverableIds: findISOCodesByNames(isoAdoptNames, isoDeliverablesRes),
              isoDeliverableNames: isoAdoptNames,
              isoDeliverableOther: row["มาตรฐานที่นำมา Adopt อื่น ๆ"] || "",
              isoIcsIds: findISOCodesByNames(isoIcsNames, isoICSRes),
              isoIcsNames: isoIcsNames,
              tisReprintNos: findIdsByNames(tisReprintNames, tisNumbersRes),
              tisReprintNames: tisReprintNames,
              committeeId: committeeId,
              committeeName: row["ชื่อ กว."] || "",
              subCommitteeId: subCommitteeId,
              subCommitteeName: row["ชื่อ อนุ กว."] || "",
              sdosId: findIdByName(row["ชื่อ SDOS"], sdosRes),
              sdosName: row["ชื่อ SDOS"] || "",
              remarks: row["หมายเหตุ"] || "",
              stageCode: "00.00",
              stageUiMsg: "สร้างร่าง",
            };

            return project;
          })
        );

        // Call API to create projects in bulk
        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        

        for (let i = 0; i < newProjects.length; i++) {
          const project = newProjects[i];
          if(project?.expectedCompletionMonth && project?.expectedCompletionMonth?.length>2){
            showError("เกิดข้อผิดพลาด", `เดือนที่คาดว่าจะทำเสร็จ แถวที่ ${i + 1} ยาวเกินไป ต้องเป็นตัวเลข 2 หลัก เช่น 01,02,...11,12`);
            return;
          }
          try {
            await upsertProject(project);
            successCount++;
          } catch (err: any) {
            console.error(`Error creating project ${i + 1}:`, err);
            errorCount++;
            errors.push(`แถว ${i + 1}: ${err?.response?.data?.message || "เกิดข้อผิดพลาด"}`);
          }
        }

        if (successCount > 0) {
          showSuccess(
            "อัปโหลดสำเร็จ",
            `นำเข้า ${successCount} โครงการเรียบร้อยแล้ว${errorCount > 0 ? ` (เกิดข้อผิดพลาด ${errorCount} รายการ)` : ""}`
          );
          if (errors.length > 0) {
            console.error("Errors:", errors);
          }
          await loadProjects();
        } else {
          showError("เกิดข้อผิดพลาด", `ไม่สามารถนำเข้าโครงการได้ (${errorCount} รายการ)`);
        }

        // Clear the file input
        event.target.value = "";
      } catch (error) {
        console.error("Error reading Excel file:", error);
        showError("เกิดข้อผิดพลาด", "ไม่สามารถอ่านไฟล์ Excel ได้");
      } finally {
        dispatch(setGlobalLoading(false));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Assignment sx={{ fontSize: 32, color: "primary.main" }} />
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          ร่างแผน[00]
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
        {/* Row 1: Search Section */}
        <Grid container spacing={2} alignItems="flex-end" sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 9 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 500, mb: 1 }}
            >
              ค้นหาร่างมาตรฐาน
            </Typography>
            <TextField
              size="small"
              placeholder="ค้นหาร่างมาตรฐาน"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              fullWidth
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
          <Grid size={{ xs: 12, md: 3 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              fullWidth
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

        {/* Row 2: Action Buttons */}
        <Grid container spacing={2} alignItems="center">
          <Grid
            size={{ xs: 12, md: 12 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Download />}
              component="a"
              href={getFileDownloadUrl("/template/Project_Template.xlsx")}
              rel="noopener noreferrer"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 2,
                py: 1,
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  backgroundColor: "primary.light",
                  color: "white",
                },
              }}
            >
              ดาวโหลด Template
            </Button>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleBulkExcelUpload}
              style={{ display: "none" }}
              id="bulk-excel-upload"
            />
            <label htmlFor="bulk-excel-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<Upload />}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2,
                  py: 1,
                  borderColor: "#4caf50",
                  color: "#4caf50",
                  "&:hover": {
                    borderColor: "#388e3c",
                    backgroundColor: "#4caf50",
                    color: "white",
                  },
                }}
              >
                อัปโหลด Excel
              </Button>
            </label>

            <Button
              variant="contained"
              color="warning"
              size="large"
              startIcon={<Add />}
              onClick={handleCreate}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: 2,
                px: 3,
                py: 1,
                minWidth: 150,
                "&:hover": {
                  boxShadow: 4,
                  backgroundColor: "warning.dark",
                },
              }}
            >
              เพิ่มโครงการ
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
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
                align="center"
                width={80}
              >
                รหัสร่างมาตรฐาน
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
              >
                ชื่อร่างมาตรฐาน
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                width={150}
              >
                สถานะเกี่ยวกับการบังคับ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                width={180}
              >
                กลุ่มผลิตภัณฑ์นโยบาย
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                width={150}
              >
                กลุ่มเจ้าหน้าที่
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                width={150}
              >
                สถานะ
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.95rem" }}
                align="center"
                width={180}
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
                const isNewCopy = project.id === highlightCopiedProjectId;
                return (
                <TableRow
                  key={project.id || index}
                  data-copied-highlight-row={
                    isNewCopy && project.id != null ? project.id : undefined
                  }
                  hover
                  sx={{
                    ...(isNewCopy
                      ? {
                          bgcolor: (t) => alpha(t.palette.success.main, 0.12),
                          boxShadow: (t) =>
                            `inset 4px 0 0 ${t.palette.success.main}`,
                        }
                      : {}),
                    "&:nth-of-type(even)": { bgcolor: "action.hover" },
                    ...(isNewCopy
                      ? {
                          "&:nth-of-type(even)": {
                            bgcolor: (t) => alpha(t.palette.success.main, 0.12),
                          },
                        }
                      : {}),
                    transition: "background-color 0.2s",
                  }}
                >
                  <TableCell align="center" sx={{ fontWeight: 500 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell align="center">{project.id}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <span>{project.nameThai}</span>
                      {isNewCopy && (
                        <Chip
                          label="ใหม่ (คัดลอก)"
                          size="small"
                          color="success"
                          variant="filled"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {project.enforcementStatusName}
                  </TableCell>
                  <TableCell>{project.productPolicyGroupNames?.join(", ") || "-"}</TableCell>
                  <TableCell>{project.ownerGroupName || "-"}</TableCell>
                  <TableCell>
                  {renderStatusChip(stageCodeList || [],project.stageCode)}
                  </TableCell>
                  <TableCell align="center">
                    <Box
                      sx={{
                        display: "flex",
                        gap: isMobile ? 0.25 : 0.5,
                        justifyContent: "center",
                        flexWrap: "nowrap",
                      }}
                    >
                      <Tooltip title="คัดลอก">
                        <IconButton
                          color="primary"
                          size={isMobile ? "small" : "medium"}
                          onClick={() => handleCopy(project)}
                          sx={{
                            "&:hover": {
                              bgcolor: "primary.light",
                              color: "white",
                            },
                            padding: isMobile ? 0.5 : 1,
                          }}
                        >
                          <ContentCopy
                            fontSize={isMobile ? "small" : "medium"}
                          />
                        </IconButton>
                      </Tooltip>
                      {project.stageCode !== "00.99" &&
                        project.stageCode !== "10.00" && (
                          <>
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
                                <Edit
                                  fontSize={isMobile ? "small" : "medium"}
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="ลบ">
                              <IconButton
                                color="error"
                                size={isMobile ? "small" : "medium"}
                                onClick={() => handleDelete(project)}
                                sx={{
                                  "&:hover": {
                                    bgcolor: "error.light",
                                    color: "white",
                                  },
                                  padding: isMobile ? 0.5 : 1,
                                }}
                              >
                                <Delete
                                  fontSize={isMobile ? "small" : "medium"}
                                />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
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
          onClose={()=>{
            handleDialogClose();
            loadProjects();
          }}
          onSave={handleSave}
          projectData={selectedProject}
          mode={dialogMode === "view" ? "edit" : dialogMode}
        />
      ) : null}
    </Container>
  );
}
