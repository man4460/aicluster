import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  Clock,
  Contact,
  Globe,
  LayoutDashboard,
  Link2,
  Map,
  MapPin,
  Package,
  Route,
  Settings,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import type {
  SmartGuardTourDashboardTabKey,
  SmartGuardTourManageTabKey,
  SmartGuardTourModuleNavKey,
  SmartGuardTourSettingsTab,
} from "@/systems/smart-guard-tour/smart-guard-tour-module-nav";
import type { SmartGuardTourCardTone } from "@/systems/smart-guard-tour/lib/card-tones";

const iconClass = "h-4 w-4";

export function smartGuardTourPageTitleIcon(key: SmartGuardTourModuleNavKey): ReactNode {
  switch (key) {
    case "dashboard":
      return <LayoutDashboard className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "finance":
      return <Wallet className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "manage":
      return <Shield className={iconClass} strokeWidth={2.25} aria-hidden />;
    case "settings":
      return <Settings className={iconClass} strokeWidth={2.25} aria-hidden />;
    default:
      return <Shield className={iconClass} strokeWidth={2.25} aria-hidden />;
  }
}

export function smartGuardTourPageTitleTone(key: SmartGuardTourModuleNavKey): SmartGuardTourCardTone {
  switch (key) {
    case "dashboard":
      return "sky";
    case "finance":
      return "emerald";
    case "manage":
      return "orange";
    case "settings":
      return "indigo";
    default:
      return "slate";
  }
}

export function smartGuardTourDashboardTabIcon(key: SmartGuardTourDashboardTabKey): ReactNode {
  switch (key) {
    case "overview":
      return <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "checkpoints":
      return <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "tour-logs":
      return <Route className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "incidents":
      return <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "shifts":
      return <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "map-view":
      return <Map className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function smartGuardTourManageTabIcon(key: SmartGuardTourManageTabKey): ReactNode {
  switch (key) {
    case "checkpoints":
      return <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "schedules":
      return <CalendarClock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "staff":
      return <Users className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "incidents":
      return <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "contacts":
      return <Contact className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    case "assets":
      return <Package className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />;
    default:
      return null;
  }
}

export function smartGuardTourSettingsTabIcon(key: SmartGuardTourSettingsTab): ReactNode {
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
