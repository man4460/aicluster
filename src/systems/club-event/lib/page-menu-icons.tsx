import type { ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  Globe,
  History,
  Images,
  Link2,
  MessageSquareText,
  Package,
  Play,
  Settings,
  UserCog,
  UserRound,
  Wallet,
  Youtube,
  Building2,
  Calendar,
} from "lucide-react";
import type {
  ClubEventDashboardTabKey,
  ClubEventManageTabKey,
  ClubEventModuleNavKey,
  ClubEventSettingsTab,
} from "@/systems/club-event/club-event-module-nav";
import type { ClubEventCardTone } from "@/systems/club-event/lib/card-tones";

const iconClass = "h-4 w-4";

/** ไอคอนหัวข้อหน้าหลัก (คู่กับ ClubEventPageSubNav.titleIcon) */
export function clubEventPageTitleIcon(
  key: ClubEventModuleNavKey | "eventDetail" | "eventEdit" | "eventSubmissions",
): ReactNode {
  switch (key) {
    case "dashboard":
      return <CalendarDays className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "manage":
      return <ClipboardList className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "settings":
      return <Settings className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "eventDetail":
      return <Calendar className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "eventEdit":
      return <FileText className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "eventSubmissions":
      return <MessageSquareText className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <CalendarDays className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}

export function clubEventPageTitleTone(
  key: ClubEventModuleNavKey | "eventDetail" | "eventEdit" | "eventSubmissions",
): ClubEventCardTone {
  switch (key) {
    case "dashboard":
      return "sky";
    case "finance":
      return "emerald";
    case "manage":
      return "violet";
    case "settings":
      return "indigo";
    case "eventDetail":
      return "sky";
    case "eventEdit":
      return "amber";
    case "eventSubmissions":
      return "violet";
    default:
      return "slate";
  }
}

export function clubEventDashboardTabIcon(key: ClubEventDashboardTabKey): ReactNode {
  switch (key) {
    case "upcoming":
      return <Calendar className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "past":
      return <History className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "committee":
      return <UserCog className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function clubEventManageTabIcon(key: ClubEventManageTabKey): ReactNode {
  switch (key) {
    case "members":
      return <UserRound className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "assets":
      return <Package className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function clubEventSettingsTabIcon(key: ClubEventSettingsTab): ReactNode {
  switch (key) {
    case "basic":
      return <Building2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "dues":
      return <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "portal":
      return <Globe className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function clubEventEditorTabIcon(key: "general" | "youtube" | "gallery" | "links"): ReactNode {
  switch (key) {
    case "general":
      return <FileText className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "youtube":
      return <Youtube className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "gallery":
      return <Images className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "links":
      return <Link2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function clubEventSectionBlockIcon(key: "detail" | "youtube" | "gallery"): ReactNode {
  switch (key) {
    case "detail":
      return <FileText className="h-4 w-4" strokeWidth={2.25} aria-hidden />;
    case "youtube":
      return <Play className="h-4 w-4" strokeWidth={2.25} aria-hidden />;
    case "gallery":
      return <Images className="h-4 w-4" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}
