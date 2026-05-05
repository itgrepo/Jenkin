import Swal from 'sweetalert2';
import i18n from '@locales/i18n'; // ✅ ให้แน่ใจว่าชี้มาถูก path

const t = i18n.t.bind(i18n); // สำหรับเรียกใช้คำแปลแม้ไม่อยู่ใน React context

export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: t('confirm'),
  });
};

export const showInfo = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: t('confirm'),
  });
};

export const showWarning = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonText: t('confirm'),
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: t('confirm'),
  });
};

export const showConfirm = async (
  title: string,
  text: string = '',
  confirmText: string = t('confirm'),
  cancelText: string = t('cancel')
) => {
  return await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    customClass: { confirmButton: "mui-confirm-btn" },
  });
};

export const showConfirmInfo = async (
  title: string,
  text: string = '',
) => {
  return await Swal.fire({
    title,
    text,
    icon: 'info',
    showCancelButton: false,
    confirmButtonText: t('confirm'),
  });
};