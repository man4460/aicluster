"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionSlateClass,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import {
  EDUCARE_FEATURES,
  EDUCARE_FEATURE_STATUS,
  EDUCARE_STATUS_LABEL,
  EDUCARE_STATUS_TONE,
  type EducareFeatureKey,
} from "@/systems/educare/lib/educare-types";
import type { EducareCheckStatus } from "@/generated/prisma/enums";

type Classroom = { id: number; name: string; grade: string | null };

type RosterRow = {
  studentId: number;
  studentNo: string;
  fullName: string;
  nickname: string | null;
  photoUrl: string | null;
  gender: "M" | "F" | null;
  assemblyStatus: EducareCheckStatus | null;
  recordId: string | null;
  status: EducareCheckStatus;
  note: string;
  meta: unknown;
  isDefault: boolean;
};

type RosterPayload = {
  classroomId: number;
  feature: EducareFeatureKey;
  date: string;
  validStatuses: EducareCheckStatus[];
  roster: RosterRow[];
  stats: { total: number; checked: number };
};

const STATUS_TONE_CLASS: Record<string, { active: string; idle: string }> = {
  positive: {
    active: "bg-emerald-500 text-white border-emerald-500 shadow-[0_8px_18px_-10px_rgba(16,185,129,0.95)]",
    idle: "border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100",
  },
  warning: {
    active: "bg-amber-500 text-white border-amber-500 shadow-[0_8px_18px_-10px_rgba(245,158,11,0.95)]",
    idle: "border-amber-200 bg-amber-50/70 text-amber-700 hover:bg-amber-100",
  },
  danger: {
    active: "bg-rose-500 text-white border-rose-500 shadow-[0_8px_18px_-10px_rgba(244,63,94,0.95)]",
    idle: "border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100",
  },
  neutral: {
    active: "bg-sky-500 text-white border-sky-500 shadow-[0_8px_18px_-10px_rgba(14,165,233,0.95)]",
    idle: "border-sky-200 bg-sky-50/70 text-sky-700 hover:bg-sky-100",
  },
  muted: {
    active: "bg-slate-500 text-white border-slate-500",
    idle: "border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200",
  },
};

