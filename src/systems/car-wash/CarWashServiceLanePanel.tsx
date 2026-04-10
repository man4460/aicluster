"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  AppCameraCaptureModal,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImageLightbox,
  AppImagePickCameraButtons,
  AppImageThumb,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
} from "@/components/app-templates";
import { resolveAssetUrl } from "@/components/qr/shop-qr-template";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { FormModal } from "@/components/ui/FormModal";
import { CAR_WASH_SERVICE_STATUSES, carWashStatusLabelTh } from "@/lib/car-wash/service-status";
import {
  buildCarWashVisitBillInnerHtml,
  openCarWashVisitBillPrintWindow,
  type PosTablePaperSize,
} from "@/systems/car-wash/car-wash-visit-bill-print";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import {
  uploadCarWashSessionImage,
  type CarWashServiceStatus,
  type ServicePackage,
  type ServiceVisit,
} from "@/systems/car-wash/car-wash-service";

const laneTone: Record<
  Exclude<CarWashServiceStatus, "COMPLETED" | "PAID">,
  { border: string; bg: string; ring: string; badge: string; hoverBorder: string }
> = {
  QUEUED: {
    border: "border-amber-300/90",
    bg: "bg-amber-50/90",
    ring: "ring-amber-200/80",
    badge: "bg-amber-100 text-amber-900 ring-amber-200/70",
    hoverBorder: "hover:border-amber-400",
  },
  WASHING: {
    border: "border-sky-300/90",
    bg: "bg-sky-50/90",
    ring: "ring-sky-200/80",
    badge: "bg-sky-100 text-sky-900 ring-sky-200/70",
    hoverBorder: "hover:border-sky-400",
  },
  VACUUMING: {
    border: "border-violet-300/90",
    bg: "bg-violet-50/90",
    ring: "ring-violet-200/80",
    badge: "bg-violet-100 text-violet-900 ring-violet-200/70",
    hoverBorder: "hover:border-violet-400",
  },
  WAXING: {
    border: "border-teal-300/90",
    bg: "bg-teal-50/90",
    ring: "ring-teal-200/80",
    badge: "bg-teal-100 text-teal-900 ring-teal-200/70",
    hoverBorder: "hover:border-teal-400",
  },
};

function activeLaneKey(s: CarWashServiceStatus): Exclude<CarWashServiceStatus, "COMPLETED" | "PAID"> {
  if (s === "QUEUED" || s === "WASHING" || s === "VACUUMING" || s === "WAXING") return s;
  return "WASHING";
}

function isVisitToday(iso: string): boolean {
  return bangkokDateKey(new Date(iso)) === bangkokDateKey();
}

function minsSince(iso: string, nowMs: number): number {
  return Math.max(0, Math.floor((nowMs - new Date(iso).getTime()) / 60_000));
}

function modalDetailBoxClass(st: CarWashServiceStatus): string {
  const k = activeLaneKey(st);
  const map: Record<typeof k, string> = {
    QUEUED: "border-amber-200 bg-amber-50/80",
    WASHING: "border-sky-200 bg-sky-50/80",
    VACUUMING: "border-violet-200 bg-violet-50/80",
    WAXING: "border-teal-200 bg-teal-50/80",
  };
  return map[k];
}

function modalBadgeClass(st: CarWashServiceStatus): string {
  const k = activeLaneKey(st);
  const map: Record<typeof k, string> = {
    QUEUED: "bg-amber-100 text-amber-900 ring-amber-200",
    WASHING: "bg-sky-100 text-sky-900 ring-sky-200",
    VACUUMING: "bg-violet-100 text-violet-900 ring-violet-200",
    WAXING: "bg-teal-100 text-teal-900 ring-teal-200",
  };
  return map[k];
}

function hasLaneSlipPhoto(v: ServiceVisit): boolean {
  return Boolean(v.photo_url?.trim());
}

/** รายการเหมาจ่ายที่ยังไม่หักครั้ง — ปิดคิว (PAID) ได้เมื่อเสร็จแล้ว โดยไม่บังคับสลิป */
function isPendingBundleVisit(v: ServiceVisit): boolean {
  return v.bundle_id != null;
}

function canSelectPaidLane(v: ServiceVisit): boolean {
  if (v.service_status !== "COMPLETED") return false;
  if (isPendingBundleVisit(v)) return true;
  return hasLaneSlipPhoto(v);
}

