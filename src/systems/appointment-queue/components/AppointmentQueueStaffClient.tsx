"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { aqFieldClass, aqListRowCardClass } from "@/systems/appointment-queue/appointment-queue-ui-tokens";

type Staff = { id: number; name: string; isActive: boolean };

export function AppointmentQueueStaffClient({ initial }: { initial: Staff[] }) {
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/appointment-queue/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const json = (await res.json()) as { staff?: { id: number; name: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "เพิ่มไม่สำเร็จ");
      setRows((r) => [...r, { id: json.staff!.id, name: json.staff!.name, isActive: true }]);
      setName("");
    } catch (e) {
      alert(e instanceof Error ? e.message : "เพิ่มไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppDashboardSection className={appDashboardSectionVioletClass}>
      <AppSectionHeader
        title="ช่าง / ผู้ให้บริการ"
        description="ไม่บังคับ — ลูกค้าเลือกได้ตอนจอง"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            disabled={busy}
            onClick={() => void add()}
            className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl sm:min-w-0 sm:px-4"
            aria-label="เพิ่มช่าง"
          >
            <span className="text-lg sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มช่าง</span>
          </button>
        }
      />
      <input
        className={`${aqFieldClass} mb-4`}
        placeholder="ชื่อช่าง"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id} className={aqListRowCardClass}>
            <p className="text-left font-bold text-[#1e1b4b]">{s.name}</p>
          </li>
        ))}
      </ul>
    </AppDashboardSection>
  );
}
