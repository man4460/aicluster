"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  clubEventInlineSubNavBtnClass,
  clubEventInlineSubNavShellClass,
  clubEventMobileSelectClass,
  clubEventPanelClass,
  clubEventPanelDividerClass,
  clubEventPanelSectionClass,
  clubEventSectionHeadingClass,
} from "@/systems/club-event/lib/ui-tokens";

export type ClubEventPageSubNavItem = {
  key: string;
  label: string;
  /** ป้ายสั้นบนมือถือ (เมื่อไม่ใช้ dropdown) */
  shortLabel?: string;
  icon?: ReactNode;
};

/**
 * หัวการ์ดแบบซักผ้า — ชื่อเมนูหลัก + หัวข้อย่อยแถวเดียว · แท็บ/ปุ่มขวา · เส้นบาง · เนื้อหา
 * แท็บหลายตัว: มือถือใช้ select (ส่ง mobileSelect) · sm+ แสดง pill มุมขวา
 */
export function ClubEventPageSubNav({
  title,
  subtitle,
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
  /** ถ้าไม่ส่ง จะใช้ label ของแท็บที่เลือก */
  subtitle?: string;
  items?: ClubEventPageSubNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  ariaLabel?: string;
  action?: ReactNode;
  /** เมื่อมีหลายแท็บ — dropdown บนมือถือ + ซ่อน pill (กฎ dashboard-primary-secondary-menu-tabs) */
  mobileSelect?: {
    id: string;
    label: string;
  };
  children?: ReactNode;
  className?: string;
}) {
  const hasTabs = Boolean(items?.length && onSelect && activeKey != null);
  const activeItem = items?.find((i) => i.key === activeKey);
  const sub = subtitle ?? activeItem?.label;
  const useMobileSelect = Boolean(hasTabs && mobileSelect);

  return (
    <div className={cn(clubEventPanelClass, className)}>
      <div className={cn(clubEventPanelSectionClass, "print:hidden")}>
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{title}</h2>
            {sub ? (
              <>
                <span className="h-4 w-px shrink-0 bg-slate-200/90" aria-hidden />
                <p className="min-w-0 truncate text-sm font-semibold text-[#66638c]">{sub}</p>
              </>
            ) : null}
          </div>

          <div
            className="flex shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5"
            role="group"
            aria-label={ariaLabel ?? "เครื่องมือหน้า"}
          >
            {hasTabs ? (
              useMobileSelect ? (
                <div className="hidden sm:block">
                  <nav
                    className={clubEventInlineSubNavShellClass}
                    role="tablist"
                    aria-label={ariaLabel ?? "เมนูย่อย"}
                  >
                    {items!.map((item) => {
                      const active = activeKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          aria-current={active ? "page" : undefined}
                          title={item.label}
                          aria-label={item.label}
                          onClick={() => onSelect?.(item.key)}
                          className={clubEventInlineSubNavBtnClass(active)}
                        >
                          {item.icon ? (
                            <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
                              {item.icon}
                            </span>
                          ) : null}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ) : (
                <nav className={clubEventInlineSubNavShellClass} role="tablist" aria-label={ariaLabel ?? "เมนูย่อย"}>
                  {items!.map((item) => {
                    const active = activeKey === item.key;
                    const short = item.shortLabel ?? item.label;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-current={active ? "page" : undefined}
                        title={item.label}
                        aria-label={item.label}
                        onClick={() => onSelect?.(item.key)}
                        className={clubEventInlineSubNavBtnClass(active)}
                      >
                        {item.icon ? (
                          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden>
                            {item.icon}
                          </span>
                        ) : null}
                        <span className="hidden sm:inline">{item.label}</span>
                        <span className="sm:hidden" aria-hidden>
                          {short}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              )
            ) : null}
            {action}
          </div>
        </div>

        {useMobileSelect && mobileSelect ? (
          <div className="mt-3 w-full sm:hidden">
            <label htmlFor={mobileSelect.id} className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
              {mobileSelect.label}
            </label>
            <select
              id={mobileSelect.id}
              value={activeKey}
              onChange={(e) => onSelect?.(e.target.value)}
              className={clubEventMobileSelectClass}
              aria-label={mobileSelect.label}
            >
              {items!.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {children != null ? (
        <div className={cn(clubEventPanelSectionClass, clubEventPanelDividerClass)}>{children}</div>
      ) : null}
    </div>
  );
}

/** บล็อกย่อยในเนื้อหา — คั่นเส้นบาง (บล็อกแรกส่ง first) · ไม่ใส่หัวซ้ำถ้าหัวอยู่แถวเมนูแล้ว */
export function ClubEventPageBlock({
  title,
  action,
  children,
  first = false,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(!first && cn(clubEventPanelDividerClass, "mt-4 pt-4"), className)}>
      {title || action ? (
        <div className="mb-3 flex flex-row items-start justify-between gap-3">
          {title ? <h3 className={clubEventSectionHeadingClass}>{title}</h3> : <span />}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
