import {
  MeetingBudget,
  MeetingBudgetListResponse,
  MeetingBudgetSearchParams,
  Meeting,
  MeetingListResponse,
  MeetingSearchParams,
  MeetingExpense,
  MeetingExpenseBudgetInfo,
  MeetingInvitation,
  MeetingTopic,
  MeetingTopicListResponse,
  MeetingParticipant,
  MeetingParticipantListResponse,
  DisbursementSummary,
  DisbursementSummaryListResponse,
  MeetingWithRegistration,
  MeetingRegistration,
} from "@models/meeting";
import { ProjectListResponse, ProjectSearchParams } from "@models/projects";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

// Get list of meeting budgets with optional search/filter
export const getMeetingBudgets = async (
  params?: MeetingBudgetSearchParams
): Promise<MeetingBudgetListResponse> => {
  const res = await axios.get<MeetingBudgetListResponse>(
    `${API_BASE}/meeting-budget`,
    {
      params,
    }
  );
  return res.data;
};

// Get single meeting budget by ID
export const getMeetingBudgetById = async (
  id: number
): Promise<MeetingBudget> => {
  const res = await axios.get<MeetingBudget>(`${API_BASE}/meeting-budget/${id}`);
  return res.data;
};

// Create or update meeting budget
export const upsertMeetingBudget = async (
  budget: MeetingBudget
): Promise<MeetingBudget> => {
  const res = await axios.post<MeetingBudget>(
    `${API_BASE}/meeting-budget`,
    budget
  );
  return res.data;
};

// Delete meeting budget
export const deleteMeetingBudget = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/meeting-budget/${id}`);
};

// Get list of unapproved meetings with optional search/filter
export const getUnapprovedMeetings = async (
  params?: MeetingSearchParams
): Promise<MeetingListResponse> => {
  const res = await axios.get<MeetingListResponse>(
    `${API_BASE}/meeting/unapproved`,
    {
      params,
    }
  );
  return res.data;
};

// Get list of approved meetings with optional search/filter
export const getApprovedMeetings = async (
  params?: MeetingSearchParams
): Promise<MeetingListResponse> => {
  const res = await axios.get<MeetingListResponse>(
    `${API_BASE}/meeting/approved`,
    {
      params,
    }
  );
  return res.data;
};

// Get single meeting by ID
export const getMeetingById = async (id: number): Promise<Meeting> => {
  const res = await axios.get<Meeting>(`${API_BASE}/meeting/${id}`);
  return res.data;
};

// Create or update meeting
export const upsertMeeting = async (
  meeting: Meeting
): Promise<Meeting> => {
  const res = await axios.post<Meeting>(`${API_BASE}/meeting`, meeting);
  return res.data;
};

// Delete meeting
export const deleteMeeting = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE}/meeting/${id}`);
};

// Send meeting for approval
export const sendMeetingForApproval = async (
  id: number,
  level: 1 | 2
): Promise<Meeting> => {
  const res = await axios.post<Meeting>(
    `${API_BASE}/meeting/${id}/send-approval`,
    { level }
  );
  return res.data;
};

// Get meeting expense by meeting ID
export const getMeetingExpense = async (
  meetingId: number
): Promise<MeetingExpense> => {
  const res = await axios.get<MeetingExpense>(
    `${API_BASE}/meeting/${meetingId}/expense`
  );
  return res.data;
};

// Create or update meeting expense
export const upsertMeetingExpense = async (
  expense: MeetingExpense
): Promise<MeetingExpense> => {
  const res = await axios.post<MeetingExpense>(
    `${API_BASE}/meeting/expense`,
    expense
  );
  return res.data;
};

// Get budget info after saving expense
export const getMeetingExpenseBudgetInfo = async (
  meetingId: number
): Promise<MeetingExpenseBudgetInfo> => {
  const res = await axios.get<MeetingExpenseBudgetInfo>(
    `${API_BASE}/meeting/${meetingId}/expense/budget-info`
  );
  return res.data;
};

// Approve meeting
export const approveMeeting = async (
  id: number,
  level: 1 | 2,
  remarks?: string
): Promise<Meeting> => {
  const res = await axios.post<Meeting>(
    `${API_BASE}/meeting/${id}/approve`,
    { level, remarks }
  );
  return res.data;
};

// Disapprove meeting
export const disapproveMeeting = async (
  id: number,
  level: 1 | 2,
  remarks: string
): Promise<Meeting> => {
  const res = await axios.post<Meeting>(
    `${API_BASE}/meeting/${id}/disapprove`,
    { level, remarks }
  );
  return res.data;
};

// Review meeting (send back for review)
export const reviewMeeting = async (
  id: number,
  level: 1 | 2,
  remarks: string
): Promise<Meeting> => {
  const res = await axios.post<Meeting>(
    `${API_BASE}/meeting/${id}/review`,
    { level, remarks }
  );
  return res.data;
};

// Get meeting invitation by meeting ID
export const getMeetingInvitation = async (
  meetingId: number
): Promise<MeetingInvitation> => {
  const res = await axios.get<MeetingInvitation>(
    `${API_BASE}/meeting/${meetingId}/invitation`
  );
  return res.data;
};

