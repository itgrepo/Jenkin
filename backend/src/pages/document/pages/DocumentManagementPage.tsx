import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Description, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getMyExpertCommittees } from "@services/expertService";
import type { Committee } from "@models/expert";
import type { AxiosError } from "axios";

type GroupOption = { code: string; name: string };

export default function DocumentManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCommitteeName, setSearchCommitteeName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<GroupOption | null>(null);

  type ApiErrorBody = { message?: string; error?: string };
  const getApiErrorMessage = (err: unknown): string | undefined => {
    const axiosErr = err as AxiosError<ApiErrorBody>;
    return axiosErr?.response?.data?.message || axiosErr?.response?.data?.error;
  };

  useEffect(() => {
    loadCommittees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCommittees = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await getMyExpertCommittees({
        committeeName: searchCommitteeName.trim() || undefined,
        page: 1,
        limit: 500,
      });

      setCommittees(res.data || []);
    } catch (err: unknown) {
      console.error("Error loading committees:", err);
      setError(
        getApiErrorMessage(err) || "ไม่สามารถโหลดข้อมูลคณะผู้เชี่ยวชาญได้"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCommittees();
  };

  const handleOpen = (committee: Committee) => {
    const params = new URLSearchParams();
    params.set("committeeId", String(committee.id));
    if (committee.committeeNumber) {
      params.set("committeeNumber", committee.committeeNumber);
    }
    if (committee.committeeNameTh) {
      params.set("committeeName", committee.committeeNameTh);
    }
    navigate(`/documents/document-list?${params.toString()}`);
  };

  const renderType = (c: Committee) => c.committeeTypeName || `${c.committeeType}`;
  const renderParent = (c: Committee) =>
    c.subCommitteeOfName || c.subCommitteeOf || "-";

  const myGroups = useMemo(() => {
    const seen = new Set<string>();
    const list: GroupOption[] = [];
    for (const c of committees) {
      const code = (c.responsibleGroupId ?? "").trim();
      const name = (c.committeeTypeName ?? "").trim();
      if (!code && !name) continue;
      const key = `${code}|${name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ code, name });
    }
    list.sort((a, b) =>
      (a.name || a.code).localeCompare(b.name || b.code, "th")
    );
    return list;
  }, [committees]);

  const filteredCommittees = useMemo(() => {
    if (!selectedGroup) return committees;
    return committees.filter(
      (c) =>
        c.responsibleGroupId === selectedGroup.code ||
        c.responsibleGroup === selectedGroup.name
    );
  }, [committees, selectedGroup]);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Description sx={{ fontSize: 32, color: "primary.main" }} />
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "primary.main", lineHeight: 1.1 }}
          >
            จัดการเอกสาร
          </Typography>
        </Box>
      </Box>


      {/* Committee group chips */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: 2,
          p: 1.5,
          overflowX: "auto",
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { background: "#ccc", borderRadius: 3 },
        }}
      >
        <Chip
          label="ทั้งหมด"
          onClick={() => setSelectedGroup(null)}
          sx={{
            cursor: "pointer",
            bgcolor: selectedGroup ? "#4a4a4a" : theme.palette.warning.main,
            color: "#fff",
            fontWeight: 600,
            "&:hover": {
              bgcolor: selectedGroup ? "#5a5a5a" : theme.palette.warning.dark,
            },
          }}
        />
        {myGroups.map((g) => {
          const label = g.name || g.code || "-";
          const isSelected =
            selectedGroup?.code === g.code && selectedGroup?.name === g.name;
          return (
            <Chip
              key={g.code || g.name || label}
              label={label}
              onClick={() => setSelectedGroup(g)}
              sx={{
                cursor: "pointer",
                bgcolor: isSelected ? theme.palette.warning.main : "#4a4a4a",
                color: "#fff",
                fontWeight: 600,
                "&:hover": {
                  bgcolor: isSelected ? theme.palette.warning.dark : "#5a5a5a",
                },
              }}
            />
          );
        })}
      </Box>

      {/* Search */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: { xs: "stretch", md: "center" },
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          <Box sx={{ minWidth: { xs: "auto", md: 90 } }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 600, mt: { xs: 0, md: 1 } }}
            >
              ชื่อคณะ:
            </Typography>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="พิมพ์ชื่อคณะเพื่อค้นหา"
            value={searchCommitteeName}
            onChange={(e) => setSearchCommitteeName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            sx={{
              minWidth:"70%",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "white",
              },
            }}
          />

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
        </Box>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer
          component={Paper}
          elevation={2}
          sx={{
            borderRadius: 2,
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
        <Table sx={{ minWidth: 900 }}>
          <TableHead>
          <TableRow sx={{ bgcolor: "primary.main" }}>
              <TableCell
                align="center"
                sx={{ color: "white", fontWeight: 800 }}
                width={140}
              >
                คณะเลขที่
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 800 }} width={220}>
                คณะที่อยู่ภายใต้
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 800 }}>
                ชื่อคณะ
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "white", fontWeight: 800 }}
                width={140}
              >
                ประเภท
              </TableCell>
              <TableCell
                align="center"
                sx={{ color: "white", fontWeight: 800 }}
                width={140}
              >
                การทำงาน
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredCommittees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    ไม่พบข้อมูลคณะ
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCommittees.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell align="center">{c.committeeNumber || "-"}</TableCell>
                  <TableCell>{renderParent(c)}</TableCell>
                  <TableCell>{c.committeeNameTh}</TableCell>
                  <TableCell align="center">{renderType(c)}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      onClick={() => handleOpen(c)}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 800,
                        px: 3,
                      }}
                    >
                      เปิด
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

