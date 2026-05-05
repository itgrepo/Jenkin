// hooks/useValidateFile.ts
import { useTranslation } from "react-i18next";

export const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];

export const MAX_FILE_SIZE_MB = 10;

export function useValidateFile() {
  const { t } = useTranslation();

  function validate(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return t("invalidType", {
        defaultValue:
          "ไฟล์ต้องเป็น PNG, JPG, PDF, Word, Excel หรือ PowerPoint เท่านั้น",
      });
    }

    const sizeMB = file.size / 1024 / 1024;
    if (sizeMB > MAX_FILE_SIZE_MB) {
      return t("tooLarge", {
        size: MAX_FILE_SIZE_MB,
        defaultValue: `ขนาดไฟล์ต้องไม่เกิน {{size}} MB`,
      });
    }

    return null; // ✅ valid
  }

  return { validate };
}
