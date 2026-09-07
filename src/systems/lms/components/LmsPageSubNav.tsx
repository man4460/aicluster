"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  lmsBlockTitleIconTileClass,
  lmsPageTitleIconTileClass,
  type LmsCardTone,
} from "@/systems/lms/lib/card-tones";
import {
  lmsInlineSubNavBtnClass,
  lmsInlineSubNavShellClass,
  lmsMobileSelectClass,
  lmsPanelClass,
  lmsPanelDividerClass,
  lmsPanelSectionClass,
  lmsSectionHeadingClass,
} from "@/systems/lms/lib/ui-tokens";

export type LmsPageSubNavItem = {
  key: string;
  label: string;
  /** ป้ายสั้นบนมือถือ (เมื่อไม่ใช้ dropdown) */
  shortLabel?: string;
  icon?: ReactNode;
};

/**
 * หัวการ์ดแบบซักผ้า — ไอคอนหัวข้อ + ชื่อเมนูหลัก + หัวข้อย่อย · แท็บ/ปุ่มขวา · เส้นบาง · เนื้อหา
 * แท็บ ≥2: มือถือใช้ select อัตโนมัติ (หรือส่ง mobileSelect) · sm+ แสดง pill
 */
export function LmsPageSubNav({
  title,
  titleIcon,
  titleTone = "sky",
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
  titleIcon?: ReactNode;
  titleTone?: LmsCardTone;
  subtitle?: string;
  items?: LmsPageSubNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  ariaLabel?: string;
  action?: ReactNode;
  /** override ป้าย/id ของ dropdown มือถือ — ถ้าไม่ส่งและมีแท็บ ≥2 จะเปิดอัตโนมัติ */
  mobileSelect?: {
    id: string;
    label: string;
  } | false;
  children?: ReactNode;
  className?: string;
}) {
  const autoId = useId();
  const hasTabs = Boolean(items?.length && onSelect && activeKey != null);
  const activeItem = items?.find((i) => i.key === activeKey);
  const sub = subtitle ?? activeItem?.label;
  const autoMobileSelect =
    mobileSelect === false
      ? null
      : mobileSelect ??
        (hasTabs && (items?.length ?? 0) >= 2
          ? { id: `lms-subnav-${autoId}`, label: ariaLabel ?? "เลือกเมนู" }
          : null);
  const useMobileSelect = Boolean(hasTabs && autoMobileSelect);

  return (
    <div className={cn(lmsPanelClass, className)}>
      <div className={cn(lmsPanelSectionClass, "print:hidden")}>
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {titleIcon ? (
              <span className={lmsPageTitleIconTileClass(titleTone)} aria-hidden>
                {titleIcon}
              </span>
            ) : null}
            <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{title}</h2>
            {sub ? (
              <>
                <span
                  className={cn("h-4 w-px shrink-0 bg-slate-200/90", useMobileSelect && "hidden sm:block")}
                  aria-hidden
                />
                <p
                  className={cn(
                    "min-w-0 truncate text-sm font-semibold text-[#66638c]",
                    useMobileSelect && "hidden sm:block",
                  )}
                >
                  {sub}
                </p>
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
                    className={lmsInlineSubNavShellClass}
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
                          className={lmsInlineSubNavBtnClass(active)}
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
                <nav className={lmsInlineSubNavShellClass} role="tablist" aria-label={ariaLabel ?? "เมนูย่อย"}>
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
                        className={lmsInlineSubNavBtnClass(active)}
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
            {hasTabs && action ? (
              <span
                className={cn("h-5 w-px shrink-0 bg-slate-200/90", useMobileSelect && "hidden sm:block")}
                aria-hidden
              />
            ) : null}
            {action}
          </div>
        </div>

        {useMobileSelect && autoMobileSelect ? (
          <div className="mt-3 w-full sm:hidden">
            <label htmlFor={autoMobileSelect.id} className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
              {autoMobileSelect.label}
            </label>
            <select
              id={autoMobileSelect.id}
              value={activeKey}
              onChange={(e) => onSelect?.(e.target.value)}
              className={lmsMobileSelectClass}
              aria-label={autoMobileSelect.label}
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
        <div className={cn(lmsPanelSectionClass, lmsPanelDividerClass)}>{children}</div>
      ) : null}
    </div>
  );
}

/** บล็อกย่อยในเนื้อหา — คั่นเส้นบาง (บล็อกแรกส่ง first) · ไม่ใส่หัวซ้ำถ้าหัวอยู่แถวเมนูแล้ว */
export function LmsPageBlock({
  title,
  titleIcon,
  titleTone = "slate",
  action,
  children,
  first = false,
  className,
}: {
  title?: string;
  titleIcon?: ReactNode;
  titleTone?: LmsCardTone;
  action?: ReactNode;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(!first && cn(lmsPanelDividerClass, "mt-4 pt-4"), className)}>
      {title || action ? (
        <div className="mb-3 flex flex-row flex-wrap items-start justify-between gap-2 sm:gap-3">
          {title ? (
            <h3 className={cn(lmsSectionHeadingClass, "gap-2")}>
              {titleIcon ? (
                <span className={lmsBlockTitleIconTileClass(titleTone)} aria-hidden>
                  {titleIcon}
                </span>
              ) : null}
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
