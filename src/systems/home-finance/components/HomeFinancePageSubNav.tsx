"use client";

import { useId, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  HOME_FINANCE_OVERVIEW_SUBNAV_ITEMS,
  homeFinanceOverviewSubKey,
  type HomeFinanceOverviewSubKey,
} from "@/systems/home-finance/home-finance-module-nav";
import { homeFinanceCardIconTileClass } from "@/systems/home-finance/lib/card-tones";
import {
  homeFinanceOverviewSubIcon,
  homeFinanceOverviewSubTone,
} from "@/systems/home-finance/lib/page-menu-icons";
import {
  homeFinanceMobileSelectClass,
  homeFinancePanelClass,
  homeFinancePanelDividerClass,
  homeFinancePanelSectionClass,
  homeFinancePrimaryTabPillClass,
  homeFinancePrimaryTabShellClass,
  homeFinanceSubtitleClass,
} from "@/systems/home-finance/lib/ui-tokens";

export type HomeFinancePageSubNavItem = {
  key: string;
  label: string;
  icon?: ReactNode;
};

const tabBtnClass = (active: boolean) =>
  cn(
    homeFinancePrimaryTabPillClass(active),
    "inline-flex min-h-9 items-center justify-center gap-1.5",
  );

/**
 * หัวการ์ด + เมนูย่อย + เนื้อหาในการ์ดเดียว (แม่แบบซักผ้า / LMS)
 * มือถือ: dropdown อย่างเดียว · ซ่อนแถบ pill (`hidden sm:block` ห่อ nav)
 */
export function HomeFinancePageSubNav({
  title,
  titleIcon,
  titleTone = "emerald",
  description,
  items,
  activeKey,
  onSelect,
  ariaLabel,
  action,
  mobileSelect,
  children,
  className,
}: {
  title: string;
  titleIcon?: ReactNode;
  titleTone?: "sky" | "violet" | "emerald" | "rose" | "amber" | "indigo" | "slate";
  description?: string;
  items: HomeFinancePageSubNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
  action?: ReactNode;
  mobileSelect?: {
    id: string;
    label: string;
  } | false;
  children?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const resolvedMobileSelect =
    mobileSelect === false
      ? null
      : mobileSelect ??
        (items.length >= 2
          ? { id: `hf-subnav-${autoId}`, label: ariaLabel }
          : null);

  return (
    <div className={cn(homeFinancePanelClass, "print:hidden", className)}>
      <div className={cn(homeFinancePanelSectionClass)}>
        {/* ชื่อซ้าย · แท็บเมนูย่อย+ปุ่มขวา (sm+) · มือถือเหลือชื่อ+ปุ่ม */}
        <div className="flex flex-nowrap items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              {titleIcon ? (
                <span className={homeFinanceCardIconTileClass(titleTone)} aria-hidden>
                  {titleIcon}
                </span>
              ) : null}
              <h2 className="min-w-0 truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{title}</h2>
            </div>
            {description ? <p className={homeFinanceSubtitleClass}>{description}</p> : null}
          </div>

          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 self-start pt-0.5 sm:gap-2 sm:pt-0">
            {/* แถบเมนูย่อย — เดสก์ท็อปเท่านั้น ขวาร่วมแถวกับชื่อ */}
            <div className={resolvedMobileSelect ? "hidden sm:block" : undefined}>
              <nav className={homeFinancePrimaryTabShellClass} aria-label={ariaLabel} role="tablist">
                {items.map((item) => {
                  const active = activeKey === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-current={active ? "page" : undefined}
                      aria-label={item.label}
                      onClick={() => onSelect(item.key)}
                      className={tabBtnClass(active)}
                    >
                      {item.icon ? (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                          {item.icon}
                        </span>
                      ) : null}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
            {action}
          </div>
        </div>

        {/* มือถือ: dropdown แทนแถบ pill */}
        {resolvedMobileSelect ? (
          <div className="mt-3 w-full sm:hidden">
            <label htmlFor={resolvedMobileSelect.id} className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
              {resolvedMobileSelect.label}
            </label>
            <select
              id={resolvedMobileSelect.id}
              value={activeKey}
              onChange={(e) => onSelect(e.target.value)}
              className={homeFinanceMobileSelectClass}
              aria-label={resolvedMobileSelect.label}
            >
              {items.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {children != null ? (
        <div className={cn(homeFinancePanelSectionClass, homeFinancePanelDividerClass)} role="tabpanel">
          {children}
        </div>
      ) : null}
    </div>
  );
}

const OVERVIEW_SUBNAV_ITEMS: HomeFinancePageSubNavItem[] = HOME_FINANCE_OVERVIEW_SUBNAV_ITEMS.map((item) => ({
  key: item.key,
  label: item.label,
  icon: homeFinanceOverviewSubIcon(item.key, "h-4 w-4"),
}));

/** เมนูย่อยใต้เมนูหลักภาพรวม — ภาพรวม · รหัสผ่าน · โน้ต (เนื้อหาในการ์ดเดียว) */
export function HomeFinanceOverviewSubNav({
  children,
  action,
}: {
  children?: ReactNode;
  action?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const activeKey = homeFinanceOverviewSubKey(pathname);
  const activeMeta = HOME_FINANCE_OVERVIEW_SUBNAV_ITEMS.find((i) => i.key === activeKey);

  return (
    <HomeFinancePageSubNav
      title={activeMeta?.label ?? "ภาพรวม"}
      titleIcon={homeFinanceOverviewSubIcon(activeKey, "h-4 w-4")}
      titleTone={homeFinanceOverviewSubTone(activeKey)}
      description={activeMeta?.description}
      items={OVERVIEW_SUBNAV_ITEMS}
      activeKey={activeKey}
      ariaLabel="เมนูย่อยภาพรวม"
      action={action}
      onSelect={(key) => {
        const item = HOME_FINANCE_OVERVIEW_SUBNAV_ITEMS.find((i) => i.key === (key as HomeFinanceOverviewSubKey));
        if (item) router.push(item.href);
      }}
    >
      {children}
    </HomeFinancePageSubNav>
  );
}
