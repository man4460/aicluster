"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { VillageEmptyDashed, VillagePageStack, VillagePanelCard } from "@/systems/village/components/VillagePageChrome";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { createVillageSessionApiRepository, type VillageHouse, type VillageSlip } from "@/systems/village/village-service";
import { villageBtnPrimary, villageBtnSecondary, villageField } from "@/systems/village/village-ui";
import { cn } from "@/lib/cn";

function currentYm(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" }).slice(0, 7);
}

const SLIP_STATUS_TH: Record<string, string> = {
  PENDING: "รอตรวจ",
  APPROVED: "อนุมัติแล้ว",
  REJECTED: "ปฏิเสธ",
};

function slipStatusLabel(status: string) {
  return SLIP_STATUS_TH[status] ?? status;
}

function slipStatusBadgeClass(status: string) {
  switch (status) {
    case "PENDING":
      return "border-amber-200/90 bg-amber-50 text-amber-900";
    case "APPROVED":
      return "border-emerald-200/90 bg-emerald-50 text-emerald-900";
    case "REJECTED":
      return "border-rose-200/90 bg-rose-50 text-rose-900";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function IconCheckMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function IconXMini({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function VillageNewSlipModal({
  open,
  onClose,
  api,
  houses,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  api: ReturnType<typeof createVillageSessionApiRepository>;
  houses: VillageHouse[];
  onUploaded: () => void;
}) {
  const [houseId, setHouseId] = useState("");
  const [ym, setYm] = useState(currentYm);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHouseId("");
    setYm(currentYm());
    setAmount("");
    setFile(null);
    setFileKey((k) => k + 1);
  }, [open]);

  const canSubmit = Boolean(houseId && file && amount.trim());

  return (
    <FormModal
      open={open}
      title="แนบสลิปใหม่"
      description="เลือกบ้าน เดือน ยอดเงิน และแนบรูปสลิป"
      onClose={onClose}
      size="md"
      footer={
        <FormModalFooterActions
          cancelLabel="ยกเลิก"
          onCancel={onClose}
          submitLabel="อัปโหลด"
          submitDisabled={!canSubmit || busy}
          loading={busy}
          onSubmit={async () => {
            if (!file || !houseId) return;
            setBusy(true);
            try {
              const fd = new FormData();
              fd.set("house_id", houseId);
              fd.set("year_month", ym.trim());
              fd.set("amount", amount.trim());
              fd.set("file", file);
              await api.postSlip(fd);
              onUploaded();
              onClose();
            } catch (e) {
              alert(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
            } finally {
              setBusy(false);
            }
          }}
        />
      }
    >
      <div className="grid gap-3 sm:gap-4">
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">บ้าน</span>
          <select className={villageField} value={houseId} onChange={(e) => setHouseId(e.target.value)}>
            <option value="">— เลือก —</option>
            {houses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.house_no}
                {h.owner_name ? ` · ${h.owner_name}` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">เดือน</span>
          <input type="month" className={`font-mono ${villageField}`} value={ym} onChange={(e) => setYm(e.target.value)} />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">จำนวนเงิน (บาท)</span>
          <input
            className={villageField}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="0"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-slate-500">รูปสลิป</span>
          <input
            key={fileKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="mt-0.5 w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-slate-100 file:px-3 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200/80"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </FormModal>
  );
}

export function VillageSlipsClient({ baseUrl }: { baseUrl: string }) {
  const api = useMemo(() => createVillageSessionApiRepository(), []);
  const [houses, setHouses] = useState<VillageHouse[]>([]);
  const [slips, setSlips] = useState<VillageSlip[]>([]);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");
  const [filterYm, setFilterYm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [newSlipOpen, setNewSlipOpen] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const q: { status?: string; year_month?: string } = {};
      if (filter === "PENDING") q.status = "PENDING";
      if (filterYm.trim()) q.year_month = filterYm.trim();
      const [h, s] = await Promise.all([api.getHouses(), api.getSlips(q)]);
      setHouses(h.houses);
      setSlips(s.slips);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    }
  }, [api, filter, filterYm]);

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const filterPill = (active: boolean) =>
    cn(
      "shrink-0 whitespace-nowrap rounded-full border border-transparent px-3 py-2 text-[11px] font-bold transition",
      "min-h-[40px] sm:min-h-0 sm:py-1.5",
      active
        ? "border-[#4d47b6]/25 bg-[#ecebff] text-[#4338ca] shadow-sm ring-1 ring-[#4d47b6]/15"
        : "border-slate-200/80 bg-white text-[#66638c] shadow-sm hover:border-slate-300 hover:bg-slate-50",
    );

  const [review, setReview] = useState<{ slip: VillageSlip; action: "APPROVED" | "REJECTED" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  return (
    <VillagePageStack>
      <VillagePanelCard title="สลิปโอนเงิน">
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={cn(villageBtnPrimary, "w-full justify-center gap-2 sm:w-auto sm:min-w-[12rem]")}
            onClick={() => setNewSlipOpen(true)}
          >
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
            แนบสลิปใหม่
          </button>

          <div className="border-t border-slate-200/70 pt-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
              <div className="min-w-0 flex-1">
                <span className="mb-1.5 block text-[10px] font-bold tracking-wide text-slate-400">กรองรายการ</span>
                <div
                  className="-mx-1 flex gap-1.5 overflow-x-auto overscroll-x-contain px-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:overflow-visible sm:px-0"
                  style={{ scrollbarColor: "rgb(203 213 225) transparent" }}
                >
                  <button type="button" className={filterPill(filter === "PENDING")} onClick={() => setFilter("PENDING")}>
                    รอตรวจ
                  </button>
                  <button type="button" className={filterPill(filter === "ALL")} onClick={() => setFilter("ALL")}>
                    ทั้งหมด
                  </button>
                </div>
              </div>
              <label className="min-w-0 flex-1 sm:max-w-[14rem]">
                <span className="mb-1 block text-[10px] font-bold tracking-wide text-slate-400">เดือน (ว่าง = ทุกเดือน)</span>
                <input
                  type="month"
                  className={`block w-full font-mono text-sm ${villageField}`}
                  value={filterYm}
                  onChange={(e) => setFilterYm(e.target.value)}
                />
              </label>
              <button type="button" className={cn(villageBtnSecondary, "w-full shrink-0 sm:w-auto sm:min-w-[7rem]")} onClick={() => void load()}>
                โหลดรายการ
              </button>
            </div>
          </div>
        </div>
      </VillagePanelCard>

      <VillageNewSlipModal
        open={newSlipOpen}
        onClose={() => setNewSlipOpen(false)}
        api={api}
        houses={houses}
        onUploaded={() => void load()}
      />

      {err ? <p className="text-sm text-rose-600">{err}</p> : null}

      <VillagePanelCard
        title="รายการสลิป"
        description={
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-snug text-[#66638c]">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100/90 px-2 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200/80">
              <span className="tabular-nums font-bold">{slips.length}</span> รายการ
            </span>
            {filter === "PENDING" ? (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-amber-900 ring-1 ring-amber-200/70">
                เฉพาะรอตรวจ
              </span>
            ) : null}
            {filterYm.trim() ? (
              <span className="font-mono text-[10px] font-semibold text-slate-600">เดือน {filterYm}</span>
            ) : null}
          </div>
        }
      >
        <ul className="grid list-none gap-2 sm:gap-2.5">
          {slips.map((s) => {
            const src = resolveAssetUrl(s.slip_image_url, baseUrl);
            const submitted = new Date(s.submitted_at).toLocaleString("th-TH", {
              timeZone: "Asia/Bangkok",
              dateStyle: "short",
              timeStyle: "short",
            });
            return (
              <li
                key={s.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-slate-50/95 p-2.5 shadow-sm ring-1 ring-slate-100/80 sm:p-3"
              >
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-400/90 via-fuchsia-300/80 to-emerald-400/85"
                  aria-hidden
                />
                <div className="flex gap-2.5 sm:gap-3">
                  {src ? (
                    <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="relative h-[4.75rem] w-[3.85rem] shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-inner ring-1 ring-slate-200/90 sm:h-[5.25rem] sm:w-[4.15rem]"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- URL จาก API / blob ไดนามิก */}
                      <img
                        src={src}
                        alt={`สลิปบ้าน ${s.house_no}`}
                        className="h-full w-full object-cover transition hover:opacity-95"
                      />
                      <span className="absolute bottom-0.5 right-0.5 rounded bg-black/45 px-1 py-px text-[7px] font-bold text-white backdrop-blur-[2px]">
                        ดู
                      </span>
                    </a>
                  ) : (
                    <div className="flex h-[4.75rem] w-[3.85rem] shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-[9px] font-medium text-slate-400 sm:h-[5.25rem] sm:w-[4.15rem]">
                      ไม่มีรูป
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold leading-tight text-slate-900 sm:text-sm">
                          บ้าน {s.house_no}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-slate-500">{s.year_month}</p>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold leading-none",
                          slipStatusBadgeClass(s.status),
                        )}
                      >
                        {slipStatusLabel(s.status)}
                      </span>
                    </div>
                    <p className="text-sm font-bold tabular-nums leading-tight text-emerald-800 sm:text-[15px]">
                      {s.amount.toLocaleString("th-TH")}{" "}
                      <span className="text-[11px] font-semibold text-emerald-700/90">บาท</span>
                    </p>
                    <p className="text-[10px] leading-tight text-slate-500">ส่ง {submitted}</p>
                    {s.reviewer_note ? (
                      <p className="line-clamp-2 rounded-md bg-slate-100/90 px-1.5 py-1 text-[10px] leading-snug text-slate-600 ring-1 ring-slate-200/60">
                        {s.reviewer_note}
                      </p>
                    ) : null}
                    {s.status === "PENDING" ? (
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:mt-2 sm:max-w-xs">
                        <button
                          type="button"
                          className="inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-emerald-200/90 bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white shadow-sm transition active:scale-[0.98] hover:bg-emerald-700 sm:min-h-[40px]"
                          onClick={() => {
                            setReviewNote("");
                            setReview({ slip: s, action: "APPROVED" });
                          }}
                        >
                          <IconCheckMini className="h-3.5 w-3.5 shrink-0" />
                          อนุมัติ
                        </button>
                        <button
                          type="button"
                          className="inline-flex min-h-[42px] items-center justify-center gap-1 rounded-xl border border-rose-200 bg-white px-2 py-1.5 text-[11px] font-bold text-rose-700 shadow-sm transition active:scale-[0.98] hover:bg-rose-50 sm:min-h-[40px]"
                          onClick={() => {
                            setReviewNote("");
                            setReview({ slip: s, action: "REJECTED" });
                          }}
                        >
                          <IconXMini className="h-3.5 w-3.5 shrink-0" />
                          ปฏิเสธ
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {slips.length === 0 ? (
          <div className="mt-2">
            <VillageEmptyDashed>ไม่มีสลิปในชุดที่เลือก — กด «แนบสลิปใหม่» เพื่อเพิ่ม</VillageEmptyDashed>
          </div>
        ) : null}
      </VillagePanelCard>

      {review ? (
        <FormModal
          open
          title={review.action === "APPROVED" ? "อนุมัติสลิป" : "ปฏิเสธสลิป"}
          description={`บ้าน ${review.slip.house_no} · ${review.slip.year_month}`}
          onClose={() => setReview(null)}
          size="md"
          footer={
            <FormModalFooterActions
              cancelLabel="ยกเลิก"
              onCancel={() => setReview(null)}
              submitLabel={review.action === "APPROVED" ? "อนุมัติ" : "ปฏิเสธ"}
              onSubmit={async () => {
                try {
                  await api.patchSlip(review.slip.id, {
                    status: review.action,
                    reviewer_note: reviewNote.trim() || null,
                  });
                  setReview(null);
                  void load();
                } catch (e) {
                  alert(e instanceof Error ? e.message : "ไม่สำเร็จ");
                }
              }}
            />
          }
        >
          <label className="block text-sm">
            <span className="text-xs font-medium text-slate-600">หมายเหตุถึงลูกบ้าน (ไม่บังคับ)</span>
            <textarea
              className={`mt-1.5 min-h-[5rem] w-full ${villageField}`}
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={review.action === "REJECTED" ? "เช่น ยอดไม่ตรง รูปไม่ชัด" : "เช่น รับยอดตามสลิปแล้ว"}
            />
          </label>
        </FormModal>
      ) : null}
    </VillagePageStack>
  );
}
