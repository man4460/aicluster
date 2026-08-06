"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import {
  buildingPosHubUrlMerge,
  parseBuildingPosNav,
} from "@/systems/building-pos/building-pos-nav";
import {
  buildingPosNavActiveClass,
  buildingPosNavIdleClass,
  buildingPosSubTabSegmentShellClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

function pillClass(active: boolean) {
  return cn(
    "flex min-h-[50px] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1.25rem] px-1.5 py-2 text-center font-black transition-all sm:min-h-[44px] sm:flex-row sm:gap-2 sm:px-3 sm:py-3 sm:text-sm",
    active
      ? cn(buildingPosNavActiveClass, "ring-1 ring-white/55 backdrop-blur-sm")
      : cn("ring-1 ring-transparent", buildingPosNavIdleClass),
  );
}

function IconQrCustomer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M12 3v3M8 6h8M7 12h10v9H7z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 16h6M10 12v4" strokeLinecap="round" />
    </svg>
  );
}

function IconQrStaff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M12 11a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M4 21v-1a5 5 0 015-5h2a5 5 0 015 5v1" strokeLinecap="round" />
      <path d="M19 8l2 2-2 2M17 10h4" strokeLinecap="round" />
    </svg>
  );
}

function IconFinSales({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFinCosts({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className={className} aria-hidden>
      <path d="M12 3v18M5 8l7-4 7 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

function BuildingPosHubSubTabsInner({
  variant,
  className,
}: {
  variant: "standalone" | "embedded";
  className?: string;
}) {
  const searchParams = useSearchParams();
  const nav = parseBuildingPosNav(searchParams);

  if (nav.main === "overview") return null;
  /** เมนู: ไม่มีแท็บย่อย — หมวดหมู่จัดการผ่าน popup จากปุ่มในหน้าเมนู */
  if (nav.main === "menu") return null;

  const embedded = variant === "embedded";

  const links: { href: string; label: string; active: boolean; Icon: ComponentType<{ className?: string }> }[] =
    nav.main === "qr"
      ? [
          {
            href: buildingPosHubUrlMerge(nav, { main: "qr", qr: "customer" }),
            label: "ลูกค้าสแกนสั่ง",
            active: nav.qr === "customer",
            Icon: IconQrCustomer,
          },
          {
            href: buildingPosHubUrlMerge(nav, { main: "qr", qr: "staff" }),
            label: "พนักงาน",
            active: nav.qr === "staff",
            Icon: IconQrStaff,
          },
        ]
      : [
            {
              href: buildingPosHubUrlMerge(nav, { main: "finance", finance: "sales" }),
              label: "ยอดขาย",
              active: nav.finance === "sales",
              Icon: IconFinSales,
            },
            {
              href: buildingPosHubUrlMerge(nav, { main: "finance", finance: "costs" }),
              label: "ต้นทุน / รายจ่าย",
              active: nav.finance === "costs",
              Icon: IconFinCosts,
            },
          ];

  const navBody = (
    <nav
      aria-label="แท็บย่อย POS"
      className={cn(
        "print:hidden",
        embedded ? "rounded-[1.25rem] border border-[#e4e0f5]/90 bg-gradient-to-r from-white/95 via-[#faf9ff] to-indigo-50/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] md:rounded-xl md:border-white/45 md:bg-white/35 md:shadow-none" : buildingPosSubTabSegmentShellClass,
        className,
      )}
    >
      <ul className="flex w-full min-w-0 gap-1">
        {links.map((l) => (
          <li key={l.label} className="min-w-0 flex-1">
            <Link
              href={l.href}
              scroll={false}
              className={pillClass(l.active)}
              aria-current={l.active ? "page" : undefined}
              title={l.label}
            >
              <l.Icon className="h-5 w-5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
              <span className="line-clamp-2 max-w-full px-0.5 text-center text-[9px] font-black leading-tight sm:line-clamp-none sm:text-sm">
                {l.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  if (!embedded) return navBody;

  return (
    <div className="mt-4 md:mt-5 md:border-t md:border-white/40 md:pt-5">
      {navBody}
    </div>
  );
}

export function BuildingPosHubSubTabs(props?: { variant?: "standalone" | "embedded"; className?: string }) {
  const variant = props?.variant ?? "standalone";
  const className = props?.className;
  return (
    <Suspense fallback={null}>
      <BuildingPosHubSubTabsInner variant={variant} className={className} />
    </Suspense>
  );
}
