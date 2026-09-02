"use client";

import { AppEmptyState } from "@/components/app-templates";
import type { LaundryRevenueCategory, LaundryRevenueEntry, LaundryRepository } from "@/systems/laundry/laundry-service";

/** รายรับเพิ่ม (บันทึกเอง) — UI เต็มจะต่อ API ในรอบถัดไป */
export function LaundryRevenuePanel({
  categories,
  entries,
}: {
  repo: LaundryRepository;
  baseUrl: string;
  categories: LaundryRevenueCategory[];
  entries: LaundryRevenueEntry[];
  onRefresh: () => Promise<void>;
}) {
  if (entries.length === 0) {
    return (
      <AppEmptyState tone="glass">
        {categories.length === 0 ?
          "ยังไม่มีหมวดรายรับเพิ่ม — ฟีเจอร์บันทึกรายรับจะเปิดใช้ในอัปเดตถัดไป"
        : "ยังไม่มีรายการรายรับเพิ่มในช่วงที่เลือก"}
      </AppEmptyState>
    );
  }

  return (
    <ul className="space-y-2" aria-label="รายรับเพิ่ม">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50/40 px-3 py-2 text-sm"
        >
          <span className="min-w-0 truncate font-medium text-[#1e1b4b]">{e.item_label || e.category_name}</span>
          <span className="shrink-0 tabular-nums font-bold text-emerald-700">
            ฿{e.amount.toLocaleString("th-TH")}
          </span>
        </li>
      ))}
    </ul>
  );
}
