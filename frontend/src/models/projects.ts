
export interface Project {
  id?: number;
  // ข้อมูลพื้นฐาน (Page 1)
  nameThai?: string; // ชื่อภาษาไทย
  nameEnglish?: string; // ชื่อภาษาอังกฤษ
  startYear?: string; // ปีที่เริ่มโปรเจค
  ownerId?: number; // ID เจ้าหน้าที่
  ownerName?: string; // ชื่อเจ้าหน้าที่
  ownerGroupId?: number; // กลุ่มเจ้าหน้าที่
  ownerGroupName?: string; // กลุ่มเจ้าหน้าที่ (ชื่อ)
  writerTypeId?: number; // ประเภทผู้จัดทำ
  writerTypeName?: string; // ประเภทผู้จัดทำ (ชื่อ)
  expectedCompletionMonth?: string; // เดือนที่คาดว่าจะทำเสร็จ
  expectedCompletionYear?: string; // ปีที่คาดว่าจะทำเสร็จ
  enforcementStatusId?: number; // สถานะเกี่ยวกับการบังคับ
  enforcementStatusName?: string; // สถานะเกี่ยวกับการบังคับ (ชื่อ)
  proposalTypeId?: number; // ประเภทของ proposal
  proposalTypeName?: string; // ประเภทของ proposal (ชื่อ)
  methodTypeId?: number; // วิธีจัดทำ
  methodTypeName?: string; // วิธีจัดทำ (ชื่อ)

  // ข้อมูลเพิ่มเติม (Page 2)
  stdTypeId?: number; // ชนิดของ มอก.
  stdTypeName?: string; // ชนิดของ มอก. (ชื่อ)
  productPolicyGroupIds?: number[]; // กลุ่มผลิตภัณฑ์นโยบาย (multi-select)
  productPolicyGroupNames?: string[]; // กลุ่มผลิตภัณฑ์นโยบาย (ชื่อ)
  productBCGIds?: number[]; // ประเภท BCG (multi-select)
  productBCGNames?: string[]; // ประเภท BCG (ชื่อ)
  bcgReason?: string; // เหตุผลของ BCG
  productGroupId?: number; // กลุ่มผลิตภัณฑ์
  productGroupName?: string; // กลุ่มผลิตภัณฑ์ (ชื่อ)
  nssSectorId?: number; // กลุ่มผลิตภัณฑ์ NSS Secter
  nssSectorName?: string; // กลุ่มผลิตภัณฑ์ NSS Secter (ชื่อ)
  nssSubjectId?: number; // กลุ่มผลิตภัณฑ์ NSS Secter (กลุ่มย่อย)
  nssSubjectName?: string; // กลุ่มผลิตภัณฑ์ NSS Secter (กลุ่มย่อย) (ชื่อ)
  isoDeliverableIds?: string[]; // มาตรฐานที่นำมา Adopt
  isoDeliverableNames?: string[]; // มาตรฐานที่นำมา Adopt (ชื่อ)
  isoDeliverableOther?: string; // มาตรฐานที่นำมา Adopt อื่น ๆ
  isoIcsIds?: string[]; // เลข ICS (multi-select)
  isoIcsNames?: string[]; // เลข ICS (ชื่อ)

  // ข้อมูลเพิ่มเติม (Page 3)
  tisReprintNos?: number[]; // มาตรฐานเดิมที่ถูกแทนที่ (tb3_tisno)
  tisReprintNames?: string[];
  productPolicyGroupIds2?: number[]; // กลุ่มผลิตภัณฑ์นโยบาย (multi-select) - duplicate field
  committeeId?: number; // กว. คณะที่
  committeeName?: string; // ชื่อ กว.
  subCommitteeId?: number; // อนุ กว. คณะที่
  subCommitteeName?: string; // ชื่อ อนุ กว.
  sdosId?: number; // ชื่อ SDOS
  sdosName?: string; // ชื่อ SDOS (ชื่อ)
  remarks?: string; // หมายเหตุ

  // Legacy fields (for backward compatibility)
  name?: string; // ชื่อร่างมาตรฐาน (legacy)
  owner?: string; // ผู้จัดทำ (legacy)
  productPolicyGroupId?: number; // กลุ่มผลิตภัณฑ์นโยบาย (legacy)
  productPolicyGroupName?: string; // กลุ่มผลิตภัณฑ์นโยบาย (legacy)
  enforcementStatus?: "general" | "enforced" | "planned_enforcement"; // สถานะเกี่ยวกับการบังคับ (legacy)
  stageCode?: string; // สถานะ (00.00, 00.20, 00.60, 00.98, 00.99, 10.00)
  stageUiMsg?: string; // ข้อความสถานะที่แสดงใน UI
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number; // Staff ID ที่สร้างข้อมูล

  gmmo_summary_remarks?: string;
  save_draft_remarks?: string;
  save_draft_file_path?: string;
  draft_circulation_summary_remarks?: string;
  draft_circulation_summary_subcommittee_remarks?: string;
  draft_circulation_summary_committee_remarks?: string;
  sub_committee_summary_file_path_word?: string;
  sub_committee_summary_file_path_pdf?: string;
  sub_committee_summary?: string;
  sub_committee_summary_remarks?: string;
  committee_summary_file_path_word?: string;
  committee_summary_file_path_pdf?: string;
  committee_summary?: string;
  committee_summary_remarks?: string;
  tis_number?: string; // เลข มอก.
  tis_number_issue_date?: string; // วันที่ออกเลข มอก.
  initial_draft_date?: string; // วันที่บันทึกร่างขั้นต้น
  initial_draft_file_path?: string; // ไฟล์ร่างมาตรฐาน
  initial_draft_meeting_report_file_path?: string; // รายงานการประชุม
  initial_draft_questionnaire_summary_file_path?: string; // สรุปแบบสอบถาม
  initial_draft_powerpoint_file_path?: string; // Power Point เสนอ กมอ.
  initial_draft_document_file_path?: string; // เอกสารเสนอ กมอ.
  initial_draft_remarks?: string; // หมายเหตุ

