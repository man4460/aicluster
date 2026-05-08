"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionSlateClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";

type ClassroomOption = { id: number; name: string };
type StudentRow = {
  id: number;
  classroomId: number;
  classroomName: string;
  studentNo: string;
  fullName: string;
  nickname: string | null;
  gender: "M" | "F" | null;
  birthdate: string | null;
  photoUrl: string | null;
  parentName: string | null;
  parentPhone: string | null;
  address: string | null;
};

type FormState = {
  id?: number;
  classroomId: number | "";
  studentNo: string;
  fullName: string;
  nickname: string;
  gender: "M" | "F" | "";
  birthdate: string;
  photoUrl: string;
  parentName: string;
  parentPhone: string;
};

const emptyForm: FormState = {
  classroomId: "",
  studentNo: "",
  fullName: "",
  nickname: "",
  gender: "",
  birthdate: "",
  photoUrl: "",
  parentName: "",
  parentPhone: "",
};

export function EducareStudentsClient() {
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [items, setItems] = useState<StudentRow[]>([]);
  const [filter, setFilter] = useState<{ classroomId: number | ""; q: string }>({ classroomId: "", q: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const loadClassrooms = useCallback(async () => {
    const res = await fetch("/api/educare/classrooms", { cache: "no-store" });
    if (res.ok) {
      const j = await res.json();
      setClassrooms(j.classrooms.map((c: ClassroomOption) => ({ id: c.id, name: c.name })));
    }
  }, []);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.classroomId !== "") params.set("classroomId", String(filter.classroomId));
      if (filter.q.trim()) params.set("q", filter.q.trim());
      const res = await fetch(`/api/educare/students?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const j = (await res.json()) as { students: StudentRow[] };
      setItems(j.students);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);
  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const startCreate = () => {
    setForm({ ...emptyForm, classroomId: filter.classroomId || classrooms[0]?.id || "" });
    setOpenForm(true);
  };

  const startEdit = (row: StudentRow) => {
    setForm({
      id: row.id,
      classroomId: row.classroomId,
      studentNo: row.studentNo,
      fullName: row.fullName,
      nickname: row.nickname ?? "",
      gender: row.gender ?? "",
      birthdate: row.birthdate ?? "",
      photoUrl: row.photoUrl ?? "",
      parentName: row.parentName ?? "",
      parentPhone: row.parentPhone ?? "",
    });
    setOpenForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.classroomId === "" || !form.studentNo.trim() || !form.fullName.trim()) {
      setError("กรอกห้องเรียน, เลขที่, และชื่อ-สกุล");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/educare/students", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          classroomId: Number(form.classroomId),
          studentNo: form.studentNo.trim(),
          fullName: form.fullName.trim(),
          nickname: form.nickname.trim() || null,
          gender: form.gender || null,
          birthdate: form.birthdate || null,
          photoUrl: form.photoUrl.trim() || null,
          parentName: form.parentName.trim() || null,
          parentPhone: form.parentPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
      }
      setOpenForm(false);
      setForm(emptyForm);
      await loadStudents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: StudentRow) => {
    if (!window.confirm(`ลบนักเรียน "${row.fullName}" ใช่หรือไม่?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/educare/students/${row.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบไม่สำเร็จ");
      await loadStudents();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const groupedByRoom = useMemo(() => {
    const map = new Map<string, StudentRow[]>();
    for (const s of items) {
      const arr = map.get(s.classroomName) ?? [];
      arr.push(s);
      map.set(s.classroomName, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="นักเรียน"
          description="เพิ่ม/แก้ไขข้อมูลนักเรียน รวมถึงรูป ผู้ปกครอง และห้องเรียน"
          action={
            <button
              type="button"
              onClick={startCreate}
              disabled={classrooms.length === 0}
              className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold disabled:opacity-50"
            >
              + เพิ่มนักเรียน
            </button>
          }
        />

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <select
            value={filter.classroomId}
            onChange={(e) =>
              setFilter((f) => ({ ...f, classroomId: e.target.value === "" ? "" : Number(e.target.value) }))
            }
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-[#2e2a58]"
            aria-label="กรองตามห้องเรียน"
          >
            <option value="">ทุกห้อง</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="search"
            placeholder="ค้นหาชื่อ/เลขที่"
            value={filter.q}
            onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm text-[#2e2a58] placeholder:text-[#a3a0c0]"
          />
          <p className="self-center text-xs text-[#66638c] sm:text-right">
            ทั้งหมด {items.length.toLocaleString("th-TH")} คน
          </p>
        </div>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {classrooms.length === 0 ? (
          <AppEmptyState tone="violet" className="mt-4">
            ยังไม่มีห้องเรียน — เพิ่มห้องเรียนก่อนแล้วค่อยเพิ่มนักเรียน
          </AppEmptyState>
        ) : null}

        <div className="mt-4 space-y-4">
          {loading ? (
            <SkeletonStudentsList />
          ) : groupedByRoom.length === 0 ? (
            classrooms.length > 0 ? (
              <AppEmptyState tone="violet">ไม่พบนักเรียน — กดปุ่ม "+ เพิ่มนักเรียน"</AppEmptyState>
            ) : null
          ) : (
            groupedByRoom.map(([roomName, rows]) => (
              <div key={roomName} className="space-y-2">
                <h3 className="text-sm font-bold text-[#4d47b6]">
                  {roomName} <span className="font-normal text-[#66638c]">· {rows.length} คน</span>
                </h3>
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {rows.map((s) => (
                    <li
                      key={s.id}
                      className={cn(appDashboardSectionSlateClass, "flex items-center gap-3 !py-3")}
                    >
                      <Avatar src={s.photoUrl} name={s.fullName} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2e2a58]">
                          เลขที่ {s.studentNo} · {s.fullName}
                          {s.nickname ? <span className="text-[#66638c]"> ({s.nickname})</span> : null}
                        </p>
                        <p className="truncate text-[11px] text-[#66638c]">
                          {s.parentName ? `ผู้ปกครอง: ${s.parentName}` : "ไม่มีข้อมูลผู้ปกครอง"}
                          {s.parentPhone ? ` · ${s.parentPhone}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row sm:gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(s)}
                          className={cn(appTemplateOutlineButtonClass, "px-2.5 py-1 text-[11px]")}
                        >
                          แก้
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(s)}
                          disabled={busy}
                          className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        >
                          ลบ
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </AppDashboardSection>

      {openForm ? (
        <StudentModalForm
          classrooms={classrooms}
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

function StudentModalForm({
  classrooms,
  form,
  setForm,
  onClose,
  onSubmit,
  busy,
  error,
}: {
  classrooms: ClassroomOption[];
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
          <h3 className="text-lg font-bold text-[#2e2a58]">{form.id ? "แก้ไขนักเรียน" : "เพิ่มนักเรียน"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/60 bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#66638c] hover:bg-white"
          >
            ปิด
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ห้องเรียน *">
              <select
                value={form.classroomId}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    classroomId: e.target.value === "" ? "" : Number(e.target.value),
                  }))
                }
                className={inputCls}
                required
              >
                <option value="">เลือกห้อง</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="เลขที่ *">
              <input
                type="text"
                value={form.studentNo}
                onChange={(e) => setForm((s) => ({ ...s, studentNo: e.target.value }))}
                className={inputCls}
                placeholder="01"
                required
              />
            </Field>
          </div>

          <Field label="ชื่อ-สกุล *">
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm((s) => ({ ...s, fullName: e.target.value }))}
              className={inputCls}
              placeholder="ด.ช./ด.ญ. ชื่อ นามสกุล"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ชื่อเล่น">
              <input
                type="text"
                value={form.nickname}
                onChange={(e) => setForm((s) => ({ ...s, nickname: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="เพศ">
              <select
                value={form.gender}
                onChange={(e) => setForm((s) => ({ ...s, gender: (e.target.value as "M" | "F" | "") }))}
                className={inputCls}
              >
                <option value="">ไม่ระบุ</option>
                <option value="M">ชาย</option>
                <option value="F">หญิง</option>
              </select>
            </Field>
          </div>
          <Field label="วันเกิด">
            <input
              type="date"
              value={form.birthdate}
              onChange={(e) => setForm((s) => ({ ...s, birthdate: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="URL รูป (สาธารณะ)">
            <input
              type="url"
              value={form.photoUrl}
              onChange={(e) => setForm((s) => ({ ...s, photoUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://..."
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ชื่อผู้ปกครอง">
              <input
                type="text"
                value={form.parentName}
                onChange={(e) => setForm((s) => ({ ...s, parentName: e.target.value }))}
                className={inputCls}
              />
            </Field>
            <Field label="เบอร์ผู้ปกครอง">
              <input
                type="tel"
                value={form.parentPhone}
                onChange={(e) => setForm((s) => ({ ...s, parentPhone: e.target.value }))}
                className={inputCls}
                placeholder="08x-xxx-xxxx"
              />
            </Field>
          </div>

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

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ede9ff] ring-2 ring-white">
        <Image src={src} alt={name} width={48} height={48} className="h-full w-full object-cover" unoptimized />
      </span>
    );
  }
  const fallback = name.trim().slice(0, 1).toUpperCase() || "·";
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#ede9ff] text-base font-bold text-[#4d47b6] ring-2 ring-white">
      {fallback}
    </span>
  );
}

function SkeletonStudentsList() {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className={cn(appDashboardSectionSlateClass, "flex animate-pulse items-center gap-3 !py-3")}>
          <span className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
        </li>
      ))}
    </ul>
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
