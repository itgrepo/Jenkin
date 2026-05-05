import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Description, Folder, ListAlt } from "@mui/icons-material";
import { MasterData } from "@models/global";

interface DocumentTypeSelectDialogProps {
  open: boolean;
  onClose: () => void;
  types: MasterData[];
  onSelect: (code: string, label: string) => void;
}

export default function DocumentTypeSelectDialog({
  open,
  onClose,
  types,
  onSelect,
}: DocumentTypeSelectDialogProps) {

  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobileDialog}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobileDialog ? 0 : 3,
            maxHeight: isMobileDialog ? "100vh" : "90vh",
            background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 2,
          py: 3,
          px: 4,
        }}
      >
        <ListAlt sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            เลือกประเภทเอกสาร
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: "#fff",
            bgcolor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {types.length === 0 ? (
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                ไม่มีประเภทเอกสารให้เลือก (ลองเลือก Type เป็น ทั้งหมด)
              </Typography>
            </Grid>
          ) : (
            types?.filter((t) => t.code !== "ALL").map((t) => (
              <Grid key={t.code} size={{ xs: 6, sm: 4, md: 3 }}>
                <Paper
                  component="button"
                  type="button"
                  onClick={() => onSelect(t.code ?? "", t.name ?? "")}
                  elevation={0}
                  sx={{
                    width: "100%",
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    bgcolor: "#fff",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    "&:hover": {
                      bgcolor: "action.hover",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  {t.icon === "folder" ? (
                    <Folder sx={{ fontSize: 40, color: "text.secondary" }} />
                  ) : (
                    <Description
                      sx={{ fontSize: 40, color: "text.secondary" }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: "text.primary",
                      textAlign: "center",
                    }}
                  >
                    {t.code}
                  </Typography>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
