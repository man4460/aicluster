"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appMobileDockGridClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  IconModuleShopSettings,
  MODULE_SHOP_SETTINGS_SHORT_LABEL,
} from "@/systems/module-shop/module-shop-settings-nav";

const base = "/dashboard/drink-pos";
const settingsHref = `${base}/settings`;

function IconGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconTrend({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
      <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const dockLinkClass = (active: boolean) =>
  cn(
    "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
    active
      ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
      : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
  );

/** แถบแท็บสินค้า / ยอดขาย — ใช้ภายใน `DrinkPosMobileBottomChrome` (ไม่ fixed เอง) */
export function DrinkPosMobileDockNav() {
  const pathname = usePathname() ?? "";
  const onModule = pathname.startsWith(base);
  if (!onModule) return null;

  const pathNorm = pathname.replace(/\/+$/, "");
  const isFinance = pathNorm.endsWith(`${base}/finance`) || pathNorm.endsWith(`${base}/sales`);
  const isMembers = pathNorm.endsWith(`${base}/members`);
  const isSettings = pathNorm.endsWith(settingsHref);
  const isProducts = !isFinance && !isMembers && !isSettings;

  const items = [
    { href: base, label: "สินค้า", icon: IconGrid, active: isProducts },
    { href: `${base}/members`, label: "สมาชิก", icon: IconMembers, active: isMembers },
    { href: `${base}/finance`, label: "การเงิน", icon: IconTrend, active: isFinance },
  ] as const;

  function IconMembers({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className={className} aria-hidden>
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <ul className={cn(appMobileDockGridClass, "grid-cols-4")} aria-label="แท็บนำทาง POS ร้านเครื่องดื่ม">
      {items.map(({ href, label, icon: Icon, active }) => (
        <li key={href} className="min-w-0">
          <Link href={href} className={dockLinkClass(active)} aria-current={active ? "page" : undefined} title={label}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{label}</span>
          </Link>
        </li>
      ))}
      <li className="min-w-0">
        <Link
          href={settingsHref}
          className={dockLinkClass(isSettings)}
          aria-current={isSettings ? "page" : undefined}
          aria-label="ตั้งค่าร้าน"
          title="ตั้งค่าร้าน"
        >
          <IconModuleShopSettings className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">
            {MODULE_SHOP_SETTINGS_SHORT_LABEL}
          </span>
        </Link>
      </li>
    </ul>
  );
}
