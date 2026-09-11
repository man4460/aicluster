import type { ReactNode } from "react";
import {
  Building2,
  Calculator,
  CalendarClock,
  Car,
  ClipboardList,
  Clock,
  Globe,
  Landmark,
  LayoutDashboard,
  Link2,
  Settings,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
  BadgePercent,
} from "lucide-react";
import type {
  UsedCarShowroomDashboardTabKey,
  UsedCarShowroomManageTabKey,
  UsedCarShowroomModuleNavKey,
  UsedCarShowroomSettingsTab,
} from "@/systems/used-car-showroom/used-car-showroom-module-nav";
import type { UsedCarShowroomCardTone } from "@/systems/used-car-showroom/lib/card-tones";

const iconClass = "h-4 w-4";

export function usedCarShowroomPageTitleIcon(key: UsedCarShowroomModuleNavKey): ReactNode {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "manage":
      return <ClipboardList className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "settings":
      return <Settings className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <Car className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}

export function usedCarShowroomPageTitleTone(key: UsedCarShowroomModuleNavKey): UsedCarShowroomCardTone {
  switch (key) {
    case "dashboard":
      return "sky";
    case "finance":
      return "emerald";
    case "manage":
      return "violet";
    case "settings":
      return "indigo";
    default:
      return "slate";
  }
}

export function usedCarShowroomDashboardTabIcon(key: UsedCarShowroomDashboardTabKey): ReactNode {
  switch (key) {
    case "overview":
      return <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "stock":
      return <Car className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "reservations":
      return <ClipboardList className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "appointments":
      return <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "finance-pending":
      return <Landmark className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "installment":
      return <Calculator className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function usedCarShowroomManageTabIcon(key: UsedCarShowroomManageTabKey): ReactNode {
  switch (key) {
    case "vehicles":
      return <Car className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "pnl":
      return <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "staff":
      return <Users className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "promotions":
      return <BadgePercent className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "customers":
      return <UserRound className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "finance-companies":
      return <Building2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function usedCarShowroomSettingsTabIcon(key: UsedCarShowroomSettingsTab): ReactNode {
  switch (key) {
    case "basic":
      return <Settings className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "portal":
      return <Globe className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "hours":
      return <Clock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "link":
      return <Link2 className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}
