"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { mrListRowCardClass } from "@/systems/media-registry/components/media-registry-ui-tokens";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { MEDIA_REGISTRY_BORROW_STATUS } from "@/systems/media-registry/lib/constants";

type MediaOption = { id: string; registerNo: string; mediaName: string; quantityAvailable: number };

type BorrowRow = {
  id: string;
  borrowNo: string;
  registerNo: string;
  mediaName: string;
  borrowerName: string;
  quantityBorrow: number;
  quantityReturn: number;
  borrowStatus: string;
  borrowDate: string;
  dueDate: string | null;
};

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function dayKeyFromIso(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
  } catch {
    return "";
  }
}

export function MediaRegistryBorrowClient() {
  const [borrows, setBorrows] = useState<BorrowRow[]>([]);
  const [media, setMedia] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [activeBorrow, setActiveBorrow] = useState<BorrowRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [borrowForm, setBorrowForm] = useState({
    mediaId: "",
    borrowerName: "",
    quantityBorrow: "1",
    borrowDate: bangkokDateKey(),
    dueDate: "",
    purpose: "",
  });

  const [returnForm, setReturnForm] = useState({
    quantityReturn: "1",
    conditionAfter: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [br, mr] = await Promise.all([
        fetch("/api/media-registry/borrows", { cache: "no-store" }),
        fetch("/api/media-registry/items", { cache: "no-store" }),
      ]);
      const bj = await br.json();
      const mj = await mr.json();
      if (br.ok) setBorrows(bj.items as BorrowRow[]);
      if (mr.ok) {
        const raw = (mj.items as { id: string; registerNo: string; mediaName: string; quantityAvailable: number }[]);
        setMedia(raw.filter((x) => x.quantityAvailable > 0));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const submitBorrow = async () => {
    if (!borrowForm.mediaId || !borrowForm.borrowerName.trim()) {
      alert("เลือกสื่อและชื่อผู้ยืม");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/media-registry/borrows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mediaId: borrowForm.mediaId,
          borrowerName: borrowForm.borrowerName.trim(),
          quantityBorrow: Number(borrowForm.quantityBorrow) || 1,
          borrowDate: borrowForm.borrowDate,
          dueDate: borrowForm.dueDate.trim() || null,
          purpose: borrowForm.purpose.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "ยืมไม่สำเร็จ");
        return;
      }
      setBorrowOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const submitReturn = async () => {
    if (!activeBorrow) return;
    setSubmitting(true);
    try {
      const r = await fetch(`/api/media-registry/borrows/${activeBorrow.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quantityReturn: Number(returnForm.quantityReturn) || 0,
          conditionAfter: returnForm.conditionAfter.trim() || null,
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "คืนไม่สำเร็จ");
        return;
      }
      setReturnOpen(false);
      setActiveBorrow(null);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const openReturn = (b: BorrowRow) => {
    setActiveBorrow(b);
    const remain = b.quantityBorrow - b.quantityReturn;
    setReturnForm({ quantityReturn: String(Math.max(1, remain)), conditionAfter: "" });
    setReturnOpen(true);
  };

  const today = bangkokDateKey();

  return (
    <>
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ยืม-คืนสื่อ"
          description="ลดจำนวนคงเหลืออัตโนมัติเวลายืม · คืนครบหรือบางส่วน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2 sm:min-w-0 sm:px-4"
              aria-label="บันทึกการยืม"
              onClick={() => setBorrowOpen(true)}
            >
              <IconPlus className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">+ ยืมสื่อ</span>
            </button>
          }
        />

        {loading ? (
          <p className="mt-4 text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : borrows.length === 0 ? (
          <AppEmptyState className="mt-4">ยังไม่มีรายการยืม</AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {borrows.map((b) => {
              const remain = b.quantityBorrow - b.quantityReturn;
              const overdue = b.dueDate && b.borrowStatus !== MEDIA_REGISTRY_BORROW_STATUS.RETURNED
                ? dayKeyFromIso(b.dueDate) < today
                : false;
              return (
                <li
                  key={b.id}
                  className={cn(mrListRowCardClass, "sm:flex sm:items-center sm:justify-between")}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2e2a58]">
                      {b.borrowerName} · {b.mediaName}
                    </p>
                    <p className="text-xs text-[#66638c]">
                      {b.borrowNo} · {b.registerNo} · คงค้าง {remain}/{b.quantityBorrow} · {b.borrowStatus}
                      {overdue ? (
                        <span className="ml-1 font-bold text-rose-600">ครบกำหนดแล้ว</span>
                      ) : null}
                    </p>
                  </div>
                  {b.borrowStatus !== MEDIA_REGISTRY_BORROW_STATUS.RETURNED ? (
                    <button
                      type="button"
                      className={cn(
                        "mt-2 w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm font-semibold text-[#4d47b6] sm:mt-0 sm:w-auto",
                      )}
                      onClick={() => openReturn(b)}
                    >
                      บันทึกคืน
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={borrowOpen}
        onClose={() => setBorrowOpen(false)}
        title="ยืมสื่อ"
        footer={
          <FormModalFooterActions
            onCancel={() => setBorrowOpen(false)}
            onSubmit={() => void submitBorrow()}
            submitLabel={submitting ? "กำลังบันทึก…" : "บันทึกการยืม"}
            submitDisabled={submitting}
          />
        }
      >
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">สื่อ *</span>
            <select
              className={cn(inputCls, "mt-1")}
              value={borrowForm.mediaId}
              onChange={(e) => setBorrowForm((f) => ({ ...f, mediaId: e.target.value }))}
            >
              <option value="">— เลือก —</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.registerNo} · {m.mediaName} (เหลือ {m.quantityAvailable})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">ผู้ยืม *</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={borrowForm.borrowerName}
              onChange={(e) => setBorrowForm((f) => ({ ...f, borrowerName: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">จำนวนยืม</span>
            <input
              className={cn(inputCls, "mt-1")}
              type="number"
              min={1}
              value={borrowForm.quantityBorrow}
              onChange={(e) => setBorrowForm((f) => ({ ...f, quantityBorrow: e.target.value }))}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">วันที่ยืม</span>
              <input
                className={cn(inputCls, "mt-1")}
                type="date"
                value={borrowForm.borrowDate}
                onChange={(e) => setBorrowForm((f) => ({ ...f, borrowDate: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">กำหนดคืน</span>
              <input
                className={cn(inputCls, "mt-1")}
                type="date"
                value={borrowForm.dueDate}
                onChange={(e) => setBorrowForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">วัตถุประสงค์</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={borrowForm.purpose}
              onChange={(e) => setBorrowForm((f) => ({ ...f, purpose: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>

      <FormModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="บันทึกคืน"
        footer={
          <FormModalFooterActions
            onCancel={() => setReturnOpen(false)}
            onSubmit={() => void submitReturn()}
            submitLabel={submitting ? "กำลังบันทึก…" : "บันทึกคืน"}
            submitDisabled={submitting}
          />
        }
      >
        {activeBorrow ? (
          <div className="space-y-3">
            <p className="text-sm text-[#2e2a58]">
              เหลือคืนได้สูงสุด {activeBorrow.quantityBorrow - activeBorrow.quantityReturn} ชิ้น
            </p>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">จำนวนที่คืนครั้งนี้</span>
              <input
                className={cn(inputCls, "mt-1")}
                type="number"
                min={1}
                value={returnForm.quantityReturn}
                onChange={(e) => setReturnForm((f) => ({ ...f, quantityReturn: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-[#66638c]">สภาพหลังคืน</span>
              <input
                className={cn(inputCls, "mt-1")}
                value={returnForm.conditionAfter}
                onChange={(e) => setReturnForm((f) => ({ ...f, conditionAfter: e.target.value }))}
              />
            </label>
          </div>
        ) : null}
      </FormModal>
    </>
  );
}
