"use client";

import { useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type Settings = {
  orgName: string | null;
  orgAddress: string | null;
  orgPhone: string | null;
  defaultYear: string | null;
  ordersPrefix: string;
  memosPrefix: string;
  incomingPrefix: string;
  outgoingPrefix: string;
  circularsPrefix: string;
  trackPrefix: string;
  publicShareEnabled: boolean;
};

const inputClass =
  "w-full rounded-xl border border-[#dcd8f0] bg-white/85 px-3 py-2 text-sm text-[#2e2a58] outline-none focus:border-[#4d47b6] focus:ring-2 focus:ring-[#4d47b6]/20";
const labelClass = "text-[11px] font-bold uppercase tracking-wider text-[#66638c]";

export function DocSettingsClient({ initial }: { initial: Settings }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/doc-transmission/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          orgName: form.orgName?.trim() || null,
          orgAddress: form.orgAddress?.trim() || null,
          orgPhone: form.orgPhone?.trim() || null,
          defaultYear: form.defaultYear?.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
      }
      setMsg("บันทึกเรียบร้อย");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="ตั้งค่าสารบรรณดิจิทัล"
        description="ชื่อองค์กร · Prefix เลขที่หนังสือ · เปิด/ปิด Share Link ภายนอก"
      />

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>ชื่อองค์กร / โรงเรียน</label>
            <input
              type="text"
              maxLength={200}
              value={form.orgName ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>โทรศัพท์</label>
            <input
              type="text"
              maxLength={40}
              value={form.orgPhone ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, orgPhone: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>ปีการศึกษา/ปีงบฯ ค่าเริ่มต้น</label>
            <input
              type="text"
              maxLength={4}
              pattern="\d{4}"
              value={form.defaultYear ?? ""}
              onChange={(e) =>
                setForm((p) => ({ ...p, defaultYear: e.target.value.replace(/\D/g, "").slice(0, 4) }))
              }
              className={inputClass}
              placeholder="2567"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label className={labelClass}>ที่อยู่</label>
            <textarea
              rows={2}
              maxLength={2000}
              value={form.orgAddress ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, orgAddress: e.target.value }))}
              className={cn(inputClass, "resize-none")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
            Prefix เลขที่หนังสือ (สูงสุด 10 ตัวอักษร)
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <PrefixField
              label="คำสั่ง"
              value={form.ordersPrefix}
              onChange={(v) => setForm((p) => ({ ...p, ordersPrefix: v }))}
            />
            <PrefixField
              label="บันทึกข้อความ"
              value={form.memosPrefix}
              onChange={(v) => setForm((p) => ({ ...p, memosPrefix: v }))}
            />
            <PrefixField
              label="หนังสือรับ"
              value={form.incomingPrefix}
              onChange={(v) => setForm((p) => ({ ...p, incomingPrefix: v }))}
            />
            <PrefixField
              label="หนังสือส่ง"
              value={form.outgoingPrefix}
              onChange={(v) => setForm((p) => ({ ...p, outgoingPrefix: v }))}
            />
            <PrefixField
              label="หนังสือเวียน"
              value={form.circularsPrefix}
              onChange={(v) => setForm((p) => ({ ...p, circularsPrefix: v }))}
            />
            <PrefixField
              label="Tracking Code"
              value={form.trackPrefix}
              onChange={(v) => setForm((p) => ({ ...p, trackPrefix: v }))}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 rounded-xl border border-white/60 bg-white/65 p-3 text-sm">
          <input
            type="checkbox"
            checked={form.publicShareEnabled}
            onChange={(e) => setForm((p) => ({ ...p, publicShareEnabled: e.target.checked }))}
            className="mt-0.5 h-4 w-4"
          />
          <div>
            <p className="font-semibold text-[#2e2a58]">เปิดให้สร้างลิงก์สาธารณะ (Public Share Link)</p>
            <p className="text-xs text-[#66638c]">
              เมื่อปิด — ผู้ใช้จะกดปุ่มสร้างลิงก์ภายนอกในหน้ารายเอกสารไม่ได้
              และลิงก์ที่เคยสร้างจะถูกบล็อกการเข้าถึง
            </p>
          </div>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="app-btn-primary inline-flex min-h-[40px] items-center gap-1 rounded-xl px-5 text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
          </button>
          {msg ? <span className="text-sm text-[#4d47b6]">{msg}</span> : null}
        </div>
      </form>
    </AppDashboardSection>
  );
}

function PrefixField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold tracking-wider text-[#66638c]">{label}</label>
      <input
        type="text"
        maxLength={10}
        required
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 10))}
        className="w-full rounded-xl border border-[#dcd8f0] bg-white/85 px-3 py-2 font-mono text-sm text-[#2e2a58] outline-none focus:border-[#4d47b6] focus:ring-2 focus:ring-[#4d47b6]/20"
      />
    </div>
  );
}
