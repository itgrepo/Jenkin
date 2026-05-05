import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  TextField,
  Autocomplete,
  Grid,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FormContainer from "@components/FormContainer";
import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import ScienceIcon from "@mui/icons-material/Science";
import PolicyIcon from "@mui/icons-material/Policy";
import { showConfirm, showError, showSuccess, showWarning } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";

import {
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
  getTISNumbers,
  getSDOS,
  getStandardizationUsers,
} from "@services/globalService";
import { MasterData } from "@models/global";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { fetchAppStageCode, fetchAppSubDepartments, setGlobalLoading } from "@store/globalSlice";
import { getExpertCommittees } from "@services/expertService";
import { Committee } from "@models/expert";
import { Project } from "@models/projects";
import { RootState } from "@store/index";
import { updateProjectStage, upsertProjectLog } from "@services/projectService";

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (projectData: any) => void;
  projectData?: Project | null;
  mode?: "create" | "edit";
}

/** รับได้เฉพาะอักษรไทย (ช่วง Unicode ไทย) และช่องว่าง */
const filterThaiOnly = (value: string) =>
  value.replace(/[^\u0E00-\u0E7F\s]/g, "");

/** รับได้เฉพาะอักษรภาษาอังกฤษ ตัวเลข ช่องว่าง และเครื่องหมายที่ใช้ในชื่อมาตรฐานทั่วไป */
const filterEnglishOnly = (value: string) =>
  value.replace(/[^a-zA-Z0-9\s\-'.,()/&]/g, "");

const ProjectDialog: React.FC<ProjectDialogProps> = ({
  open,
  onClose,
  onSave,
  projectData,
  mode = "create",
}) => {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const currentUser = useAppSelector((state: RootState) => state.auth.user);


  const { subDepartmentList, stageCodeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();

  // Form data state
  const [formData, setFormData] = useState({
    // Page 1: ข้อมูลพื้นฐาน
    id: 0,
    nameThai: "",
    nameEnglish: "",
    startYear: dayjs().year().toString(),
    ownerId: null as number | null,
    ownerName: "",
    ownerGroupId: null as number | null,
    ownerGroupName: "",
    writerTypeId: null as number | null,
    writerTypeName: "",
    expectedCompletionMonth: "",
    expectedCompletionYear: dayjs().year().toString(),
    enforcementStatusId: null as number | null,
    enforcementStatusName: "",
    proposalTypeId: null as number | null,
    proposalTypeName: "",
    methodTypeId: null as number | null,
    methodTypeName: "",

    // Page 2: ข้อมูลเพิ่มเติม
    stdTypeId: null as number | null,
    stdTypeName: "",
    productPolicyGroupIds: [] as number[],
    productPolicyGroupNames: [] as string[],
    productBCGIds: [] as number[],
    productBCGNames: [] as string[],
    bcgReason: "",
    productGroupId: null as number | null,
    productGroupName: "",
    nssSectorId: null as number | null,
    nssSectorName: "",
    nssSubjectId: null as number | null,
    nssSubjectName: "",
    isoDeliverableIds: [] as string[],
    isoDeliverableNames: [] as string[],
    isoDeliverableOther: "",
    isoIcsIds: [] as string[],
    isoIcsNames: [] as string[],
    stageCode: "00.00",
    stageUiMsg: "สร้างร่าง",

    // Page 3: ข้อมูลเพิ่มเติม
    tisReprintNos: [] as number[],
    tisReprintNames: [] as string[],
    committeeId: null as number | null,
    committeeName: "",
    subCommitteeId: null as number | null,
    subCommitteeName: "",
    sdosId: null as number | null,
    sdosName: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Master data states
  const [writerTypes, setWriterTypes] = useState<MasterData[]>([]);
  const [stdTypes, setStdTypes] = useState<MasterData[]>([]);
  const [productPolicyGroups, setProductPolicyGroups] = useState<MasterData[]>(
    []
  );
  const [productBCGs, setProductBCGs] = useState<MasterData[]>([]);
  const [regulations, setRegulations] = useState<MasterData[]>([]);
  const [methodTypes, setMethodTypes] = useState<MasterData[]>([]);
  const [tisProductGroups, setTISProductGroups] = useState<MasterData[]>([]);
  const [nssSectors, setNSSSectors] = useState<MasterData[]>([]);
  const [nssSubjects, setNSSSubjects] = useState<MasterData[]>([]);
  const [isoDeliverables, setISODeliverables] = useState<MasterData[]>([]);
  const [isoICS, setISOICS] = useState<MasterData[]>([]);
  const [isoDeliverablesLoading, setIsoDeliverablesLoading] = useState(false);
  const [isoICSLoading, setIsoICSLoading] = useState(false);
  const [tisNumbers, setTISNumbers] = useState<MasterData[]>([]);
  const [expertCommittees, setExpertCommittees] = useState<Committee[]>([]);
  const [sdos, setSDOS] = useState<MasterData[]>([]);
  const [standardizationUsers, setStandardizationUsers] = useState<
    MasterData[]
  >([]);


  // Load master data
  useEffect(() => {
    if (open) {
      loadMasterData();
    }
  }, [open]);

  useEffect(() => {
    if (!subDepartmentList) {
      dispatch(fetchAppSubDepartments());
    }
    if (!stageCodeList) {
      dispatch(fetchAppStageCode());
    }

  }, [dispatch, subDepartmentList, stageCodeList]);



  const loadMasterData = async () => {
    try {
      dispatch(setGlobalLoading(true));
      const [
        writerTypesRes,
        stdTypesRes,
        productPolicyGroupsRes,
        productBCGsRes,
        regulationsRes,
        methodTypesRes,
        tisProductGroupsRes,
        nssSectorsRes,
        isoDeliverablesRes,
        isoICSRes,
        tisNumbersRes,
        expertCommitteesRes,
        sdosRes,
        usersRes,
      ] = await Promise.all([
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
        getStandardizationUsers("08"),
      ]);


      setWriterTypes(writerTypesRes || []);
      setStdTypes(stdTypesRes || []);
      setProductPolicyGroups(productPolicyGroupsRes || []);
      setProductBCGs(productBCGsRes || []);
      setRegulations(regulationsRes || []);
      setMethodTypes(methodTypesRes || []);
      setTISProductGroups(tisProductGroupsRes || []);
      setNSSSectors(nssSectorsRes || []);
      setISODeliverables(isoDeliverablesRes || []);
      setISOICS(isoICSRes || []);
      setTISNumbers(tisNumbersRes || []);
      setExpertCommittees(expertCommitteesRes.data || []);
      setSDOS(sdosRes || []);
      setStandardizationUsers(usersRes || []);
    } catch (err: any) {
      console.error("Error loading master data:", err);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  // Load NSS Subjects when sector changes
  useEffect(() => {
    if (formData.nssSectorId) {
      loadNSSSubjects(formData.nssSectorId);
    } else {
      setNSSSubjects([]);
      setFormData((prev) => ({
        ...prev,
        nssSubjectId: null,
        nssSubjectName: "",
      }));
    }
  }, [formData.nssSectorId]);

  const loadNSSSubjects = async (sectorId: number) => {
    try {
      const res = await getNSSSubjects(sectorId);
      setNSSSubjects(res || []);
    } catch (err: any) {
      console.error("Error loading NSS subjects:", err);
    }
  };

  // Initialize form data
  useEffect(() => {
    if (open) {
      if (projectData) {
        // Edit mode: load existing data
        setFormData({
          id: projectData?.id || 0,
          nameThai: filterThaiOnly(
            projectData.nameThai || projectData.name || ""
          ),
          nameEnglish: filterEnglishOnly(projectData.nameEnglish || ""),
          startYear: projectData.startYear || dayjs().year().toString(),
          ownerId: projectData.ownerId || null,
          ownerName: projectData.ownerName || projectData.owner || "",
          ownerGroupId: projectData.ownerGroupId || null,
          ownerGroupName: projectData.ownerGroupName || "",
          writerTypeId: projectData.writerTypeId || null,
          writerTypeName: projectData.writerTypeName || "",
          expectedCompletionMonth: projectData.expectedCompletionMonth || "",
          expectedCompletionYear:
            projectData.expectedCompletionYear || dayjs().year().toString(),
          enforcementStatusId: projectData.enforcementStatusId || null,
          enforcementStatusName: projectData.enforcementStatusName || "",
          proposalTypeId: projectData.proposalTypeId || null,
          proposalTypeName: projectData.proposalTypeName || "",
          methodTypeId: projectData.methodTypeId || null,
          methodTypeName: projectData.methodTypeName || "",
          stdTypeId: projectData.stdTypeId || null,
          stdTypeName: projectData.stdTypeName || "",
          productPolicyGroupIds: projectData.productPolicyGroupIds || [],
          productPolicyGroupNames: projectData.productPolicyGroupNames || [],
          productBCGIds: projectData.productBCGIds || [],
          productBCGNames: projectData.productBCGNames || [],
          bcgReason: projectData.bcgReason || "",
          productGroupId: projectData.productGroupId || null,
          productGroupName: projectData.productGroupName || "",
          nssSectorId: projectData.nssSectorId || null,
          nssSectorName: projectData.nssSectorName || "",
          nssSubjectId: projectData.nssSubjectId || null,
          nssSubjectName: projectData.nssSubjectName || "",
          isoDeliverableIds: projectData.isoDeliverableIds || [],
          isoDeliverableNames: projectData.isoDeliverableNames || [],
          isoDeliverableOther: projectData.isoDeliverableOther || "",
          isoIcsIds: projectData.isoIcsIds || [],
          isoIcsNames: projectData.isoIcsNames || [],
          tisReprintNos: projectData.tisReprintNos || [],
          tisReprintNames: projectData.tisReprintNames || [],
          committeeId: projectData.committeeId || null,
          committeeName: projectData.committeeName || "",
          subCommitteeId: projectData.subCommitteeId || null,
          subCommitteeName: projectData.subCommitteeName || "",
          sdosId: projectData.sdosId || null,
          sdosName: projectData.sdosName || "",
          remarks: projectData.remarks || "",
          stageCode: projectData.stageCode || "00.00",
          stageUiMsg: projectData.stageUiMsg || "สร้างร่าง",
        });
      } else {
        // Create mode: set defaults
        setFormData({
          id: 0,
          nameThai: "",
          nameEnglish: "",
          startYear: dayjs().year().toString(),
          ownerId: currentUser?.id || null,
          ownerName: currentUser?.name || "",
          ownerGroupId: null,
          ownerGroupName: "",
          writerTypeId: null,
          writerTypeName: "",
          expectedCompletionMonth: "",
          expectedCompletionYear: dayjs().year().toString(),
          enforcementStatusId: null,
          enforcementStatusName: "",
          proposalTypeId: null,
          proposalTypeName: "",
          methodTypeId: null,
          methodTypeName: "",
          stdTypeId: null,
          stdTypeName: "",
          productPolicyGroupIds: [],
          productPolicyGroupNames: [],
          productBCGIds: [],
          productBCGNames: [],
          bcgReason: "",
          productGroupId: null,
          productGroupName: "",
          nssSectorId: null,
          nssSectorName: "",
          nssSubjectId: null,
          nssSubjectName: "",
          isoDeliverableIds: [],
          isoDeliverableNames: [],
          isoDeliverableOther: "",
          isoIcsIds: [],
          isoIcsNames: [],
          tisReprintNos: [],
          tisReprintNames: [],
          committeeId: null,
          committeeName: "",
          subCommitteeId: null,
          subCommitteeName: "",
          sdosId: null,
          sdosName: "",
          remarks: "",
          stageCode: "00.00",
          stageUiMsg: "สร้างร่าง",
        });
      }
      setErrors({});
    }
  }, [projectData, open, currentUser]);

  // Handle owner selection - auto populate group
  const handleOwnerChange = (owner: MasterData | null) => {
    if (owner) {
      const groupName = subDepartmentList?.find(
        (d) => d.code === (owner.subName)
      )?.name;
      setFormData((prev) => ({
        ...prev,
        ownerId: owner.id as number,
        ownerName: owner.name || "",
        // TODO: Get owner group from API based on owner.id
        ownerGroupName: groupName || "", // Placeholder - should come from API
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        ownerId: null,
        ownerName: "",
        ownerGroupName: "",
      }));
    }
  };

  // Handle committee selection - auto populate name
  const handleCommitteeChange = (committee: Committee | null) => {
    if (committee) {
      setFormData((prev) => ({
        ...prev,
        committeeId: Number(committee.id) || null,
        committeeName: committee.committeeNameTh || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        committeeId: null,
        committeeName: "",
      }));
    }
  };

  // Handle sub-committee selection - auto populate name
  const handleSubCommitteeChange = (subCommittee: Committee | null) => {
    if (subCommittee) {
      setFormData((prev) => ({
        ...prev,
        subCommitteeId: Number(subCommittee.id) || null,
        subCommitteeName: subCommittee.committeeNameTh || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        subCommitteeId: null,
        subCommitteeName: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Page 1 validations
    if (!formData.nameThai.trim()) newErrors.nameThai = "กรุณากรอกชื่อภาษาไทย";
    if (!formData.startYear) newErrors.startYear = "กรุณาเลือกปีที่เริ่มโปรเจค";
    if (!formData.ownerId) newErrors.ownerId = "กรุณาเลือกชื่อเจ้าหน้าที่";
    if (!formData.writerTypeId)
      newErrors.writerTypeId = "กรุณาเลือกประเภทผู้จัดทำ";
    if (!formData.expectedCompletionMonth)
      newErrors.expectedCompletionMonth = "กรุณาเลือกเดือนที่คาดว่าจะทำเสร็จ";
    if (!formData.enforcementStatusId)
      newErrors.enforcementStatusId = "กรุณาเลือกสถานะเกี่ยวกับการบังคับ";
    if (!formData.proposalTypeId)
      newErrors.proposalTypeId = "กรุณาเลือกประเภทของ proposal";
    if (!formData.methodTypeId) newErrors.methodTypeId = "กรุณาเลือกวิธีจัดทำ";

    // Page 2 validations
    if (!formData.stdTypeId) newErrors.stdTypeId = "กรุณาเลือกชนิดของ มอก.";
    if (formData.productPolicyGroupIds.length === 0)
      newErrors.productPolicyGroupIds = "กรุณาเลือกกลุ่มผลิตภัณฑ์นโยบาย";
    if (formData.productBCGIds.length === 0)
      newErrors.productBCGIds = "กรุณาเลือกประเภท BCG";

    // Page 3 validations based on writer type
    if (formData.writerTypeId) {
      const writerType = writerTypes.find(
        (wt) => wt.id === formData.writerTypeId
      );
      if (writerType?.name === "กว." && !formData.committeeId) {
        newErrors.committeeId = "กรุณาเลือกกว. คณะที่";
      }
      if (
        writerType?.name === "อนุกว." &&
        (!formData.committeeId || !formData.subCommitteeId)
      ) {
        if (!formData.committeeId)
          newErrors.committeeId = "กรุณาเลือกกว. คณะที่";
        if (!formData.subCommitteeId)
          newErrors.subCommitteeId = "กรุณาเลือกอนุ กว. คณะที่";
      }
      if (
        ["SDOs ขึ้นต้น", "SDOs ขึ้นสูง", "โครงการ", "MOU", "อื่นๆ"].includes(
          writerType?.name || ""
        ) &&
        !formData.sdosId
      ) {
        newErrors.sdosId = "กรุณาเลือกชื่อ SDOS";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      const isEdit = !!formData.id;

      const confirm = await showConfirm(
        isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการเพิ่ม",
        isEdit
          ? "คุณต้องการอัปเดตข้อมูลโครงการนี้หรือไม่?"
          : "คุณต้องการเพิ่มข้อมูลโครงการนี้หรือไม่?"
      );
      if (!confirm.isConfirmed) return;

      // Convert null to undefined for number fields
      const projectToSave: Partial<Project> = {
        id: formData.id || undefined,
        nameThai: formData.nameThai,
        nameEnglish: formData.nameEnglish,
        startYear: formData.startYear,
        ownerId: formData.ownerId || undefined,
        ownerName: formData.ownerName,
        ownerGroupId: formData.ownerGroupId || undefined,
        ownerGroupName: formData.ownerGroupName,
        writerTypeId: formData.writerTypeId || undefined,
        writerTypeName: formData.writerTypeName,
        expectedCompletionMonth: formData.expectedCompletionMonth,
        expectedCompletionYear: formData.expectedCompletionYear,
        enforcementStatusId: formData.enforcementStatusId || undefined,
        enforcementStatusName: formData.enforcementStatusName,
        proposalTypeId: formData.proposalTypeId || undefined,
        proposalTypeName: formData.proposalTypeName,
        methodTypeId: formData.methodTypeId || undefined,
        methodTypeName: formData.methodTypeName,
        stdTypeId: formData.stdTypeId || undefined,
        stdTypeName: formData.stdTypeName,
        productPolicyGroupIds: formData.productPolicyGroupIds,
        productPolicyGroupNames: formData.productPolicyGroupNames,
        productBCGIds: formData.productBCGIds,
        productBCGNames: formData.productBCGNames,
        bcgReason: formData.bcgReason,
        productGroupId: formData.productGroupId || undefined,
        productGroupName: formData.productGroupName,
        nssSectorId: formData.nssSectorId || undefined,
        nssSectorName: formData.nssSectorName,
        nssSubjectId: formData.nssSubjectId || undefined,
        nssSubjectName: formData.nssSubjectName,
        isoDeliverableIds: formData.isoDeliverableIds || [],
        isoDeliverableNames: formData.isoDeliverableNames || [],
        isoDeliverableOther: formData.isoDeliverableOther,
        isoIcsIds: formData.isoIcsIds || [],
        isoIcsNames: formData.isoIcsNames || [],
        tisReprintNos: formData.tisReprintNos || [],
        tisReprintNames: formData.tisReprintNames || [],
        committeeId: formData.committeeId || undefined,
        committeeName: formData.committeeName,
        subCommitteeId: formData.subCommitteeId || undefined,
        subCommitteeName: formData.subCommitteeName,
        sdosId: formData.sdosId || undefined,
        sdosName: formData.sdosName,
        remarks: formData.remarks,
        stageCode: formData.stageCode || "00.00", // ตั้งสถานะเป็น "ร่าง" เมื่อสร้างใหม่
        stageUiMsg: stageCodeList?.find((s) => s.code === (formData.stageCode || "00.00"))?.name || "สร้างร่าง",
        createdBy: currentUser?.id || undefined,
      };
      onSave(projectToSave);
      onClose();
    } else {
      showWarning("กรุณาตรวจสอบข้อมูล", "กรุณาตรวจสอบข้อมูลให้ครบถ้วน");
      return;
    }
  };

  const handleSendApprove1 = async () => {
    if (!formData?.id) {
      showWarning(
        "กรุณาบันทึกข้อมูลก่อน",
        "กรุณากดบันทึกข้อมูลโครงการให้เรียบร้อยก่อนส่งข้อมูล"
      );
      return;
    }

    const confirm = await showConfirm("ยืนยันการส่งข้อมูล", "คุณต้องการส่งข้อมูลโครงการนี้หรือไม่?");
    if (!confirm.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      const startDateStr = dayjs().format("YYYY-MM-DD");

      // กำหนด stage codes และ logs ตามการตัดสินใจ
      let newStageCode = "";
      let newStageUiMsg = "";
      const logsToCreate: Array<{
        stageCode: string;
        stageDescription: string;
        stageDate: string;
      }> = [];


      newStageCode = "00.20"
      newStageUiMsg = stageCodeList?.find((s) => s.code === (newStageCode || "00.20"))?.name || "ผก.อนุมัติ Proposal"
      logsToCreate.push(
        {
          stageCode: newStageCode,
          stageDescription:
            stageCodeList?.find((stage) => stage.code === newStageCode)?.name ||
            "",
          stageDate: startDateStr,
        },
      )

      const updatedProject: Partial<Project> = {
        id: formData?.id || 0,
        stageCode: newStageCode,
        stageUiMsg: newStageUiMsg,
      };

      await updateProjectStage(updatedProject);



      for (const log of logsToCreate) {
        try {
          await upsertProjectLog(projectData?.id || 0, {
            projectId: formData?.id || 0,
            stageCode: log.stageCode,
            stageDescription: log.stageDescription,
            stageDate: log.stageDate,
            stageStatus: "Finished",
          });
        } catch (err: any) {
          console.error(`Error creating log for stage ${log.stageCode}:`, err);
          // Continue with other logs even if one fails
        }
      }



      showSuccess("สำเร็จ", "ได้ส่งข้อมูลโครงการเรียบร้อยแล้ว");
      onClose();
    } catch (err: any) {
      console.error("Error sending approve1:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถส่งข้อมูลได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleClose = () => {
    setFormData({
      id: 0,
      nameThai: "",
      nameEnglish: "",
      startYear: dayjs().year().toString(),
      ownerId: null,
      ownerName: "",
      ownerGroupId: null,
      ownerGroupName: "",
      writerTypeId: null,
      writerTypeName: "",
      expectedCompletionMonth: "",
      expectedCompletionYear: dayjs().year().toString(),
      enforcementStatusId: null,
      enforcementStatusName: "",
      proposalTypeId: null,
      proposalTypeName: "",
      methodTypeId: null,
      methodTypeName: "",
      stdTypeId: null,
      stdTypeName: "",
      productPolicyGroupIds: [],
      productPolicyGroupNames: [],
      productBCGIds: [],
      productBCGNames: [],
      bcgReason: "",
      productGroupId: null,
      productGroupName: "",
      nssSectorId: null,
      nssSectorName: "",
      nssSubjectId: null,
      nssSubjectName: "",
      isoDeliverableIds: [],
      isoDeliverableNames: [],
      isoDeliverableOther: "",
      isoIcsIds: [],
      isoIcsNames: [],
      tisReprintNos: [],
      tisReprintNames: [],
      committeeId: null,
      committeeName: "",
      subCommitteeId: null,
      subCommitteeName: "",
      sdosId: null,
      sdosName: "",
      remarks: "",
      stageCode: "00.00",
      stageUiMsg: "สร้างร่าง",
    });
    setErrors({});
    onClose();
  };

  // Get selected values for Autocomplete
  const getSelectedOwner = () => {
    return standardizationUsers.find((u) => u.id === formData.ownerId) || null;
  };

  const getSelectedWriterType = () => {
    return writerTypes.find((wt) => wt.id === formData.writerTypeId) || null;
  };

  const getSelectedStdType = () => {
    return stdTypes.find((st) => st.id === formData.stdTypeId) || null;
  };

  const getSelectedEnforcementStatus = () => {
    return (
      regulations.find((r) => r.id === formData.enforcementStatusId) || null
    );
  };

  const getSelectedProposalType = () => {
    return regulations.find((r) => r.id === formData.proposalTypeId) || null;
  };

  const getSelectedMethodType = () => {
    return methodTypes.find((mt) => mt.id === formData.methodTypeId) || null;
  };

  const getSelectedProductPolicyGroups = () => {
    return productPolicyGroups.filter((ppg) =>
      formData.productPolicyGroupIds.includes(ppg.id as number)
    );
  };

  const getSelectedProductBCGs = () => {
    return productBCGs.filter((pbcg) =>
      formData.productBCGIds.includes(pbcg.id as number)
    );
  };

  const getSelectedProductGroup = () => {
    return (
      tisProductGroups.find((pg) => pg.id === formData.productGroupId) || null
    );
  };

  const getSelectedNSSSector = () => {
    return nssSectors.find((ns) => ns.id === formData.nssSectorId) || null;
  };

  const getSelectedNSSSubject = () => {
    return nssSubjects.find((ns) => ns.id === formData.nssSubjectId) || null;
  };

  // const getSelectedISODeliverable = () => {
  //   return (
  //     isoDeliverables.find((id) => id.id === formData.isoDeliverableId) || null
  //   );
  // };

  const getSelectedISODeliverable = useMemo(() => {
    if (
      !isoDeliverables.length ||
      !formData.isoDeliverableIds ||
      formData.isoDeliverableIds.length === 0
    ) {
      return [];
    }
    return isoDeliverables.filter((adopt) =>
      formData.isoDeliverableIds.includes(adopt.code || "")
    );
  }, [isoDeliverables, formData.isoDeliverableIds]);

  const getSelectedISOICS = useMemo(() => {
    if (
      !isoICS.length ||
      !formData.isoIcsIds ||
      formData.isoIcsIds.length === 0
    ) {
      return [];
    }
    return isoICS.filter((ics) =>
      formData.isoIcsIds.includes(ics.code || "")
    );
  }, [isoICS, formData.isoIcsIds]);

  // const getSelectedTISNumber = () => {
  //   return tisNumbers.find((tn) => tn.name === formData.tisReprintNo) || null;
  // };

  const getSelectedTISNumber = useMemo(() => {
    if (
      !tisNumbers.length ||
      !formData.tisReprintNos ||
      formData.tisReprintNos.length === 0
    ) {
      return [];
    }
    return tisNumbers.filter((adopt) =>
      formData.tisReprintNos.includes(adopt.id || 0)
    );
  }, [tisNumbers, formData.tisReprintNos]);

  const getSelectedCommittee = () => {
    return (
      expertCommittees.find((ec) => ec.id === formData.committeeId) || null
    );
  };

  const getSelectedSubCommittee = () => {
    return (
      expertCommittees.find((ec) => ec.id === formData.subCommitteeId) || null
    );
  };

  const getSelectedSDOS = () => {
    return sdos.find((s) => s.id === formData.sdosId) || null;
  };

  // Month options
  const monthOptions = [
    { value: "01", label: "มกราคม" },
    { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" },
    { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" },
    { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" },
    { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = dayjs().year() + i - 1;
    return { value: year.toString(), label: year.toString() };
  });

  return (
    <Dialog
      open={open}
      maxWidth="lg"
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
        <AssignmentIcon sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {mode === "create" ? "เพิ่มโครงการใหม่" : "แก้ไขโครงการ"}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            กรอกข้อมูลโครงการตามแบบฟอร์มด้านล่าง
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: "#fff",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        <Box sx={{ p: 4, maxHeight: "calc(90vh - 200px)", overflow: "auto" }}>
          {/* Page 1: ข้อมูลพื้นฐาน */}
          <FormContainer
            title="ข้อมูลพื้นฐาน"
            subtitle="ข้อมูลหลักของโครงการ"
            badge="Required"
            badgeColor="error"
          >
            <Grid container spacing={3}>
              {/* ชื่อภาษาไทย */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="ชื่อภาษาไทย *"
                  value={formData.nameThai}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nameThai: filterThaiOnly(e.target.value),
                    }))
                  }
                  error={!!errors.nameThai}
                  helperText={errors.nameThai || "กรอกได้เฉพาะอักษรไทยและช่องว่าง"}
                  placeholder="ชื่อภาษาไทย"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AssignmentIcon
                            sx={{ mr: 1, color: "action.active" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* ชื่อภาษาอังกฤษ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="ชื่อภาษาอังกฤษ"
                  value={formData.nameEnglish}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nameEnglish: filterEnglishOnly(e.target.value),
                    }))
                  }
                  helperText="กรอกได้เฉพาะอักษรภาษาอังกฤษ ตัวเลข และสัญลักษณ์ . , - ' ( ) / &"
                  placeholder="ชื่อภาษาอังกฤษ"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AssignmentIcon
                            sx={{ mr: 1, color: "action.active" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* ปีที่เริ่มโปรเจค */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={yearOptions}
                  getOptionLabel={(option) => option.label}
                  value={
                    yearOptions.find((y) => y.value === formData.startYear) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      startYear: newValue?.value || "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ปีที่เริ่มโปรเจค *"
                        error={!!errors.startYear}
                        helperText={errors.startYear}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarTodayIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* ชื่อเจ้าหน้าที่ (Searchable) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={standardizationUsers}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedOwner()}
                  onChange={(_, newValue) => handleOwnerChange(newValue)}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ชื่อเจ้าหน้าที่ *"
                        error={!!errors.ownerId}
                        helperText={errors.ownerId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon sx={{ color: "action.active" }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <Box component="li" key={key} {...otherProps}>
                        {option.name}
                      </Box>
                    );
                  }}
                />
              </Grid>

              {/* กลุ่มของเจ้าหน้าที่ (Readonly) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="กลุ่มของเจ้าหน้าที่"
                  value={formData.ownerGroupName}
                  slotProps={{
                    input: {
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <GroupIcon sx={{ mr: 1, color: "action.active" }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  placeholder="จะแสดงอัตโนมัติเมื่อเลือกเจ้าหน้าที่"
                />
              </Grid>

              {/* ประเภทผู้จัดทำ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={writerTypes}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedWriterType()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      writerTypeId: newValue?.id as number | null,
                      writerTypeName: newValue?.name || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      writerTypeId: "",
                      writerTypeName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ประเภทผู้จัดทำ *"
                        error={!!errors.writerTypeId}
                        helperText={errors.writerTypeId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* เดือนที่คาดว่าจะทำเสร็จ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={monthOptions}
                  getOptionLabel={(option) => option.label}
                  value={
                    monthOptions.find(
                      (m) => m.value === formData.expectedCompletionMonth
                    ) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      expectedCompletionMonth: newValue?.value || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      expectedCompletionMonth: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="เดือนที่คาดว่าจะทำเสร็จ *"
                        error={!!errors.expectedCompletionMonth}
                        helperText={errors.expectedCompletionMonth}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarTodayIcon
                                  sx={{ color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* ปีที่คาดว่าจะทำเสร็จ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={yearOptions}
                  getOptionLabel={(option) => option.label}
                  value={
                    yearOptions.find((y) => y.value === formData.expectedCompletionYear) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      expectedCompletionYear: newValue?.value || "",
                    }));
                    setErrors({
                      ...errors,
                      expectedCompletionYear: "",
                    });
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ปีที่คาดว่าจะทำเสร็จ"
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CalendarTodayIcon
                                  sx={{ color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* สถานะเกี่ยวกับการบังคับ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={regulations}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedEnforcementStatus()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      enforcementStatusId: newValue?.id as number | null,
                      enforcementStatusName: newValue?.name || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      enforcementStatusId: "",
                      enforcementStatusName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="สถานะเกี่ยวกับการบังคับ *"
                        error={!!errors.enforcementStatusId}
                        helperText={errors.enforcementStatusId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <PolicyIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* ประเภทของ proposal */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={regulations}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedProposalType()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      proposalTypeId: newValue?.id as number | null,
                      proposalTypeName: newValue?.name || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      proposalTypeId: "",
                      proposalTypeName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ประเภทของ proposal *"
                        error={!!errors.proposalTypeId}
                        helperText={errors.proposalTypeId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <DescriptionIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* วิธีจัดทำ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={methodTypes}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedMethodType()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      methodTypeId: newValue?.id as number | null,
                      methodTypeName: newValue?.name || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      methodTypeId: "",
                      methodTypeName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="วิธีจัดทำ *"
                        error={!!errors.methodTypeId}
                        helperText={errors.methodTypeId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <ScienceIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>
            </Grid>
          </FormContainer>

          {/* Page 2: ข้อมูลเพิ่มเติม */}
          <FormContainer
            title="ข้อมูลเพิ่มเติม"
            subtitle="ข้อมูลรายละเอียดของโครงการ"
            badge="Required"
            badgeColor="primary"
          >
            <Grid container spacing={3}>
              {/* ชนิดของ มอก. */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={stdTypes}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedStdType()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      stdTypeId: newValue?.id as number | null,
                      stdTypeName: newValue?.name || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      stdTypeId: "",
                      stdTypeName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ชนิดของ มอก. *"
                        error={!!errors.stdTypeId}
                        helperText={errors.stdTypeId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CategoryIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* กลุ่มผลิตภัณฑ์นโยบาย (Multi-select) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  options={productPolicyGroups}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedProductPolicyGroups()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      productPolicyGroupIds: newValue.map(
                        (v) => v.id as number
                      ),
                      productPolicyGroupNames: newValue.map(
                        (v) => v.name || ""
                      ),
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      productPolicyGroupIds: "",
                      productPolicyGroupNames: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="กลุ่มผลิตภัณฑ์นโยบาย *"
                        error={!!errors.productPolicyGroupIds}
                        helperText={errors.productPolicyGroupIds}
                        slotProps={{
                          input: {
                            ...InputProps,
                          },
                        }}
                      />
                    );
                  }}
                  slotProps={{
                    chip: {
                      size: "small" as const,
                    },
                  }}
                />
              </Grid>

              {/* ประเภท BCG (Multi-select) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  options={productBCGs}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedProductBCGs()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      productBCGIds: newValue.map((v) => v.id as number),
                      productBCGNames: newValue.map((v) => v.name || ""),
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      productBCGIds: "",
                      productBCGNames: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ประเภท BCG *"
                        error={!!errors.productBCGIds}
                        helperText={errors.productBCGIds}
                        slotProps={{
                          input: {
                            ...InputProps,

                          },
                        }}
                      />
                    );
                  }}
                  slotProps={{
                    chip: {
                      size: "small" as const,
                    },
                  }}
                />
              </Grid>

              {/* เหตุผลของ BCG */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="เหตุผลของ BCG"
                  value={formData.bcgReason}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bcgReason: e.target.value,
                    }))
                  }
                  multiline
                  rows={3}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon
                            sx={{ mr: 1, color: "action.active" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* กลุ่มผลิตภัณฑ์ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={tisProductGroups}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedProductGroup()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      productGroupId: newValue?.id as number | null,
                      productGroupName: newValue?.name || "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      productGroupId: "",
                      productGroupName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="กลุ่มผลิตภัณฑ์"
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CategoryIcon sx={{ color: "action.active" }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* กลุ่มผลิตภัณฑ์ NSS Secter */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={nssSectors}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedNSSSector()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      nssSectorId: newValue?.id as number | null,
                      nssSectorName: newValue?.name || "",
                      nssSubjectId: null, // Reset subject when sector changes
                      nssSubjectName: "",
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      nssSectorId: "",
                      nssSectorName: "",
                      nssSubjectId: "",
                      nssSubjectName: "",
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="กลุ่มผลิตภัณฑ์ NSS Secter"
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CategoryIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* กลุ่มผลิตภัณฑ์ NSS Secter (กลุ่มย่อย) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={nssSubjects}
                  getOptionLabel={(option) => option.name || ""}
                  value={getSelectedNSSSubject()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      nssSubjectId: newValue?.id as number | null,
                      nssSubjectName: newValue?.name || "",
                    }));
                  }}
                  disabled={!formData.nssSectorId}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="กลุ่มผลิตภัณฑ์ NSS Secter (กลุ่มย่อย)"
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <CategoryIcon
                                  sx={{ mr: 1, color: "action.active" }}
                                />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* มาตรฐานที่นำมา Adopt */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  options={isoDeliverables}
                  getOptionLabel={(option) => option.name || ""}
                  getOptionKey={(option) => option.id || option.name || ""}
                  isOptionEqualToValue={(option, value) => {
                    if (!option?.id || !value?.id) return false;
                    return Number(option.id) === Number(value.id);
                  }}
                  value={getSelectedISODeliverable}
                  loading={isoDeliverablesLoading}
                  onOpen={() => {
                    if (isoDeliverables.length > 100) {
                      setIsoDeliverablesLoading(true);
                      // Simulate loading delay for large datasets
                      setTimeout(() => setIsoDeliverablesLoading(false), 100);
                    }
                  }}

                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      isoDeliverableIds: newValue.map((v) => v.code || ""),
                      isoDeliverableNames: newValue.map((v) => v.name || ""),
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="มาตรฐานที่นำมา Adopt"
                        placeholder="เลือกมาตรฐานที่นำมา Adopt"
                        slotProps={{
                          input: {
                            ...InputProps,
                            endAdornment: (
                              <>
                                {isoDeliverablesLoading ? (
                                  <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps?.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                  slotProps={{
                    chip: {
                      size: "small" as const,
                    },
                  }}
                />

              </Grid>


              {/* มาตรฐานที่นำมา Adopt อื่น ๆ */}
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="มาตรฐานที่นำมา Adopt อื่น ๆ"
                  value={formData.isoDeliverableOther}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isoDeliverableOther: e.target.value,
                    }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon
                            sx={{ mr: 1, color: "action.active" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>

              {/* เลข ICS (Multi-select) */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  multiple
                  options={isoICS}
                  getOptionLabel={(option) => option.code || ""}
                  getOptionKey={(option) => option.id || option.name || ""}
                  isOptionEqualToValue={(option, value) => {
                    if (!option?.id || !value?.id) return false;
                    return Number(option.id) === Number(value.id);
                  }}
                  value={getSelectedISOICS}
                  loading={isoICSLoading}
                  onOpen={() => {
                    if (isoICS.length > 100) {
                      setIsoICSLoading(true);
                      // Simulate loading delay for large datasets
                      setTimeout(() => setIsoICSLoading(false), 100);
                    }
                  }}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      isoIcsIds: newValue.map((v) => v.code || ""),
                      isoIcsNames: newValue.map((v) => v.name || ""),
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="เลข ICS"
                        placeholder="เลือกเลข ICS"
                        slotProps={{
                          input: {
                            ...InputProps,
                            endAdornment: (
                              <>
                                {isoICSLoading ? (
                                  <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps?.endAdornment}
                              </>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                  slotProps={{
                    chip: {
                      size: "small" as const,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </FormContainer>

          {/* Page 3: ข้อมูลเพิ่มเติม */}
          <FormContainer
            title="ข้อมูลเพิ่มเติม"
            subtitle="ข้อมูลเพิ่มเติมสำหรับการส่งข้อมูล"
            badge="Optional"
            badgeColor="info"
          >
            <Grid container spacing={3}>
              {/* มาตรฐานเดิมที่ถูกแทนที่ */}
              <Grid size={{ xs: 12, md: 12 }}>
                <Autocomplete
                  multiple
                  options={tisNumbers}
                  getOptionLabel={(option) => option.name || ""}
                  getOptionKey={(option) => option.id || option.name || ""}
                  isOptionEqualToValue={(option, value) => {
                    if (!option?.id || !value?.id) return false;
                    return Number(option.id) === Number(value.id);
                  }}
                  value={getSelectedTISNumber}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      tisReprintNos: newValue.map((v) => v.id || 0),
                      tisReprintNames: newValue.map((v) => v.name || ""),
                    }));
                  }}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="มาตรฐานเดิมที่ถูกแทนที่"
                        placeholder="เลือกมาตรฐานเดิมที่ถูกแทนที่"
                        slotProps={{
                          input: {
                            ...InputProps,
                          },
                        }}
                      />
                    );
                  }}
                  slotProps={{
                    chip: {
                      size: "small" as const,
                    },
                  }}
                />
              </Grid>

              {/* กว. คณะที่ */}

              <>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={expertCommittees}
                    getOptionLabel={(option) =>
                      `${option.committeeNumber || ""} - ${option.committeeNameTh || ""
                      }`
                    }
                    value={getSelectedCommittee()}
                    onChange={(_, newValue) => handleCommitteeChange(newValue)}
                    disabled={!formData.writerTypeId}
                    renderInput={(params) => {
                      const { InputProps, ...other } = params;
                      return (
                        <TextField
                          {...other}
                          label="กว. คณะที่"
                          error={!!errors.committeeId}
                          helperText={errors.committeeId}
                          slotProps={{
                            input: {
                              ...InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BusinessIcon
                                    sx={{ mr: 1, color: "action.active" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      );
                    }}
                  />
                </Grid>

                {/* ชื่อ กว. (Readonly) */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="ชื่อ กว."
                    value={formData.committeeName}
                    slotProps={{
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon
                              sx={{ mr: 1, color: "action.active" }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                    placeholder="จะแสดงอัตโนมัติเมื่อเลือกกว."
                  />
                </Grid>

                {/* อนุ กว. คณะที่ */}

                <Grid size={{ xs: 12, md: 6 }}>
                  <Autocomplete
                    options={expertCommittees.filter(
                      (c) => c.subCommitteeOf !== null
                    )}
                    getOptionLabel={(option) =>
                      `${option.committeeNumber || ""} - ${option.committeeNameTh || ""
                      }`
                    }
                    value={getSelectedSubCommittee()}
                    onChange={(_, newValue) =>
                      handleSubCommitteeChange(newValue)
                    }
                    disabled={!formData.writerTypeId || !formData.committeeId}
                    renderInput={(params) => {
                      const { InputProps, ...other } = params;
                      return (
                        <TextField
                          {...other}
                          label="อนุ กว. คณะที่"
                          error={!!errors.subCommitteeId}
                          helperText={errors.subCommitteeId}
                          slotProps={{
                            input: {
                              ...InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BusinessIcon
                                    sx={{ mr: 1, color: "action.active" }}
                                  />
                                </InputAdornment>
                              ),
                            },
                          }}
                        />
                      );
                    }}
                  />
                </Grid>

                {/* ชื่อ อนุ กว. (Readonly) */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="ชื่อ อนุ กว."
                    value={formData.subCommitteeName}
                    slotProps={{
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon
                              sx={{ mr: 1, color: "action.active" }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                    placeholder="จะแสดงอัตโนมัติเมื่อเลือกอนุ กว."
                  />
                </Grid>
              </>

              {/* ชื่อ SDOS */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete
                  options={sdos}
                  getOptionLabel={(option) => option.name || ""}
                  getOptionKey={(option) => option.id || option.name || ""}
                  value={getSelectedSDOS()}
                  onChange={(_, newValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      sdosId: newValue?.id as number | null,
                      sdosName: newValue?.name || "",
                    }));
                  }}
                  disabled={!formData.writerTypeId}
                  renderInput={(params) => {
                    const { InputProps, ...other } = params;
                    return (
                      <TextField
                        {...other}
                        label="ชื่อ SDOS"
                        error={!!errors.sdosId}
                        helperText={errors.sdosId}
                        slotProps={{
                          input: {
                            ...InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon sx={{ color: "action.active" }} />
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    );
                  }}
                />
              </Grid>

              {/* หมายเหตุ */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="หมายเหตุ"
                  value={formData.remarks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  multiline
                  rows={3}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon
                            sx={{ mr: 1, color: "action.active" }}
                          />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>
          </FormContainer>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 3, gap: 2, justifyContent: "flex-end" }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
          }}
        >
          ยกเลิก
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            px: 3,
            background: "linear-gradient(135deg,rgb(10, 105, 237) 0%, rgb(10, 105, 237) 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, rgb(10, 105, 237) 0%, rgb(10, 105, 237) 100%)",
            },
          }}
        >
          บันทึกข้อมูล
        </Button>
        {formData?.stageCode === "00.00" && (
          <Button
            variant="outlined"
            onClick={handleSendApprove1}
            disabled={!formData?.id}
            title={
              !formData?.id
                ? "กรุณาบันทึกข้อมูลโครงการก่อน"
                : undefined
            }
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              color: "primary.main",
            }}
          >
            ส่งข้อมูล
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProjectDialog;
