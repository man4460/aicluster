"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { dormFilterChipClass, dormSegmentShellClass } from "@/systems/dormitory/dorm-ui-tokens";

export function DormRoomManageQuickTabs({ roomId }: { roomId?: number | string | null }) {
  const pathname = usePathname() ?? "";
  const sp = useSearchParams();
  const section = (sp.get("section") ?? "").trim().toLowerCase();
  const roomPath = roomId ? `/dashboard/dormitory/rooms/${roomId}` : "/dashboard/dormitory/rooms";

  const tabs = [
    {
      href: "/dashboard/dormitory/rooms",
      label: "การจัดการ",
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
    <nav aria-label="เมนูย่อยจัดการห้อง" className={dormSegmentShellClass}>
      <ul className="grid w-full grid-cols-3 gap-1">
        {tabs.map((tab) => (
          <li key={tab.label}>
            <Link
              href={tab.href}
              className={cn(
                "inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-2 py-2 text-center text-[11px] font-semibold sm:text-sm",
                dormFilterChipClass(tab.active),
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
