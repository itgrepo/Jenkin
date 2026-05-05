// src/theme/ThemeContext.tsx

import i18n from "@locales/i18n";
import { AppSettings } from "@models/dashboard";
import { createContext, useState, ReactNode } from "react";
import logo from "@assets/images/logo.png";

export const defaultAppSettings: AppSettings = {
  appName: [
    { lang: "th", name: i18n.t("appName", { lng: "th" }) },
    { lang: "en", name: i18n.t("appName", { lng: "en" }) },
  ],
  logo: logo,
  darkMode: false,
  primaryColor: import.meta.env.VITE_APP_PRIMARY_COLOR,
  secondaryColor: import.meta.env.VITE_APP_SECONDARY_COLOR,
};

export const ThemeContext = createContext<{
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}>({
  appSettings: defaultAppSettings,
  setAppSettings: () => {},
});

export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const [appSettings, setAppSettings] =
    useState<AppSettings>(defaultAppSettings);

  return (
    <ThemeContext.Provider value={{ appSettings, setAppSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};
