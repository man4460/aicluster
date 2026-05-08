"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export function DormRoomManageQuickTabs({ roomId }: { roomId?: number | string | null }) {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();
  const section = (sp.get("section") ?? "").trim().toLowerCase();
  const roomPath = roomId ? `/dashboard/dormitory/rooms/${roomId}` : "/dashboard/dormitory/rooms";

  const tabs = [
    {
      href: "/dashboard/dormitory/rooms",
      label: "เพิ่มห้อง",
      active: pathname === "/dashboard/dormitory/rooms",
    },
    {
      href: `${roomPath}?section=meter`,
      label: "บันทึกมิตเตอร์",
      active: pathname.startsWith("/dashboard/dormitory/rooms/") && section === "meter",
    },
    {
      href: `${roomPath}?section=payment`,
      label: "ชำระเงิน",
      active: pathname.startsWith("/dashboard/dormitory/rooms/") && section === "payment",
    },
  ] as const;

  return (
    <nav
      aria-label="เมนูย่อยจัดการห้อง"
      className="rounded-2xl border border-white/65 bg-gradient-to-r from-white/80 via-indigo-50/35 to-violet-50/45 p-1.5 shadow-sm ring-1 ring-white/55"
    >
      <ul className="grid grid-cols-3 gap-1.5">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              className={cn(
                "inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-semibold transition sm:text-sm",
                tab.active
                  ? "bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_8px_18px_-12px_rgba(77,71,182,0.8)]"
                  : "bg-white/85 text-[#66638c] ring-1 ring-slate-200/80 hover:bg-white",
              )}
              aria-current={tab.active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

