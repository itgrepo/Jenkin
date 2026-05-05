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
  Grid,
  Link,
  Divider,
  Stack,
  ButtonProps,
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
import MenuBookIcon from "@mui/icons-material/MenuBook";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import LocalPostOfficeIcon from "@mui/icons-material/LocalPostOffice";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import { Link as RouterLink } from "react-router-dom";

import tisiLogo from "@assets/images/tisi.png";
import qrcode from "@assets/images/qrcode.png";
// ---------- Styled ----------
const Root = styled(Box)(() => ({
  minHeight: "100vh",
  position: "relative",
  background: "linear-gradient(180deg, #f3f7fb 0%, #e9eff7 40%, #f3f7fb 100%)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at 20% 10%, rgba(25,118,210,0.08) 0, transparent 40%) , radial-gradient(circle at 80% 90%, rgba(25,118,210,0.08) 0, transparent 35%)",
  },
}));

const LeftPane = styled(Box)(({ theme }) => ({
  display: "flex",
  minHeight: "100vh",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(4, 2),
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: 440,
  borderRadius: 16,
  padding: theme.spacing(4),
  boxShadow: "0 24px 60px rgba(18, 38, 63, 0.12)",
  border: "1px solid rgba(0,0,0,0.06)",
  backgroundColor: "#fff",
}));

const StyledTextField = styled(TextField)(() => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 12,
    backgroundColor: "#fff",
  },
}));

const StyledButton = styled(Button)<ButtonProps>(() => ({
  borderRadius: 12,
  padding: "12px 24px",
  fontSize: "1rem",
  fontWeight: 700,
  textTransform: "none",
}))as typeof Button;

const LanguageToggle = styled(ToggleButtonGroup)(() => ({
  backgroundColor: "rgba(255,255,255,0.7)",
  borderRadius: 10,
  "& .MuiToggleButton-root": {
    border: "none",
    padding: "6px 12px",
  },
}));

const RightPane = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: theme.palette.primary.main,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(6, 4),
}));

const RightCard = styled(Box)(({ theme }) => ({
  width: "100%",
  maxWidth: 420,
  backgroundColor: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 16,
  padding: theme.spacing(4),
}));

