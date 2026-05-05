import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Paper,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Close,
  Create,
  Delete,
  Download,
  Edit,
  History,
  NotificationsActive,
  Visibility,
} from "@mui/icons-material";
import { Link as RouterLink } from "react-router-dom";
import type { DocumentItem, DocumentLog } from "@models/documents";
import { getMinioFullUrl } from "@utils/index";
import { getDocumentLogs } from "@services/documentService";

import { stampPdfWithNLabel } from "@utils/pdfStamp";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { fetchFileAsArrayBuffer } from "@services/globalService";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const getInitials = (name: string | null | undefined): string => {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name: string | null | undefined): string => {
  if (!name) return "#9e9e9e";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "#1976d2", // blue
    "#2e7d32", // green
    "#ed6c02", // orange
    "#d32f2f", // red
    "#9c27b0", // purple
    "#0288d1", // light blue
    "#388e3c", // dark green
    "#f57c00", // dark orange
  ];
  return colors[Math.abs(hash) % colors.length];
};

function UserAvatar({ name }: { name: string | null | undefined }) {
  if (!name || !name.trim()) return null;
  const initials = getInitials(name);
  const color = getAvatarColor(name);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: color,
          color: "white",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        {initials}
      </Avatar>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {name}
      </Typography>
    </Box>
  );
}

