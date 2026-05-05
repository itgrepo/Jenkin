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
import { Close } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/th";
import { Meeting } from "@models/meeting";
import { Committee } from "@models/expert";
import { UserInfo } from "@models/auth";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { fetchAppCommitteeType, fetchAppDepartments } from "@store/globalSlice";
import { getExpertCommittees } from "@services/expertService";
import { getUsers } from "@services/userService";

dayjs.locale("th");

interface MeetingCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (meeting: Meeting) => void;
  mode?: "create" | "edit" | "view";
  initialData?: Meeting;
}

interface MeetingErrors {
  committeeId?: string;
  instanceNumber?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  approverLevel1Id?: string;
  approverLevel2Id?: string;
}

export default function MeetingCreateDialog({
  open,
  onClose,
  onSave,
  mode = "create",
  initialData,
}: MeetingCreateDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const { committeeTypeList,departmentList } = useAppSelector((state) => state.global);

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loadingCommittees, setLoadingCommittees] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [formData, setFormData] = useState<Meeting>({
    id: 0,
    committeeId: 0,
    committeeNumber: "",
    committeeName: "",
    meetingSubject: "",
    instanceNumber: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    hostOrganization: (currentUser?.reg_subdepart || "").substring(0, 2),
    responsiblePerson: currentUser?.name || "",
    responsiblePersonId: currentUser?.id || 0,
    approverLevel1Id: 0,
    approverLevel1Name: "",
    approverLevel2Id: 0,
    approverLevel2Name: "",
    remarks: "",
    status: "draft",
  });

  const [startDateValue, setStartDateValue] = useState<Dayjs | null>(null);
  const [endDateValue, setEndDateValue] = useState<Dayjs | null>(null);
  const [startTimeValue, setStartTimeValue] = useState<Dayjs | null>(null);
  const [endTimeValue, setEndTimeValue] = useState<Dayjs | null>(null);

  const [errors, setErrors] = useState<MeetingErrors>({});

  useEffect(() => {
    if (!committeeTypeList) {
      dispatch(fetchAppCommitteeType());
    }
    if (!departmentList) {
      dispatch(fetchAppDepartments());
    }
    loadCommittees();
    loadUsers();
  }, [dispatch, committeeTypeList,departmentList]);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        responsiblePerson: currentUser.name || "",
        responsiblePersonId: currentUser.id || 0,
        hostOrganization: (currentUser?.reg_subdepart || "").substring(0, 2),
      }));
    }
  }, [currentUser]);

  const loadCommittees = async () => {
    try {
      setLoadingCommittees(true);
      const res = await getExpertCommittees({});
      setCommittees(res.data || []);
    } catch (err: any) {
      console.error("Error loading committees:", err);
    } finally {
      setLoadingCommittees(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      // Load users for approver selection (roles 1-5 are approvers)
      const res = await getUsers({ reg_subdepart: currentUser?.reg_subdepart || "" }); // Load all users, filter by role in UI if needed
      setUsers(res || []);
    } catch (err: any) {
      console.error("Error loading users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (open && initialData && mode !== "create") {
      // Load initial data for edit/view mode
      setFormData(initialData);
      if (initialData.startDate) {
        setStartDateValue(dayjs(initialData.startDate));
      }
      if (initialData.endDate) {
        setEndDateValue(dayjs(initialData.endDate));
      }
      if (initialData.startTime) {
        setStartTimeValue(dayjs(initialData.startTime, "HH:mm"));
      }
      if (initialData.endTime) {
        setEndTimeValue(dayjs(initialData.endTime, "HH:mm"));
      }
    } else if (!open) {
      // Reset form when dialog closes
      setFormData({
        id: 0,
        committeeId: 0,
        committeeNumber: "",
        committeeName: "",
        meetingSubject: "",
        instanceNumber: "",
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        hostOrganization: (currentUser?.reg_subdepart || "").substring(0, 2),
        responsiblePerson: currentUser?.name || "",
        responsiblePersonId: currentUser?.id || 0,
        approverLevel1Id: 0,
        approverLevel1Name: "",
        approverLevel2Id: 0,
        approverLevel2Name: "",
        remarks: "",
        status: "draft",
      });
      setStartDateValue(null);
      setEndDateValue(null);
      setStartTimeValue(null);
      setEndTimeValue(null);
      setErrors({});
    }
  }, [open, initialData, mode, currentUser]);

  const validateForm = (): boolean => {
    const newErrors: MeetingErrors = {};

    if (!formData.committeeId || formData.committeeId === 0) {
      newErrors.committeeId = "กรุณาเลือกคณะ";
    }

    if (!formData.instanceNumber || formData.instanceNumber.trim() === "") {
      newErrors.instanceNumber = "กรุณากรอกครั้งที่ประชุม";
    }

    if (!startDateValue) {
      newErrors.startDate = "กรุณาเลือกวันที่เริ่มต้นประชุม";
    }

    if (!endDateValue) {
      newErrors.endDate = "กรุณาเลือกวันที่สิ้นสุดประชุม";
    }

    if (
      startDateValue &&
      endDateValue &&
      startDateValue.isAfter(endDateValue)
    ) {
      newErrors.endDate = "วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น";
    }

    if (!startTimeValue) {
      newErrors.startTime = "กรุณาเลือกเวลาเริ่มต้น";
    }

    if (!endTimeValue) {
      newErrors.endTime = "กรุณาเลือกเวลาสิ้นสุด";
    }

    if (
      startTimeValue &&
      endTimeValue &&
      startTimeValue.isAfter(endTimeValue)
    ) {
      newErrors.endTime = "เวลาสิ้นสุดต้องมากกว่าหรือเท่ากับเวลาเริ่มต้น";
    }

    if (!formData.approverLevel1Id || formData.approverLevel1Id === 0) {
      newErrors.approverLevel1Id = "กรุณาเลือกผู้อนุมัติขั้นที่1";
    }

    if (!formData.approverLevel2Id || formData.approverLevel2Id === 0) {
      newErrors.approverLevel2Id = "กรุณาเลือกผู้อนุมัติขั้นที่2";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const meetingData: Meeting = {
      ...formData,
      startDate: startDateValue?.format("YYYY-MM-DD") || "",
      endDate: endDateValue?.format("YYYY-MM-DD") || "",
      startTime: startTimeValue?.format("HH:mm") || "",
      endTime: endTimeValue?.format("HH:mm") || "",
    };

    onSave(meetingData);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobileDialog}
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobileDialog ? 0 : 2,
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
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {mode === "view"
                ? "ดูรายละเอียดการประชุม"
                : mode === "edit"
                ? "แก้ไขคำขอประชุม"
                : "สร้างคำขอประชุมใหม่"}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* 1. เลือกคณะ (Expert) */}
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
                  gap: 2,
                  flexDirection: isMobileDialog ? "column" : "row",
                }}
              >
                <Autocomplete
                  options={committees || []}
                  getOptionLabel={(option) =>
                    `${option.committeeNumber || ""} ${option.subCommitteeOf?" - "+option.subCommitteeOf:""} - ${
                      option.committeeNameTh || ""
                    }`
                  }
                  value={
                    committees.find((c) => c.id === formData.committeeId) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      committeeId: newValue?.id || 0,
                      committeeNumber: newValue?.committeeNumber || "",
                      committeeName: newValue?.committeeNameTh || "",
                    });
                    if (errors.committeeId) {
                      setErrors({ ...errors, committeeId: undefined });
                    }
                  }}
                  loading={loadingCommittees}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={mode === "view"}
                  size="small"
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="เลือกคณะ"
                      fullWidth
                      required
                      error={!!errors.committeeId}
                      helperText={errors.committeeId}
                    />
                  )}
                  sx={{ minWidth: "60%" }}
                />
                {/* 2. ครั้งที่ประชุม */}
                <TextField
                  label="ครั้งที่ประชุม"
                  value={formData.instanceNumber}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      instanceNumber: e.target.value,
                    });
                    if (errors.instanceNumber) {
                      setErrors({ ...errors, instanceNumber: undefined });
                    }
                  }}
                  fullWidth
                  required
                  error={!!errors.instanceNumber}
                  helperText={errors.instanceNumber}
                  size="small"
                  disabled={mode === "view"}
                  sx={{ minWidth: "20%" }}
                />
              </Box>
              
              {/* หัวข้อการประชุม */}
              <TextField
                label="หัวข้อการประชุม"
                value={formData.meetingSubject || ""}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    meetingSubject: e.target.value,
                  });
                }}
                fullWidth
                size="small"
                disabled={mode === "view"}
                multiline
                rows={2}
                sx={{ mt: 2 }}
              />
            </Box>

            {/* 3. วันที่เริ่มต้น/สิ้นสุดประชุม */}
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
                sx={{ fontWeight: 600, mb: 1.5, color: "text.primary" }}
              >
                วันเวลาเริ่มต้น/สิ้นสุดประชุม
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: isMobileDialog ? "column" : "row",
                }}
              >
                <DatePicker
                  label="วันที่เริ่มต้น"
                  value={startDateValue}
                  onChange={(newValue) => {
                    setStartDateValue(newValue);
                    if (errors.startDate) {
                      setErrors({ ...errors, startDate: undefined });
                    }
                  }}
                  format="DD/MM/YYYY"
                  minDate={mode === "create" ? dayjs() : undefined}
                  disabled={mode === "view"}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      required: true,
                      error: !!errors.startDate,
                      helperText: errors.startDate,
                    },
                  }}
                />
                <TimePicker
                  label="เวลาเริ่มต้น"
                  value={startTimeValue}
                  onChange={(newValue) => {
                    setStartTimeValue(newValue);
                    if (errors.startTime) {
                      setErrors({ ...errors, startTime: undefined });
                    }
                  }}
                  disabled={mode === "view"}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      required: true,
                      error: !!errors.startTime,
                      helperText: errors.startTime,
                    },
                  }}
                />
              </Box>
              {/* 4. เวลาเริ่มต้น/สิ้นสุด */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: isMobileDialog ? "column" : "row",
                  mt: 2,
                }}
              >
                <DatePicker
                  label="วันที่สิ้นสุด"
                  value={endDateValue}
                  onChange={(newValue) => {
                    setEndDateValue(newValue);
                    if (errors.endDate) {
                      setErrors({ ...errors, endDate: undefined });
                    }
                  }}
                  format="DD/MM/YYYY"
                  minDate={startDateValue || undefined}
                  disabled={mode === "view"}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      required: true,
                      error: !!errors.endDate,
                      helperText: errors.endDate,
                    },
                  }}
                />
                <TimePicker
                  label="เวลาสิ้นสุด"
                  value={endTimeValue}
                  onChange={(newValue) => {
                    setEndTimeValue(newValue);
                    if (errors.endTime) {
                      setErrors({ ...errors, endTime: undefined });
                    }
                  }}
                  disabled={mode === "view"}
                  slotProps={{
                    textField: {
                      size: "small",
                      fullWidth: true,
                      required: true,
                      error: !!errors.endTime,
                      helperText: errors.endTime,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* 5. หน่วยงานเจ้าภาพ / ผู้รับผิดชอบ */}
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
                sx={{ fontWeight: 600, mb: 1.5, color: "text.primary" }}
              >
                หน่วยงานเจ้าภาพ / ผู้รับผิดชอบ
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: isMobileDialog ? "column" : "row",
                }}
              >
                <TextField
                  label="หน่วยงาน"
                  value={departmentList?.find((d) => d.id === Number((currentUser?.reg_subdepart || "").substring(0, 2)))?.name || ""}
                  onChange={() =>
                    setFormData({
                      ...formData,
                      hostOrganization: (currentUser?.reg_subdepart || "").substring(0, 2),
                    })
                  }
                  fullWidth
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
                <TextField
                  label="ผู้รับผิดชอบ"
                  value={formData.responsiblePerson || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responsiblePerson: e.target.value,
                    })
                  }
                  fullWidth
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                />
              </Box>
            </Box>

            {/* 6. เลือกคน Approve */}
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
                sx={{ fontWeight: 600, mb: 1, color: "text.primary" }}
              >
                เลือกคน Approve
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: isMobileDialog ? "column" : "row",
                  mt: 2,
                }}
              >
                {/* 6.1 ผู้อนุมัติขั้นที่1 */}

                <Autocomplete
                  options={users || []}
                  getOptionLabel={(option) =>
                    `${option.name || ""} (${option.role?.name || ""})`
                  }
                  value={
                    users.find((u) => u.id === formData.approverLevel1Id) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      approverLevel1Id: newValue?.id || 0,
                      approverLevel1Name: newValue?.name || "",
                    });
                    if (errors.approverLevel1Id) {
                      setErrors({ ...errors, approverLevel1Id: undefined });
                    }
                  }}
                  loading={loadingUsers}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={mode === "view"}
                  size="small"
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="เลือกผู้อนุมัติขั้นที่1"
                      fullWidth
                      required
                      error={!!errors.approverLevel1Id}
                      helperText={errors.approverLevel1Id}
                    />
                  )}
                  sx={{ minWidth: "50%" }}
                />

                {/* 6.2 ผู้อนุมัติขั้นที่2 */}

                <Autocomplete
                  options={users || []}
                  getOptionLabel={(option) =>
                    `${option.name || ""} (${option.role?.name || ""})`
                  }
                  value={
                    users.find((u) => u.id === formData.approverLevel2Id) ||
                    null
                  }
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      approverLevel2Id: newValue?.id || 0,
                      approverLevel2Name: newValue?.name || "",
                    });
                    if (errors.approverLevel2Id) {
                      setErrors({ ...errors, approverLevel2Id: undefined });
                    }
                  }}
                  loading={loadingUsers}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  disabled={mode === "view"}
                  size="small"
                  renderInput={(params: any) => (
                    <TextField
                      {...params}
                      label="เลือกผู้อนุมัติขั้นที่2"
                      fullWidth
                      required
                      error={!!errors.approverLevel2Id}
                      helperText={errors.approverLevel2Id}
                    />
                  )}
                  sx={{ minWidth: "50%" }}
                />
              </Box>
            </Box>

            {/* 5. หมายเหตุ */}
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
                sx={{ fontWeight: 600, mb: 1.5, color: "text.primary" }}
              >
                หมายเหตุ
              </Typography>
              <TextField
                label="หมายเหตุ"
                value={formData.remarks || ""}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                fullWidth
                multiline
                rows={4}
                size="small"
                disabled={mode === "view"}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          {mode === "view" ? (
            <Button
              onClick={onClose}
              variant="contained"
              sx={{
                borderRadius: 2,
                textTransform: "none",
                minWidth: 100,
                fontWeight: 600,
              }}
            >
              ปิด
            </Button>
          ) : (
            <>
              <Button
                onClick={onClose}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  minWidth: 100,
                }}
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  minWidth: 100,
                  fontWeight: 600,
                }}
              >
                บันทึกข้อมูล
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
