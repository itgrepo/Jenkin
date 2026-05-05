import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  useMediaQuery,
  useTheme,
  Autocomplete,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { MeetingBudget } from "@models/meeting";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import {
  fetchAppYearSelect,
  fetchAppDepartments,
  fetchAppSubDepartmentsByDPisId,
} from "@store/globalSlice";
import { MasterData } from "@models/global";

interface MeetingBudgetDialogProps {
  open: boolean;
  mode: "add" | "view" | "edit";
  budget?: MeetingBudget;
  onClose: () => void;
  onSave: (budget: MeetingBudget) => void;
}

interface MeetingBudgetErrors {
  fiscalYear?: string;
  departmentId?: string;
  subDepartmentId?: string;
  amount?: string;
}

export default function MeetingBudgetDialog({
  open,
  mode,
  budget,
  onClose,
  onSave,
}: MeetingBudgetDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const { yearSelectList, subDepartmentList, departmentList } =
    useAppSelector((state) => state.global);

  const [formData, setFormData] = useState<MeetingBudget>({
    id: budget?.id || 0,
    fiscalYear: budget?.fiscalYear || "",
    departmentId: budget?.departmentId || 0,
    departmentCode: departmentList?.find(d => d.id === budget?.departmentId)?.code || "",
    departmentName: budget?.departmentName || "",
    subDepartmentId: budget?.subDepartmentId || 0,
    subDepartmentName: budget?.subDepartmentName || "",
    amount: budget?.amount || 0,
  });

  const [errors, setErrors] = useState<MeetingBudgetErrors>({});

  useEffect(() => {
    if (!yearSelectList) {
      dispatch(fetchAppYearSelect());
    }
    if (!departmentList) {
      dispatch(fetchAppDepartments());
    }
  }, [dispatch, yearSelectList, departmentList]);

  useEffect(() => {
    if (formData.departmentId && departmentList) {
      dispatch(fetchAppSubDepartmentsByDPisId(departmentList.find(d => d.id === formData.departmentId)?.code || ""));
    }
  }, [formData.departmentId,departmentList]);

  useEffect(() => {
    if (budget) {
      setFormData({
        id: budget.id || 0,
        fiscalYear: budget.fiscalYear || "",
        departmentId: budget.departmentId || 0,
        departmentCode: departmentList?.find(d => d.id === budget.departmentId)?.code || "",
        departmentName: budget.departmentName || "",
        subDepartmentId: budget.subDepartmentId || 0,
        subDepartmentName: budget.subDepartmentName || "",
        amount: budget.amount || 0,
      });
    } else {
      setFormData({
        id: 0,
        fiscalYear: "",
        departmentId: 0,
        departmentCode: "",
        departmentName: "",
        subDepartmentId: 0,
        subDepartmentName: "",
        amount: 0,
      });
    }
    setErrors({});
  }, [budget, open]);

  const isReadOnly = mode === "view";

  const validateForm = (): boolean => {
    const newErrors: MeetingBudgetErrors = {};

    if (!formData.fiscalYear || formData.fiscalYear.trim() === "") {
      newErrors.fiscalYear = "กรุณาเลือกปีงบประมาณ";
    }

    if (!formData.departmentId || formData.departmentId === 0) {
      newErrors.departmentId = "กรุณาเลือกกอง";
    }

    // if (!formData.subDepartmentId || formData.subDepartmentId === 0) {
    //   newErrors.subDepartmentId = "กรุณาเลือกกลุ่ม";
    // }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "กรุณากรอกจำนวนเงินที่มากกว่า 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData({
        ...formData,
        amount: value === "" ? 0 : parseFloat(value) || 0,
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          fontWeight: 700,
        }}
      >
        {mode === "add"
          ? "เพิ่มงบประมาณการประชุม"
          : mode === "view"
          ? "ดูงบประมาณการประชุม"
          : "แก้ไขงบประมาณการประชุม"}
        <IconButton
          onClick={onClose}
          sx={{ color: "white" }}
          size="small"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3,mt:2 }}>
          {/* Fiscal Year */}
          <Autocomplete
            options={yearSelectList || []}
            getOptionLabel={(option) => option.name}
            value={
              yearSelectList?.find((y) => y.name === formData.fiscalYear) ||
              null
            }
            onChange={(_, newValue) => {
              setFormData({
                ...formData,
                fiscalYear: newValue?.name || "",
              });
              if (errors.fiscalYear) {
                setErrors({ ...errors, fiscalYear: undefined });
              }
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.name === value.name
            }
            disabled={isReadOnly}
            size="small"
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="ปีงบประมาณ"
                fullWidth
                required
                error={!!errors.fiscalYear}
                helperText={errors.fiscalYear}
              />
            )}
          />

          {/* Department */}
          <Autocomplete
            options={departmentList || []}
            getOptionLabel={(option) => option.name}
            value={
              departmentList?.find(
                (d) => d.id === formData.departmentId
              ) || null
            }
            onChange={(_, newValue) => {
              setFormData({
                ...formData,
                departmentId: newValue?.id || 0,
                departmentName: newValue?.name || "",
              });
              if (errors.departmentId) {
                setErrors({ ...errors, departmentId: undefined });
              }
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.id === value.id
            }
            disabled={isReadOnly}
            size="small"
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="กอง"
                fullWidth
                required
                error={!!errors.departmentId}
                helperText={errors.departmentId}
              />
            )}
          />

          {/* Sub Department */}
          <Autocomplete
            options={subDepartmentList || []}
            getOptionLabel={(option) => option.name}
            value={
              subDepartmentList?.find(
                (sd) => sd.id === formData.subDepartmentId
              ) || null
            }
            onChange={(_, newValue) => {
              setFormData({
                ...formData,
                subDepartmentId: newValue?.id || 0,
                subDepartmentName: newValue?.name || "",
              });
              if (errors.subDepartmentId) {
                setErrors({ ...errors, subDepartmentId: undefined });
              }
            }}
            isOptionEqualToValue={(option: MasterData, value: MasterData) =>
              option.id === value.id
            }
            disabled={isReadOnly||!formData.departmentId}
            loading={!formData.departmentId}
            size="small"
            renderInput={(params: any) => (
              <TextField
                {...params}
                label="กลุ่ม"
                fullWidth
                error={!!errors.subDepartmentId}
                helperText={errors.subDepartmentId}
              />
            )}
          />

          {/* Amount */}
          <TextField
            label="จำนวนเงิน (บาท)"
            type="text"
            value={formData.amount === 0 ? "" : formData.amount.toString()}
            onChange={handleAmountChange}
            disabled={isReadOnly}
            fullWidth
            required
            error={!!errors.amount}
            helperText={errors.amount || "ใส่ข้อมูลได้เฉพาะตัวเลข"}
            slotProps={{
              input: {
                inputProps: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                },
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            minWidth: 100,
          }}
        >
          {isReadOnly ? "ปิด" : "ยกเลิก"}
        </Button>
        {!isReadOnly && (
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
        )}
      </DialogActions>
    </Dialog>
  );
}

