import AppRoutes from "@routes/AppRoutes";
import CookieConsentDialog from "@components/CookieConsentDialog";
import { Suspense, useContext, useEffect, useMemo } from "react";
import { useAuth } from "@auth/useAuth";
import "sweetalert2/dist/sweetalert2.min.css";
import {
  Box,
  CircularProgress,
  createTheme,
  ThemeProvider,
  Typography,
} from "@mui/material";
import "./index.css";
import { useTranslation } from "react-i18next";
import { ThemeContext } from "@theme/ThemeContext";
import ErrorBoundary from "@components/ErrorBoundary";
import BackdropLoader from "@components/BackdropLoader";
import { useAppSelector } from "@hooks/useRedux";
function App() {
  const { checkSession } = useAuth();
  const { appSettings } = useContext(ThemeContext);
  const { t, i18n } = useTranslation();
  const loading = useAppSelector((state) => state?.global?.loading);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (appSettings?.appName) {
      document.title = t("appName");
    }
  }, [appSettings, i18n.language]);

  const theme = useMemo(() => {
    return createTheme({
      typography: {
        fontFamily: `'Noto Sans Thai', sans-serif`,
      },
      palette: {
        mode: appSettings.darkMode ? "dark" : "light",
        primary: {
          main: appSettings.primaryColor,
        },
        secondary: {
          main: appSettings.secondaryColor,
        },
      },
      components: {
        MuiAutocomplete: {
          styleOverrides: {
            popper: {
              '& .MuiPaper-root': {
                transition: 'none !important',
                animation: 'none !important',
              },
            },
          },
        },
        MuiPopper: {
          styleOverrides: {
            root: {
              '& .MuiPaper-root': {
                transition: 'none !important',
                animation: 'none !important',
              },
            },
          },
        },
      },
    });
  }, [i18n.language, appSettings]);

  useEffect(() => {
    const hours = 8; // 8 ชั่วโมง
    const now = new Date().getTime();
    const setupTime = localStorage.getItem("setupTime");

    if (setupTime === null) {
      localStorage.setItem("setupTime", now.toString());
    } else {
      const setupTimeNumber = Number(setupTime);

      if (now - setupTimeNumber > hours * 60 * 60 * 1000) {
        localStorage.clear();
        localStorage.setItem("setupTime", now.toString());
        // console.log("TimeOut");
      }
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ErrorBoundary>
        <Suspense
          fallback={
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              minHeight="100vh"
            >
              <CircularProgress color="primary" size={48} />
              <Typography variant="body2" color="textSecondary" mt={2}>
                {t("loading_message")}
              </Typography>
            </Box>
          }
        >
           {loading && <BackdropLoader show={loading} />}
          <AppRoutes />
        </Suspense>
        <CookieConsentDialog />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
