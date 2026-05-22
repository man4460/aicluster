"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
  appDashboardSectionSlateClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  educareFieldClass,
  educareLabelClass,
  educarePrimaryButtonClass,
} from "@/systems/educare/educare-ui-tokens";

type SettingPayload = {
  schoolName: string | null;
  schoolAddress: string | null;
  schoolPhone: string | null;
  assemblyTime: string;
  tidinessTime: string;
  milkTime: string;
  mealTime: string;
  brushingTime: string;
  notifyAbsentEnabled: boolean;
};

const initialState: SettingPayload = {
  schoolName: "",
  schoolAddress: "",
  schoolPhone: "",
  assemblyTime: "08:00",
  tidinessTime: "08:15",
  milkTime: "09:30",
  mealTime: "11:30",
  brushingTime: "12:30",
  notifyAbsentEnabled: false,
};

export function EducareSettingsClient() {
  const [form, setForm] = useState<SettingPayload>(initialState);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/educare/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("โหลดตั้งค่าไม่สำเร็จ");
      const j = await res.json();
      setForm({
        schoolName: j.setting?.schoolName ?? "",
        schoolAddress: j.setting?.schoolAddress ?? "",
        schoolPhone: j.setting?.schoolPhone ?? "",
        assemblyTime: j.setting?.assemblyTime ?? "08:00",
        tidinessTime: j.setting?.tidinessTime ?? "08:15",
        milkTime: j.setting?.milkTime ?? "09:30",
        mealTime: j.setting?.mealTime ?? "11:30",
        brushingTime: j.setting?.brushingTime ?? "12:30",
        notifyAbsentEnabled: !!j.setting?.notifyAbsentEnabled,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await fetch("/api/educare/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName ?? null,
          schoolAddress: form.schoolAddress ?? null,
          schoolPhone: form.schoolPhone ?? null,
          assemblyTime: form.assemblyTime,
          tidinessTime: form.tidinessTime,
          milkTime: form.milkTime,
          mealTime: form.mealTime,
          brushingTime: form.brushingTime,
          notifyAbsentEnabled: form.notifyAbsentEnabled,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
      }
      setSuccess("บันทึกตั้งค่าเรียบร้อย");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <AppDashboardSection tone="violet">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-200" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-slate-100" />
            ))}
          </div>
        </div>
      </AppDashboardSection>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ข้อมูลโรงเรียน"
          description="ใช้แสดงในรายงานและหน้าพิมพ์ — เปลี่ยนแก้ภายหลังได้"
        />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="ชื่อโรงเรียน">
            <input
              type="text"
              value={form.schoolName ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, schoolName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="เบอร์ติดต่อ">
            <input
              type="tel"
              value={form.schoolPhone ?? ""}
              onChange={(e) => setForm((s) => ({ ...s, schoolPhone: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="ที่อยู่">
              <textarea
                rows={2}
                value={form.schoolAddress ?? ""}
                onChange={(e) => setForm((s) => ({ ...s, schoolAddress: e.target.value }))}
                className={cn(inputCls, "resize-none")}
              />
            </Field>
          </div>
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="เวลาเช็คมาตรฐาน"
          description="เวลาที่จะแสดงเป็นเป้าหมายของแต่ละฟีเจอร์ (ใช้คุมการเตือน/รายงาน)"
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="🙋 เข้าแถว">
            <input
              type="time"
              value={form.assemblyTime}
              onChange={(e) => setForm((s) => ({ ...s, assemblyTime: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="✨ ความเรียบร้อย">
            <input
              type="time"
              value={form.tidinessTime}
              onChange={(e) => setForm((s) => ({ ...s, tidinessTime: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="🥛 ดื่มนม">
            <input
              type="time"
              value={form.milkTime}
              onChange={(e) => setForm((s) => ({ ...s, milkTime: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="🍱 ทานอาหาร">
            <input
              type="time"
              value={form.mealTime}
              onChange={(e) => setForm((s) => ({ ...s, mealTime: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="🪥 แปรงฟัน">
            <input
              type="time"
              value={form.brushingTime}
              onChange={(e) => setForm((s) => ({ ...s, brushingTime: e.target.value }))}
              className={inputCls}
            />
          </Field>
        </div>
        <div className={cn(appDashboardSectionSlateClass, "mt-4 flex items-center justify-between !py-3")}>
          <div>
            <p className="text-sm font-semibold text-[#2e2a58]">เปิดแจ้งเตือนผู้ปกครองเมื่อขาด</p>
            <p className="text-xs text-[#66638c]">
              ส่ง notification ผ่านช่องทางที่ตั้งไว้ภายหลัง — ตอนนี้เก็บค่า preference เท่านั้น
            </p>
          </div>
          <Toggle
            on={form.notifyAbsentEnabled}
            onChange={(v) => setForm((s) => ({ ...s, notifyAbsentEnabled: v }))}
            label="เปิดแจ้งเตือนขาด"
          />
        </div>
      </AppDashboardSection>

      {success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className={cn(educarePrimaryButtonClass, "min-h-[48px] px-6")}
        >
          {busy ? "กำลังบันทึก…" : "บันทึกตั้งค่า"}
        </button>
      </div>
    </form>
  );
}

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border transition",
        on
          ? "border-[#5b61ff]/40 bg-[#5b61ff]"
          : "border-slate-300 bg-slate-200",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
          on ? "left-[calc(100%-1.625rem)]" : "left-0.5",
        )}
      />
    </button>
  );
}

const inputCls = educareFieldClass;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={educareLabelClass}>
        {label}
      </span>
      {children}
    </label>
  );
}
