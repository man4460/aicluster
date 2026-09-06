import type { ComponentType, SVGProps } from "react";
import { ClipboardList, ExternalLink, UserPlus, Wallet } from "lucide-react";
import { cn } from "@/lib/cn";

export type ClubPortalLinkIconType = "SURVEY" | "RSVP" | "PAYMENT" | "URL" | string;

type IconComp = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

const BY_TYPE: Record<string, IconComp> = {
  SURVEY: ClipboardList,
  RSVP: UserPlus,
  PAYMENT: Wallet,
  URL: ExternalLink,
};

export function ClubEventPortalLinkTypeIcon({
  type,
  className,
}: {
  type: ClubPortalLinkIconType;
  className?: string;
}) {
  const Icon = BY_TYPE[type] ?? ExternalLink;
  return <Icon className={cn("h-3.5 w-3.5 shrink-0", className)} strokeWidth={2.25} aria-hidden />;
}

export function clubEventPortalLinkTypeAriaLabel(type: ClubPortalLinkIconType, title: string): string {
  return title.trim() || type;
}
