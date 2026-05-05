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
  useMediaQuery,
  useTheme,
  Autocomplete,
} from "@mui/material";
import { Upload } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CloseIcon from "@mui/icons-material/Close";
import { Committee, Directive } from "@models/expert";
import { uploadFileServer } from "@utils/fileService";
import { showError } from "@components/Swal";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {
  fetchAppCommitteeType,
  fetchAppDirectiveType,
  setGlobalLoading,
} from "@store/globalSlice";
import {
  getExpertCommitteeBySubNumber,
  getExpertCommittees,
} from "@services/expertService";

interface AppointmentOrderDialogProps {
  open: boolean;
  mode: "add" | "view" | "edit";
  order?: Directive;
  onClose: () => void;
  onSave: (order: Directive) => void;
}

interface DirectiveErrors {
  committeeId?: string;
  orderNumber?: string;
  directiveTypeId?: string;
  signingDate?: string;
  edition?: string;
  amd?: string;
}

export default function AppointmentOrderDialog({
  open,
  mode,
  order,
  onClose,
  onSave,
}: AppointmentOrderDialogProps) {
  const [formData, setFormData] = useState<Directive>({
    id: order?.id || 0,
    orderNumber: order?.orderNumber || "",
    directiveTypeId: order?.directiveTypeId || 1,
    signingDate: dayjs().format("YYYY-MM-DD"),
    edition: order?.edition || "",
    amd: order?.amd || "",
    filePath: order?.filePath || "",
    committeeId: order?.committeeId || 0,
    committeeNumber: order?.committeeNumber || "",
    subCommitteeOf: order?.subCommitteeOf || "",
    endDate: order?.endDate || "",
    meetingRound: order?.meetingRound || "",
    meetingSource: "emeeting",
    meetingRef: order?.meetingRef || "",
    meetingDate: order?.meetingDate || "",
  });

  const { directiveTypeList, committeeTypeList } = useAppSelector(
    (state) => state.global
  );

  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const dispatch = useAppDispatch();
  const [errors, setErrors] = useState<DirectiveErrors>({});
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [subCommittees, setSubCommittees] = useState<string[]>([]);

  useEffect(() => {
    if (!directiveTypeList) {
      dispatch(fetchAppDirectiveType());
    }
    if (!committeeTypeList) {
      dispatch(fetchAppCommitteeType());
    }
  }, [directiveTypeList, committeeTypeList]);

  useEffect(() => {
    loadCommittees();
  }, []);

  useEffect(() => {
    if (formData?.committeeId && formData?.committeeId > 0) {
      handleChangeCommittee(formData?.committeeId);
    }
  }, [formData?.committeeId]);



  const loadCommittees = async () => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getExpertCommittees();
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

  const handleChangeCommittee = async (committeeNumber: number) => {
    try {
      dispatch(setGlobalLoading(true));
      const res = await getExpertCommitteeBySubNumber(committeeNumber);
      setSubCommittees(res);
    } catch (err: any) {
      console.error("Error loading committee:", err);
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  useEffect(() => {
    if (order) {
      const signDate = dayjs(order.signingDate);
      // คำนวณ endDate ถ้ายังไม่มี หรือคำนวณใหม่จาก signingDate
      const calculatedEndDate = order.endDate
        ? order.endDate
        : signDate.add(3, "year").subtract(1, "day").format("YYYY-MM-DD");

      setFormData({
        ...order,
        endDate: calculatedEndDate,
      });
    } else {
      const today = dayjs();
      const defaultEndDate = today
        .add(3, "year")
        .subtract(1, "day")
        .format("YYYY-MM-DD");

      setFormData({
        id: 0,
        orderNumber: "",
        directiveTypeId: 1,
        signingDate: today.format("YYYY-MM-DD"),
        edition: "",
        amd: "",
        filePath: "",
        committeeId: 0,
        subCommitteeOf: "",
        endDate: defaultEndDate,
        meetingRound: "",
        meetingSource: "emeeting",
        meetingRef: "",
        meetingDate: "",
      });

      setSelectedFile(null);
    }
  }, [order, open]);

  const handleChange = (field: keyof Directive, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // clear error of that field if exists in errors map
    setErrors((prev) => ({
      ...prev,
      [field as keyof DirectiveErrors]: undefined,
    }));
  };

  const handleDateChange = (newDate: Dayjs | null) => {
    if (newDate) {
      // วันที่ลงนาม
      const signStr = newDate.format("YYYY-MM-DD");
      // วันที่สิ้นสุดของคำสั่ง = วันที่ลงนาม + 3 ปี - 1 วัน
      const end = newDate.add(3, "year").subtract(1, "day");
      setFormData((prev) => ({
        ...prev,
        signingDate: signStr,
        endDate: end.format("YYYY-MM-DD"),
      }));
      setErrors((prev) => ({ ...prev, signingDate: undefined }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // แสดงชื่อไฟล์ชั่วคราวก่อนอัปโหลดจริง
      setFormData((prev) => ({ ...prev, filePath: file.name }));
    }
  };

  const handleSave = async () => {
    const newErrors: DirectiveErrors = {};

    if (!formData.committeeId || formData.committeeId <= 0) {
      newErrors.committeeId = "กรุณาเลือกคณะ";
    }

    if (!formData.orderNumber || String(formData.orderNumber).trim() === "") {
      newErrors.orderNumber = "กรุณากรอกคำสั่งเลขที่";
    }

    if (!formData.directiveTypeId || formData.directiveTypeId <= 0) {
      newErrors.directiveTypeId = "กรุณาเลือกประเภทคำสั่ง";
    }

    if (!formData.signingDate) {
      newErrors.signingDate = "กรุณาเลือกวันที่ลงนาม";
    }

    if (!formData.edition || String(formData.edition).trim() === "") {
      newErrors.edition = "กรุณากรอก edition คำสั่ง (ใส่ 0 ได้)";
    }

    if (!formData.amd || String(formData.amd).trim() === "") {
      newErrors.amd = "กรุณากรอก amd คำสั่ง (ใส่ 0 ได้)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      let newFilePath = formData.filePath;

      // ถ้ามีไฟล์ที่เลือกใหม่ ให้ upload ไป MinIO
      if (selectedFile) {
        newFilePath = await uploadFileServer({
          file: selectedFile,
          folder: "directives",
          oldFile: formData.filePath || "",
        });
      }

      onSave({
        ...formData,
        filePath: newFilePath,
      });
      // onClose();
    } catch (error: any) {
      showError(
        "เกิดข้อผิดพลาด",
        error?.message || "ไม่สามารถอัปโหลดไฟล์คำสั่งแต่งตั้งได้"
      );
    }
  };

  const isReadOnly = mode === "view";
  const dialogTitle =
    mode === "add"
      ? "เพิ่มคำสั่งแต่งตั้ง"
      : mode === "view"
      ? "ดูคำสั่งแต่งตั้ง"
      : "แก้ไขคำสั่งแต่งตั้ง";

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
        <AssignmentIcon sx={{ fontSize: 28 }} />
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
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, py: 2 }}>
          {/* คณะ / คณะที่อยู่ภายใต้ */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
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
                committees?.find((t) => t.id === formData.committeeId) || null
              }
              onChange={(_, newValue) => {
                const selectedCommittee = newValue;
                setFormData((prev) => ({
                  ...prev,
                  committeeId: selectedCommittee?.id || 0,
                  subCommitteeOf: "",
                  committeeNumber: selectedCommittee?.committeeNumber || "",
                }));
                handleChangeCommittee(selectedCommittee?.id || 0);
                setErrors((prev) => ({ ...prev, committeeId: undefined }));
              }}
              sx={{ minWidth: 200 }}
              size="small"
              title="คณะฯ"
              disabled={isReadOnly}
              renderInput={(params: any) => (
                <TextField
                  {...params}
                  label="คณะฯ"
                  fullWidth
                  required
                  error={!!errors.committeeId}
                  helperText={errors.committeeId}
                />
              )}
            />

            <Autocomplete
              options={subCommittees || []}
              getOptionLabel={(option) => "คณะที่ " + option || ""}
              value={
                subCommittees?.find((t) => t === formData.subCommitteeOf) ||
                null
              }
              sx={{ flex: 1, minWidth: 200 }}
              onChange={(_, newValue) => {
                const selectedCommittee = newValue;
                setFormData((prev) => ({
                  ...prev,
                  subCommitteeOf: selectedCommittee || "",
                }));
              }}
              disabled={subCommittees?.length === 0 || isReadOnly}
              size="small"
              title="คณะที่อยู่ภายใต้"
              renderInput={(params: any) => (
                <TextField
                  {...params}
                  label="คณะที่อยู่ภายใต้"
                  fullWidth
                  //  helperText="ถ้าเลือกจะถือเป็นประเภทอนุกรรมการวิชาการ"
                />
              )}
            />
          </Box>
          {/* คำสั่งเลขที่ */}
          <TextField
            fullWidth
            label="คำสั่งเลขที่"
            value={formData.orderNumber}
            onChange={(e) => handleChange("orderNumber", e.target.value)}
            disabled={isReadOnly}
            required
            size="small"
            error={!!errors.orderNumber}
            helperText={errors.orderNumber}
          />

          {/* ประเภทคำสั่ง */}
          <Autocomplete
            options={directiveTypeList || []}
            getOptionLabel={(option) => option.name}
            value={
              directiveTypeList?.find(
                (t) => t.id === formData.directiveTypeId
              ) || null
            }
            onChange={(_, newValue) =>
              handleChange("directiveTypeId", newValue?.id || 0)
            }
            sx={{ minWidth: 200 }}
            size="small"
            disabled={isReadOnly}
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="ประเภทคำสั่ง"
                fullWidth
                required
                error={!!errors.directiveTypeId}
                helperText={errors.directiveTypeId}
              />
            )}
          />

          {/* วันที่ลงนาม */}
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            <DatePicker
              label="วันที่ลงนาม"
              value={formData.signingDate ? dayjs(formData.signingDate) : null}
              onChange={handleDateChange}
              disabled={isReadOnly}
              format="DD MMM YYYY"
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  required: true,
                  error: !!errors.signingDate,
                  helperText: errors.signingDate,
                },
              }}
            />
          </LocalizationProvider>

          {/* วันที่สิ้นสุดของคำสั่ง (readonly) */}
          {/* <TextField
            fullWidth
            label="วันที่สิ้นสุดของคำสั่ง"
            value={
              formData.endDate
                ? dayjs(formData.endDate).format("DD MMM YYYY")
                : ""
            }
            size="small"
            slotProps={{ input: { readOnly: true } }}
            placeholder="ระบบจะคำนวณอัตโนมัติจากวันที่ลงนาม + 3 ปี - 1 วัน"
            helperText="คำนวณอัตโนมัติจากวันที่ลงนาม + 3 ปี - 1 วัน"
          /> */}

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
            <DatePicker
              label="วันที่สิ้นสุดของคำสั่ง"
              value={formData.endDate ? dayjs(formData.endDate) : null}
              onChange={handleDateChange}
              disabled={true}
              format="DD MMM YYYY"
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  required: true,
                  error: !!errors.signingDate,
                  helperText: errors.signingDate,
                },
              }}
            />
          </LocalizationProvider>

          {/* ข้อมูลการประชุมมติแต่งตั้ง */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              ข้อมูลการประชุมมติแต่งตั้ง
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1.5fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="ครั้งที่การประชุมมติแต่งตั้ง"
                fullWidth
                value={formData.meetingRound}
                onChange={(e) => handleChange("meetingRound", e.target.value)}
                disabled={isReadOnly}
                size="small"
                placeholder="กรอกครั้งที่ประชุม หรือดึงจากระบบ e-meeting"
              />
              <TextField
                label="รหัสอ้างอิงการประชุม/meetings"
                fullWidth
                value={formData.meetingRef}
                onChange={(e) => handleChange("meetingRef", e.target.value)}
                disabled={isReadOnly}
                size="small"
                placeholder="เช่น Meeting ID / เลขที่ประชุม"
              />
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
              <DatePicker
                label="วันที่มีมติการประชุม"
                value={
                  formData.meetingDate ? dayjs(formData.meetingDate) : null
                }
                onChange={(newDate) => {
                  if (!newDate) {
                    setFormData((prev) => ({ ...prev, meetingDate: "" }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      meetingDate: newDate.format("YYYY-MM-DD"),
                    }));
                  }
                }}
                disabled={isReadOnly}
                format="DD MMM YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small",
                  },
                }}
              />
            </LocalizationProvider>
          </Box>

          {/* edition คำสั่ง */}
          <TextField
            fullWidth
            label="edition คำสั่ง"
            value={formData.edition}
            size="small"
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                handleChange("edition", value);
              }
            }}
            disabled={isReadOnly}
            placeholder="กรุณากรอกตัวเลขเท่านั้น"
            error={!!errors.edition}
            helperText={errors.edition || "กรอกเฉพาะตัวเลข"}
          />

          {/* amd คำสั่ง */}
          <TextField
            fullWidth
            label="amd คำสั่ง"
            value={formData.amd}
            size="small"
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value)) {
                handleChange("amd", value);
              }
            }}
            disabled={isReadOnly}
            placeholder="กรุณากรอกตัวเลขเท่านั้น"
            error={!!errors.amd}
            helperText={errors.amd || "กรอกเฉพาะตัวเลข"}
          />

          {/* ไฟล์คำสั่งแต่งตั้ง */}
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              ไฟล์คำสั่งแต่งตั้ง
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                disabled={isReadOnly}
              >
                อัปโหลดไฟล์
                <input
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </Button>
              {(selectedFile || formData.filePath) && (
                <Typography variant="body2" color="textSecondary">
                  {selectedFile?.name || formData.filePath}
                </Typography>
              )}
            </Box>
          </Box>
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
