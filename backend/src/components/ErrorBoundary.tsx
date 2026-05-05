import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  useTheme,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Error Info:", errorInfo);
    console.error("Component Stack:", errorInfo.componentStack);
    
    // Log to external service (optional - can be added later)
    // Example: logErrorToService(error, errorInfo);
    
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  onRetry: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, onRetry }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: "center",
          borderRadius: 3,
          background: theme.palette.background.paper,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          animation: "fadeIn 0.6s ease-out",
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: 80,
            color: theme.palette.error.main,
            mb: 3,
            animation: "pulse 2s infinite",
          }}
        />

        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary,
            mb: 2,
          }}
        >
          {t("error", { defaultValue: "เกิดข้อผิดพลาด" })}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{
            mb: 4,
            maxWidth: 500,
            mx: "auto",
            lineHeight: 1.6,
          }}
        >
          {t("error_desc", {
            defaultValue:
              "ขออภัย เกิดข้อผิดพลาดที่ไม่คาดคิดขึ้น กรุณาลองใหม่อีกครั้งหรือกลับไปยังหน้าหลัก",
          })}
        </Typography>

        {error && (
          <Box
            sx={{
              mb: 4,
              p: 2,
              backgroundColor: theme.palette.background.default,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              textAlign: "left",
              maxHeight: 200,
              overflow: "auto",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                fontWeight: 600,
                color: theme.palette.text.secondary,
              }}
            >
              รายละเอียดข้อผิดพลาด:
            </Typography>
            <Typography
              variant="body2"
              component="pre"
              sx={{
                fontFamily: "monospace",
                fontSize: "0.75rem",
                color: theme.palette.error.main,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                m: 0,
              }}
            >
              {error.message || error.toString()}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              "&:hover": {
                boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
                transform: "translateY(-1px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            {t("try_again", { defaultValue: "ลองอีกครั้ง" })}
          </Button>

          <Button
            variant="outlined"
            onClick={() => (window.location.href = "/")}
            sx={{
              borderRadius: 2,
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: "none",
              borderWidth: 2,
              "&:hover": {
                borderWidth: 2,
                transform: "translateY(-1px)",
              },
              transition: "all 0.3s ease",
            }}
          >
            {t("homepage", { defaultValue: "กลับหน้าหลัก" })}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ErrorBoundary;
