import { useState, useEffect } from "react";
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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  useMediaQuery,
  useTheme,
  Autocomplete,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import GroupIcon from "@mui/icons-material/Group";
import { Committee } from "@models/expert";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {
  fetchAppCommitteeType,
  fetchAppProductGroup,
  fetchAppResponsibleGroup,
  setGlobalLoading,
} from "@store/globalSlice";
import { MasterData } from "@models/global";
import { getExpertCommitteeByNumber, getExpertCommittees } from "@services/expertService";

interface CommitteeDialogProps {
  open: boolean;
  mode: "add" | "view" | "edit";
  committee?: Committee;
  onClose: () => void;
  onSave: (committee: Committee) => void;
}

interface CommitteeErrors {
  committeeNumber?: string;
  committeeNameTh?: string;
  committeeNameEn?: string;
  responsibleGroupId?: string;
  productGroupId?: string;
}

export default function CommitteeDialog({
  open,
  mode,
  committee,
  onClose,
  onSave,
}: CommitteeDialogProps) {
  const [formData, setFormData] = useState<Committee>({
    id: committee?.id || 0,
    committeeType: committee?.committeeType || 0, // Will be set properly in useEffect when committeeTypeList is loaded
    committeeNumber: committee?.committeeNumber || "",
    subCommitteeOf: committee?.subCommitteeOf || "",
    committeeNameTh: committee?.committeeNameTh || "",
    committeeNameEn: committee?.committeeNameEn || "",
    responsibleGroup: committee?.responsibleGroup || "",
    responsibleGroupId: committee?.responsibleGroupId || "",
    productGroupId: committee?.productGroupId || 0,
    productGroup: committee?.productGroup || "",
    iso: committee?.iso || "",
    iec: committee?.iec || "",
    scopeOfWork: committee?.scopeOfWork || "",
    status: committee?.status || "active",
  });
  const { committeeTypeList, responsibleGroupList, productGroupList } =
    useAppSelector((state) => state.global);
  const dispatch = useAppDispatch();

  const [errors, setErrors] = useState<CommitteeErrors>({});
  const [committees, setCommittees] = useState<Committee[]>([]);

  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  const [subCommittees, setSubCommittees] = useState<string>("");

  useEffect(() => {
    if (!committeeTypeList) {
      dispatch(fetchAppCommitteeType());
    }
    if (!responsibleGroupList) {
      dispatch(fetchAppResponsibleGroup());
    }
    if (!productGroupList) {
      dispatch(fetchAppProductGroup());
    }
  }, [dispatch, committeeTypeList, responsibleGroupList, productGroupList]);

  useEffect(() => {
    loadCommittees();
  }, []);

  const loadCommittees = async () => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getExpertCommittees({ committeeType: 1 });
      setCommittees(res.data);
    } catch (err: any) {
      console.error("Error loading directives:", err);
      setErrors(
        err?.response?.data?.message || "ไม่สามารถโหลดข้อมูลคำสั่งแต่งตั้งได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  useEffect(() => {
    if (mode !== "add"&& formData?.committeeType===1 && formData.committeeNumber) {
      handleChangeCommittee(formData.committeeNumber);
    }
  }, [mode, formData.committeeNumber, formData.committeeType]);


  const handleChangeCommittee = async (committeeNumber: string) => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getExpertCommitteeByNumber(committeeNumber);
      setSubCommittees(res);
    } catch (err: any) {
      console.error("Error loading committee:", err);
    }finally {
      dispatch(setGlobalLoading(false));
    }
  };

  useEffect(() => {
    if (committee) {
      setFormData(committee);
    } else {
      // Set default committeeType to first available option or 0
      const defaultCommitteeType =
        committeeTypeList && committeeTypeList.length > 0
          ? committeeTypeList[0].id
          : 0;
      setFormData({
        id: 0,
        committeeType: defaultCommitteeType,
        committeeNumber: "",
        subCommitteeOf: "",
        committeeNameTh: "",
        committeeNameEn: "",
        responsibleGroup: "",
        responsibleGroupId: "",
        productGroupId: 0,
        productGroup: "",
        iso: "",
        iec: "",
        scopeOfWork: "",
        status: "active",
      });
    }
  }, [committee, open, committeeTypeList]);

  const handleChange = (field: keyof Committee, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value as any }));
    // clear field error on change
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = () => {
    const newErrors: CommitteeErrors = {};

    if (
      !formData.committeeNumber ||
      String(formData.committeeNumber).trim() === ""
    ) {
      newErrors.committeeNumber = "กรุณากรอกคณะที่";
    }

    if (!formData.committeeNameTh || formData.committeeNameTh.trim() === "") {
      newErrors.committeeNameTh = "กรุณากรอกชื่อคณะกรรมการภาษาไทย";
    }

    if (!formData.committeeNameEn || formData.committeeNameEn.trim() === "") {
      newErrors.committeeNameEn = "กรุณากรอกชื่อคณะกรรมการภาษาอังกฤษ";
    }
    if (
      !formData.responsibleGroupId ||
      formData.responsibleGroupId.trim() === ""
    ) {
      newErrors.responsibleGroupId = "กรุณากรอกกลุ่มที่รับผิดชอบ";
    }
    if (!formData.productGroupId || formData.productGroupId <= 0) {
      newErrors.productGroupId = "กรุณากรอกกลุ่มผลิตภัณฑ์";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  const isReadOnly = mode === "view";
  const dialogTitle =
    mode === "add"
      ? "เพิ่มคณะผู้เชี่ยวชาญ"
      : mode === "view"
      ? "ดูคณะผู้เชี่ยวชาญ"
      : "แก้ไขคณะผู้เชี่ยวชาญ";

  // Check if subCommitteeOf should be disabled
  // Assuming committeeType 1 is "กรรมการวิชาการ" (Academic Committee)
  const isSubCommitteeOfDisabled =
    formData.committeeType === 1 || !formData.committeeType || isReadOnly;


  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <GroupIcon sx={{ fontSize: 28 }} />
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
          {/* ประเภทคณะผู้เชี่ยวชาญ */}
          <Autocomplete
            options={committeeTypeList || []}
            getOptionLabel={(option) => option.name}
            value={
              committeeTypeList?.find((t) => t.id === formData.committeeType) ||
              null
            }
            onChange={(_, newValue) => {
              handleChange("committeeType", newValue?.id || 0);
              handleChange("committeeTypeName", newValue?.name || "");
            }}
            sx={{ flex: 1, minWidth: 200 }}
            disabled={mode !== "add"}
            size="small"
            title="ประเภทคณะผู้เชี่ยวชาญ"
            renderInput={(params: any) => (
              <TextField {...params} label="ประเภทคณะผู้เชี่ยวชาญ" fullWidth />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* คณะที่ */}
            {isSubCommitteeOfDisabled ? (
              <TextField
                label="คณะที่"
                value={formData.committeeNumber || ""}
                onChange={(e) =>
                  handleChange("committeeNumber", e.target.value)
                }
                disabled={isReadOnly}
                sx={{ flex: 1, minWidth: 200 }}
                size="small"
              />
            ) : (
              <Autocomplete
                options={committees || []}
                getOptionLabel={(option) =>
                  "คณะที่ " +
                  option.committeeNumber +
                  " (" +
                  option.committeeNameTh +
                  ")"
                }
                value={
                  committees?.find(
                    (t) => t.committeeNumber === formData.committeeNumber
                  ) || null
                }
                onChange={(_, newValue) => {
                  handleChange(
                    "committeeNumber",
                    newValue?.committeeNumber || ""
                  );
                }}
                sx={{ flex: 1, minWidth: 200 }}
                size="small"
                title="คณะที่"
                disabled={isReadOnly}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="คณะที่"
                    fullWidth
                    error={!!errors.committeeNumber}
                    helperText={errors.committeeNumber || "กรอกเฉพาะตัวเลข"}
                  />
                )}
              />
            )}

            {/* คณะที่อยู่ภายใต้ */}
            {mode!=="add" && subCommittees.length>0 ? (
              <TextField
                label="คณะที่อยู่ภายใต้"
                value={subCommittees}
                disabled={true}
                sx={{ flex: 1, minWidth: 200 }}
                size="small"
              />
            ):(
            <TextField
              label="คณะที่อยู่ภายใต้"
              value={formData.subCommitteeOf || ""}
              onChange={(e) => {
                const value = e.target.value;
                handleChange("subCommitteeOf", value);
              }}
              disabled={isSubCommitteeOfDisabled}
              helperText="ถ้าเลือกจะถือเป็นประเภทอนุกรรมการวิชาการ"
              sx={{ flex: 1, minWidth: 200 }}
              size="small"
            />
            )}
          </Box>

          {/* ชื่อคณะกรรมการภาษาไทย */}
          <TextField
            fullWidth
            label="ชื่อคณะกรรมการภาษาไทย"
            value={formData.committeeNameTh}
            onChange={(e) => handleChange("committeeNameTh", e.target.value)}
            disabled={isReadOnly}
            required
            multiline
            rows={2}
            size="small"
            error={!!errors.committeeNameTh}
            helperText={errors.committeeNameTh}
          />

          {/* ชื่อคณะกรรมการภาษาอังกฤษ */}
          <TextField
            fullWidth
            label="ชื่อคณะกรรมการภาษาอังกฤษ"
            value={formData.committeeNameEn}
            onChange={(e) => handleChange("committeeNameEn", e.target.value)}
            disabled={isReadOnly}
            required
            multiline
            rows={2}
            size="small"
            error={!!errors.committeeNameEn}
            helperText={errors.committeeNameEn}
          />

          {/* กลุ่มที่รับผิดชอบ */}
          <Autocomplete
            options={responsibleGroupList || []}
            getOptionLabel={(option) => option.name}
            value={
              responsibleGroupList?.find(
                (g) => g.code === formData.responsibleGroupId
              ) || null
            }
            onChange={(_, newValue) => {
              handleChange("responsibleGroupId", newValue?.code || "");
              handleChange("responsibleGroup", newValue?.name || "");
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.code === value.code
            }
            disabled={isReadOnly}
            size="small"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, 4],
                    },
                  },
                ],
                sx: {
                  "& .MuiPaper-root": {
                    transition: "none !important",
                    animation: "none !important",
                  },
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="กลุ่มที่รับผิดชอบ"
                required
                placeholder="เลือกกลุ่มที่รับผิดชอบ"
                error={!!errors.responsibleGroupId}
                helperText={errors.responsibleGroupId}
              />
            )}
          />

          {/* กลุ่มผลิตภัณฑ์ */}
          <Autocomplete
            options={productGroupList || []}
            getOptionLabel={(option) => option.name}
            value={
              productGroupList?.find((g) => g.id === formData.productGroupId) ||
              null
            }
            onChange={(_, newValue) => {
              handleChange("productGroupId", newValue?.id || 0);
              handleChange("productGroup", newValue?.name || "");
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            disabled={isReadOnly}
            size="small"
            slotProps={{
              popper: {
                modifiers: [
                  {
                    name: "offset",
                    options: {
                      offset: [0, 4],
                    },
                  },
                ],
                sx: {
                  "& .MuiPaper-root": {
                    transition: "none !important",
                    animation: "none !important",
                  },
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="กลุ่มผลิตภัณฑ์"
                required
                placeholder="เลือกกลุ่มผลิตภัณฑ์"
                error={!!errors.productGroupId}
                helperText={errors.productGroupId}
              />
            )}
          />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {/* ISO */}
            <TextField
              label="ISO"
              value={formData.iso}
              onChange={(e) => handleChange("iso", e.target.value)}
              disabled={isReadOnly}
              sx={{ flex: 1, minWidth: 200 }}
              size="small"
              placeholder="กรอก ISO"
            />

            {/* IEC */}
            <TextField
              label="IEC"
              value={formData.iec}
              onChange={(e) => handleChange("iec", e.target.value)}
              disabled={isReadOnly}
              sx={{ flex: 1, minWidth: 200 }}
              size="small"
              placeholder="กรอก IEC"
            />
          </Box>

          {/* ขอบเขตงาน */}
          <TextField
            fullWidth
            label="ขอบเขตงาน"
            value={formData.scopeOfWork || ""}
            onChange={(e) => handleChange("scopeOfWork", e.target.value)}
            disabled={isReadOnly}
            multiline
            rows={4}
            size="small"
            placeholder="กรอกรายละเอียดขอบเขตงาน"
          />

          {/* สถานะ - Show only in view/edit mode */}
          {(mode === "view" || mode === "edit") && (
            <FormControl component="fieldset">
              <FormLabel component="legend">สถานะ</FormLabel>
              <RadioGroup
                row
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
              >
                <FormControlLabel
                  value="active"
                  control={<Radio />}
                  label="Active"
                  disabled={isReadOnly}
                />
                <FormControlLabel
                  value="suspended"
                  control={<Radio />}
                  label="Suspended"
                  disabled={isReadOnly}
                />
                <FormControlLabel
                  value="inactive"
                  control={<Radio />}
                  label="Inactive"
                  disabled={isReadOnly}
                />
              </RadioGroup>
            </FormControl>
          )}
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
