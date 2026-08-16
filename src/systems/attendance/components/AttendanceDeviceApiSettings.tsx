"use client";

import { useCallback, useEffect, useState } from "react";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { AttendanceDeviceApiGuideModal } from "@/systems/attendance/components/AttendanceDeviceApiGuideModal";
import {
  attendanceInsetClass,
  attendanceLabelClass,
  attendancePanelClass,
  attendanceSectionTitleClass,
} from "@/systems/attendance/attendance-ui";

type DeviceKeyState = {
  deviceApiEnabled: boolean;
  hasDeviceApiKey: boolean;
  deviceApiKeyHint: string | null;
  endpoints: { punch: string; roster: string; fingerprint: string };
};

export function AttendanceDeviceApiSettings() {
  const [state, setState] = useState<DeviceKeyState | null>(null);
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/attendance/settings/device-key", { credentials: "include" });
    const j = (await res.json().catch(() => ({}))) as DeviceKeyState & { error?: string };
    if (!res.ok) {
      setErr(j.error ?? "โหลด Device API ไม่สำเร็จ");
      return;
    }
    setState({
      deviceApiEnabled: Boolean(j.deviceApiEnabled),
      hasDeviceApiKey: Boolean(j.hasDeviceApiKey),
      deviceApiKeyHint: j.deviceApiKeyHint ?? null,
      endpoints: j.endpoints,
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function rotateKey() {
    if (
      state?.hasDeviceApiKey &&
      !confirm("สร้างคีย์ใหม่จะทำให้คีย์เก่าใช้ไม่ได้ทันที — ดำเนินการ?")
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/attendance/settings/device-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rotate: true, enabled: true }),
      });
      const j = (await res.json().catch(() => ({}))) as DeviceKeyState & {
        error?: string;
        deviceApiKey?: string | null;
      };
      if (!res.ok) {
        setErr(j.error ?? "สร้างคีย์ไม่สำเร็จ");
        return;
      }
      setPlainKey(j.deviceApiKey ?? null);
      setMsg("สร้างคีย์แล้ว — คัดลอกไปใส่ใน ESP32 ทันที (แสดงครั้งเดียว)");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function setEnabled(enabled: boolean) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/attendance/settings/device-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return (
      <section className={attendancePanelClass}>
        <p className="text-sm text-[#66638c]">กำลังโหลด Device API…</p>
      </section>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <section className={attendancePanelClass}>
      <h2 className={attendanceSectionTitleClass}>Device API (ESP32)</h2>
      <p className="mt-1 text-xs font-medium text-[#66638c]">
        เชื่อมเครื่องสแกนใบหน้า / ลายนิ้วมือที่ประมวลผลบนอุปกรณ์ แล้วเรียก API ของระบบนี้ — ไม่บังคับใช้คลาวด์ภายนอก
      </p>

      {err ? <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p> : null}
      {msg ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{msg}</p>
      ) : null}

      <label className={cn(attendanceInsetClass, "mt-3 flex cursor-pointer items-start gap-3")}>
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-[#d8d6ec] text-[#5b61ff] focus:ring-[#5b61ff]"
          checked={state.deviceApiEnabled}
          disabled={busy || !state.hasDeviceApiKey}
          onChange={(e) => void setEnabled(e.target.checked)}
        />
        <span className="min-w-0">
          <span className={cn("block", attendanceLabelClass)}>เปิด Device API</span>
          <span className="mt-0.5 block text-xs font-medium text-[#66638c]">
            {state.hasDeviceApiKey
              ? `มีคีย์แล้ว (id …${state.deviceApiKeyHint ?? "—"})`
              : "ยังไม่มีคีย์ — กดสร้างคีย์ก่อน"}
          </span>
        </span>
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void rotateKey()}
          className="app-btn-primary min-h-[40px] rounded-xl px-4 text-sm font-semibold disabled:opacity-50"
        >
          {state.hasDeviceApiKey ? "หมุนคีย์ใหม่" : "สร้าง Device API Key"}
        </button>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className={cn(
            appTemplateOutlineButtonClass,
            "inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-sm font-semibold",
          )}
          aria-haspopup="dialog"
          aria-expanded={guideOpen}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
          วิธีใช้ / คัดลอกโค้ด
        </button>
      </div>

      {plainKey ? (
        <div className={cn(attendanceInsetClass, "mt-3 space-y-2")}>
          <p className={attendanceLabelClass}>คีย์ (แสดงครั้งเดียว)</p>
          <code className="block break-all rounded-xl bg-[#1e1b4b] px-3 py-2 text-[11px] text-white">{plainKey}</code>
          <button
            type="button"
            className="text-xs font-bold text-[#4d47b6] underline"
            onClick={() => void navigator.clipboard.writeText(plainKey)}
          >
            คัดลอก
          </button>
        </div>
      ) : null}

      <div className={cn(attendanceInsetClass, "mt-3 space-y-1 text-[11px] font-medium text-[#5f5a8a]")}>
        <p className="font-bold text-[#2e2a58]">Endpoints</p>
        <p>
          POST {origin}
          {state.endpoints.punch}
        </p>
        <p>
          GET {origin}
          {state.endpoints.roster}
        </p>
        <p>
          POST {origin}
          {state.endpoints.fingerprint}
        </p>
        <p className="pt-1 text-[#66638c]">
          กด «วิธีใช้ / คัดลอกโค้ด» เพื่อดูขั้นตอนและตัวอย่าง ESP32 / curl ที่คัดลอกได้
        </p>
      </div>

      <AttendanceDeviceApiGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        origin={origin}
        endpoints={state.endpoints}
        apiKeyHint={state.deviceApiKeyHint}
        plainKey={plainKey}
      />
    </section>
  );
}
