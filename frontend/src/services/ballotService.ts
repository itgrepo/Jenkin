import {
  BallotDraft,
  BallotDraftListResponse,
  BallotDraftSearchParams,
  BallotRequest,
  BallotRequestListResponse,
  BallotRequestSearchParams,
  BallotRequestStatus,
  BallotResponse,
  BallotResponseListResponse,
  BallotResponseSearchParams,
} from "@models/ballot";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

// Get list of ballot drafts
export const getBallotDrafts = async (
  params?: BallotDraftSearchParams
): Promise<BallotDraftListResponse> => {
  const res = await axios.get<BallotDraftListResponse>(
    `${API_BASE}/ballot-draft`,
    {
      params,
    }
  );
  return res.data;
};

// Get single ballot draft by ID
export const getBallotDraftById = async (
  id: number
): Promise<BallotDraft> => {
  const res = await axios.get<BallotDraft>(`${API_BASE}/ballot-draft/${id}`);
  return res.data;
};

// Create or update ballot draft
export const upsertBallotDraft = async (
  draft: BallotDraft
): Promise<BallotDraft> => {
  const res = await axios.post<BallotDraft>(
    `${API_BASE}/ballot-draft`,
    draft,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Delete ballot draft
export const deleteBallotDraft = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/ballot-draft/${id}`);
};

// ========== Ballot Request APIs ==========

// Get list of ballot requests (filtered by status and creator)
export const getBallotRequests = async (
  params?: BallotRequestSearchParams
): Promise<BallotRequestListResponse> => {
  const res = await axios.get<BallotRequestListResponse>(
    `${API_BASE}/ballot-request`,
    {
      params,
    }
  );
  return res.data;
};

// Get single ballot request by ID
export const getBallotRequestById = async (
  id: number
): Promise<BallotRequest> => {
  const res = await axios.get<BallotRequest>(
    `${API_BASE}/ballot-request/${id}`
  );
  return res.data;
};

// Create or update ballot request
export const upsertBallotRequest = async (
  request: BallotRequest
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request`,
    request,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Delete ballot request
export const deleteBallotRequest = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/ballot-request/${id}`);
};

// Send ballot request for approval
export const sendBallotRequestForApproval = async (
  id: number,
  status: BallotRequestStatus
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request/${id}/send-approval`
  , {
    status,
  });
  return res.data;
};

// Approve ballot request
export const approveBallotRequest = async (
  id: number,
  level: 1 | 2, // 1 = manager, 2 = director
  remarks?: string
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request/${id}/approve`,
    { level, remarks }
  );
  return res.data;
};

// Disapprove ballot request
export const disapproveBallotRequest = async (
  id: number,
  level: 1 | 2, // 1 = manager, 2 = director
  remarks: string
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request/${id}/disapprove`,
    { level, remarks }
  );
  return res.data;
};

// Review ballot request (send back for revision)
export const reviewBallotRequest = async (
  id: number,
  level: 1 | 2, // 1 = manager, 2 = director
  remarks: string
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request/${id}/review`,
    { level, remarks }
  );
  return res.data;
};

// Close ballot request
export const closeBallotRequest = async (
  id: number
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request/${id}/close`
  );
  return res.data;
};

// Send email for ballot request
export const sendBallotRequestEmail = async (
  id: number
): Promise<BallotRequest> => {
  const res = await axios.post<BallotRequest>(
    `${API_BASE}/ballot-request/${id}/send-email`
  );
  return res.data;
};

// ========== Ballot Response APIs ==========

// Get list of ballot responses
export const getBallotResponses = async (
  params?: BallotResponseSearchParams
): Promise<BallotResponseListResponse> => {
  const res = await axios.get<BallotResponseListResponse>(
    `${API_BASE}/ballot-response`,
    {
      params,
    }
  );
  return res.data;
};

// Get single ballot response by ID
export const getBallotResponseById = async (
  id: number
): Promise<BallotResponse> => {
  const res = await axios.get<BallotResponse>(
    `${API_BASE}/ballot-response/${id}`
  );
  return res.data;
};

// Get ballot response by request ID and user ID
export const getBallotResponseByRequestAndUser = async (
  requestId: number,
  userId: number
): Promise<BallotResponse | null> => {
  try {
    const res = await axios.get<BallotResponse>(
      `${API_BASE}/ballot-response/request/${requestId}/user/${userId}`
    );
    return res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return null;
    }
    throw err;
  }
};

// Create or update ballot response
export const upsertBallotResponse = async (
  response: BallotResponse
): Promise<BallotResponse> => {
  const res = await axios.post<BallotResponse>(
    `${API_BASE}/ballot-response`,
    response,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Get available ballot requests for current user (for answering)
export const getAvailableBallotRequests = async (
  params?: { search?: string }
): Promise<BallotRequestListResponse> => {
  const res = await axios.get<BallotRequestListResponse>(
    `${API_BASE}/ballot-request/available`,
    {
      params,
    }
  );
  return res.data;
};