// ---------- Component ----------
export default function LoginUserPage() {
  const [username, setUsername] = useState("0105546094094");
  const [password, setPassword] = useState("xxxx");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { getProfileSSOUser } = useAuth();

  const { t, i18n } = useTranslation();
  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);

  const { appSettings } = useContext(ThemeContext);
  const auth = useSelector((state: RootState) => state?.auth);

  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate username
    if (!username.trim()) {
      setUsernameError("กรุณากรอกชื่อผู้ใช้งาน");
      isValid = false;
    } else if (username.trim().length < 3) {
      setUsernameError("ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร");
      isValid = false;
    } else {
      setUsernameError("");
    }

    // Validate password
    if (!password.trim()) {
      setPasswordError("กรุณากรอกรหัสผ่าน");
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      isValid = false;
    } else {
      setPasswordError("");
    }

    return isValid;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate before submit
    if (!validateForm()) {
      return;
    }

    try {
      await getProfileSSOUser(username.trim());
      // สามารถเก็บ remember/verifyEmail ส่งต่อ backend ตามต้องการ
    } catch (e: any) {
      let errorMessage =
        e?.response?.data?.message || e.message || "Unknown error";
      if (e?.response?.status === 401) errorMessage = e?.response?.data?.error||t("login_error");
      showError(t("login_error_title"), errorMessage);
    }
  };

  const theme = useMemo(
    () =>
      createTheme({
        typography: {
          fontFamily:
            i18n.language === "lo"
              ? "Saysettha, sans-serif"
              : "Noto Sans Thai, sans-serif",
        },
        palette: {
          mode: appSettings.darkMode ? "dark" : "light",
          primary: { main: appSettings.primaryColor || "#1976d2" },
          secondary: { main: "#0b6bbf" },
        },
      }),
    [i18n.language, appSettings]
  );

  return (
    <ThemeProvider theme={theme}>
      <Root>
        {/* สลับภาษา */}
        <Box sx={{ position: "fixed", top: 16, right: 24, zIndex: 2 }}>
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

        <Grid container>
          {/* LEFT: Form */}
          <Grid size={{ xs: 12, md: 6 }}>
            <LeftPane>
              <Container maxWidth="sm" disableGutters>
                {auth?.loading && <BackdropLoader show={auth?.loading} />}

                <LoginCard elevation={0}>
                  {/* โลโก้ + ชื่อ */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box>
                      <Typography variant="h5" color="primary" fontWeight={800}>
                        บริการอิเล็กทรอนิกส์ สมอ.
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <form onSubmit={handleLogin}>
                    <StyledTextField
                      label="ชื่อผู้ใช้งาน (TaxID หรือ Passport No.)"
                      type="text"
                      fullWidth
                      margin="normal"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (usernameError) setUsernameError("");
                      }}
                      error={!!usernameError}
                      helperText={usernameError}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <StyledTextField
                      label="รหัสผ่าน"
                      type={showPassword ? "text" : "password"}
                      fullWidth
                      margin="normal"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError("");
                      }}
                      error={!!passwordError}
                      helperText={passwordError}
                      required
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

                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      mt={1}
                      mb={1}
                      flexDirection={{ xs: "column", sm: "row" }}
                      gap={1}
                    >
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <PersonIcon fontSize="small" /> ลืมผู้ใช้งาน?
                      </Link>

                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LocalPostOfficeIcon fontSize="small" /> ตรวจสอบอีเมล
                      </Link>

                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <LockIcon fontSize="small" /> ลืมรหัสผ่าน?
                      </Link>
                    </Box>

                    <StyledButton
                      variant="contained"
                      color="primary"
                      type="submit"
                      fullWidth
                    //  disabled={!username.trim() || !password.trim() || auth?.loading}
                      sx={{ mt: 1, mb: 1.5 }}
                    >
                      {auth?.loading ? "กำลังเข้าสู่ระบบ..." : t("login")}
                    </StyledButton>

                    <Divider sx={{ my: 2 }}>{t("or")}</Divider>

                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <StyledButton
                        fullWidth
                        variant="contained"
                        component={RouterLink}
                        to="/login-iindustry"
                        sx={{
                          background:
                            "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)",
                        }}
                      >
                        {t("login_with_iindustry")}
                      </StyledButton>
                    </Stack>

                    <Box textAlign="center" sx={{ my: 2 }}>
                      <Link component="button" type="button" underline="hover">
                        <strong>ลงทะเบียนสำหรับผู้ประกอบการ</strong>
                      </Link>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      mt={2}
                    >
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <MenuBookIcon fontSize="small" /> คู่มือการใช้งาน
                      </Link>
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      mt={1}
                    >
                      <Link
                        component="button"
                        type="button"
                        underline="hover"
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <QuestionMarkIcon fontSize="small" /> พบปัญหาการใช้งาน
                      </Link>
                    </Box>
                  </form>

                  {/* (ไม่บังคับ) Demo accounts */}
                  {/* <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                      borderRadius: 2,
                      backgroundColor: "rgba(25,118,210,0.06)",
                      border: "1px solid rgba(25,118,210,0.22)",
                    }}
                  >
                    <Typography variant="caption" display="block">
                      <strong>Demo:</strong> 0105546094094
                    </Typography>
                  </Alert> */}
                </LoginCard>
              </Container>
            </LeftPane>
          </Grid>

          {/* RIGHT: Blue info panel */}
          <Grid
            size={{ xs: 12, md: 6 }}
            sx={{ display: { xs: "none", md: "block" } }}
          >
            <RightPane>
              <RightCard>
                <Box textAlign="center" mb={2}>
                  <img
                    src={tisiLogo}
                    alt="Logo"
                    style={{ width: 65, height: 65 }}
                  />

                  <Typography variant="h4" fontWeight={900} mt={0}>
                    TISI
                  </Typography>
                  <Typography>@LINE</Typography>
                </Box>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    mx: "auto",
                    borderRadius: 2,
                    overflow: "hidden",
                    bgcolor: "rgba(255,255,255,0.95)",
                  }}
                >
                  <img
                    src={qrcode}
                    alt="TISI LINE QR"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.3)", my: 2 }} />

                <Typography
                  variant="body2"
                  sx={{ opacity: 0.9, lineHeight: 1.9 }}
                >
                  ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร
                  <br />
                  โทร. 0 2430 6834 ต่อ 2450, 2451
                  <br />
                  e-Mail : nsw@tisi.mail.go.th
                </Typography>

                <Box mt={2}>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.9, lineHeight: 1.9 }}
                  >
                    กองควบคุมมาตรฐาน
                    <br />
                    โทร. 0 2430 6821 ต่อ 1002, 1003
                  </Typography>
                </Box>

                <Box mt={2}>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.9, lineHeight: 1.9 }}
                  >
                    สำนักงานคณะกรรมการมาตรฐานผลิตภัณฑ์อุตสาหกรรม
                    <br />
                    โทร. 024306825 ต่อ 1402
                  </Typography>
                </Box>

                <Box mt={2}>
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.9, lineHeight: 1.9 }}
                  >
                    กรณีนำเข้าขปริมาณน้อย (กรณียกเลิก EXEMPTS) อ่านประกาศ
                    <br />
                    โทร. 024306815 ต่อ 3001 – 3003
                  </Typography>
                </Box>
              </RightCard>
            </RightPane>
          </Grid>
        </Grid>
      </Root>
    </ThemeProvider>
  );
}
