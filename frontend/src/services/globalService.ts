import { District, MasterData, Province, SubDistrict, UploadResponse } from "@models/global";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

export const getProvince = async () => {
  const res = await axios.get<Province[]>(`${API_BASE}/province`);
  return res.data;
};

export const getDistrict = async (provId:number) => {
  const res = await axios.get<District[]>(`${API_BASE}/district/${provId}`);
  return res.data;
};

export const getSubDistrict = async (provId:number,districtId:number) => {
  const res = await axios.get<SubDistrict[]>(`${API_BASE}/subDistrict/${provId}/${districtId}`);
  return res.data;
};


export const getTitles = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/titles`);
  return res.data;
};

export const getBanks = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/banks`);
  return res.data;
};

export const getAccountTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/accountTypes`);
  return res.data;
};

export const getAcademy = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/academy`);
  return res.data;
};

export const getDegrees = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/degrees`);
  return res.data;
};

export const getYearSelect = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/yearSelect`);
  return res.data;
};

export const getCommitteeTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/committeeTypes`);
  return res.data;
};

export const getResponsibleGroups = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/responsible-groups`);
  return res.data;
};

export const getDepartments = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/departments`);
  return res.data;
};

export const getSubDepartmentsByDPisId = async (dpisId:string) => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/sub-departments/${dpisId}`);
  return res.data;
};

export const getSubDepartments = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/sub-departments`);
  return res.data;
};

export const getProductGroups = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/product-groups`);
  return res.data;
};

export const getGroupPositions = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/groupPositions`);
  return res.data;
};

export const getDirectiveTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/directiveTypes`);
  return res.data;
};

export const getExpertMemberTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/expert-member-types`);
  return res.data;
};

export const getOrganizations = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/organizations`);
  return res.data;
};

export const getExpenseTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/expense-types`);
  return res.data;
};

export const getBallotAnswerTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/ballot-answer-types`);
  return res.data;
};

export const getBallotGroupTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/ballot-group-types`);
  return res.data;
};


export const getBallotRequestStatuses = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/ballot-request-statuses`);
  return res.data;
};

// Project-related master data
export const getWriterTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/writer-types`);
  return res.data;
};

export const getStdTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/std-types`);
  return res.data;
};

export const getProductPolicyGroups = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/product-policy-groups`);
  return res.data;
};

export const getProductBCGs = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/product-bcgs`);
  return res.data;
};

export const getRegulations = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/regulations`);
  return res.data;
};

export const getMethodTypes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/method-types`);
  return res.data;
};

export const getTISProductGroups = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/tis-product-groups`);
  return res.data;
};

export const getNSSSectors = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/nss-sectors`);
  return res.data;
};

export const getNSSSubjects = async (sectorId?: number) => {
  const url = sectorId 
    ? `${API_BASE}/nss-subjects/${sectorId}`
    : `${API_BASE}/nss-subjects`;
  const res = await axios.get<MasterData[]>(url);
  return res.data;
};

export const getISODeliverables = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/iso-deliverables`);
  return res.data;
};

export const getISOICS = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/iso-ics`);
  return res.data;
};

export const getTISNumbers = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/tis-numbers`);
  return res.data;
};


export const getSDOS = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/sdos`);
  return res.data;
};

export const getStageCodes = async () => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/stage-codes`);
  return res.data;
};


// Get users from กองกำหนดมาตรฐาน (did = 08)
export const getStandardizationUsers = async (did: string) => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/users/department/${did}`);
  return res.data;
};


// Document types (masterdata: GET /masterdata/document-types)
export const getDocumentTypes = async (): Promise<MasterData[]> => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/document-types`);
  return res.data;
};

export const getDocumentSubTypes = async (): Promise<MasterData[]> => {
  const res = await axios.get<MasterData[]>(`${API_BASE}/document-sub-types`);
  return res.data;
};

export const uploadfile = (file: File, folder: string,objectName:string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  formData.append("objectName", objectName);

  // ไม่ต้อง set Content-Type header เพื่อให้ browser set ให้อัตโนมัติพร้อม boundary
  return axios.post<UploadResponse>(`${API_BASE}/uploadFile`, formData);
};

export const deletefile = (objectName:string) => {
  const req = {objectName: objectName};
  return axios.delete(`${API_BASE}/deleteFile`, { data: req });
};


/** Download file by path via API; triggers browser download. Uses axios to include auth token. */
export async function downloadFileServer(filePath: string, filename?: string) {
  const res = await axios.get(`${API_BASE}/files/download`, {
    params: { path: filePath },
    responseType: "blob",
  });
  const blob = res.data as Blob;
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename || filePath.split("/").pop() || "download";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

/** Fetch file by path via API; returns bytes for processing (e.g. PDF stamping). Uses axios to include auth token. */
export async function fetchFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  const res = await axios.get(`${API_BASE}/files/download`, {
    params: { path: filePath },
    responseType: "arraybuffer",
  });
  return res.data as ArrayBuffer;
}
