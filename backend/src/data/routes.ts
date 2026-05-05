// src/routes.ts
import React, { lazy } from "react";
import {
  Assignment,
  Description,
  HowToVote,
  People,
  Home,
  AssignmentTurnedIn,
  ManageAccounts,
  AssignmentInd,
  Apps,
  MonetizationOn,
  Groups2,
  Info,
  PendingActions,
  CheckCircle,
  HowToReg,
  Gavel,
  Replay,
} from "@mui/icons-material";
import { TFunction } from "i18next";
import type { ElementType } from "react";

// pages
const HomePage = lazy(() => import("@pages/HomePage"));
const ProjectDraftPage = lazy(
  () => import("@pages/project/pages/ProjectDraftPage")
);
const ProjectManagementPage = lazy(
  () => import("@pages/project/pages/ProjectManagementPage")
);
const ProjectReviewPage = lazy(
  () => import("@pages/project/pages/ProjectReviewPage")
);
const DocumentListPage = lazy(
  () => import("@pages/document/pages/DocumentListPage")
);
const DocumentManagementPage = lazy(
  () => import("@pages/document/pages/DocumentManagementPage")
);


const ExpertPage = lazy(
  () => import("@pages/expert/pages/HomePage")
);
const AppointmentManagementPage = lazy(
  () => import("@pages/expert/pages/AppointmentManagementPage")
);
const CommitteeManagementPage = lazy(
  () => import("@pages/expert/pages/CommitteeManagementPage")
);
const ExpertIndividualManagementPage = lazy(
  () =>
    import("@pages/expert/pages/ExpertIndividualManagementPage")
);
const GroupCommitteeManagementPage = lazy(
  () => import("@pages/expert/pages/GroupCommitteeManagementPage")
);
const ProjectPage = lazy(() => import("@pages/project/pages/HomePage"));


const InfoExpertManagementPage = lazy(
  () => import("@pages/expert/pages/InfoExpertManagementPage")
);



const UserManagementPage = lazy(() => import("@pages/UserManagementPage"));





const DocumentPage = lazy(() => import("@pages/document/pages/HomePage"));

const EmeetingPage = lazy(() => import("@pages/meeting/pages/HomePage"));
const MeetingBudgetPage = lazy(
  () => import("@pages/meeting/pages/MeetingBudgetPage")
);
const MeetingNotApprovedPage = lazy(
  () => import("@pages/meeting/pages/MeetingNotApprovedPage")
);
const MeetingApprovedPage = lazy(
  () => import("@pages/meeting/pages/MeetingApprovedPage")
);
const ApproveDisbursementPage = lazy(
  () => import("@pages/meeting/pages/ApproveDisbursementPage")
);
const MeetingNotReachedDatePage = lazy(
  () => import("@pages/meeting/pages/MeetingNotReachedDatePage")
);
const ApproveMeetingPage = lazy(
  () => import("@pages/meeting/pages/ApproveMeetingPage")
);
const ApproveHomePage = lazy(
  () => import("@pages/ApproveHomePage")
);

const BallotPage = lazy(() => import("@pages/ballot/pages/HomePage"));
const BallotDraftPage = lazy(
  () => import("@pages/ballot/pages/BallotDraftPage")
);
const BallotDraftNotApprovedPage = lazy(
  () => import("@pages/ballot/pages/BallotDraftNotApprovedPage")
);
const BallotDraftApprovedPage = lazy(
  () => import("@pages/ballot/pages/BallotDraftApprovedPage")
);
const BallotListPage = lazy(
  () => import("@pages/ballot/pages/BallotListPage")
);
const ApproveBallotPage = lazy(
  () => import("@pages/ballot/pages/ApproveBallotPage")
);
const ApproveProjectPage = lazy(
  () => import("@pages/project/pages/ApproveProjectPage")
);
const ApproveInitialDraftPage = lazy(
  () => import("@pages/project/pages/ApproveInitialDraftPage")
);

