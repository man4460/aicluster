"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/cn";
import { buildingPosMainTabHref, parseBuildingPosNav, type BuildingPosMainTab } from "@/systems/building-pos/building-pos-nav";

function IconOverview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

function IconQr({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z" />
      <path d="M15 15h2v2M19 15h2v2M15 19h2M19 19h2" strokeLinecap="round" />
    </svg>
  );
}

function IconFinance({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M4 7h16v4H4zM6 11v8h12v-8M9 7V5h6v2" />
    </svg>
  );
}

/** เทียบ `CarWashDashboard` เมนูล่างมือถือ + `BarberModuleMobileDock` — ไอคอน + ชื่อเมนู text-[9px] font-black */
const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

function BuildingPosMobileDockInner() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const nav = parseBuildingPosNav(searchParams);
  /** ซ่อน dock ถ้าไม่ใช่หน้า hub (เช่น redirect กำลังทำงาน) */
  const onHub = pathname.replace(/\/+$/, "").endsWith("/dashboard/building-pos");

  if (!onHub) return null;

  const items: { main: BuildingPosMainTab; label: string; icon: typeof IconOverview }[] = [
    { main: "overview", label: "แดชบอร์ด", icon: IconOverview },
    { main: "finance", label: "การเงิน", icon: IconFinance },
    { main: "menu", label: "เมนู", icon: IconMenu },
    { main: "qr", label: "QR", icon: IconQr },
  ];

  return (
    <nav
      className={cn(
        "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))]",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
        "pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
      )}
      aria-label="เมนูล่าง POS ร้านอาหาร"
    >
      <ul className="grid grid-cols-4 gap-1">
        {items.map(({ main, label, icon: Icon }) => {
          const active = nav.main === main;
          const href = buildingPosMainTabHref(nav, main);
          return (
            <li key={main} className="min-w-0">
              <Link
                href={href}
                scroll={false}
                className={dockLinkClass(active)}
                aria-current={active ? "page" : undefined}
                title={label}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BuildingPosMobileDock() {
  return (
    <Suspense fallback={null}>
      <BuildingPosMobileDockInner />
    </Suspense>
  );
}
