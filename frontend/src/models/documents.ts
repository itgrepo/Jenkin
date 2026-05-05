export interface DocumentItem {
  id?: number;
  nNumber?: number | null; // N Number index
  title: string;
  typeCode: string; // GENERAL / MEETING / PROJECT / BALLOT / RESOLUTION / FILE / FOLDER
  typeName: string;
  subTypeCode?: string | null;
  subTypeName?: string | null;
  meetingName?: string | null;
  meetingId?: number | null;
  projectName?: string | null;
  projectId?: number | null;
  ballotName?: string;
  ballotId?: number | null;
  expectedAction?: string | null;
  expectedDate?: string | null;
  description?: string | null;
  replaces?: string | null;
  status?: string | null; // To be notified / Notified / Draft / Deleted
  filePath?: string | null;
  mimeType?: string | null;
  committeeId?: number;
  modifiedAt?: string | null;
  createdAt?: string | null;
  createdBy?: number | null;
  version?: number | null;
  createdByName?: string | null;
	updatedByName ?: string | null;
}


export interface DocumentSearchParams {
  title?: string;
  type?: string;
  committeeId?: number;
  /** กรองเอกสารที่อยู่ภายใต้ folder นี้ (filePath prefix) */
  folderPath?: string;
}

export interface DocumentListResponse {
  data: DocumentItem[];
}


export interface LocationStateDocumentView {
  doc?: DocumentItem;
  committeeId?: number;
  committeeName?: string;
  committeeNumber?: string;
}


export interface DocumentLog {
  id?: number;
  documentId: number;
  action: string;
  actionDetail?: string;
  actionAt?: string; // ISO datetime string
  actionBy?: number;
  actionByName?: string;
  actionByRoleID?: number;
  actionByRoleName?: string;
}

export interface DocumentLogListResponse {
  data: DocumentLog[];
}