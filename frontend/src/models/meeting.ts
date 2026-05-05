export interface MeetingForm {
  meeting_no: string;
  meeting_subject: string;
  meeting_date: string;
  time_start: string;
  time_end: string;
  building: string;
  room: string;
  meeting_id: string;
  passcode: string;
}

export interface MeetingBudget {
  id?: number;
  fiscalYear: string; // ปีงบประมาณ (พ.ศ.)
  departmentId: number; // กอง (department)
  departmentCode?: string; // รหัสกอง (department)
  departmentName?: string;
  subDepartmentId: number; // กลุ่ม (sub_department)
  subDepartmentName?: string;
  amount: number; // จำนวนเงิน (บาท)
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingBudgetSearchParams {
  fiscalYear?: string;
  departmentId?: number;
  subDepartmentId?: number;
}

export interface MeetingBudgetListResponse {
  data: MeetingBudget[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface Meeting {
  id?: number;
  committeeId?: number; // คณะที่ (Expert)
  subCommitteeOf?: string; // กลุ่มคณะ
  committeeNumber: string; // คณะที่
  committeeName: string; // ชื่อคณะ
  meetingSubject:string; // หัวข้อการประชุม
  instanceNumber: string; // ครั้งที่ประชุม
  startDate: string; // วันที่เริ่มประชุม
  endDate?: string; // วันที่สิ้นสุดประชุม
  startTime?: string; // เวลาเริ่มต้น
  endTime?: string; // เวลาสิ้นสุด
  hostOrganization?: string; // หน่วยงานเจ้าภาพ
  responsiblePerson?: string; // ผู้รับผิดชอบ
  responsiblePersonId?: number; // ID ผู้รับผิดชอบ (default จาก login user)
  approverLevel1Id?: number; // ผู้อนุมัติขั้นที่1 ID จาก user
  approverLevel1Name?: string;
  approverLevel2Id?: number; // ผู้อนุมัติขั้นที่2 ID จาก user
  approverLevel2Name?: string;
  remarks?: string; // หมายเหตุ
  status: MeetingStatus; // สถานะเรื่อง
  hasExpense?: boolean; // มีการบันทึกค่าใช้จ่ายแล้วหรือไม่
  hasParticipants?:boolean; // มีการบันทึกรายชื่อผู้เข้าร่วมประชุมแล้วหรือไม่
  disbursementStatus?: DisbursementStatus; // สถานะเบิกจ่าย
  createdAt?: string;
  updatedAt?: string;
}

export type MeetingStatus =
  | "draft" // ร่าง
  | "sent_for_approval_level_1" // ส่งอนุมัติระดับ 1
  | "sent_for_approval_level_2" // ส่งอนุมัติระดับ 2
  | "approved" // อนุมัติประชุม
  | "disapproved" // ไม่อนุมัติ
  | "pending_review" // รอแก้ไข
  | "meeting_invited" // เชิญประชุม
  | "meeting_closed"; // ปิดประชุม

export type DisbursementStatus =
  | "pending_approval" // รออนุมัติ
  | "pending_approval_level_1" // รออนุมัติระดับ 1
  | "pending_approval_level_2" // รออนุมัติระดับ 2
  | "disbursement_approved" // อนุมัติ
  | "disbursement_disapproved" // ไม่อนุมัติ
  | "disbursement_review"; // ทบทวน

export interface MeetingSearchParams {
  startDate?: string;
  endDate?: string;
  search?: string; // multi-search: คณะที่, ชื่อคณะ, หรือครั้งที่
  status?: MeetingStatus;
  subDepartmentId?: number; // สำหรับ filter กลุ่ม (สำหรับ ผอ.)
}

export interface MeetingListResponse {
  data: Meeting[];
  total?: number;
  page?: number;
  limit?: number;
}

// Advance Payment Budget Expense
export interface MeetingExpenseItem {
  id?: number;
  expenseTypeId: number; // ประเภทค่าใช้จ่าย (FK to i_master_expense)
  expenseTypeName: string; // ชื่อประเภทค่าใช้จ่าย
  expenseTypeOther?: string; // ประเภทอื่น ๆ (ถ้าเลือก "อื่น ๆ")
  quantity: number; // จำนวน
  unitPrice: number; // ราคาต่อหน่วย
  totalPrice: number; // ราคารวม (quantity * unitPrice)
  remarks?: string; // หมายเหตุ
}

export interface MeetingExpense {
  id?: number;
  meetingId: number; // FK to meeting
  committeeNumber: string; // คณะที่ (read-only)
  committeeName: string; // ชื่อคณะ (read-only)
  instanceNumber: string; // ครั้งที่ประชุม (read-only)
  expenses: MeetingExpenseItem[]; // รายการค่าใช้จ่าย
  totalBudget: number; // งบประมาณรวมทั้งหมด
  // ข้อมูลงบประมาณ (แสดงหลังบันทึก)
  annualBudget?: number; // งบประมาณประจำปี
  expensesDisbursed?: number; // ค่าใช้จ่ายที่เบิกจ่ายไปแล้ว
  expensesAdvancePayment?: number; // ค่าใช้จ่ายที่ตั้งเบิก
  remainingBudget?: number; // งบประมาณคงเหลือ
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingExpenseBudgetInfo {
  annualBudget: number; // งบประมาณประจำปี
  expensesDisbursed: number; // ค่าใช้จ่ายที่เบิกจ่ายไปแล้ว
  expensesAdvancePayment: number; // ค่าใช้จ่ายที่ตั้งเบิก
  remainingBudget: number; // งบประมาณคงเหลือ
}

// Meeting Invitation
export type MeetingFormat = "onsite" | "online" | "hybrid";

export interface MeetingInvitation {
  id?: number;
  meetingId: number; // FK to meeting
  meetingFormat: MeetingFormat; // รูปแบบการประชุม
  meetingLocation?: string; // สถานที่ประชุม
  meetingRoom?: string; // ห้องที่ประชุม
  meetingIdOnline?: string; // Meeting ID (for online/hybrid) - ใช้ meetingIdOnline เพื่อไม่ให้ซ้ำกับ meetingId
  passcode?: string; // Passcode (for online/hybrid)
  meetingLink?: string; // Link Meeting (เช่น MS Teams, Google Meet)
  agendaFileName?: string; // ชื่อไฟล์วาระการประชุม
  agendaFilePath?: string; // path ไฟล์วาระการประชุม
  supportingDocumentNames?: string[]; // ชื่อไฟล์เอกสารประกอบการประชุม
  supportingDocumentPaths?: string[]; // path ไฟล์เอกสารประกอบการประชุม
  invitationLetterFileName?: string; // ชื่อไฟล์หนังสือเชิญประชุม
  invitationLetterFilePath?: string; // path ไฟล์หนังสือเชิญประชุม
  emailSentStatus?:string; // สถานะการส่งอีเมล์
  createdAt?: string;
  updatedAt?: string;
}

// Project/Draft Standard
// export interface Project {
//   id?: number;
//   name?: string; // ชื่อโครงการ/ร่างมาตรฐาน
//   startYear?: string; // ปีที่เริ่ม
//   owner?: string; // ผู้จัดทำ
//   status?: string; // สถานะ (approved, draft, submitted, etc.)
// }

// export interface ProjectSearchParams {
//   status?: string;
//   search?: string;
// }

// export interface ProjectListResponse {
//   data: Project[];
//   total?: number;
//   page?: number;
//   limit?: number;
// }

// Meeting Topic
export interface MeetingTopic {
  id?: number;
  meetingId: number; // FK to meeting
  topicType: "project" | "other"; // ประเภทเรื่อง: ร่างมาตรฐาน หรือ อื่นๆ
  projectId?: number; // FK to project (ถ้าเป็น project)
  projectName?: string; // ชื่อโครงการ (สำหรับแสดงผล)
  projectStartYear?: string; // ปีที่เริ่ม (สำหรับแสดงผล)
  projectOwner?: string; // ผู้จัดทำ (สำหรับแสดงผล)
  projectStageCode?: string; // รหัสสถานะโครงการ (สำหรับแสดงผล)
  topicText: string; // ข้อความเรื่องการประชุม
  displayOrder?: number; // ลำดับการแสดงผล
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingTopicListResponse {
  data: MeetingTopic[];
  total?: number;
}

// Meeting Participant
export interface MeetingParticipant {
  id?: number;
  meetingId: number; // FK to meeting
  userId?: number; // FK to user (สำหรับส่งอีเมล)
  name: string; // ชื่อ-นามสกุล
  email?: string; // อีเมล (สำหรับส่งอีเมล)
  attended?: boolean; // เข้าร่วมประชุม
  sentRepresentative?: boolean; // ส่งตัวแทนเข้าร่วม
  meetingAllowance?: string; // ค่าเบี้ยประชุม (default จากงบประมาณ)
  createdAt?: string;
  updatedAt?: string;
}

export interface MeetingParticipantListResponse {
  data: MeetingParticipant[];
  total?: number;
}

// Disbursement Expense Item
export interface DisbursementExpenseItem {
  id?: number;
  expenseTypeId: number; // FK to expense type
  expenseTypeName: string; // ชื่อประเภทค่าใช้จ่าย
  budgetAmount?: number; // งบประมาณ (จาก meeting expense)
  actualExpense?: number; // ค่าใช้จ่ายจริง
}

// Disbursement Summary
export interface DisbursementSummary {
  id?: number;
  meetingId: number; // FK to meeting
  expenses: DisbursementExpenseItem[]; // รายการค่าใช้จ่าย
  expenseFileNames?: string[]; // ชื่อไฟล์ค่าใช้จ่าย
  expenseFilePaths?: string[]; // path ไฟล์ค่าใช้จ่าย
  status?: DisbursementStatus; // สถานะการเบิกจ่าย
  createdAt?: string;
  updatedAt?: string;
}

// Disbursement Summary with Meeting Info (for approval list)
export interface DisbursementSummaryWithMeeting extends DisbursementSummary {
  meeting: Meeting; // ข้อมูลการประชุม
}

export interface DisbursementSummaryListResponse {
  data: DisbursementSummaryWithMeeting[];
  total?: number;
  page?: number;
  limit?: number;
}

// Meeting Registration (สำหรับผู้เข้าร่วมประชุม)
export interface MeetingRegistration {
  id?: number;
  meetingId: number; // FK to meeting
  userId: number; // FK to user (ผู้ลงทะเบียน)
  registeredAt?: string; // วันที่ลงทะเบียน
  followerNames?: string[]; // ชื่อผู้ติดตาม
  status: "registered" | "not_registered"; // สถานะการลงทะเบียน
  createdAt?: string;
  updatedAt?: string;
}

// Meeting with Registration Status (for attendee list)
export interface MeetingWithRegistration extends Meeting {
  registrationStatus?: "registered" | "not_registered"; // สถานะการลงทะเบียน
  registrationId?: number; // ID ของ registration
  registeredCount?: number; // จำนวนผู้ลงทะเบียนแล้ว
  totalMeetingAttendees?: number; // จำนวนผู้เข้าร่วมประชุม
}

