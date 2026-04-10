"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { VillageEmptyDashed, VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  createVillageSessionApiRepository,
  villageFeeCycleLabelTh,
  type VillageFeeRow,
} from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageField } from "@/systems/village/village-ui";

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

function IconBanknote({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.65} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18.75a60.07 60.07 0 0 0 15.797 2.101c.727 0 1.453-.037 2.176-.11V17.48c-.557.304-1.186.498-1.858.511-1.064.024-2.125-.195-3.09-.57a48.554 48.554 0 0 1-3.036-1.452M2.25 18.75V5.625A2.625 2.625 0 0 1 4.875 3h14.25A2.625 2.625 0 0 1 21.75 5.625v13.125M21.75 18.75v-1.875a2.625 2.625 0 0 0-2.625-2.625h-1.5M2.25 18.75h1.5a2.625 2.625 0 0 0 2.625-2.625v-1.5"
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
  api,
  onEdit,
  onReload,
}: {
  r: VillageFeeRow;
  api: ReturnType<typeof createVillageSessionApiRepository>;
  onEdit: () => void;
  onReload: () => void;
}) {
  const pct = feeCollectionPercent(r);
  const statusLabel = feeStatusLabel(r.status);

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 p-3 shadow-sm transition",
        "hover:border-[#4d47b6]/22 hover:shadow-md",
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#818cf8] via-[#c4b5fd] to-[#7dd3fc]"
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 pt-0.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4d47b6]/12 to-[#6366f1]/8 text-[#4338ca] shadow-inner">
            <IconHome className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tabular-nums tracking-tight text-slate-900">บ้าน {r.house_no}</p>
            <p className="mt-0.5 truncate text-[11px] leading-snug text-slate-500">
              {r.owner_name?.trim() || "—"} · {villageFeeCycleLabelTh(r.fee_cycle)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold leading-none tracking-tight",
            feeStatusBadgeClass(r.status),
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white/90 px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <IconBanknote className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-wide text-slate-400">เรียกเก็บ</p>
            <p className="truncate text-sm font-bold tabular-nums text-slate-900">{r.amount_due.toLocaleString("th-TH")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100/80 bg-emerald-50/40 px-2.5 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-emerald-700">
            <IconBanknote className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold tracking-wide text-emerald-800/70">รับแล้ว</p>
            <p className="truncate text-sm font-bold tabular-nums text-emerald-900">{r.amount_paid.toLocaleString("th-TH")}</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5">
        <div className="mb-1 flex justify-between text-[10px] font-medium text-slate-500">
          <span>เก็บได้</span>
          <span className="tabular-nums text-slate-700">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {r.note?.trim() ? (
        <p className="mt-2 line-clamp-2 rounded-lg bg-slate-100/80 px-2 py-1.5 text-[10px] leading-snug text-slate-600">
          {r.note.trim()}
        </p>
      ) : null}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          className="inline-flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200/90 bg-white px-1 py-1.5 text-[10px] font-bold text-[#3730a3] shadow-sm transition active:scale-[0.98] hover:bg-[#eef2ff] sm:min-h-[40px]"
          onClick={onEdit}
        >
          <IconPencil className="h-4 w-4" />
          แก้ยอด
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-1 py-1.5 text-[10px] font-bold text-emerald-800 shadow-sm transition active:scale-[0.98] hover:bg-emerald-100/90 sm:min-h-[40px]"
          onClick={async () => {
            try {
              await api.patchFeeRow(r.id, { amount_paid: r.amount_due, status: "PAID" });
              onReload();
            } catch (e) {
              alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
            }
          }}
        >
          <IconCheckCircle className="h-4 w-4" />
          ชำระครบ
        </button>
        <button
          type="button"
          className="inline-flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200/90 bg-slate-50 px-1 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm transition active:scale-[0.98] hover:bg-slate-100 sm:min-h-[40px]"
          onClick={async () => {
            try {
              await api.patchFeeRow(r.id, { status: "WAIVED" });
              onReload();
            } catch (e) {
              alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
            }
          }}
        >
          <IconNoSymbol className="h-4 w-4" />
          ยกเว้น
        </button>
      </div>
    </article>
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

export function VillageFeesClient({ initialYm }: { initialYm: string }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [ym, setYm] = useState(initialYm);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [rows, setRows] = useState<VillageFeeRow[]>([]);
  const [defaultFee, setDefaultFee] = useState(0);
  const [dueDay, setDueDay] = useState(5);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<VillageFeeRow | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.getFeeRows(ym, statusFilter ?? undefined);
      setRows(r.fee_rows);
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
      <VillagePanelCard title="เดือนและการทำงาน">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
            <span className="text-slate-400">ค่ามาตรฐาน</span>
            <span className="tabular-nums text-slate-800">{defaultFee.toLocaleString("th-TH")} บาท</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-50/90 to-violet-50/80 px-2.5 py-1 text-[10px] font-semibold text-indigo-900/90 ring-1 ring-indigo-200/60">
            ครบกำหนดวันที่ <span className="tabular-nums">{dueDay}</span>
          </span>
          <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/80">
            รอบเรียกเก็บต่อหลัง
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
            <button type="button" className={cn(villageBtnSecondary, "w-full sm:w-auto sm:min-w-[5.5rem]")} onClick={() => void load()}>
              โหลด
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
              <span className="sm:hidden">+ สร้าง/เติม</span>
              <span className="hidden sm:inline">+ สร้าง/เติมทุกหลัง</span>
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-slate-200/70 pt-3">
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
      </VillagePanelCard>
      {err ? <p className="text-sm text-rose-600">{err}</p> : null}
      {loading ? (
        <VillagePanelCard>
          <p className="text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        </VillagePanelCard>
      ) : null}
      {!loading ? (
        <VillagePanelCard
          title="รายการบิลรายเดือน"
          description={
            <>
              เดือน <span className="font-mono font-semibold text-slate-700">{ym}</span> ·{" "}
              <span className="tabular-nums">{rows.length}</span> รายการ
            </>
          }
        >
          {rows.length === 0 ? (
            <VillageEmptyDashed>ยังไม่มีรายการ — กด «สร้าง/เติมทุกหลัง» เพื่อสร้างบิลทุกบ้าน</VillageEmptyDashed>
          ) : (
            <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((r) => (
                <li key={r.id}>
                  <VillageFeeRowCard
                    r={r}
                    api={api}
                    onEdit={() => setEditRow(r)}
                    onReload={() => void load()}
                  />
                </li>
              ))}
            </ul>
          )}
        </VillagePanelCard>
      ) : null}
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
    </VillagePageStack>
  );
}
