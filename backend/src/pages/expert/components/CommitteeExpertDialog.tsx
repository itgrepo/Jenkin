import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
} from "@mui/material";
import { Close, Upload } from "@mui/icons-material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {
  fetchAppGroupPosition,
  fetchAppExpertMemberType,
  fetchAppOrganizations,
  setGlobalLoading,
  fetchAppCommitteeType,
} from "@store/globalSlice";
import { getDirectives, getExperts } from "@services/expertService";
import { showConfirm, showError } from "@components/Swal";
import { MasterData } from "@models/global";
import { Committee, Directive, Expert, ExpertGroupMember } from "@models/expert";
import { uploadFileServer } from "@utils/fileService";



interface CommitteeExpertDialogProps {
  open: boolean;
  mode: "add" | "view" | "edit";
  expertGroupMember?: ExpertGroupMember;
  committee?: Committee; // "กรรมการวิชาการ" or "อนุกรรมการวิชาการ"
  directive?: Directive; // ถ้ามาจากหน้า 7 (AppointmentManagementPage)
  onClose: () => void;
  onSave: (expert: ExpertGroupMember) => void;
}

export default function CommitteeExpertDialog({
  open,
  mode,
  expertGroupMember,
  committee,
  directive,
  onClose,
  onSave,
}: CommitteeExpertDialogProps) {
  const [formData, setFormData] = useState<ExpertGroupMember>({
    committeeId: expertGroupMember?.committeeId|| committee?.id || 0,
    expertId: expertGroupMember?.expertId || 0,
    expertName: expertGroupMember?.expertName || "",
    idCard: expertGroupMember?.idCard || "",
    positionId: expertGroupMember?.positionId || 0,
    directiveId: expertGroupMember?.directiveId || directive?.id || undefined,
    organizationId: expertGroupMember?.organizationId || undefined,
    memberTypeId: expertGroupMember?.memberTypeId || undefined,
    representativeOrder: expertGroupMember?.representativeOrder || undefined,
    isSecretary: expertGroupMember?.isSecretary || false,
    isAssistantSecretary: expertGroupMember?.isAssistantSecretary || false,
    status: expertGroupMember?.status || "active",
    assignmentFile: expertGroupMember?.assignmentFile || "",
    remarks: expertGroupMember?.remarks || "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExpertGroupMember, string>>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [directives, setDirectives] = useState<MasterData[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const { committeeTypeList } = useAppSelector((state) => state.global);

  
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();


  const {
    groupPositionList,
    expertMemberTypeList,
    organizationList,
  } = useAppSelector((state) => state.global);

  useEffect(() => {
    if (!committeeTypeList) {
      dispatch(fetchAppCommitteeType());
    }
  }, [dispatch, committeeTypeList]);

  // Load master data
  useEffect(() => {
    if (!groupPositionList) {
      dispatch(fetchAppGroupPosition());
    }
    if (!expertMemberTypeList) {
      dispatch(fetchAppExpertMemberType());
    }
    if (!organizationList) {
      dispatch(fetchAppOrganizations());
    }
  }, [dispatch, groupPositionList, expertMemberTypeList, organizationList]);


  // Load directives for appointment order selection
  useEffect(() => {
    if (open && !directive?.id) {
      loadDirectives();
    }
  }, [open, directive?.id]);

  const loadDirectives = async () => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getDirectives();
      const directiveOptions: MasterData[] = res.data.map((d) => ({
        id: d.id || 0,
        name: d.orderNumber,
      }));
      setDirectives(directiveOptions);
    } catch (err: any) {
      console.error("Error loading directives:", err);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  useEffect(() => {
    loadExpert();
  }, [open]);
  const loadExpert = async () => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getExperts({});
      setExperts(res?.data);
    } catch (err: any) {
      console.error("Error loading experts:", err);
      setErrors({ expertName: err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลผู้เชี่ยวชาญได้" });
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };
  

  useEffect(() => {
    if (expertGroupMember) {
      setFormData(expertGroupMember);
    } else {
      setFormData({
        committeeId: committee?.id || 0,
        expertId: 0,
        expertName: "",
        idCard: "",
        positionId: 0,
        directiveId: directive?.id || undefined,
        organizationId: undefined,
        memberTypeId: undefined,
        representativeOrder: undefined,
        isSecretary: false,
        isAssistantSecretary: false,
        status: "active",
        assignmentFile: "",
        remarks: "",
      });
      setSelectedFile(null);
    }
    setErrors({});
  }, [expertGroupMember, open, directive?.id]);

  const handleChange = (field: keyof ExpertGroupMember, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFormData((prev) => ({ ...prev, assignmentFile: file.name }));
    }
  };

  // Check if expert has been appointed for 2 consecutive terms
  const checkConsecutiveTerms = async (): Promise<boolean> => {
    // TODO: Implement API call to check consecutive terms
    // For now, return false (no consecutive terms)
    return false;
  };

  const handleSave = async () => {
    // Validation
    const newErrors: Partial<Record<keyof ExpertGroupMember, string>> = {};

    if (!formData.expertId) {
      newErrors.expertId = "กรุณาเลือกผู้เชี่ยวชาญ";
    }
    if (!formData.idCard?.trim()) {
      newErrors.idCard = "กรุณากรอกเลขบัตรประชาชน 13 หลัก";
    }
    if (!formData.directiveId) {
      newErrors.directiveId = "กรุณาเลือกคำสั่งแต่งตั้ง";
    }
    if (!formData.positionId) {
      newErrors.positionId = "กรุณาเลือกตำแหน่ง";
    }

    // If sub-committee, validate member type and representative order
    const isSubCommittee = committeeTypeList?.find((t) => t.id === committee?.committeeType)?.name.toLowerCase().includes("อนุกรรมการ");
    if (isSubCommittee) {
      if (!formData.memberTypeId) {
        newErrors.memberTypeId = "กรุณาเลือกประเภท";
      }
      const memberTypeName = expertMemberTypeList?.find(t => t.id === formData.memberTypeId)?.name;
      if (memberTypeName === "ผู้แทน" && !formData.representativeOrder) {
        newErrors.representativeOrder = "กรุณาเลือกลำดับผู้แทน";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check consecutive terms
    const hasConsecutiveTerms = await checkConsecutiveTerms();
    if (hasConsecutiveTerms) {
      const result = await showConfirm(
        "คำเตือน",
        "ผู้เชี่ยวชาญนี้ได้รับการแต่งตั้งติดต่อกัน 2 วาระแล้ว คุณต้องการดำเนินการต่อหรือไม่?"
      );
      if (!result.isConfirmed) {
        return;
      }
    }

    const isEdit = !!expertGroupMember?.id;

    const confirm = await showConfirm(
      isEdit ? "ยืนยันการอัปเดต" : "ยืนยันการเพิ่ม",
      isEdit
        ? "คุณต้องการอัปเดตผู้เชี่ยวชาญนี้หรือไม่?"
        : "คุณต้องการเพิ่มผู้เชี่ยวชาญนี้หรือไม่?"
    );
    if (!confirm.isConfirmed) return;

    try {
      dispatch(setGlobalLoading(true));

      let assignmentFilePath = formData.assignmentFile || "";

      // ถ้ามีไฟล์ใหม่ ให้ upload ไป MinIO
      if (selectedFile) {
        try {
          const filename = await uploadFileServer({
            file: selectedFile,
            folder: "expert/assignment",
            oldFile: formData.assignmentFile || "",
          });

          if (!filename) {
            showError(
              "เกิดข้อผิดพลาด",
              "ไม่สามารถอัปโหลดไฟล์มอบหมายได้ กรุณาลองใหม่อีกครั้ง"
            );
            dispatch(setGlobalLoading(false));
            return;
          }

          assignmentFilePath = filename;
        } catch (uploadError: any) {
          console.error("Error uploading assignment file:", uploadError);
          const uploadErrorMessage =
            uploadError?.response?.data?.error ||
            uploadError?.response?.data?.message ||
            uploadError?.message ||
            "ไม่สามารถอัปโหลดไฟล์มอบหมายได้ กรุณาลองใหม่อีกครั้ง";
          showError("เกิดข้อผิดพลาด", uploadErrorMessage);
          dispatch(setGlobalLoading(false));
          return;
        }
      }

      onSave({
        ...formData,
        assignmentFile: assignmentFilePath,
      });
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const isReadOnly = mode === "view";
  const isSubCommittee = committeeTypeList?.find((t) => t.id === committee?.committeeType)?.name.toLowerCase().includes("อนุกรรมการ");
  const isAppointmentOrderReadOnly = !!directive?.id; // readonly if coming from page 7
  const memberTypeName = expertMemberTypeList?.find(t => t.id === formData.memberTypeId)?.name;
  const showRepresentativeOrder =
    isSubCommittee && memberTypeName === "ผู้แทน";

  const dialogTitle =
    mode === "add"
      ? "เพิ่มผู้เชี่ยวชาญ"
      : mode === "view"
      ? "ดูผู้เชี่ยวชาญ"
      : "แก้ไขผู้เชี่ยวชาญ";

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
        <PersonAddIcon sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {dialogTitle}
          </Typography>
        </Box>
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

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 2 }}>
          {/* ชื่อผู้เชี่ยวชาญ, เลขบัตร - Searchable select or input */}
          <Autocomplete
            options={experts||[]} // TODO: Load from expert list API
            getOptionLabel={(option) => option.firstName+" "+option.lastName}
            value={experts.find((e) => e.id === formData.expertId) || null}
            onChange={(_, newValue) => {
              handleChange("expertId", newValue ? newValue.id : undefined);
              handleChange("expertName", newValue ? newValue.firstName+" "+newValue.lastName : "");
              handleChange("idCard", newValue ? newValue.idCard : "");
            }}
            disabled={isReadOnly}
            size="small"
            renderInput={(params) => (
              <TextField
                {...params}
                label="ชื่อผู้เชี่ยวชาญ, เลขบัตร"
                required
                error={!!errors.expertId}
                helperText={errors.expertId || "พิมพ์เพื่อค้นหาและเลือกผู้เชี่ยวชาญจากระบบ"}
                placeholder="ค้นหาโดยพิมพ์ชื่อหรือเลขบัตรประชาชน"
              />
            )}
          />

          {/* เลขบัตรประชาชน */}
          <TextField
            fullWidth
            label="เลขบัตรประชาชน"
            value={formData.idCard}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 13) {
                handleChange("idCard", value);
              }
            }}
            slotProps={{
              input: {
                readOnly: isReadOnly,
              },
              htmlInput: {
                maxLength: 13,
              },
            }}
            size="small"
            required
            error={!!errors.idCard}
            helperText={errors.idCard || "13 หลัก"}
          />

          {/* ตำแหน่ง - Radio or Select from i_master_expert_group_pos */}
          <FormControl required error={!!errors.positionId} size="small">
            <FormLabel>ตำแหน่ง</FormLabel>
            <RadioGroup
              row
              value={formData.positionId || ""}
              onChange={(e) => {
                const posId = parseInt(e.target.value) || 0;
                handleChange("positionId", posId);

                const posName =
                  groupPositionList?.find((p) => p.id === posId)?.name.toLowerCase() ||
                  "";

                const isSecretary = posName.includes("เลขานุการ") && !posName.includes("ผู้ช่วยเลขานุการ");
                const isAssistant = posName.includes("ผู้ช่วยเลขานุการ");

                handleChange("isSecretary", isSecretary);
                handleChange("isAssistantSecretary", isAssistant);
              }}
            >
              {groupPositionList?.map((pos) => (
                <FormControlLabel
                  key={pos.id}
                  value={String(pos.id)}
                  control={<Radio disabled={isReadOnly} />}
                  label={pos.name}
                />
              ))}
            </RadioGroup>
            {errors.positionId && <FormHelperText>{errors.positionId}</FormHelperText>}
          </FormControl>

          {/* คำสั่งเลขที่ - Readonly if from page 7, Select if from page 2 */}
          {isAppointmentOrderReadOnly ? (
            <TextField
              fullWidth
              label="คำสั่งเลขที่"
              value={directive?.orderNumber || ""}
              size="small"
              slotProps={{
                input: { readOnly: true },
              }}
            />
          ) : (
            <Autocomplete
              options={directives}
              getOptionLabel={(option) => option.name}
              value={directives.find((d) => d.id === formData?.directiveId) || null}
              onChange={(_, newValue) => {
                handleChange("directiveId", newValue ? newValue.id : undefined);
              }}
              disabled={isReadOnly}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="คำสั่งเลขที่"
                  required
                  error={!!errors.directiveId}
                  helperText={errors.directiveId}
                />
              )}
            />
          )}

          {/* กรรมการ/อนุกรรมการ - Readonly */}
          <TextField
            fullWidth
            label="กรรมการ/อนุกรรมการ"
            value={committeeTypeList?.find((t) => t.id === committee?.committeeType)?.name || ""}
            size="small"
            slotProps={{
              input: { readOnly: true },
            }}
          />

          {/* หน่วยงาน - Select from i_master_org (optional for sub-committee) */}
          {isSubCommittee && (
            <Autocomplete
              options={organizationList || []}
              getOptionLabel={(option) => option.name}
              value={
                organizationList?.find(
                  (org) => org.id === formData.organizationId
                ) || null
              }
              onChange={(_, newValue) => {
                handleChange("organizationId", newValue ? newValue.id : undefined);
              }}
              disabled={isReadOnly}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="หน่วยงาน"
                  helperText="เลือกได้หรือไม่เลือกก็ได้"
                />
              )}
            />
          )}

          {/* ประเภท - Select from i_master_expert_member_type (required for sub-committee) */}
          {isSubCommittee && (
            <Autocomplete
              options={expertMemberTypeList || []}
              getOptionLabel={(option) => option.name}
              value={
                expertMemberTypeList?.find(
                  (type) => type.id === formData.memberTypeId
                ) || null
              }
              onChange={(_, newValue) => {
                handleChange("memberTypeId", newValue ? newValue.id : undefined);
                // Clear representative order if not "ผู้แทน"
                if (newValue?.name !== "ผู้แทน") {
                  handleChange("representativeOrder", undefined);
                }
              }}
              disabled={isReadOnly}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="ประเภท"
                  required
                  error={!!errors.memberTypeId}
                  helperText={errors.memberTypeId}
                />
              )}
            />
          )}

          {/* ลำดับผู้แทน - Select 1-5 (only for sub-committee and type = "ผู้แทน") */}
          {showRepresentativeOrder && (
            <TextField
              fullWidth
              select
              label="ลำดับผู้แทน"
              value={formData.representativeOrder || ""}
              onChange={(e) => handleChange("representativeOrder", e.target.value ? parseInt(e.target.value) : undefined)}
              disabled={isReadOnly}
              size="small"
              required
              error={!!errors.representativeOrder}
              helperText={errors.representativeOrder || "แสดงเฉพาะเมื่อเป็นอนุกรรมการวิชาการและประเภทเป็นผู้แทน"}
            >
              <MenuItem value="">เลือกลำดับ</MenuItem>
              {[1, 2, 3, 4, 5].map((num) => (
                <MenuItem key={num} value={String(num)}>
                  {num}
                </MenuItem>
              ))}
            </TextField>
          )}

          {/* สถานะ - Radio (Active/Inactive) */}
          <FormControl size="small">
            <FormLabel>สถานะ</FormLabel>
            <RadioGroup
              row
              value={formData.status}
              onChange={(e) =>
                handleChange("status", e.target.value as "active" | "inactive")
              }
            >
              <FormControlLabel
                value="active"
                control={<Radio disabled={isReadOnly} />}
                label="Active"
              />
              <FormControlLabel
                value="inactive"
                control={<Radio disabled={isReadOnly} />}
                label="Inactive"
              />
            </RadioGroup>
          </FormControl>

          {/* ไฟล์มอบหมาย */}
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              ไฟล์มอบหมาย
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                disabled={isReadOnly}
                size="small"
              >
                อัปโหลดไฟล์
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </Button>
              {(selectedFile || formData.assignmentFile) && (
                <Typography variant="body2" color="textSecondary">
                  {selectedFile?.name || formData.assignmentFile}
                </Typography>
              )}
            </Box>
          </Box>

          {/* หมายเหตุ */}
          <TextField
            fullWidth
            label="หมายเหตุ"
            value={formData.remarks}
            onChange={(e) => handleChange("remarks", e.target.value)}
            disabled={isReadOnly}
            multiline
            rows={4}
            size="small"
            placeholder="กรอกหมายเหตุ (ถ้ามี)"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {isReadOnly ? "ปิด" : "ยกเลิก"}
        </Button>
        {!isReadOnly && (
          <Button onClick={handleSave} variant="contained" color="primary">
            บันทึก
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
