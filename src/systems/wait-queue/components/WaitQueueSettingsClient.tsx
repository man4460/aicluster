"use client";

import { useState } from "react";
import { AppDashboardSection, AppSectionHeader } from "@/components/app-templates";

export function WaitQueueSettingsClient(initial: { name: string; callMessage: string }) {
  const [name, setName] = useState(initial.name);
  const [callMessage, setCallMessage] = useState(initial.callMessage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/wait-queue/site", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, callMessage }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(typeof json?.error === "string" ? json.error : "บันทึกไม่สำเร็จ");
        return;
      }
      if (json?.site?.name) setName(json.site.name);
      if (json?.site?.callMessage) setCallMessage(json.site.callMessage);
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppDashboardSection className="flex flex-col gap-4 p-5 sm:p-6">
      <AppSectionHeader
        tone="slate"
        title="ตั้งค่าจุดบริการ"
        description="ชื่อแสดงในแดชบอร์ดและข้อความที่ใช้คู่กับเลขคิวเมื่อเรียกลูกค้า"
      />

      {error ? (
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">{error}</div>
      ) : null}
      {saved ? (
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
          บันทึกแล้ว
        </div>
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
        suppressHydrationWarning
      >
        <label className="flex flex-col gap-1.5 text-sm font-bold text-[#1e1b4b]">
          ชื่อจุดบริการ / ร้าน
          <input
            type="text"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-semibold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
            suppressHydrationWarning
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold text-[#1e1b4b]">
          ข้อความเรียกคิว
          <textarea
            required
            maxLength={200}
            rows={3}
            value={callMessage}
            onChange={(e) => setCallMessage(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 font-semibold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
            suppressHydrationWarning
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="app-btn-primary min-h-[48px] w-full rounded-2xl px-5 text-sm font-black disabled:opacity-40 sm:w-auto"
          suppressHydrationWarning
        >
          บันทึก
        </button>
      </form>
    </AppDashboardSection>
  );
}
