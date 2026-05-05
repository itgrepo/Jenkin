import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  Autocomplete,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Delete,
  Edit,
  Folder,
  FolderOpen,
  ListAlt,
  MoreVert,
  NotificationsActive,
  Search,
  Visibility,
} from "@mui/icons-material";
import DocumentTypeSelectDialog from "@pages/document/components/DocumentTypeSelectDialog";
import DocumentMetaDialog from "@pages/document/components/DocumentMetaDialog";
import DocumentNotifyDialog from "@pages/document/components/DocumentNotifyDialog";
import DocumentViewDialog from "@pages/document/components/DocumentViewDialog";
import { showError, showSuccess, showConfirm } from "@components/Swal";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { AxiosError } from "axios";
import { DocumentItem } from "@models/documents";
import type { MasterData } from "@models/global";
import {
  getDocuments,
  deleteDocument,
  notifyDocument,
} from "@services/documentService";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { RootState } from "@store/index";
import { fetchAppDocumentType } from "@store/globalSlice";

dayjs.extend(buddhistEra);
dayjs.locale("th");

type ApiErrorBody = { message?: string; error?: string };
const getApiErrorMessage = (err: unknown): string | undefined => {
  const axiosErr = err as AxiosError<ApiErrorBody>;
  return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error;
};

