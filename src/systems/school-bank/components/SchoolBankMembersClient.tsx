"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { formatBahtFromSatang } from "@/lib/format/money-th";

type AccountRow = {
  id: string;
  memberCode: string;
  memberName: string;
  classroomLabel: string | null;
  balanceSatang: number;
};

export function SchoolBankMembersClient({ initial }: { initial: AccountRow[] }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [classroomLabel, setClassroomLabel] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/school-bank/accounts", { credentials: "same-origin" });
    if (res.ok) {
      const j = (await res.json()) as { accounts: AccountRow[] };
      setRows(j.accounts);
    }
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.memberCode.toLowerCase().includes(s) ||
        r.memberName.toLowerCase().includes(s) ||
        (r.classroomLabel?.toLowerCase().includes(s) ?? false),
    );
  }, [rows, q]);

  const submitAdd = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/school-bank/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          memberCode,
          memberName,
          classroomLabel: classroomLabel || null,
        }),
      });
      if (!res.ok) {
        if (res.status === 409) setErr("รหัสนักเรียนซ้ำในระบบ");
        else setErr("เพิ่มบัญชีไม่สำเร็จ");
        return;
      }
      setAddOpen(false);
      setMemberCode("");
      setMemberName("");
      setClassroomLabel("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader
          tone="violet"
          title="บัญชีนักเรียน"
          description="ค้นหาและเพิ่มบัญชีออม — ยอดคงเหลืออัปเดตจากรายการฝาก–ถอน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-white/60 bg-white/70 text-[#4d47b6] shadow-sm backdrop-blur-sm sm:hidden"
                aria-label="เปิดตัวกรอง"
                onClick={() => setFilterOpen(true)}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                className={cn(
                  "app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-2xl px-0 font-black shadow-md sm:min-w-0 sm:px-5",
                )}
                aria-label="เพิ่มบัญชีนักเรียน"
                onClick={() => {
                  setErr(null);
                  setAddOpen(true);
                }}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 sm:hidden" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">+ เพิ่มบัญชี</span>
              </button>
            </div>
          }
        />

        <div className="mt-4 hidden sm:block">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหารหัส ชื่อ หรือห้อง"
            className="w-full rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm font-bold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
          />
        </div>

        {filtered.length === 0 ? (
          <AppEmptyState className="mt-6" tone="violet">
            <span className="block font-black text-[#2e2a58]">ยังไม่มีบัญชี</span>
            <span className="mt-1 block text-xs">กดเพิ่มบัญชีเพื่อเริ่มบันทึก</span>
          </AppEmptyState>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="flex flex-col justify-between gap-3 rounded-[2rem] border border-white/55 bg-white/45 p-5 shadow-sm backdrop-blur-md ring-1 ring-white/70 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 text-left">
                  <p className="text-lg font-black tracking-tight text-[#1e1b4b]">{a.memberName}</p>
                  <p className="text-xs font-bold text-[#66638c]">
                    รหัส {a.memberCode}
                    {a.classroomLabel ? ` · ห้อง ${a.classroomLabel}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xl font-black tabular-nums text-emerald-700">{formatBahtFromSatang(a.balanceSatang)} ฿</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">ยอดคงเหลือ</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal open={filterOpen} onClose={() => setFilterOpen(false)} title="ค้นหาบัญชี" size="sm">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="รหัส ชื่อ ห้อง"
          className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-sm font-bold"
        />
        <button
          type="button"
          className="mt-4 w-full rounded-2xl bg-[#5b61ff] py-3 text-sm font-black text-white shadow-md"
          onClick={() => setFilterOpen(false)}
        >
          เสร็จ
        </button>
      </FormModal>

      <FormModal
        open={addOpen}
        onClose={() => !busy && setAddOpen(false)}
        title="เพิ่มบัญชีนักเรียน"
        footer={
          <FormModalFooterActions
            submitLabel="บันทึก"
            onSubmit={submitAdd}
            submitDisabled={busy || !memberCode.trim() || !memberName.trim()}
            loading={busy}
            onCancel={() => !busy && setAddOpen(false)}
          />
        }
      >
        <div className="space-y-3">
          {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{err}</p>}
          <label className="block space-y-1">
            <span className="text-xs font-black text-[#66638c]">รหัสนักเรียน</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-black text-[#66638c]">ชื่อ–สกุล</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-black text-[#66638c]">ห้อง / ชั้น (ไม่บังคับ)</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
              value={classroomLabel}
              onChange={(e) => setClassroomLabel(e.target.value)}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}
