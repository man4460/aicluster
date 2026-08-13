"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { CarWashDashboardTabToolbar } from "@/systems/car-wash/CarWashDashboardTabToolbar";
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
import { digitsOnlyTaxId, isValidThaiId13 } from "@/lib/thai-tax-id";
import { bangkokDateKey } from "@/lib/time/bangkok";
import { readStoredStaffDailyUnlock, staffDailyUnlockHeaders } from "@/lib/modules/staff-daily-pin";
import type { CarWashStaffAuth } from "@/systems/car-wash/car-wash-service";
import { FormModal } from "@/components/ui/FormModal";
import { CAR_WASH_SERVICE_STATUSES, carWashStatusLabelTh } from "@/lib/car-wash/service-status";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import { CarWashPaymentPanel } from "@/systems/car-wash/CarWashPaymentPanel";
import {
  carWashPaymentMethodLabel,
  type CarWashPaymentMethod,
} from "@/systems/car-wash/lib/payment-method";
import {
  carWashPrintVisitInputFromVisit,
  printCarWashVisitDocs,
  printCarWashVisitReceiptFromVisit,
  type CarWashPrintShopProfile,
} from "@/systems/car-wash/lib/car-wash-print-docs";
import {
  uploadCarWashSessionImage,
  type CarWashServiceStatus,
  type ServicePackage,
  type ServiceVisit,
} from "@/systems/car-wash/car-wash-service";
import { CAR_WASH_VISIT_EVIDENCE_MAX } from "@/systems/car-wash/lib/visit-media";

export type CarWashLanePaymentPayload = {
  service_status: "PAID";
  photo_url?: string;
  note?: string;
};

type LanePhotoKind = "slip" | "evidence";
const billFooterBtnClass =
  "inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl px-4 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50";
const billDocChipClass = (active: boolean) =>
  cn(
    "flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm font-bold transition",
    active
      ? "border-[#5b61ff]/45 bg-[#ecebff]/70 text-[#1e1b4b] ring-1 ring-[#5b61ff]/20"
      : "border-slate-200/90 bg-white/80 text-slate-700 hover:bg-white",
  );
const laneTone: Record<
  Exclude<CarWashServiceStatus, "COMPLETED" | "PAID" | "HANDED_OVER">,
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

function activeLaneKey(
  s: CarWashServiceStatus,
): Exclude<CarWashServiceStatus, "COMPLETED" | "PAID" | "HANDED_OVER"> {
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

/** รายการเหมาจ่ายที่ยังไม่หักครั้ง — ปิดคิว (PAID) ได้เมื่อเสร็จแล้ว โดยไม่บังคับสลิป */
function isPendingBundleVisit(v: ServiceVisit): boolean {
  return v.bundle_id != null;
}

/**
 * ปิดคิวได้เมื่อสถานะเสร็จแล้ว — สลิปไม่บังคับ (กฎชำระแดชบอร์ด: CASH/บัตรไม่โชว์สลิป · PP/โอนโชว์แต่ไม่บังคับ)
 */
function canSelectPaidLane(v: ServiceVisit): boolean {
  return v.service_status === "COMPLETED";
}

/** ยังแสดงในลานล้างวันนี้: วันนี้ และยังไม่ส่งมอบ (PAID ยังอยู่ — ย้ายไป «ลานรอส่งมอบ») */
function isInServiceLaneToday(v: ServiceVisit): boolean {
  return isVisitToday(v.visit_at) && v.service_status !== "HANDED_OVER";
}

/** ยังบริการอยู่ (ไม่รวม PAID ที่ย้ายไปลานรอส่งมอบแล้ว) */
function isServiceActiveVisit(v: ServiceVisit): boolean {
  return isInServiceLaneToday(v) && v.service_status !== "PAID";
}

/** ชำระแล้ว รอส่งมอบ */
function isHandoverActiveVisit(v: ServiceVisit): boolean {
  return isInServiceLaneToday(v) && v.service_status === "PAID";
}

function needsLanePayment(v: ServiceVisit): boolean {
  return v.service_status === "COMPLETED";
}

/** เสร็จแล้วแต่ยังไม่ชำระ — คงอยู่ในลานจนกว่าจะ PAID */
const waitingPayLaneTone: (typeof laneTone)["WASHING"] = {
  border: "border-emerald-300/90",
  bg: "bg-emerald-50/90",
  ring: "ring-emerald-200/80",
  badge: "bg-emerald-100 text-emerald-950 ring-emerald-200/70",
  hoverBorder: "hover:border-emerald-400",
};

/** ชำระแล้ว รอส่งมอบ — ลานรอส่งมอบ */
const handoverLaneTone: (typeof laneTone)["WASHING"] = {
  border: "border-violet-300/90",
  bg: "bg-violet-50/90",
  ring: "ring-violet-200/80",
  badge: "bg-violet-100 text-violet-950 ring-violet-200/70",
  hoverBorder: "hover:border-violet-400",
};

const waitingPayModalBoxClass = "border-emerald-200 bg-emerald-50/80";
const waitingPayModalBadgeClass = "bg-emerald-100 text-emerald-950 ring-emerald-200";
const handoverModalBoxClass = "border-violet-200 bg-violet-50/80";
const handoverModalBadgeClass = "bg-violet-100 text-violet-950 ring-violet-200";
const remainingPillClass = "bg-amber-100 text-amber-900 ring-amber-200/80";

const LANE_STATUS_FLOW: CarWashServiceStatus[] = [
  "QUEUED",
  "WASHING",
  "VACUUMING",
  "WAXING",
  "COMPLETED",
];

function nextLaneStatus(v: ServiceVisit): CarWashServiceStatus | null {
  if (v.service_status === "HANDED_OVER") return null;
  if (v.service_status === "PAID") return "HANDED_OVER";
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
  onVisitEvidenceUpdate,
  onLanePayment,
  onRecordVisit,
  onRefresh,
  refreshing = false,
  iconOnlyActions = false,
  staffLayout = false,
  showFullscreenBoardLink = false,
  fullscreenBoardHref = "/dashboard/car-wash/lane-board",
  staffAuth = null,
  showHubTabToolbar = false,
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
  /** อัปเดตรายการรูปหลักฐานสภาพรถ (สูงสุด 10) */
  onVisitEvidenceUpdate: (id: number, urls: string[]) => void | Promise<void>;
  /** รับชำระแล้วปิดคิว (PAID) — บันทึกช่องทาง/สลิปตามกฎ CarWashPaymentPanel */
  onLanePayment: (id: number, payload: CarWashLanePaymentPayload) => void | Promise<void>;
  onRecordVisit?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  iconOnlyActions?: boolean;
  staffLayout?: boolean;
  /** ปุ่มเปิดหน้าลานล้างเต็มจอ (SSE) */
  showFullscreenBoardLink?: boolean;
  fullscreenBoardHref?: string;
  /** พอร์ทัลลิงก์พนักงาน — ใส่โทเค็นแทน session cookie */
  staffAuth?: CarWashStaffAuth | null;
  /** สลับภาพรวม / จัดการคิว — มุมขวาสุดแถวปุ่มบันทึกรายการ */
  showHubTabToolbar?: boolean;
}) {
  const lightbox = useAppImageLightbox();
  const staffApiUrl = useCallback(
    (path: string) => {
      if (!staffAuth) return path;
      const qs = new URLSearchParams({
        ownerId: staffAuth.ownerId,
        t: staffAuth.trialSessionId,
        k: staffAuth.k,
      });
      const unlock = readStoredStaffDailyUnlock("car-wash", staffAuth.ownerId);
      if (unlock) qs.set("du", unlock);
      return `${path}?${qs.toString()}`;
    },
    [staffAuth],
  );
  const staffApiInit = useCallback(
    (init?: RequestInit): RequestInit => {
      if (!staffAuth) return { ...init, credentials: init?.credentials ?? "include" };
      const headerBag = new Headers(init?.headers);
      const unlockHeaders = staffDailyUnlockHeaders("car-wash", staffAuth.ownerId);
      for (const [key, value] of Object.entries(unlockHeaders)) headerBag.set(key, value);
      return { ...init, credentials: "omit", headers: headerBag };
    },
    [staffAuth],
  );
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
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printTaxInvoice, setPrintTaxInvoice] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [customerTaxId, setCustomerTaxId] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerBranch, setCustomerBranch] = useState("");
  const [printDocErr, setPrintDocErr] = useState<string | null>(null);
  const [payVisitId, setPayVisitId] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<CarWashPaymentMethod>("CASH");
  const [paySlipUrl, setPaySlipUrl] = useState<string | null>(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);

  const laneGalleryInputRef = useRef<HTMLInputElement>(null);
  const laneCameraInputRef = useRef<HTMLInputElement>(null);
  const lanePhotoTargetVisitIdRef = useRef<number | null>(null);
  const lanePhotoKindRef = useRef<LanePhotoKind>("evidence");