// Create or update meeting invitation
export const upsertMeetingInvitation = async (
  meetingId: number,
  data: MeetingInvitation
): Promise<MeetingInvitation> => {
  const res = await axios.post<MeetingInvitation>(
    `${API_BASE}/meeting/${meetingId}/invitation`,
    data,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Generate meeting invitation letter
export const generateMeetingInvitationLetter = async (
  meetingId: number
): Promise<{ fileName: string; filePath: string }> => {
  const res = await axios.post<{ fileName: string; filePath: string }>(
    `${API_BASE}/meeting/${meetingId}/invitation/generate-letter`
  );
  return res.data;
};

// Send meeting invitation email
export const sendMeetingInvitationEmail = async (
  meetingId: number
): Promise<void> => {
  await axios.post(`${API_BASE}/meeting/${meetingId}/invitation/send-email`);
};

// Get projects/draft standards
export const getProjects = async (
  params?: ProjectSearchParams
): Promise<ProjectListResponse> => {
  const res = await axios.get<ProjectListResponse>(`${API_BASE}/projects`, {
    params,
  });
  return res.data;
};

// Get meeting topics
export const getMeetingTopics = async (
  meetingId: number
): Promise<MeetingTopicListResponse> => {
  const res = await axios.get<MeetingTopicListResponse>(
    `${API_BASE}/meeting/${meetingId}/topics`
  );
  return res.data;
};

// Create or update meeting topic
export const upsertMeetingTopic = async (
  meetingId: number,
  topic: MeetingTopic
): Promise<MeetingTopic> => {
  const res = await axios.post<MeetingTopic>(
    `${API_BASE}/meeting/${meetingId}/topics`,
    topic,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Close meeting
export const closeMeeting = async (meetingId: number): Promise<void> => {
  await axios.post(`${API_BASE}/meeting/${meetingId}/close`);
};

// Delete meeting Topic
export const deleteMeetingTopic = async (topicId: number): Promise<void> => {
  await axios.delete(`${API_BASE}/meeting/topic/${topicId}`);
};

// Get meeting participants
export const getMeetingParticipants = async (
  meetingId: number
): Promise<MeetingParticipantListResponse> => {
  const res = await axios.get<MeetingParticipantListResponse>(
    `${API_BASE}/meeting/${meetingId}/participants`
  );
  return res.data;
};

// Create or update meeting participant
export const upsertMeetingParticipant = async (
  meetingId: number,
  participant: MeetingParticipant
): Promise<MeetingParticipant> => {
  const res = await axios.post<MeetingParticipant>(
    `${API_BASE}/meeting/${meetingId}/participants`,
    participant,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Get disbursement summary
export const getDisbursementSummary = async (
  meetingId: number
): Promise<DisbursementSummary> => {
  const res = await axios.get<DisbursementSummary>(
    `${API_BASE}/meeting/${meetingId}/disbursement-summary`
  );
  return res.data;
};

// Create or update disbursement summary
export const upsertDisbursementSummary = async (
  meetingId: number,
  summary: DisbursementSummary
): Promise<DisbursementSummary> => {
  const res = await axios.post<DisbursementSummary>(
    `${API_BASE}/meeting/${meetingId}/disbursement-summary`,
    summary,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  return res.data;
};

// Submit disbursement for approval
export const submitDisbursementForApproval = async (
  meetingId: number,
  level: number
): Promise<void> => {
  await axios.post(`${API_BASE}/meeting/${meetingId}/disbursement-summary/submit`, {
    level,
  });
};

// Generate expense document
export const generateExpenseDocument = async (
  meetingId: number
): Promise<{ fileName: string; filePath: string }> => {
  const res = await axios.post<{ fileName: string; filePath: string }>(
    `${API_BASE}/meeting/${meetingId}/disbursement-summary/generate-document`
  );
  return res.data;
};

// Get disbursement summaries pending approval (with meeting info)
export const getPendingDisbursementMeetings = async (
  params?: MeetingSearchParams
): Promise<DisbursementSummaryListResponse> => {
  const res = await axios.get<DisbursementSummaryListResponse>(
    `${API_BASE}/meeting/disbursement-summary/pending-approval`,
    {
      params,
    }
  );
  return res.data;
};

// Approve disbursement
export const approveDisbursement = async (
  meetingId: number,
  level: number,
  remarks?: string
): Promise<void> => {
  await axios.post(
    `${API_BASE}/meeting/${meetingId}/disbursement-summary/approve`,
    {
      level,
      remarks,
    }
  );
};

// Disapprove disbursement
export const disapproveDisbursement = async (
  meetingId: number,
  level: number,
  remarks: string
): Promise<void> => {
  await axios.post(
    `${API_BASE}/meeting/${meetingId}/disbursement-summary/disapprove`,
    {
      level,
      remarks,
    }
  );
};

// Review disbursement
export const reviewDisbursement = async (
  meetingId: number,
  level: number,
  remarks: string
): Promise<void> => {
  await axios.post(
    `${API_BASE}/meeting/${meetingId}/disbursement-summary/review`,
    {
      level,
      remarks,
    }
  );
};

// Get meetings that user is invited to and not yet reached meeting date
export const getUpcomingInvitedMeetings = async (
  params?: MeetingSearchParams
): Promise<MeetingListResponse> => {
  const res = await axios.get<MeetingListResponse>(
    `${API_BASE}/meeting/upcoming-invited`,
    {
      params,
    }
  );
  return res.data;
};

// Get meeting details for attendee (with registration status)
export const getMeetingDetailsForAttendee = async (
  meetingId: number
): Promise<MeetingWithRegistration> => {
  const res = await axios.get<MeetingWithRegistration>(
    `${API_BASE}/meeting/${meetingId}/attendee-details`
  );
  return res.data;
};

// Register for meeting
export const registerForMeeting = async (
  meetingId: number,
  followerNames?: string[]
): Promise<MeetingRegistration> => {
  const res = await axios.post<MeetingRegistration>(
    `${API_BASE}/meeting/${meetingId}/register`,
    {
      followerNames: followerNames || [],
    }
  );
  return res.data;
};


