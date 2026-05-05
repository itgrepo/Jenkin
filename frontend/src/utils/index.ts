import { AppSettings } from "@models/dashboard";

function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function stringAvatar(name: string) {
  if (!name || name.trim() === "") {
    return {
      sx: {
        bgcolor: stringToColor("User"),
        width: 56,
        height: 56,
      },
      children: "U",
    };
  }
  
  const parts = name.trim().split(" ");
  const firstChar = parts[0]?.[0]?.toUpperCase() || "U";
  const secondChar = parts[1]?.[0]?.toUpperCase() || "";
  
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 56,
      height: 56,
    },
    children: `${firstChar}${secondChar}`,
  };
}

export function stringAvatarText(name: string) {
  if (!name || name.trim() === "") {
    return {
      sx: {
        bgcolor: stringToColor("User"),
        width: 40,
        height: 40,
      },
      children: "U",
    };
  }
  
  const parts = name.trim().split(" ");
  const firstChar = parts[0]?.[0]?.toUpperCase() || "U";
  const secondChar = parts[1]?.[0]?.toUpperCase() || "";
  
  return {
    sx: {
      bgcolor: stringToColor(name),
      width: 40,
      height: 40,
    },
    children: `${firstChar}${secondChar}`,
  };
}
export const getRowsPerPageOptions = (): number[] => {
  const defaultOptions = [20, 50, 100];

  try {
    const raw = import.meta.env.VITE_APP_ROWSPERPAGE_LIST || "[]";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === "number")) {
      return parsed;
    }
  } catch (e) {
    //console.warn("Invalid VITE_APP_ROWSPERPAGE_LIST, fallback to default");
  }

  return defaultOptions;
};

export const getAppNameByLang = (settings: AppSettings, lang: string) => {
  const translation = settings.appName.find((t) => t.lang === lang);
  return translation?.name || "App";
};

export function getMinioFullUrl(path: string): string {
  const base = import.meta.env.VITE_APP_MINIO_URL || "";
  if (!path) return base;
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export const getFileNameFromPath = (path: string | null | undefined): string => {
  if (!path) return "";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
};

export function randomString(length: number): string {
  return Math.random().toString(36).substring(2, 2 + length);
};