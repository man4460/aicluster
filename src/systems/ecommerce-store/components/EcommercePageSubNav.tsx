"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  ecommerceStoreInlineSubNavBtnClass,
  ecommerceStoreInlineSubNavShellClass,
  ecommerceStoreMobileSelectClass,
  ecommerceStoreNavDividerClass,
  ecommerceStorePanelClass,
  ecommerceStorePanelDividerClass,
  ecommerceStorePanelSectionClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";

export type EcommercePageSubNavItem = {
  key: string;
  label: string;
  shortLabel?: string;
  icon?: ReactNode;
};

/**
 * การ์ดเดียว: หัวข้อ + แท็บย่อย + เนื้อหา (แม่แบบชมรม/ซักผ้า)
 */
export function EcommercePageSubNav({
  title,
  titleIcon,
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
  subtitle?: string;
  items?: EcommercePageSubNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  ariaLabel?: string;
  action?: ReactNode;
  mobileSelect?: { id: string; label: string };
  children?: ReactNode;
  className?: string;
}) {
  const hasTabs = Boolean(items?.length && onSelect && activeKey != null);
  const activeItem = items?.find((i) => i.key === activeKey);
  const sub = subtitle ?? activeItem?.label;
  const useMobileSelect = Boolean(hasTabs && mobileSelect);

  return (
    <div className={cn(ecommerceStorePanelClass, className)}>
      <div className={cn(ecommerceStorePanelSectionClass, "print:hidden")}>
        <div className="flex flex-nowrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {titleIcon ? (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100/90 text-sky-700 ring-1 ring-sky-200/80"
                aria-hidden
              >
                {titleIcon}
              </span>
            ) : null}
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
                    className={ecommerceStoreInlineSubNavShellClass}
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
                          className={ecommerceStoreInlineSubNavBtnClass(active)}
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
                <nav
                  className={ecommerceStoreInlineSubNavShellClass}
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
                        className={ecommerceStoreInlineSubNavBtnClass(active)}
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
              <span className={cn(ecommerceStoreNavDividerClass, useMobileSelect && "hidden sm:block")} aria-hidden />
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
              className={ecommerceStoreMobileSelectClass}
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
        <div className={cn(ecommerceStorePanelSectionClass, ecommerceStorePanelDividerClass)}>{children}</div>
      ) : null}
    </div>
  );
}