/** ยังแสดงในลานล้างวันนี้: วันนี้ และยังไม่เลือกสถานะชำระแล้ว (PAID) */
function isInServiceLaneToday(v: ServiceVisit): boolean {
  return isVisitToday(v.visit_at) && v.service_status !== "PAID";
}

/** เสร็จสิ้นแล้วแต่ต้องแนบสลิปก่อนถึงจะออกจากลาน */
const waitingSlipLaneTone: (typeof laneTone)["WASHING"] = {
  border: "border-orange-300/90",
  bg: "bg-orange-50/90",
  ring: "ring-orange-200/80",
  badge: "bg-orange-100 text-orange-950 ring-orange-200/70",
  hoverBorder: "hover:border-orange-400",
};

const waitingSlipModalBoxClass = "border-orange-200 bg-orange-50/80";
const waitingSlipModalBadgeClass = "bg-orange-100 text-orange-950 ring-orange-200";

/** เสร็จแล้ว + มีสลิป แต่ยังไม่ชำระ — รอเลือก PAID */
const waitingPayLaneTone: (typeof laneTone)["WASHING"] = {
  border: "border-emerald-300/90",
  bg: "bg-emerald-50/90",
  ring: "ring-emerald-200/80",
  badge: "bg-emerald-100 text-emerald-950 ring-emerald-200/70",
  hoverBorder: "hover:border-emerald-400",
};

const waitingPayModalBoxClass = "border-emerald-200 bg-emerald-50/80";
const waitingPayModalBadgeClass = "bg-emerald-100 text-emerald-950 ring-emerald-200";