const sortByVisitAtAsc = (a: ServiceVisit, b: ServiceVisit) =>
    new Date(a.visit_at).getTime() - new Date(b.visit_at).getTime();

  /** ทั้งลาน (บริการ + รอส่งมอบ) วันนี้ */
  const laneToday = useMemo(() => visits.filter((v) => isInServiceLaneToday(v)), [visits]);

  /** การ์ดหลัก — ยังไม่ชำระ/อยู่ระหว่างบริการ */
  const serviceActive = useMemo(
    () => visits.filter((v) => isServiceActiveVisit(v)).sort(sortByVisitAtAsc),
    [visits],
  );

  /** ลานรอส่งมอบ — ชำระแล้ว รอส่งมอบรถ */
  const handoverActive = useMemo(
    () => visits.filter((v) => isHandoverActiveVisit(v)).sort(sortByVisitAtAsc),
    [visits],
  );

  const laneSummary = useMemo(() => {
    let queued = 0;
    let inService = 0;
    let waitingPay = 0;
    for (const v of serviceActive) {
      if (v.service_status === "COMPLETED") {
        waitingPay += 1;
      } else if (v.service_status === "QUEUED") {
        queued += 1;
      } else {
        inService += 1;
      }
    }
    return {
      total: laneToday.length,
      queued,
      inService,
      waitingPay,
      waitingHandover: handoverActive.length,
    };
  }, [serviceActive, laneToday, handoverActive]);

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
    const v = visits.find((x) => x.id === id);
    setPrintReceipt(true);
    setPrintTaxInvoice(false);
    setBillingName(v?.customer_name?.trim() || "");
    setCustomerTaxId("");
    setCustomerAddress("");
    setCustomerBranch("");
    setPrintDocErr(null);
  }

  function printLaneReceipt(v: ServiceVisit) {
    const ok = printCarWashVisitReceiptFromVisit(resolveLanePrintShop(), v);
    if (!ok) window.alert("รายการนี้มียอด ฿0 — ไม่พิมพ์ใบเสร็จรับเงิน");
  }

  async function applyLaneStatus(v: ServiceVisit, next: CarWashServiceStatus) {
    if (next === "PAID") {
      if (v.service_status === "COMPLETED" && !v.is_fully_paid) {
        openLanePay(v);
        return;
      }
      await onSetStatus(v.id, next);
      return;
    }
    await onSetStatus(v.id, next);
  }

  function openLanePay(v: ServiceVisit) {
    if (v.service_status !== "COMPLETED") {
      window.alert("ตั้งสถานะ «เสร็จแล้ว» ก่อนรับชำระ — รายการจะคงอยู่ในลานจนกว่าจะชำระ");
      return;
    }
    setPayVisitId(v.id);
    setPayMethod("CASH");
    setPaySlipUrl(v.photo_url?.trim() || null);
    setPayErr(null);
  }

  function closeLanePay() {
    setPayVisitId(null);
    setPaySlipUrl(null);
    setPayErr(null);
    setPayBusy(false);
  }

  async function confirmLanePay() {
    const v = payVisit;
    if (!v) return;
    if (v.service_status !== "COMPLETED") {
      setPayErr("ตั้งสถานะเสร็จแล้วก่อนรับชำระ");
      return;
    }
    setPayBusy(true);
    setPayErr(null);
    try {
      const amount = v.amount_remaining > 0 ? v.amount_remaining : v.final_price;
      const isBundle = isPendingBundleVisit(v);
      const noteClean = (v.note ?? "").replace(/\s*·\s*ชำระ:\s*[^\n·]+/g, "").trim();
      const note =
        amount > 0 && !isBundle
          ? [noteClean, `ชำระ: ${carWashPaymentMethodLabel(payMethod)}`].filter(Boolean).join(" · ")
          : noteClean;
      await onLanePayment(v.id, {
        service_status: "PAID",
        photo_url: paySlipUrl?.trim() || v.photo_url?.trim() || "",
        note,
      });
      closeLanePay();
      if (laneModalVisitId === v.id) setLaneModalVisitId(null);
    } catch (e) {
      setPayErr(e instanceof Error ? e.message : "บันทึกการชำระไม่สำเร็จ");
    } finally {
      setPayBusy(false);
    }
  }

  function pickLanePhotoForVisit(id: number, kind: LanePhotoKind = "evidence") {
    lanePhotoTargetVisitIdRef.current = id;
    lanePhotoKindRef.current = kind;
    laneGalleryInputRef.current?.click();
  }

  function pickLaneCameraForVisit(id: number, kind: LanePhotoKind = "evidence") {
    lanePhotoTargetVisitIdRef.current = id;
    lanePhotoKindRef.current = kind;
    setLaneCameraOpen(true);
  }

  const modalVisit = useMemo(() => {
    if (laneModalVisitId == null) return null;
    return visits.find((v) => v.id === laneModalVisitId) ?? null;
  }, [visits, laneModalVisitId]);

  const payVisit = useMemo(() => {
    if (payVisitId == null) return null;
    return visits.find((v) => v.id === payVisitId) ?? null;
  }, [visits, payVisitId]);

  const modalLaneWaitingPay = modalVisit != null && modalVisit.service_status === "COMPLETED";
  const photoResolved = modalVisit ? resolveAssetUrl(modalVisit.photo_url, baseUrl) : null;
  const rowBusy = modalVisit != null && busyVisitId === modalVisit.id;

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
    if (payVisitId == null) return;
    const v = visits.find((x) => x.id === payVisitId);
    if (!v || !isInServiceLaneToday(v) || v.service_status === "PAID") {
      closeLanePay();
    }
  }, [visits, payVisitId]);

  useEffect(() => {
    if (laneModalVisitId == null) return;
    setBillPrintedAt(
      new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }),
    );
    setPrintReceipt(true);
    setPrintTaxInvoice(false);
    const v = visits.find((x) => x.id === laneModalVisitId);
    setBillingName(v?.customer_name?.trim() || "");
    setCustomerTaxId("");
    setCustomerAddress("");
    setCustomerBranch("");
    setPrintDocErr(null);
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
    void fetch(
      staffApiUrl("/api/car-wash/session/promptpay-qr"),
      staffApiInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      }),
    )
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
  }, [laneModalView, modalVisit?.id, modalVisit?.final_price, staffApiUrl, staffApiInit]);

  const finalizeLanePhoto = useCallback(
    async (file: File) => {
      const id = lanePhotoTargetVisitIdRef.current;
      const kind = lanePhotoKindRef.current;
      lanePhotoTargetVisitIdRef.current = null;
      if (id == null) return;
      setLanePhotoBusy(true);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url = await uploadCarWashSessionImage(prepared, staffAuth);
        if (kind === "slip") {
          await onVisitPhotoUpdate(id, url);
        } else {
          const visit = visits.find((x) => x.id === id);
          const prev = visit?.evidence_photo_urls ?? [];
          if (prev.length >= CAR_WASH_VISIT_EVIDENCE_MAX) {
            window.alert(`แนบรูปหลักฐานได้ไม่เกิน ${CAR_WASH_VISIT_EVIDENCE_MAX} รูป`);
            return;
          }
          await onVisitEvidenceUpdate(id, [...prev, url].slice(0, CAR_WASH_VISIT_EVIDENCE_MAX));
        }
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
      } finally {
        setLanePhotoBusy(false);
      }
    },
    [onVisitPhotoUpdate, onVisitEvidenceUpdate, visits, staffAuth],
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

  const openLaneMediaPicker = useCallback(
    (kind: LanePhotoKind, mode: "gallery" | "camera") => {
      if (!modalVisit || rowBusy || lanePhotoBusy) return;
      if (kind === "evidence") {
        const n = modalVisit.evidence_photo_urls?.length ?? 0;
        if (n >= CAR_WASH_VISIT_EVIDENCE_MAX) {
          window.alert(`แนบรูปหลักฐานได้ไม่เกิน ${CAR_WASH_VISIT_EVIDENCE_MAX} รูป`);
          return;
        }
      }
      lanePhotoTargetVisitIdRef.current = modalVisit.id;
      lanePhotoKindRef.current = kind;
      if (mode === "gallery") laneGalleryInputRef.current?.click();
      else setLaneCameraOpen(true);
    },
    [modalVisit, rowBusy, lanePhotoBusy],
  );

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

  const handlePrintBill = useCallback(() => {
    if (!modalVisit) return;
    if (!printReceipt && !printTaxInvoice) {
      setPrintDocErr("เลือกอย่างน้อยหนึ่งเอกสาร: ใบเสร็จ หรือ ใบกำกับภาษี");
      return;
    }
    if (printTaxInvoice) {
      if (!billingName.trim()) {
        setPrintDocErr("กรอกชื่อในใบกำกับภาษี");
        return;
      }
      if (!isValidThaiId13(customerTaxId)) {
        setPrintDocErr("เลขผู้เสียภาษีต้องเป็น 13 หลักที่ถูกต้อง");
        return;
      }
      if (!customerAddress.trim()) {
        setPrintDocErr("กรอกที่อยู่ในใบกำกับภาษี");
        return;
      }
    }
    const shop = resolveLanePrintShop();
    const data = carWashPrintVisitInputFromVisit(shop, modalVisit, {
      customerName: printTaxInvoice ? billingName : undefined,
      customerAddress: printTaxInvoice ? customerAddress.trim() : null,
      customerTaxId: printTaxInvoice ? customerTaxId.trim() : null,
    });
    if (!data) {
      window.alert("รายการนี้มียอด ฿0 — ไม่พิมพ์ใบเสร็จรับเงิน");
      return;
    }
    if (printTaxInvoice && customerBranch.trim()) {
      data.note = [data.note, `สาขา ${customerBranch.trim()}`].filter(Boolean).join(" · ");
    }
    setPrintDocErr(null);
    printCarWashVisitDocs({
      receipt: printReceipt,
      taxInvoice: printTaxInvoice,
      data,
      receiptPaper: slipPaper,
    });
  }, [
    modalVisit,
    printReceipt,
    printTaxInvoice,
    billingName,
    customerTaxId,
    customerAddress,
    customerBranch,
    slipPaper,
    shopPrintProfile,
    shopLabel,
    logoUrl,
    baseUrl,
  ]);

  async function clearLaneSlip() {
    if (!modalVisit) return;
    if (!confirm("ลบรูปสลิปออกจากรายการนี้?")) return;
    try {
      await onVisitPhotoUpdate(modalVisit.id, "");
    } catch {
      window.alert("ล้างสลิปไม่สำเร็จ");
    }
  }

  async function removeLaneEvidence(url: string) {
    if (!modalVisit) return;
    const next = (modalVisit.evidence_photo_urls ?? []).filter((u) => u !== url);
    try {
      await onVisitEvidenceUpdate(modalVisit.id, next);
    } catch {
      window.alert("ลบรูปหลักฐานไม่สำเร็จ");
    }
  }

  async function clearLaneEvidenceAll() {
    if (!modalVisit) return;
    if (!confirm("ลบรูปหลักฐานสภาพรถทั้งหมด?")) return;
    try {
      await onVisitEvidenceUpdate(modalVisit.id, []);
    } catch {
      window.alert("ล้างรูปหลักฐานไม่สำเร็จ");
    }
  }

  const laneHeaderActionClass =
    "cw-btn app-tap-feedback inline-flex h-[44px] min-h-[44px] items-center justify-center rounded-xl px-3 sm:px-3.5 sm:text-sm";

  const hubToolbarEl = showHubTabToolbar ? (
    <Suspense
      fallback={
        <div className="h-[44px] w-[7.5rem] shrink-0 animate-pulse rounded-xl bg-white/40" aria-hidden />
      }
    >
      <CarWashDashboardTabToolbar matchCardActions className="shrink-0" />
    </Suspense>
  ) : null;

  const headerRow =
    !staffLayout ?
      <div className="flex items-start justify-between gap-3 border-b border-[#ecebff] pb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#2e2a58]">ลานล้างวันนี้</h2>
          <p className="mt-1 text-xs text-[#66638c]">
            เปลี่ยนสถานะ · แนบรูป · บิล/QR · พิมพ์ใบเสร็จได้จากการ์ดเลย
          </p>
        </div>
        {onRecordVisit || onRefresh || showFullscreenBoardLink || showHubTabToolbar ?
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 self-start sm:gap-2">
            {showFullscreenBoardLink ?
              <Link
                href={fullscreenBoardHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  laneHeaderActionClass,
                  "app-btn-soft border border-[#dcd8f0] text-[#4d47b6] hover:bg-[#f4f3ff]",
                )}
                aria-label="แสดงลานล้างวันนี้เต็มจอ"
                title="แสดงเต็มจอ (อัปเดตสด)"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
                </svg>
                {!iconOnlyActions ? <span className="cw-btn-label">เต็มจอ</span> : null}
              </Link>
            : null}
            {onRefresh ?
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className={cn(
                  laneHeaderActionClass,
                  "app-btn-soft border border-[#dcd8f0] text-[#4d47b6] hover:bg-[#f4f3ff] disabled:opacity-60",
                )}
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
                className={cn(laneHeaderActionClass, "app-btn-primary sm:px-4")}
                aria-label="บันทึกรายการ"
              >
                <svg className="cw-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                {!iconOnlyActions ? <span className="cw-btn-label">บันทึกรายการ</span> : null}
              </button>
            : null}
            {hubToolbarEl}
          </div>
        : null}
      </div>
    : null;

  /** มุมขวาบนของการ์ดลานล้าง (staff) — แทน FAB ลอยมุมล่าง */
  const staffCardToolbar =
    staffLayout && (onRefresh || onRecordVisit || showFullscreenBoardLink) ?
      <div className="-mt-1 mb-3 flex shrink-0 items-center justify-end gap-2 sm:-mt-0.5 sm:mb-4">
        {showFullscreenBoardLink ?
          <Link
            href={fullscreenBoardHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#dcd8f0]/90 bg-white/90 text-[#4d47b6] shadow-sm ring-1 ring-white/70 transition hover:bg-[#f4f3ff]"
            aria-label="แสดงลานล้างวันนี้เต็มจอ"
            title="แสดงเต็มจอ (อัปเดตสด)"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
            </svg>
          </Link>
        : null}
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

  const laneStatCards = [
    { label: "ทั้งหมด", value: laneSummary.total, tone: "text-[#1e1b4b] bg-white/80 border-white/70" },
    { label: "รอคิว", value: laneSummary.queued, tone: "text-amber-900 bg-amber-50/90 border-amber-200/80" },
    { label: "กำลังบริการ", value: laneSummary.inService, tone: "text-sky-900 bg-sky-50/90 border-sky-200/80" },
    {
      label: "รอชำระ",
      value: laneSummary.waitingPay,
      tone: "text-emerald-900 bg-emerald-50/90 border-emerald-200/80",
    },
    {
      label: "รอส่งมอบ",
      value: laneSummary.waitingHandover,
      tone: "text-violet-900 bg-violet-50/90 border-violet-200/80",
    },
  ];

  const listBlock =
    serviceActive.length === 0 && handoverActive.length === 0 ?
      <AppEmptyState tone="violet" className={cn(staffLayout ? "py-8" : "mt-4 py-8")}>
        ไม่มีคิวในลานตอนนี้ — กด「บันทึกรายการ」เพื่อรับรถเข้าลาน
      </AppEmptyState>
    : (
      <>
        <div
          className={cn(
            "grid grid-cols-2 gap-2 sm:grid-cols-5",
            staffLayout ? "mb-3" : "mt-4 mb-1",
          )}
          aria-label="สรุปลานล้างวันนี้"
        >
          {laneStatCards.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "rounded-xl border px-2.5 py-2 text-center shadow-sm sm:rounded-2xl sm:px-3 sm:py-2.5",
                s.tone,
                i === laneStatCards.length - 1 && laneStatCards.length % 2 === 1
                  ? "col-span-2 sm:col-span-1"
                  : undefined,
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
          {serviceActive.map((v) => {
            const waitingPay = needsLanePayment(v);
            const st = activeLaneKey(v.service_status);
            const tone = waitingPay ? waitingPayLaneTone : laneTone[st];
            const badgeLabel =
              waitingPay ?
                v.amount_remaining > 0 ? `ชำระคงเหลือ ฿${v.amount_remaining.toLocaleString("th-TH")}` : "รอชำระ"
              : carWashStatusLabelTh(st);
            const pkgMins = packages.find((p) => p.id === v.package_id)?.duration_minutes;
            const elapsed = laneClockMs != null ? minsSince(v.visit_at, laneClockMs) : 0;
            const rowBusy = busyVisitId === v.id;
            const next = nextLaneStatus(v);
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
                    <p className="flex flex-wrap items-center gap-1.5 text-sm font-black tabular-nums text-emerald-700">
                      ฿{v.final_price.toLocaleString("th-TH")}
                      {v.bundle_id != null ? (
                        <span className="text-[10px] font-bold text-amber-700">เหมา</span>
                      ) : null}
                      {v.amount_remaining > 0 ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                            remainingPillClass,
                          )}
                        >
                          ชำระคงเหลือ ฿{v.amount_remaining.toLocaleString("th-TH")}
                        </span>
                      ) : v.is_fully_paid && v.service_status !== "PAID" && v.service_status !== "HANDED_OVER" ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-200/80">
                          ชำระแล้ว
                        </span>
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
                        aria-pressed={false}
                        title={
                          !canSelectPaidLane(v)
                            ? "ตั้งสถานะเสร็จแล้วก่อน — คงอยู่ในลานจนกว่าจะชำระ"
                            : v.is_fully_paid
                              ? "ชำระแล้ว · เข้าคิวรอส่งมอบ"
                              : "รับชำระแล้วเข้าคิวรอส่งมอบ"
                        }
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-black transition disabled:opacity-40",
                          canSelectPaidLane(v)
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : "border border-slate-200 bg-white/70 text-slate-400",
                        )}
                        onClick={() => void applyLaneStatus(v, "PAID")}
                      >
                        {canSelectPaidLane(v) && v.is_fully_paid ? "เข้าคิวส่งมอบ" : "ชำระ"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-white/60 pt-3">
                    {next && next !== "PAID" ? (
                      <button
                        type="button"
                        disabled={rowBusy}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#5b61ff] to-[#8d64ff] text-white shadow-sm disabled:opacity-50"
                        aria-label={`ขั้นถัดไป: ${carWashStatusLabelTh(next)}`}
                        title={`ขั้นถัดไป: ${carWashStatusLabelTh(next)}`}
                        onClick={() => void applyLaneStatus(v, next)}
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    ) : null}
                    {needsLanePayment(v) ? (
                      <button
                        type="button"
                        disabled={rowBusy || payBusy}
                        className={cn(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm disabled:opacity-50",
                          v.is_fully_paid
                            ? "bg-gradient-to-r from-violet-500 to-violet-600"
                            : "bg-gradient-to-r from-emerald-500 to-emerald-600",
                        )}
                        aria-label={
                          v.is_fully_paid
                            ? `เข้าคิวส่งมอบ ${v.plate_number.trim() || v.id}`
                            : `รับชำระ ${v.plate_number.trim() || v.id}`
                        }
                        title={v.is_fully_paid ? "ชำระแล้ว · เข้าคิวส่งมอบ" : "รับชำระ"}
                        onClick={() => void applyLaneStatus(v, "PAID")}
                      >
                        {v.is_fully_paid ? (
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <rect x="2" y="5" width="20" height="14" rx="2" />
                            <path d="M2 10h20" />
                          </svg>
                        )}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0",
                      )}
                      aria-label={`รายละเอียด ${v.plate_number.trim() || v.id}`}
                      title="รายละเอียด"
                      onClick={() => openLaneDetails(v.id)}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 10v6M12 7.5h.01" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0",
                      )}
                      aria-label={`บิลและ QR ${v.plate_number.trim() || v.id}`}
                      title="บิล / QR"
                      onClick={() => openLaneBill(v.id)}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <rect x="3" y="3" width="7" height="7" rx="1" />
                        <rect x="14" y="3" width="7" height="7" rx="1" />
                        <rect x="3" y="14" width="7" height="7" rx="1" />
                        <path d="M14 14h3v3h-3zM20 14v6M14 20h3" strokeLinecap="round" />
                      </svg>
                    </button>
                    {v.final_price > 0 ? (
                      <button
                        type="button"
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0",
                        )}
                        aria-label={`พิมพ์ใบเสร็จ ${v.plate_number.trim() || v.id}`}
                        title="พิมพ์ใบเสร็จ"
                        onClick={() => printLaneReceipt(v)}
                      >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                          <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect width="12" height="8" x="6" y="14" />
                        </svg>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={
                        rowBusy ||
                        lanePhotoBusy ||
                        (v.evidence_photo_urls?.length ?? 0) >= CAR_WASH_VISIT_EVIDENCE_MAX
                      }
                      className={cn(
                        appTemplateOutlineButtonClass,
                        "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0 disabled:opacity-50",
                      )}
                      aria-label={`ถ่ายรูปหลักฐานสภาพรถ ${v.plate_number.trim() || v.id}`}
                      title={`รูปหลักฐาน ${(v.evidence_photo_urls?.length ?? 0)}/${CAR_WASH_VISIT_EVIDENCE_MAX}`}
                      onClick={() => pickLaneCameraForVisit(v.id, "evidence")}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      {(v.evidence_photo_urls?.length ?? 0) > 0 ? (
                        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5b61ff] px-1 text-[9px] font-black text-white">
                          {v.evidence_photo_urls.length}
                        </span>
                      ) : null}
                    </button>
                    {v.photo_url?.trim() ? (
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-2 ring-emerald-200/90"
                        aria-label="ดูสลิปชำระ"
                        title="สลิปชำระ"
                        onClick={() => {
                          const u = resolveAssetUrl(v.photo_url, baseUrl);
                          if (u) lightbox.open(u);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveAssetUrl(v.photo_url, baseUrl) ?? ""} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : null}
                    {(v.evidence_photo_urls?.[0] ?? "").trim() ? (
                      <button
                        type="button"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-2 ring-white/80"
                        aria-label="ดูรูปหลักฐานสภาพรถ"
                        title="รูปหลักฐาน"
                        onClick={() => {
                          const u = resolveAssetUrl(v.evidence_photo_urls[0], baseUrl);
                          if (u) lightbox.open(u);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveAssetUrl(v.evidence_photo_urls[0], baseUrl) ?? ""}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <div className={cn("border-t border-[#ecebff] pt-4", staffLayout ? "mt-3" : "mt-5")}>
          <p className="text-sm font-bold text-[#2e2a58]">ลานรอส่งมอบ</p>
          <p className="mt-0.5 text-xs text-[#66638c]">ชำระแล้ว — แตะ「ส่งมอบ」เมื่อลูกค้ารับรถออกจากลาน</p>

          {handoverActive.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-violet-200/80 bg-violet-50/50 px-3 py-3 text-center text-xs font-medium text-violet-800">
              ยังไม่มีรถรอส่งมอบ
            </p>
          ) : (
            <ul
              className={cn(
                "grid gap-3",
                staffLayout ? "mt-3 grid-cols-1" : "mt-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {handoverActive.map((v) => {
                const elapsed = laneClockMs != null ? minsSince(v.visit_at, laneClockMs) : 0;
                const rowBusy = busyVisitId === v.id;
                return (
                  <li key={v.id}>
                    <article
                      className={cn(
                        "flex h-full w-full flex-col rounded-2xl border-2 p-3 shadow-sm ring-1 transition sm:p-4",
                        handoverLaneTone.border,
                        handoverLaneTone.bg,
                        handoverLaneTone.ring,
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
                            "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                            handoverLaneTone.badge,
                          )}
                        >
                          รอส่งมอบ
                        </span>
                      </div>

                      <div className="mt-2 min-w-0 space-y-0.5">
                        <p className="line-clamp-1 text-sm font-bold text-[#4d47b6]">{v.package_name}</p>
                        <p className="line-clamp-1 text-xs font-medium text-[#66638c]">
                          {v.customer_name.trim() || "ลูกค้าทั่วไป"}
                          {v.customer_phone?.trim() ? ` · ${v.customer_phone}` : ""}
                        </p>
                        <p className="text-[11px] tabular-nums text-slate-500">ผ่านมา {elapsed} นาที</p>
                        <p className="text-sm font-black tabular-nums text-emerald-700">
                          ฿{v.final_price.toLocaleString("th-TH")}
                          <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 ring-1 ring-emerald-200/80">
                            ชำระแล้ว
                          </span>
                        </p>
                      </div>

                      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-white/60 pt-3">
                        <button
                          type="button"
                          disabled={rowBusy}
                          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-3 text-sm font-black text-white shadow-sm disabled:opacity-50"
                          aria-label={`ส่งมอบ ${v.plate_number.trim() || v.id}`}
                          title="ส่งมอบ — ออกจากลาน"
                          onClick={() => void applyLaneStatus(v, "HANDED_OVER")}
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          ส่งมอบ
                        </button>
                        <button
                          type="button"
                          className={cn(
                            appTemplateOutlineButtonClass,
                            "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0",
                          )}
                          aria-label={`รายละเอียด ${v.plate_number.trim() || v.id}`}
                          title="รายละเอียด"
                          onClick={() => openLaneDetails(v.id)}
                        >
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 10v6M12 7.5h.01" strokeLinecap="round" />
                          </svg>
                        </button>
                        {v.final_price > 0 ? (
                          <button
                            type="button"
                            className={cn(
                              appTemplateOutlineButtonClass,
                              "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl p-0",
                            )}
                            aria-label={`พิมพ์ใบเสร็จ ${v.plate_number.trim() || v.id}`}
                            title="พิมพ์ใบเสร็จ"
                            onClick={() => printLaneReceipt(v)}
                          >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                              <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect width="12" height="8" x="6" y="14" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
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
              <div className="flex w-full items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    billFooterBtnClass,
                    "flex-1 border border-indigo-100 bg-indigo-50/50 text-[#5b61ff] hover:bg-indigo-100",
                  )}
                  onClick={() => {
                    setLaneModalView("bill");
                    setPrintReceipt(true);
                    setPrintTaxInvoice(false);
                    setBillingName(modalVisit.customer_name.trim() || "");
                    setCustomerTaxId("");
                    setCustomerAddress("");
                    setCustomerBranch("");
                    setPrintDocErr(null);
                  }}
                >
                  บิลและ QR ชำระเงิน
                </button>
                <button
                  type="button"
                  className={cn(
                    billFooterBtnClass,
                    "flex-1 border border-slate-200 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                  onClick={() => setLaneModalVisitId(null)}
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            : <div className="flex w-full flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AppSlipPaperSizeToolbar
                    value={slipPaper}
                    onChange={setSlipPaper}
                    sizes={["SLIP_58", "SLIP_80", "A4"]}
                    aria-label="ขนาดกระดาษบิลคาร์แคร์"
                    className="[&_button]:h-11 [&_button]:min-h-[44px]"
                  />
                  <button
                    type="button"
                    className={cn(
                      billFooterBtnClass,
                      "gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                    onClick={() => handlePrintBill()}
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect width="12" height="8" x="6" y="14" />
                    </svg>
                    พิมพ์ที่เลือก
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={cn(
                      billFooterBtnClass,
                      "flex-1 border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 sm:flex-none sm:px-8",
                    )}
                    onClick={() => setLaneModalView("details")}
                  >
                    กลับ
                  </button>
                  <button
                    type="button"
                    className={cn(
                      billFooterBtnClass,
                      "flex-1 bg-slate-900 text-white sm:flex-none sm:px-8",
                    )}
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
                    modalLaneWaitingPay ? waitingPayModalBoxClass
                    : modalVisit.service_status === "PAID" ? handoverModalBoxClass
                    : modalDetailBoxClass(modalVisit.service_status),
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span
                      className={cn(
                        "inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1",
                        modalLaneWaitingPay ? waitingPayModalBadgeClass
                        : modalVisit.service_status === "PAID" ? handoverModalBadgeClass
                        : modalBadgeClass(modalVisit.service_status),
                      )}
                    >
                      {modalLaneWaitingPay ?
                        modalVisit.amount_remaining > 0 ?
                          `เสร็จแล้ว — ชำระคงเหลือ ฿${modalVisit.amount_remaining.toLocaleString("th-TH")}`
                        : "เสร็จแล้ว — รอชำระ"
                      : modalVisit.service_status === "PAID" ? "ชำระแล้ว — รอส่งมอบ"
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

                  {modalLaneWaitingPay ?
                    <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-100/90 px-3 py-2.5 text-xs font-medium leading-snug text-emerald-950">
                      {modalVisit && isPendingBundleVisit(modalVisit) ?
                        'กดปุ่ม «ชำระ / ปิดคิว» เพื่อหักครั้งแพ็กเกจเหมาและนำรายการออกจากลาน'
                      : modalVisit.amount_remaining > 0 ?
                        `รายการยังค้างในลานจนกว่าจะรับชำระคงเหลือ ฿${modalVisit.amount_remaining.toLocaleString("th-TH")} — กดปุ่มรับชำระเพื่อเข้าคิวรอส่งมอบ`
                      : 'รายการยังค้างในลานจนกว่าจะรับชำระ — กดปุ่มรับชำระ (เลือกเงินสด / QR / โอน) เพื่อเข้าคิวรอส่งมอบ'}
                    </p>
                  : modalVisit.service_status === "PAID" ?
                    <p className="mt-3 rounded-xl border border-violet-200 bg-violet-100/90 px-3 py-2.5 text-xs font-medium leading-snug text-violet-950">
                      ชำระแล้ว — กดปุ่ม «ส่งมอบ» เมื่อลูกค้ารับรถออกจากลาน
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
                      {modalVisit.amount_remaining > 0 ?
                        <div className="flex justify-between gap-4 py-2.5">
                          <dt className="shrink-0 text-[#66638c]">ชำระคงเหลือ</dt>
                          <dd className="text-lg font-bold tabular-nums text-amber-700">
                            ฿{modalVisit.amount_remaining.toLocaleString("th-TH")}
                          </dd>
                        </div>
                      : modalVisit.is_fully_paid ?
                        <div className="flex justify-between gap-4 py-2.5">
                          <dt className="shrink-0 text-[#66638c]">สถานะชำระ</dt>
                          <dd className="text-sm font-bold text-emerald-700">ชำระแล้ว</dd>
                        </div>
                      : null}
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
                          void applyLaneStatus(modalVisit, next);
                        }}
                      >
                        {CAR_WASH_SERVICE_STATUSES.map((s) => (
                          <option
                            key={s}
                            value={s}
                            disabled={
                              (s === "PAID" && !canSelectPaidLane(modalVisit)) ||
                              (s === "HANDED_OVER" && modalVisit.service_status !== "PAID")
                            }
                          >
                            {s === "PAID" ?
                              modalVisit.is_fully_paid ? "เข้าคิวส่งมอบ (ชำระแล้ว)" : "ชำระแล้ว (ปิดคิว)"
                            : s === "HANDED_OVER" ? "ส่งมอบแล้ว (ออกจากลาน)"
                            : `${carWashStatusLabelTh(s)} (${s})`}
                          </option>
                        ))}
                      </select>
                    </label>
                    {modalLaneWaitingPay ?
                      <button
                        type="button"
                        disabled={rowBusy || payBusy}
                        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-black text-white shadow-sm disabled:opacity-50"
                        onClick={() => void applyLaneStatus(modalVisit, "PAID")}
                      >
                        {isPendingBundleVisit(modalVisit) || modalVisit.final_price <= 0 ?
                          "ปิดคิว / หักสิทธิ์"
                        : modalVisit.is_fully_paid ? "เข้าคิวรอส่งมอบ"
                        : `รับชำระ ฿${modalVisit.amount_remaining > 0 ? modalVisit.amount_remaining.toLocaleString("th-TH") : modalVisit.final_price.toLocaleString("th-TH")}`}
                      </button>
                    : modalVisit.service_status === "PAID" ?
                      <button
                        type="button"
                        disabled={rowBusy}
                        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-4 text-sm font-black text-white shadow-sm disabled:opacity-50"
                        onClick={() => void applyLaneStatus(modalVisit, "HANDED_OVER")}
                      >
                        ส่งมอบ (ออกจากลาน)
                      </button>
                    : null}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        1) สลิปชำระเงิน
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-[#8b87b8]">
                        หลักฐานโอน / พร้อมเพย์ (1 รูป · ไม่บังคับ)
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {photoResolved ? (
                          <AppImageThumb
                            className="!h-20 !w-20 shrink-0 rounded-xl ring-1 ring-slate-200"
                            src={photoResolved}
                            alt="สลิปชำระ"
                            onOpen={() => lightbox.open(photoResolved)}
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-center text-[10px] font-medium leading-tight text-slate-400">
                            ไม่มีสลิป
                          </div>
                        )}
                        <AppImagePickCameraButtons
                          className="!justify-start gap-2"
                          busy={lanePhotoBusy}
                          disabled={rowBusy}
                          labels={{ gallery: "เลือกสลิป", camera: "ถ่ายสลิป", busy: "กำลังอัปโหลด…" }}
                          onPickGallery={() => openLaneMediaPicker("slip", "gallery")}
                          onPickCamera={() => openLaneMediaPicker("slip", "camera")}
                        />
                        {photoResolved ? (
                          <button
                            type="button"
                            disabled={rowBusy || lanePhotoBusy}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                            onClick={() => void clearLaneSlip()}
                          >
                            ลบสลิป
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            2) รูปหลักฐานสภาพรถ
                          </p>
                          <p className="mt-1 text-[11px] font-medium text-[#8b87b8]">
                            ร่องรอย / รอยขีดข่วนก่อน–หลังล้าง · สูงสุด {CAR_WASH_VISIT_EVIDENCE_MAX} รูป
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black tabular-nums text-slate-600">
                          {(modalVisit.evidence_photo_urls?.length ?? 0)}/{CAR_WASH_VISIT_EVIDENCE_MAX}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(modalVisit.evidence_photo_urls ?? []).map((raw) => {
                          const src = resolveAssetUrl(raw, baseUrl);
                          if (!src) return null;
                          return (
                            <div key={raw} className="relative">
                              <AppImageThumb
                                className="!h-20 !w-20 rounded-xl ring-1 ring-slate-200"
                                src={src}
                                alt="หลักฐานสภาพรถ"
                                onOpen={() => lightbox.open(src)}
                              />
                              <button
                                type="button"
                                disabled={rowBusy || lanePhotoBusy}
                                className="absolute -right-1.5 -top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 shadow-sm disabled:opacity-50"
                                aria-label="ลบรูปหลักฐาน"
                                title="ลบรูป"
                                onClick={() => void removeLaneEvidence(raw)}
                              >
                                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                                  <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                        {(modalVisit.evidence_photo_urls?.length ?? 0) === 0 ? (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-center text-[10px] font-medium leading-tight text-slate-400">
                            ยังไม่มีรูป
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <AppImagePickCameraButtons
                          className="!justify-start gap-2"
                          busy={lanePhotoBusy}
                          disabled={
                            rowBusy ||
                            (modalVisit.evidence_photo_urls?.length ?? 0) >= CAR_WASH_VISIT_EVIDENCE_MAX
                          }
                          labels={{
                            gallery: "เลือกรูป",
                            camera: "ถ่ายรูป",
                            busy: "กำลังอัปโหลด…",
                          }}
                          onPickGallery={() => openLaneMediaPicker("evidence", "gallery")}
                          onPickCamera={() => openLaneMediaPicker("evidence", "camera")}
                        />
                        {(modalVisit.evidence_photo_urls?.length ?? 0) > 0 ? (
                          <button
                            type="button"
                            disabled={rowBusy || lanePhotoBusy}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                            onClick={() => void clearLaneEvidenceAll()}
                          >
                            ลบทั้งหมด
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            : <div className="space-y-4">
                {/* พรีวิวสลิป — โครงเดียวกับ printAppReceiptSlip (SLIP_58 กึ่งกลาง) */}
                <div className="mx-auto w-full max-w-[18rem] rounded-sm border border-slate-300/90 bg-white px-3 py-4 font-sans text-[12px] leading-snug text-slate-900 shadow-[0_8px_28px_-18px_rgba(15,23,42,0.45)] sm:max-w-[20rem]">
                  <header className="border-b border-dashed border-slate-300 pb-3 text-center">
                    {logoUrl?.trim() ?
                      <div className="mb-2 flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoUrl.trim()}
                          alt=""
                          className="max-h-12 max-w-[7.5rem] rounded-full object-contain"
                        />
                      </div>
                    : null}
                    <h3 className="text-sm font-extrabold tracking-tight text-slate-900">{shopLabel}</h3>
                    {shopPrintProfile?.address?.trim() ?
                      <p className="mt-1 whitespace-pre-line text-[11px] text-slate-600">
                        {shopPrintProfile.address.trim()}
                      </p>
                    : null}
                    {shopPrintProfile?.contactPhone?.trim() ?
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        โทร. {shopPrintProfile.contactPhone.trim()}
                      </p>
                    : null}
                    {shopPrintProfile?.taxId?.trim() ?
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        เลขประจำตัวผู้เสียภาษี {shopPrintProfile.taxId.trim()}
                      </p>
                    : null}
                    <p className="mt-2 text-xs font-extrabold text-[#0000BF]">
                      {printTaxInvoice && !printReceipt ? "ใบกำกับภาษี" : "ใบเสร็จรับเงิน"}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-slate-500">
                      เลขที่ CW-{modalVisit.id} · {billPrintedAt || "—"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-800">
                      ลูกค้า{" "}
                      {(printTaxInvoice ? billingName.trim() : "") ||
                        modalVisit.customer_name.trim() ||
                        "—"}
                    </p>
                    {printTaxInvoice && customerTaxId.trim() ?
                      <p className="mt-0.5 text-[10px] text-slate-600">
                        เลขผู้เสียภาษี {customerTaxId.trim()}
                      </p>
                    : null}
                    {printTaxInvoice && customerAddress.trim() ?
                      <p className="mt-0.5 whitespace-pre-line text-[10px] text-slate-600">
                        ที่อยู่ {customerAddress.trim()}
                      </p>
                    : null}
                  </header>

                  <div className="mt-3 space-y-1.5 border-b border-slate-200 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1">
                        {(modalVisit.package_name.trim() || "บริการคาร์แคร์") + " × 1"}
                      </span>
                      <span className="shrink-0 font-bold tabular-nums">
                        ฿{modalVisit.final_price.toLocaleString("th-TH")}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {[
                        `ทะเบียน ${modalVisit.plate_number.trim() || "—"}`,
                        modalVisit.customer_phone?.trim() || null,
                        modalVisit.note?.trim() || null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between gap-2 border-b border-dashed border-slate-300 pb-2 font-extrabold">
                    <span>ยอดรวม (บาท)</span>
                    <span className="tabular-nums text-[#0000BF]">
                      ฿{modalVisit.final_price.toLocaleString("th-TH")}
                    </span>
                  </div>

                  {paymentChannelsNote ?
                    <section className="mt-3">
                      <h4 className="text-[10px] font-bold text-slate-700">ช่องทางชำระ</h4>
                      <p className="mt-0.5 whitespace-pre-line text-[10px] text-slate-600">
                        {paymentChannelsNote}
                      </p>
                    </section>
                  : null}

                  <section className="mt-4 flex flex-col items-center border-t border-dashed border-slate-300 pt-3">
                    <h4 className="text-xs font-bold text-slate-900">สแกนจ่าย</h4>
                    {ppQrLoading ?
                      <p className="mt-3 text-[11px] text-slate-500">กำลังสร้าง QR…</p>
                    : ppQrUrl ?
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={ppQrUrl}
                          alt="QR ชำระเงิน"
                          className="mt-2 h-40 w-40 object-contain sm:h-44 sm:w-44"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">
                          ยอด {modalVisit.final_price.toLocaleString("th-TH")} บาท
                        </p>
                      </>
                    : !ppConfigured ?
                      <p className="mt-2 max-w-[14rem] text-center text-[11px] text-amber-800">
                        ยังไม่ได้ตั้งเบอร์สำหรับ QR ชำระเงิน — ตั้งได้ที่{" "}
                        <Link href="/dashboard/profile" className="font-semibold text-[#0000BF] underline">
                          โปรไฟล์
                        </Link>
                      </p>
                    : <p className="mt-2 text-center text-[11px] text-slate-500">
                        ไม่สามารถสร้าง QR ได้ — ลองรีเฟรชหรือตรวจสอบเบอร์สำหรับ QR
                      </p>}
                  </section>

                  <p className="mt-4 text-center text-[10px] text-slate-400">ขอบคุณที่ใช้บริการ</p>
                </div>

                <div className="space-y-2 rounded-[1.25rem] border border-[#ecebff] bg-white/80 p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                    เลือกเอกสารพิมพ์
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className={billDocChipClass(printReceipt)}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#5b61ff]"
                        checked={printReceipt}
                        onChange={(e) => {
                          setPrintReceipt(e.target.checked);
                          setPrintDocErr(null);
                        }}
                      />
                      ใบเสร็จ
                    </label>
                    <label className={billDocChipClass(printTaxInvoice)}>
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#5b61ff]"
                        checked={printTaxInvoice}
                        onChange={(e) => {
                          const on = e.target.checked;
                          setPrintTaxInvoice(on);
                          setPrintDocErr(null);
                          if (on && !billingName.trim()) {
                            setBillingName(modalVisit.customer_name.trim() || "");
                          }
                        }}
                      />
                      ใบกำกับภาษี
                    </label>
                  </div>

                  {printTaxInvoice ?
                    <div className="mt-1 space-y-2.5 rounded-[1.25rem] border border-dashed border-[#5b61ff]/35 bg-[#f7f6ff]/80 p-3">
                      <label className="block text-xs font-bold text-[#4d47b6]">
                        ชื่อ / ชื่อบริษัทในใบกำกับ
                        <input
                          className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 text-sm"
                          value={billingName}
                          onChange={(e) => setBillingName(e.target.value.slice(0, 160))}
                          placeholder="ชื่อตามบัตรประชาชน หรือชื่อนิติบุคคล"
                        />
                      </label>
                      <label className="block text-xs font-bold text-[#4d47b6]">
                        เลขบัตรประชาชน / เลขผู้เสียภาษี (13 หลัก)
                        <input
                          className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 text-sm"
                          value={customerTaxId}
                          inputMode="numeric"
                          maxLength={13}
                          onChange={(e) => setCustomerTaxId(digitsOnlyTaxId(e.target.value))}
                          placeholder="1234567890123"
                        />
                        {customerTaxId.trim() && !isValidThaiId13(customerTaxId) ?
                          <span className="mt-1 block font-semibold text-rose-600">
                            เลข 13 หลักไม่ถูกต้อง
                          </span>
                        : null}
                      </label>
                      <label className="block text-xs font-bold text-[#4d47b6]">
                        ที่อยู่บนใบกำกับ
                        <textarea
                          className="app-input mt-1 min-h-[72px] w-full rounded-xl px-3 py-2 text-sm"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value.slice(0, 400))}
                          placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                        />
                      </label>
                      <label className="block text-xs font-bold text-[#4d47b6]">
                        สาขา (ถ้ามี)
                        <input
                          className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 text-sm"
                          value={customerBranch}
                          onChange={(e) => setCustomerBranch(e.target.value.slice(0, 80))}
                          placeholder="สำนักงานใหญ่ / สาขา…"
                        />
                      </label>
                    </div>
                  : null}

                  {printDocErr ?
                    <p className="text-xs font-semibold text-rose-600">{printDocErr}</p>
                  : (
                    <p className="text-[11px] font-semibold text-[#8b87b8]">
                      ใบเสร็จใช้ขนาดที่เลือกด้านล่าง · ใบกำกับพิมพ์ A4 ตามมาตรฐานสลิปกลาง
                    </p>
                  )}
                </div>
              </div>}
          </div>
        : null}
      </FormModal>

      <FormModal
        open={payVisit != null}
        onClose={closeLanePay}
        size="lg"
        mobileCentered={staffLayout}
        title={
          payVisit
            ? isPendingBundleVisit(payVisit) || payVisit.final_price <= 0
              ? `ปิดคิว · ${payVisit.plate_number.trim() || "—"}`
              : `รับชำระ · ${payVisit.plate_number.trim() || "—"}`
            : ""
        }
        footer={
          payVisit ? (
            <div className="flex w-full gap-2">
              <button
                type="button"
                className={cn(billFooterBtnClass, "flex-1 border border-slate-200 bg-white text-slate-500")}
                disabled={payBusy}
                onClick={closeLanePay}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className={cn(
                  billFooterBtnClass,
                  "flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
                )}
                disabled={payBusy}
                onClick={() => void confirmLanePay()}
              >
                {payBusy
                  ? "กำลังบันทึก…"
                  : isPendingBundleVisit(payVisit) || payVisit.final_price <= 0
                    ? "ยืนยันปิดคิว"
                    : "ยืนยันชำระแล้ว"}
              </button>
            </div>
          ) : null
        }
      >
        {payVisit ? (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/80 px-3 py-3 text-sm">
              <p className="font-black text-[#1e1b4b]">
                {payVisit.customer_name.trim() || "ลูกค้า"} · {payVisit.plate_number.trim() || "—"}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-[#66638c]">{payVisit.package_name}</p>
              <p className="mt-2 text-lg font-black tabular-nums text-emerald-700">
                ฿{(payVisit.amount_remaining > 0 ? payVisit.amount_remaining : payVisit.final_price).toLocaleString("th-TH")}
                {isPendingBundleVisit(payVisit) ? (
                  <span className="ml-2 text-xs font-bold text-amber-700">หักสิทธิ์แพ็กเหมา</span>
                ) : payVisit.amount_remaining > 0 && payVisit.amount_remaining < payVisit.final_price ? (
                  <span className="ml-2 text-xs font-bold text-emerald-700">ยอดคงเหลือ (จ่ายมัดจำแล้ว)</span>
                ) : null}
              </p>
              <p className="mt-1 text-[11px] font-medium text-[#8b87b8]">
                หลังยืนยันจะเข้าคิว「รอส่งมอบ」— คงค้างในลานจนกว่าจะส่งมอบให้ลูกค้า
              </p>
            </div>
            {(payVisit.amount_remaining > 0 ? payVisit.amount_remaining : payVisit.final_price) > 0 &&
            !isPendingBundleVisit(payVisit) ? (
              <CarWashPaymentPanel
                amountBaht={payVisit.amount_remaining > 0 ? payVisit.amount_remaining : payVisit.final_price}
                method={payMethod}
                slipUrl={paySlipUrl}
                onMethodChange={(m) => {
                  setPayMethod(m);
                  if (m === "CASH" || m === "CREDIT_CARD") setPaySlipUrl(null);
                }}
                onSlipUrlChange={setPaySlipUrl}
                disabled={payBusy}
                staffAuth={staffAuth}
              />
            ) : (
              <p className="rounded-xl border border-dashed border-amber-200 bg-amber-50/80 px-3 py-2.5 text-xs font-semibold text-amber-950">
                แพ็กเหมา / ยอด ฿0 — กดยืนยันเพื่อหักสิทธิ์ (ถ้ามี) และปิดคิวออกจากลาน
              </p>
            )}
            {payErr ? <p className="text-xs font-semibold text-rose-600">{payErr}</p> : null}
          </div>
        ) : null}
      </FormModal>

      <AppCameraCaptureModal
        open={laneCameraOpen}
        onClose={onLaneCameraModalClose}
        onCapture={(file) => void onLaneCameraCaptured(file)}
        onRequestLegacyPicker={onLaneCameraLegacyPicker}
        title={lanePhotoKindRef.current === "slip" ? "ถ่ายรูปสลิป" : "ถ่ายรูปหลักฐานสภาพรถ"}
      />
    </>
  );
}
