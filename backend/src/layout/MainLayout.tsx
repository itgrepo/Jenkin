import React, { useState } from "react";
import { Box, CssBaseline, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

import Topbar from "./Navbar";
import Drawerbar from "./Drawerbar";
import useIsMobile from "@hooks/useIsMobile";

const drawerWidth = import.meta.env.VITE_APP_DRAWERWIDTH || 280;
const miniWidth = Number(import.meta.env.VITE_APP_DRAWERWIDTH_MIN) || 72;

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const MainContent = styled(Box)<{ open?: boolean }>(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  marginTop: theme.spacing(1),
  minHeight: "100vh",
  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 100%)`,
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    opacity: 0.5,
    pointerEvents: "none",
  },
}));

const ContentContainer = styled(Paper)(({ theme }) => ({
  position: "relative",
  zIndex: 1,
  padding: theme.spacing(0),
   borderRadius: 16,
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  background: "rgba(255, 255, 255, 0.9)",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  maxWidth: 1200,
  margin: "0 auto",
  minHeight: "calc(100vh - 140px)",
}));

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isDrawerLocked, setIsDrawerLocked] = useState(false);
  const isMobile = useIsMobile();

  const handleDrawerToggle = () => {
    if (!isDrawerLocked) {
      setOpen((prev) => !prev);
    }
  };

  const handleDrawerLockToggle = (locked: boolean) => {
    setIsDrawerLocked(locked);
  };

  return (
    <>
      <CssBaseline />

      <Topbar
        open={open}
        onDrawerToggle={handleDrawerToggle}
        isDrawerLocked={isDrawerLocked}
      />
      <Drawerbar
        onDrawerToggle={handleDrawerToggle}
        open={open}
        isDrawerLocked={isDrawerLocked}
        onDrawerLockToggle={handleDrawerLockToggle}
      />

      <MainContent
        open={open}
        sx={{
          marginLeft: open ? `${drawerWidth}px` : isMobile ? 0 : `${miniWidth}px`,
          transition: (theme) =>
            theme.transitions.create(["margin-left"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <DrawerHeader />
        <ContentContainer elevation={0}>{children}</ContentContainer>
      </MainContent>
    </>
  );
};

export default MainLayout;
