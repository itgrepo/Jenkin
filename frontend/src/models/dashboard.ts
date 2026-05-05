

export interface ReqDashboard {
  year?: number;
  provId: number;
  provShort: string;
}

interface DashboradHomeData {
  name: string;
  value: number;
}

interface DashboradHome {
  count: number;
  max: number;
  dataList: DashboradHomeData[];
}


export interface Dashboard {
  family: DashboradHome;
  person:DashboradHome;

}

export interface AppSettings {
  appName: AppTranslation[];
  logo: string | null;
  appstaff_signature?: string| null;
  appceo_signature?: string| null;
  darkMode: boolean;
  primaryColor: string;
  secondaryColor:string;
  phone?: string;
  email?: string;
}

export interface AppTranslation {
  lang: string;
  name: string;
  address?: string;
  nameStaff?: string;
  nameCeo?: string;
}
