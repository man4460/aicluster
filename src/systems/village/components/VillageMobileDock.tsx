"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { villageMainKeyFromPathname, villageMainMenuItems, type VillageMainMenuKey } from "@/systems/village/village-nav";

function villageDockIcon(key: VillageMainMenuKey) {
  if (key === "overview")
    return (
      <path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    );
  if (key === "housing")
    return (
      <>
        <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z" />
        <path d="M8.5 12.5h2M13.5 12.5h2" strokeLinecap="round" />
      </>
    );
  if (key === "finance") return <path d="M4 18h16M7 14l3-3 3 2 4-5" strokeLinecap="round" strokeLinejoin="round" />;
  return (
    <>
      <path d="M12 3l8 4v6c0 4-3.2 6.8-8 8-4.8-1.2-8-4-8-8V7z" />
      <path d="M12 10v4M10 12h4" strokeLinecap="round" />
    </>
  );
}

export function VillageMobileDock() {
  const pathname = usePathname() ?? "";
  const activeMain = villageMainKeyFromPathname(pathname);

  return (
    <nav
      className={cn(
        "fixed inset-x-4 z-40 overflow-hidden rounded-[2.5rem] border border-white/50 p-2 md:hidden print:hidden",
        "bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))]",
        "bg-gradient-to-br from-white/55 via-white/40 to-indigo-50/30",
        "shadow-[0_24px_55px_-18px_rgba(30,27,75,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
        "pb-[max(0.35rem,env(safe-area-inset-bottom,0px))]",
      )}
      aria-label="เมนูล่างจัดการหมู่บ้าน"
    >
      <ul className="grid grid-cols-4 gap-1">
        {villageMainMenuItems.map((item) => {
          const active = activeMain === item.key;
          return (
            <li key={item.key} className="min-w-0">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[50px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 text-center transition-all active:scale-90",
                  active
                    ? "bg-white/80 text-[#5b61ff] shadow-md ring-1 ring-[#5b61ff]/20 backdrop-blur-sm"
                    : "text-slate-500 hover:bg-white/45 hover:text-slate-700",
                )}
                aria-current={active ? "page" : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5 shrink-0" aria-hidden>
                  {villageDockIcon(item.key)}
                </svg>
                <span className="max-w-full truncate px-0.5 text-center text-[9px] font-black leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
