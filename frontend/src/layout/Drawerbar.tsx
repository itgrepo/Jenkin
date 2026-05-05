import React, { useState } from "react";
import { styled } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import LogoutIcon from "@mui/icons-material/Logout";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import ListItemText from "@mui/material/ListItemText";
import { Link, useLocation } from "react-router-dom";
import { getRoutes } from "../data/routes";
import { useAuth } from "@auth/useAuth";
import {
  Avatar,
  Box,
  IconButton,
  Typography,
  Chip,
  Tooltip,
} from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { stringAvatar } from "@utils/index";
import EditIcon from "@mui/icons-material/Edit";
import { UserInfo } from "@models/auth";
import ProfileDialog from "@components/ProfileDialog";
import { showConfirm, showError, showSuccess } from "@components/Swal";
import { useTranslation } from "react-i18next";
import useIsMobile from "@hooks/useIsMobile";

const drawerWidth = Number(import.meta.env.VITE_APP_DRAWERWIDTH) || 280;
// ★ กำหนดความกว้างตอนย่อให้เหลือไอคอน
const miniWidth = Number(import.meta.env.VITE_APP_DRAWERWIDTH_MIN) || 72;

interface DrawerbarProps {
  open: boolean;
  onDrawerToggle: () => void;
  isDrawerLocked?: boolean;
  onDrawerLockToggle?: (locked: boolean) => void;
}

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