  approve_initial_draft_by?: number;
  approve_initial_draft_action?: "approve" | "disapprove" | "review";
  approve_initial_draft_remarks?: string;

  approve_project_lv1_by?: number;
  approve_project_lv1_action?: "approve" | "disapprove" | "review";
  approve_project_lv1_remarks?: string;

  approve_project_lv2_by?: number;
  approve_project_lv2_action?: "approve" | "disapprove" | "review";
  approve_project_lv2_remarks?: string;

  final_draft_summary_remarks?: string; // หมายเหตุ

  // Standard Announcement fields
  standard_announcement_send_to_tis_date?: string; // วันที่ส่งเอกสารไป ลมอ.
  standard_announcement_tis_signed_date?: string; // วันที่ ลมอ. ลงนาม
  standard_announcement_rwo_signed_date?: string; // วันที่ รวอ. ลงนาม
  standard_announcement_send_to_royal_gazette_date?: string; // วันที่ส่งไปราชกิจจา
  standard_announcement_royal_gazette_publish_date?: string; // วันที่ลงราชกิจจา
  standard_announcement_effective_date?: string; // วันที่มีผลบังคับใช้
  standard_announcement_final_draft_file_path?: string; // ไฟล์เอกสารร่าง Final
  standard_announcement_remarks?: string; // หมายเหตุ
}

export interface ProjectSearchParams {
  search?: string;
  stageCode?: string;
  enforcementStatus?: string;
  productPolicyGroupId?: number;
  ownerGroupId?: number;
  page?: number;
  limit?: number;
  excludeStageCodes?: string[]; // สำหรับกรองสถานะที่ไม่ต้องการแสดง
}

export interface ProjectListResponse {
  data: Project[];
  total?: number;
  page?: number;
  limit?: number;
}

// Project Log interface
export interface ProjectLog {
  id?: number;
  projectId: number;
  stageCode: string;
  stageDescription?: string;
  stageDate?: string;
  stageStatus?: "Finished" | "Working" | string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Save standard announcement to tb3_tis
export interface SaveStandardAnnouncementParams {
  projectId: number;
  tisNumber?: string;
  nameThai: string;
  nameEnglish: string;
  sendToTISDate: string;
  tissignedDate: string;
  rwosignedDate: string;
  sendToRoyalGazetteDate?: string | null;
  royalGazettePublishDate?: string | null;
  effectiveDate?: string | null;
  finalDraftFilePath?: string;
  remarks?: string;
  systemBy?: string;
}


// Get TIS standards for review (standards that have been effective for 5 years)
export interface TISStandardForReview {
  id: number;
  tisNumber: string;
  nameThai: string;
  nameEnglish?: string;
  effectiveDate?: string;
}

// Project Review interface (for standard review)
export interface ProjectReview {
  id?: number;
  tisNumber: string; // เลข มอก.
  nameThai: string; // ชื่อมาตรฐานภาษาไทย
  nameEnglish?: string; // ชื่อมาตรฐานภาษาอังกฤษ
  enforcementStatusId?: number; // สถานะเกี่ยวกับการบังคับ
  enforcementStatusName?: string; // สถานะเกี่ยวกับการบังคับ (ชื่อ)
  ownerGroupId: number; // กลุ่มเจ้าหน้าที่ (FK to sub_department, กองกำหนดมาตรฐาน)
  ownerGroupName?: string; // กลุ่มเจ้าหน้าที่ (ชื่อ)
  stageCode?: string; // สถานะปัจจุบัน (default: 90.00)
  stageUiMsg?: string; // ข้อความสถานะที่แสดงใน UI
  effectiveDate?: string; // วันที่มีผลบังคับใช้ (จาก tb3_tis)
  reviewStartDate?: string; // วันที่เริ่มทบทวน
  reviewEndDate?: string; // วันที่สิ้นสุดทบทวน
  remarks?: string; // หมายเหตุ
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number; // Staff ID ที่สร้างข้อมูล
  updatedBy?: number; // Staff ID ที่แก้ไขข้อมูล

  review_circulation_summary_remark?: string; // วันที่สรุปผลการเวียน
  review_cancel_summary_remark?: string;
}

// Project Review Search Parameters
export interface ProjectReviewSearchParams {
  search?: string;
  stageCode?: string;
  enforcementStatus?: string;
  ownerGroupId?: number;
  page?: number;
  limit?: number;
}

// Project Review List Response
export interface ProjectReviewListResponse {
  data: ProjectReview[];
  total?: number;
  page?: number;
  limit?: number;
}

// Project Review Log interface
export interface ProjectReviewLog {
  id?: number;
  projectReviewId: number; // FK to projectreview.id
  stageCode: string; // รหัสสถานะ
  stageDescription?: string; // คำอธิบายสถานะ
  stageDate?: string; // วันที่บันทึกสถานะ
  stageStatus?: "Finished" | "Working" | string; // สถานะ (Finished, Working)
  remarks?: string; // หมายเหตุ
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number; // Staff ID ที่สร้างข้อมูล
}
