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
  AppSlipPaperSizeToolbar,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
  useAppSlipPaperSize,
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
  printCarWashVisitReceiptFromVisit,
  type CarWashPrintShopProfile,
} from "@/systems/car-wash/lib/car-wash-print-docs";
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

const LANE_STATUS_FLOW: CarWashServiceStatus[] = [
  "QUEUED",
  "WASHING",
  "VACUUMING",
  "WAXING",
  "COMPLETED",
];

function nextLaneStatus(v: ServiceVisit): CarWashServiceStatus | null {
  if (v.service_status === "PAID") return null;
  if (v.service_status === "COMPLETED") {
    return canSelectPaidLane(v) ? "PAID" : null;
  }
  const i = LANE_STATUS_FLOW.indexOf(v.service_status);
  if (i < 0 || i >= LANE_STATUS_FLOW.length - 1) return null;
  return LANE_STATUS_FLOW[i + 1] ?? null;
}

export function CarWashServiceLanePanel({
  visits,
  packages,
  baseUrl,
  shopLabel,
  logoUrl = null,
  paymentChannelsNote = null,
  shopPrintProfile = null,
  busyVisitId,
  onSetStatus,
  onVisitPhotoUpdate,
  onRecordVisit,
  onRefresh,
  refreshing = false,
  iconOnlyActions = false,
  staffLayout = false,
}: {
  visits: ServiceVisit[];
  packages: ServicePackage[];
  baseUrl: string;
  shopLabel: string;
  logoUrl?: string | null;
  paymentChannelsNote?: string | null;
  shopPrintProfile?: CarWashPrintShopProfile | null;
  busyVisitId: number | null;
  onSetStatus: (id: number, status: CarWashServiceStatus) => void | Promise<void>;
  onVisitPhotoUpdate: (id: number, photoUrl: string) => void | Promise<void>;
  onRecordVisit?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  iconOnlyActions?: boolean;
  staffLayout?: boolean;
}) {
  const lightbox = useAppImageLightbox();
  const [laneModalVisitId, setLaneModalVisitId] = useState<number | null>(null);
  const [laneModalView, setLaneModalView] = useState<"details" | "bill">("details");
  const [billPrintedAt, setBillPrintedAt] = useState("");
  const { paper: slipPaper, setPaper: setSlipPaper } = useAppSlipPaperSize(shopPrintProfile?.slipPaperSize);
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

  const laneSummary = useMemo(() => {
    let queued = 0;
    let inService = 0;
    let waitingSlip = 0;
    let waitingPay = 0;
    for (const v of active) {
      if (v.service_status === "COMPLETED") {
        if (!hasLaneSlipPhoto(v) && !isPendingBundleVisit(v)) waitingSlip += 1;
        else waitingPay += 1;
      } else if (v.service_status === "QUEUED") {
        queued += 1;
      } else {
        inService += 1;
      }
    }
    return { total: active.length, queued, inService, waitingSlip, waitingPay };
  }, [active]);

  function resolveLanePrintShop(): CarWashPrintShopProfile {
    const rawLogo = shopPrintProfile?.logoUrl || logoUrl;
    return {
      displayName: shopPrintProfile?.displayName?.trim() || shopLabel,
      logoUrl: rawLogo ? resolveAssetUrl(rawLogo, baseUrl) : null,
      address: shopPrintProfile?.address ?? null,
      taxId: shopPrintProfile?.taxId ?? null,
      contactPhone: shopPrintProfile?.contactPhone ?? null,
      bankAccountName: shopPrintProfile?.bankAccountName ?? null,
      slipPaperSize: shopPrintProfile?.slipPaperSize ?? slipPaper,
    };
  }

  function openLaneDetails(id: number) {
    setLaneModalVisitId(id);
    setLaneModalView("details");
  }

  function openLaneBill(id: number) {
    setLaneModalVisitId(id);
    setLaneModalView("bill");
  }

  function printLaneReceipt(v: ServiceVisit) {
    const ok = printCarWashVisitReceiptFromVisit(resolveLanePrintShop(), v);
    if (!ok) window.alert("รายการนี้มียอด ฿0 — ไม่พิมพ์ใบเสร็จรับเงิน");
  }

  async function applyLaneStatus(v: ServiceVisit, next: CarWashServiceStatus) {
    if (next === "PAID" && !canSelectPaidLane(v)) {
      window.alert("เลือกสถานะเสร็จแล้วและแนบสลิปก่อน จึงจะเลือกชำระแล้วได้");
      return;
    }
    await onSetStatus(v.id, next);
  }

  function pickLanePhotoForVisit(id: number) {
    lanePhotoTargetVisitIdRef.current = id;
    laneGalleryInputRef.current?.click();
  }

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

  const modalVisitPackageMinutes = useMemo(() => {
    if (modalVisit == null) return null;
    return packages.find((p) => p.id === modalVisit.package_id)?.duration_minutes ?? null;
  }, [modalVisit, packages]);

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
    <div className="flex flex-wrap items-center gap-2">
      <AppSlipPaperSizeToolbar
        value={slipPaper}
        onChange={setSlipPaper}
        sizes={["SLIP_58", "SLIP_80", "A4"]}
        aria-label="ขนาดกระดาษบิลคาร์แคร์"
      />
      <button
        type="button"
        className={cn("cw-btn", appTemplateOutlineButtonClass)}
        onClick={() => handlePrintBill(slipPaper)}
      >
        <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect width="12" height="8" x="6" y="14" />
        </svg>
        <span className="cw-btn-label">พิมพ์บิล</span>
      </button>
    </div>
  );

  const headerRow =
    !staffLayout ?
      <div className="flex items-start justify-between gap-3 border-b border-[#ecebff] pb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#2e2a58]">ลานล้างวันนี้</h2>
          <p className="mt-1 text-xs text-[#66638c]">
            เปลี่ยนสถานะ · แนบรูป · บิล/QR · พิมพ์ใบเสร็จได้จากการ์ดเลย
          </p>
        </div>
        {onRecordVisit || onRefresh ?
          <div className="flex shrink-0 items-center gap-2 self-start">
            {onRefresh ?
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className="cw-btn app-btn-soft app-tap-feedback inline-flex min-h-[42px] items-center justify-center rounded-xl border border-[#dcd8f0] px-3 py-2 text-[#4d47b6] hover:bg-[#f4f3ff] disabled:opacity-60 sm:px-3.5 sm:text-sm"
                aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M20 11a8 8 0 1 0 2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {!iconOnlyActions ? <span className="cw-btn-label">{refreshing ? "กำลังรีเฟรช..." : "รีเฟรช"}</span> : null}
              </button>
            : null}
            {onRecordVisit ?
              <button
                type="button"
                onClick={onRecordVisit}
                className="cw-btn app-btn-primary app-tap-feedback inline-flex min-h-[42px] items-center justify-center rounded-xl px-3 py-2 sm:px-4 sm:text-sm"
                aria-label="บันทึกรายการ"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {!iconOnlyActions ? <span className="cw-btn-label">บันทึกรายการ</span> : null}
              </button>
            : null}
          </div>
        : null}
      </div>
    : null;

  /** มุมขวาบนของการ์ดลานล้าง (staff) — แทน FAB ลอยมุมล่าง */
  const staffCardToolbar =
    staffLayout && (onRefresh || onRecordVisit) ?
      <div className="-mt-1 mb-3 flex shrink-0 items-center justify-end gap-2 sm:-mt-0.5 sm:mb-4">
        {onRefresh ?
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dcd8f0]/90 bg-white/90 text-[#4d47b6] shadow-sm ring-1 ring-white/70 transition hover:bg-[#f4f3ff] disabled:opacity-60"
            aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M20 11a8 8 0 1 0 2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        : null}
        {onRecordVisit ?
          <button
            type="button"
            onClick={onRecordVisit}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-md ring-1 ring-white/40 transition hover:opacity-95 active:scale-95"
            aria-label="บันทึกรายการ"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        : null}
      </div>
    : null;

  const listBlock =
    active.length === 0 ?
      <AppEmptyState tone="violet" className={cn(staffLayout ? "py-8" : "mt-4 py-8")}>
        ไม่มีคิวในลานตอนนี้ — กด「บันทึกรายการ」เพื่อรับรถเข้าลาน
      </AppEmptyState>
    : (
      <>
        <div
          className={cn(
            "grid grid-cols-2 gap-2 sm:grid-cols-4",
            staffLayout ? "mb-3" : "mt-4 mb-1",
          )}
          aria-label="สรุปลานล้างวันนี้"
        >
          {[
            { label: "ทั้งหมด", value: laneSummary.total, tone: "text-[#1e1b4b] bg-white/80 border-white/70" },
            { label: "รอคิว", value: laneSummary.queued, tone: "text-amber-900 bg-amber-50/90 border-amber-200/80" },
            { label: "กำลังบริการ", value: laneSummary.inService, tone: "text-sky-900 bg-sky-50/90 border-sky-200/80" },
            {
              label: laneSummary.waitingSlip > 0 ? "รอสลิป/ชำระ" : "รอชำระ",
              value: laneSummary.waitingSlip + laneSummary.waitingPay,
              tone: "text-emerald-900 bg-emerald-50/90 border-emerald-200/80",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-xl border px-2.5 py-2 text-center shadow-sm sm:rounded-2xl sm:px-3 sm:py-2.5",
                s.tone,
              )}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{s.label}</p>
              <p className="mt-0.5 text-lg font-black tabular-nums sm:text-xl">{s.value}</p>
            </div>
          ))}
        </div>
        <ul
          className={cn(
            "grid gap-3",
            staffLayout ? "grid-cols-1" : "mt-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
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
            const rowBusy = busyVisitId === v.id;
            const next = nextLaneStatus(v);
            const photoUrl = v.photo_url?.trim() ? resolveAssetUrl(v.photo_url, baseUrl) : null;
            return (
              <li key={v.id}>
                <article
                  className={cn(
                    "flex h-full min-h-[200px] w-full flex-col rounded-2xl border-2 p-3 shadow-sm ring-1 transition sm:min-h-[220px] sm:p-4",
                    tone.border,
                    tone.bg,
                    tone.ring,
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#66638c]">ทะเบียนรถ</p>
                      <p className="mt-0.5 line-clamp-1 text-xl font-black tabular-nums leading-tight text-[#2e2a58]">
                        {v.plate_number.trim() || "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex max-w-[9rem] shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        tone.badge,
                      )}
                    >
                      {badgeLabel}
                    </span>
                  </div>

                  <div className="mt-2 min-w-0 space-y-0.5">
                    <p className="line-clamp-1 text-sm font-bold text-[#4d47b6]">{v.package_name}</p>
                    <p className="line-clamp-1 text-xs font-medium text-[#66638c]">
                      {v.customer_name.trim() || "ลูกค้าทั่วไป"}
                      {v.customer_phone?.trim() ? ` · ${v.customer_phone}` : ""}
                    </p>
                    <p className="text-[11px] tabular-nums text-slate-500">
                      {new Date(v.visit_at).toLocaleTimeString("th-TH", {
                        timeZone: "Asia/Bangkok",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · ผ่านมา {elapsed} นาที
                      {pkgMins != null ? ` · แพ็ก ~${pkgMins} น.` : ""}
                    </p>
                    <p className="text-sm font-black tabular-nums text-emerald-700">
                      ฿{v.final_price.toLocaleString("th-TH")}
                      {v.bundle_id != null ? (
                        <span className="ml-1 text-[10px] font-bold text-amber-700">เหมา</span>
                      ) : null}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#66638c]">เปลี่ยนสถานะ</p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label={`สถานะ ${v.plate_number}`}>
                      {LANE_STATUS_FLOW.map((s) => {
                        const selected = v.service_status === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={rowBusy}
                            aria-pressed={selected}
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-black transition disabled:opacity-50",
                              selected
                                ? "bg-[#5b61ff] text-white shadow-sm"
                                : "border border-white/80 bg-white/80 text-[#4d47b6] hover:bg-white",
                            )}
                            onClick={() => void applyLaneStatus(v, s)}
                          >
                            {carWashStatusLabelTh(s)}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        disabled={rowBusy || !canSelectPaidLane(v)}
                        aria-pressed={v.service_status === "PAID"}
                        title={
                          canSelectPaidLane(v)
                            ? "ปิดคิว — ชำระแล้ว"
                            : "ต้องสถานะเสร็จแล้วและมีสลิป (หรือแพ็กเหมา)"
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black transition disabled:opacity-40",
                          v.service_status === "PAID"
                            ? "bg-emerald-600 text-white"
                            : "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
                        )}
                        onClick={() => void applyLaneStatus(v, "PAID")}
                      >
                        ชำระแล้ว
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-white/60 pt-3">
                    {next ? (
                      <button
                        type="button"
                        disabled={rowBusy}
                        className="inline-flex min-h-[36px] flex-1 items-center justify-center rounded-xl bg-gradient-to-r from-[#5b61ff] to-[#8d64ff] px-3 text-[11px] font-black text-white shadow-sm disabled:opacity-50"
                        onClick={() => void applyLaneStatus(v, next)}
                      >
                        ขั้นถัดไป: {carWashStatusLabelTh(next)}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn(appTemplateOutlineButtonClass, "min-h-[36px] rounded-xl px-2.5 text-[11px] font-black")}
                      onClick={() => openLaneDetails(v.id)}
                    >
                      รายละเอียด
                    </button>
                    <button
                      type="button"
                      className={cn(appTemplateOutlineButtonClass, "min-h-[36px] rounded-xl px-2.5 text-[11px] font-black")}
                      onClick={() => openLaneBill(v.id)}
                    >
                      บิล/QR
                    </button>
                    {v.final_price > 0 ? (
                      <button
                        type="button"
                        className={cn(appTemplateOutlineButtonClass, "min-h-[36px] rounded-xl px-2.5 text-[11px] font-black")}
                        onClick={() => printLaneReceipt(v)}
                      >
                        พิมพ์ใบเสร็จ
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={rowBusy || lanePhotoBusy}
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "min-h-[36px] rounded-xl px-2.5 text-[11px] font-black disabled:opacity-50",
                      )}
                      onClick={() => pickLanePhotoForVisit(v.id)}
                    >
                      {photoUrl ? "เปลี่ยนรูป" : "แนบรูป"}
                    </button>
                    {photoUrl ? (
                      <button
                        type="button"
                        className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl ring-2 ring-white/80"
                        aria-label="ดูรูปแนบ"
                        onClick={() => lightbox.open(photoUrl)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </>
    );

  const laneMain = (
    <>
      {headerRow}
      {staffCardToolbar}
      {listBlock}
    </>
  );

  return (
    <>
      <AppGalleryCameraFileInputs
        galleryInputRef={laneGalleryInputRef}
        cameraInputRef={laneCameraInputRef}
        onChange={onLaneGalleryChange}
      />
      <AppImageLightbox src={lightbox.src} onClose={lightbox.close} alt="รูปแนบลาน" />
      {staffLayout ?
        <div className="relative w-full">{laneMain}</div>
      : <AppDashboardSection tone="violet">{laneMain}</AppDashboardSection>}

      <FormModal
        open={modalVisit != null}
        onClose={() => setLaneModalVisitId(null)}
        size="lg"
        mobileCentered={staffLayout}
        title={
          modalVisit ?
            laneModalView === "details" ?
              `ทะเบียน ${modalVisit.plate_number}`
            : `ทะเบียน ${modalVisit.plate_number}`
          : ""
        }
        footer={
          modalVisit ?
            laneModalView === "details" ?
              <div className="flex w-full items-center justify-between gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-indigo-100 bg-indigo-50/50 py-3 text-sm font-black text-[#5b61ff] transition-all hover:bg-indigo-100 active:scale-95"
                  onClick={() => setLaneModalView("bill")}
                >
                  บิลและ QR ชำระเงิน
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
                  onClick={() => setLaneModalVisitId(null)}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            : <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <AppSlipPaperSizeToolbar
                    value={slipPaper}
                    onChange={setSlipPaper}
                    sizes={["SLIP_58", "SLIP_80", "A4"]}
                    aria-label="ขนาดกระดาษบิลคาร์แคร์"
                  />
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                    onClick={() => handlePrintBill(slipPaper)}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect width="12" height="8" x="6" y="14" />
                    </svg>
                    พิมพ์บิล
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 active:scale-95 sm:flex-none"
                    onClick={() => setLaneModalView("details")}
                  >
                    กลับ
                  </button>
                  <button
                    type="button"
                    className="flex-1 rounded-2xl bg-slate-900 px-8 py-3 text-sm font-bold text-white transition-all active:scale-95 sm:flex-none"
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
          <div className="space-y-5">
            {laneModalView === "details" ?
              <>
                <div
                  className={cn(
                    "rounded-2xl border-2 p-4 sm:p-5",
                    modalLaneWaitingSlip ? waitingSlipModalBoxClass
                    : modalLaneWaitingPay ? waitingPayModalBoxClass
                    : modalDetailBoxClass(modalVisit.service_status),
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span
                      className={cn(
                        "inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1",
                        modalLaneWaitingSlip ? waitingSlipModalBadgeClass
                        : modalLaneWaitingPay ? waitingPayModalBadgeClass
                        : modalBadgeClass(modalVisit.service_status),
                      )}
                    >
                      {modalLaneWaitingSlip ? "เสร็จแล้ว — รอแนบสลิป"
                      : modalLaneWaitingPay ? "เสร็จแล้ว — รอชำระ"
                      : carWashStatusLabelTh(modalVisit.service_status)}
                    </span>
                    <p className="max-w-full text-xs leading-relaxed text-[#66638c] sm:max-w-[60%] sm:text-right">
                      เข้าเมื่อ{" "}
                      {new Date(modalVisit.visit_at).toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · ผ่านมา {laneClockMs != null ? minsSince(modalVisit.visit_at, laneClockMs) : 0} นาที
                    </p>
                  </div>

                  {modalLaneWaitingSlip ?
                    <p className="mt-3 rounded-xl border border-orange-200 bg-orange-100/90 px-3 py-2.5 text-xs font-medium leading-snug text-orange-950">
                      อัปโหลดหรือถ่ายสลิปในส่วน &quot;สลิป / รูปแนบ&quot; ด้านล่าง จากนั้นเลือกสถานะ &quot;ชำระแล้ว&quot; เพื่อปิดคิว
                    </p>
                  : null}
                  {modalLaneWaitingPay ?
                    <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-100/90 px-3 py-2.5 text-xs font-medium leading-snug text-emerald-950">
                      {modalVisit && isPendingBundleVisit(modalVisit) ?
                        'เลือกสถานะ "ชำระแล้ว" เพื่อหักครั้งแพ็กเกจเหมาและนำรายการออกจากลาน'
                      : 'เลือกสถานะ "ชำระแล้ว" เพื่อนำรายการออกจากลานล้างวันนี้'}
                    </p>
                  : null}

                  <div className="mt-4 rounded-xl border border-slate-200/90 bg-white/95 p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ข้อมูลลูกค้าและแพ็กเกจ</p>
                    <p className="mt-2 text-lg font-black leading-tight text-[#2e2a58]">
                      {modalVisit.customer_name.trim() || "ไม่ระบุชื่อ"}
                    </p>
                    <dl className="mt-4 divide-y divide-slate-100 text-sm">
                      <div className="flex justify-between gap-4 py-2.5 first:pt-0">
                        <dt className="shrink-0 text-[#66638c]">เบอร์โทร</dt>
                        <dd className="text-right font-medium tabular-nums text-[#2e2a58]">
                          {modalVisit.customer_phone?.trim() ? modalVisit.customer_phone : "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="shrink-0 text-[#66638c]">แพ็กเกจ</dt>
                        <dd className="max-w-[65%] text-right font-medium text-[#2e2a58]">{modalVisit.package_name}</dd>
                      </div>
                      {modalVisitPackageMinutes != null ?
                        <div className="flex justify-between gap-4 py-2.5">
                          <dt className="shrink-0 text-[#66638c]">ระยะเวลาแพ็กเกจ</dt>
                          <dd className="font-medium tabular-nums text-[#2e2a58]">{modalVisitPackageMinutes} นาที</dd>
                        </div>
                      : null}
                      <div className="flex justify-between gap-4 py-2.5">
                        <dt className="shrink-0 text-[#66638c]">ราคา</dt>
                        <dd className="text-lg font-bold tabular-nums text-emerald-700">
                          ฿{modalVisit.final_price.toLocaleString("th-TH")}
                        </dd>
                      </div>
                      {modalVisit.note?.trim() ?
                        <div className="py-2.5">
                          <dt className="text-[#66638c]">หมายเหตุ</dt>
                          <dd className="mt-1 whitespace-pre-wrap text-[#2e2a58]">{modalVisit.note}</dd>
                        </div>
                      : null}
                      {modalVisit.recorded_by_name?.trim() ?
                        <div className="flex justify-between gap-4 py-2.5">
                          <dt className="shrink-0 text-[#66638c]">ผู้บันทึก</dt>
                          <dd className="text-right font-medium text-[#2e2a58]">{modalVisit.recorded_by_name}</dd>
                        </div>
                      : null}
                    </dl>
                  </div>

                  <div className="mt-5">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#66638c]">สถานะ</span>
                      <select
                        className="app-input mt-1.5 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
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

                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">สลิป / รูปแนบ</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {photoResolved ?
                        <>
                          <AppImageThumb
                            className="!h-20 !w-20 shrink-0 rounded-xl ring-1 ring-slate-200"
                            src={photoResolved}
                            alt="สลิป"
                            onOpen={() => lightbox.open(photoResolved)}
                          />
                          <button
                            type="button"
                            disabled={rowBusy || lanePhotoBusy}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                            onClick={() => lightbox.open(photoResolved)}
                          >
                            ดูรูป
                          </button>
                        </>
                      : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-center text-[10px] font-medium leading-tight text-slate-400">
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
                          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                          onClick={() => void clearLanePhoto()}
                        >
                          ล้างรูป
                        </button>
                      : null}
                    </div>
                  </div>
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
                  <h4 className="text-sm font-semibold text-slate-900">สแกนจ่าย</h4>
                  {ppQrLoading ?
                    <p className="mt-4 text-sm text-slate-500">กำลังสร้าง QR…</p>
                  : ppQrUrl ?
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ppQrUrl} alt="QR ชำระเงิน" className="mt-3 h-48 w-48 object-contain sm:h-52 sm:w-52" />
                      <p className="mt-2 text-xs text-slate-500">
                        ยอด {modalVisit.final_price.toLocaleString("th-TH")} บาท
                      </p>
                    </>
                  : !ppConfigured ?
                    <p className="mt-3 max-w-sm text-center text-sm text-amber-800">
                      ยังไม่ได้ตั้งเบอร์สำหรับ QR ชำระเงิน — ตั้งได้ที่{" "}
                      <Link href="/dashboard/profile" className="font-semibold text-[#0000BF] underline">
                        โปรไฟล์
                      </Link>
                    </p>
                  : <p className="mt-3 text-center text-sm text-slate-500">
                      ไม่สามารถสร้าง QR ได้ — ลองรีเฟรชหรือตรวจสอบเบอร์สำหรับ QR
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
    </>
  );
}
