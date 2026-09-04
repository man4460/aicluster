"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  laundryMobileSelectClass,
  laundryPanelClass,
  laundryPanelSectionClass,
  laundryPrimaryTabPillClass,
  laundryPrimaryTabShellClass,
  laundrySubtitleClass,
} from "@/systems/laundry/lib/ui-tokens";

export type LaundryPageSubNavItem = {
  key: string;
  label: string;
  icon?: ReactNode;
};

const tabBtnClass = (active: boolean) =>
  cn(
    laundryPrimaryTabPillClass(active),
    "inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 sm:flex-initial",
  );

/** แถบเมนูย่อยของแต่ละหน้าหลัก — แยกจากเนื้อหา · ไม่ซ้อนในการ์ดข้อมูล */
export function LaundryPageSubNav({
  title,
  titleIcon,
  description,
  items,
  activeKey,
  onSelect,
  ariaLabel,
  action,
  mobileSelect,
  className,
}: {
  title: string;
  /** ไอคอนข้างหัวข้อหน้า — ตามกฎ dashboard-module-page-menu-icons */
  titleIcon?: ReactNode;
  description?: string;
  items: LaundryPageSubNavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
  action?: ReactNode;
  mobileSelect?: {
    id: string;
    label: string;
  };
  className?: string;
}) {
  return (
    <div className={cn(laundryPanelClass, laundryPanelSectionClass, "print:hidden", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            {titleIcon ? (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100/90 text-sky-700 ring-1 ring-sky-200/80"
                aria-hidden
              >
                {titleIcon}
              </span>
            ) : null}
            <h2 className="min-w-0 truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{title}</h2>
          </div>
          {description ? <p className={laundrySubtitleClass}>{description}</p> : null}
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          {action ? (
            <div className="order-2 flex w-full flex-col gap-2 sm:order-1 sm:w-auto sm:flex-row sm:justify-end">
              {action}
            </div>
          ) : null}

          {mobileSelect ? (
            <div className="order-1 w-full sm:hidden">
              <label htmlFor={mobileSelect.id} className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
                {mobileSelect.label}
              </label>
              <select
                id={mobileSelect.id}
                value={activeKey}
                onChange={(e) => onSelect(e.target.value)}
                className={laundryMobileSelectClass}
                aria-label={mobileSelect.label}
              >
                {items.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <nav
            className={cn(
              laundryPrimaryTabShellClass,
              "order-1 w-full min-w-0 sm:order-2 sm:w-auto",
              mobileSelect && "hidden sm:inline-flex",
            )}
            aria-label={ariaLabel}
            role="tablist"
          >
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
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                      {item.icon}
                    </span>
                  ) : null}
                  <span className="max-w-[5.5rem] text-center sm:max-w-none">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
