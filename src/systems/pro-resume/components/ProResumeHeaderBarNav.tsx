"use client";

import {
  appDashboardModuleHeaderExpandButtonClass,
  appDashboardModuleHeaderNavLinkClass,
  appDashboardModuleHeaderNavRowClass,
  appDashboardModuleHeaderNavShellClass,
  appDashboardModuleHeaderTitleClass,
} from "@/components/app-templates";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import {
  PRO_RESUME_MODULE_DISPLAY_NAME,
  PRO_RESUME_NAV_ITEMS,
  isProResumeModuleNavItemActive,
  proResumeModuleNavIcon,
} from "@/systems/pro-resume/pro-resume-module-nav";

function ProResumeHeaderExpandGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h10" strokeLinecap="round" />
    </svg>
  );
}

export function ProResumeHeaderExpandButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className={appDashboardModuleHeaderExpandButtonClass}
      aria-label="แสดงส่วนหัวโมดูล"
      title="แสดงส่วนหัวโมดูล"
    >
      <ProResumeHeaderExpandGlyph />
    </button>
  );
}

function ProResumeHeaderBarNavInner({ onExpand }: { onExpand: () => void }) {
  const pathname = (usePathname() ?? "").replace(/\/+$/, "");

  return (
    <div className={appDashboardModuleHeaderNavRowClass}>
      <nav
        className={appDashboardModuleHeaderNavShellClass}
        aria-label="เมนู Pro Resume"
      >
        {PRO_RESUME_NAV_ITEMS.map((item) => {
          const active = isProResumeModuleNavItemActive(pathname, item.key);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={appDashboardModuleHeaderNavLinkClass(active)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              title={item.label}
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-3.5 w-3.5">
                  {proResumeModuleNavIcon(item.key)}
                </svg>
              </span>
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <span className={appDashboardModuleHeaderTitleClass}>
        {PRO_RESUME_MODULE_DISPLAY_NAME}
      </span>
      <ProResumeHeaderExpandButton onExpand={onExpand} />
    </div>
  );
}

export function ProResumeHeaderBarNav({ onExpand }: { onExpand: () => void }) {
  return (
    <Suspense fallback={null}>
      <ProResumeHeaderBarNavInner onExpand={onExpand} />
    </Suspense>
  );
}