export default function DocumentListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const user = useAppSelector((state: RootState) => state?.auth.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const committeeId = useMemo(() => {
    const raw = searchParams.get("committeeId");
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }, [searchParams]);
  const committeeName = searchParams.get("committeeName") || "";
  const committeeNumber = searchParams.get("committeeNumber") || "";

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTitle, setSearchTitle] = useState("");
  const [selectedType, setSelectedType] = useState<MasterData | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);
  const [selectedTypeForMeta, setSelectedTypeForMeta] = useState<{
    code: string;
    name: string;
  } | null>(null);

  const [selectedDocument, setSelectedDocument] = useState<DocumentItem | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuDoc, setMenuDoc] = useState<DocumentItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentItem | null>(null);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [notifyDocs, setNotifyDocs] = useState<DocumentItem[]>([]);
  const [editMetaDoc, setEditMetaDoc] = useState<DocumentItem | null>(null);
  const [editMetaDialogOpen, setEditMetaDialogOpen] = useState(false);
  /** Breadcrumb stack สำหรับ Windows Explorer style (folderPath, title) */
  const [folderStack, setFolderStack] = useState<Array<{ filePath: string; title: string }>>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);


  const currentFolderPath = folderStack.length > 0 ? folderStack[folderStack.length - 1].filePath : undefined;

  const { documentTypeList } = useAppSelector((state: RootState) => state.global);

  const dispatch = useAppDispatch();


  useEffect(() => {
    if (!documentTypeList) {
      dispatch(fetchAppDocumentType());
    }
  }, [dispatch, documentTypeList]);



  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        title: searchTitle.trim() || undefined,
        type:
          selectedType && selectedType.code !== "ALL"
            ? selectedType.code
            : undefined,
        committeeId,
        folderPath: currentFolderPath,
      };

      const res = await getDocuments(params);
      let data = res.data || [];

      // กรอง: แสดงเฉพาะรายการในระดับปัจจุบัน (FOLDER: depth <= n+2, Document: depth <= n+3)
      const maxDepthFolder = folderStack.length + 2;
      const maxDepthDoc = folderStack.length + 3;

      data = data.filter((d) => {
        const segments = (d.filePath || "").split("/").length;
        const maxDepth = d.typeCode === "FOLDER" ? maxDepthFolder : maxDepthDoc;
        return segments <= maxDepth;
      });
      setDocuments(data);
      setPage(0); // รีเซ็ตหน้าเมื่อโหลดข้อมูลใหม่
    } catch (err: unknown) {
      console.error("Error loading documents:", err);
      setError(
        getApiErrorMessage(err) || "ไม่สามารถโหลดข้อมูลเอกสารได้"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedType, committeeId, currentFolderPath, searchTitle, folderStack.length]);

  useEffect(() => {
    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDocuments]);

  const handleSearch = () => {
    loadDocuments();
  };

  const handleDelete = async (doc: DocumentItem) => {
    if (!doc.id) return;
    const confirm = await showConfirm(
      "ยืนยันการลบเอกสาร",
      `คุณต้องการลบเอกสาร "${doc.title}" ใช่หรือไม่?`
    );
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      await deleteDocument(doc.id);
      showSuccess("ลบสำเร็จ", "ลบเอกสารเรียบร้อยแล้ว");
      loadDocuments();
    } catch (err: unknown) {
      console.error("Error deleting document:", err);
      showError(
        "เกิดข้อผิดพลาด",
        getApiErrorMessage(err) || "ไม่สามารถลบเอกสารได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNotify = (doc: DocumentItem) => {
    setNotifyDocs([doc]);
    setNotifyDialogOpen(true);
  };

  const handleNotifySend = async (params: {
    documentIds: number[];
    subject: string;
    body: string;
  }) => {
    const { documentIds, subject, body } = params;
    const n = documentIds.length;
    const confirmResult = await showConfirm(
      "ยืนยันการส่ง Notify",
      n === 1
        ? "คุณต้องการส่งแจ้งเตือนเอกสารนี้ ใช่หรือไม่?"
        : `คุณต้องการส่งแจ้งเตือนเอกสาร ${n} รายการ ใช่หรือไม่?`
    );
    if (!confirmResult.isConfirmed) {
      throw new Error("CANCELLED");
    }
    setLoading(true);
    try {
      for (const id of documentIds) {
        await notifyDocument(id, { subject, body });
      }
      showSuccess("ส่ง Notify สำเร็จ", "ระบบได้ส่งแจ้งเตือนเอกสารแล้ว");
    } catch (err: unknown) {
      if (err instanceof Error && err.message === "CANCELLED") throw err;
      console.error("Error notifying document:", err);
      showError(
        "เกิดข้อผิดพลาด",
        getApiErrorMessage(err) || "ไม่สามารถส่ง Notify ได้"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // const handleDownload = async (doc: DocumentItem) => {
  //   if (!doc.id) return;

  //   const confirm = await showConfirm(
  //     "ยืนยันการดาวน์โหลดเอกสาร",
  //     `คุณต้องการดาวน์โหลดเอกสาร "${doc.title}" ใช่หรือไม่?`
  //   );
  //   if (!confirm.isConfirmed) return;

  //   try {
  //     await downloadFileServer(doc.filePath!);
  //   } catch (err: unknown) {
  //     console.error("Error downloading document:", err);
  //     showError(
  //       "เกิดข้อผิดพลาด",
  //       getApiErrorMessage(err) || "ไม่สามารถดาวน์โหลดเอกสารได้"
  //     );
  //   }
  // };

  const renderStatusChip = (status?: string) => {
    if (!status) return <Chip label="-" size="small" />;
    let color: "default" | "success" | "warning" | "info" = "default";
    if (status === "To be notified") color = "warning";
    else if (status === "Notified") color = "success";
    else color = "info";
    return <Chip label={status} size="small" color={color} />;
  };

  const canManageDocuments = useMemo(() => {
    const roleId = user?.role?.id;
    // only secretary roles (เช่น 5,6) สามารถ create/edit/delete/notify
    return roleId === 5;
  }, [user]);

  const closeMenu = useCallback(() => {
    setMenuAnchor(null);
    setMenuDoc(null);
  }, []);

  const handleBack = () => {
    if (folderStack.length > 0) {
      setFolderStack((prev) => prev.slice(0, -1));
    } else {
      navigate("/documents/document-management");
    }
  };

  const handleOpenFolder = (doc: DocumentItem) => {
   // if (doc.typeCode !== "FOLDER" || !doc.filePath) return;
    if (!doc.filePath) return;
    setFolderStack((prev) => [...prev, { filePath: doc.filePath!, title: doc.title }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
  };

  const handleAddDocument = (doc?: DocumentItem | null) => {
    setAddDialogOpen(true);
    setSelectedDocument(doc ?? null);
  };

  /** Parent folder สำหรับ DocumentMetaDialog: จาก menu หรือจาก path ปัจจุบัน */
  const parentFolderForMeta = selectedDocument ?? (folderStack.length > 0 && currentFolderPath
    ? {
        typeCode: "FOLDER" as const,
        typeName: "FOLDER",
        title: folderStack[folderStack.length - 1].title,
        filePath: currentFolderPath,
      }
    : undefined);

  const handleViewDocument = (d: DocumentItem) => {
    setViewDoc(d);
    setViewDialogOpen(true);
  };

  const handleOpenEditMeta = (d: DocumentItem) => {
    setEditMetaDoc(d);
    setEditMetaDialogOpen(true);
  };

  const showAllTypes = !selectedType || selectedType.code === "ALL";
  const addDialogTypes = useMemo(() => {
    if (showAllTypes) return documentTypeList || [];
    const code = selectedType?.code ?? "";
    return documentTypeList?.filter((t) => t.code === code) || [];
  }, [showAllTypes, selectedType?.code, documentTypeList]);

  const handleSelectDocumentType = (code: string, label: string) => {
    setAddDialogOpen(false);
    setSelectedTypeForMeta({ code, name: label });
    setMetaDialogOpen(true);
  };

  const isFolder = menuDoc?.typeCode === "FOLDER";
  const showManage = canManageDocuments && !isFolder;
  const runAndClose = useCallback(
    (fn: (d: DocumentItem) => void) => () => {
      if (menuDoc) fn(menuDoc);
      closeMenu();
    },
    [menuDoc, closeMenu]
  );

  const paginatedDocuments = useMemo(() => {
    const start = page * rowsPerPage;
    return documents.slice(start, start + rowsPerPage);
  }, [documents, page, rowsPerPage]);

  const documentMenuItems = useMemo(() => {
    type Item = {
      key: string;
      label: string;
      icon: React.ReactNode;
      onClick: () => void;
      disabled?: boolean;
    };
    const items: Item[] = [];
    if (!isFolder) {
      items.push(
        { key: "view", label: "View", icon: <Visibility fontSize="small" />, onClick: runAndClose(handleViewDocument) },
        // { key: "download", label: "Download", icon: <Download fontSize="small" />, onClick: runAndClose(handleDownload) }
      );
    }
    if (showManage) {
      items.push(
        {
          key: "edit",
          label: "Edit meta data",
          icon: <Edit fontSize="small" />,
          onClick: runAndClose(handleOpenEditMeta),
        },
        {
          key: "notify",
          label: "Notify",
          icon: <NotificationsActive fontSize="small" />,
          onClick: runAndClose(handleOpenNotify),
          disabled: menuDoc?.status === "Notified",
        },
        { key: "delete", label: "Delete", icon: <Delete fontSize="small" />, onClick: runAndClose(handleDelete) }
      );
    }
    if (isFolder) {
      items.push(
        {
          key: "open",
          label: "เปิด",
          icon: <FolderOpen fontSize="small" />,
          onClick: runAndClose(handleOpenFolder),
        },
        // {
        //   key: "add",
        //   label: "Add document",
        //   icon: <Add fontSize="small" />,
        //   onClick: runAndClose(handleAddDocument),
        // },
        { key: "delete", label: "Delete", icon: <Delete fontSize="small" />, onClick: runAndClose(handleDelete) }
      );
    }
    return items;
  }, [isFolder, showManage, menuDoc?.status, runAndClose, closeMenu]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <ListAlt sx={{ fontSize: 32, color: "primary.main" }} />
        <Box >
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main", lineHeight: 1.1 }}
          >
            รายการเอกสาร
          </Typography>
        </Box>
        {(committeeNumber || committeeName) && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              (คณะ: {committeeNumber ? `${committeeNumber} ` : ""}
              {committeeName})
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            ย้อนกลับ
          </Button>

        </Box>
        {canManageDocuments && (
          <Button
            variant="contained"
            color="warning"
            size="medium"
            startIcon={<Add />}
            onClick={() => handleAddDocument(undefined)}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            เพิ่มเอกสาร
          </Button>
        )}
      </Box>

      {/* Search & Type Filter */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        }}
      >
        <Grid container spacing={2} alignItems="flex-end">
          <Grid size={{ xs: 12, md: 3 }}>
            <Autocomplete
              options={documentTypeList || []}
              size="small"
              getOptionLabel={(opt) => opt.name}
              value={selectedType}
              onChange={(_, value) => setSelectedType(value)}
              isOptionEqualToValue={(opt, val) => opt.code === val.code}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="เลือก Type"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "white",
                    },
                  }}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="ค้นหาจาก Title"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "white",
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Search />}
              onClick={handleSearch}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                height: 40,
              }}
            >
              ค้นหา
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Breadcrumb (Windows Explorer style) */}
      {folderStack.length > 0 && (
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
          <Typography
            component="button"
            variant="body2"
            onClick={() => setFolderStack([])}
            sx={{
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "primary.main",
              fontWeight: 600,
              "&:hover": { textDecoration: "underline" },
              p: 0,
            }}
          >
            ทั้งหมด
          </Typography>
          {folderStack.map((f, i) => (
            <Box key={f.filePath} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography color="text.secondary">/</Typography>
              <Typography
                component="button"
                variant="body2"
                onClick={() => handleBreadcrumbClick(i)}
                sx={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  color: i === folderStack.length - 1 ? "text.primary" : "primary.main",
                  fontWeight: i === folderStack.length - 1 ? 700 : 500,
                  "&:hover": { textDecoration: "underline" },
                  p: 0,
                }}
              >
                {f.title}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Documents Table */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <TableContainer
          sx={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: isMobile ? "70vh" : "75vh",
          "&::-webkit-scrollbar": {
            width: "10px",
            height: "10px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#888",
            borderRadius: "10px",
            "&:hover": {
              background: "#555",
            },
          },
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: "primary.main" }}>
              <TableCell
                align="center"
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                width={70}
              >
                N
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
              >
                Title
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={140}
              >
                Type
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={140}
              >
                SubType
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={180}
              >
                Meeting / Project
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={150}
              >
                Expected Action
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={130}
              >
                Exp. Date
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={120}
              >
                Status
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={150}
              >
                Modified
              </TableCell>
              <TableCell
                sx={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}
                align="center"
                width={220}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    ไม่พบข้อมูลเอกสาร
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedDocuments.map((doc) => (
                <TableRow
                  key={doc.id}
                  hover
                  sx={{
                    cursor: doc.typeCode === "FOLDER" ? "pointer" : undefined,
                  }}
                  onDoubleClick={() => doc.typeCode === "FOLDER" && handleOpenFolder(doc)}
                >
                  <TableCell align="center">{doc.nNumber || "-"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {doc.typeCode === "FOLDER" ? (
                        <Folder sx={{ color: "warning.main", fontSize: 22 }} />
                      ) : null}
                      {doc.title}
                    </Box>
                  </TableCell>
                  <TableCell align="center">{doc.typeName}</TableCell>
                  <TableCell align="center">{doc.subTypeName || "-"}</TableCell>
                  <TableCell align="center">
                    {doc.meetingName || doc.projectName || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {doc.expectedAction || "-"}
                  </TableCell>
                  <TableCell align="center">
                    {doc.expectedDate
                      ? dayjs(doc.expectedDate).format("DD/MM/YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    {renderStatusChip(doc.status || "")}
                  </TableCell>
                  <TableCell align="center">
                    {doc.modifiedAt
                      ? dayjs(doc.modifiedAt).format("DD/MM/YYYY")
                      : "-"}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="การดำเนินการ">
                      <IconButton
                        size={isMobile ? "small" : "medium"}
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setMenuDoc(doc);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </TableContainer>
        {!loading && documents.length > 0 && (
          <TablePagination
            component="div"
            count={documents.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[20, 50, 100]}
            labelRowsPerPage="แสดงต่อหน้า:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} จาก ${count !== -1 ? count : `มากกว่า ${to}`}`
            }
          />
        )}
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {documentMenuItems.map((item) => (
          <MenuItem
            key={item.key}
            onClick={item.onClick}
            disabled={item.disabled}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {addDialogOpen && (
        <DocumentTypeSelectDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          types={addDialogTypes}
          onSelect={handleSelectDocumentType}
        />
      )}

      {selectedTypeForMeta && (
        <DocumentMetaDialog
          open={metaDialogOpen}
          onClose={() => {
            setMetaDialogOpen(false);
            setSelectedTypeForMeta(null);
          }}
          onBack={() => {
            setMetaDialogOpen(false);
            setSelectedTypeForMeta(null);
            setAddDialogOpen(true);
          }}
          onSuccess={loadDocuments}
          typeCode={selectedTypeForMeta.code}
          typeName={selectedTypeForMeta.name}
          committeeId={committeeId}
          documentTypeList={documentTypeList || []}
          documentItem={parentFolderForMeta}
        />
      )}

      <DocumentViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewDoc(null);
        }}
        doc={viewDoc}
        committeeNumber={committeeNumber}
        committeeName={committeeName}
      />

      <DocumentNotifyDialog
        open={notifyDialogOpen}
        onClose={() => {
          setNotifyDialogOpen(false);
          setNotifyDocs([]);
        }}
        onSuccess={loadDocuments}
        documents={notifyDocs}
        committeeNumber={committeeNumber}
        committeeName={committeeName}
        userName={user?.name ?? ""}
        onSend={handleNotifySend}
      />

      {editMetaDoc && (
        <DocumentMetaDialog
          open={editMetaDialogOpen}
          onClose={() => {
            setEditMetaDialogOpen(false);
            setEditMetaDoc(null);
          }}
          onBack={() => {
            setEditMetaDialogOpen(false);
            setEditMetaDoc(null);
          }}
          onSuccess={loadDocuments}
          typeCode={editMetaDoc.typeCode}
          typeName={editMetaDoc.typeName}
          committeeId={committeeId}
          documentTypeList={documentTypeList || []}
          documentItem={editMetaDoc}
          hideBack
        />
      )}
    </Container>
  );
}

