
export interface ExpertListResponse {
  data: Expert[];
  total: number;
  page: number;
  limit: number;
}

// API Response structure (flat)
export interface Expert {
  id?: number;
  idCard: string;
  prefix: number;
  firstName: string;
  lastName: string;
  phone: string;
  mobile: string;
  email: string;
  educations?: EducationData[];
  trainings?: TrainingData[];
  workExperiences?: WorkExperienceData[];
  cvFile: string;
  // Flat address fields
  idCardAddress: AddressData;
  contactAddress: AddressData & { useIdCardAddress: boolean };
  bankAccount: BankAccountData[];
  userId?: number|null;
  createdAt?: string;
  updatedAt?: string;
  updateBy?: string;
}

interface AddressData {
  houseNo: string;
  moo: string;
  soi: string;
  road: string;
  subDistrict: number;
  subDistrictName?:string;
  district: number;
  districtName?:string;
  province: number;
  provinceName?:string;
  postalCode: string;
}

// Education, Training, Work Experience interfaces
export interface EducationData {
  id?: number;
  expertId?: number;
  graduationYear: string;
  educationLevel: number;
  institution: number;
  qualification: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingData {
  id?: number;
  expertId?: number;
  details: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkExperienceData {
  id?: number;
  expertId?: number;
  startYear: string;
  endYear: string;
  details: string;
  responsibility: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccountData {
  id?: number;
  expertId?: number;
  bankAccountNumber: string;
  bank: number;
  bankBranch: string;
  accountType: number;
  status: string;
  accountPhotoFile: string; // ไฟล์รูปหน้าบัญชีธนาคาร
  ktbFile: string; // ไฟล์ KTB
  createdAt?: string;
  updatedAt?: string;
}

export interface Committee {
  id: number;
  committeeNumber: string;
  committeeType: number;
  committeeTypeName?: string;
  subCommitteeOf?: string;
  subCommitteeOfName?: string;
  subCommitteeNumber?: string;
  committeeNameTh: string;
  committeeNameEn?: string;
  responsibleGroup?: string;
  responsibleGroupId?: string;
  productGroup?: string;
  productGroupId?: number;
  iso?: string;
  iec?: string;
  scopeOfWork?: string;
  status: "active" | "suspended" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}

export interface CommitteeSearchParams {
  committeeType?: number;
  committeeName?: string; // comma-separated for multi-search
  status?: string;
  page?: number;
  limit?: number;
}

export interface CommitteeListResponse {
  data: Committee[];
  total: number;
  page: number;
  limit: number;
}


export interface Directive {
  id?: number;
  orderNumber: string;
  directiveTypeId: number;
  directiveTypeName?: string;
  signingDate: string;       // YYYY-MM-DD
  endDate: string;          
  committeeId:number;
  committeeNumber?: string;
  subCommitteeOf: string;
  edition: string;           // default "0"
  amd: string;               // default "0"
  meetingRound?: string;
  meetingSource: 'emeeting' | 'manual';
  meetingRef?: string;
  meetingDate?: string; // YYYY-MM-DD
  filePath?: string;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
  updatedBy?: number;
}

export interface DirectiveSearchParams {
  directiveTypeId?: number;
  orderNumber?: string; // comma-separated for multi-search
  page?: number;
  limit?: number;
}

export interface DirectiveListResponse {
  data: Directive[];
  total: number;
  page: number;
  limit: number;
}

export interface DirectiveType {
  id: number;
  name: string;
}

// Expert Group Member (ผู้เชี่ยวชาญในกลุ่ม)
export interface ExpertGroupMember {
  id?: number;
  committeeId: number;
  expertId: number;
  expertName?: string;
  idCard?: string;
  positionId: number; // FK to i_master_expert_group_pos
  positionName?: string;
  directiveId?: number; // คำสั่งเลขที่
  directiveNumber?: string;
  organizationId?: number; // FK to i_master_org
  organizationName?: string;
  memberTypeId?: number; // FK to i_master_expert_member_type (ผู้ทรงคุณวุฒิ/ผู้แทน)
  memberTypeName?: string;
  representativeOrder?: number; // 1-5 (เฉพาะผู้แทน)
  isSecretary: boolean; // เลขานุการ
  isAssistantSecretary: boolean; // ผู้ช่วยเลขานุการ
  status: "active" | "inactive";
  assignmentFile?: string; // ไฟล์มอบหมาย
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpertGroupMemberSearchParams {
  committeeId?: number;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}

export interface ExpertGroupMemberListResponse {
  data: ExpertGroupMember[];
  total: number;
  page: number;
  limit: number;
}


