"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppUsageGuideModal, appModuleShellMainScrollClass } from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { cn } from "@/lib/cn";
import { PromptLibraryMobileBottomProvider } from "@/systems/prompt-library/components/PromptLibraryMobileBottomChrome";
import {
  PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT,
  PROMPT_LIBRARY_MODULE_DISPLAY_NAME,
  PROMPT_LIBRARY_NAV_ITEMS,
  isPromptLibraryNavItemActive,
  readPromptLibraryHeaderCollapsed,
  writePromptLibraryHeaderCollapsed,
  type PromptLibraryNavKey,
} from "@/systems/prompt-library/prompt-library-module-nav";
import {
  promptLibraryAccentBarClass,
  promptLibraryGlassShellClass,
  promptLibraryMainPaddingBottomClass,
  promptLibraryNavActiveClass,
  promptLibraryNavIdleClass,
} from "@/systems/prompt-library/lib/ui-tokens";

function IconSpark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <path d="M9.5 2 8 8l-6 1.5L8 11l1.5 6L11 11l6-1.5L11 8 9.5 2Z" strokeLinejoin="round" />
      <path d="M18 14.5 17 17l-2.5 1 2.5 1 1 2.5 1-2.5 2.5-1-2.5-1-1-2.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinejoin="round" />
    </svg>
  );
}

function navIcon(key: PromptLibraryNavKey, className?: string) {
  switch (key) {
    case "library":
      return <IconSpark className={className} />;
    case "categories":
      return <IconFolder className={className} />;
  }
}

function TabLink({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all",
        active ? promptLibraryNavActiveClass : promptLibraryNavIdleClass,
      )}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn("flex h-4 w-4 shrink-0 items-center justify-center", active ? "text-white" : "text-slate-400")}
        aria-hidden
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}

function HeaderCollapseGlyph({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
      {collapsed ? (
        <path d="M6 15l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function PromptShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [usageGuideOpen, setUsageGuideOpen] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(readPromptLibraryHeaderCollapsed());

  useEffect(() => {
    const sync = () => setHeaderCollapsed(readPromptLibraryHeaderCollapsed());
    sync();
    window.addEventListener(PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROMPT_LIBRARY_HEADER_COLLAPSE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleHeaderCollapse = useCallback(() => {
    writePromptLibraryHeaderCollapsed(!headerCollapsed);
  }, [headerCollapsed]);

  return (
    <PromptLibraryMobileBottomProvider>
      <div className="flex min-h-0 max-w-full flex-1 flex-col gap-4 sm:gap-6">
        <header
          className={cn(
            promptLibraryGlassShellClass,
            "flex shrink-0 flex-col px-4 py-4 sm:px-8 sm:py-6 print:hidden",
            headerCollapsed && "hidden",
          )}
        >
          <div className={promptLibraryAccentBarClass} aria-hidden />
          <div className="mt-5 flex flex-wrap items-start justify-between gap-3 gap-y-2">
            <div className="flex min-w-0 items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg shadow-fuchsia-500/20",
                  appDashboardBrandGradientFillClass,
                )}
              >
                <IconSpark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#4d47b6]">โมดูล</p>
                <h1 className="mt-1 truncate text-xl font-black tracking-tight text-[#1e1b4b] sm:text-2xl">
                  {PROMPT_LIBRARY_MODULE_DISPLAY_NAME}
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setUsageGuideOpen(true)}
                className="flex h-10 min-h-[44px] w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-sm font-black text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95 sm:w-auto sm:gap-2 sm:px-4"
                aria-label="คู่มือการใช้งาน"
                aria-haspopup="dialog"
                aria-expanded={usageGuideOpen}
                suppressHydrationWarning
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M9.5 9a2.5 2.5 0 115 0c0 1.6-2.5 2.1-2.5 4" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
                <span className="hidden sm:inline">คู่มือการใช้งาน</span>
              </button>
              <button
                type="button"
                onClick={toggleHeaderCollapse}
                className="inline-flex h-10 min-h-[44px] w-10 items-center justify-center rounded-2xl border border-[#0000BF]/25 bg-white/80 text-[#4d47b6] shadow-sm backdrop-blur-md transition-all hover:bg-white active:scale-95"
                aria-pressed={headerCollapsed}
                aria-label="ซ่อนส่วนหัวโมดูล"
                title="ซ่อนส่วนหัวโมดูล"
                suppressHydrationWarning
              >
                <HeaderCollapseGlyph collapsed={headerCollapsed} />
              </button>
            </div>
          </div>

          <nav
            className="mt-5 hidden border-t border-[#e8e6fc]/70 pt-5 lg:block print:hidden"
            aria-label="เมนูโมดูลคลังคำสั่ง AI"
          >
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2">
              {PROMPT_LIBRARY_NAV_ITEMS.map((item) => (
                <li key={item.key} className="min-w-0">
                  <TabLink
                    href={item.href}
                    label={item.label}
                    active={isPromptLibraryNavItemActive(pathname, item.key)}
                    icon={navIcon(item.key, "h-4 w-4")}
                  />
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <AppUsageGuideModal
          open={usageGuideOpen}
          onClose={() => setUsageGuideOpen(false)}
          title="คู่มือคลังคำสั่ง AI"
          subtitle="คลังคำสั่ง และหมวดหมู่"
          sections={[
            {
              title: "เมนูหลัก",
              content: (
                <ul className="list-disc space-y-1.5 pl-5 marker:text-[#4d47b6]">
                  <li>แท็บเมนูอยู่ในส่วนหัว — กดซ่อนเพื่อย้ายไปแถบบน (คอมพิวเตอร์) หรือเหลือเมนูล่าง (มือถือ)</li>
                  <li>มือถือใช้ dock ด้านล่างสลับหน้าตามแพทเทิร์นโรงแรม / POS</li>
                </ul>
              ),
            },
            {
              title: "คลังคำสั่ง",
              content: <p>การ์ดแยกหมวด — ค้นหา · คัดลอกไปใช้กับ AI · ส่งออก/นำเข้า JSON</p>,
            },
            {
              title: "หมวดหมู่",
              content: <p>จัดการหมวดหมู่การ์ดคำสั่ง — เพิ่มแก้ไขลบหมวดหมู่</p>,
            },
            {
              title: "เคล็ดลับการใช้งาน",
              content: <p>แตะการ์ดเพื่อดูเนื้อหา · กดคัดลอกเพื่อวางในแชท AI ได้ทันที</p>,
            },
          ]}
        />

        <div className={cn(promptLibraryMainPaddingBottomClass, appModuleShellMainScrollClass)}>{children}</div>
      </div>
    </PromptLibraryMobileBottomProvider>
  );
}
