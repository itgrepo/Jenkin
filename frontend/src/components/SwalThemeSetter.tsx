// components/SwalThemeSetter.tsx
import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";

/**
 * ตั้งค่า CSS Variables ให้ SweetAlert2 ใช้สีตรงกับ MUI Theme
 */
const SwalThemeSetter = () => {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.style.setProperty("--swal-confirm-color", theme.palette.primary.main);
    document.documentElement.style.setProperty("--swal-cancel-color", theme.palette.grey[700]);
  }, [theme]);

  return null;
};

export default SwalThemeSetter;
