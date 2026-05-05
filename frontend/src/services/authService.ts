
import { SSOAuthResponse } from '@models/auth';
import axios from 'axios';
import { isTokenExpired } from '@utils/tokenUtils';

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

// Request interceptor to check token expiration before making requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    
    // Check if token exists and is expired
    if (token && isTokenExpired(token)) {
      // Token expired, clear storage and redirect
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      
      // Determine login path based on role
      const loginPath = user?.role?.id === 6 ? "/login" : "/login-admin";
      
      localStorage.clear();
      axios.defaults.headers.common["Authorization"] = "";
      
      // Redirect to login page
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath;
      }
      
      // Cancel the request
      return Promise.reject(new Error("Token expired"));
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      const token = localStorage.getItem("token");
      
      // Check if token is expired
      if (token && isTokenExpired(token)) {
        // Token expired, clear storage
        const userRaw = localStorage.getItem("user");
        const user = userRaw ? JSON.parse(userRaw) : null;
        
        // Determine login path based on role
        const loginPath = user?.role?.id === 6 ? "/login" : "/login-admin";
        
        localStorage.clear();
        axios.defaults.headers.common["Authorization"] = "";
        
        // Redirect to login page
        if (window.location.pathname !== loginPath) {
          window.location.href = loginPath;
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export const login = async (username: string, password: string) => {
  const res=await axios.post(`${API_BASE}/auth/login`, { username, password });
  return res.data.user;
};

export const ssoLoginAdmin = async (username: string, password: string) => {
  const res = await axios.post<SSOAuthResponse>(`${API_BASE}/sso/login/admin`, { username, password });
  return res.data; // { user: UserInfo, token: string }
};

export const ssoProfileAdmin= async (username: string) => {
  const res = await axios.post<SSOAuthResponse>(`${API_BASE}/sso/profile-admin`, { username});
  return res.data; // { user: UserInfo, token: string }
};

export const ssoLogin = async (username: string, password: string) => {
  const res = await axios.post<SSOAuthResponse>(`${API_BASE}/sso/login`, { username, password });
  return res.data; // { user: UserInfo, token: string }
};

export const ssoProfileUser= async (username: string) => {
  const res = await axios.post<SSOAuthResponse>(`${API_BASE}/sso/profile`, { username});
  return res.data; // { user: UserInfo, token: string }
};


export const logout = async () => {
  await axios.post(`${API_BASE}/logout`, {});
};
