"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  LMS_PURCHASE_PAY_METHOD_LABELS,
  LMS_PURCHASE_STATUS_LABELS,
} from "@/systems/lms/lib/purchases-shared";
import {
  lmsFieldClass,
  lmsFilterChipClass,
  lmsFilterChipShellClass,
  lmsOutlineButtonClass,
  lmsPrimaryButtonClass,
  lmsRowCardClass,
  lmsSectionHeadingClass,
} from "@/systems/lms/lib/ui-tokens";

export type LmsPurchaseRow = {
  id: string;
  amountBaht: number;
  payMethod: "PROMPTPAY" | "TRANSFER";
  slipUrl: string | null;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewerNote: string;
  createdAt: string;
  learner?: { id: string; username: string; fullName: string; status: string };
  course?: { id: string; title: string; coverImageUrl: string | null; priceBaht: number };
};

type StatusFilter = "ALL" | LmsPurchaseRow["status"];

function IconFilter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

export function LmsPurchasesPanel({
  onRefreshReady,
  mode = "all",
  hideFilter = false,
  title,
}: {
  /** ส่งฟังก์ชันรีเฟรชออกไปให้หัวการ์ดเรียกได้ */
  onRefreshReady?: (refresh: () => void) => void;
  /**
   * pending = เฉพาะรอตรวจ (ภาพรวม)
   * history = ยืนยัน/ปฏิเสธแล้ว (ย้อนหลัง)
   * all = ทุกรายการ
   */
  mode?: "pending" | "history" | "all";
  /** ซ่อนปุ่ม/แผงกรอง (ใช้ในภาพรวม) */
  hideFilter?: boolean;
  /** หัวข้อแถวเดียวกับจำนวนรายการ (เมื่อ hideFilter) */
  title?: string;
} = {}) {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [purchases, setPurchases] = useState<LmsPurchaseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    mode === "pending" ? "PENDING_REVIEW" : "ALL",
  );
  const [keyword, setKeyword] = useState("");

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lms/session/purchases");
      const data = (await res.json()) as { purchases?: LmsPurchaseRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "โหลดคำขอซื้อไม่สำเร็จ");
      let rows = data.purchases ?? [];
      if (mode === "pending") {
        rows = rows.filter((p) => p.status === "PENDING_REVIEW");
      } else if (mode === "history") {
        rows = rows
          .filter((p) => p.status === "APPROVED" || p.status === "REJECTED")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      } else {
        rows = [...rows].sort((a, b) => {
          const ap = a.status === "PENDING_REVIEW" ? 0 : 1;
          const bp = b.status === "PENDING_REVIEW" ? 0 : 1;
          if (ap !== bp) return ap - bp;
          return b.createdAt.localeCompare(a.createdAt);
        });
      }
      setPurchases(rows);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice.error, mode]);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  useEffect(() => {
    onRefreshReady?.(() => {
      void loadPurchases();
    });
  }, [onRefreshReady, loadPurchases]);

  const scopedPurchases = purchases;

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: scopedPurchases.length,
      PENDING_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    for (const p of scopedPurchases) counts[p.status] += 1;
    return counts;
  }, [scopedPurchases]);

  const filtersActive =
    (mode === "history" && statusFilter !== "ALL") ||
    (mode === "all" && statusFilter !== "ALL") ||
    keyword.trim().length > 0;

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return scopedPurchases.filter((p) => {
      if (mode === "history" || mode === "all") {
        if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      }
      if (!q) return true;
      const hay = [
        p.course?.title,
        p.learner?.fullName,
        p.learner?.username,
        p.reviewerNote,
        LMS_PURCHASE_STATUS_LABELS[p.status],
        LMS_PURCHASE_PAY_METHOD_LABELS[p.payMethod],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [scopedPurchases, statusFilter, keyword, mode]);

  const clearFilters = () => {
    setStatusFilter(mode === "pending" ? "PENDING_REVIEW" : "ALL");
    setKeyword("");
  };

  const reviewPurchase = async (
    p: LmsPurchaseRow,
    action: "APPROVE" | "REJECT",
    opts?: { deactivateLearner?: boolean },
  ) => {
    if (action === "APPROVE") {
      const ok = await notice.confirm(
        `ยืนยันสลิป «${p.course?.title ?? "คอร์ส"}» ถูกต้อง และบันทึกรายรับ?\n(นักเรียนเข้าเรียนได้อยู่แล้วตั้งแต่ส่งสลิป)`,
      );
      if (!ok) return;
    } else {
      const fake = await notice.confirm(
        `ปฏิเสธสลิปและถอนสิทธิ์เรียน «${p.course?.title ?? "คอร์ส"}»?\nบัญชี ${p.learner?.fullName ?? ""} จะ${opts?.deactivateLearner ? "ถูกปิดใช้งาน" : "ยังใช้งานได้"}`,
      );
      if (!fake) return;
    }
    try {
      const res = await fetch(`/api/lms/session/purchases/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewerNote:
            action === "REJECT"
              ? "สลิปไม่ถูกต้องหรือไม่ใช่หลักฐานการโอนจริง — ฝ่าฝืนกฎสถาบัน"
              : undefined,
          deactivateLearner: opts?.deactivateLearner === true,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      await loadPurchases();
      if (action === "APPROVE") notice.success("ยืนยันสลิปแล้ว — บันทึกรายรับแล้ว");
      else if (opts?.deactivateLearner) notice.success("ปฏิเสธ ถอนสิทธิ์เรียน และปิดบัญชีแล้ว");
      else notice.success("ปฏิเสธและถอนสิทธิ์เรียนแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  };

  const statusChips: { key: StatusFilter; label: string }[] =
    mode === "history"
      ? [
          { key: "ALL", label: "ทั้งหมด" },
          { key: "APPROVED", label: LMS_PURCHASE_STATUS_LABELS.APPROVED },
          { key: "REJECTED", label: LMS_PURCHASE_STATUS_LABELS.REJECTED },
        ]
      : mode === "all"
        ? [
            { key: "ALL", label: "ทั้งหมด" },
            { key: "PENDING_REVIEW", label: LMS_PURCHASE_STATUS_LABELS.PENDING_REVIEW },
            { key: "APPROVED", label: LMS_PURCHASE_STATUS_LABELS.APPROVED },
            { key: "REJECTED", label: LMS_PURCHASE_STATUS_LABELS.REJECTED },
          ]
        : [];

  const emptyLabel =
    mode === "pending"
      ? "ไม่มีคำขอรออนุมัติ"
      : mode === "history"
        ? "ยังไม่มีประวัติคำขอที่ยืนยันหรือปฏิเสธ"
        : "ยังไม่มีคำขอซื้อจากผู้เรียน";

  const filterId =
    mode === "pending"
      ? "lms-purchases-pending-filter"
      : mode === "history"
        ? "lms-purchases-history-filter"
        : "lms-purchases-filter-panel";

  return (
    <>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />

      {hideFilter ? (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {title ? <h3 className={lmsSectionHeadingClass}>{title}</h3> : <span />}
          <p className="shrink-0 text-sm font-bold tabular-nums text-[#2e2a58]">
            {scopedPurchases.length} รายการ
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-sm font-bold tabular-nums text-[#2e2a58]">
              {filtersActive
                ? `แสดง ${filtered.length}/${scopedPurchases.length}`
                : `${scopedPurchases.length} รายการ`}
            </p>
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls={filterId}
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              className={cn(
                lmsOutlineButtonClass,
                "relative min-h-[40px] min-w-[40px] px-0 sm:min-w-0 sm:px-3",
                filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
                filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
              )}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <IconFilter className="h-5 w-5" />
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              {filtersActive && !filterOpen ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500"
                  aria-hidden
                />
              ) : null}
            </button>
          </div>

          <div id={filterId} className={cn("mb-3 space-y-3", filterOpen ? "block" : "hidden")}>
            {statusChips.length > 0 ? (
              <div className={lmsFilterChipShellClass} role="tablist" aria-label="กรองตามสถานะ">
                {statusChips.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === opt.key}
                    className={lmsFilterChipClass(statusFilter === opt.key)}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label} ({statusCounts[opt.key]})
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
              <label className="min-w-0 flex-1 sm:max-w-sm" htmlFor={`${filterId}-q`}>
                <span className="text-xs font-bold text-[#4d47b6]">ค้นหา</span>
                <input
                  id={`${filterId}-q`}
                  className={cn(lmsFieldClass, "mt-1 min-h-[44px]")}
                  placeholder="ชื่อคอร์ส · นักเรียน · ยูสเซอร์"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </label>
              {filtersActive ? (
                <button
                  type="button"
                  className={cn(lmsOutlineButtonClass, "min-h-[44px] px-4")}
                  onClick={clearFilters}
                >
                  ล้างกรอง
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}

      {loading ? (
        <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
      ) : scopedPurchases.length === 0 ? (
        <AppEmptyState>{emptyLabel}</AppEmptyState>
      ) : filtered.length === 0 ? (
        <AppEmptyState>ไม่พบรายการ — ปรับตัวกรองหรือคำค้น</AppEmptyState>
      ) : (
        <ul className="space-y-3">
          {filtered.map((p) => (
            <li key={p.id} className={cn(lmsRowCardClass, "flex-col items-stretch gap-3")}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-[#1e1b4b]">{p.course?.title || "คอร์ส"}</p>
                  <p className="text-xs text-[#66638c]">
                    {p.learner?.fullName} (@{p.learner?.username}) · ฿{p.amountBaht.toLocaleString()} ·{" "}
                    {LMS_PURCHASE_PAY_METHOD_LABELS[p.payMethod]} · {LMS_PURCHASE_STATUS_LABELS[p.status]}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#9b97b8]">
                    {formatBangkokDateTimeLong(p.createdAt)}
                  </p>
                  {p.reviewerNote ? (
                    <p className="mt-1 text-xs font-semibold text-rose-700">{p.reviewerNote}</p>
                  ) : null}
                </div>
                {p.slipUrl ? (
                  <AppImageThumb
                    src={p.slipUrl}
                    alt="สลิป"
                    className="h-16 w-16"
                    onOpen={() => lb.open(p.slipUrl!)}
                  />
                ) : null}
              </div>
              {p.status === "PENDING_REVIEW" ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={lmsPrimaryButtonClass}
                    onClick={() => void reviewPurchase(p, "APPROVE")}
                  >
                    ยืนยันสลิป · บันทึกรายรับ
                  </button>
                  <button
                    type="button"
                    className={lmsOutlineButtonClass}
                    onClick={() => void reviewPurchase(p, "REJECT")}
                  >
                    ปฏิเสธ · ถอนสิทธิ์
                  </button>
                  <button
                    type="button"
                    className={cn(lmsOutlineButtonClass, "border-rose-300 text-rose-700")}
                    onClick={() => void reviewPurchase(p, "REJECT", { deactivateLearner: true })}
                  >
                    ปฏิเสธ + ปิดบัญชี
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
