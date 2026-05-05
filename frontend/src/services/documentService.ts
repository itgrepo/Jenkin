import type {
  DocumentItem,
  DocumentListResponse,
  DocumentLogListResponse,
  DocumentSearchParams,
} from "@models/documents";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

export const getDocuments = async (
  params?: DocumentSearchParams
): Promise<DocumentListResponse> => {
  const res = await axios.get<DocumentListResponse>(`${API_BASE}/documents`, {
    params,
  });
  return res.data;
};

export const getDocument = async (id: number): Promise<DocumentItem> => {
  const res = await axios.get<DocumentItem>(`${API_BASE}/documents/${id}`);
  return res.data;
};

export const upsertDocument = async (
  payload: DocumentItem
): Promise<DocumentItem> => {
  const res = await axios.post<DocumentItem>(`${API_BASE}/documents`, payload);
  return res.data;
};

// Delete document
export const deleteDocument = async (id: number) => {
  await axios.delete(`${API_BASE}/documents/${id}`);
};

export interface NotifyDocumentPayload {
  subject?: string;
  body?: string;
}

export interface NotifyDocumentResponse {
  success: boolean;
  message: string;
  sentTo: number | null;
}

/**
 * Notify document (publish).
 * - กรณี 1 (แค่ Notify ไม่ส่ง email): ไม่ส่ง payload หรือส่ง payload ว่าง → POST without body / empty body
 * - กรณี 2 (Notify + ส่ง Email): ส่ง body { subject, body }
 */
export const notifyDocument = async (
  id: number,
  payload?: NotifyDocumentPayload
): Promise<NotifyDocumentResponse> => {
  const body =
    payload && (payload.subject != null || payload.body != null)
      ? { subject: payload.subject ?? "", body: payload.body ?? "" }
      : undefined;
  const res = await axios.post<NotifyDocumentResponse>(
    `${API_BASE}/documents/${id}/notify`,
    body
  );
  return res.data;
};



export const getDocumentLogs = async (documentId: number): Promise<DocumentLogListResponse> => {
  const res = await axios.get<DocumentLogListResponse>(
    `${API_BASE}/documents/${documentId}/logs`
  );
  return res.data;
};