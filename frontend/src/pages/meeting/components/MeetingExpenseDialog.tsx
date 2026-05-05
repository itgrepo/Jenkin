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
  Typography,
  Grid,
} from "@mui/material";
import { Close, Add, Delete } from "@mui/icons-material";
import {
  MeetingExpense,
  MeetingExpenseItem,
  MeetingExpenseBudgetInfo,
  Meeting,
} from "@models/meeting";
import { useAppDispatch } from "@hooks/useRedux";
import {
  getMeetingExpense,
  upsertMeetingExpense,
  getMeetingExpenseBudgetInfo,
} from "@services/meetingService";
import { showConfirmInfo, showError, showSuccess } from "@components/Swal";
import { setGlobalLoading } from "@store/globalSlice";

interface MeetingExpenseDialogProps {
  open: boolean;
  meeting: Meeting;
  onClose: () => void;
  onSave?: () => void;
  canEdit: boolean;
}

// Form data for each expense category
interface MeetingAllowanceForm {
  presidentCount: string;
  presidentPrice: string;
  presidentRemarks: string;
  committeeCount: string;
  committeePrice: string;
  committeeRemarks: string;
  total: string;
}

interface StandardExpenseForm {
  quantity: string;
  unitPrice: string;
  remarks: string;
}

interface OtherExpenseForm {
  itemName: string;
  quantity: string;
  unitPrice: string;
  remarks: string;
}

