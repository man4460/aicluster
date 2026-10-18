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

function ModuleMenuIcon({
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
  onNavigate: () => void;
};

/** รายการเมนูโมดูลในป๊อปอัปโปรไฟล์ (เดสก์ท็อป) */
export function DashboardProfileModuleMenu({ config, onNavigate }: Props) {
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
                  <ModuleMenuIcon moduleId={config.moduleId} itemKey={item.key} className="h-4 w-4" />
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
