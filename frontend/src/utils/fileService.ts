import { deletefile, uploadfile } from "@services/globalService";

// fileService.ts
interface UploadOptions {
  file: File;
  folder: string;
  oldFile?: string; // ถ้ามีไฟล์เก่า ให้ลบก่อน
}

export async function uploadFileServer({ file, folder, oldFile }: UploadOptions) {
  try {
    // ตรวจสอบว่า file มีค่าหรือไม่
    if (!file) {
      console.error("Upload error: No file provided");
      throw new Error("ไม่พบไฟล์ที่ต้องการอัปโหลด");
    }

    // console.log("Uploading file:", {
    //   name: file.name,
    //   size: file.size,
    //   type: file.type,
    //   folder,
    // });

    // ลบไฟล์เก่า ถ้ามี
    if (oldFile) {
      await deletefile(oldFile);
    }

    // อัปโหลดไฟล์ใหม่
    const res = await uploadfile(file, folder, "");
    
    // console.log("Upload response:", res?.data);
    
    if (res?.data?.filename) {
      return res.data.filename;
    }

    // ถ้าไม่มี filename ใน response ให้ throw error
    throw new Error("ไม่พบไฟล์ที่อัปโหลด");
  } catch (error: any) {
    console.error("Upload error:", error);
    // ถ้าเป็น error จาก axios ให้ throw ต่อ
    if (error?.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    if (error?.message) {
      throw error;
    }
    throw new Error("ไม่สามารถอัปโหลดไฟล์ได้");
  }
}

/** Fetch by URL and trigger browser download (e.g. Minio direct URL). */
export async function downloadFile(url: string, filename?: string) {
  const res = await fetch(url, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    referrerPolicy: "no-referrer",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename || url.split("/").pop() || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}


export function getFileDownloadUrl(filePath: string) {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string;
  const safePath = filePath ?? "";
  return `${apiBase}/files/download?path=${encodeURIComponent(safePath)}`;
}