// ★ Drawer แบบ mini-variant เมื่อ open=false (เฉพาะ desktop)
const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "variantMode",
})<{ open?: boolean; variantMode?: "desktop" | "mobile" }>(
  ({ theme, open, variantMode }) => {
    const width =
      variantMode === "desktop"
        ? open
          ? drawerWidth
          : miniWidth
        : drawerWidth;
    return {
      width,
      flexShrink: 0,
      whiteSpace: "nowrap",
      "& .MuiDrawer-paper": {
        width,
        boxSizing: "border-box",
        overflowX: "hidden",
        overflowY: "auto",
        borderRight: "1px solid rgba(0, 0, 0, 0.08)",
        background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, ${theme.palette.grey[50]} 100%)`,
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.08)",
        transition: theme.transitions.create("width", {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.shorter,
        }),
      },
    };
  }
);

const UserInfoContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 2),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: "#fff",
  position: "relative",
  borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
  "&::before": {
    content: '""',
    position: "absolute",
    inset: 0,
    background:
      'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>\')',
    opacity: 0.2,
  },
}));

const Drawerbar: React.FC<DrawerbarProps> = ({
  open,
  onDrawerToggle,
  isDrawerLocked = false,
  onDrawerLockToggle,
}) => {
  const { logout, logoutUser, checkSession } = useAuth();
  const user = useSelector((state: RootState) => state?.auth?.user);
  const roleId = user?.role?.id ?? 0;
  const { t } = useTranslation();

  const location = useLocation();
  const isMobile = useIsMobile();

  const routes = getRoutes(t, roleId, location.pathname);

  const [openProfileDialog, setOpenProfileDialog] = useState(false);

  const handleMenuClick = () => {
    if (isMobile) {
      // mobile: ปิดทั้งแผงเหมือนเดิม
      !isDrawerLocked && onDrawerToggle();
    } else {
      // desktop: mini variant ไม่ต้องปิด
      if (!open && !isDrawerLocked) {
        // ย่ออยู่แล้ว ไม่ต้องทำอะไร
      }
    }
  };

  const handleLockToggle = () => {
    onDrawerLockToggle?.(!isDrawerLocked);
  };

  const handleSave = async (userInfo: UserInfo) => {
    const isEdit = !!userInfo.id;
    const confirm = await showConfirm(
      isEdit ? t("confirm_edit") : t("confirm_add"),
      isEdit ? t("want_edit") : t("want_add")
    );
    if (!confirm.isConfirmed) return;

    try {
      if (userInfo?.id) {
        // await updateProfile(userInfo);
        showSuccess(t("process"), t("editProfieSuccess"));
      }
      setOpenProfileDialog(false);
      checkSession();
    } catch (error) {
      showError(t("error"), t("editProfieFails"));
    }
  };

  // ★ flag โหมด drawer: desktop → mini variant, mobile → temporary
  const variantMode: "desktop" | "mobile" = isMobile ? "mobile" : "desktop";

  return (
    <Drawer
      //open={isMobile ? open : true} // desktop เปิดไว้ตลอดเพื่อรองรับ mini; mobile ควบคุมด้วย open
      // @ts-ignore – ส่ง open เข้า styled
      open={open}
      onClose={isDrawerLocked ? undefined : onDrawerToggle}
      variant={isMobile ? "temporary" : "permanent"}
      variantMode={variantMode} // custom prop for styled
      // ★ บน desktop ใช้ open เพื่อกำหนดความกว้าง (เต็ม/mini)
      anchor="left"
      ModalProps={{ keepMounted: true }}
      sx={{
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
        },
        "& .MuiDrawer-paper": {
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: "4px 0 8px -2px rgba(0, 0, 0, 0.1)",
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header */}
        <Box>
          <DrawerHeader>
            {/* ★ ย่อ header ตอน mini */}
            {!isMobile && !open ? (
              <Box
                sx={{
                  height: 72,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "primary.main",
                  color: "#fff",
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    border: "2px solid rgba(255,255,255,0.5)",
                  }}
                  src={user?.picture || undefined}
                  {...(!user?.picture &&
                    stringAvatar(user?.name || ""))}
                />
              </Box>
            ) : (
              <UserInfoContainer>
                <Box position="relative" display="inline-block" sx={{ mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      border: "3px solid rgba(255, 255, 255, 0.3)",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    }}
                    src={user?.picture || undefined}
                    {...(!user?.picture &&
                      stringAvatar(user?.name || ""))}
                  />
                  <IconButton
                    component="label"
                    size="small"
                    sx={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      bgcolor: "rgba(255, 255, 255, 0.9)",
                      border: "2px solid #fff",
                      color: "primary.main",
                      "&:hover": {
                        bgcolor: "rgba(255, 255, 255, 1)",
                        transform: "scale(1.1)",
                      },
                      transition: "all 0.2s ease-in-out",
                    }}
                    onClick={() => setOpenProfileDialog(true)}
                  >
                    <EditIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>

                {/* Lock Button */}
                <Box
                  sx={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}
                >
                  <Tooltip
                    title={isDrawerLocked ? "ปลดล็อค Drawer" : "ล็อค Drawer"}
                    placement="left"
                    arrow
                  >
                    <IconButton
                      onClick={handleLockToggle}
                      sx={{
                        bgcolor: isDrawerLocked
                          ? "rgba(255, 255, 255, 0.2)"
                          : "rgba(255, 255, 255, 0.1)",
                        color: "#fff",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        backdropFilter: "blur(10px)",
                        "&:hover": {
                          bgcolor: isDrawerLocked
                            ? "rgba(255, 255, 255, 0.3)"
                            : "rgba(255, 255, 255, 0.2)",
                          transform: "scale(1.1)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                        },
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        width: 40,
                        height: 40,
                      }}
                    >
                      {isDrawerLocked ? (
                        <LockIcon sx={{ fontSize: 18 }} />
                      ) : (
                        <LockOpenIcon sx={{ fontSize: 18 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography
                  sx={{
                    mb: 0.5,
                    fontSize: 16,
                    fontWeight: 600,
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {user?.name || ""}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 1, opacity: 0.9, fontSize: "0.875rem" }}
                >
                  {user?.username}
                </Typography>
                <Chip
                  label={user?.role?.name || "User"}
                  size="small"
                  sx={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    fontSize: "0.75rem",
                  }}
                />
              </UserInfoContainer>
            )}
          </DrawerHeader>

          <Divider
            sx={{
              borderColor: "rgba(0, 0, 0, 0.08)",
              mb: 1,
              margin: "8px 16px",
              opacity: 0.6,
            }}
          />

          <List sx={{ pt: 2 }}>
            {isDrawerLocked && (
              <Box
                sx={{
                  mx: open ? 2 : 1,
                  mb: 1,
                  p: open ? 1.5 : 1,
                  borderRadius: 2,
                  bgcolor: "rgba(25, 118, 210, 0.08)",
                  border: "1px solid rgba(25, 118, 210, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: open ? 1 : 0,
                  justifyContent: open ? "flex-start" : "center",
                }}
              >
                <LockIcon sx={{ fontSize: 16, color: "primary.main" }} />
                {open && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "primary.main",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  >
                    Drawer ถูกล็อค
                  </Typography>
                )}
              </Box>
            )}
            {!open && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  py: 1.5,
                  mb: 1,
                  px: 1,
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    border: "3px solid rgba(255, 255, 255, 0.6)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      transform: "scale(1.05)",
                      boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
                      borderColor: "rgba(255, 255, 255, 0.9)",
                    },
                  }}
                  src={user?.picture || undefined}
                  {...(!user?.picture && stringAvatar(user?.name || ""))}
                />
              </Box>
            )}

            {routes
              ?.filter((item) => item.enabled !== false && item.showInDrawer === true)
              .map((item, index) => {
                const isSelected = location.pathname === item.path;
                return (
                  <ListItem
                    key={index}
                    disablePadding
                    sx={{ display: "block" }}
                  >
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      onClick={() => handleMenuClick()}
                      selected={isSelected}
                      sx={{
                        margin: open ? "4px 12px" : "8px 8px",
                        borderRadius: 12,
                        transition: "all 0.2s ease-in-out",
                        width: open ? "calc(100% - 24px)" : "calc(100% - 16px)",
                        justifyContent: open ? "flex-start" : "center", // ★ กลางเมื่อ mini
                        "&:hover": {
                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                          transform: open ? "translateX(4px)" : "none",
                          boxShadow: open
                            ? "0 2px 8px rgba(25, 118, 210, 0.15)"
                            : "none",
                        },
                        "&.Mui-selected": {
                          backgroundColor: "rgba(25, 118, 210, 0.12)",
                          boxShadow: open
                            ? "0 2px 8px rgba(25, 118, 210, 0.2)"
                            : "none",
                          "&:hover": {
                            backgroundColor: "rgba(25, 118, 210, 0.16)",
                            boxShadow: open
                              ? "0 4px 12px rgba(25, 118, 210, 0.25)"
                              : "none",
                          },
                          "& .MuiListItemIcon-root": {
                            color: "primary.main",
                          },
                        },
                        "& .MuiListItemIcon-root": {
                          color: isSelected ? "primary.main" : "text.secondary",
                          minWidth: 0, // ★ ลดระยะ icon
                          mr: open ? 2 : 0,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0 }}>
                        {item.icon && <item.icon />}
                      </ListItemIcon>

                      {/* ★ ซ่อนข้อความเมื่อ mini */}
                      {open && (
                        <ListItemText
                          primary={item.title}
                          slotProps={{
                            primary: {
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: "0.875rem",
                              whiteSpace: "normal",
                              noWrap: false,
                            },
                          }}
                          sx={{
                            ml: 1,
                            minWidth: 0,
                            flex: 1,
                            "& .MuiListItemText-primary": {
                              overflowWrap: "break-word",
                              wordWrap: "break-word",
                              wordBreak: "break-word",
                              maxWidth: "100%",
                              display: "block",
                            },
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </List>
        </Box>

        {/* Footer / Logout */}
        <Box sx={{ mt: "auto", pb: 2 }}>
          <Divider
            sx={{
              borderColor: "rgba(0, 0, 0, 0.08)",
              mb: 1,
              margin: "8px 16px",
              opacity: 0.6,
            }}
          />
          <List>
            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component="button"
                onClick={roleId === 6 ? logoutUser : logout}
                sx={{
                  margin: open ? "4px 12px" : "8px 8px",
                  borderRadius: 12,
                  transition: "all 0.2s ease-in-out",
                  width: open ? "calc(100% - 24px)" : "calc(100% - 16px)",
                  justifyContent: open ? "flex-start" : "center",
                  color: "error.main",
                  "&:hover": {
                    backgroundColor: "rgba(244, 67, 54, 0.08)",
                    transform: open ? "translateX(4px)" : "none",
                    boxShadow: open
                      ? "0 2px 8px rgba(244, 67, 54, 0.15)"
                      : "none",
                  },
                  "& .MuiListItemIcon-root": {
                    color: "error.main",
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 0 }}>
                  <LogoutIcon />
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary={t("logout")}
                    slotProps={{
                      primary: {
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        whiteSpace: "normal",
                        noWrap: false,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>

      {openProfileDialog && (
        <ProfileDialog
          open={openProfileDialog}
          onClose={() => setOpenProfileDialog(false)}
          onSave={handleSave}
          profile={user}
        />
      )}
    </Drawer>
  );
};

export default Drawerbar;
