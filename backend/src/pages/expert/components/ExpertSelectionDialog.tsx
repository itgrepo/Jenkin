import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  IconButton,
  Checkbox,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Close, Search } from "@mui/icons-material";
import PeopleIcon from "@mui/icons-material/People";

interface Expert {
  id: string;
  idCard: string;
  fullName: string;
  qualification: string;
  expertise: string;
  email: string;
  phone: string;
  organization: string;
}

interface ExpertSelectionDialogProps {
  open: boolean;
  availableExperts: Expert[];
  selectedExpertIds: string[];
  onClose: () => void;
  onSelect: (expertIds: string[]) => void;
}

export default function ExpertSelectionDialog({
  open,
  availableExperts,
  selectedExpertIds,
  onClose,
  onSelect,
}: ExpertSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedExpertIds);
  const theme = useTheme();
  const isMobileDialog = useMediaQuery(theme.breakpoints.down("md"));

  const handleToggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredExperts.map((e) => e.id));
    } else {
      setSelected([]);
    }
  };

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  // Filter experts based on search term
  const filteredExperts = availableExperts.filter(
    (expert) =>
      expert.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expert.idCard.includes(searchTerm) ||
      expert.organization.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allSelected =
    filteredExperts.length > 0 &&
    filteredExperts.every((e) => selected.includes(e.id));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
        <PeopleIcon sx={{ fontSize: 28 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            เลือกผู้เชี่ยวชาญ
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            เลือกผู้เชี่ยวชาญเพื่อเพิ่มเข้าคณะ
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

      <DialogContent dividers>
        {/* Search Section */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="ค้นหาด้วยชื่อ, เลขบัตรประชาชน, หรือหน่วยงาน"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: "action.active" }} />,
            }}
          />
        </Box>

        {/* Expert List Table */}
        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={
                      selected.length > 0 && selected.length < filteredExperts.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>บัตรประชาชน</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>ชื่อผู้เชี่ยวชาญ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>คุณวุฒิ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>สาขาความเชี่ยวชาญ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>หน่วยงาน</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExperts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      {searchTerm
                        ? "ไม่พบผู้เชี่ยวชาญที่ค้นหา"
                        : "ไม่มีข้อมูลผู้เชี่ยวชาญ"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredExperts.map((expert) => (
                  <TableRow
                    key={expert.id}
                    hover
                    onClick={() => handleToggle(expert.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.includes(expert.id)} />
                    </TableCell>
                    <TableCell>{expert.idCard}</TableCell>
                    <TableCell>{expert.fullName}</TableCell>
                    <TableCell>{expert.qualification}</TableCell>
                    <TableCell>{expert.expertise}</TableCell>
                    <TableCell>{expert.organization}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Selected Count */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            เลือกแล้ว: <strong>{selected.length}</strong> คน
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          ยกเลิก
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={selected.length === 0}
        >
          เพิ่มผู้เชี่ยวชาญ ({selected.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