function MetaRow({
  label,
  value,
  link,
  to,
}: {
  label: string;
  value: React.ReactNode;
  link?: string;
  to?: string;
}) {
  return (
    <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          minWidth: 120,
          width: 120,
          flexShrink: 0,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {to ? (
          <Link component={RouterLink} to={to} underline="hover" sx={{ fontWeight: 500 }}>
            {value}
          </Link>
        ) : link ? (
          <Link
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontWeight: 500 }}
          >
            {value}
          </Link>
        ) : (
          <Typography component="div" variant="body2" fontWeight={500}>
            {value ?? "—"}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export interface DocumentViewDialogProps {
  open: boolean;
  onClose: () => void;
  doc: DocumentItem | null;
  committeeNumber?: string;
  committeeName?: string;
}

export default function DocumentViewDialog({
  open,
  onClose,
  doc,
  committeeNumber = "",
  committeeName = "",
}: DocumentViewDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [tab, setTab] = useState(0);
  const [metaOpen, setMetaOpen] = useState(true);
  const [stampedPdfUrl, setStampedPdfUrl] = useState<string | null>(null);
  const [loadingStamped, setLoadingStamped] = useState(false);
  const [logs, setLogs] = useState<DocumentLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const stampedUrlRef = useRef<string | null>(null);

  const viewerUrl = doc?.filePath ? getMinioFullUrl(doc.filePath) : null;
  const isPdf =
    (doc?.mimeType ?? "").toLowerCase().includes("pdf") ||
    (doc?.filePath ?? "").toLowerCase().endsWith(".pdf");

  const committeeLabel = [committeeNumber, committeeName].filter(Boolean).join(" ");
  const nLabel =
    doc?.nNumber != null
      ? committeeLabel
        ? `${committeeLabel} N ${doc.nNumber}`
        : `N ${doc.nNumber}`
      : null;


  useEffect(() => {
    if (!open || !doc?.filePath || !isPdf || !nLabel) {
      if (stampedUrlRef.current) {
        URL.revokeObjectURL(stampedUrlRef.current);
        stampedUrlRef.current = null;
      }
      setStampedPdfUrl(null);
      return;
    }
    let cancelled = false;
    setLoadingStamped(true);
    (async () => {
      try {
        const ab = await fetchFileAsArrayBuffer(doc.filePath!);
        const stamped = await stampPdfWithNLabel(ab, nLabel);
        if (cancelled) return;
        if (stampedUrlRef.current) URL.revokeObjectURL(stampedUrlRef.current);
        const blob = new Blob([stamped as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        stampedUrlRef.current = url;
        setStampedPdfUrl(url);
      } catch (e) {
        console.error("Stamp PDF:", e);
        if (!cancelled) setStampedPdfUrl(null);
      } finally {
        if (!cancelled) setLoadingStamped(false);
      }
    })();
    return () => {
      cancelled = true;
      if (stampedUrlRef.current) {
        URL.revokeObjectURL(stampedUrlRef.current);
        stampedUrlRef.current = null;
      }
      setStampedPdfUrl(null);
    };
  }, [open, doc?.filePath, doc?.id, isPdf, nLabel]);

  // Load logs when History tab is opened
  useEffect(() => {
    if (!open || tab !== 1 || !doc?.id) {
      setLogs([]);
      return;
    }
    let cancelled = false;
    setLoadingLogs(true);
    (async () => {
      try {
        const res = await getDocumentLogs(doc.id!);
        if (!cancelled) {
          setLogs(res.data || []);
        }
      } catch (e) {
        console.error("Load document logs:", e);
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoadingLogs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, doc?.id]);

  const getActionIcon = (action: string) => {
    const actionUpper = action.toUpperCase();
    switch (actionUpper) {
      case "CREATE":
        return <Create fontSize="small" />;
      case "UPDATE":
      case "EDIT":
        return <Edit fontSize="small" />;
      case "DELETE":
        return <Delete fontSize="small" />;
      case "VIEW":
        return <Visibility fontSize="small" />;
      case "NOTIFY":
        return <NotificationsActive fontSize="small" />;
      case "DOWNLOAD":
        return <Download fontSize="small" />;
      default:
        return <History fontSize="small" />;
    }
  };

  const getActionColor = (action: string): "default" | "primary" | "success" | "warning" | "error" | "info" => {
    const actionUpper = action.toUpperCase();
    switch (actionUpper) {
      case "CREATE":
        return "success";
      case "UPDATE":
      case "EDIT":
        return "primary";
      case "DELETE":
        return "error";
      case "VIEW":
        return "info";
      case "NOTIFY":
        return "warning";
      default:
        return "default";
    }
  };

  const getActionLabel = (action: string): string => {
    const actionUpper = action.toUpperCase();
    const labels: Record<string, string> = {
      CREATE: "สร้าง",
      UPDATE: "อัปเดต",
      EDIT: "แก้ไข",
      DELETE: "ลบ",
      VIEW: "ดู",
      NOTIFY: "แจ้งเตือน",
      DOWNLOAD: "ดาวน์โหลด",
    };
    return labels[actionUpper] || action;
  };

  if (!doc) return null;

  return (
    <Dialog
      open={open}
      maxWidth="xl"
      fullWidth
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? "100vh" : "100vh",
            height: "90vh",
            background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.5,
          px: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40 }}>
          <Tab label="View" />
          <Tab label="History" />
        </Tabs>
        <IconButton size="small" onClick={onClose} aria-label="ปิด">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden", flex: 1 }}>
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          {/* Left: Document viewer */}
          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              m: 2,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            {tab === 0 && (
              <>
                {/* <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1,
                    py: 0.5,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Tooltip title="เปิดในแท็บใหม่">
                    <IconButton
                      size="small"
                      onClick={() => window.open(viewerUrl ?? "#", "_blank")}
                      disabled={!viewerUrl}
                    >
                      <SaveAlt fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Box sx={{ flex: 1 }} />
                </Box> */}
                <Box
                  sx={{
                    flex: 1,
                    position: "relative",
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    p: 2,
                    minHeight: 400,
                  }}
                >
                  {viewerUrl && (
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 2,
                        pointerEvents: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: { xs: "4rem", md: "7rem", lg: "8rem" },
                          fontWeight: 800,
                          color: "rgba(91, 90, 90, 0.12)",
                          transform: "rotate(-30deg)",
                          letterSpacing: "0.5rem",
                          userSelect: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        ตัวอย่าง
                      </Typography>
                    </Box>
                  )}

                  {viewerUrl ? (
                    isPdf ? (
                      loadingStamped && nLabel ? (
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            width: "100%",
                            minHeight: 420,
                            color: "text.secondary",
                          }}
                        >
                          <CircularProgress />
                          <Typography variant="body2">กำลังสร้างเอกสาร กรุณารอสักครู่...</Typography>
                        </Box>
                      ) : (
                        <iframe
                          title={doc.title}
                          src={(nLabel ? stampedPdfUrl : null) ?? viewerUrl}
                          style={{
                            width: "100%",
                            height: "100%",
                            minHeight: 420,
                            border: "none",
                          }}
                        />
                      )
                    ) : (
                      <Box
                        component="a"
                        href={viewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 1,
                          color: "primary.main",
                          textDecoration: "underline",
                        }}
                      >
                        <Download sx={{ fontSize: 48 }} />
                        <Typography>เปิดไฟล์ในแท็บใหม่</Typography>
                      </Box>
                    )
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1,
                        color: "text.secondary",
                        py: 6,
                      }}
                    >
                      <Typography>ไม่มีไฟล์แนบ</Typography>
                      <Typography variant="caption">เอกสารนี้ยังไม่มี Content</Typography>
                    </Box>
                  )}
                </Box>
                {doc.filePath && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider" }}
                  >
                    {doc.filePath.split("/").pop() ?? doc.filePath}
                  </Typography>
                )}
              </>
            )}
            {tab === 1 && (
              <Box sx={{ p: { xs: 2, md: 3 }, height: "100%", overflow: "auto" }}>
                <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <History sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      ประวัติการใช้งาน
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {logs.length > 0 ? `${logs.length} รายการ` : "ไม่มีประวัติ"}
                    </Typography>
                  </Box>
                </Box>
                {loadingLogs ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8 }}>
                    <CircularProgress size={48} sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      กำลังโหลดประวัติ...
                    </Typography>
                  </Box>
                ) : logs.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 8 }}>
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: "50%",
                        bgcolor: "grey.100",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 3,
                      }}
                    >
                      <History sx={{ fontSize: 64, color: "text.disabled" }} />
                    </Box>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      ไม่มีประวัติการใช้งาน
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ยังไม่มีการดำเนินการใดๆ บนเอกสารนี้
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ position: "relative", pl: { xs: 3, sm: 4 } }}>
                    {/* Timeline vertical line */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: { xs: 20, sm: 28 },
                        top: 0,
                        bottom: 0,
                        width: 2,
                        bgcolor: "divider",
                        zIndex: 0,
                      }}
                    />
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, position: "relative", zIndex: 1 }}>
                      {logs.map((log, index) => {
                        const color = getActionColor(log.action);
                        const isLast = index === logs.length - 1;
                        return (
                          <Box
                            key={log.id || index}
                            sx={{
                              display: "flex",
                              gap: { xs: 2, sm: 3 },
                              alignItems: "flex-start",
                              position: "relative",
                            }}
                          >
                            {/* Timeline dot */}
                            <Box
                              sx={{
                                position: "absolute",
                                left: { xs: -24, sm: -32 },
                                top: 4,
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                                borderRadius: "50%",
                                bgcolor: `${color}.main`,
                                border: 3,
                                borderColor: "background.paper",
                                boxShadow: 2,
                                zIndex: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  width: { xs: 8, sm: 10 },
                                  height: { xs: 8, sm: 10 },
                                  borderRadius: "50%",
                                  bgcolor: `${color}.main`,
                                }}
                              />
                            </Box>
                            {/* Content card */}
                            <Paper
                              elevation={0}
                              sx={{
                                flex: 1,
                                p: { xs: 2, sm: 2.5 },
                                border: 1,
                                borderColor: "divider",
                                borderRadius: 2,
                                bgcolor: "background.paper",
                                transition: "all 0.3s ease",
                                position: "relative",
                                "&:hover": {
                                  boxShadow: 4,
                                  borderColor: `${color}.main`,
                                  transform: "translateX(4px)",
                                },
                                "&::before": {
                                  content: '""',
                                  position: "absolute",
                                  left: { xs: -8, sm: -12 },
                                  top: 12,
                                  width: 0,
                                  height: 0,
                                  borderTop: "8px solid transparent",
                                  borderBottom: "8px solid transparent",
                                  borderRight: `8px solid ${isLast ? "transparent" : "divider"}`,
                                  display: { xs: "none", sm: "block" },
                                },
                              }}
                            >
                              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                                {/* Icon */}
                                <Box
                                  sx={{
                                    width: { xs: 40, sm: 48 },
                                    height: { xs: 40, sm: 48 },
                                    borderRadius: 2,
                                    bgcolor: `${color}.light`,
                                    color: `${color}.main`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  {getActionIcon(log.action)}
                                </Box>
                                {/* Content */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}>
                                    <Chip
                                      label={getActionLabel(log.action)}
                                      size="small"
                                      color={color}
                                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                                    />
                                    {log.actionAt && (
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: "text.secondary",
                                          fontWeight: 500,
                                          bgcolor: "grey.100",
                                          px: 1.5,
                                          py: 0.5,
                                          borderRadius: 1,
                                        }}
                                      >
                                        {dayjs(log.actionAt).format("DD/MM/YYYY HH:mm:ss")}
                                      </Typography>
                                    )}
                                  </Box>
                                  {log.actionDetail && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{ mb: 1.5, lineHeight: 1.6 }}
                                    >
                                      {log.actionDetail}
                                    </Typography>
                                  )}
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: { xs: "column", sm: "row" },
                                      gap: { xs: 0.5, sm: 1.5 },
                                      alignItems: { xs: "flex-start", sm: "center" },
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {log.actionByName ? (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <Box component="span" sx={{ fontWeight: 600 }}>โดย:</Box>
                                        {log.actionByName}
                                        {log.actionByRoleName && (
                                          <Chip
                                            label={log.actionByRoleName}
                                            size="small"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: "0.65rem" }}
                                          />
                                        )}
                                      </Typography>
                                    ) : log.actionBy ? (
                                      <Typography variant="caption" color="text.secondary">
                                        <Box component="span" sx={{ fontWeight: 600 }}>โดย:</Box> User #{log.actionBy}
                                      </Typography>
                                    ) : null}
                                  </Box>
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Paper>

          {/* Right: Metadata panel */}
          {!isMobile && (
            <Paper
              variant="outlined"
              sx={{
                width: metaOpen ? 320 : 48,
                flexShrink: 0,
                m: 2,
                overflow: "hidden",
                bgcolor: "grey.100",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  py: 0.5,
                  px: 0.5,
                  borderBottom: metaOpen ? 1 : 0,
                  borderColor: "divider",
                }}
              >
                <IconButton size="small" onClick={() => setMetaOpen((o) => !o)} sx={{ ml: 1 }}>
                  <Typography variant="h5" >{metaOpen ? "»" : "«"}</Typography>
                </IconButton>
              </Box>
              {metaOpen && (
                <Box sx={{ p: 2, overflow: "auto" }}>
                  <MetaRow label="Version" value={doc.version != null ? String(doc.version) : "0.1"} />
                  <MetaRow
                    label="Last Modified"
                    value={
                      doc.modifiedAt ? dayjs(doc.modifiedAt).format("YYYY-MM-DD") : undefined
                    }
                  />
                  <MetaRow
                    label="Created"
                    value={doc.createdAt ? dayjs(doc.createdAt).format("YYYY-MM-DD") : undefined}
                  />
                  <MetaRow
                    label="By"
                    value={doc.createdByName ? <UserAvatar name={doc.createdByName} /> : "-"}
                  />
                  <MetaRow
                    label="Contributors"
                    value={doc.updatedByName ? <UserAvatar name={doc.updatedByName} /> : "-"}
                  />
                  <MetaRow
                    label="N Number"
                    value={doc.nNumber != null ? String(doc.nNumber) : undefined}
                  />
                  <MetaRow label="Title" value={doc.title} />
                  <MetaRow label="Status" value={doc.status} />
                  <MetaRow label="Type" value={doc.typeName} />
                  <MetaRow label="SubType" value={doc.subTypeName} />
                  {doc.meetingId && (
                    <MetaRow
                      label="Meeting"
                      value={doc.meetingName}
                      to={`/meetings/meeting-approved${doc.meetingId != null ? `?meetingId=${doc.meetingId}` : ""
                        }`}
                    />
                  )}
                  {doc.projectName && (
                    <MetaRow label="Project" value={doc.projectName} />
                  )}
                  {doc.ballotName && (
                    <MetaRow label="Ballot" value={doc.ballotName} />
                  )}
                  {doc.expectedAction && (
                    <MetaRow label="Expected action" value={doc.expectedAction} />
                  )}
                  {doc.expectedDate && (
                    <MetaRow
                      label="Expected date"
                      value={dayjs(doc.expectedDate).format("YYYY-MM-DD")}
                    />
                  )}
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
