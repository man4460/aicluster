import type { ComponentType, SVGProps } from "react";
import { ClipboardList, ExternalLink, Globe2, UserPlus, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";
import { CLUB_EVENT_LINK_TYPE_LABELS } from "@/systems/club-event/lib/mappers";

export type ClubPortalLinkIconType = "SURVEY" | "RSVP" | "PAYMENT" | "URL" | string;

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

type LinkTone = {
  Icon: IconComp;
  /** ชิปเล็กในการ์ด */
  chip: string;
  /** ไทล์ไอคอนแถวกฎระเบียบ / รายละเอียด */
  tile: string;
  /** ไอคอนในไทล์ */
  icon: string;
  /** badge ข้อความสั้น */
  badge: string;
};

const TONES: Record<string, LinkTone> = {
  SURVEY: {
    Icon: ClipboardList,
    chip: "border-sky-200/90 bg-gradient-to-br from-sky-50 to-cyan-50/90 text-sky-800 shadow-sm hover:from-sky-100 hover:to-cyan-50 hover:shadow",
    tile: "border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-sky-800 shadow-sm hover:shadow-md hover:border-sky-300",
    icon: "text-sky-600",
    badge: "bg-sky-100 text-sky-800 ring-sky-200/80",
  },
  RSVP: {
    Icon: UserPlus,
    chip: "border-violet-200/90 bg-gradient-to-br from-violet-50 to-indigo-50/90 text-violet-800 shadow-sm hover:from-violet-100 hover:to-indigo-50 hover:shadow",
    tile: "border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-indigo-50 text-violet-800 shadow-sm hover:shadow-md hover:border-violet-300",
    icon: "text-violet-600",
    badge: "bg-violet-100 text-violet-800 ring-violet-200/80",
  },
  PAYMENT: {
    Icon: Wallet,
    chip: "border-emerald-200/90 bg-gradient-to-br from-emerald-50 to-teal-50/90 text-emerald-800 shadow-sm hover:from-emerald-100 hover:to-teal-50 hover:shadow",
    tile: "border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-emerald-800 shadow-sm hover:shadow-md hover:border-emerald-300",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-800 ring-emerald-200/80",
  },
  URL: {
    Icon: Globe2,
    chip: "border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/90 text-amber-900 shadow-sm hover:from-amber-100 hover:to-orange-50 hover:shadow",
    tile: "border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-amber-900 shadow-sm hover:shadow-md hover:border-amber-300",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-900 ring-amber-200/80",
  },
};

const FALLBACK: LinkTone = {
  Icon: ExternalLink,
  chip: "border-slate-200/90 bg-gradient-to-br from-slate-50 to-slate-100/80 text-slate-700 shadow-sm hover:bg-slate-100",
  tile: "border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-700 shadow-sm hover:shadow-md",
  icon: "text-slate-500",
  badge: "bg-slate-100 text-slate-700 ring-slate-200/80",
};

export function clubEventPortalLinkTone(type: ClubPortalLinkIconType): LinkTone {
  return TONES[type] ?? FALLBACK;
}

export function ClubEventPortalLinkTypeIcon({
  type,
  className,
}: {
  type: ClubPortalLinkIconType;
  className?: string;
}) {
  const { Icon, icon } = clubEventPortalLinkTone(type);
  return <Icon className={cn("h-3.5 w-3.5 shrink-0", icon, className)} strokeWidth={2.25} aria-hidden />;
}

export function clubEventPortalLinkTypeAriaLabel(type: ClubPortalLinkIconType, title: string): string {
  const typeLabel =
    type in CLUB_EVENT_LINK_TYPE_LABELS
      ? CLUB_EVENT_LINK_TYPE_LABELS[type as keyof typeof CLUB_EVENT_LINK_TYPE_LABELS]
      : type;
  const t = title.trim();
  return t ? `${typeLabel} · ${t}` : typeLabel;
}

/** ชิปในการ์ดกิจกรรม */
export function clubEventPortalLinkChipClass(type: ClubPortalLinkIconType): string {
  return cn(
    "inline-flex max-w-full items-center gap-1 rounded-lg border px-1.5 py-0.5 text-[10px] font-bold transition",
    clubEventPortalLinkTone(type).chip,
  );
}

/** ไทล์ไอคอนแถว (กฎระเบียบ / รายละเอียด) */
export function clubEventPortalLinkTileClass(type: ClubPortalLinkIconType): string {
  return cn(
    "inline-flex min-h-[3rem] min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-2xl border px-2.5 py-2 transition",
    clubEventPortalLinkTone(type).tile,
  );
}

export function clubEventPortalLinkTypeBadgeClass(type: ClubPortalLinkIconType): string {
  return cn(
    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset",
    clubEventPortalLinkTone(type).badge,
  );
}
