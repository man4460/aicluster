"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
  appDashboardSectionVioletClass,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { parkingStatCardClass } from "@/systems/parking/parking-valet-ui";
import type { SchoolBankDashboardDto } from "@/systems/school-bank/lib/load-school-bank-dashboard";

function ledgerTypeLabel(t: string): string {
  if (t === "DEPOSIT") return "ฝาก";
  if (t === "WITHDRAW") return "ถอน";
  if (t === "ADJUST") return "ปรับปรุง";
  return t;
}

function ledgerTone(t: string): string {
  if (t === "DEPOSIT") return "text-emerald-600";
  if (t === "WITHDRAW") return "text-rose-600";
  return "text-slate-600";
}

export function SchoolBankDashboardClient({ initial }: { initial: SchoolBankDashboardDto }) {
  const [data, setData] = useState(initial);
  const [txOpen, setTxOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(initial.accounts[0]?.id ?? "");
  const [kind, setKind] = useState<"deposit" | "withdraw">("deposit");
  const [amountBaht, setAmountBaht] = useState("");
  const [note, setNote] = useState("");
  const [accountFilter, setAccountFilter] = useState("");

  const filteredTxAccounts = useMemo(() => {
    const q = accountFilter.trim().toLowerCase();
    if (!q) return data.accounts;
    return data.accounts.filter(
      (a) =>
        a.memberCode.toLowerCase().includes(q) ||
        a.memberName.toLowerCase().includes(q) ||
        (a.classroomLabel?.toLowerCase().includes(q) ?? false),
    );
  }, [data.accounts, accountFilter]);

  useEffect(() => {
    setAccountId((prev) => {
      if (filteredTxAccounts.some((a) => a.id === prev)) return prev;
      return filteredTxAccounts[0]?.id ?? "";
    });
  }, [filteredTxAccounts]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/school-bank/summary", { credentials: "same-origin" });
    if (res.ok) {
      const j = (await res.json()) as SchoolBankDashboardDto;
      setData(j);
      if (!accountId && j.accounts[0]) setAccountId(j.accounts[0].id);
    }
  }, [accountId]);

  const submitTx = async () => {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/school-bank/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ accountId, kind, amountBaht, note: note || null }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (j.error === "insufficient") setErr("ยอดไม่พอสำหรับถอน");
        else setErr("บันทึกไม่สำเร็จ");
        return;
      }
      setTxOpen(false);
      setAmountBaht("");
      setNote("");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
        <div className={parkingStatCardClass("emerald")}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">ยอดรวมในบัญชี</p>
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{data.totalLabel}</p>
          <p className="mt-1 text-xs font-bold opacity-70">บาท</p>
        </div>
        <div className={parkingStatCardClass("indigo")}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">จำนวนบัญชี</p>
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{data.accountCount}</p>
          <p className="mt-1 text-xs font-bold opacity-70">บัญชีที่ใช้งาน</p>
        </div>
        <div className={cn(parkingStatCardClass("slate"), "col-span-2 sm:col-span-1")}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">รายการล่าสุด</p>
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path d="M4 18h16M7 14l3-3 3 2 4-5" />
            </svg>
          </div>
          <p className="mt-3 text-2xl font-black tabular-nums tracking-tight sm:text-3xl">{data.recent.length}</p>
          <p className="mt-1 text-xs font-bold opacity-70">แสดงในหน้านี้</p>
        </div>
      </div>

      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader
          tone="violet"
          title="ทำรายการฝาก–ถอน"
          description="เลือกบัญชี ระบุจำนวนเงินเป็นบาท — ระบบบันทึกสตางค์ให้อัตโนมัติ"
        />
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-[#66638c]">
            {data.accounts.length === 0 ? "เพิ่มบัญชีนักเรียนก่อนจึงจะทำรายการได้" : "พร้อมบันทึกรายการใหม่"}
          </p>
          <button
            type="button"
            disabled={data.accounts.length === 0}
            onClick={() => {
              setErr(null);
              setAccountFilter("");
              if (data.accounts[0] && !accountId) setAccountId(data.accounts[0].id);
              setTxOpen(true);
            }}
            className={cn(
              "inline-flex min-h-[48px] items-center justify-center rounded-2xl px-6 text-sm font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-45",
              "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25",
            )}
          >
            ทำรายการ
          </button>
        </div>
      </AppDashboardSection>

      <AppDashboardSection className={appDashboardSectionVioletClass}>
        <AppSectionHeader
          tone="violet"
          title="ประวัติล่าสุด"
          description="เรียงจากใหม่ไปเก่า — แสดงชื่อและรหัสนักเรียน"
        />
        {data.recent.length === 0 ? (
          <AppEmptyState className="mt-4" tone="violet">
            <span className="block font-black text-[#2e2a58]">ยังไม่มีรายการ</span>
            <span className="mt-1 block text-xs">เริ่มจากฝากเงินครั้งแรก</span>
          </AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {data.recent.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "flex flex-col gap-1 rounded-[1.25rem] border border-white/60 bg-white/50 px-4 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between",
                )}
              >
                <div className="min-w-0 text-left">
                  <p className="text-sm font-black text-[#1e1b4b]">
                    {r.memberName}{" "}
                    <span className="font-bold text-[#66638c]">· {r.memberCode}</span>
                  </p>
                  <p className="text-xs font-bold text-[#66638c]">
                    {ledgerTypeLabel(r.type)}
                    {r.note ? ` · ${r.note}` : ""} ·{" "}
                    {new Date(r.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className={cn("text-lg font-black tabular-nums", ledgerTone(r.type))}>{r.amountLabel} ฿</p>
                  <p className="text-[10px] font-bold text-[#66638c]">คงเหลือ {r.balanceAfterLabel} ฿</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={txOpen}
        onClose={() => {
          if (!busy) {
            setAccountFilter("");
            setTxOpen(false);
          }
        }}
        title="บันทึกรายการ"
        description="ฝากหรือถอนเป็นบาท (ทศนิยมได้ 2 ตำแหน่ง)"
        size="md"
        footer={
          <FormModalFooterActions
            submitLabel="บันทึก"
            onSubmit={submitTx}
            submitDisabled={busy || !accountId || filteredTxAccounts.length === 0}
            loading={busy}
            onCancel={() => {
              if (!busy) {
                setAccountFilter("");
                setTxOpen(false);
              }
            }}
            cancelLabel="ยกเลิก"
          />
        }
      >
        <div className="space-y-4">
          {err && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">{err}</p>}
          <div className="space-y-2">
            <span className="block text-xs font-black text-[#66638c]">บัญชี</span>
            <input
              type="search"
              autoComplete="off"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              placeholder="พิมพ์กรอง รหัส ชื่อ หรือห้อง"
              className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-bold text-[#1e1b4b] shadow-inner backdrop-blur-sm placeholder:font-normal placeholder:text-slate-400"
              aria-label="กรองรายการบัญชี"
            />
            {filteredTxAccounts.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-sm font-bold text-[#66638c]">
                ไม่พบบัญชีที่ตรงกับคำค้น
              </p>
            ) : (
              <select
                className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-bold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                aria-label="เลือกบัญชีจากรายการที่กรองแล้ว"
              >
                {filteredTxAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.memberName} ({a.memberCode})
                    {a.classroomLabel ? ` · ${a.classroomLabel}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex gap-2">
            {(["deposit", "withdraw"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={cn(
                  "min-h-[44px] flex-1 rounded-2xl text-sm font-black transition",
                  kind === k
                    ? k === "deposit"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-rose-500 text-white shadow-md"
                    : "border border-white/60 bg-white/50 text-slate-600",
                )}
              >
                {k === "deposit" ? "ฝาก" : "ถอน"}
              </button>
            ))}
          </div>
          <label className="block space-y-1.5">
            <span className="text-xs font-black text-[#66638c]">จำนวนเงิน (บาท)</span>
            <input
              type="text"
              inputMode="decimal"
              className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-black tabular-nums text-[#1e1b4b] shadow-inner backdrop-blur-sm"
              placeholder="เช่น 100 หรือ 50.25"
              value={amountBaht}
              onChange={(e) => setAmountBaht(e.target.value)}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-black text-[#66638c]">หมายเหตุ (ไม่บังคับ)</span>
            <input
              type="text"
              className="w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm font-bold text-[#1e1b4b] shadow-inner backdrop-blur-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}
