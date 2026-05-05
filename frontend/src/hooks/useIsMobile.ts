import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * Hook สำหรับเช็คว่าเป็นอุปกรณ์ Mobile (จอเล็กกว่าความกว้าง "md")
 * @returns boolean - true ถ้าเป็น mobile device
 */
const useIsMobile = (): boolean => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  return isMobile;
};

export default useIsMobile;
