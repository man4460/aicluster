"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { VillageEmptyDashed, VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { VillageHousingQuickTabs } from "@/systems/village/components/VillageHousingQuickTabs";
import { VillageInvoiceSheetModal } from "@/systems/village/components/VillageInvoiceSheetModal";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { AppImageLightbox, useAppImageLightbox } from "@/components/app-templates";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import {
  createVillageSessionApiRepository,
  villageFeeCycleLabelTh,
  type VillageFeeRow,
} from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageDivider, villageField, villageGlassCard } from "@/systems/village/village-ui";

type FeeStatus = "PENDING" | "PARTIAL" | "PAID" | "WAIVED";

const STATUS_OPTIONS: FeeStatus[] = ["PENDING", "PARTIAL", "PAID", "WAIVED"];

const STATUS_LABEL_TH: Record<FeeStatus, string> = {
  PENDING: "ค้างชำระ",
  PARTIAL: "ชำระบางส่วน",
  PAID: "ชำระครบ",
  WAIVED: "ยกเว้น",
};

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
      />
    </svg>
  );
}

function IconPencil({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
      />
    </svg>
  );
}

function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function IconNoSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
      />
    </svg>
  );
}

function IconRefresh({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden>
      <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconInvoice({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 3.75h7.5A1.5 1.5 0 0 1 17.25 5.25v13.5l-2.25-1.5-2.25 1.5-2.25-1.5-2.25 1.5V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
      />
      <path strokeLinecap="round" d="M9.75 7.5h4.5M9.75 10.5h4.5M9.75 13.5h3" />
    </svg>
  );
}

function feeRowInvoiceAvailable(r: VillageFeeRow): boolean {
  return (r.status === "PENDING" || r.status === "PARTIAL") && r.amount_due - r.amount_paid > 0;
}

function feeStatusBadgeClass(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-800";
    case "PARTIAL":
      return "border-amber-200/90 bg-amber-50 text-amber-900";
    case "WAIVED":
      return "border-violet-200/80 bg-violet-50 text-violet-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function feeCollectionPercent(r: VillageFeeRow) {
  if (r.amount_due <= 0) return r.amount_paid > 0 ? 100 : 0;
  return Math.round(Math.min(100, (r.amount_paid / r.amount_due) * 100));
}

function feeStatusLabel(status: string): string {
  if (STATUS_OPTIONS.includes(status as FeeStatus)) return STATUS_LABEL_TH[status as FeeStatus];
  return status;
}

function VillageFeeRowCard({
  r,
  baseUrl,
  api,
  onEdit,
  onInvoice,
  onReload,
}: {
  r: VillageFeeRow;
  baseUrl: string;
  api: ReturnType<typeof createVillageSessionApiRepository>;
  onEdit: () => void;
  onInvoice: () => void;
  onReload: () => void;
}) {
  const lb = useAppImageLightbox();
  const statusLabel = feeStatusLabel(r.status);
  const slip = r.pending_slip;
  const slipSrc = slip ? resolveAssetUrl(slip.slip_image_url, baseUrl) : null;
  const canInvoice = feeRowInvoiceAvailable(r);

  async function reviewSlip(action: "APPROVED" | "REJECTED") {
    if (!slip) return;
    const ok = window.confirm(
      action === "APPROVED"
        ? `อนุมัติสลิปบ้าน ${r.house_no} ยอด ${slip.amount.toLocaleString("th-TH")} บาท?`
        : `ปฏิเสธสลิปบ้าน ${r.house_no}?`,
    );
    if (!ok) return;
    try {
      await api.patchSlip(slip.id, { status: action, reviewer_note: null });
      onReload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }

  return (
    <>
      <article
        className={cn(
          "relative flex h-[5.5rem] w-full items-center gap-2 overflow-hidden rounded-[1.25rem] px-2.5 py-2 sm:h-[5.75rem] sm:gap-3 sm:rounded-[1.5rem] sm:px-3.5",
          villageGlassCard,
          "hover:border-white/80 hover:shadow-[0_16px_34px_-22px_rgba(79,70,229,0.32)]",
        )}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-[#5b61ff]/85 via-[#c4b5fd]/70 to-[#5b61ff]/45"
          aria-hidden
        />

        <div className="flex min-w-0 flex-[1.2] items-center gap-2 pl-1 sm:gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff]/15 to-[#6a63ff]/10 text-[#5b61ff] sm:h-11 sm:w-11">
            <IconHome className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tabular-nums tracking-tight text-slate-900 sm:text-base">
              บ้าน {r.house_no}
            </p>
            <p className="mt-0.5 truncate text-[10px] leading-snug text-slate-500 sm:text-[11px]">
              {r.owner_name?.trim() || "—"} · {villageFeeCycleLabelTh(r.fee_cycle)}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 shrink-0 items-center gap-3 sm:flex sm:w-[11rem]">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold text-slate-400">เรียกเก็บ</p>
            <p className="truncate text-sm font-bold tabular-nums text-slate-900">{r.amount_due.toLocaleString("th-TH")}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold text-emerald-700/70">รับแล้ว</p>
            <p className="truncate text-sm font-bold tabular-nums text-emerald-800">{r.amount_paid.toLocaleString("th-TH")}</p>
          </div>
        </div>

        <div className="flex w-[4.5rem] shrink-0 flex-col items-start gap-0.5 sm:hidden">
          <p className="text-[10px] font-bold tabular-nums text-slate-900">{r.amount_due.toLocaleString("th-TH")}</p>
          <p className="text-[10px] font-bold tabular-nums text-emerald-800">{r.amount_paid.toLocaleString("th-TH")}</p>
        </div>

        <span
          className={cn(
            "hidden shrink-0 rounded-full border px-2 py-1 text-[10px] font-bold leading-none tracking-tight md:inline-flex",
            feeStatusBadgeClass(r.status),
          )}
        >
          {statusLabel}
        </span>

        <div className="flex h-14 w-[7.5rem] shrink-0 items-center gap-1.5 sm:w-[8.25rem]">
          {slipSrc ? (
            <>
              <button
                type="button"
                className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-amber-200/90 bg-white shadow-sm ring-1 ring-amber-100"
                onClick={() => lb.open(slipSrc)}
                aria-label={`ดูสลิปรอตรวจ บ้าน ${r.house_no}`}
                title="ดูสลิปรอตรวจ"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slipSrc} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 py-px text-center text-[8px] font-bold text-white">
                  รอตรวจ
                </span>
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700"
                  onClick={() => void reviewSlip("APPROVED")}
                  aria-label="อนุมัติสลิป"
                  title="อนุมัติสลิป"
                >
                  <IconCheckCircle className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-rose-200 bg-rose-50 text-rose-600"
                  onClick={() => void reviewSlip("REJECTED")}
                  aria-label="ปฏิเสธสลิป"
                  title="ปฏิเสธสลิป"
                >
                  <IconNoSymbol className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-14 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-200/90 bg-white/50 px-1 text-center">
              <p className="text-[9px] font-semibold leading-tight text-slate-400">ยังไม่มีสลิป</p>
            </div>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {canInvoice ? (
            <button
              type="button"
              className="inline-flex h-10 min-w-[40px] items-center justify-center gap-1 rounded-xl border border-[#4d47b6]/25 bg-[#ecebff] px-2 text-[10px] font-bold text-[#3730a3] sm:min-w-[5.5rem] sm:px-2.5"
              onClick={onInvoice}
              aria-label={`เปิดใบแจ้งหนี้ บ้าน ${r.house_no}`}
              title="ใบแจ้งหนี้ · QR · ลิงก์แนบสลิป"
            >
              <IconInvoice className="h-4 w-4" />
              <span className="hidden sm:inline">แจ้งหนี้</span>
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-[#3730a3]"
            onClick={onEdit}
            aria-label={`แก้ยอด บ้าน ${r.house_no}`}
            title="แก้ยอด"
          >
            <IconPencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-200/90 bg-emerald-50/80 text-emerald-800"
            onClick={async () => {
              try {
                await api.patchFeeRow(r.id, { amount_paid: r.amount_due, status: "PAID" });
                onReload();
              } catch (e) {
                alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
              }
            }}
            aria-label={`ชำระครบ บ้าน ${r.house_no}`}
            title="ชำระครบ"
          >
            <IconCheckCircle className="h-4 w-4" />
          </button>
        </div>
      </article>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt={`สลิปบ้าน ${r.house_no}`} />
    </>
  );
}

function FeeEditModal({
  api,
  row,
  onClose,
  onSave,
}: {
  api: ReturnType<typeof createVillageSessionApiRepository>;
  row: VillageFeeRow;
  onClose: () => void;
  onSave: () => void;
}) {
  const [due, setDue] = useState(String(row.amount_due));
  const [paid, setPaid] = useState(String(row.amount_paid));
  const [status, setStatus] = useState<FeeStatus>((row.status as FeeStatus) || "PENDING");
  const [note, setNote] = useState(row.note ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <FormModal
      open
      title={`แก้บิล ${row.house_no}`}
      description={`เดือน ${row.year_month}`}
      onClose={onClose}
      size="md"
      footer={
        <FormModalFooterActions
          cancelLabel="ยกเลิก"
          onCancel={onClose}
          submitLabel="บันทึก"
          submitDisabled={busy}
          loading={busy}
          onSubmit={async () => {
            const d = Number.parseInt(due, 10);
            const p = Number.parseInt(paid, 10);
            if (!Number.isFinite(d) || d < 0 || !Number.isFinite(p) || p < 0) {
              alert("กรอกยอดเป็นตัวเลขเท่านั้น");
              return;
            }
            setBusy(true);
            try {
              await api.patchFeeRow(row.id, {
                amount_due: d,
                amount_paid: p,
                status,
                note: note.trim() || null,
              });
              onSave();
            } catch (e) {
              alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">ยอดเรียกเก็บ (บาท)</span>
          <input
            className={`mt-1.5 ${villageField}`}
            value={due}
            onChange={(e) => setDue(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">ยอดรับแล้ว (บาท)</span>
          <input
            className={`mt-1.5 ${villageField}`}
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            inputMode="numeric"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">สถานะ</span>
          <select
            className={`mt-1.5 ${villageField}`}
            value={status}
            onChange={(e) => setStatus(e.target.value as FeeStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL_TH[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">หมายเหตุ (ถ้ามี)</span>
          <input className={`mt-1.5 ${villageField}`} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
    </FormModal>
  );
}

export function VillageFeesClient({ initialYm, baseUrl }: { initialYm: string; baseUrl: string }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [ym, setYm] = useState(initialYm);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [rows, setRows] = useState<VillageFeeRow[]>([]);
  const [defaultFee, setDefaultFee] = useState(0);
  const [dueDay, setDueDay] = useState(5);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<VillageFeeRow | null>(null);
  const [invoiceRow, setInvoiceRow] = useState<VillageFeeRow | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.getFeeRows(ym, statusFilter ?? undefined);
      setRows(
        (r.fee_rows ?? []).map((row) => ({
          ...row,
          pending_slip: row.pending_slip ?? null,
        })),
      );
      setDefaultFee(r.default_monthly_fee);
      setDueDay(r.due_day_of_month);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [api, ym, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const filterPill = (active: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full border border-transparent px-3 py-2 text-[11px] font-bold transition",
      "min-h-[40px] sm:min-h-0 sm:py-1.5",
      active
        ? "border-[#4d47b6]/25 bg-[#ecebff] text-[#4338ca] shadow-sm ring-1 ring-[#4d47b6]/15"
        : "border-slate-200/80 bg-white text-[#66638c] shadow-sm hover:border-slate-300 hover:bg-slate-50",
    );

  return (
    <VillagePageStack>
      <VillageHousingQuickTabs />
      <VillagePanelCard
        title="ค่าส่วนกลาง"
        description={
          <>
            <span className="sm:hidden">บิล · ใบแจ้งหนี้ · สลิปรอตรวจ ในแถวเดียวกัน</span>
            <span className="hidden sm:inline">
              จัดการบิลรายเดือน เปิดใบแจ้งหนี้ และอนุมัติสลิปจากการ์ดแถวเดียว ความสูงเท่ากันทุกหลัง
            </span>
          </>
        }
      >
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
            <span className="text-slate-400">ค่ามาตรฐาน</span>
            <span className="tabular-nums text-slate-800">{defaultFee.toLocaleString("th-TH")} บาท</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-50/90 to-violet-50/80 px-2.5 py-1 text-[10px] font-semibold text-indigo-900/90 ring-1 ring-indigo-200/60">
            ครบกำหนดวันที่ <span className="tabular-nums">{dueDay}</span>
          </span>
        </div>

        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-3">
          <label className="min-w-0">
            <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#6366f1]" aria-hidden />
              เดือนบิล
            </span>
            <input
              type="month"
              className={`block w-full font-mono text-sm ${villageField}`}
              value={ym}
              onChange={(e) => setYm(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:gap-2">
            <button
              type="button"
              className={cn(villageBtnSecondary, "w-full sm:w-auto sm:min-w-[5.5rem]")}
              onClick={() => void load()}
              aria-label="โหลดรายการ"
              title="โหลดรายการ"
            >
              <IconRefresh className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">โหลด</span>
            </button>
            <button
              type="button"
              className={cn(villageBtnPrimary, "w-full sm:w-auto sm:min-w-[6.5rem]")}
              onClick={async () => {
                try {
                  await api.generateFeeRows(ym);
                  void load();
                } catch (e) {
                  alert(e instanceof Error ? e.message : "สร้างรายการไม่สำเร็จ");
                }
              }}
            >
              <IconPlus className="h-4 w-4 sm:hidden" />
              <span className="sm:hidden">สร้าง/เติม</span>
              <span className="hidden sm:inline">+ สร้าง/เติมทุกหลัง</span>
            </button>
          </div>
        </div>

        <div className={cn("mt-4 border-t pt-3", villageDivider)}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="shrink-0 text-[10px] font-bold tracking-wide text-slate-400">กรองสถานะ</span>
            <div
              className="-mx-1 min-w-0 flex-1 overflow-x-auto overscroll-x-contain px-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:overflow-visible sm:px-0"
              style={{ scrollbarColor: "rgb(203 213 225) transparent" }}
            >
              <div className="flex w-max gap-1.5 sm:w-auto sm:flex-wrap sm:gap-2">
                <button type="button" className={filterPill(statusFilter == null)} onClick={() => setStatusFilter(null)}>
                  ทั้งหมด
                </button>
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={filterPill(statusFilter === s)}
                    onClick={() => setStatusFilter(s)}
                  >
                    {STATUS_LABEL_TH[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("mt-4 border-t pt-3.5", villageDivider)}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-black tracking-tight text-[#1e1b4b]">รายการบิล · ใบแจ้งหนี้ · สลิป</h3>
            <p className="text-xs text-[#66638c]">
              เดือน <span className="font-mono font-semibold text-slate-700">{ym}</span> ·{" "}
              <span className="tabular-nums">{rows.length}</span> รายการ
            </p>
          </div>
          {err ? <p className="mt-2 text-sm text-rose-600">{err}</p> : null}
          {loading ? (
            <p className="mt-3 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
          ) : rows.length === 0 ? (
            <div className="mt-3">
              <VillageEmptyDashed>ยังไม่มีรายการ — กด «สร้าง/เติมทุกหลัง» เพื่อสร้างบิลทุกบ้าน</VillageEmptyDashed>
            </div>
          ) : (
            <ul className="mt-3 flex list-none flex-col gap-2">
              {rows.map((r) => (
                <li key={r.id} className="w-full">
                  <VillageFeeRowCard
                    r={r}
                    baseUrl={baseUrl}
                    api={api}
                    onEdit={() => setEditRow(r)}
                    onInvoice={() => setInvoiceRow(r)}
                    onReload={() => void load()}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </VillagePanelCard>
      {editRow ? (
        <FeeEditModal
          api={api}
          row={editRow}
          onClose={() => setEditRow(null)}
          onSave={() => {
            setEditRow(null);
            void load();
          }}
        />
      ) : null}
      {invoiceRow ? (
        <VillageInvoiceSheetModal
          feeRowId={invoiceRow.id}
          houseNo={invoiceRow.house_no}
          onClose={() => {
            setInvoiceRow(null);
            void load();
          }}
        />
      ) : null}
    </VillagePageStack>
  );
}
