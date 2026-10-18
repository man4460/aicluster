"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppMobileDockShell,
  appMobileDockGridClass,
  appMobileDockLinkClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  IconSpCase,
  IconSpHome,
  IconSpReport,
  IconSpSettings,
  IconSpTemplate,
} from "@/systems/smart-police/components/SmartPoliceIcons";
import {
  smartPoliceMainKeyFromPathname,
  smartPoliceMainMenuItems,
  type SmartPoliceMainKey,
} from "@/systems/smart-police/smart-police-nav";

function dockIcon(key: SmartPoliceMainKey) {
  if (key === "overview") return IconSpHome;
  if (key === "cases") return IconSpCase;
  if (key === "templates") return IconSpTemplate;
  if (key === "reports") return IconSpReport;
  return IconSpSettings;
}

export function SmartPoliceMobileDock() {
  const pathname = usePathname() ?? "";
  const activeMain = smartPoliceMainKeyFromPathname(pathname);

  return (
    <AppMobileDockShell ariaLabel="เมนูล่าง Smart Police">
      <ul className={cn(appMobileDockGridClass, "grid-cols-5")}>
        {smartPoliceMainMenuItems.map((item) => {
          const active = activeMain === item.key;
          const Icon = dockIcon(item.key);
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={appMobileDockLinkClass(active)}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </AppMobileDockShell>
  );
}
