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
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        <div className="relative overflow-hidden rounded-[1rem] border border-indigo-200/70 bg-gradient-to-br from-white via-indigo-50/50 to-violet-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
          <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-700">สมาชิกทั้งหมด</p>
          <p className="mt-1 bg-gradient-to-br from-[#4338ca] via-[#5b61ff] to-[#6366f1] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
            {data.accountCount.toLocaleString("th-TH")}
            <span className="ml-1 text-sm font-bold text-[#8b87ad]">คน</span>
          </p>
          <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-300/40 via-violet-200/30 to-transparent blur-2xl" />
        </div>
        <div className="relative overflow-hidden rounded-[1rem] border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/55 to-teal-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
          <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-emerald-500 to-teal-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">ยอดเงินฝากรวม</p>
          <p className="mt-1 flex items-baseline bg-gradient-to-br from-emerald-500 via-teal-500 to-[#0d9488] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
            <span className="mr-0.5 text-sm font-bold text-[#7a9e96]">฿</span>
            {data.totalLabel}
          </p>
          <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-300/45 via-teal-200/30 to-transparent blur-2xl" />
        </div>
        <div className="relative overflow-hidden rounded-[1rem] border border-rose-200/80 bg-gradient-to-br from-white via-rose-50/55 to-pink-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
          <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-rose-500 to-pink-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">ยอดถอนวันนี้</p>
          <p className="mt-1 flex items-baseline bg-gradient-to-br from-rose-500 via-pink-500 to-[#ec4899] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
            <span className="mr-0.5 text-sm font-bold text-[#f9a8d4]">฿</span>
            0
          </p>
          <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-rose-300/40 via-pink-200/30 to-transparent blur-2xl" />
        </div>
        <div className="relative overflow-hidden rounded-[1rem] border border-amber-200/80 bg-gradient-to-br from-white via-amber-50/55 to-orange-50/40 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-inset ring-white/60 sm:p-4">
          <span aria-hidden className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-amber-400 to-orange-500" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">ธุรกรรมวันนี้</p>
          <p className="mt-1 bg-gradient-to-br from-amber-500 via-orange-500 to-[#ea580c] bg-clip-text text-2xl font-black tabular-nums leading-none text-transparent sm:text-[1.8rem]">
            {data.recent.length.toLocaleString("th-TH")}
            <span className="ml-1 text-sm font-bold text-[#b45309]">รายการ</span>
          </p>
          <div aria-hidden className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-gradient-to-br from-amber-300/45 via-orange-200/30 to-transparent blur-2xl" />
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
              "inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-2xl px-6 text-sm font-black text-white shadow-lg transition active:scale-[0.98] disabled:opacity-45",
              "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25",
            )}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
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
                  "inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-2xl text-sm font-black transition",
                  kind === k
                    ? k === "deposit"
                      ? "bg-emerald-500 text-white shadow-md"
                      : "bg-rose-500 text-white shadow-md"
                    : "border border-white/60 bg-white/50 text-slate-600",
                )}
              >
                {k === "deposit" ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 5v14M5 12l7 7 7-7" />
                  </svg>
                )}
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
