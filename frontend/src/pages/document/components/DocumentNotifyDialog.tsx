import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Notifications } from "@mui/icons-material";
import type { DocumentItem } from "@models/documents";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const DEFAULT_BODY = `Dear member,

Please note that the following new documents have been posted on ISO Documents.

Best regards,
`;

export interface DocumentNotifyDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documents: DocumentItem[];
  committeeNumber?: string;
  committeeName?: string;
  userName?: string;
  onSend: (params: {
    documentIds: number[];
    subject: string;
    body: string;
  }) => Promise<void>;
}

export default function DocumentNotifyDialog({
  open,
  onClose,
  onSuccess,
  documents,
  committeeNumber = "",
  committeeName = "",
  userName = "",
  onSend,
}: DocumentNotifyDialogProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  const defaultSubject = useMemo(
    () =>
      [committeeNumber, committeeName].filter(Boolean).join(" ").trim() ||
      "Committee",
    [committeeNumber, committeeName]
  );
  const defaultBody = useMemo(
    () => `${DEFAULT_BODY}${userName || "System"}`,
    [userName]
  );

  useEffect(() => {
    if (open) {
      setSubject(`${defaultSubject} - documents available`);
      setBody(defaultBody);
      setError(null);
    }
  }, [open, defaultSubject, defaultBody]);

  const handleSend = async () => {
    const sub = subject.trim();
    if (!sub) {
      setError("กรุณากรอก Subject");
      return;
    }
    const ids = documents.map((d) => d.id).filter((id): id is number => id != null);
    if (ids.length === 0) {
      setError("ไม่พบเอกสารที่จะแจ้งเตือน");
      return;
    }
    setError(null);
    setSending(true);
    try {
      await onSend({ documentIds: ids, subject: sub, body: body.trim() });
      onSuccess();
      onClose();
    } catch (e) {
      if (e instanceof Error && e.message === "CANCELLED") return;
      console.error("Notify send:", e);
      setError("ไม่สามารถส่ง Notify ได้");
    } finally {
      setSending(false);
    }
  };

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
        <Notifications sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            แจ้งเตือนเอกสาร
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
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2,mt:3 }}>
          <TextField
            fullWidth
            label="Subject *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={!!error && !subject.trim()}
            helperText={!subject.trim() ? error : undefined}
            size="small"
          />
          <TextField
            fullWidth
            label="Body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            multiline
            minRows={6}
            size="small"
          />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
            รายการเอกสารที่จะแจ้งเตือน
          </Typography>
          <Table size="small" sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.100" }}>
                <TableCell sx={{ fontWeight: 600 }}>N Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{d.nNumber ?? "-"}</TableCell>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>
                    {d.createdAt
                      ? dayjs(d.createdAt).format("YYYY-MM-DD")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {error && subject.trim() && (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button variant="outlined" onClick={onClose} disabled={sending}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={sending || documents.length === 0}
        >
          {sending ? "กำลังส่ง..." : "ส่ง"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
