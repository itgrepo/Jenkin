import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeContextProvider, ThemeContext } from "./theme/ThemeContext";
import { useMemo, useContext } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import App from "./App";
import { Provider } from "react-redux";
import { store } from "./store";
import { BrowserRouter } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material";
//import i18n from "./i18n"; // ต้องแน่ใจว่า import ตัวนี้มาแล้ว
import "@locales/i18n";
import SwalThemeSetter from "@components/SwalThemeSetter";
import ErrorBoundary from "@components/ErrorBoundary";

function ThemedApp() {
  const { appSettings } = useContext(ThemeContext);

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
  }, [appSettings]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SwalThemeSetter />
      <App />
    </ThemeProvider>
  );
}

// Global error handler for unhandled errors
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter basename="/e-standard/">
          <ThemeContextProvider>
            <ThemedApp />
          </ThemeContextProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
