import { UserInfo } from "@models/auth";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Avatar,
  IconButton,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { stringAvatar } from "@utils/index";
import { useTranslation } from "react-i18next";
import { styled } from "@mui/material/styles";

const StyledDialog = styled(Dialog)(() => ({
  "& .MuiDialog-paper": {
    borderRadius: 16,
    maxWidth: 600,
    width: "100%",
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: "#fff",
  textAlign: "center",
  fontWeight: 600,
  "& .MuiTypography-root": {
    fontWeight: 600,
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  padding: "8px 24px",
  fontWeight: 600,
  textTransform: "none",
  "&.MuiButton-contained": {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 6px 16px rgba(25, 118, 210, 0.4)",
    },
  },
}));

const ProfileAvatar = styled(Avatar)(() => ({
  width: 100,
  height: 100,
  marginTop:20,
  border: "4px solid rgba(25, 118, 210, 0.2)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
}));

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (
    profile: UserInfo 
  ) => void;
  profile?: UserInfo | null;
}

export default function ProfileDialog({
  open,
  onClose,
  onSave,
  profile,
}: Props) {
  const defaultProfile: UserInfo = {
    username: "",
    email: "",
    name: "",
    name_en: "",
    state: 2,
    role: { id: 3, name: "เจ้าหน้าที่" },
  };
  const { t } = useTranslation();
  const [data, setData] = useState<UserInfo>(defaultProfile);

  useEffect(() => {
    if (profile) {
      setData(profile);
    } else {
      setData(defaultProfile);
    }
  }, [profile]);

  const isValid = () => {
    if (
      !data.username.trim()
    ) {
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!isValid()) return;

    onSave(data);
  };

  return (
    <StyledDialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <StyledDialogTitle>
        {profile?.id ? t("editProfile") : t("addUser")}
      </StyledDialogTitle>
      <DialogContent sx={{ p: 3 }}>
        {/* Profile Picture Section */}
        <Box display="flex" justifyContent="center" mb={3}>
          <Box position="relative" display="inline-block">
            <ProfileAvatar
              src={data?.picture || undefined}
              {...(!data?.picture &&
                stringAvatar(data?.name + " " + data?.name_en))}
            />
            <IconButton
              component="label"
              size="small"
              sx={{
                position: "absolute",
                bottom: 0,
                right: 0,
                bgcolor: "primary.main",
                color: "#fff",
                border: "2px solid #fff",
                "&:hover": { 
                  bgcolor: "primary.dark",
                  transform: "scale(1.1)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              <PhotoCamera sx={{ fontSize: 16 }} />
              <input
                type="file"
                accept="image/*"
                hidden
              />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 250 }}>
            <StyledTextField
              label={t("username")}
              fullWidth
              margin="normal"
              value={data.username}
              onChange={(e) => setData({ ...data, username: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 250 }}>
            <StyledTextField
              label={t("email")}
              fullWidth
              margin="normal"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 250 }}>
            <StyledTextField
              label={t("firstName")}
              fullWidth
              margin="normal"
                  value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 250 }}>
            <StyledTextField
              label={t("lastName")}
              fullWidth
              margin="normal"
              value={data.name_en}
              onChange={(e) => setData({ ...data, name_en: e.target.value })}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Change Password (Optional)
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 100%' }}>
            <StyledTextField
              label={t("currentPassword")}
              type="password"
              fullWidth
              margin="normal"
              value={data.passwordHash}
              onChange={(e) => setData({ ...data, passwordHash: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 250 }}>
            <StyledTextField
              label={t("newPassword")}
              type="password"
              fullWidth
              margin="normal"
              value={data.password}
              onChange={(e) => setData({ ...data, password: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: '1 1 calc(50% - 8px)', minWidth: 250 }}>
            <StyledTextField
              label={t("confirmNewPassword")}
              type="password"
              fullWidth
              margin="normal"
              value={data.password}
              error={data.password !== data.passwordHash}
              helperText={
                data.password && data.passwordHash && data.password !== data.passwordHash
                  ? t("passwordMismatch")
                  : ""
              }
              onChange={(e) => setData({ ...data, password: e.target.value })}
            />
          </Box>
        </Box>

        <StyledTextField
          label={t("params")}
          fullWidth
          multiline
          minRows={3}
          margin="normal"
          value={data.params}
          onChange={(e) => setData({ ...data, params: e.target.value })}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <StyledButton onClick={onClose} variant="outlined">
          {t("cancel")}
        </StyledButton>
        <StyledButton
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid()}
        >
          {t("save")}
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
}
