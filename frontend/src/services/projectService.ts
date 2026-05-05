import { Project, ProjectListResponse, ProjectLog, ProjectSearchParams, SaveStandardAnnouncementParams, TISStandardForReview, ProjectReview, ProjectReviewLog, ProjectReviewSearchParams, ProjectReviewListResponse } from "@models/projects";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;


// Get projects list
export const getProjects = async (params?: ProjectSearchParams) => {
  const res = await axios.get<ProjectListResponse>(`${API_BASE}/projects`, {
    params,
  });
  return res.data;
};

// Get project by ID
export const getProject = async (id: number) => {
  const res = await axios.get<Project>(`${API_BASE}/projects/${id}`);
  return res.data;
};

// Create project
export const upsertProject = async (project: Partial<Project>) => {
  const res = await axios.post<Project>(`${API_BASE}/projects`, project);
  return res.data;
};

// Update project Stage
export const updateProjectStage = async (project: Partial<Project>) => {
  const res = await axios.put<Project>(`${API_BASE}/projects/stage`, project);
  return res.data;
};

// Delete project
export const deleteProject = async (id: number) => {
  const res = await axios.delete(`${API_BASE}/projects/${id}`);
  return res.data;
};



// Get project logs
export const getProjectLogs = async (projectId: number) => {
  const res = await axios.get<ProjectLog[]>(`${API_BASE}/projects/${projectId}/logs`);
  return res.data;
};

// Update project log
export const upsertProjectLog = async (projectId: number, log: Partial<ProjectLog>) => {
  const res = await axios.post<ProjectLog>(`${API_BASE}/projects/${projectId}/logs`, log);
  return res.data;
};

// Check TIS number duplicate
export const checkTISNumber = async (tisNumber: string) => {
  const res = await axios.get<{ exists: boolean }>(`${API_BASE}/projects/check-tis-number`, {
    params: { tisNumber },
  });
  return res.data;
};




export const saveStandardAnnouncement = async (
  params: SaveStandardAnnouncementParams
) => {
  const res = await axios.post(
    `${API_BASE}/projects/${params.projectId}/save-standard-announcement`,
    params
  );
  return res.data;
};

export interface TISStandardForReviewListResponse {
  data: TISStandardForReview[];
  total?: number;
}

export const getTISStandardsForReview = async (
  params?: { search?: string }
): Promise<TISStandardForReviewListResponse> => {
  const res = await axios.get<TISStandardForReviewListResponse>(
    `${API_BASE}/projects/tis-standards-for-review`,
    {
      params,
    }
  );
  return res.data;
};



export const createReviewFromTIS = async (
  params: ProjectReview
) => {
  const res = await axios.post<ProjectReview>(
    `${API_BASE}/projects/create-review-from-tis`,
    params
  );
  return res.data;
};

// Save review ballot template
export interface SaveReviewBallotParams {
  name: string;
  circulationDays: number;
  questionText: string;
  answerType: number;
  hasTextInput: boolean;
  answers: Array<{ text: string; displayOrder?: number }>;
  attachments: Array<{ fileName: string; filePath: string; displayOrder?: number }>;
}

export const saveReviewBallot = async (
  params: SaveReviewBallotParams
) => {
  const res = await axios.post(
    `${API_BASE}/projects/review-ballot-template`,
    params
  );
  return res.data;
};

// ========== Project Review APIs ==========

// Get project reviews list
export const getProjectsReview = async (params?: ProjectReviewSearchParams) => {
  const res = await axios.get<ProjectReviewListResponse>(`${API_BASE}/project-review`, {
    params,
  });
  return res.data;
};

// Get project review by ID
export const getProjectReview = async (id: number) => {
  const res = await axios.get<ProjectReview>(`${API_BASE}/project-review/${id}`);
  return res.data;
};

// Create or update project review
export const upsertProjectReview = async (review: Partial<ProjectReview>) => {
  const res = await axios.post<ProjectReview>(`${API_BASE}/project-review`, review);
  return res.data;
};

// Update project review (เฉพาะ ownerGroupId)
export const updateProjectReview = async (review: Partial<ProjectReview>) => {
  const res = await axios.put<ProjectReview>(`${API_BASE}/project-review/${review.id}`, review);
  return res.data;
};

// Get project review logs
export const getProjectReviewLogs = async (projectReviewId: number) => {
  const res = await axios.get<ProjectReviewLog[]>(`${API_BASE}/project-review/${projectReviewId}/logs`);
  return res.data;
};

// Create or update project review log
export const upsertProjectReviewLog = async (
  projectReviewId: number,
  log: Partial<ProjectReviewLog>
) => {
  const res = await axios.post<ProjectReviewLog>(
    `${API_BASE}/project-review/${projectReviewId}/logs`,
    log
  );
  return res.data;
};
