"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_HUB_NAV_ITEMS } from "@/lib/admin-hub-nav";
import { cn } from "@/lib/cn";

/** สอดคล้องปุ่มเมนูใน CarWashDashboard */
const adminHubNavItemBase =
  "flex min-h-[44px] min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:min-h-0 sm:w-auto sm:justify-center sm:px-3.5 sm:py-2";

export function AdminHubChrome() {
  const pathname = usePathname();
  const isHubRoot = pathname === "/dashboard/admin";

  return (
    <>
      <header className="app-surface rounded-2xl px-4 py-4 sm:px-6 sm:py-5 print:hidden">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-[#2e2a58] sm:text-2xl">ศูนย์แอดมิน</h1>
          <p className="mt-1 max-w-2xl text-sm leading-snug text-[#66638c]">
            จัดการผู้ใช้ ความเคลื่อนไหวระบบ MQTT การ Subscribe และรูปการ์ดโมดูล — เลือกเมนูด้านล่างเพื่อเปิดรายละเอียด
          </p>
        </div>
      </header>

      <nav aria-label="เมนูศูนย์แอดมิน" className="app-surface rounded-2xl p-3 sm:p-4 print:hidden">
        <p className="mb-2.5 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
        <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
          <li className="min-w-0 sm:w-auto">
            <Link
              href="/dashboard/admin"
              className={cn(
                adminHubNavItemBase,
                "w-full sm:w-auto",
                isHubRoot
                  ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                  : "app-btn-soft text-[#66638c]",
              )}
            >
              ภาพรวม
            </Link>
          </li>
          {ADMIN_HUB_NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="min-w-0 sm:w-auto">
                <Link
                  href={item.href}
                  className={cn(
                    adminHubNavItemBase,
                    "w-full sm:w-auto",
                    active
                      ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20"
                      : "app-btn-soft text-[#66638c]",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
