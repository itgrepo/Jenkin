import { useAppSelector } from "@hooks/useRedux";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Link } from "react-router-dom";

import {
  WavingHand,
  Event,
  Description,
  Home,
  Assignment,
  Replay,
} from "@mui/icons-material";

export default function HomePage() {
  const roleId = useAppSelector((state) => state.auth.user?.role?.id);
  const user = useAppSelector((state) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Quick links สำหรับ e-meeting
  const meetingQuickLinks = [
    {
      title: "ร่างแผน[00]",
      desc: "จัดการร่างแผน[00]",
      path: "/projects/project-list",
      icon: Assignment,
      color: "#00ACC1",
      showForRoles: [5],
    },
    {
      title: "จัดการโครงการ",
      desc: "จัดการโครงการ",
      path: "/projects/project-management",
      icon: Description,
      color: "#1976D2",
      showForRoles: [5],
    },

    {
      title: "จัดการทบทวนมาตรฐาน",
      desc: "จัดการทบทวนมาตรฐาน",
      path: "/projects/project-review",
      icon: Replay,
      color: "#FFA000",
      showForRoles: [5],
    },
    
  ].filter((link) => link.showForRoles?.includes(roleId || 0));

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 2 }, mb: 4 }}>
      {/* Welcome Section */}
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          borderRadius: 3,
          p: { xs: 3, sm: 4 },
          mb: 4,
          color: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <WavingHand sx={{ fontSize: { xs: 32, sm: 40 } }} />
          <Box>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              sx={{ fontWeight: 700, mb: 0.5 }}
            >
              ยินดีต้อนรับสู่ระบบ Project Standard
            </Typography>
            <Typography
              variant={isMobile ? "body1" : "h6"}
              sx={{ opacity: 0.95, fontWeight: 400 }}
            >
              {user?.name || "ผู้ใช้งาน"}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
          <Event sx={{ fontSize: 20, opacity: 0.9 }} />
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            ระบบจัดการโปรเจคกำหนดมาตรฐาน
          </Typography>
        </Box>
      </Paper>

      {/* Quick Links Section */}
      {meetingQuickLinks.length > 0 && (
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 3,
              color: "text.primary",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Home sx={{ fontSize: 28, color: "primary.main" }} />
            หน้าหลัก
          </Typography>

          <Grid
            container
            spacing={3}
            sx={{
              "& .MuiGrid-item": {
                display: "flex",
              },
            }}
          >
            {meetingQuickLinks.map((link, idx) => {
              const IconComponent = link.icon;
              return (
                <Grid key={idx} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    component={Link}
                    to={link.path}
                    sx={{
                      height: "100%",
                      background: `linear-gradient(135deg, ${link.color} 0%, ${link.color}dd 100%)`,
                      color: "#fff",
                      borderRadius: 3,
                      textDecoration: "none",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        "& .service-icon": {
                          transform: "scale(1.1)",
                        },
                      },
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent
                      sx={{
                        p: 3,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                      }}
                    >
                      <Box
                        sx={{
                          mb: 2,
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: "rgba(255, 255, 255, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComponent
                          className="service-icon"
                          sx={{
                            fontSize: { xs: 32, sm: 40 },
                            transition: "transform 0.3s ease",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        }}
                      >
                        {link.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.95,
                          lineHeight: 1.6,
                          fontSize: { xs: "0.875rem", sm: "0.9rem" },
                        }}
                      >
                        {link.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Empty State */}
      {meetingQuickLinks.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            backgroundColor: "background.default",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ไม่มีเมนูที่สามารถเข้าถึงได้
          </Typography>
          <Typography variant="body2" color="text.secondary">
            กรุณาติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์การเข้าถึง
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
