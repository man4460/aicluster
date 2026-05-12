"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const base = "/dashboard/general-store-pos";

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

/** แถบแท็บสินค้า / ยอดขาย — ใช้ภายใน `GeneralStorePosMobileBottomChrome` (ไม่ fixed เอง) */
export function GeneralStorePosMobileDockNav() {
  const pathname = usePathname() ?? "";
  const onModule = pathname.startsWith(base);
  if (!onModule) return null;

  const isSales = pathname.replace(/\/+$/, "").endsWith(`${base}/sales`);
  const isProducts = !isSales;

  const items = [
    { href: base, label: "สินค้า", icon: IconGrid, active: isProducts },
    { href: `${base}/sales`, label: "ยอดขาย", icon: IconTrend, active: isSales },
  ] as const;

  return (
    <ul className="grid grid-cols-2 gap-1" aria-label="แท็บนำทาง POS ร้านทั่วไป">
      {items.map(({ href, label, icon: Icon, active }) => (
        <li key={href} className="min-w-0">
          <Link href={href} className={dockLinkClass(active)} aria-current={active ? "page" : undefined} title={label}>
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
