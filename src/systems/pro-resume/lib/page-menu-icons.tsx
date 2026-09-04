import type { ReactNode } from "react";
import { Briefcase, FileText, FolderOpen, LayoutDashboard, Settings, UserRound } from "lucide-react";
import type { ProResumeModuleNavKey } from "@/systems/pro-resume/pro-resume-module-nav";
import type { ProResumeCardTone } from "@/systems/pro-resume/lib/card-tones";

const iconClass = "h-4 w-4";

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
      return <FileText className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "experience":
      return <Briefcase className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "certificate":
      return <FileText className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "portfolio":
      return <FolderOpen className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <FileText className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}
