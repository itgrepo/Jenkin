import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import { UserInfo } from "@models/auth";
import { showConfirm, showSuccess } from "@components/Swal";
import UserManagementDialog from "@components/UserManagementDialog";
import { useAppSelector } from "@hooks/useRedux";


// Fallback sample users (5 records covering all roles)
const sampleUsers: UserInfo[] = [
 
  {
    id: 105,
    username : "staff02",
    name: "วราภรณ์",
    name_en: "มีสุข",
    email: "staff02@example.com",
    state: 2,
    role: { id: 3, name: "เจ้าหน้าที่" },
  },
  {
    id: 106,
    username: "user01",
    name: "ผู้ประกอบการ1",
    name_en: "ผู้ประกอบการ1",
    email: "user01@example.com",
    state: 2,
    role: { id: 6, name: "ผู้ประกอบการ" },
  },
];

export default function UserManagementPage(): ReactElement {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state?.auth?.user);
  const [users, setUsers] = useState<UserInfo[]>(sampleUsers);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null);

  const pageTitle = useMemo(() => "การจัดการผู้ใช้งาน", []);

  // No API: initialize local mock data only
  useEffect(() => {
    setIsLoading(false);
    setUsers(sampleUsers);
  }, []);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: UserInfo) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDeleteUser = async (user: UserInfo) => {
    const confirm = await showConfirm(
      "ยืนยันการลบ",
      `คุณต้องการลบผู้ใช้ ${user.username} ใช่หรือไม่?`
    );
    if (!confirm.isConfirmed || !user.id) return;
    let deleted: any = null;
    try {
      // const res = await deleteUser(user.id);
      // deleted = (res as any)?.data ?? res;
    } catch {
      deleted = null;
    }
    console.log("deleted", deleted);
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    showSuccess("สำเร็จ", "ลบผู้ใช้เรียบร้อยแล้ว");
  };

  const handleSave = async (
    data: UserInfo & { password?: string; currentPassword?: string }
  ) => {
    if (editingUser?.id) {
      let updated: any = null;
      try {
        // const res = await updateUser(data.id||0, data);
        // updated = (res as any)?.data ?? res;
      } catch {
        updated = null;
      }
      console.log("updated", updated);
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u))
      );
      showSuccess("สำเร็จ", "แก้ไขข้อมูลผู้ใช้เรียบร้อยแล้ว");
    } else {
      let created: any = null;
      try {
        // const res = await createUser(data);
        // created = (res as any)?.data ?? res;
      } catch {
        created = null;
      }
      console.log("created", created);
      const nextId =
        (users.reduce((max, u) => Math.max(max, u.id ?? 0), 0) || 0) + 1;
      const newUser: UserInfo = {
        ...(data as UserInfo),
        id: nextId,
      };
      setUsers((prev) => [newUser, ...prev]);
      showSuccess("สำเร็จ", "เพิ่มผู้ใช้เรียบร้อยแล้ว");
    }
    setIsDialogOpen(false);
    setEditingUser(null);
  };


  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {pageTitle}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          {t("addUser", { defaultValue: "เพิ่มผู้ใช้ใหม่" })}
        </Button>
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {isLoading ? (
          <Box display="flex" alignItems="center" justifyContent="center" p={6}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table size="small" stickyHeader>
              <TableHead
                sx={{
                  '& .MuiTableCell-head': {
                    fontWeight: 700,
                    color: 'text.primary',
                    backgroundColor: (theme) => theme.palette.grey[100],
                    borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
                  },
                }}
              >
                <TableRow>
                  <TableCell>ชื่อผู้ใช้</TableCell>
                  <TableCell>ชื่อ - นามสกุล</TableCell>
                  <TableCell>อีเมล</TableCell>
                  <TableCell>บทบาท</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Authorize</TableCell>
                  <TableCell>สถานะ</TableCell>
                  <TableCell align="right">การจัดการ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users?.length ? (
                  users.map((u) => (
                    <TableRow
                      key={u.id ?? u.username}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: (theme) => theme.palette.action.hover,
                        },
                        '&:last-child td, &:last-child th': { border: 0 },
                      }}
                    >
                      <TableCell>{u.username}</TableCell>
                      <TableCell>
                        {`${u.name ?? ""} ${u.name_en ?? ""}`.trim()}
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        {u.role.name || u.role?.name ? (
                          <Chip
                            size="small"
                            color="primary"
                            variant="outlined"
                            label={u.role.name ?? u.role?.name}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {u.role.name && u.role.name !== "user" ? (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            <Chip size="small" label={u.role.name} color="primary" variant="outlined" />
                          </Stack>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {u.state ? (
                          <Chip
                            size="small"
                            label={`Approve ${u.state}`}
                            color={u.state >= 3 ? 'success' : u.state === 2 ? 'info' : 'default'}
                            variant="outlined"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {u.state ? (
                          <Chip
                            size="small"
                            label={u.state}
                            color={u.state === 2 ? 'success' : 'default'}
                            variant="outlined"
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {u.id !== user?.id && (
                          <>
                            <IconButton
                              aria-label="edit"
                              size="small"
                              onClick={() => handleEditUser(u)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              aria-label="delete"
                              size="small"
                              color="error"
                              onClick={() => handleDeleteUser(u)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ py: 8, color: "text.secondary" }}
                    >
                      ไม่มีข้อมูลผู้ใช้
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {isDialogOpen && (
        <UserManagementDialog
          open={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
          profile={editingUser}
        />
      )}
    </Box>
  );
}
