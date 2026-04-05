"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { deriveBuildingPosSection } from "@/systems/building-pos/buildingPosSection";

export type BuildingPosDashTab = "overview" | "orders" | "menu" | "categories" | "ingredients" | "purchases";

/** มือถือ: กริด 2 คอลัมน์ แตะง่าย (min 44px) · จอใหญ่: แถบ wrap เหมือนเมนูรายรับ–รายจ่าย */
const navItemBase =
  "flex min-h-[44px] w-full min-w-0 touch-manipulation select-none items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors active:opacity-90 sm:w-auto sm:px-3.5 sm:py-2";

/** ลิงก์ไปแดชบอร์ด POS พร้อมแท็บ (ใช้บนหน้ายอดขาย) */
export function buildingPosDashboardTabHref(t: BuildingPosDashTab): string {
  if (t === "overview") return "/dashboard/building-pos";
  return `/dashboard/building-pos?tab=${t}`;
}

type Props = {
  activeTab?: BuildingPosDashTab;
  onTabChange?: (tab: BuildingPosDashTab) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export function BuildingPosUnifiedMenuBar({ activeTab, onTabChange, onRefresh, refreshing }: Props) {
  const section = deriveBuildingPosSection(usePathname() ?? "");
  const isDashboard = section === "dashboard";
  const useTabButtons = isDashboard && onTabChange != null && activeTab != null;

  return (
    <nav aria-label="เมนู POS ร้านอาหาร" className="app-surface rounded-2xl p-3 sm:p-4 print:hidden">
      <p className="mb-2 text-xs font-medium text-[#66638c] sm:mb-3">เมนู</p>
      <ul className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        <li className="min-w-0 sm:w-auto">
          {useTabButtons ? (
            <button
              type="button"
              onClick={() => onTabChange!("overview")}
              className={cn(
                navItemBase,
                activeTab === "overview" ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
              )}
            >
              แดชบอร์ด
            </button>
          ) : (
            <Link
              href={buildingPosDashboardTabHref("overview")}
              className={cn(navItemBase, "app-btn-soft text-[#66638c]")}
            >
              แดชบอร์ด
            </Link>
          )}
        </li>

        <li className="min-w-0 sm:w-auto">
          <Link
            href="/dashboard/building-pos/sales"
            className={cn(
              navItemBase,
              section === "sales" ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
            )}
          >
            ยอดขาย
          </Link>
        </li>

        <li className="min-w-0 sm:w-auto">
          <Link
            href="/dashboard/building-pos/staff-link"
            className={cn(
              navItemBase,
              section === "staff-link" ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
            )}
          >
            พนักงานเสิร์ฟ
          </Link>
        </li>

        {(["orders", "menu", "categories", "ingredients", "purchases"] as const).map((key) => (
          <li key={key} className="min-w-0 sm:w-auto">
            {useTabButtons ? (
              <button
                type="button"
                onClick={() => onTabChange!(key)}
                className={cn(
                  navItemBase,
                  activeTab === key ? "bg-[#ecebff] text-[#4d47b6] ring-1 ring-[#4d47b6]/20" : "app-btn-soft text-[#66638c]",
                )}
              >
                {key === "orders"
                  ? "QR สั่งอาหาร"
                  : key === "menu"
                    ? "เมนูอาหาร"
                    : key === "categories"
                      ? "หมวดหมู่"
                      : key === "ingredients"
                        ? "รายการของ"
                        : "บันทึกจ่ายตลาด"}
              </button>
            ) : (
              <Link
                href={buildingPosDashboardTabHref(key)}
                className={cn(navItemBase, "app-btn-soft text-[#66638c]")}
              >
                {key === "orders"
                  ? "QR สั่งอาหาร"
                  : key === "menu"
                    ? "เมนูอาหาร"
                    : key === "categories"
                      ? "หมวดหมู่"
                      : key === "ingredients"
                        ? "รายการของ"
                        : "บันทึกจ่ายตลาด"}
              </Link>
            )}
          </li>
        ))}

        {onRefresh ? (
          <li className="col-span-2 min-w-0 sm:col-span-1 sm:ml-auto sm:w-auto">
            <button
              type="button"
              onClick={() => onRefresh()}
              disabled={refreshing}
              className={cn(
                navItemBase,
                "border border-[#c8c4ff] bg-white text-[#4d47b6] shadow-sm hover:bg-[#f4f3ff] disabled:cursor-not-allowed disabled:opacity-60",
              )}
              title="ดึงออเดอร์และเมนูล่าสุดจากเซิร์ฟเวอร์"
            >
              {refreshing ? "กำลังรีเฟรช…" : "รีเฟรชออเดอร์"}
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