export function CarWashServiceLanePanel({
  visits,
  packages,
  baseUrl,
  shopLabel,
  logoUrl = null,
  paymentChannelsNote = null,
  busyVisitId,
  onSetStatus,
  onVisitPhotoUpdate,
  onRecordVisit,
}: {
  visits: ServiceVisit[];
  packages: ServicePackage[];
  baseUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  paymentChannelsNote?: string | null;
  busyVisitId: number | null;
  onSetStatus: (id: number, status: CarWashServiceStatus) => void | Promise<void>;
  onVisitPhotoUpdate: (id: number, photoUrl: string) => void | Promise<void>;
  onRecordVisit?: () => void;
}) {
  const lightbox = useAppImageLightbox();
  const [laneModalVisitId, setLaneModalVisitId] = useState<number | null>(null);
  const [laneModalView, setLaneModalView] = useState<"details" | "bill">("details");
  const [billPrintedAt, setBillPrintedAt] = useState("");
  const [ppQrUrl, setPpQrUrl] = useState<string | null>(null);
  const [ppQrLoading, setPpQrLoading] = useState(false);
  const [ppConfigured, setPpConfigured] = useState(true);
  const [lanePhotoBusy, setLanePhotoBusy] = useState(false);
  const [laneCameraOpen, setLaneCameraOpen] = useState(false);
  /** หลัง mount เท่านั้น — กัน SSR กับ client ใช้ Date.now() คนละค่าตอน hydrate */
  const [laneClockMs, setLaneClockMs] = useState<number | null>(null);

  const laneGalleryInputRef = useRef<HTMLInputElement>(null);
  const laneCameraInputRef = useRef<HTMLInputElement>(null);
  const lanePhotoTargetVisitIdRef = useRef<number | null>(null);

  const active = useMemo(() => {
    return visits
      .filter((v) => isInServiceLaneToday(v))
      .sort((a, b) => new Date(a.visit_at).getTime() - new Date(b.visit_at).getTime());
  }, [visits]);

  const modalVisit = useMemo(() => {
    if (laneModalVisitId == null) return null;
    return visits.find((v) => v.id === laneModalVisitId) ?? null;
  }, [visits, laneModalVisitId]);

  const photoResolved = modalVisit ? resolveAssetUrl(modalVisit.photo_url, baseUrl) : null;
  const rowBusy = modalVisit != null && busyVisitId === modalVisit.id;
  const modalLaneWaitingSlip =
    modalVisit != null &&
    modalVisit.service_status === "COMPLETED" &&
    !hasLaneSlipPhoto(modalVisit) &&
    !isPendingBundleVisit(modalVisit);
  const modalLaneWaitingPay =
    modalVisit != null &&
    modalVisit.service_status === "COMPLETED" &&
    (hasLaneSlipPhoto(modalVisit) || isPendingBundleVisit(modalVisit));

  useEffect(() => {
    setLaneClockMs(Date.now());
    const id = window.setInterval(() => setLaneClockMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (laneModalVisitId == null) return;
    const v = visits.find((x) => x.id === laneModalVisitId);
    if (!v || !isInServiceLaneToday(v)) {
      setLaneModalVisitId(null);
    }
  }, [visits, laneModalVisitId]);

  useEffect(() => {
    if (laneModalVisitId == null) return;
    setLaneModalView("details");
    setBillPrintedAt(
      new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }),
    );
  }, [laneModalVisitId]);

  useEffect(() => {
    if (laneModalView !== "bill" || !modalVisit) {
      setPpQrUrl(null);
      setPpQrLoading(false);
      return;
    }
    const amt = modalVisit.final_price;
    if (amt <= 0) {
      setPpQrUrl(null);
      return;
    }
    let cancelled = false;
    setPpQrLoading(true);
    void fetch("/api/car-wash/session/promptpay-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amount: amt }),
    })
      .then(async (r) => {
        const data = (await r.json()) as {
          qrDataUrl?: string | null;
          configured?: boolean;
        };
        if (cancelled) return;
        setPpConfigured(data.configured !== false);
        setPpQrUrl(data.qrDataUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setPpQrUrl(null);
          setPpConfigured(true);
        }
      })
      .finally(() => {
        if (!cancelled) setPpQrLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [laneModalView, modalVisit?.id, modalVisit?.final_price]);

  const finalizeLanePhoto = useCallback(
    async (file: File) => {
      const id = lanePhotoTargetVisitIdRef.current;
      lanePhotoTargetVisitIdRef.current = null;
      if (id == null) return;
      setLanePhotoBusy(true);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url = await uploadCarWashSessionImage(prepared);
        await onVisitPhotoUpdate(id, url);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
      } finally {
        setLanePhotoBusy(false);
      }
    },
    [onVisitPhotoUpdate],
  );

  const onLaneGalleryChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await finalizeLanePhoto(file);
    },
    [finalizeLanePhoto],
  );

  const openLaneGalleryPicker = useCallback(() => {
    if (!modalVisit || rowBusy || lanePhotoBusy) return;
    lanePhotoTargetVisitIdRef.current = modalVisit.id;
    laneGalleryInputRef.current?.click();
  }, [modalVisit, rowBusy, lanePhotoBusy]);

  const openLaneCameraPicker = useCallback(() => {
    if (!modalVisit || rowBusy || lanePhotoBusy) return;
    lanePhotoTargetVisitIdRef.current = modalVisit.id;
    setLaneCameraOpen(true);
  }, [modalVisit, rowBusy, lanePhotoBusy]);

  const onLaneCameraModalClose = useCallback(() => {
    setLaneCameraOpen(false);
    lanePhotoTargetVisitIdRef.current = null;
  }, []);

  const onLaneCameraCaptured = useCallback(
    async (file: File) => {
      setLaneCameraOpen(false);
      await finalizeLanePhoto(file);
    },
    [finalizeLanePhoto],
  );

  const onLaneCameraLegacyPicker = useCallback(() => {
    setLaneCameraOpen(false);
    requestAnimationFrame(() => laneCameraInputRef.current?.click());
  }, []);

  const handlePrintBill = useCallback(
    (paper: PosTablePaperSize) => {
      if (!modalVisit) return;
      const inner = buildCarWashVisitBillInnerHtml({
        shopLabel,
        logoUrl,
        plateLabel: modalVisit.plate_number.trim() || "—",
        billPrintedAt: billPrintedAt || "—",
        visit: modalVisit,
        paymentChannelsNote,
        ppQrUrl,
      });
      const ok = openCarWashVisitBillPrintWindow(paper, inner);
      if (!ok) {
        window.alert(
          "ไม่สามารถเปิดหน้าพิมพ์ได้ — ลองอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ หรือรีเฟรชแล้วลองอีกครั้ง",
        );
      }
    },
    [modalVisit, shopLabel, logoUrl, billPrintedAt, paymentChannelsNote, ppQrUrl],
  );

  async function clearLanePhoto() {
    if (!modalVisit) return;
    if (!confirm("ลบรูปแนบออกจากรายการนี้?")) return;
    try {
      await onVisitPhotoUpdate(modalVisit.id, "");
    } catch {
      window.alert("ล้างรูปไม่สำเร็จ");
    }
  }

  const printFooterRow = (
    <div className="flex flex-wrap gap-2">
      <button type="button" className={appTemplateOutlineButtonClass} onClick={() => handlePrintBill("SLIP_58")}>
        พิมพ์ 58 mm
      </button>
      <button type="button" className={appTemplateOutlineButtonClass} onClick={() => handlePrintBill("SLIP_80")}>
        พิมพ์ 80 mm
      </button>
      <button type="button" className={appTemplateOutlineButtonClass} onClick={() => handlePrintBill("A4")}>
        พิมพ์ A4
      </button>
    </div>
  );

  return (
    <AppDashboardSection tone="violet">
      <div className="flex flex-col gap-3 border-b border-[#ecebff] pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#2e2a58]">ลานล้างวันนี้</h2>
          <p className="mt-1 text-xs text-[#66638c]">
            คิวที่ยังอยู่ในลาน — แนบสลิปเมื่อเสร็จงาน แล้วเลือกสถานะ &quot;ชำระแล้ว&quot; ถึงจะออกจากลาน — แตะการ์ดเพื่อแนบรูป / บิลพร้อมเพย์
          </p>
        </div>
        {onRecordVisit ?
          <button
            type="button"
            onClick={onRecordVisit}
            className="app-btn-primary shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold sm:self-center"
          >
            <span aria-hidden>➕</span> บันทึกรายการ
          </button>
        : null}
      </div>
      {active.length === 0 ? (
        <AppEmptyState tone="violet" className="mt-4 py-8">
          ไม่มีรถในลาน — บันทึกรายการใหม่จะขึ้นที่นี่ ปิดคิวด้วยสถานะ &quot;ชำระแล้ว&quot; (หลังแนบสลิป) รายการจึงจะหายจากที่นี่
        </AppEmptyState>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {active.map((v) => {
            const waitingSlip =
              v.service_status === "COMPLETED" && !hasLaneSlipPhoto(v) && !isPendingBundleVisit(v);
            const waitingPay =
              v.service_status === "COMPLETED" && (hasLaneSlipPhoto(v) || isPendingBundleVisit(v));
            const st = activeLaneKey(v.service_status);
            const tone = waitingSlip ? waitingSlipLaneTone : waitingPay ? waitingPayLaneTone : laneTone[st];
            const badgeLabel = waitingSlip ? "รอแนบสลิป" : waitingPay ? "รอชำระ" : carWashStatusLabelTh(st);
            const pkgMins = packages.find((p) => p.id === v.package_id)?.duration_minutes;
            const elapsed = laneClockMs != null ? minsSince(v.visit_at, laneClockMs) : 0;
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => setLaneModalVisitId(v.id)}
                  className={cn(
                    "flex min-h-[148px] w-full flex-col rounded-2xl border-2 p-4 text-left shadow-sm ring-1 transition hover:shadow-md",
                    tone.border,
                    tone.bg,
                    tone.ring,
                    tone.hoverBorder,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">ทะเบียน</span>
                    <span
                      className={cn(
                        "max-w-[55%] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        tone.badge,
                      )}
                    >
                      {badgeLabel}
                    </span>
                  </div>
                  <span className="mt-1 line-clamp-2 text-xl font-bold tabular-nums text-[#2e2a58]">{v.plate_number}</span>
                  <p className="mt-1 line-clamp-1 text-xs font-medium text-[#4d47b6]">{v.package_name}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[#66638c]">{v.customer_name}</p>
                  <p className="mt-1 text-[10px] tabular-nums text-slate-500">
                    {new Date(v.visit_at).toLocaleTimeString("th-TH", {
                      timeZone: "Asia/Bangkok",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · ผ่านมา{" "}
                    {elapsed} นาที
                  </p>
                  {pkgMins != null ? <p className="text-[10px] text-slate-400">แพ็กเกจประมาณ {pkgMins} นาที</p> : null}
                  <p className="mt-auto pt-2 text-sm font-bold tabular-nums text-emerald-700">
                    ฿{v.final_price.toLocaleString("th-TH")}
                  </p>
                  <p className="mt-2 text-[10px] font-medium text-[#4d47b6]">แตะเพื่อดูรายละเอียด</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <FormModal
        open={modalVisit != null}
        onClose={() => setLaneModalVisitId(null)}
        size="lg"
        title={
          modalVisit ?
            laneModalView === "details" ?
              `ทะเบียน ${modalVisit.plate_number} — รายละเอียด`
            : `ทะเบียน ${modalVisit.plate_number} — บิลชำระเงิน`
          : ""
        }
        description={
          laneModalView === "details" ?
            "แนบสลิปเมื่อเสร็จงาน แล้วเลือกสถานะชำระแล้วเพื่อนำออกจากลาน — เปิดบิลพร้อมเพย์ได้เมื่อต้องการ"
          : "ให้ลูกค้าสแกนจ่าย — พิมพ์บิลตามขนาดเครื่องพิมพ์ได้จากปุ่มด้านล่าง"
        }
        footer={
          modalVisit ?
            laneModalView === "details" ?
              <div className="flex w-full flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[#0000BF]/30 bg-[#eef0ff] px-4 py-2.5 text-sm font-semibold text-[#0000BF]"
                  onClick={() => setLaneModalView("bill")}
                >
                  บิล & พร้อมเพย์
                </button>
                <button
                  type="button"
                  className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                  onClick={() => setLaneModalVisitId(null)}
                >
                  ปิด
                </button>
              </div>
            : <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                {printFooterRow}
                <div className="flex flex-wrap justify-end gap-2 sm:ml-auto">
                  <button
                    type="button"
                    className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                    onClick={() => setLaneModalView("details")}
                  >
                    กลับ
                  </button>
                  <button
                    type="button"
                    className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                    onClick={() => setLaneModalVisitId(null)}
                  >
                    ปิด
                  </button>
                </div>
              </div>
          : null
        }
      >
        {modalVisit ?
          <div className="space-y-4">
            {laneModalView === "details" ?
              <>
                <AppGalleryCameraFileInputs
                  galleryInputRef={laneGalleryInputRef}
                  cameraInputRef={laneCameraInputRef}
                  onChange={onLaneGalleryChange}
                />
                <div
                  className={cn(
                    "rounded-xl border-2 p-4",
                    modalLaneWaitingSlip ? waitingSlipModalBoxClass
                    : modalLaneWaitingPay ? waitingPayModalBoxClass
                    : modalDetailBoxClass(modalVisit.service_status),
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-bold ring-1",
                        modalLaneWaitingSlip ? waitingSlipModalBadgeClass
                        : modalLaneWaitingPay ? waitingPayModalBadgeClass
                        : modalBadgeClass(modalVisit.service_status),
                      )}
                    >
                      {modalLaneWaitingSlip ? "เสร็จแล้ว — รอแนบสลิป"
                      : modalLaneWaitingPay ? "เสร็จแล้ว — รอชำระ"
                      : carWashStatusLabelTh(modalVisit.service_status)}
                    </span>
                    <span className="text-xs text-[#66638c]">
                      เข้าเมื่อ{" "}
                      {new Date(modalVisit.visit_at).toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · ผ่านมา{" "}
                      {laneClockMs != null ? minsSince(modalVisit.visit_at, laneClockMs) : 0}{" "}
                      นาที
                    </span>
                  </div>
                  {modalLaneWaitingSlip ?
                    <p className="mt-2 rounded-lg border border-orange-200 bg-orange-100/90 px-3 py-2 text-xs font-medium text-orange-950">
                      อัปโหลดหรือถ่ายสลิปด้านล่างก่อน จากนั้นเลือกสถานะ &quot;ชำระแล้ว&quot; เพื่อปิดคิว
                    </p>
                  : null}
                  {modalLaneWaitingPay ?
                    <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-100/90 px-3 py-2 text-xs font-medium text-emerald-950">
                      {modalVisit && isPendingBundleVisit(modalVisit) ?
                        'เลือกสถานะ "ชำระแล้ว" ด้านล่างเพื่อหักครั้งแพ็กเกจเหมาและนำรายการออกจากลาน'
                      : 'เลือกสถานะ "ชำระแล้ว" ด้านล่างเพื่อนำรายการออกจาก "ลานล้างวันนี้"'}
                    </p>
                  : null}
                  <div className="mt-3 border-t border-[#e8e6f4] pt-3">
                    <label className="block text-xs font-medium text-[#66638c]">
                      สถานะ
                      <select
                        className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                        value={modalVisit.service_status}
                        disabled={rowBusy}
                        onChange={(e) => {
                          const next = e.target.value as CarWashServiceStatus;
                          if (next === "PAID" && !canSelectPaidLane(modalVisit)) {
                            window.alert("เลือกสถานะเสร็จแล้วและแนบสลิปก่อน จึงจะเลือกชำระแล้วได้");
                            return;
                          }
                          void onSetStatus(modalVisit.id, next);
                        }}
                      >
                        {CAR_WASH_SERVICE_STATUSES.map((s) => (
                          <option
                            key={s}
                            value={s}
                            disabled={s === "PAID" && !canSelectPaidLane(modalVisit)}
                          >
                            {carWashStatusLabelTh(s)} ({s})
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="mt-4 rounded-xl border border-[#e1e3ff] bg-white/80 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">สลิป / รูปแนบ</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      {photoResolved ?
                        <>
                          <AppImageThumb
                            className="!h-16 !w-16 rounded-lg ring-1 ring-[#e1e3ff]"
                            src={photoResolved}
                            alt="สลิป"
                            onOpen={() => lightbox.open(photoResolved)}
                          />
                          <button
                            type="button"
                            disabled={rowBusy || lanePhotoBusy}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                            onClick={() => lightbox.open(photoResolved)}
                          >
                            ดูรูป
                          </button>
                        </>
                      : <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[#d8d6ec] bg-white text-[9px] text-[#9b98c4]">
                          ไม่มีรูป
                        </div>}
                      <AppImagePickCameraButtons
                        className="!justify-start gap-2"
                        busy={lanePhotoBusy}
                        disabled={rowBusy}
                        labels={{ gallery: "เลือกรูป", camera: "ถ่ายรูป", busy: "กำลังอัปโหลด…" }}
                        onPickGallery={openLaneGalleryPicker}
                        onPickCamera={openLaneCameraPicker}
                      />
                      {photoResolved ?
                        <button
                          type="button"
                          disabled={rowBusy || lanePhotoBusy}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                          onClick={() => void clearLanePhoto()}
                        >
                          ล้างรูป
                        </button>
                      : null}
                    </div>
                  </div>

                  <p className="mt-3 text-lg font-bold text-[#2e2a58]">{modalVisit.customer_name}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between gap-4 border-b border-[#e8e6f4] py-2">
                      <dt className="text-[#66638c]">เบอร์โทร</dt>
                      <dd className="font-medium tabular-nums text-[#2e2a58]">{modalVisit.customer_phone || "—"}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-[#e8e6f4] py-2">
                      <dt className="text-[#66638c]">แพ็กเกจ</dt>
                      <dd className="text-right font-medium text-[#2e2a58]">{modalVisit.package_name}</dd>
                    </div>
                    {packages.find((p) => p.id === modalVisit.package_id)?.duration_minutes != null ?
                      <div className="flex justify-between gap-4 border-b border-[#e8e6f4] py-2">
                        <dt className="text-[#66638c]">ระยะเวลาแพ็กเกจ</dt>
                        <dd className="font-medium tabular-nums text-[#2e2a58]">
                          {packages.find((p) => p.id === modalVisit.package_id)?.duration_minutes} นาที
                        </dd>
                      </div>
                    : null}
                    <div className="flex justify-between gap-4 border-b border-[#e8e6f4] py-2">
                      <dt className="text-[#66638c]">ราคา</dt>
                      <dd className="text-lg font-bold tabular-nums text-emerald-700">
                        ฿{modalVisit.final_price.toLocaleString("th-TH")}
                      </dd>
                    </div>
                    {modalVisit.note?.trim() ?
                      <div className="py-2">
                        <dt className="text-[#66638c]">หมายเหตุ</dt>
                        <dd className="mt-1 text-[#2e2a58]">{modalVisit.note}</dd>
                      </div>
                    : null}
                    {modalVisit.recorded_by_name?.trim() ?
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-[#66638c]">ผู้บันทึก</dt>
                        <dd className="font-medium text-[#2e2a58]">{modalVisit.recorded_by_name}</dd>
                      </div>
                    : null}
                  </dl>
                </div>
              </>
            : <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-slate-900 sm:bg-white">
                <header className="border-b border-slate-200 pb-3 text-center">
                  {logoUrl?.trim() ?
                    <div className="mb-2 flex justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logoUrl.trim()} alt="" className="max-h-16 max-w-[140px] object-contain" />
                    </div>
                  : null}
                  <h3 className="text-base font-bold text-slate-900">{shopLabel}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#0000BF]">ใบสรุปยอด / ชำระเงิน (ลานล้างรถ)</p>
                  <p className="mt-2 text-sm text-slate-700">
                    ทะเบียน <span className="font-semibold">{modalVisit.plate_number.trim() || "—"}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">พิมพ์เมื่อ {billPrintedAt || "—"}</p>
                </header>

                <div className="mt-4 space-y-2 border-b border-slate-100 pb-3 text-sm">
                  <p className="font-mono text-xs text-slate-500">รายการ #{modalVisit.id}</p>
                  <p className="text-slate-700">
                    <span className="text-slate-500">ลูกค้า:</span> {modalVisit.customer_name.trim() || "—"}
                  </p>
                  <p className="text-slate-700">
                    <span className="text-slate-500">แพ็กเกจ:</span> {modalVisit.package_name.trim() || "—"}
                  </p>
                  {modalVisit.note?.trim() ?
                    <p className="whitespace-pre-line text-xs text-slate-600">{modalVisit.note}</p>
                  : null}
                  <p className="text-right text-sm font-semibold tabular-nums text-slate-900">
                    ยอดชำระ ฿{modalVisit.final_price.toLocaleString("th-TH")}
                  </p>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-4 text-center">
                  <p className="text-xs font-medium text-slate-600">ยอดรวม (บาท)</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums text-[#0000BF]">
                    {modalVisit.final_price.toLocaleString("th-TH")}
                  </p>
                </div>

                {paymentChannelsNote ?
                  <section className="mt-4">
                    <h4 className="text-xs font-semibold text-slate-800">ช่องทางชำระ</h4>
                    <p className="mt-1 whitespace-pre-line text-xs text-slate-700">{paymentChannelsNote}</p>
                  </section>
                : null}

                <section className="mt-5 flex flex-col items-center border-t border-dashed border-slate-200 pt-5">
                  <h4 className="text-sm font-semibold text-slate-900">สแกนจ่าย พร้อมเพย์</h4>
                  {ppQrLoading ?
                    <p className="mt-4 text-sm text-slate-500">กำลังสร้าง QR…</p>
                  : ppQrUrl ?
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ppQrUrl} alt="PromptPay QR" className="mt-3 h-48 w-48 object-contain sm:h-52 sm:w-52" />
                      <p className="mt-2 text-xs text-slate-500">
                        ยอด {modalVisit.final_price.toLocaleString("th-TH")} บาท
                      </p>
                    </>
                  : !ppConfigured ?
                    <p className="mt-3 max-w-sm text-center text-sm text-amber-800">
                      ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งได้ที่{" "}
                      <Link href="/dashboard/profile" className="font-semibold text-[#0000BF] underline">
                        โปรไฟล์
                      </Link>
                    </p>
                  : <p className="mt-3 text-center text-sm text-slate-500">
                      ไม่สามารถสร้าง QR ได้ — ลองรีเฟรชหรือตรวจสอบเบอร์พร้อมเพย์
                    </p>}
                </section>

                <p className="mt-6 text-center text-xs text-slate-400">ขอบคุณที่ใช้บริการ</p>
              </div>}
          </div>
        : null}
      </FormModal>

      <AppCameraCaptureModal
        open={laneCameraOpen}
        onClose={onLaneCameraModalClose}
        onCapture={(file) => void onLaneCameraCaptured(file)}
        onRequestLegacyPicker={onLaneCameraLegacyPicker}
        title="ถ่ายรูปสลิป / หลักฐาน"
      />
      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="สลิป / รูปแนบ" />
    </AppDashboardSection>
  );
}
