import type { ReactNode } from "react";
import {
  Award,
  Briefcase,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  Settings,
  UserRound,
  Youtube,
} from "lucide-react";
import type { ProResumeModuleNavKey } from "@/systems/pro-resume/pro-resume-module-nav";
import type { ProResumeCardTone } from "@/systems/pro-resume/lib/card-tones";

const iconClass = "h-4 w-4";
const tabIconClass = "h-3.5 w-3.5 sm:h-4 sm:w-4";

export function proResumePageTitleIcon(key: ProResumeModuleNavKey): ReactNode {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "profile":
      return <UserRound className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "portfolio":
      return <FolderOpen className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "settings":
      return <Settings className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <FileText className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}

export function proResumePageTitleTone(key: ProResumeModuleNavKey): ProResumeCardTone {
  switch (key) {
    case "dashboard":
      return "sky";
    case "profile":
      return "violet";
    case "portfolio":
      return "emerald";
    case "settings":
      return "indigo";
    default:
      return "slate";
  }
}

export function proResumeSectionIcon(kind: "education" | "experience" | "certificate" | "portfolio"): ReactNode {
  switch (kind) {
    case "education":
      return <GraduationCap className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "experience":
      return <Briefcase className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "certificate":
      return <Award className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "portfolio":
      return <FolderOpen className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <FileText className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}

/** แท็บหน้าสาธารณะ */
export function proResumePortalTabIcon(tab: "career" | "portfolio"): ReactNode {
  if (tab === "portfolio") {
    return <FolderOpen className={tabIconClass} strokeWidth={2.25} aria-hidden />;
  }
  return <Briefcase className={tabIconClass} strokeWidth={2.25} aria-hidden />;
}

export function proResumePortalContactIcon(): ReactNode {
  return <MessageCircle className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />;
}

export function proResumePortalYoutubeIcon(): ReactNode {
  return <Youtube className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />;
}

export function proResumeTimelineKindIcon(kind: "exp" | "edu"): ReactNode {
  if (kind === "edu") {
    return <GraduationCap className="h-3 w-3" strokeWidth={2.5} aria-hidden />;
  }
  return <Briefcase className="h-3 w-3" strokeWidth={2.5} aria-hidden />;
}
