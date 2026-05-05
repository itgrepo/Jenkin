// src/i18n.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector"; 

import th from "./lang/th.json";
import en from "./lang/en.json";

i18n
  .use(LanguageDetector) 
  .use(initReactI18next)
  .init({
    resources: {
      th: { translation: th },
      en: { translation: en },
    },
    lng: 'th',
    fallbackLng: "th", 
    supportedLngs: ["th", "en"], 
    detection: {
      order: ["localStorage", "navigator", "htmlTag"], 
      caches: ["localStorage"], 
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
