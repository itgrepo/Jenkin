import React, { useContext } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { styled } from "@mui/material/styles";
import { ThemeContext } from "@theme/ThemeContext";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import { stringAvatar } from "@utils/index";

const drawerWidth = import.meta.env.VITE_APP_DRAWERWIDTH || 280;

interface NavbarProps {
  open: boolean;
  onDrawerToggle: () => void;
  isDrawerLocked?: boolean;
}

interface StyledAppBarProps {
  open?: boolean;
}

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<StyledAppBarProps>(({ theme, open }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  color: "#fff",
  padding: theme.spacing(1),
  zIndex: theme.zIndex.drawer + 2,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"50\" cy=\"10\" r=\"0.5\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"10\" cy=\"60\" r=\"0.5\" fill=\"rgba(255,255,255,0.1)\"/><circle cx=\"90\" cy=\"40\" r=\"0.5\" fill=\"rgba(255,255,255,0.1)\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>')",
    opacity: 0.2,
  },
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(() => ({
  backgroundColor: "rgba(255, 255, 255, 0.12)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  borderRadius: 14,
  "& .MuiToggleButton-root": {
    color: "rgba(255, 255, 255, 0.85)",
    border: "none",
    borderRadius: 10,
    padding: "6px 12px",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      color: "#fff",
    },
    "&.Mui-selected": {
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      color: "#fff",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
      },
    },
  },
}));

const Navbar: React.FC<NavbarProps> = ({ onDrawerToggle, open, isDrawerLocked = false }) => {
  const { appSettings } = useContext(ThemeContext);
  const { i18n } = useTranslation();
  const changeLanguage = (lng: string) => i18n.changeLanguage(lng);
  const user = useSelector((state: RootState) => state?.auth?.user);

  return (
    <StyledAppBar position="fixed" elevation={0} open={open}>
      <Toolbar sx={{
        minHeight: { xs: 60, sm: 70 },
        px: { xs: 1, sm: 3 },
        py: { xs: 0.5, sm: 0 },
      }}>
        {/* Menu Button + Avatar (เมื่อย่อ drawer) */}
        {!isDrawerLocked && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mr: { xs: 1, sm: 2 } }}>
            {!open &&
              appSettings?.logo && (
                <Box
                  component="img"
                  src={appSettings.logo}
                  alt="Logo"
                  sx={{
                    height: { xs: 34, sm: 42 },
                    width: "auto",
                    ml: {xs:0,sm:-3},
                    filter: "brightness(0) invert(1)",
                    opacity: 0.95,
                    transition: "opacity 0.2s ease",
                    "&:hover": { opacity: 1 },
                  }}
                />
              )
            }
            <Tooltip title={open ? "ซ่อนเมนู" : "แสดงเมนู"} placement="bottom" arrow>
              <IconButton
                color="inherit"
                edge="start"
                onClick={onDrawerToggle}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.12)",
                  backdropFilter: "blur(10px)",
                  width: { xs: 38, sm: 42 },
                  height: { xs: 38, sm: 42 },
                  borderRadius: 2,
                  transition: "all 0.25s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    transform: "scale(1.05)",
                  },
                }}
              >
                <MenuIcon sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          {appSettings?.logo && open && (
            <Box
              component="img"
              src={appSettings.logo}
              alt="Logo"
              sx={{
                height: { xs: 34, sm: 42 },
                width: "auto",
                filter: "brightness(0) invert(1)",
                opacity: 0.95,
                transition: "opacity 0.2s ease",
                "&:hover": { opacity: 1 },
              }}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 } }}>
          {/* Language Toggle */}
          <StyledToggleButtonGroup
            exclusive
            value={i18n.language}
            onChange={(_, newLang) => newLang && changeLanguage(newLang)}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                padding: { xs: "5px 10px", sm: "6px 14px" },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: { xs: "auto", sm: "auto" },
                transition: "all 0.2s ease",
              },
            }}
          >
            <ToggleButton value="th">
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, sm: 0.5 } }}>
                🇹🇭
                <Box sx={{ display: { xs: "none", sm: "block" } }}>ไทย</Box>
              </Box>
            </ToggleButton>
            <ToggleButton value="en">
              <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0, sm: 0.5 } }}>
                🇺🇸
                <Box sx={{ display: { xs: "none", sm: "block" } }}>EN</Box>
              </Box>
            </ToggleButton>
          </StyledToggleButtonGroup>

          {/* Notifications */}
          {/* <Tooltip title="การแจ้งเตือน" placement="bottom" arrow>
            <IconButton
              color="inherit"
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                width: { xs: 38, sm: 42 },
                height: { xs: 38, sm: 42 },
                borderRadius: 2,
                transition: "all 0.25s ease",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  transform: "scale(1.05)",
                },
              }}
            >
              <Badge badgeContent={3} color="error" sx={{ "& .MuiBadge-badge": { fontSize: { xs: "0.6rem", sm: "0.7rem" } } }}>
                <NotificationsIcon sx={{ fontSize: { xs: "1.2rem", sm: "1.4rem" } }} />
              </Badge>
            </IconButton>
          </Tooltip> */}

          {/* User Profile */}
          <Chip
            avatar={
              <Avatar
                src={user?.picture || undefined}
                {...(!user?.picture && stringAvatar(user?.name || ""))}
                sx={{
                  width: { xs: 28, sm: 32 },
                  height: { xs: 28, sm: 32 },
                  fontSize: { xs: "0.7rem", sm: "0.8rem" },
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                }}
              />
            }
            label={
              <Box sx={{ display: { xs: "none", sm: "block" }, fontWeight: 500 }}>
                {user?.name || "User"}
              </Box>
            }
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              height: { xs: 36, sm: 42 },
              borderRadius: 3,
              pl: 0.5,
              transition: "all 0.25s ease",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.22)",
                borderColor: "rgba(255, 255, 255, 0.4)",
                transform: "translateY(-1px)",
              },
            }}
          />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;