export const services = (roleId: number) => {
  if (roleId === 6) {
    return [
      {
        title: "Home",
        desc: "หน้าหลัก",
        color: "#ffffff",
        path: "/",
        icon: Apps,
      },
      {
        title: "Meeting",
        desc: "จัดการประชุม",
        color: "#00ACC1",
        path: "/meetings",
        icon: Groups2,
      },
      {
        title: "Expert Management",
        desc: "จัดการผู้เชี่ยวชาญ",
        color: "#43A047",
        path: "/expert-management",
        icon: ManageAccounts,
      },
      {
        title: "Ballot",
        desc: "เวียนขอข้อคิดเห็นและลงคะแนน",
        color: "#1976D2",
        path: "/ballots",
        icon: HowToVote,
      },
      {
        title: "Document",
        desc: "จัดเก็บเอกสาร",
        color: "#E64A19",
        path: "/documents",
        icon: Description,
      },
    ];
  }
  return [
    {
      title: "Home",
      desc: "หน้าหลัก",
      color: "#ffffff",
      path: "/",
      icon: Apps,
    },
    {
      title: "Standard Project",
      desc: "จัดการโปรเจคกำหนดมาตรฐาน",
      color: "#1565C0",
      path: "/projects",
      icon: Description,
    },
    {
      title: "Meeting",
      desc: "จัดการประชุม",
      color: "#00ACC1",
      path: "/meetings",
      icon: Groups2,
    },
    {
      title: "Ballot",
      desc: "เวียนขอข้อคิดเห็นและลงคะแนน",
      color: "#1976D2",
      path: "/ballots",
      icon: HowToVote,
    },
    {
      title: "Document",
      desc: "จัดเก็บเอกสาร",
      color: "#E64A19",
      path: "/documents",
      icon: Description,
    },
    {
      title: "Expert Management",
      desc: "จัดการผู้เชี่ยวชาญ",
      color: "#43A047",
      path: "/expert-management",
      icon: ManageAccounts,
    },
   
  ];
};

export interface IRoute {
  title: string;
  name: string;
  path: string;
  enabled: boolean;
  showInDrawer?: boolean;
  component: React.ComponentType;
  icon?: ElementType;
}

/**
 * ปรับให้รับ currentPath:
 * - ถ้า currentPath === "/"  → Drawer จะโชว์เมนูตาม services
 * - หน้าอื่น ๆ  → Drawer ใช้เมนูระบบเดิม
 */
