import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button, Paper, Container } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useTranslation } from "react-i18next";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme";
import { useSelector } from "react-redux";
import { RootState } from "@store/index";
import BackdropLoader from "@components/BackdropLoader";

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading } = useSelector((state: RootState) => state.auth);

  const handleGoHome = () => {
    navigate("/");
  };

  if(loading) return <BackdropLoader show={loading} />

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "background.paper",
            }}
          >
            <SearchOffIcon
              sx={{
                fontSize: 80,
                color: "primary.main",
                mb: 2,
              }}
            />
            {/* 
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "primary.main",
            }}
          >
           {t("404_title")}
          </Typography> */}

            <Typography
              variant="h6"
              gutterBottom
              sx={{
                color: "text.secondary",
                mb: 3,
              }}
            >
              {t("notfound_title")}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                mb: 4,
              }}
            >
              {t("notfound_description")}
            </Typography>

            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                px: 4,
                py: 1,
              }}
            >
              {t("notfound_button")}
            </Button>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default NotFound;
