import { useContext, useMemo, useState } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  Stack,
} from "@mui/material";
import { useAuth } from "@auth/useAuth";
import { showError } from "@components/Swal";
import BackdropLoader from "@components/BackdropLoader";
import { RootState } from "@store/index";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { ThemeContext } from "@theme/ThemeContext";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/material/styles";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import logoThaiId from "@assets/images/unnamed.png";

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.secondary.main} 100%)`,
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(2),
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='rgba(255,255,255,0.1)' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23grid)'/%3E%3C/svg%3E")`,
    opacity: 0.3,
  },
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: 24,
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  maxWidth: 400,
  width: "100%",
  position: "relative",
  zIndex: 1,
  animation: "slideUp 0.6s ease-out",
  "@keyframes slideUp": {
    "0%": {
      opacity: 0,
      transform: "translateY(30px)",
    },
    "100%": {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: "12px 24px",
  fontSize: "1rem",
  fontWeight: 600,
  textTransform: "none",
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
  transition: "all 0.3s ease-in-out",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 8px 20px rgba(25, 118, 210, 0.4)",
  },
}));

const LanguageToggle = styled(ToggleButtonGroup)(() => ({
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  borderRadius: 12,
  "& .MuiToggleButton-root": {
    color: "rgba(255, 255, 255, 0.8)",
    border: "none",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      color: "#fff",
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      color: "#fff",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.25)",
      },
    },
  },
}));

export default function LoginPage() {
  const [username, setUsername] = useState("jessadawoot@tisi.mail.go.th"); //เจ้าหน้าที่
  //const [username, setUsername] = useState("nuts@tisi.go.th"); //ผก
  //const [username, setUsername] = useState("santi@tisi.mail.go.th"); //ผอ
  const [password, setPassword] = useState("xxxxx");
  const [showPassword, setShowPassword] = useState(false);
  const { getProfileSSOAdmin } = useAuth();

  const { t, i18n } = useTranslation();
  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  const { appSettings } = useContext(ThemeContext);

  const auth = useSelector((state: RootState) => state?.auth);

  const startThaiDLogin = () => {
    // เปลี่ยน URL นี้ให้ตรงกับ backend ของคุณ
    window.location.href = "/api/auth/thaid/start";
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      // await login(username, password);
      await getProfileSSOAdmin(username);
    } catch (e: any) {
      let errorMessage =
        e?.response?.data?.message || e.message || "Unknown error";

      if (e?.response?.status === 401) {
        errorMessage = t("login_error");
      }

      showError(t("login_error_title"), errorMessage);
    }
  };

  const theme = useMemo(() => {
    return createTheme({
      typography: {
        fontFamily:
          i18n.language === "lo"
            ? "Saysettha, sans-serif"
            : "Noto Sans Thai, sans-serif",
      },
      palette: {
        mode: appSettings.darkMode ? "dark" : "light",
        primary: {
          main: appSettings.primaryColor,
        },
      },
    });
  }, [i18n.language, appSettings]);

  return (
    <ThemeProvider theme={theme}>
      <LoginContainer>
        {/* Language Toggle */}
        <Box
          sx={{
            position: "absolute",
            top: 20,
            right: 30,
            zIndex: 10,
          }}
        >
          <LanguageToggle
            exclusive
            value={i18n.language}
            onChange={(_, newLang) => newLang && changeLanguage(newLang)}
            size="small"
          >
            <ToggleButton value="th">🇹🇭 ไทย</ToggleButton>
            <ToggleButton value="en">🇺🇸 EN</ToggleButton>
          </LanguageToggle>
        </Box>

        <Container maxWidth="xs">
          {auth?.loading && <BackdropLoader show={auth?.loading} />}

          <LoginCard elevation={0}>
            {/* Logo */}
            {appSettings?.logo && (
              <Box display="flex" justifyContent="center" mb={3}>
                <img
                  src={appSettings.logo}
                  alt="Logo"
                  style={{
                    width: 100,
                    height: "auto",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                />
              </Box>
            )}

            {/* Welcome Text */}
            <Box textAlign="center" mb={4}>
              <Typography
                variant="h4"
                fontWeight="bold"
                gutterBottom
                sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("welcome")}
              </Typography>
            </Box>

            {/* Login Form */}
            <form onSubmit={handleLogin}>
              <StyledTextField
                label={t("login_username")}
                type="text"
                fullWidth
                margin="normal"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />

              <StyledTextField
                label={t("login_password")}
                type={showPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <VisibilityIcon />
                        ) : (
                          <VisibilityOffIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <StyledButton
                variant="contained"
                type="submit"
                fullWidth
                sx={{ mt: 3, mb: 2 }}
              >
                {t("login_btn")}
              </StyledButton>

              <Divider sx={{ my: 3 }}>{t("or")}</Divider>

              <Stack spacing={1} sx={{ mt: 1 }}>
                <StyledButton
                  fullWidth
                  variant="contained"
                  onClick={startThaiDLogin}
                  startIcon={
                    <img
                      src={logoThaiId}
                      alt="ThaiD"
                      style={{ width: 25, height: 25, borderRadius: 5 }}
                    />
                  }
                  sx={{
                    background:
                      "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)",
                  }}
                >
                  {t("login_with_thaid")}
                </StyledButton>
              </Stack>
            </form>

            {/* Demo Credentials */}
            <Alert
              severity="info"
              sx={{
                mt: 2,
                borderRadius: 2,
                backgroundColor: "rgba(25, 118, 210, 0.08)",
                border: "1px solid rgba(25, 118, 210, 0.2)",
              }}
            >
              <Typography variant="caption" display="block">
                <strong>Demo Accounts:</strong>
              </Typography>
              <Typography variant="caption" display="block">
                • เจ้าหน้าที่: jessadawoot@tisi.mail.go.th
              </Typography>
              <Typography variant="caption" display="block">
                • ผก.: nuts@tisi.go.th
              </Typography>
              <Typography variant="caption" display="block">
                • ผอ.: santi@tisi.mail.go.th
              </Typography>
            </Alert>
          </LoginCard>
        </Container>
      </LoginContainer>
    </ThemeProvider>
  );
}