export const getRoutes = (
  t: TFunction,
  roleId: number,
  currentPath: string
): IRoute[] => {



  if (currentPath.startsWith("/documents")) {
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      {
        title: t("homepage"),
        name: "home",
        path: "/documents",
        enabled: true,
        showInDrawer: true,
        component: DocumentPage,
        icon: Home,
      },
      {
        title: "จัดการเอกสาร",
        name: "document-management",
        path: "/documents/document-management",
        enabled: true,
        showInDrawer: true,
        component: DocumentManagementPage,
        icon: Description,
      },
      {
        title: "รายการเอกสาร",
        name: "document-list",
        path: "/documents/document-list",
        enabled: true,
        showInDrawer: false,
        component: DocumentListPage,
        icon: Description,
      },
    ];
  }


  if (currentPath.startsWith("/projects")) {
    // Only roleId 3 can access estandard
    if (roleId === 6) {
      return [];
    }
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      {
        title: t("homepage"),
        name: "home",
        path: "/projects",
        enabled: true,
        showInDrawer: true,
        component: ProjectPage,
        icon: Home,
      },
      {
        title: "ร่างแผน[00]",
        name: "project-list",
        path: "/projects/project-list",
        enabled: true,
        showInDrawer: true,
        component: ProjectDraftPage,
        icon: Assignment,
      },
      {
        title: "จัดการโครงการ",
        name: "project-management",
        path: "/projects/project-management",
        enabled: true,
        showInDrawer: true,
        component: ProjectManagementPage,
        icon: Description,
      },
      {
        title: "จัดการทบทวนมาตรฐาน",
        name: "project-review",
        path: "/projects/project-review",
        enabled: true,
        showInDrawer: true,
        component: ProjectReviewPage,
        icon: Replay,
      },
    ];
  }

  if (currentPath.startsWith("/ballots")) {
    if (roleId === 6) {
      return [
        {
          title: t("main-menu"),
          name: "home",
          path: "/",
          enabled: true,
          showInDrawer: true,
          component: HomePage,
          icon: Apps,
        },
        {
          title: t("homepage"),
          name: "home",
          path: "/ballots",
          enabled: true,
          showInDrawer: true,
          component: BallotPage,
          icon: Home,
        },
        {
          title: "แสดงรายการเวียนขอข้อคิดเห็น",
          name: "ballot-list",
          path: "/ballots/ballot-list",
          enabled: true,
          showInDrawer: true,
          component: BallotListPage,
          icon: Info,
        },
      ];
    }
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      {
        title: t("homepage"),
        name: "home",
        path: "/ballots",
        enabled: true,
        showInDrawer: true,
        component: BallotPage,
        icon: Home,
      },
      {
        title: "จัดการแบบร่างการเวียนขอข้อคิดเห็น",
        name: "ballot-draft",
        path: "/ballots/ballot-draft",
        enabled: true,
        showInDrawer: true,
        component: BallotDraftPage,
        icon: Description,
      },
      {
        title: "จัดการเวียนขอข้อคิดเห็นทยังไม่อนุมัติ",
        name: "ballot-draft-not-approved",
        path: "/ballots/ballot-draft-not-approved",
        enabled: true,
        showInDrawer: true,
        component: BallotDraftNotApprovedPage,
        icon: PendingActions,
      },
      {
        title: "จัดการเวียนขอข้อคิดเห็นที่อนุมัติแล้ว",
        name: "ballot-draft-approved",
        path: "/ballots/ballot-draft-approved",
        enabled: true,
        showInDrawer: true,
        component: BallotDraftApprovedPage,
        icon: AssignmentTurnedIn,
      },
      {
        title: "แสดงรายการเวียนขอข้อคิดเห็น",
        name: "ballot-list",
        path: "/ballots/ballot-list",
        enabled: true,
        showInDrawer: true,
        component: BallotListPage,
        icon: Info,
      },
    ];
  }

  if (currentPath.startsWith("/meetings")) {
    if (roleId === 6) {
      return [
        {
          title: t("main-menu"),
          name: "home",
          path: "/",
          enabled: true,
          showInDrawer: true,
          component: HomePage,
          icon: Apps,
        },
        {
          title: t("homepage"),
          name: "home",
          path: "/meetings",
          enabled: true,
          showInDrawer: true,
          component: EmeetingPage,
          icon: Home,
        },
        {
          title: "รายการประชุมที่ยังไม่ถึงวันที่ประชุม",
          name: "meeting-not-reached-date",
          path: "/meetings/meeting-not-reached-date",
          enabled: true,
          showInDrawer: true,
          component: MeetingNotReachedDatePage,
          icon: Info,
        },
      ];
    }
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      {
        title: t("homepage"),
        name: "home",
        path: "/meetings",
        enabled: true,
        showInDrawer: true,
        component: EmeetingPage,
        icon: Home,
      },
      {
        title: "จัดการงบประมาณการประชุม",
        name: "meeting-budget",
        path: "/meetings/meeting-budget",
        enabled: true,
        showInDrawer: true,
        component: MeetingBudgetPage,
        icon: MonetizationOn,
      },
      {
        title: "จัดการการประชุมที่ยังไม่อนุมัติ",
        name: "meeting-not-approved",
        path: "/meetings/meeting-not-approved",
        enabled: true,
        showInDrawer: true,
        component: MeetingNotApprovedPage,
        icon: PendingActions,
      },
      {
        title: "อนุมัติการประชุม",
        name: "approve-meeting",
        path: "/meetings/approve-meeting",
        enabled: true,
        showInDrawer: true,
        component: ApproveMeetingPage,
        icon: Assignment,
      },
      {
        title: "จัดการการประชุมที่อนุมัติแล้ว",
        name: "meeting-approved",
        path: "/meetings/meeting-approved",
        enabled: true,
        showInDrawer: true,
        component: MeetingApprovedPage,
        icon: AssignmentTurnedIn,
      },
      {
        title: "รายการประชุมที่ยังไม่ถึงวันที่ประชุม",
        name: "meeting-not-reached-date",
        path: "/meetings/meeting-not-reached-date",
        enabled: true,
        showInDrawer: true,
        component: MeetingNotReachedDatePage,
        icon: Info,
      },
    ];
  }

  if (currentPath.startsWith("/expert-management")) {
    if (roleId === 6) {
      return [
        {
          title: t("main-menu"),
          name: "home",
          path: "/",
          enabled: true,
          showInDrawer: true,
          component: HomePage,
          icon: Apps,
        },
        {
          title: t("homepage"),
          name: "expert-management",
          path: "/expert-management",
          enabled: true,
          showInDrawer: true,
          component: ExpertPage,
          icon: Home,
        },
        {
          title: t("info-expert-management"),
          name: "info-expert-management",
          path: "/expert-management/info",
          enabled: true,
          showInDrawer: true,
          component: InfoExpertManagementPage,
          icon: Info,
        },
      ];
    }
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      {
        title: t("homepage"),
        name: "expert-management",
        path: "/expert-management",
        enabled: true,
        showInDrawer: true,
        component: ExpertPage,
        icon: Home,
      },
      {
        title: "จัดการคณะผู้เชี่ยวชาญ",
        name: "expert-committee-management",
        path: "/expert-management/committee",
        enabled: true,
        showInDrawer: true,
        component: CommitteeManagementPage,
        icon: People,
      },
      {
        title: "จัดการข้อมูลผู้เชี่ยวชาญ",
        name: "expert-individual-management",
        path: "/expert-management/individual",
        enabled: true,
        showInDrawer: true,
        component: ExpertIndividualManagementPage,
        icon: ManageAccounts,
      },
      {
        title: "จัดการคำสั่งแต่งตั้ง",
        name: "appointment-management",
        path: "/expert-management/appointment",
        enabled: true,
        showInDrawer: true,
        component: AppointmentManagementPage,
        icon: AssignmentInd,
      },
      {
        title: "จัดกลุ่มผู้เชี่ยวชาญ",
        name: "expert-committeegroup-management",
        path: "/expert-management/committeegroup",
        enabled: true,
        showInDrawer: false,
        component: GroupCommitteeManagementPage,
        icon: Groups2,
      },
    ];
  }

  // --- Drawer ปกติสำหรับหน้าอื่น ๆ ---
  if (roleId === 1) {
    return [
      {
        title: "การจัดการผู้ใช้งาน",
        name: "user-management",
        path: "/",
        enabled: roleId === 1,
        showInDrawer: true,
        component: UserManagementPage,
        icon: ManageAccounts,
      },
    ];
  }

  if (roleId === 2 || roleId === 4) {
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: ApproveHomePage,
        icon: Apps,
      },
      {
        title: "รายการอนุมัติเบิกจ่าย",
        name: "approve-disbursement",
        path: "/approve-disbursement",
        enabled: true,
        showInDrawer: true,
        component: ApproveDisbursementPage,
        icon: AssignmentTurnedIn,
      },
      {
        title: "อนุมัติการประชุม",
        name: "approve-meeting",
        path: "/approve-meeting",
        enabled: true,
        showInDrawer: true,
        component: ApproveMeetingPage,
        icon: Assignment,
      },
      {
        title: "อนุมัติการเวียนขอข้อคิดเห็น",
        name: "approve-ballot",
        path: "/approve-ballot",
        enabled: true,
        showInDrawer: true,
        component: ApproveBallotPage,
        icon: CheckCircle,
      },
      {
        title: "อนุมัติโครงการ",
        name: "approve-project",
        path: "/approve-project",
        enabled: true,
        showInDrawer: true,
        component: ApproveProjectPage,
        icon: HowToReg,
      },
      {
        title: "อนุมัติร่างขั้นต้น",
        name: "approve-initial-draft",
        path: "/approve-initial-draft",
        enabled: roleId === 2 ? true : false,
        showInDrawer: roleId === 2 ? true : false,
        component: ApproveInitialDraftPage,
        icon: Gavel,
      },
    ];
  }

  if (roleId === 5) {
    // Role 5 can access all services
    const allServiceRoutes: IRoute[] = services(roleId)
      .filter((s) => s.path !== "/")
      .map((s) => ({
        title: s.title,
        name: s.path.replace(/^\//, ""),
        path: s.path,
        enabled: true,
        showInDrawer: true,
        icon: s.icon,
        component: HomePage,
      }));

    const specificRoutes: IRoute[] = [];

   
    // Add home route at the beginning
    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      ...allServiceRoutes,
      ...specificRoutes,
    ];
  }

  if (roleId === 6) {
    // Role 5 can access all services
    const allServiceRoutes: IRoute[] = services(roleId)
      .filter((s) => s.path !== "/" && s.path !== "/projects")
      .map((s) => ({
        title: s.title,
        name: s.path.replace(/^\//, ""),
        path: s.path,
        enabled: true,
        showInDrawer: true,
        icon: s.icon,
        component: HomePage,
      }));

    return [
      {
        title: t("main-menu"),
        name: "home",
        path: "/",
        enabled: true,
        showInDrawer: true,
        component: HomePage,
        icon: Apps,
      },
      ...allServiceRoutes,
    ];
  }

  // --- Drawer สำหรับหน้าแรก: ใช้ services ---

  const serviceRoutes: IRoute[] = services(roleId)
    .filter((s) => (s.path === "/projects" ? (roleId === 6 ? false : true) : true))
    .map((s) => ({
      title: s.path === "/" ? t("main-menu") : s.title,
      name: s.path.replace(/^\//, ""), // e.g. "standard"
      path: s.path,
      enabled: true,
      showInDrawer: s.path === "/" ? true : false,
      icon: s.icon,
      component: HomePage,
    }));
  // แถบ Home เอง (ไว้ให้ active/กลับหน้าแรก)
  serviceRoutes.unshift({
    title: t("main-menu"),
    name: "home",
    path: "/",
    enabled: true,
    component: HomePage,
    icon: Apps,
  });
  return serviceRoutes;
};
