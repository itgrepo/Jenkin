export interface Province {
  id: number;
  code: string;
  name: string;
  geoId: string;
}

export interface District {
  id: number;
  code: string;
  name: string;
  geoId: string;
  provinceId: string;
  postCode: string;
}

export interface SubDistrict {
  id: number;
  code: string;
  name: string;
  geoId: string;
  districtId: string;
  provinceId: string;
}


export interface MasterData {
  id: number;
  code?: string;
  name: string;
  subName?:string;
  nameTh?: string;
  nameEn?: string;
  icon?:string;
}


export interface UploadResponse {
  filename: string;
  message: string;
  url: string;
}


export interface UpsertResponse {
  id: number;
  message?: string;
}

export interface ProjectRow {
  id: string;
  prj_name: string;
  prj_startyear: string;
  prj_owner: string;
  prj_status: string;
}