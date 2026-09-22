"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  smartGuardTourCardIconTileClass,
  type SmartGuardTourCardTone,
} from "@/systems/smart-guard-tour/lib/card-tones";
import {
  smartGuardTourInlineSubNavBtnClass,
  smartGuardTourInlineSubNavShellClass,
  smartGuardTourListHeaderRowClass,
  smartGuardTourMobileSelectClass,
  smartGuardTourPanelClass,
  smartGuardTourPanelDividerClass,
  smartGuardTourPanelSectionClass,
  smartGuardTourPrimaryTabPillClass,
  smartGuardTourPrimaryTabShellClass,
  smartGuardTourSectionHeadingClass,
  smartGuardTourToolbarRowClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

export type SmartGuardTourPageSubNavItem = {
  key: string;
  label: string;
  /** ป้ายสั้นบนมือถือ (เมื่อไม่ใช้ dropdown) */
  shortLabel?: string;
  icon?: ReactNode;
};

/**
 * หัวหน้า + เมนูย่อย — ชื่อซ้าย · ปุ่มแอ็กชันขวา · แท็บแถวถัดไปเต็มความกว้าง
 * มือถือ: select สลับแท็บ · ปุ่มเพิ่ม/กรองยังอยู่แถวหัว
 */
export function SmartGuardTourPageSubNav({
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
  contentClassName,
}: {
  title: string;
  titleIcon?: ReactNode;
  titleTone?: SmartGuardTourCardTone;
  subtitle?: string;
  items?: SmartGuardTourPageSubNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  ariaLabel?: string;
  action?: ReactNode;
  /** override ป้าย/id · ส่ง false เพื่อบังคับใช้ pill บนมือถือ (ไม่ใช้ select) */
  mobileSelect?: {
    id: string;
    label: string;
  } | false;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
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
          ? { id: `smart-guard-tour-subnav-${autoId}`, label: ariaLabel ?? "เลือกเมนู" }
          : null);
  const useMobileSelect = Boolean(hasTabs && autoMobileSelect);

  return (
    <div className={cn(smartGuardTourPanelClass, className)}>
      <div className={cn(smartGuardTourPanelSectionClass, "shrink-0 space-y-3 print:hidden")}>
        {/* แถว 1: หัวข้อ + ปุ่มกรอง/เพิ่ม — ปุ่มไม่ถูกบีบ */}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
            {titleIcon ? (
              <span className={smartGuardTourCardIconTileClass(titleTone)} aria-hidden>
                {titleIcon}
              </span>
            ) : null}
            <h2 className="min-w-0 shrink truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{title}</h2>
            {sub ? (
              <>
                <span className="hidden h-4 w-px shrink-0 bg-slate-200/90 sm:block" aria-hidden />
                <p className="hidden min-w-0 truncate text-sm font-semibold text-[#66638c] sm:block">{sub}</p>
              </>
            ) : null}
          </div>

          {action ? (
            <div
              className={cn(smartGuardTourToolbarRowClass, "shrink-0")}
              role="group"
              aria-label="เครื่องมือหน้า"
            >
              {action}
            </div>
          ) : null}
        </div>

        {/* แถว 2: เมนูหลักเต็มความกว้าง */}
        {hasTabs ? (
          useMobileSelect ? (
            <>
              <div className="hidden w-full sm:block">
                <nav
                  className={cn(smartGuardTourInlineSubNavShellClass, "flex-wrap")}
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
                        className={smartGuardTourInlineSubNavBtnClass(active)}
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
              <div className="w-full sm:hidden">
                <label htmlFor={autoMobileSelect!.id} className="mb-1.5 block text-[11px] font-bold text-[#4d47b6]">
                  {autoMobileSelect!.label}
                </label>
                <select
                  id={autoMobileSelect!.id}
                  value={activeKey}
                  onChange={(e) => onSelect?.(e.target.value)}
                  className={smartGuardTourMobileSelectClass}
                  aria-label={autoMobileSelect!.label}
                >
                  {items!.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <nav
              className={cn(smartGuardTourPrimaryTabShellClass, "w-full")}
              role="tablist"
              aria-label={ariaLabel ?? "เมนูย่อย"}
            >
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
                    className={cn(
                      smartGuardTourPrimaryTabPillClass(active),
                      "inline-flex items-center justify-center gap-1.5",
                    )}
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
      </div>

      {children != null ? (
        <div
          className={cn(
            smartGuardTourPanelSectionClass,
            smartGuardTourPanelDividerClass,
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** บล็อกย่อยในเนื้อหา — ใช้เมื่อแยกหัวข้อรอง (ยกเว้น first) */
export function SmartGuardTourPageBlock({
  title,
  titleIcon,
  action,
  children,
  first = false,
  className,
}: {
  title?: string;
  titleIcon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(!first && cn(smartGuardTourPanelDividerClass, "mt-4 pt-4"), className)}>
      {title || action ? (
        <div className={cn(smartGuardTourListHeaderRowClass, "mb-3")}>
          {title ? (
            <h3 className={cn(smartGuardTourSectionHeadingClass, "min-w-0 truncate")}>
              {titleIcon ? (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#4d47b6] ring-1 ring-slate-200/80"
                  aria-hidden
                >
                  {titleIcon}
                </span>
              ) : null}
              {title}
            </h3>
          ) : (
            <span />
          )}
          {action ? <div className={cn(smartGuardTourToolbarRowClass, "shrink-0")}>{action}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
