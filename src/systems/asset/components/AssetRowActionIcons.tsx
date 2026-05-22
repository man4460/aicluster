"use client";

import { cn } from "@/lib/cn";

/** คลาสมาตรฐานปุ่มไอคอนแก้ไขในแถว */
export const assetRowEditIconButtonClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/80 text-[#5b61ff] hover:bg-white active:opacity-90",
);

/** คลาสมาตรฐานปุ่มไอคอนลบ / ปิดใช้งานในแถว */
export const assetRowRemoveIconButtonClass = cn(
  "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 active:opacity-90",
);

/** ไอคอนปุ่มแก้ไขในแถวรายการ (ใช้คู่ aria-label ที่ปุ่ม) */
export function IconRowEdit({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

/** ไอคอนปุ่มลบ / ปิดการใช้งานในแถว (ใช้คู่ aria-label ที่ปุ่ม) */
export function IconRowRemove({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
