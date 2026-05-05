// Ballot Draft Models

export type BallotAnswerTypeCode = "Multiple choice" | "Single choice" | "Text";

export interface BallotDraftAnswer {
  id?: number;
  text: string;
  displayOrder?: number;
}

export interface BallotDraftAttachment {
  id?: number;
  fileName: string;
  filePath: string;
  displayOrder?: number;
}

export interface BallotDraft {
  id?: number;
  name: string; // ชื่อแบบร่าง
  questionText: string; // ข้อความคำถาม
  answerType: number; // รูปแบบคำตอบ (id จาก i_master_ballot_ans_type)
  answerTypeId?: number; // FK to i_master_ballot_ans_type (deprecated, use answerType instead)
  hasTextInput: boolean; // มีช่องใส่ข้อความหรือไม่
  answers: BallotDraftAnswer[]; // รายการคำตอบ
  attachments: BallotDraftAttachment[]; // รายการเอกสารแนบ
  noteText?: string; // ข้อความหมายเหตุ (configurable)
  createdAt?: string;
  updatedAt?: string;
}

export interface BallotDraftSearchParams {
  search?: string; // ค้นหาจากชื่อแบบร่าง
  page?: number;
  limit?: number;
}

export interface BallotDraftListResponse {
  data: BallotDraft[];
  total?: number;
  page?: number;
  limit?: number;
}

// Master table for answer types
export interface BallotAnswerType {
  id: number;
  code: string;
  name: string;
  description?: string;
}

// Ballot Request (การเวียนขอข้อคิดเห็น)
export type BallotRequestStatus =
  | "pending_approval" // รอส่งอนุมัติ
  | "waiting_manager_review" // รอ ผก. พิจารณา
  | "waiting_director_review" // รอ ผอ. พิจารณา
  | "manager_approved" // ผก. อนุมัติ
  | "manager_disapproved" // ผก. ไม่อนุมัติ
  | "director_approved" // ผอ. อนุมัติ
  | "director_disapproved" // ผอ. ไม่อนุมัติ
  | "pending_review" // รอแก้ไข
  | "closed"; // ปิดแล้ว

// Status สำหรับแสดงผล (calculated status)
export type BallotDisplayStatus =
  | "pending_open" // รอเปิด
  | "open" // เปิด
  | "pending_close" // รอปิด
  | "closed"; // ปิด


export interface BallotRequestRecipient {
  id?: number;
  userId?: number; // สำหรับ staff และ expert
  committeeId?: number; // สำหรับ committee
  name: string;
  email?: string;
  type: "committee" | "staff" | "expert" | "public";
}

export interface BallotRequest {
  id?: number;
  // ส่วนที่ 1: ข้อมูลชุดคำถาม
  useDraft: boolean; // ใช้แบบร่างหรือไม่
  draftId?: number; // FK to ballot_draft (ถ้าใช้แบบร่าง)
  questionText: string; // ข้อความคำถาม
  answerType: number; // รูปแบบคำตอบ (id จาก i_master_ballot_ans_type)
  hasTextInput: boolean; // มีช่องใส่ข้อความหรือไม่
  answers: BallotDraftAnswer[]; // รายการคำตอบ
  attachments: BallotDraftAttachment[]; // รายการเอกสารแนบ

  // ส่วนที่ 2: เรื่อง/ประเภทการเวียน
  name: string; // ชื่อข้อคิดเห็น
  projectId?: number; // ร่างมาตรฐาน (optional, FK to project)
  projectName?: string; // ชื่อร่างมาตรฐาน (สำหรับแสดงผล)
  startDate: string; // วันที่เริ่มสอบถาม
  endDate: string; // วันที่สิ้นสุดสอบถาม
  numberOfDays?: number; // จำนวนวัน
  groupType: number; // กลุ่มที่ต้องการเวียนข้อคิดเห็น
  groupTypeId?: number; // FK to i_master_ballot_group_type
  
  // Recipients ตาม groupType
  committeeIds?: number[]; // สำหรับ committee_gw หรือ sub_committee_gw
  staffRecipients?: BallotRequestRecipient[]; // สำหรับ tisi_staff
  expertRecipients?: BallotRequestRecipient[]; // สำหรับ registered_experts
  
  // Status
  status: BallotRequestStatus;
  createdBy?: number; // FK to user
  createdByName?: string;
  managerId?: number; // ผก. ที่ต้องอนุมัติ
  directorId?: number; // ผอ. ที่ต้องอนุมัติ
  
  createdAt?: string;
  updatedAt?: string;
}

export interface BallotRequestSearchParams {
  status?: BallotRequestStatus | BallotRequestStatus[]; // Filter by status
  search?: string; // ค้นหาจากชื่อข้อคิดเห็น
  createdBy?: number; // Filter by creator (แสดงเฉพาะของ user ที่ login)
  page?: number;
  limit?: number;
}

export interface BallotRequestListResponse {
  data: BallotRequest[];
  total?: number;
  page?: number;
  limit?: number;
}

// Ballot Response (คำตอบจากผู้ตอบข้อคิดเห็น)
export interface BallotResponseAnswer {
  id?: number;
  ballotDraftAnswerId?: number; // FK to i_ballot_draft_answer (ถ้าเป็น choice answer)
  answerText?: string; // ข้อความคำตอบ (สำหรับ choice answer)
  textInput?: string; // ข้อความที่ผู้ตอบพิมพ์เพิ่มเติม
  displayOrder?: number;
}

export interface BallotResponse {
  id?: number;
  ballotRequestId: number; // FK to i_ballot_request
  userId: number; // FK to user (ผู้ตอบ)
  userName: string; // ชื่อผู้ตอบ
  userEmail?: string; // อีเมลผู้ตอบ
  answers: BallotResponseAnswer[]; // รายการคำตอบ
  submittedAt?: string; // วันที่ตอบ
  createdAt?: string;
  updatedAt?: string;
}

export interface BallotResponseSearchParams {
  ballotRequestId?: number; // Filter by ballot request
  userId?: number; // Filter by user
  page?: number;
  limit?: number;
}

export interface BallotResponseListResponse {
  data: BallotResponse[];
  total?: number;
  page?: number;
  limit?: number;
}

