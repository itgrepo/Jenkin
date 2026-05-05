import {
  Directive,
  DirectiveListResponse,
  DirectiveSearchParams,
  Committee,
  CommitteeListResponse,
  CommitteeSearchParams,
  Expert,
  ExpertListResponse,
  ExpertGroupMember,
  ExpertGroupMemberListResponse,
  ExpertGroupMemberSearchParams,
} from "@models/expert";
import axios from "axios";



const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;


export const getExpertByUserId = async (userId: number) => {
    const res = await axios.get<Expert>(`${API_BASE}/expert/user/${userId}`);
    return res.data;
};


export const upsertExpert = async (req: Expert) => {
  const res = await axios.post<Expert>(`${API_BASE}/expert`, req);
  return res.data;
};

// Get list of experts with optional search
export const getExperts = async (params?: {
  name?: string;
}): Promise<ExpertListResponse> => {
  const res = await axios.get<ExpertListResponse>(`${API_BASE}/expert`, {
    params,
  });
  return res.data;
};

// Delete expert
export const deleteExpert = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/expert/${id}`);
};

// Get list of committees with search/filter
export const getExpertCommittees = async (
  params?: CommitteeSearchParams
): Promise<CommitteeListResponse> => {
  const res = await axios.get<CommitteeListResponse>(
    `${API_BASE}/expert/committees`,
    { params }
  );
  return res.data;
};

// Get committees that current logged-in user is a member of
export const getMyExpertCommittees = async (
  params?: CommitteeSearchParams
): Promise<CommitteeListResponse> => {
  const res = await axios.get<CommitteeListResponse>(
    `${API_BASE}/expert/committees/my`,
    { params }
  );
  return res.data;
};

// Get single committee by ID
export const getExpertCommitteeById = async (id: number): Promise<Committee> => {
  const res = await axios.get<Committee>(
    `${API_BASE}/expert/committees/${id}`
  );
  return res.data;
};

// Get single committee by number
export const getExpertCommitteeByNumber = async (number: string): Promise<string> => {
  const res = await axios.get<string>(
    `${API_BASE}/expert/committees/number/${number}`
  );
  return res.data;
};

// Get single committee by number
export const getExpertCommitteeBySubNumber = async (number: number): Promise<string[]> => {
  const res = await axios.get<string[]>(
    `${API_BASE}/expert/committees/subNumber/${number}`
  );
  return res.data;
};


// Create new committee
export const upsertExpertCommittee = async (
  data: Committee
): Promise<Committee> => {
  const res = await axios.post<Committee>(
    `${API_BASE}/expert/committees`,
    data
  );
  return res.data;
};


// Delete committee
export const deleteExpertCommittee = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/expert/committees/${id}`);
};


// List directives with optional search/filter
export const getDirectives = async (
  params?: DirectiveSearchParams
): Promise<DirectiveListResponse> => {
  const res = await axios.get<DirectiveListResponse>(
    `${API_BASE}/expert/directives`,
    { params }
  );
  return res.data;
};

// Get single directive
export const getDirectiveById = async (id: number): Promise<Directive> => {
  const res = await axios.get<Directive>(`${API_BASE}/expert/directives/${id}`);
  return res.data;
};

// Create or update directive (upsert)
export const upsertDirective = async (data: Directive): Promise<Directive> => {
  const res = await axios.post<Directive>(`${API_BASE}/expert/directives`, data);
  return res.data;
};

// Delete directive
export const deleteDirective = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/expert/directives/${id}`);
};

// Expert Group Members API
// Get list of expert group members
export const getExpertGroupMembers = async (
  params?: ExpertGroupMemberSearchParams
): Promise<ExpertGroupMemberListResponse> => {
  const res = await axios.get<ExpertGroupMemberListResponse>(
    `${API_BASE}/expert/committees/members`,
    { params }
  );
  return res.data;
};

// Get single expert group member by ID
export const getExpertGroupMemberById = async (id: number): Promise<ExpertGroupMember> => {
  const res = await axios.get<ExpertGroupMember>(
    `${API_BASE}/expert/committees/members/${id}`
  );
  return res.data;
};

// Create or update expert group member (upsert)
export const upsertExpertGroupMember = async (
  data: ExpertGroupMember
): Promise<ExpertGroupMember> => {
  const res = await axios.post<ExpertGroupMember>(
    `${API_BASE}/expert/committees/members`,
    data
  );
  return res.data;
};

// Delete expert group member
export const deleteExpertGroupMember = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/expert/committees/members/${id}`);
};



