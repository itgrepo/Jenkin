import { Role, UserInfo } from "@models/auth";
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
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import { useEffect, useState, ChangeEvent } from "react";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import { stringAvatar } from "@utils/index";
import { showWarning } from "./Swal";
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
  marginTop: 20,
  border: "4px solid rgba(25, 118, 210, 0.2)",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
}));

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (
    profile: UserInfo & { password?: string; currentPassword?: string }
  ) => void;
  profile?: UserInfo | null;
}

export default function UserManagementDialog({
  open,
  onClose,
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const actionOptions = ["create", "list", "edit", "delete"] as const;
  const authorizeOptions = [1, 2, 3] as const;
  const defaultRoleOptions: Role[] = [
    { id: 1, name: "Super Admin" },
    { id: 3, name: "เจ้าหน้าที่" },
    { id: 5, name: "ฝบ." },
    { id: 4, name: "ผก." },
    { id: 2, name: "ผอ." },
    { id: 6, name: "ผู้ประกอบการ." },
  ];
  const [roles] = useState<Role[]>(defaultRoleOptions);

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

    if ((password || confirmPassword) && password !== confirmPassword) {
      return false;
    }

    return true;
  };

  const handleSubmit = () => {

  };

  const handleProfileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showWarning("File too large", "Please select a file smaller than 5MB");
        return;
      }
      // Handle file upload logic here
    }
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
                onChange={handleProfileUpload}
              />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Form Fields */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <StyledTextField
              label={t("username")}
              fullWidth
              margin="normal"
              value={data.username}
              onChange={(e) => setData({ ...data, username: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <StyledTextField
              label={t("email")}
              fullWidth
              margin="normal"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <StyledTextField
              label={t("firstName")}
              fullWidth
              margin="normal"
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
            />
          </Box>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <StyledTextField
              label={t("lastName")}
              fullWidth
              margin="normal"
              value={data.name_en}
              onChange={(e) => setData({ ...data, name_en: e.target.value })}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <StyledTextField
              label={t("newPassword")}
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Box>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <StyledTextField
              label={t("confirmNewPassword")}
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              error={password !== confirmPassword}
              helperText={
                password && confirmPassword && password !== confirmPassword
                  ? t("passwordMismatch")
                  : ""
              }
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </Box>
          <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
            <FormControl fullWidth>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                label="Role"
                value={data.role?.id ?? ""}
                onChange={(e) =>
                  setData({ ...data, role: { id: Number(e.target.value), name: "" } })
                }
              >
                {roles?.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        {data?.role?.id !== 1 && (
          <>
            {/* Action / Authorize / User Group */}
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Action Permissions
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ flex: "1 1 calc(50% - 8px)", minWidth: 250 }}>
                <FormControl fullWidth>
                  <InputLabel id="authorize-label">Authorize</InputLabel>
                  <Select
                    labelId="authorize-label"
                    label="Authorize"
                    value={data.state ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        state: Number(e.target.value),
                      })
                    }
                  >
                    {authorizeOptions.map((lvl) => (
                      <MenuItem
                        key={lvl}
                        value={lvl}
                      >{`Approve ${lvl}`}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: "1 1 100%", minWidth: 250 }}>
                <FormControl
                  component="fieldset"
                  variant="standard"
                  sx={{ width: "100%" }}
                >
                  <FormGroup row>
                    {actionOptions.map((opt) => (
                      <FormControlLabel
                        key={opt}
                        control={
                          <Checkbox
                            checked={Boolean(
                              (data.params as any)?.[opt]
                            )}
                            onChange={(e) => {
                              const updated = {
                                ...(data.params as any || {}),
                              } as any;
                              updated[opt] = e.target.checked;
                              setData({ ...data, params: updated });
                            }}
                          />
                        }
                        label={opt}
                      />
                    ))}
                  </FormGroup>
                </FormControl>
              </Box>
            </Box>
          </>
        )}

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
