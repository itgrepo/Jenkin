import {
  ssoLogin as ssoLoginApi,
  ssoProfileAdmin,
  ssoProfileUser,
} from "@services/authService";
import {
  setAuthUser,
  logout as logoutAction,
  logoutUser as logoutActionUser,
  setLoading,
} from "@store/authSlice";
import { useNavigate, useLocation } from "react-router-dom";
import { defaultAppSettings, ThemeContext } from "@theme/ThemeContext";
import { useContext } from "react";
import { useAppDispatch, useAppSelector } from "@hooks/useRedux";
import { UserInfo } from "@models/auth";
import axios from "axios";
import { isTokenExpired } from "@utils/tokenUtils";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);
  const { setAppSettings } = useContext(ThemeContext);

  const login = async (username: string, password: string) => {
    dispatch(setLoading(true));
    try {
      // Call SSO login API
      const response = await ssoLoginApi(username, password);
      const { user, token } = response;

      // Store token in localStorage and set as default header
      if (token) {
        localStorage.setItem("token", token);
        // Set token in axios default headers for subsequent requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Map SSO fields to UserInfo
      const userInfo: UserInfo = {
        // Core fields
        id: user.id,
        ...user,
      };

      dispatch(setAuthUser(userInfo));
      localStorage.setItem("user", JSON.stringify(userInfo));
      navigate("/");
    } catch (err) {
      dispatch(setLoading(false));
      throw err;
    }
  };


  const getProfileSSOAdmin = async (username: string) => {
    dispatch(setLoading(true));
    try {
      // Call SSO login API
      const response = await ssoProfileAdmin(username);
      const { user, token } = response;

      // Store token in localStorage and set as default header
      if (token) {
        localStorage.setItem("token", token);
        // Set token in axios default headers for subsequent requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Map SSO fields to UserInfo
      const userInfo: UserInfo = {
        // Core fields
        id: user.id,
        ...user,
      };

      dispatch(setAuthUser(userInfo));
      localStorage.setItem("user", JSON.stringify(userInfo));
      navigate("/");
    } catch (err) {
      dispatch(setLoading(false));
      throw err;
    }
  };

  const loginUser = async (username: string, password: string) => {
    dispatch(setLoading(true));
    try {
      // Call SSO login API
      const response = await ssoLoginApi(username, password);
      const { user, token } = response;

      // Store token in localStorage and set as default header
      if (token) {
        localStorage.setItem("token", token);
        // Set token in axios default headers for subsequent requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Map SSO fields to UserInfo
      const userInfo: UserInfo = {
        // Core fields
        id: user.id,
        ...user,
      };

      dispatch(setAuthUser(userInfo));
      localStorage.setItem("user", JSON.stringify(userInfo));
      navigate("/");
    } catch (err) {
      dispatch(setLoading(false));
      throw err;
    }
  };


  const getProfileSSOUser = async (username: string) => {
    dispatch(setLoading(true));
    try {
      // Call SSO login API
      const response = await ssoProfileUser(username);
      const { user, token } = response;

      // Store token in localStorage and set as default header
      if (token) {
        localStorage.setItem("token", token);
        // Set token in axios default headers for subsequent requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      }

      // Map SSO fields to UserInfo
      const userInfo: UserInfo = {
        // Core fields
        id: user.id,
        ...user,
      };

      dispatch(setAuthUser(userInfo));
      localStorage.setItem("user", JSON.stringify(userInfo));
      navigate("/");
    } catch (err) {
      dispatch(setLoading(false));
      throw err;
    }
  };

  const logout = async () => {
    // await logoutApi();
    dispatch(logoutAction());
    setAppSettings(defaultAppSettings);
    localStorage.clear();
    navigate("/login-admin");
  };

  const logoutUser = async () => {
    // await logoutApi();
    dispatch(logoutActionUser());
    setAppSettings(defaultAppSettings);
    localStorage.clear();
    navigate("/login");
  };

  /**
   * Determine login path based on user role
   * Admin/Approve roles (1-5) → /login-admin
   * User role (6) → /login
   */
  const getLoginPathByRole = (user: UserInfo | null): string => {
    if (!user?.role?.id) {
      return "/login-admin"; // default
    }
    
    const roleId = user.role.id;
    // Role IDs 1-5 are admin/approve roles, 6 is user
    if (roleId === 6) {
      return "/login";
    }
    // Role IDs 1-5 (Super Admin, ผอ., เจ้าหน้าที่, ผก., ฝบ.)
    return "/login-admin";
  };

  const checkSession = async () => {
    dispatch(setLoading(true));
    try {
      const token = localStorage.getItem("token");
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;

      // Check if user is already on a login page
      const isOnLoginPage = 
        location.pathname === "/login" || 
        location.pathname === "/login-admin" || 
        location.pathname === "/login-Iindustry";

      // Check if token exists and is not expired
      if (token && isTokenExpired(token)) {
        // Token expired, clear storage and redirect to appropriate login page
        const loginPath = getLoginPathByRole(user);
        dispatch(setLoading(false));
        localStorage.clear();
        axios.defaults.headers.common["Authorization"] = "";
        
        // Dispatch appropriate logout action based on role
        if (user?.role?.id === 6) {
          dispatch(logoutActionUser());
        } else {
          dispatch(logoutAction());
        }
        
        // Only redirect if not already on a login page
        if (!isOnLoginPage) {
          navigate(loginPath);
        }
        return;
      }

      // If no token or token is invalid, clear and logout
      if (!token) {
        const loginPath = getLoginPathByRole(user);
        dispatch(setLoading(false));
        localStorage.clear();
        axios.defaults.headers.common["Authorization"] = "";
        
        if (user?.role?.id === 6) {
          dispatch(logoutActionUser());
        } else {
          dispatch(logoutAction());
        }
        
        // Only redirect if not already on a login page
        if (!isOnLoginPage) {
          navigate(loginPath);
        }
        return;
      }

      // Token is valid, restore user session
      if (user?.id) {
        // Set token in axios default headers
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        dispatch(setAuthUser(user));
      } else {
        // No user data, logout
        const loginPath = getLoginPathByRole(user);
        dispatch(setLoading(false));
        localStorage.clear();
        axios.defaults.headers.common["Authorization"] = "";
        dispatch(logoutActionUser());
        
        // Only redirect if not already on a login page
        if (!isOnLoginPage) {
          navigate(loginPath);
        }
      }
    } catch (error) {
      // On error, clear and logout
      const userRaw = localStorage.getItem("user");
      const user = userRaw ? JSON.parse(userRaw) : null;
      const loginPath = getLoginPathByRole(user);
      dispatch(setLoading(false));
      localStorage.clear();
      axios.defaults.headers.common["Authorization"] = "";
      dispatch(logoutActionUser());
      
      // Check if user is already on a login page
      const isOnLoginPage = 
        location.pathname === "/login" || 
        location.pathname === "/login-admin" || 
        location.pathname === "/login-Iindustry";
      
      // Only redirect if not already on a login page
      if (!isOnLoginPage) {
        navigate(loginPath);
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { auth, login, loginUser, logout, checkSession, logoutUser,getProfileSSOUser,getProfileSSOAdmin };
}
