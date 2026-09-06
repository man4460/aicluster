import type { ReactNode } from "react";
import {
  CalendarDays,
  FileText,
  History,
  Images,
  Phone,
  Play,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/cn";

const iconSm = "h-4 w-4 sm:h-5 sm:w-5";

export type ClubPortalSectionIconKey =
  | "schedule"
  | "past"
  | "gallery"
  | "rules"
  | "contact"
  | "detail"
  | "youtube";

export function isClubPortalSectionIconKey(value: string): value is ClubPortalSectionIconKey {
  return (
    value === "schedule" ||
    value === "past" ||
    value === "gallery" ||
    value === "rules" ||
    value === "contact" ||
    value === "detail" ||
    value === "youtube"
  );
}

const TILE: Record<ClubPortalSectionIconKey, { wrap: string; icon: string; node: ReactNode }> = {
  schedule: {
    wrap: "bg-violet-100/90 text-violet-700 ring-violet-200/80",
    icon: "text-violet-700",
    node: <CalendarDays className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
  past: {
    wrap: "bg-indigo-100/90 text-indigo-700 ring-indigo-200/80",
    icon: "text-indigo-700",
    node: <History className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
  gallery: {
    wrap: "bg-fuchsia-100/90 text-fuchsia-700 ring-fuchsia-200/80",
    icon: "text-fuchsia-700",
    node: <Images className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
  rules: {
    wrap: "bg-amber-100/90 text-amber-800 ring-amber-200/80",
    icon: "text-amber-800",
    node: <ScrollText className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
  contact: {
    wrap: "bg-emerald-100/90 text-emerald-700 ring-emerald-200/80",
    icon: "text-emerald-700",
    node: <Phone className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
  detail: {
    wrap: "bg-sky-100/90 text-sky-700 ring-sky-200/80",
    icon: "text-sky-700",
    node: <FileText className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
  youtube: {
    wrap: "bg-rose-100/90 text-rose-700 ring-rose-200/80",
    icon: "text-rose-700",
    node: <Play className={iconSm} strokeWidth={2.25} aria-hidden />,
  },
};

export function ClubEventPortalSectionTitleIcon({
  name,
  className,
}: {
  name: ClubPortalSectionIconKey;
  className?: string;
}) {
  const t = TILE[name];
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:h-10 sm:w-10",
        t.wrap,
        className,
      )}
      aria-hidden
    >
      {t.node}
    </span>
  );
}