function todayYmd(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function EducareCheckClient() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState<number | null>(null);
  const [feature, setFeature] = useState<EducareFeatureKey>("ASSEMBLY");
  const [date, setDate] = useState<string>(() => todayYmd());

  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [stats, setStats] = useState<{ total: number; checked: number }>({ total: 0, checked: 0 });
  const [validStatuses, setValidStatuses] = useState<EducareCheckStatus[]>([
    ...EDUCARE_FEATURE_STATUS.ASSEMBLY,
  ]);

  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadClassrooms = useCallback(async () => {
    setLoadingClassrooms(true);
    try {
      const res = await fetch("/api/educare/classrooms", { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        const list: Classroom[] = (j.classrooms ?? []).map((c: Classroom) => ({
          id: c.id,
          name: c.name,
          grade: c.grade ?? null,
        }));
        setClassrooms(list);
        if (list.length && classroomId == null) setClassroomId(list[0].id);
      }
    } finally {
      setLoadingClassrooms(false);
    }
  }, [classroomId]);

  const loadRoster = useCallback(async () => {
    if (classroomId == null) return;
    setLoadingRoster(true);
    setDirty(false);
    try {
      const params = new URLSearchParams({
        classroomId: String(classroomId),
        feature,
        date,
      });
      const res = await fetch(`/api/educare/check/roster?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? "โหลดรายชื่อไม่สำเร็จ");
      }
      const j: RosterPayload = await res.json();
      setRoster(j.roster);
      setStats(j.stats);
      setValidStatuses(j.validStatuses);
    } catch (e) {
      flash(false, (e as Error).message);
    } finally {
      setLoadingRoster(false);
    }
  }, [classroomId, feature, date]);

  useEffect(() => {
    void loadClassrooms();
  }, [loadClassrooms]);
  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const flash = (ok: boolean, msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ ok, msg });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2400);
  };

  const setStudentStatus = (sid: number, status: EducareCheckStatus) => {
    setRoster((prev) =>
      prev.map((r) =>
        r.studentId === sid ? { ...r, status, isDefault: false } : r,
      ),
    );
    setDirty(true);
  };

  const setStudentNote = (sid: number, note: string) => {
    setRoster((prev) => prev.map((r) => (r.studentId === sid ? { ...r, note, isDefault: false } : r)));
    setDirty(true);
  };

  const setAllToFirst = () => {
    if (!validStatuses[0]) return;
    setRoster((prev) => prev.map((r) => ({ ...r, status: validStatuses[0], isDefault: false })));
    setDirty(true);
    flash(true, `กำหนดทุกคนเป็น "${EDUCARE_STATUS_LABEL[validStatuses[0]]}"`);
  };

  const save = async () => {
    if (classroomId == null) return;
    setBusy(true);
    try {
      const items = roster.map((r) => ({
        studentId: r.studentId,
        status: r.status,
        note: r.note?.trim() ? r.note.trim() : undefined,
      }));
      const res = await fetch("/api/educare/check/bulk-save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ classroomId, feature, date, items }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
      flash(true, `บันทึกแล้ว ${j?.count ?? items.length} รายการ`);
      setDirty(false);
      void loadRoster();
    } catch (e) {
      flash(false, (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const featureMeta = useMemo(
    () => EDUCARE_FEATURES.find((f) => f.key === feature) ?? EDUCARE_FEATURES[0],
    [feature],
  );

  const checkedCount = useMemo(() => roster.filter((r) => !r.isDefault).length, [roster]);
  const progressPct = roster.length > 0 ? Math.round((checkedCount / roster.length) * 100) : 0;

  if (loadingClassrooms) {
    return (
      <AppDashboardSection tone="violet">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-4 w-72 rounded bg-slate-200" />
          <div className="h-12 rounded-xl bg-slate-100" />
          <div className="h-12 rounded-xl bg-slate-100" />
        </div>
      </AppDashboardSection>
    );
  }

  if (classrooms.length === 0) {
    return (
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="เช็คประจำวัน"
          description="ยังไม่มีห้องเรียน — เพิ่มห้องและนักเรียนก่อนเริ่มเช็ค"
        />
        <AppEmptyState tone="violet" className="mt-4">
          ยังไม่มีห้องเรียน — ไปที่เมนู "จัดการห้องเรียน → ห้องเรียน" เพื่อเริ่มต้น
        </AppEmptyState>
      </AppDashboardSection>
    );
  }

  return (
    <div className="space-y-4">
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="เช็คประจำวัน"
          description={`เลือกห้องและฟีเจอร์ — ระบบจะคำนวณค่าตั้งต้นจากผลเช็คเข้าแถวให้อัตโนมัติ`}
        />

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="ห้องเรียน">
            <select
              value={classroomId ?? ""}
              onChange={(e) => setClassroomId(e.target.value ? Number(e.target.value) : null)}
              className={inputCls}
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.grade ? ` · ${c.grade}` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="วันที่">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value || todayYmd())}
              className={inputCls}
              max={todayYmd()}
            />
          </Field>
          <Field label="ความคืบหน้า">
            <div className={cn(inputCls, "flex items-center gap-3 !py-2.5")}>
              <span className="text-sm font-bold text-[#4d47b6]">{checkedCount}</span>
              <span className="text-xs text-[#66638c]">/ {roster.length} คน</span>
              <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#4d47b6]">{progressPct}%</span>
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4d47b6]/80">
            ฟีเจอร์
          </p>
          <ul className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
            {EDUCARE_FEATURES.map((f) => {
              const active = f.key === feature;
              return (
                <li key={f.key} className="snap-start">
                  <button
                    type="button"
                    onClick={() => setFeature(f.key)}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 rounded-2xl border px-3.5 text-sm font-semibold transition",
                      active
                        ? "border-[#4d47b6] bg-gradient-to-r from-[#5b61ff] to-[#4d47b6] text-white shadow-[0_12px_22px_-14px_rgba(91,97,255,0.95)]"
                        : "border-white/60 bg-white/70 text-[#66638c] hover:bg-white",
                    )}
                    aria-pressed={active}
                  >
                    <span className="text-base" aria-hidden>
                      {f.emoji}
                    </span>
                    <span>{f.short}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="violet">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#4d47b6]/80">
              {featureMeta.emoji} {featureMeta.label}
            </p>
            <p className="mt-1 text-sm text-[#66638c]">
              เวลามาตรฐาน: <strong className="text-[#2e2a58]">{featureMeta.defaultTime}</strong>
              {feature !== "ASSEMBLY" ? (
                <span className="ml-2">— ผู้ที่ขาด/ลา (จากเช็คเข้าแถว) จะถูกตั้งเป็น "ไม่เกี่ยวข้อง" อัตโนมัติ</span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={setAllToFirst}
              disabled={busy || roster.length === 0}
              className="min-h-[40px] rounded-xl border border-[#dcd8f0] bg-white/70 px-3 text-xs font-semibold text-[#4d47b6] hover:bg-white disabled:opacity-50"
            >
              ทุกคน "{validStatuses[0] ? EDUCARE_STATUS_LABEL[validStatuses[0]] : "-"}"
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy || roster.length === 0 || !dirty}
              className={cn(
                "min-h-[44px] rounded-2xl px-5 text-sm font-bold text-white shadow-[0_18px_30px_-15px_rgba(91,97,255,0.85)] transition active:scale-[0.99] disabled:opacity-50",
                dirty
                  ? "bg-gradient-to-r from-[#5b61ff] to-[#4d47b6]"
                  : "bg-slate-300 text-slate-500 shadow-none",
              )}
            >
              {busy ? "กำลังบันทึก…" : dirty ? "บันทึกผลเช็ค" : "บันทึกแล้ว"}
            </button>
          </div>
        </div>

        {feedback ? (
          <p
            className={cn(
              "mt-3 rounded-xl border px-3 py-2 text-sm",
              feedback.ok
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
            role="status"
          >
            {feedback.msg}
          </p>
        ) : null}

        <div className="mt-4">
          {loadingRoster ? (
            <SkeletonRoster />
          ) : roster.length === 0 ? (
            <AppEmptyState tone="violet">ห้องนี้ยังไม่มีนักเรียน — เพิ่มจากเมนูจัดการได้เลย</AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {roster.map((row) => (
                <RosterCard
                  key={row.studentId}
                  row={row}
                  validStatuses={validStatuses}
                  onChange={(s) => setStudentStatus(row.studentId, s)}
                  onNote={(n) => setStudentNote(row.studentId, n)}
                />
              ))}
            </ul>
          )}
        </div>

        <p className="mt-3 text-[11px] text-[#66638c]">
          {stats.checked === 0
            ? "ยังไม่มีบันทึกของวันที่นี้ — ค่าที่แสดงเป็นค่าเริ่มต้นที่ยังไม่ได้บันทึก"
            : `บันทึกแล้ว ${stats.checked.toLocaleString("th-TH")} จาก ${stats.total.toLocaleString("th-TH")} คน`}
        </p>
      </AppDashboardSection>
    </div>
  );
}

function RosterCard({
  row,
  validStatuses,
  onChange,
  onNote,
}: {
  row: RosterRow;
  validStatuses: EducareCheckStatus[];
  onChange: (status: EducareCheckStatus) => void;
  onNote: (note: string) => void;
}) {
  const [showNote, setShowNote] = useState(!!row.note);
  return (
    <li className={cn(appDashboardSectionSlateClass, "!py-3")}>
      <div className="flex items-start gap-3">
        <Avatar src={row.photoUrl} name={row.fullName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#2e2a58]">
            เลขที่ {row.studentNo} · {row.fullName}
            {row.nickname ? <span className="text-[#66638c]"> ({row.nickname})</span> : null}
          </p>
          {row.assemblyStatus && row.assemblyStatus !== "PRESENT" ? (
            <p className="mt-0.5 text-[11px] text-rose-600">
              เช้านี้: {EDUCARE_STATUS_LABEL[row.assemblyStatus]}
            </p>
          ) : null}
          {row.isDefault ? (
            <p className="mt-0.5 text-[11px] text-amber-600">ค่าตั้งต้น (ยังไม่ได้บันทึก)</p>
          ) : (
            <p className="mt-0.5 text-[11px] text-emerald-600">บันทึกแล้ว</p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {validStatuses.map((s) => {
          const tone = EDUCARE_STATUS_TONE[s];
          const active = row.status === s;
          const cls = STATUS_TONE_CLASS[tone];
          return (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className={cn(
                "min-h-[36px] flex-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition active:scale-[0.99]",
                active ? cls.active : cls.idle,
              )}
              aria-pressed={active}
            >
              {EDUCARE_STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      <div className="mt-2">
        {showNote ? (
          <input
            type="text"
            value={row.note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม (ไม่บังคับ)"
            className="w-full rounded-xl border border-white/60 bg-white/70 px-2.5 py-1.5 text-xs text-[#2e2a58] placeholder:text-[#a3a0c0] focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30"
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNote(true)}
            className="text-[11px] font-semibold text-[#4d47b6] hover:underline"
          >
            + เพิ่มหมายเหตุ
          </button>
        )}
      </div>
    </li>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  if (src) {
    return (
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ede9ff] ring-2 ring-white">
        <Image src={src} alt={name} width={44} height={44} className="h-full w-full object-cover" unoptimized />
      </span>
    );
  }
  const fallback = name.trim().slice(0, 1).toUpperCase() || "·";
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#ede9ff] text-base font-bold text-[#4d47b6] ring-2 ring-white">
      {fallback}
    </span>
  );
}

function SkeletonRoster() {
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className={cn(appDashboardSectionSlateClass, "animate-pulse !py-3")}>
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-slate-200" />
              <div className="h-3 w-1/3 rounded bg-slate-200" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-8 flex-1 rounded-xl bg-slate-100" />
            <div className="h-8 flex-1 rounded-xl bg-slate-100" />
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
