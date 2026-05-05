import { UserInfo } from "@models/auth";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

// Get list of users (for approver selection)
export const getUsers = async (params?: {
  roleId?: number;
  reg_subdepart?: string;
  search?: string;
}): Promise<UserInfo[]> => {
  const res = await axios.get<UserInfo[]>(`${API_BASE}/users`, {
    params,
  });
  return res.data;
};

// Get users by role (for approver selection)
export const getUsersByRole = async (roleIds: number[]): Promise<UserInfo[]> => {
  const res = await axios.get<UserInfo[]>(`${API_BASE}/users/by-role`, {
    params: { roleIds: roleIds.join(",") },
  });
  return res.data;
};

