"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type ClassroomRow = {
  id: number;
  name: string;
  grade: string | null;
  level: string | null;
  homeroomTeacherName: string | null;
  homeroomTeacherPhone: string | null;
  studentCount: number;
};

type FormState = {
  id?: number;
  name: string;
  grade: string;
  level: string;
  homeroomTeacherName: string;
  homeroomTeacherPhone: string;
};

const emptyForm: FormState = {
  name: "",
  grade: "",
  level: "",
  homeroomTeacherName: "",
  homeroomTeacherPhone: "",
};

export function EducareClassroomsClient() {
  const [items, setItems] = useState<ClassroomRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/educare/classrooms", { cache: "no-store" });
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const json = (await res.json()) as { classrooms: ClassroomRow[] };
      setItems(json.classrooms);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startCreate = () => {
    setForm(emptyForm);
    setOpenForm(true);
  };
  const startEdit = (row: ClassroomRow) => {
    setForm({
      id: row.id,
      name: row.name,
      grade: row.grade ?? "",
      level: row.level ?? "",
      homeroomTeacherName: row.homeroomTeacherName ?? "",
      homeroomTeacherPhone: row.homeroomTeacherPhone ?? "",
    });
    setOpenForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("กรอกชื่อห้องเรียน");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/educare/classrooms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          name: form.name.trim(),
          grade: form.grade.trim() || null,
          level: form.level.trim() || null,
          homeroomTeacherName: form.homeroomTeacherName.trim() || null,
          homeroomTeacherPhone: form.homeroomTeacherPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
      }
      setOpenForm(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: ClassroomRow) => {
    if (!window.confirm(`ลบห้อง "${row.name}" ใช่หรือไม่?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/educare/classrooms/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ห้องเรียน"
          description="เพิ่ม/แก้ไขห้องเรียน พร้อมระดับชั้นและครูประจำชั้น"
          action={
            <button
              type="button"
              onClick={startCreate}
              className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold"
            >
              + เพิ่มห้องเรียน
            </button>
          }
        />

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <SkeletonRows />
          ) : items.length === 0 ? (
            <AppEmptyState tone="violet">ยังไม่มีห้องเรียน — กดปุ่ม "+ เพิ่มห้องเรียน" เริ่มต้น</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((c) => (
                <li key={c.id} className={cn(appDashboardSectionSlateClass, "space-y-2")}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-[#2e2a58]">{c.name}</p>
                    <span className="rounded-full bg-[#ede9ff] px-2 py-0.5 text-[11px] font-bold text-[#4d47b6]">
                      {c.studentCount} คน
                    </span>
                  </div>
                  <p className="text-xs text-[#66638c]">
                    {c.grade ?? "—"} {c.level ? `· ${c.level}` : ""}
                  </p>
                  {c.homeroomTeacherName ? (
                    <p className="text-xs text-[#66638c]">
                      ครูประจำชั้น: {c.homeroomTeacherName}
                      {c.homeroomTeacherPhone ? ` · ${c.homeroomTeacherPhone}` : ""}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className={cn(appTemplateOutlineButtonClass, "px-3 py-1.5 text-xs")}
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      disabled={busy}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </AppDashboardSection>

      {openForm ? (
        <ModalForm
          form={form}
          setForm={setForm}
          onClose={() => {
            setOpenForm(false);
            setForm(emptyForm);
            setError(null);
          }}
          onSubmit={submit}
          busy={busy}
          error={error}
        />
      ) : null}
    </div>
  );
}

function ModalForm({
  form,
  setForm,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-[radial-gradient(ellipse_at_center,rgba(80,73,178,0.45),rgba(15,11,46,0.7))] px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:px-4 sm:pb-4 sm:pt-4">
      <div className="w-full max-w-md rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/85 via-white/75 to-[#eef2ff]/70 p-5 shadow-2xl ring-1 ring-white/55 backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-[#2e2a58]">{form.id ? "แก้ไขห้องเรียน" : "เพิ่มห้องเรียน"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#66638c] hover:bg-white"
          >
            ปิด
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <Field label="ชื่อห้อง *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
              className={inputCls}
              placeholder="เช่น อนุบาล 2/1"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ระดับชั้น">
              <input
                type="text"
                value={form.grade}
                onChange={(e) => setForm((s) => ({ ...s, grade: e.target.value }))}
                className={inputCls}
                placeholder="เช่น อ.2"
              />
            </Field>
            <Field label="ระดับ">
              <input
                type="text"
                value={form.level}
                onChange={(e) => setForm((s) => ({ ...s, level: e.target.value }))}
                className={inputCls}
                placeholder="เช่น อนุบาล"
              />
            </Field>
          </div>
          <Field label="ครูประจำชั้น">
            <input
              type="text"
              value={form.homeroomTeacherName}
              onChange={(e) => setForm((s) => ({ ...s, homeroomTeacherName: e.target.value }))}
              className={inputCls}
              placeholder="ชื่อ-สกุล"
            />
          </Field>
          <Field label="เบอร์ติดต่อครู">
            <input
              type="tel"
              value={form.homeroomTeacherPhone}
              onChange={(e) => setForm((s) => ({ ...s, homeroomTeacherPhone: e.target.value }))}
              className={inputCls}
              placeholder="08x-xxx-xxxx"
            />
          </Field>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] rounded-2xl border border-white/55 bg-white/70 px-5 text-sm font-semibold text-[#66638c] hover:bg-white"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={busy}
              className="min-h-[48px] rounded-2xl bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] px-5 text-sm font-bold text-white shadow-[0_18px_30px_-15px_rgba(91,97,255,0.85)] transition active:scale-[0.99] disabled:opacity-50"
            >
              {busy ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2.5 text-sm text-[#2e2a58] placeholder:text-[#a3a0c0] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4d47b6]/80">
        {label}
      </span>
      {children}
    </label>
  );
}

function SkeletonRows() {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className={cn(appDashboardSectionSlateClass, "animate-pulse space-y-2")}>
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-3/4 rounded bg-slate-200" />
        </li>
      ))}
    </ul>
  );
}
