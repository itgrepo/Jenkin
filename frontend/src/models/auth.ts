export interface Role {
  id?: number;
  name?: string;
  group?:string;
}

export interface SSOAuthResponse {
  user: UserInfo;
  token: string;
}
export interface UserInfo {
  id?: number | null;
  username: string;
  passwordHash?: string | null;
  password?: string | null;
  role: Role;
  name?: string | null;
  name_en?: string | null;
  contact_name?: string | null;
  picture?: string | null;
  block?: number | null;
  sendEmail?: number | null;
  state?: number | null;
  registerDate?: string | null;
  lastvisitDate?: string | null;
  params?: string | null;
  lastResetTime?: string | null;
  resetCount?: number | null;
  applicanttype_id?: string | null;
  juristic_status?: number | null;
  juristic_cause_quit?: string | null;
  check_api?: number | null;
  date_niti?: string | null;
  tax_number?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  prefix_name?: string | null;
  address_no?: string | null;
  street?: string | null;
  moo?: string | null;
  soi?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  zipcode?: string | null;
  tel?: string | null;
  fax?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  contact_street?: string | null;
  contact_address_no?: string | null;
  contact_moo?: string | null;
  contact_soi?: string | null;
  contact_subdistrict?: string | null;
  contact_district?: string | null;
  contact_province?: string | null;
  contact_zipcode?: string | null;
  personfile?: string | null;
  corporatefile?: string | null;
  remember_token?: string | null;
  person_type?: string | null;
  branch_type?: string | null;
  branch_code?: string | null;
  building?: string | null;
  contact_building?: string | null;
  contact_tax_id?: string | null;
  contact_prefix_name?: string | null;
  contact_prefix_text?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_position?: string | null;
  contact_tel?: string | null;
  contact_fax?: string | null;
  contact_phone_number?: string | null;
  prefix_text?: string | null;
  person_first_name?: string | null;
  person_last_name?: string | null;
  google2fa_status?: number | null;
  google2fa_secret?: string | null;
  address_en?: string | null;
  moo_en?: string | null;
  soi_en?: string | null;
  street_en?: string | null;
  subdistrict_en?: string | null;
  district_en?: string | null;
  province_en?: string | null;
  zipcode_en?: string | null;
  contact_address_en?: string | null;
  contact_moo_en?: string | null;
  contact_soi_en?: string | null;
  contact_street_en?: string | null;
  contact_subdistrict_en?: string | null;
  contact_district_en?: string | null;
  contact_province_en?: string | null;
  contact_zipcode_en?: string | null;
  email?: string | null;
  reg_subdepart?: string | null;
}



export interface ActionPermissions {
  create: boolean;
  list: boolean;
  edit: boolean;
  delete: boolean;
}

export interface SettingProfile {
  primaryColor: string;
  darkMode: boolean;
  imgProfile: string;
  signature_image?: string;
}
export interface SettingApp {
  id?: number;
  appName: SettingAppTranslation[];
  appLogo: string;
  appLogoType?: string;
  appstaff_signature: string;
  appceo_signature: string;
  appPhone?: string;
  appEmail?: string;
}

export interface SettingAppTranslation {
  lang: string;
  name: string;
  address?: string;
}
