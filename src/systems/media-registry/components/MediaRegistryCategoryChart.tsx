"use client";

import { AppCompareBarList } from "@/components/app-templates";
import type { AppCompareBarRow } from "@/components/app-templates";

export function MediaRegistryCategoryChart({ rows }: { rows: AppCompareBarRow[] }) {
  return (
    <AppCompareBarList
      title="จำนวนชิ้นตามหมวด"
      subtitle="เทียบตามจำนวนรวมในทะเบียน (หน่วยชิ้น/ชุดตามระบุ)"
      emptyText="ยังไม่มีข้อมูลสื่อ — เพิ่มที่เมนูทะเบียนสื่อ"
      rows={rows}
      variant="brand"
      formatAmount={(n) => `${n} ชิ้น`}
    />
  );
}
