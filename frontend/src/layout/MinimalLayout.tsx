import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  ClickAwayListener,
  IconButton,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  ThemeProvider,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { ThemeContext } from "@theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { getAppNameByLang, stringAvatarText } from "@utils/index";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { useAuth } from "@auth/useAuth";
import { alpha, createTheme, useTheme } from "@mui/material/styles";
import Transitions from "@components/Transitions";

interface MinimalLayoutProps {
  children: React.ReactNode;
}

const MinimalLayout: React.FC<MinimalLayoutProps> = ({ children }) => {
  const { appSettings } = useContext(ThemeContext);
  const { i18n, t } = useTranslation();
  const { logout } = useAuth();
  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLLabelElement | null>(null);
  const user = useSelector((state: RootState) => state?.auth?.user);
  const themeMobile = useTheme();
  const isMobile = useMediaQuery(themeMobile.breakpoints.down("sm"));

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (
      anchorRef.current &&
      event.target instanceof Node &&
      anchorRef.current.contains(event.target)
    ) {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (appSettings?.appName) {
      document.title = getAppNameByLang(appSettings, i18n.language);
    }
  }, [appSettings, i18n.language]);

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
          main: appSettings.primaryColor || "#1A237E",
        },
      },
    });
  }, [i18n.language, appSettings]);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* Navbar */}
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <img
                src={appSettings.logo || ""}
                alt="logo"
                style={{ width: 100, marginRight: 12 }}
              />
              {!isMobile && (
                <Typography
                  variant="h6"
                  sx={{ color: "primary.main", fontWeight: "bold" }}
                >
                  {t("appName")}
                </Typography>
              )}
            </Box>
            {!isMobile && (
              <Box>
                <Button component={RouterLink} to="/" color="inherit">
                  {t("homepage")}
                </Button>
                <Button component={RouterLink} to="/contact" color="inherit">
                  {t("contactpage")}
                </Button>

                <ToggleButtonGroup
                  exclusive
                  value={i18n.language}
                  onChange={(_, newLang) => newLang && changeLanguage(newLang)}
                  size="small"
                  color="primary"
                >
                  <ToggleButton value="th">🇹🇭 ไทย</ToggleButton>
                  <ToggleButton value="en">🇺🇸 EN</ToggleButton>
                </ToggleButtonGroup>
              </Box>
            )}

            {!isAuthenticated ? (
              <Button
                component={RouterLink}
                to="/login"
                variant="contained"
                sx={{ ml: 2 }}
              >
                {t("loginpage")}
              </Button>
            ) : (
              <Box position="relative" display="inline-block">
                <IconButton
                  component="label"
                  size="small"
                  onClick={() => setOpen(true)}
                  ref={anchorRef}
                  aria-haspopup="true"
                >
                  <Avatar
                    sx={{ width: 50, height: 50 }}
                    src={user?.picture || undefined}
                    {...(!user?.picture &&
                      stringAvatarText(user?.name + " " + user?.name_en))}
                  />
                </IconButton>

                <Popper
                  placement="bottom-end"
                  open={open}
                  anchorEl={anchorRef.current}
                  transition
                  disablePortal
                  modifiers={[{ name: "offset", options: { offset: [0, 9] } }]}
                  sx={{ zIndex: theme.zIndex.appBar + 1 }}
                >
                  {({ TransitionProps }) => (
                    <Transitions type="fade" in={open} {...TransitionProps}>
                      <ClickAwayListener
                        onClickAway={(event) => {
                          if (
                            !anchorRef.current?.contains(event.target as Node)
                          ) {
                            handleClose(event as any);
                          }
                        }}
                      >
                        <Paper
                          sx={{
                            minWidth: 200,
                            boxShadow: `0px 2px 8px ${alpha(
                              theme.palette.grey[900],
                              0.15
                            )}`,
                            borderRadius: 1,
                            p: 1,
                          }}
                        >
                          <MenuList>
                            <MenuItem
                              component={RouterLink}
                              to="/orders"
                              onClick={() => setOpen(false)}
                            >
                              <AdminPanelSettingsIcon
                                fontSize="small"
                                sx={{ color: "primary.main", mr: 1 }}
                              />
                              {t("mainadmin")}
                            </MenuItem>
                            <MenuItem
                              onClick={() => {
                                setOpen(false);
                                logout();
                              }}
                            >
                              <PowerSettingsNewIcon
                                fontSize="small"
                                sx={{ color: "primary.main", mr: 1 }}
                              />
                              {t("logout")}
                            </MenuItem>
                          </MenuList>
                        </Paper>
                      </ClickAwayListener>
                    </Transitions>
                  )}
                </Popper>
              </Box>
            )}
          </Toolbar>
        </AppBar>

        {/* Main content */}
        <Box sx={{ flexGrow: 1 }}>{children}</Box>

        {/* Footer */}
        <Box sx={{ bgcolor: "primary.main", py: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "#ffffff" }}>
            © 2025 {getAppNameByLang(appSettings, i18n.language)}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default MinimalLayout;
