import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import ExpertForm from "./ExpertForm";
import { Expert } from "@models/expert";


interface ExpertDialogProps {
  open: boolean;
  mode: "add" | "view" | "edit";
  expert?: Expert;
  onClose: () => void;
  onSave: (expert: Expert) => void;
}


export default function ExpertDialog({
  open,
  mode,
  expert,
  onClose,
  onSave,
}: ExpertDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Expert>({
    id:0,
    idCard: "",
    prefix: 0,
    firstName: "",
    lastName: "",
    phone: "",
    mobile: "",
    email: "",
    educations: [],
    trainings: [],
    workExperiences: [],
    cvFile: "",
    idCardAddress: {
      houseNo: "",
      moo: "",
      soi: "",
      road: "",
      subDistrict: 0,
      district: 0,
      province: 0,
      postalCode: "",
    },
    contactAddress: {
      useIdCardAddress: false,
      houseNo: "",
      moo: "",
      soi: "",
      road: "",
      subDistrict: 0,
      district: 0,
      province: 0,
      postalCode: "",
    },
    bankAccount: [],
    userId:  null,
  });

  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    if (expert) {
      setFormData(expert);
    } else {
      setFormData({
        idCard: "",
        prefix: 0,
        firstName: "",
        lastName: "",
        phone: "",
        mobile: "",
        email: "",
        educations: [],
        trainings: [],
        workExperiences: [],
        cvFile: "",
        idCardAddress: {
          houseNo: "",
          moo: "",
          soi: "",
          road: "",
          subDistrict: 0,
          district: 0,
          province: 0,
          postalCode: "",
        },
        contactAddress: {
          useIdCardAddress: false,
          houseNo: "",
          moo: "",
          soi: "",
          road: "",
          subDistrict: 0,
          district: 0,
          province: 0,
          postalCode: "",
        },
        bankAccount: [],
        userId: null,
      });
      setSelectedFile(null);
    }
  }, [expert, open]);

  const handleChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof Expert] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleUseIdCardAddress = (checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        contactAddress: {
          ...prev.idCardAddress,
          useIdCardAddress: true,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        contactAddress: {
          ...prev.contactAddress,
          useIdCardAddress: false,
        },
      }));
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      handleChange("cvFile", file.name);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  const isReadOnly = mode === "view";
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
        <PersonIcon sx={{ fontSize: 28 }} />
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

      <DialogContent dividers sx={{ p: 0 }}>
        <ExpertForm
          formData={formData}
          mode={mode}
          isReadOnly={isReadOnly}
          onFormDataChange={handleChange}
          onUseIdCardAddress={handleUseIdCardAddress}
          onFileChange={handleFileChange}
          selectedFile={selectedFile}
          onEducationListChange={(list) => {
            setFormData((prev) => ({ ...prev, educations: list }));
          }}
          onTrainingListChange={(list) => {
            setFormData((prev) => ({ ...prev, trainings: list }));
          }}
          onWorkExperienceListChange={(list) => {
            setFormData((prev) => ({ ...prev, workExperiences: list }));
          }}
          onBankAccountListChange={(list) => {
            setFormData((prev) => ({ ...prev, bankAccount: list }));
          }}
          initialEducationList={formData.educations || []}
          initialTrainingList={formData.trainings || []}
          initialWorkExperienceList={formData.workExperiences || []}
          initialBankAccountList={formData.bankAccount || []}
        />
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