export default function MeetingExpenseDialog({
  open,
  meeting,
  canEdit,
  onClose,
  onSave,
}: MeetingExpenseDialogProps) {
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));
  const dispatch = useAppDispatch();

  const [budgetInfo, setBudgetInfo] = useState<MeetingExpenseBudgetInfo | null>(
    null
  );
  const [saved, setSaved] = useState(false);

  // Form data for each category
  const [meetingAllowance, setMeetingAllowance] =
    useState<MeetingAllowanceForm>({
      presidentCount: "",
      presidentPrice: "",
      presidentRemarks: "",
      committeeCount: "",
      committeePrice: "",
      committeeRemarks: "",
      total: "",
    });

  const [documentExpense, setDocumentExpense] = useState<StandardExpenseForm>({
    quantity: "",
    unitPrice: "",
    remarks: "",
  });

  const [foodExpense, setFoodExpense] = useState<StandardExpenseForm>({
    quantity: "",
    unitPrice: "",
    remarks: "",
  });

  const [breakExpense, setBreakExpense] = useState<StandardExpenseForm>({
    quantity: "",
    unitPrice: "",
    remarks: "",
  });

  const [roomRentalExpense, setRoomRentalExpense] =
    useState<StandardExpenseForm>({
      quantity: "",
      unitPrice: "",
      remarks: "",
    });

  const [otherExpenses, setOtherExpenses] = useState<OtherExpenseForm[]>([]);

  useEffect(() => {
    if (open) {
      loadMeetingExpense();
      setSaved(false);
      setBudgetInfo(null);
    }
  }, [open, meeting.id]);

  // Calculate meeting allowance total
  useEffect(() => {
    const presidentTotal =
      parseFloat(meetingAllowance.presidentCount || "0") *
      parseFloat(meetingAllowance.presidentPrice || "0");
    const committeeTotal =
      parseFloat(meetingAllowance.committeeCount || "0") *
      parseFloat(meetingAllowance.committeePrice || "0");
    const total = presidentTotal + committeeTotal;
    setMeetingAllowance((prev) => ({
      ...prev,
      total: total > 0 ? total.toString() : "",
    }));
  }, [
    meetingAllowance.presidentCount,
    meetingAllowance.presidentPrice,
    meetingAllowance.committeeCount,
    meetingAllowance.committeePrice,
  ]);

  const loadMeetingExpense = async () => {
    if (!meeting.id) return;
    try {
      dispatch(setGlobalLoading(true));
      const res = await getMeetingExpense(meeting.id);

      // Load budget info if available from getMeetingExpense response
      if (res.annualBudget !== undefined) {
        setBudgetInfo({
          annualBudget: res.annualBudget || 0,
          expensesDisbursed: res.expensesDisbursed || 0,
          expensesAdvancePayment: res.expensesAdvancePayment || 0,
          remainingBudget: res.remainingBudget || 0,
        });
        setSaved(true);
      } else {
        // If budget info not in response, try to load it separately
        try {
          const budgetInfoRes = await getMeetingExpenseBudgetInfo(meeting.id);
          setBudgetInfo(budgetInfoRes);
          setSaved(true);
        } catch (budgetErr: any) {
          // Budget info might not be available yet (not saved), ignore error
          if (budgetErr?.status === 404) {
            showConfirmInfo("แจ้งเตือน", budgetErr?.response?.data?.error || "ไม่พบข้อมูลงบประมาณ").then((result: any) => {
              if (result.isConfirmed) {
                onClose();
              }
            });
          }
        }
      }
      // Populate form data from saved expense items
      if (res.expenses && res.expenses.length > 0) {
        // 1. ค่าเบี้ยประชุม - ประธาน (expenseTypeId: 1)
        const presidentExpense = res.expenses.find(
          (e) => e.expenseTypeId === 1
        );
        if (presidentExpense) {
          setMeetingAllowance((prev) => ({
            ...prev,
            presidentCount: presidentExpense.quantity.toString(),
            presidentPrice: presidentExpense.unitPrice.toString(),
            presidentRemarks: presidentExpense.remarks || "",
          }));
        }

        // 2. ค่าเบี้ยประชุม - กรรมการ (expenseTypeId: 2)
        const committeeExpense = res.expenses.find(
          (e) => e.expenseTypeId === 2
        );
        if (committeeExpense) {
          setMeetingAllowance((prev) => ({
            ...prev,
            committeeCount: committeeExpense.quantity.toString(),
            committeePrice: committeeExpense.unitPrice.toString(),
            committeeRemarks: committeeExpense.remarks || "",
          }));
        }

        // 3. ค่าเอกสารการประชุม (expenseTypeId: 3)
        const documentExpenseItem = res.expenses.find(
          (e) => e.expenseTypeId === 3
        );
        if (documentExpenseItem) {
          setDocumentExpense({
            quantity: documentExpenseItem.quantity.toString(),
            unitPrice: documentExpenseItem.unitPrice.toString(),
            remarks: documentExpenseItem.remarks || "",
          });
        }

        // 4. ค่าอาหาร (expenseTypeId: 4)
        const foodExpenseItem = res.expenses.find((e) => e.expenseTypeId === 4);
        if (foodExpenseItem) {
          setFoodExpense({
            quantity: foodExpenseItem.quantity.toString(),
            unitPrice: foodExpenseItem.unitPrice.toString(),
            remarks: foodExpenseItem.remarks || "",
          });
        }

        // 5. ค่า break (expenseTypeId: 5)
        const breakExpenseItem = res.expenses.find(
          (e) => e.expenseTypeId === 5
        );
        if (breakExpenseItem) {
          setBreakExpense({
            quantity: breakExpenseItem.quantity.toString(),
            unitPrice: breakExpenseItem.unitPrice.toString(),
            remarks: breakExpenseItem.remarks || "",
          });
        }

        // 6. ค่าเช่าห้องประชุม (expenseTypeId: 6)
        const roomRentalExpenseItem = res.expenses.find(
          (e) => e.expenseTypeId === 6
        );
        if (roomRentalExpenseItem) {
          setRoomRentalExpense({
            quantity: roomRentalExpenseItem.quantity.toString(),
            unitPrice: roomRentalExpenseItem.unitPrice.toString(),
            remarks: roomRentalExpenseItem.remarks || "",
          });
        }

        // 7. ค่าอื่นๆ (expenseTypeId: 7) - อาจมีหลายรายการ
        const otherExpenseItems = res.expenses.filter(
          (e) => e.expenseTypeId === 7
        );
        if (otherExpenseItems.length > 0) {
          setOtherExpenses(
            otherExpenseItems.map((item) => ({
              itemName: item.expenseTypeOther || "",
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              remarks: item.remarks || "",
            }))
          );
        }
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        console.error("Error loading meeting expense:", err);
      }
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  const handleNumericChange = (
    value: string,
    setter: (value: string) => void
  ) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const addOtherExpense = () => {
    setOtherExpenses([
      ...otherExpenses,
      { itemName: "", quantity: "", unitPrice: "", remarks: "" },
    ]);
  };

  const removeOtherExpense = (index: number) => {
    setOtherExpenses(otherExpenses.filter((_, i) => i !== index));
  };

  const updateOtherExpense = (
    index: number,
    field: keyof OtherExpenseForm,
    value: string
  ) => {
    const updated = [...otherExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setOtherExpenses(updated);
  };

  const buildExpenseList = (): MeetingExpenseItem[] => {
    const expenses: MeetingExpenseItem[] = [];

    // 1. ค่าเบี้ยประชุม - ประธาน
    if (
      meetingAllowance.presidentCount &&
      parseFloat(meetingAllowance.presidentCount) > 0 &&
      meetingAllowance.presidentPrice &&
      parseFloat(meetingAllowance.presidentPrice) > 0
    ) {
      expenses.push({
        expenseTypeId: 1, // MEETING_ALLOWANCE_PRESIDENT
        expenseTypeName: "ค่าเบี้ยประชุม - ประธาน",
        quantity: parseFloat(meetingAllowance.presidentCount),
        unitPrice: parseFloat(meetingAllowance.presidentPrice),
        totalPrice:
          parseFloat(meetingAllowance.presidentCount) *
          parseFloat(meetingAllowance.presidentPrice),
        remarks: meetingAllowance.presidentRemarks || undefined,
      });
    }

    // 2. ค่าเบี้ยประชุม - กรรมการ
    if (
      meetingAllowance.committeeCount &&
      parseFloat(meetingAllowance.committeeCount) > 0 &&
      meetingAllowance.committeePrice &&
      parseFloat(meetingAllowance.committeePrice) > 0
    ) {
      expenses.push({
        expenseTypeId: 2, // MEETING_ALLOWANCE_COMMITTEE
        expenseTypeName: "ค่าเบี้ยประชุม - กรรมการ",
        quantity: parseFloat(meetingAllowance.committeeCount),
        unitPrice: parseFloat(meetingAllowance.committeePrice),
        totalPrice:
          parseFloat(meetingAllowance.committeeCount) *
          parseFloat(meetingAllowance.committeePrice),
        remarks: meetingAllowance.committeeRemarks || undefined,
      });
    }

    // 3. ค่าเอกสารการประชุม
    if (documentExpense.quantity && parseFloat(documentExpense.quantity) > 0) {
      expenses.push({
        expenseTypeId: 3, // MEETING_DOCUMENT
        expenseTypeName: "ค่าเอกสารการประชุม",
        quantity: parseFloat(documentExpense.quantity),
        unitPrice: parseFloat(documentExpense.unitPrice || "0"),
        totalPrice:
          parseFloat(documentExpense.quantity) *
          parseFloat(documentExpense.unitPrice || "0"),
        remarks: documentExpense.remarks || undefined,
      });
    }

    // 4. ค่าอาหาร
    if (foodExpense.quantity && parseFloat(foodExpense.quantity) > 0) {
      expenses.push({
        expenseTypeId: 4, // MEETING_FOOD
        expenseTypeName: "ค่าอาหาร",
        quantity: parseFloat(foodExpense.quantity),
        unitPrice: parseFloat(foodExpense.unitPrice || "0"),
        totalPrice:
          parseFloat(foodExpense.quantity) *
          parseFloat(foodExpense.unitPrice || "0"),
        remarks: foodExpense.remarks || undefined,
      });
    }

    // 5. ค่า break
    if (breakExpense.quantity && parseFloat(breakExpense.quantity) > 0) {
      expenses.push({
        expenseTypeId: 5, // MEETING_BREAK
        expenseTypeName: "ค่า break",
        quantity: parseFloat(breakExpense.quantity),
        unitPrice: parseFloat(breakExpense.unitPrice || "0"),
        totalPrice:
          parseFloat(breakExpense.quantity) *
          parseFloat(breakExpense.unitPrice || "0"),
        remarks: breakExpense.remarks || undefined,
      });
    }

    // 6. ค่าเช่าห้องประชุม
    if (
      roomRentalExpense.quantity &&
      parseFloat(roomRentalExpense.quantity) > 0
    ) {
      expenses.push({
        expenseTypeId: 6, // MEETING_ROOM_RENTAL
        expenseTypeName: "ค่าเช่าห้องประชุม",
        quantity: parseFloat(roomRentalExpense.quantity),
        unitPrice: parseFloat(roomRentalExpense.unitPrice || "0"),
        totalPrice:
          parseFloat(roomRentalExpense.quantity) *
          parseFloat(roomRentalExpense.unitPrice || "0"),
        remarks: roomRentalExpense.remarks || undefined,
      });
    }

    // 7. ค่าอื่นๆ
    otherExpenses.forEach((other) => {
      if (other.itemName && other.quantity && parseFloat(other.quantity) > 0) {
        expenses.push({
          expenseTypeId: 7, // MEETING_OTHER
          expenseTypeName: "ค่าอื่นๆ",
          expenseTypeOther: other.itemName,
          quantity: parseFloat(other.quantity),
          unitPrice: parseFloat(other.unitPrice || "0"),
          totalPrice:
            parseFloat(other.quantity) * parseFloat(other.unitPrice || "0"),
          remarks: other.remarks || undefined,
        });
      }
    });

    return expenses;
  };

  const calculateTotalBudget = () => {
    const expenses = buildExpenseList();
    return expenses.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSave = async () => {
    const expenses = buildExpenseList();
    if (expenses.length === 0) {
      showError(
        "เกิดข้อผิดพลาด",
        "กรุณากรอกข้อมูลค่าใช้จ่ายอย่างน้อย 1 รายการ"
      );
      return;
    }

    try {
      dispatch(setGlobalLoading(true));
      const expenseData: MeetingExpense = {
        meetingId: meeting.id || 0,
        committeeNumber: meeting.committeeNumber,
        committeeName: meeting.committeeName,
        instanceNumber: meeting.instanceNumber,
        expenses: expenses,
        totalBudget: calculateTotalBudget(),
      };

      await upsertMeetingExpense(expenseData);

      const budgetInfoRes = await getMeetingExpenseBudgetInfo(meeting.id || 0);
      setBudgetInfo(budgetInfoRes);
      setSaved(true);

      showSuccess("สำเร็จ", "บันทึกค่าใช้จ่ายเรียบร้อยแล้ว");
      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error("Error saving expense:", err);
      showError(
        "เกิดข้อผิดพลาด",
        err?.response?.data?.message || "ไม่สามารถบันทึกค่าใช้จ่ายได้"
      );
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

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
        บันทึกงบประมาณตั้งเบิก
        <IconButton onClick={onClose} sx={{ color: "white" }} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* ข้อมูลคณะ */}
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

          {/* 1. ค่าเบี้ยประชุมที่จะขอเบิก */}
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
              1. ค่าเบี้ยประชุมที่จะขอเบิก
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* ประธาน */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "text.secondary" }}
                >
                  ประธาน (กี่คน/กี่บาท/หมายเหตุ)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="จำนวนคน"
                      type="text"
                      value={meetingAllowance.presidentCount}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, (val) =>
                          setMeetingAllowance({
                            ...meetingAllowance,
                            presidentCount: val,
                          })
                        )
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                      slotProps={{
                        input: {
                          inputProps: {
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="ราคา (บาท)"
                      type="text"
                      value={meetingAllowance.presidentPrice}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, (val) =>
                          setMeetingAllowance({
                            ...meetingAllowance,
                            presidentPrice: val,
                          })
                        )
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                      slotProps={{
                        input: {
                          inputProps: {
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="หมายเหตุ"
                      value={meetingAllowance.presidentRemarks}
                      onChange={(e) =>
                        setMeetingAllowance({
                          ...meetingAllowance,
                          presidentRemarks: e.target.value,
                        })
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* กรรมการ */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "text.secondary" }}
                >
                  กรรมการ (กี่คน/กี่บาท/หมายเหตุ)
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="จำนวนคน"
                      type="text"
                      value={meetingAllowance.committeeCount}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, (val) =>
                          setMeetingAllowance({
                            ...meetingAllowance,
                            committeeCount: val,
                          })
                        )
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                      slotProps={{
                        input: {
                          inputProps: {
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="ราคา (บาท)"
                      type="text"
                      value={meetingAllowance.committeePrice}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, (val) =>
                          setMeetingAllowance({
                            ...meetingAllowance,
                            committeePrice: val,
                          })
                        )
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                      slotProps={{
                        input: {
                          inputProps: {
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="หมายเหตุ"
                      value={meetingAllowance.committeeRemarks}
                      onChange={(e) =>
                        setMeetingAllowance({
                          ...meetingAllowance,
                          committeeRemarks: e.target.value,
                        })
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* ผลรวม */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "text.secondary", fontStyle: "italic" }}
                >
                  *กรอกผลรวมเอง
                </Typography>
                <TextField
                  label="ผลรวม (บาท)"
                  value={meetingAllowance.total}
                  fullWidth
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ maxWidth: 300 }}
                />
              </Box>
            </Box>
          </Box>

          {/* 2. ค่าเอกสารการประชุม */}
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
              2. ค่าเอกสารการประชุม (จำนวน/ราคาต่อหน่วย/หมายเหตุ)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="จำนวน"
                  type="text"
                  value={documentExpense.quantity}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setDocumentExpense({ ...documentExpense, quantity: val })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ราคาต่อหน่วย (บาท)"
                  type="text"
                  value={documentExpense.unitPrice}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setDocumentExpense({ ...documentExpense, unitPrice: val })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="หมายเหตุ"
                  value={documentExpense.remarks}
                  onChange={(e) =>
                    setDocumentExpense({
                      ...documentExpense,
                      remarks: e.target.value,
                    })
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 3. ค่าอาหาร */}
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
              3. ค่าอาหาร (จำนวน/ราคาต่อหน่วย/หมายเหตุ)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="จำนวน"
                  type="text"
                  value={foodExpense.quantity}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setFoodExpense({ ...foodExpense, quantity: val })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ราคาต่อหน่วย (บาท)"
                  type="text"
                  value={foodExpense.unitPrice}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setFoodExpense({ ...foodExpense, unitPrice: val })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="หมายเหตุ"
                  value={foodExpense.remarks}
                  onChange={(e) =>
                    setFoodExpense({ ...foodExpense, remarks: e.target.value })
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 4. ค่า break */}
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
              4. ค่า break (จำนวน/ราคาต่อหน่วย/หมายเหตุ)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="จำนวน"
                  type="text"
                  value={breakExpense.quantity}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setBreakExpense({ ...breakExpense, quantity: val })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ราคาต่อหน่วย (บาท)"
                  type="text"
                  value={breakExpense.unitPrice}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setBreakExpense({ ...breakExpense, unitPrice: val })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="หมายเหตุ"
                  value={breakExpense.remarks}
                  onChange={(e) =>
                    setBreakExpense({
                      ...breakExpense,
                      remarks: e.target.value,
                    })
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 5. ค่าเช่าห้องประชุม */}
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
              5. ค่าเช่าห้องประชุม (จำนวน/ราคาต่อหน่วย/หมายเหตุ)
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="จำนวน"
                  type="text"
                  value={roomRentalExpense.quantity}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setRoomRentalExpense({
                        ...roomRentalExpense,
                        quantity: val,
                      })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="ราคาต่อหน่วย (บาท)"
                  type="text"
                  value={roomRentalExpense.unitPrice}
                  onChange={(e) =>
                    handleNumericChange(e.target.value, (val) =>
                      setRoomRentalExpense({
                        ...roomRentalExpense,
                        unitPrice: val,
                      })
                    )
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                  slotProps={{
                    input: {
                      inputProps: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  label="หมายเหตุ"
                  value={roomRentalExpense.remarks}
                  onChange={(e) =>
                    setRoomRentalExpense({
                      ...roomRentalExpense,
                      remarks: e.target.value,
                    })
                  }
                  fullWidth
                  size="small"
                  disabled={!canEdit}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 6. ค่าอื่นๆ */}
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
                6. ค่าอื่นๆ (ซึ่งสามารถเพิ่มและระบุเองได้)
              </Typography>
              {canEdit && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Add />}
                  onClick={addOtherExpense}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                  }}
                >
                  เพิ่มรายการ
                </Button>
              )}
            </Box>
            <Typography
              variant="body2"
              sx={{ mb: 2, color: "text.secondary", fontStyle: "italic" }}
            >
              *เพิ่มได้มากกว่า1รายการ
            </Typography>
            {otherExpenses.map((other, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 1,
                  bgcolor: "grey.50",
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
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    รายการที่ {index + 1} (รายการ/จำนวน/ราคาต่อหน่วย/หมายเหตุ)
                  </Typography>
                  {canEdit && (
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removeOtherExpense(index)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="รายการ"
                      value={other.itemName}
                      onChange={(e) =>
                        updateOtherExpense(index, "itemName", e.target.value)
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="จำนวน"
                      type="text"
                      value={other.quantity}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, (val) =>
                          updateOtherExpense(index, "quantity", val)
                        )
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                      slotProps={{
                        input: {
                          inputProps: {
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="ราคาต่อหน่วย (บาท)"
                      type="text"
                      value={other.unitPrice}
                      onChange={(e) =>
                        handleNumericChange(e.target.value, (val) =>
                          updateOtherExpense(index, "unitPrice", val)
                        )
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                      slotProps={{
                        input: {
                          inputProps: {
                            inputMode: "numeric",
                            pattern: "[0-9]*",
                          },
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <TextField
                      label="หมายเหตุ"
                      value={other.remarks}
                      onChange={(e) =>
                        updateOtherExpense(index, "remarks", e.target.value)
                      }
                      fullWidth
                      size="small"
                      disabled={!canEdit}
                    />
                  </Grid>
                </Grid>
              </Box>
            ))}
            {otherExpenses.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", fontStyle: "italic" }}
              >
                ยังไม่มีรายการอื่นๆ
              </Typography>
            )}
          </Box>

          {/* งบประมาณรวมทั้งหมด */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <TextField
              label="งบประมาณรวมทั้งหมด (บาท)"
              value={calculateTotalBudget().toLocaleString()}
              fullWidth
              size="small"
              slotProps={{ input: { readOnly: true } }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {/* ข้อมูลงบประมาณ (แสดงหลังบันทึก) */}
          {saved && budgetInfo && (
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
                ข้อมูลงบประมาณ
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="งบประมาณประจำปี (บาท)"
                    value={budgetInfo?.annualBudget?.toLocaleString()}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="ค่าใช้จ่ายที่เบิกจ่ายไปแล้ว (บาท)"
                    value={budgetInfo?.expensesDisbursed?.toLocaleString()}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="ค่าใช้จ่ายที่ตั้งเบิก (บาท)"
                    value={budgetInfo?.expensesAdvancePayment?.toLocaleString()}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="งบประมาณคงเหลือ (บาท)"
                    value={budgetInfo?.remainingBudget?.toLocaleString()}
                    fullWidth
                    size="small"
                    slotProps={{ input: { readOnly: true } }}
                    sx={{
                      "& .MuiInputBase-input": {
                        color:
                          budgetInfo?.remainingBudget < 0
                            ? "error.main"
                            : "text.primary",
                        fontWeight: 600,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
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
          ปิดหน้าต่าง
        </Button>
        {canEdit && (
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
            บันทึกค่าใช้จ่าย
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
