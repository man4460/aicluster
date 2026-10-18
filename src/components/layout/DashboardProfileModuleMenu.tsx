"use client";

import Link from "next/link";
import {
  IconSpCase,
  IconSpHome,
  IconSpReport,
  IconSpSettings,
  IconSpTemplate,
} from "@/systems/smart-police/components/SmartPoliceIcons";
import type { ModuleProfileSidebarConfig } from "@/lib/dashboard/module-profile-sidebar";
import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates";

export function ModuleWorkspaceNavIcon({
  moduleId,
  itemKey,
  className,
}: {
  moduleId: string;
  itemKey: string;
  className?: string;
}) {
  if (moduleId === "smart-police") {
    if (itemKey === "overview") return <IconSpHome className={className} />;
    if (itemKey === "cases") return <IconSpCase className={className} />;
    if (itemKey === "templates") return <IconSpTemplate className={className} />;
    if (itemKey === "reports") return <IconSpReport className={className} />;
    return <IconSpSettings className={className} />;
  }
  return <IconSpHome className={className} />;
}

type Props = {
  config: ModuleProfileSidebarConfig;
  onNavigate?: () => void;
  /** sidebar = สไตล์แถบซ้าย · drawer = สไตล์ drawer ม่วง · popup = ป๊อปอัปโปรไฟล์ (legacy) */
  variant?: "sidebar" | "drawer" | "popup";
};

/** รายการเมนูโมดูล — ใช้ใน sidebar ซ้าย / drawer / ป๊อปอัป */
export function DashboardProfileModuleMenu({
  config,
  onNavigate,
  variant = "sidebar",
}: Props) {
  if (variant === "sidebar") {
    /** ขนาดอ้างอิง BOTProject Shell — compact: h-8 · text-xs · py-1.5 · gap-1 */
    return (
      <ul className="flex flex-col gap-1">
        {config.items.map((item) => {
          const active = item.key === config.activeKey;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-black leading-tight transition-all",
                  active
                    ? cn(
                        appDashboardBrandGradientFillClass,
                        "text-white shadow-[0_12px_24px_-18px_rgba(91,97,255,0.55)]",
                      )
                    : "border border-[#e8e6fc]/70 bg-gradient-to-br from-white/70 via-white/50 to-[#fdf2f8]/40 text-[#2e2a58] hover:border-[#0000BF]/20 hover:bg-white/80",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                    active ? "bg-white/15 ring-white/20" : "bg-indigo-50 text-[#4d47b6] ring-indigo-100",
                  )}
                  aria-hidden
                >
                  <ModuleWorkspaceNavIcon
                    moduleId={config.moduleId}
                    itemKey={item.key}
                    className="h-4 w-4"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  if (variant === "drawer") {
    return (
      <ul className="flex flex-col gap-1">
        {config.items.map((item) => {
          const active = item.key === config.activeKey;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors",
                  active ? "bg-white/25 text-white" : "text-white/90 hover:bg-white/15",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-white/20" : "bg-white/10",
                  )}
                  aria-hidden
                >
                  <ModuleWorkspaceNavIcon
                    moduleId={config.moduleId}
                    itemKey={item.key}
                    className="h-4 w-4"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="border-b border-slate-200/80 px-1.5 pb-1.5 pt-1">
      <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8b87b8]">
        {config.moduleTitle}
      </p>
      <ul className="flex flex-col gap-0.5" role="none">
        {config.items.map((item) => {
          const active = item.key === config.activeKey;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                role="menuitem"
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-bold transition-colors",
                  active
                    ? cn(appDashboardBrandGradientFillClass, "text-white shadow-sm")
                    : "text-[#1e1b4b] hover:bg-[#5b61ff]/10 hover:text-[#5b61ff]",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-white/15" : "bg-slate-50 text-[#4d47b6]",
                  )}
                  aria-hidden
                >
                  <ModuleWorkspaceNavIcon
                    moduleId={config.moduleId}
                    itemKey={item.key}
                    className="h-4 w-4"
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
