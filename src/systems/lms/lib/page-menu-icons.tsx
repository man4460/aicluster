import type { ReactNode } from "react";
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  FileQuestion,
  Globe,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Receipt,
  Settings,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import type {
  LmsDashboardTabKey,
  LmsManageTabKey,
  LmsModuleNavKey,
  LmsSettingsTab,
} from "@/systems/lms/lms-module-nav";
import type { LmsCardTone } from "@/systems/lms/lib/card-tones";

const iconClass = "h-4 w-4";
const tabIconClass = "h-3.5 w-3.5";

/** ไอคอนหัวข้อหน้าหลัก (คู่กับ LmsPageSubNav.titleIcon) */
export function lmsPageTitleIcon(
  key: LmsModuleNavKey | "courseContent",
): ReactNode {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "manage":
      return <GraduationCap className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "settings":
      return <Settings className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "courseContent":
      return <BookOpen className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <LayoutDashboard className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}

export function lmsPageTitleTone(key: LmsModuleNavKey | "courseContent"): LmsCardTone {
  switch (key) {
    case "dashboard":
      return "sky";
    case "finance":
      return "emerald";
    case "manage":
      return "violet";
    case "settings":
      return "indigo";
    case "courseContent":
      return "amber";
    default:
      return "slate";
  }
}

export function lmsDashboardTabIcon(key: LmsDashboardTabKey): ReactNode {
  switch (key) {
    case "overview":
      return <LayoutDashboard className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    case "purchases":
      return <ShoppingCart className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function lmsManageTabIcon(key: LmsManageTabKey): ReactNode {
  switch (key) {
    case "courses":
      return <BookOpen className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    case "learners":
      return <Users className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function lmsSettingsTabIcon(key: LmsSettingsTab): ReactNode {
  switch (key) {
    case "basic":
      return <Building2 className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    case "portal":
      return <Globe className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function lmsFinanceTabIcon(key: "INCOME" | "EXPENSE"): ReactNode {
  switch (key) {
    case "INCOME":
      return <Receipt className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    case "EXPENSE":
      return <ClipboardCheck className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function lmsCourseContentTabIcon(key: "lessons" | "exam"): ReactNode {
  switch (key) {
    case "lessons":
      return <ListChecks className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    case "exam":
      return <FileQuestion className={tabIconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}
