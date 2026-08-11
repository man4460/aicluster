"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  type PosCategory,
  type PosCostCategory,
  type PosCostEntry,
  type PosMenuItem,
  type PosOrder,
  uploadBuildingPosSessionImage,
  uploadBuildingPosStaffImage,
} from "@/systems/building-pos/building-pos-service";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
import { BuildingPosRemoteImg } from "@/systems/building-pos/components/building-pos-remote-image";
import { BuildingPosCostsPanel } from "@/systems/building-pos/components/BuildingPosCostsPanel";
import { BuildingPosLoyaltyCheckoutPanel } from "@/systems/building-pos/components/BuildingPosLoyaltyCheckoutPanel";
import { downloadPosTableStaticHtmlAsA4Pdf } from "@/systems/building-pos/pos-table-bill-pdf-capture";
import {
  buildPosTableBillInnerHtml,
  buildPosTableStaticDocumentHtml,
  openPosTableBillPrintWindow,
  type PosTablePaperSize,
} from "@/systems/building-pos/pos-table-bill-print";
import {
  AppCameraCaptureModal,
  AppColumnBarSparkChart,
  type AppColumnBarBucket,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  AppImageThumb,
  type AppRevenueCostBucket,
  AppRevenueCostColumnChart,
  AppSectionHeader,
  AppSparkChartPanel,
  appDashboardHistoryListShellClass,
  appTemplateOutlineButtonClass,
  AppSlipPaperSizeToolbar,
  useAppCameraCapture,
  useAppSlipPaperSize,
} from "@/components/app-templates";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { HomeFinanceList } from "@/systems/home-finance/components/HomeFinanceUi";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosContentStackClass,
  buildingPosFieldClass,
  buildingPosFinanceSubTabShellClass,
  buildingPosNavActiveClass,
  buildingPosNavIdleClass,
  buildingPosPulseWashClass,
  buildingPosSelectFieldClass,
  buildingPosStatCardEmeraldClass,
  buildingPosStatCardIndigoClass,
  buildingPosStatCardVioletClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

type FinanceDetailPanel = "history" | "expenses";

const FINANCE_DETAIL_TABS: { id: FinanceDetailPanel; label: string }[] = [
  { id: "history", label: "ประวัติ / รายรับ" },
  { id: "expenses", label: "รายจ่าย" },
];

type OpenOrderStatus = "NEW" | "PREPARING" | "SERVED" | "SERVING" | "DELIVERED";

function statusCountsForOpenOrders(list: PosOrder[]): Record<OpenOrderStatus, number> {
  const r: Record<OpenOrderStatus, number> = {
    NEW: 0,
    PREPARING: 0,
    SERVED: 0,
    SERVING: 0,
    DELIVERED: 0,
  };
  for (const o of list) {
    if (
      o.status === "NEW" ||
      o.status === "PREPARING" ||
      o.status === "SERVED" ||
      o.status === "SERVING" ||
      o.status === "DELIVERED"
    ) {
      r[o.status] += 1;
    }
  }
  return r;
}

/** สีการ์ดตามขั้นที่ต้องเร่งก่อน */
function dominantOpenStatus(list: PosOrder[]): OpenOrderStatus {
  const c = statusCountsForOpenOrders(list);
  if (c.NEW > 0) return "NEW";
  if (c.PREPARING > 0) return "PREPARING";
  if (c.SERVED > 0) return "SERVED";
  if (c.SERVING > 0) return "SERVING";
  return "DELIVERED";
}

const tableCardTone: Record<
  OpenOrderStatus,
  { border: string; bg: string; hoverBorder: string; ring: string; stepLabel: string }
> = {
  NEW: {
    border: "border-amber-400/85",
    bg: "bg-gradient-to-b from-amber-50/95 via-white to-white",
    hoverBorder: "hover:border-amber-500",
    ring: "ring-1 ring-amber-300/60",
    stepLabel: "รอรับออเดอร์ / ส่งครัว",
  },
  PREPARING: {
    border: "border-sky-400/80",
    bg: "bg-gradient-to-b from-sky-50/95 via-white to-white",
    hoverBorder: "hover:border-sky-500",
    ring: "ring-1 ring-sky-300/55",
    stepLabel: "กำลังเตรียมอาหาร",
  },
  SERVED: {
    border: "border-emerald-400/80",
    bg: "bg-gradient-to-b from-emerald-50/95 via-white to-white",
    hoverBorder: "hover:border-emerald-500",
    ring: "ring-1 ring-emerald-300/55",
    stepLabel: "ทำเสร็จแล้ว — รอเสิร์ฟ",
  },
  SERVING: {
    border: "border-cyan-400/80",
    bg: "bg-gradient-to-b from-cyan-50/95 via-white to-white",
    hoverBorder: "hover:border-cyan-500",
    ring: "ring-1 ring-cyan-300/55",
    stepLabel: "กำลังเสิร์ฟ",
  },
  DELIVERED: {
    border: "border-violet-400/80",
    bg: "bg-gradient-to-b from-violet-50/95 via-white to-white",
    hoverBorder: "hover:border-violet-500",
    ring: "ring-1 ring-violet-300/55",
    stepLabel: "เสิร์ฟเรียบร้อย — รอเก็บเงิน",
  },
};

const orderBlockTone: Record<OpenOrderStatus, string> = {
  NEW: "border-l-4 border-l-amber-500 bg-amber-50/40",
  PREPARING: "border-l-4 border-l-sky-500 bg-sky-50/35",
  SERVED: "border-l-4 border-l-emerald-500 bg-emerald-50/35",
  SERVING: "border-l-4 border-l-cyan-500 bg-cyan-50/35",
  DELIVERED: "border-l-4 border-l-violet-500 bg-violet-50/35",
};

const statusBadgeClass: Record<OpenOrderStatus, string> = {
  NEW: "bg-amber-100 text-amber-900 ring-amber-200/80",
  PREPARING: "bg-sky-100 text-sky-900 ring-sky-200/80",
  SERVED: "bg-emerald-100 text-emerald-900 ring-emerald-200/80",
  SERVING: "bg-cyan-100 text-cyan-900 ring-cyan-200/80",
  DELIVERED: "bg-violet-100 text-violet-900 ring-violet-200/80",
};

function orderDateKeyBangkok(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

export const statusLabelTh: Record<PosOrder["status"], string> = {
  NEW: "ใหม่",
  PREPARING: "กำลังทำ",
  SERVED: "ทำเสร็จแล้ว",
  SERVING: "กำลังเสิร์ฟ",
  DELIVERED: "เสิร์ฟเรียบร้อย",
  PAID: "ชำระแล้ว",
};

const POS_ORDER_STATUSES: readonly PosOrder["status"][] = [
  "NEW",
  "PREPARING",
  "SERVED",
  "SERVING",
  "DELIVERED",
  "PAID",
] as const;

function PosOrderStatusGlyph({ status }: { status: PosOrder["status"] }) {
  const cls = "h-[15px] w-[15px] sm:h-[18px] sm:w-[18px]";
  switch (status) {
    case "NEW":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" strokeLinecap="round" />
        </svg>
      );
    case "PREPARING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M4 4v8a3 3 0 0 0 6 0V4M10 4v18" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 4v18M15 9h5M15 14h4" strokeLinecap="round" />
        </svg>
      );
    case "SERVED":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" />
        </svg>
      );
    case "SERVING":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "DELIVERED":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path d="M3 11h18M6 11a6 6 0 0 1 12 0" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 11v7M8 18h8" strokeLinecap="round" />
        </svg>
      );
    case "PAID":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M16.5 9.5 11 15l-3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function PosOrderStatusIconStrip({
  orderId,
  current,
  onSelect,
}: {
  orderId: number;
  current: PosOrder["status"];
  onSelect: (status: PosOrder["status"]) => void;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "snap-x snap-mandatory",
      )}
      role="toolbar"
      aria-label={`อัปเดตสถานะออเดอร์ ${orderId}`}
    >
      {POS_ORDER_STATUSES.map((s) => {
        const active = s === current;
        const label = statusLabelTh[s];
        return (
          <button
            key={s}
            type="button"
            title={label}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            onClick={() => {
              if (active) return;
              onSelect(s);
            }}
            className={cn(
              "snap-start flex h-8 min-w-[2rem] shrink-0 items-center justify-center rounded-lg border text-[#4d47b6] transition-all sm:h-10 sm:min-w-[2.5rem] sm:rounded-xl",
              active
                ? "cursor-default border-[#5b61ff] bg-white shadow-sm ring-2 ring-[#5b61ff]/30"
                : cn(
                    "border-transparent bg-white/35 opacity-[0.72] hover:bg-white/75 hover:opacity-100 active:scale-95",
                    s === "PAID" ? "text-emerald-700 hover:text-emerald-800" : "hover:ring-1 hover:ring-white/50",
                  ),
            )}
          >
            <PosOrderStatusGlyph status={s} />
          </button>
        );
      })}
    </div>
  );
}

/** ปี–เดือนปัจจุบัน (เขตเวลาไทย) */
function bangkokTodayKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function bangkokDateKeyFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

type BuildingPosFinanceRange = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

function dateKeyInFinanceRange(
  day: string,
  range: BuildingPosFinanceRange,
  today: string,
  startDate: string,
  endDate: string,
): boolean {
  if (!day) return false;
  if (range === "TODAY") return day === today;
  if (range === "MONTH") return day.slice(0, 7) === today.slice(0, 7);
  if (range === "YEAR") return day.slice(0, 4) === today.slice(0, 4);
  const rawStart = startDate || endDate;
  const rawEnd = endDate || startDate;
  const start = rawStart && rawEnd && rawStart > rawEnd ? rawEnd : rawStart;
  const end = rawStart && rawEnd && rawStart > rawEnd ? rawStart : rawEnd;
  if (!start && !end) return true;
  if (start && day < start) return false;
  if (end && day > end) return false;
  return true;
}

function sparkParamsFromFinanceRange(
  range: BuildingPosFinanceRange,
  dateFrom: string,
  dateTo: string,
  todayKey: string,
  fallbackYear: number,
): { year: number; month: number | "all"; day: number | "all" } {
  const [ty, tm, td] = todayKey.split("-").map((x) => Number(x));
  const year = Number.isFinite(ty) ? ty : fallbackYear;
  const month = Number.isFinite(tm) ? tm : 1;
  const day = Number.isFinite(td) ? td : 1;
  if (range === "TODAY") return { year, month, day };
  if (range === "MONTH") return { year, month, day: "all" };
  if (range === "YEAR") return { year, month: "all", day: "all" };
  const rawStart = dateFrom.trim() || dateTo.trim() || todayKey;
  const rawEnd = dateTo.trim() || dateFrom.trim() || todayKey;
  const start = rawStart <= rawEnd ? rawStart : rawEnd;
  const end = rawStart <= rawEnd ? rawEnd : rawStart;
  const [sy, sm, sd] = start.split("-").map((x) => Number(x));
  const [ey, em] = end.split("-").map((x) => Number(x));
  if (start === end && Number.isFinite(sy) && Number.isFinite(sm) && Number.isFinite(sd)) {
    return { year: sy, month: sm, day: sd };
  }
  if (sy === ey && sm === em && Number.isFinite(sy) && Number.isFinite(sm)) {
    return { year: sy, month: sm, day: "all" };
  }
  if (sy === ey && Number.isFinite(sy)) {
    return { year: sy, month: "all", day: "all" };
  }
  return { year: Number.isFinite(ey) ? ey : fallbackYear, month: "all", day: "all" };
}

function matchesSearch(order: PosOrder, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const blob = [
    order.customer_name,
    order.table_no,
    order.note,
    ...order.items.map((i) => `${i.name} ${i.note}`),
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(s);
}

function isTakeawayOrder(order: Pick<PosOrder, "table_no">): boolean {
  const t = (order.table_no || "").trim().toLowerCase();
  if (!t) return true;
  return t === "-" || t === "—" || t === "takeaway" || t === "to-go" || t.includes("กลับบ้าน");
}

function getOrderChannelMeta(
  order: Pick<PosOrder, "table_no" | "customer_session_id">,
): { label: "พนักงานสั่ง" | "ลูกค้าสั่ง" | "นำกลับบ้าน"; className: string } {
  if (isTakeawayOrder(order)) {
    return {
      label: "นำกลับบ้าน",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  if ((order.customer_session_id ?? "").trim()) {
    return {
      label: "ลูกค้าสั่ง",
      className: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }
  return {
    label: "พนักงานสั่ง",
    className: "border-violet-200 bg-violet-50 text-violet-900",
  };
}

type OpenTablesProps = {
  orders: PosOrder[];
  menuImageById: Map<number, string>;
  onOrderStatusChange: (
    id: number,
    status: PosOrder["status"],
    extra?: { member_phone?: string },
  ) => void;
  onOrderDelete?: (id: number) => void | Promise<void>;
  /** บันทึก URL รูปสลิปหลังอัปโหลด — แสดงซ้ำในหน้าดูยอดขาย */
  onOrderPaymentSlipSaved?: (orderId: number, imageUrl: string) => Promise<void>;
  /** เช่น ปุ่มไปแท็บออเดอร์ — มุมบนขวาของหัวข้อ */
  headerAction?: ReactNode;
  shopLabel: string;
  logoUrl?: string | null;
  paymentChannelsNote?: string | null;
  /** โหมดลิงก์พนักงาน — ใช้ API staff แทน session cookie */
  staffAuth?: { ownerId: string; trialSessionId: string; k: string };
};

/** แดชบอร์ดหลัก — โต๊ะที่มีออเดอร์ค้าง */
export function BuildingPosOpenTablesPanel({
  orders,
  menuImageById,
  onOrderStatusChange,
  onOrderDelete,
  onOrderPaymentSlipSaved,
  headerAction,
  shopLabel,
  logoUrl = null,
  paymentChannelsNote = null,
  staffAuth,
}: OpenTablesProps) {
  const slipGalleryInputRef = useRef<HTMLInputElement>(null);
  const slipCameraInputRef = useRef<HTMLInputElement>(null);
  const slipTargetOrderIdRef = useRef<number | null>(null);
  const [slipBusyOrderId, setSlipBusyOrderId] = useState<number | null>(null);
  const [loyaltyPhone, setLoyaltyPhone] = useState("");
  const [slipCameraOpen, setSlipCameraOpen] = useState(false);
  /** กัน SSE/รีเฟรชทับเบอร์ที่พนักงานพิมพ์ระหว่างเปิดโมดัล */
  const loyaltySeededModalKeyRef = useRef<string | null>(null);

  const [tableModalKey, setTableModalKey] = useState<string | null>(null);
  const [tableModalView, setTableModalView] = useState<"details" | "bill">("details");
  const [billPdfBusy, setBillPdfBusy] = useState(false);
  const [billPrintedAt, setBillPrintedAt] = useState("");
  const [ppQrUrl, setPpQrUrl] = useState<string | null>(null);
  const [ppQrLoading, setPpQrLoading] = useState(false);
  const [ppConfigured, setPpConfigured] = useState(true);
  const { paper: slipPaper, setPaper: setSlipPaper } = useAppSlipPaperSize();

  const activeByTable = useMemo(() => {
    const open = orders.filter((o) => o.status !== "PAID");
    const map = new Map<string, PosOrder[]>();
    for (const o of open) {
      const key = o.table_no.trim() || "ไม่ระบุโต๊ะ";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b, "th"));
  }, [orders]);

  const modalOrders = useMemo(() => {
    if (!tableModalKey) return [];
    return activeByTable.find(([k]) => k === tableModalKey)?.[1] ?? [];
  }, [tableModalKey, activeByTable]);

  /** เบอร์ที่ลูกค้ากรอกตอนสั่ง — ใช้ตอนเรียกเก็บโดยไม่ต้องพิมพ์ใหม่ */
  const linkedLoyaltyPhone = useMemo(() => {
    for (const o of modalOrders) {
      const digits = (o.member_phone ?? "").replace(/\D/g, "").slice(0, 20);
      if (digits.length >= 9) return digits;
    }
    return "";
  }, [modalOrders]);

  const closeTableModal = useCallback(() => {
    setTableModalKey(null);
    setTableModalView("details");
    setLoyaltyPhone("");
    loyaltySeededModalKeyRef.current = null;
  }, []);

  useEffect(() => {
    if (!tableModalKey) {
      loyaltySeededModalKeyRef.current = null;
      return;
    }
    if (linkedLoyaltyPhone) {
      setLoyaltyPhone(linkedLoyaltyPhone);
      loyaltySeededModalKeyRef.current = tableModalKey;
      return;
    }
    if (loyaltySeededModalKeyRef.current !== tableModalKey) {
      loyaltySeededModalKeyRef.current = tableModalKey;
      setLoyaltyPhone("");
    }
  }, [tableModalKey, linkedLoyaltyPhone]);

  /** โต๊ะว่างหลังชำระครบ — ปิดโมดัลและล้างเบอร์สะสม */
  useEffect(() => {
    if (tableModalKey && modalOrders.length === 0) {
      closeTableModal();
    }
  }, [tableModalKey, modalOrders.length, closeTableModal]);
  const modalGrandTotal = useMemo(
    () => Math.round(modalOrders.reduce((s, o) => s + o.total_amount, 0)),
    [modalOrders],
  );

  useEffect(() => {
    if (!tableModalKey) return;
    setTableModalView("details");
    setBillPrintedAt(
      new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok", hour12: false }),
    );
  }, [tableModalKey]);

  const handlePrintBill = useCallback(
    (paper: PosTablePaperSize) => {
      if (!tableModalKey) return;
      const inner = buildPosTableBillInnerHtml({
        shopLabel,
        logoUrl,
        tableLabel: tableModalKey,
        billPrintedAt: billPrintedAt || "—",
        orders: modalOrders,
        grandTotal: modalGrandTotal,
        paymentChannelsNote,
        ppQrUrl,
      });
      const ok = openPosTableBillPrintWindow(paper, inner);
      if (!ok) {
        window.alert(
          "ไม่สามารถเปิดหน้าพิมพ์ได้ — ลองอนุญาตป๊อปอัปสำหรับเว็บไซต์นี้ หรือรีเฟรชแล้วลองอีกครั้ง",
        );
      }
    },
    [
      tableModalKey,
      shopLabel,
      logoUrl,
      billPrintedAt,
      modalOrders,
      modalGrandTotal,
      paymentChannelsNote,
      ppQrUrl,
    ],
  );

  const handleDownloadBillPdf = useCallback(async () => {
    if (!tableModalKey) return;
    const inner = buildPosTableBillInnerHtml({
      shopLabel,
      logoUrl,
      tableLabel: tableModalKey,
      billPrintedAt: billPrintedAt || "—",
      orders: modalOrders,
      grandTotal: modalGrandTotal,
      paymentChannelsNote,
      ppQrUrl,
    });
    const docTitle = `บิล โต๊ะ ${tableModalKey}`;
    const fullHtml = buildPosTableStaticDocumentHtml("A4", inner, docTitle);
    const safeTable = tableModalKey.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-");
    const filename = `pos-bill-${safeTable}-${Date.now()}.pdf`;
    setBillPdfBusy(true);
    try {
      await downloadPosTableStaticHtmlAsA4Pdf(fullHtml, filename, {
        iframeTitle: "สร้าง PDF บิลโต๊ะ",
        notFoundMessage: "ไม่พบเนื้อหาบิล",
      });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "สร้าง PDF ไม่สำเร็จ");
    } finally {
      setBillPdfBusy(false);
    }
  }, [
    tableModalKey,
    shopLabel,
    logoUrl,
    billPrintedAt,
    modalOrders,
    modalGrandTotal,
    paymentChannelsNote,
    ppQrUrl,
  ]);

  useEffect(() => {
    if (!tableModalKey) {
      setPpQrUrl(null);
      setPpQrLoading(false);
      return;
    }
    if (modalGrandTotal <= 0) {
      setPpQrUrl(null);
      return;
    }
    let cancelled = false;
    setPpQrLoading(true);
    const staffQs = staffAuth
      ? new URLSearchParams({
          ownerId: staffAuth.ownerId,
          t: staffAuth.trialSessionId,
          k: staffAuth.k,
        }).toString()
      : "";
    const ppUrl = staffAuth
      ? `/api/building-pos/staff/promptpay-qr?${staffQs}`
      : "/api/building-pos/session/promptpay-qr";
    void fetch(ppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: staffAuth ? "omit" : "include",
      body: JSON.stringify({ amount: modalGrandTotal }),
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
  }, [tableModalKey, modalGrandTotal, staffAuth]);

  const openSlipGalleryPicker = useCallback((orderId: number) => {
    if (!onOrderPaymentSlipSaved) return;
    slipTargetOrderIdRef.current = orderId;
    slipGalleryInputRef.current?.click();
  }, [onOrderPaymentSlipSaved]);

  const openSlipCameraPicker = useCallback((orderId: number) => {
    if (!onOrderPaymentSlipSaved) return;
    slipTargetOrderIdRef.current = orderId;
    setSlipCameraOpen(true);
  }, [onOrderPaymentSlipSaved]);

  const finalizeSlipUpload = useCallback(
    async (file: File) => {
      const orderId = slipTargetOrderIdRef.current;
      slipTargetOrderIdRef.current = null;
      if (orderId === null || !onOrderPaymentSlipSaved) return;
      setSlipBusyOrderId(orderId);
      try {
        const prepared = await prepareBuildingPosSlipImageFile(file);
        const url =
          staffAuth ?
            await uploadBuildingPosStaffImage(prepared, staffAuth)
          : await uploadBuildingPosSessionImage(prepared);
        await onOrderPaymentSlipSaved(orderId, url);
      } catch (err) {
        window.alert(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
      } finally {
        setSlipBusyOrderId(null);
      }
    },
    [onOrderPaymentSlipSaved, staffAuth],
  );

  const onSlipFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      await finalizeSlipUpload(file);
    },
    [finalizeSlipUpload],
  );

  const onSlipCameraModalClose = useCallback(() => {
    setSlipCameraOpen(false);
    slipTargetOrderIdRef.current = null;
  }, []);

  const onSlipCameraCaptured = useCallback(
    async (file: File) => {
      setSlipCameraOpen(false);
      await finalizeSlipUpload(file);
    },
    [finalizeSlipUpload],
  );

  const onSlipCameraLegacyPicker = useCallback(() => {
    setSlipCameraOpen(false);
    requestAnimationFrame(() => slipCameraInputRef.current?.click());
  }, []);

  const printFooterRow = (
    <div className="flex flex-wrap items-center gap-2">
      <AppSlipPaperSizeToolbar
        value={slipPaper}
        onChange={setSlipPaper}
        sizes={["SLIP_58", "SLIP_80", "A4"]}
        aria-label="ขนาดกระดาษบิลโต๊ะ"
      />
      <button
        type="button"
        className={appTemplateOutlineButtonClass}
        onClick={() => handlePrintBill(slipPaper)}
      >
        พิมพ์บิล
      </button>
      <button
        type="button"
        className={shopQrTemplateGridPrimaryButtonClass}
        disabled={billPdfBusy}
        onClick={() => void handleDownloadBillPdf()}
      >
        {billPdfBusy ? "กำลังสร้าง PDF…" : "ดาวน์โหลด PDF"}
      </button>
    </div>
  );

  return (
    <>
      {staffAuth ? (
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
            <h2 className="min-w-0 text-base font-black tracking-tight text-[#1e1b4b] sm:text-lg">
              โต๊ะที่ลูกค้าสั่งอาหาร
            </h2>
            {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
          </div>
          {activeByTable.length === 0 ? (
            <AppEmptyState tone="violet" className="py-8">
              ตอนนี้ไม่มีโต๊ะที่มีออเดอร์ค้าง
            </AppEmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 md:gap-3">
              {activeByTable.map(([tableKey, list]) => {
                const total = list.reduce((s, o) => s + o.total_amount, 0);
                const counts = statusCountsForOpenOrders(list);
                const channelCounts = list.reduce(
                  (acc, order) => {
                    const ch = getOrderChannelMeta(order).label;
                    acc[ch] += 1;
                    return acc;
                  },
                  { "พนักงานสั่ง": 0, "ลูกค้าสั่ง": 0, "นำกลับบ้าน": 0 } as Record<
                    "พนักงานสั่ง" | "ลูกค้าสั่ง" | "นำกลับบ้าน",
                    number
                  >,
                );
                const dom = dominantOpenStatus(list);
                const tone = tableCardTone[dom];
                return (
                  <li key={tableKey}>
                    <button
                      type="button"
                      onClick={() => setTableModalKey(tableKey)}
                      className={cn(
                        "flex h-full min-h-[120px] w-full flex-col rounded-2xl border-2 p-3 text-left shadow-sm transition hover:shadow-md sm:min-h-[132px] sm:rounded-[1.25rem] sm:p-3.5",
                        tone.border,
                        tone.bg,
                        tone.hoverBorder,
                        tone.ring,
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">โต๊ะ</span>
                        <span className="mt-0.5 line-clamp-2 block text-lg font-bold tabular-nums text-[#2e2a58] sm:text-xl">
                          {tableKey}
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold">
                          {channelCounts["พนักงานสั่ง"] > 0 ? (
                            <span className="rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-violet-900">
                              พนักงานสั่ง {channelCounts["พนักงานสั่ง"]}
                            </span>
                          ) : null}
                          {channelCounts["ลูกค้าสั่ง"] > 0 ? (
                            <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-900">
                              ลูกค้าสั่ง {channelCounts["ลูกค้าสั่ง"]}
                            </span>
                          ) : null}
                          {channelCounts["นำกลับบ้าน"] > 0 ? (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-900">
                              นำกลับบ้าน {channelCounts["นำกลับบ้าน"]}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="mt-2 border-t border-white/60 pt-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">สถานะรวม</span>
                          <span
                            className={cn(
                              "max-w-[65%] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                              statusBadgeClass[dom],
                            )}
                            title={tone.stepLabel}
                          >
                            {tone.stepLabel}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] font-semibold">
                          {counts.NEW > 0 ? (
                            <span className="rounded-md bg-amber-100/95 px-1.5 py-0.5 text-amber-900 ring-1 ring-amber-200/70">
                              ใหม่ {counts.NEW}
                            </span>
                          ) : null}
                          {counts.PREPARING > 0 ? (
                            <span className="rounded-md bg-sky-100/95 px-1.5 py-0.5 text-sky-900 ring-1 ring-sky-200/70">
                              กำลังทำ {counts.PREPARING}
                            </span>
                          ) : null}
                          {counts.SERVED > 0 ? (
                            <span className="rounded-md bg-emerald-100/95 px-1.5 py-0.5 text-emerald-900 ring-1 ring-emerald-200/70">
                              ทำเสร็จ {counts.SERVED}
                            </span>
                          ) : null}
                          {counts.SERVING > 0 ? (
                            <span className="rounded-md bg-cyan-100/95 px-1.5 py-0.5 text-cyan-900 ring-1 ring-cyan-200/70">
                              กำลังเสิร์ฟ {counts.SERVING}
                            </span>
                          ) : null}
                          {counts.DELIVERED > 0 ? (
                            <span className="rounded-md bg-violet-100/95 px-1.5 py-0.5 text-violet-900 ring-1 ring-violet-200/70">
                              เสิร์ฟแล้ว {counts.DELIVERED}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex items-end justify-between">
                          <span className="text-[11px] text-[#66638c]">รวม {list.length} ออเดอร์</span>
                          <span className="text-sm font-semibold tabular-nums text-emerald-700">
                            ฿ {total.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
      <AppDashboardSection tone="violet" className="rounded-[1.25rem]">
        <div className="border-b border-[#ecebff] pb-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-[#2e2a58] pr-1">
              โต๊ะที่ลูกค้าสั่งอาหาร
            </h2>
            {headerAction ? <div className="shrink-0 pt-0.5">{headerAction}</div> : null}
          </div>
        </div>
        {activeByTable.length === 0 ? (
          <AppEmptyState tone="violet" className="mt-4 py-8 sm:py-8">
            ตอนนี้ไม่มีโต๊ะที่มีออเดอร์ค้าง
          </AppEmptyState>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeByTable.map(([tableKey, list]) => {
              const total = list.reduce((s, o) => s + o.total_amount, 0);
              const counts = statusCountsForOpenOrders(list);
              const channelCounts = list.reduce(
                (acc, order) => {
                  const ch = getOrderChannelMeta(order).label;
                  acc[ch] += 1;
                  return acc;
                },
                { "พนักงานสั่ง": 0, "ลูกค้าสั่ง": 0, "นำกลับบ้าน": 0 } as Record<
                  "พนักงานสั่ง" | "ลูกค้าสั่ง" | "นำกลับบ้าน",
                  number
                >,
              );
              const dom = dominantOpenStatus(list);
              const tone = tableCardTone[dom];
              return (
                <li key={tableKey}>
                  <button
                    type="button"
                    onClick={() => setTableModalKey(tableKey)}
                    className={cn(
                      "flex h-full min-h-[148px] w-full flex-col rounded-[1.25rem] border-2 p-4 text-left shadow-sm transition hover:shadow-md sm:flex-row sm:items-stretch sm:justify-between sm:gap-3",
                      tone.border,
                      tone.bg,
                      tone.hoverBorder,
                      tone.ring,
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">โต๊ะ</span>
                      <span className="mt-1 line-clamp-2 block text-xl font-bold tabular-nums text-[#2e2a58]">{tableKey}</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                        {channelCounts["พนักงานสั่ง"] > 0 ? (
                          <span className="rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-violet-900">
                            พนักงานสั่ง {channelCounts["พนักงานสั่ง"]}
                          </span>
                        ) : null}
                        {channelCounts["ลูกค้าสั่ง"] > 0 ? (
                          <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-sky-900">
                            ลูกค้าสั่ง {channelCounts["ลูกค้าสั่ง"]}
                          </span>
                        ) : null}
                        {channelCounts["นำกลับบ้าน"] > 0 ? (
                          <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-amber-900">
                            นำกลับบ้าน {channelCounts["นำกลับบ้าน"]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 border-t border-white/60 pt-2.5 sm:mt-0 sm:w-[44%] sm:max-w-[220px] sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">สถานะรวม</span>
                        <span
                          className={cn(
                            "max-w-[65%] truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                            statusBadgeClass[dom],
                          )}
                          title={tone.stepLabel}
                        >
                          {tone.stepLabel}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                        {counts.NEW > 0 ? (
                          <span className="rounded-md bg-amber-100/95 px-1.5 py-0.5 text-amber-900 ring-1 ring-amber-200/70">
                            ใหม่ {counts.NEW}
                          </span>
                        ) : null}
                        {counts.PREPARING > 0 ? (
                          <span className="rounded-md bg-sky-100/95 px-1.5 py-0.5 text-sky-900 ring-1 ring-sky-200/70">
                            กำลังทำ {counts.PREPARING}
                          </span>
                        ) : null}
                        {counts.SERVED > 0 ? (
                          <span className="rounded-md bg-emerald-100/95 px-1.5 py-0.5 text-emerald-900 ring-1 ring-emerald-200/70">
                            ทำเสร็จ {counts.SERVED}
                          </span>
                        ) : null}
                        {counts.SERVING > 0 ? (
                          <span className="rounded-md bg-cyan-100/95 px-1.5 py-0.5 text-cyan-900 ring-1 ring-cyan-200/70">
                            กำลังเสิร์ฟ {counts.SERVING}
                          </span>
                        ) : null}
                        {counts.DELIVERED > 0 ? (
                          <span className="rounded-md bg-violet-100/95 px-1.5 py-0.5 text-violet-900 ring-1 ring-violet-200/70">
                            เสิร์ฟแล้ว {counts.DELIVERED}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-end justify-between">
                        <span className="text-[11px] text-[#66638c]">รวม {list.length} ออเดอร์</span>
                        <span className="text-sm font-semibold tabular-nums text-emerald-700">฿ {total.toLocaleString()}</span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>
      )}

      <FormModal
        open={tableModalKey !== null}
        mobileCentered
        title={
          tableModalKey ?
            tableModalView === "details" ?
              `โต๊ะ ${tableModalKey} — รายละเอียด`
            : `โต๊ะ ${tableModalKey} — บิลชำระเงิน`
          : ""
        }
        description={
          tableModalView === "details" ? "แก้สถานะออเดอร์ หรือเปิดบิลพร้อมเพย์" : "สแกนจ่าย · พิมพ์หรือดาวน์โหลดบิล"
        }
        onClose={closeTableModal}
        size="lg"
        footer={
          tableModalView === "details" ?
            <div className="flex w-full flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border border-[#0000BF]/30 bg-[#eef0ff] px-4 py-2.5 text-sm font-semibold text-[#0000BF]"
                onClick={() => setTableModalView("bill")}
              >
                {"บิล & พร้อมเพย์"}
              </button>
              <button
                type="button"
                className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                onClick={closeTableModal}
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
                  onClick={() => setTableModalView("details")}
                >
                  กลับ
                </button>
                <button
                  type="button"
                  className="app-btn-soft rounded-xl px-4 py-2.5 text-sm font-semibold text-[#4d47b6]"
                  onClick={closeTableModal}
                >
                  ปิด
                </button>
              </div>
            </div>
        }
      >
        <div className="space-y-4">
          {tableModalView === "details" ?
            <div className="space-y-4">
            <BuildingPosLoyaltyCheckoutPanel
              orderId={modalOrders[0]?.id ?? null}
              staffAuth={staffAuth}
              linkedPhone={linkedLoyaltyPhone}
              onMemberPhoneChange={setLoyaltyPhone}
            />
            <AppGalleryCameraFileInputs
              galleryInputRef={slipGalleryInputRef}
              cameraInputRef={slipCameraInputRef}
              onChange={onSlipFileChange}
            />
            {modalOrders.map((o) => {
              const st = o.status as OpenOrderStatus;
              const validSt: OpenOrderStatus =
                st === "NEW" ||
                st === "PREPARING" ||
                st === "SERVED" ||
                st === "SERVING" ||
                st === "DELIVERED"
                  ? st
                  : "NEW";
              return (
                <div
                  key={o.id}
                  className={cn(
                    "rounded-xl border border-[#e1e3ff] p-3 shadow-sm",
                    orderBlockTone[validSt],
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-[#4d47b6]">#{o.id}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold ring-1",
                        statusBadgeClass[validSt],
                      )}
                    >
                      {statusLabelTh[o.status]}
                    </span>
                    <span className="min-w-0 flex-1 text-xs text-[#66638c] max-sm:basis-full">
                      {new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#2e2a58]">
                    {o.customer_name || "ลูกค้า"} · โต๊ะ {o.table_no || "—"}
                  </p>
                  {(o.member_phone ?? "").replace(/\D/g, "").length >= 9 ? (
                    <p className="mt-0.5 text-xs font-semibold tabular-nums text-[#4d47b6]">
                      สะสมคะแนน · {(o.member_phone ?? "").replace(/\D/g, "")}
                    </p>
                  ) : null}
                  <p className="mt-1">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        getOrderChannelMeta(o).className,
                      )}
                    >
                      {getOrderChannelMeta(o).label}
                    </span>
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-[#66638c]">
                    {o.items.map((it, idx) => (
                      <li key={`${o.id}-${idx}`} className="flex gap-2">
                        <BuildingPosRemoteImg
                          src={menuImageById.get(it.menu_item_id)}
                          className="h-8 w-8 shrink-0 rounded-md border border-[#e1e3ff] object-cover"
                          fallback={
                            <div className="h-8 w-8 shrink-0 rounded-md border border-dashed border-[#d8d6ec] bg-white" />
                          }
                        />
                        <span>
                          {it.name} × {it.qty}
                          {it.note ? <span className="block text-xs text-[#9b98c4]">{it.note}</span> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-lg font-bold tabular-nums text-emerald-700">
                    ฿ {o.total_amount.toLocaleString()}
                  </p>
                  {onOrderPaymentSlipSaved ?
                    <div className="mt-3 rounded-xl border border-[#e1e3ff] bg-white/80 p-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">
                        สลิปโอน
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {o.payment_slip_url?.trim() ?
                          <>
                            <a
                              href={o.payment_slip_url.trim()}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 rounded-lg ring-1 ring-[#e1e3ff]"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={o.payment_slip_url.trim()}
                                alt="สลิป"
                                className="h-14 w-14 rounded-lg object-cover"
                              />
                            </a>
                            <span className="min-w-0 text-[11px] text-[#66638c]">มีรูปแล้ว — อัปโหลดใหม่ได้</span>
                          </>
                        :
                          <span className="text-[11px] text-[#9b98c4]">ยังไม่มีรูปสลิป</span>
                        }
                        <AppImagePickCameraButtons
                          className="ml-auto"
                          busy={slipBusyOrderId === o.id}
                          onPickGallery={() => openSlipGalleryPicker(o.id)}
                          onPickCamera={() => openSlipCameraPicker(o.id)}
                        />
                      </div>
                    </div>
                  : null}
                  <div className="mt-2 border-t border-[#dcd8f0] pt-2">
                    <p className="mb-1 hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#66638c] sm:block">
                      อัปเดตสถานะ
                    </p>
                    <div id={`pos-open-order-status-${o.id}`}>
                      <PosOrderStatusIconStrip
                        orderId={o.id}
                        current={o.status}
                        onSelect={(s) => {
                          const fromOrder = (o.member_phone ?? "").replace(/\D/g, "");
                          const fromPanel = loyaltyPhone.replace(/\D/g, "");
                          const phoneForPay =
                            fromOrder.length >= 9 ? fromOrder
                            : fromPanel.length >= 9 ? fromPanel
                            : "";
                          onOrderStatusChange(
                            o.id,
                            s,
                            s === "PAID" && phoneForPay ? { member_phone: phoneForPay } : undefined,
                          );
                          if (s === "PAID") {
                            // หลังชำระ — เคลียร์เบอร์ถ้าออเดอร์นี้เป็นใบสุดท้ายของโต๊ะ (effect ปิดโมดัลจะเคลียร์อีกครั้ง)
                            const remaining = modalOrders.filter((x) => x.id !== o.id);
                            if (remaining.length === 0) {
                              setLoyaltyPhone("");
                              loyaltySeededModalKeyRef.current = null;
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-[#4d47b6]"
                        aria-label="แก้ไขสถานะ"
                        title="แก้ไขสถานะ"
                        onClick={() => {
                          const root = document.getElementById(`pos-open-order-status-${o.id}`);
                          const btn = root?.querySelector("button");
                          if (btn instanceof HTMLButtonElement) btn.focus();
                        }}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                          <path d="m16.5 3.5 4 4L8 20H4v-4z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      {onOrderDelete ? (
                        <button
                          type="button"
                          onClick={() => void onOrderDelete(o.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                          aria-label="ลบรายการ"
                          title="ลบรายการ"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                            <path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          : <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-slate-900 sm:bg-white">
            <header className="border-b border-slate-200 pb-3 text-center">
              {logoUrl?.trim() ? (
                <div className="mb-2 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl.trim()} alt="" className="max-h-16 max-w-[140px] object-contain" />
                </div>
              ) : null}
              <h3 className="text-base font-bold text-slate-900">{shopLabel}</h3>
              <p className="mt-1 text-sm font-semibold text-[#0000BF]">ใบสรุปยอด / ชำระเงิน</p>
              <p className="mt-2 text-sm text-slate-700">
                โต๊ะ <span className="font-semibold">{tableModalKey ?? "—"}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">พิมพ์เมื่อ {billPrintedAt || "—"}</p>
            </header>

            <div className="mt-4 space-y-4 text-sm">
              {modalOrders.map((o) => (
                <div key={`bill-${o.id}`} className="border-b border-slate-100 pb-3 last:border-0">
                  <p className="font-mono text-xs text-slate-500">ออเดอร์ #{o.id}</p>
                  <ul className="mt-1 space-y-0.5 text-slate-700">
                    {o.items.map((it, idx) => (
                      <li key={idx} className="flex justify-between gap-2">
                        <span className="min-w-0">
                          {it.name} × {it.qty}
                        </span>
                        <span className="shrink-0 tabular-nums">฿{(it.price * it.qty).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-right text-sm font-semibold tabular-nums text-emerald-700">
                    รวม ฿{o.total_amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-emerald-50/80 px-3 py-4 text-center">
              <p className="text-xs font-medium text-emerald-800/80">ยอดรวมทั้งหมด (บาท)</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-700">
                {modalGrandTotal.toLocaleString("th-TH")}
              </p>
            </div>

            {paymentChannelsNote ? (
              <section className="mt-4">
                <h4 className="text-xs font-semibold text-slate-800">ช่องทางชำระ</h4>
                <p className="mt-1 whitespace-pre-line text-xs text-slate-700">{paymentChannelsNote}</p>
              </section>
            ) : null}

            <section className="mt-5 flex flex-col items-center border-t border-dashed border-slate-200 pt-5">
              <h4 className="text-sm font-semibold text-slate-900">สแกนจ่าย พร้อมเพย์</h4>
              {ppQrLoading ? (
                <p className="mt-4 text-sm text-slate-500">กำลังสร้าง QR…</p>
              ) : ppQrUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ppQrUrl} alt="PromptPay QR" className="mt-3 h-48 w-48 object-contain sm:h-52 sm:w-52" />
                  <p className="mt-2 text-xs text-slate-500">ยอด {modalGrandTotal.toLocaleString("th-TH")} บาท</p>
                </>
              ) : !ppConfigured ? (
                <p className="mt-3 max-w-sm text-center text-sm text-amber-800">
                  ยังไม่ได้ตั้งเบอร์พร้อมเพย์ — ตั้งได้ที่{" "}
                  <Link href="/dashboard/profile" className="font-semibold text-[#0000BF] underline">
                    โปรไฟล์
                  </Link>{" "}
                  (ฟิลด์เดียวกับใบแจ้งหนี้หอพัก)
                </p>
              ) : (
                <p className="mt-3 text-center text-sm text-slate-500">ไม่สามารถสร้าง QR ได้ — ลองรีเฟรชหรือตรวจสอบเบอร์พร้อมเพย์</p>
              )}
            </section>

            <p className="mt-6 text-center text-xs text-slate-400">ขอบคุณที่ใช้บริการ</p>
          </div>
          }
        </div>
      </FormModal>

      <AppCameraCaptureModal
        open={slipCameraOpen}
        onClose={onSlipCameraModalClose}
        onCapture={(file) => void onSlipCameraCaptured(file)}
        onRequestLegacyPicker={onSlipCameraLegacyPicker}
        title="ถ่ายรูปสลิปโอน"
      />
    </>
  );
}

const MAX_COMPARE_ROWS = 18;

function capLeaderboard(entries: [string, number][], max: number): [string, number][] {
  if (entries.length <= max) return entries;
  const head = entries.slice(0, max - 1);
  const tail = entries.slice(max - 1);
  const restSum = tail.reduce((s, [, a]) => s + a, 0);
  return [...head, ["อื่น ๆ รวม", restSum]];
}

function entriesToColumnBuckets(entries: [string, number][]): AppColumnBarBucket[] {
  if (entries.length === 0) return [];
  const maxAmt = Math.max(...entries.map(([, a]) => a), 1);
  return entries.map(([label, amount], i) => ({
    key: `${label}__${i}`,
    label,
    amount,
    pct: Math.round((amount / maxAmt) * 100),
  }));
}

function posSalesStatusPillClass(s: PosOrder["status"]): string {
  switch (s) {
    case "PAID":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80";
    case "NEW":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-200/80";
    case "PREPARING":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200/80";
    case "SERVED":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200/80";
    case "SERVING":
      return "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200/80";
    case "DELIVERED":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80";
  }
}

/** การ์ดรายการ — แบบประวัติรายรับ–รายจ่าย */
function PosSalesHistoryCard({
  order: o,
  onStatusChange,
  onEdit,
  onDelete,
  onSlipImageOpen,
}: {
  order: PosOrder;
  onStatusChange: (id: number, status: PosOrder["status"]) => void;
  onEdit: (order: PosOrder) => void;
  onDelete: (id: number) => void;
  onSlipImageOpen?: (imageUrl: string) => void;
}) {
  const timeStr = new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const itemsLine = o.items.map((i) => `${i.name}×${i.qty}`).join(", ");
  const slipUrl = o.payment_slip_url?.trim() ?? "";
  const orderChannel = getOrderChannelMeta(o);
  return (
    <article className="rounded-[1.25rem] border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start gap-2">
        {slipUrl ? (
          <AppImageThumb
            src={slipUrl}
            alt={`สลิปออเดอร์ #${o.id}`}
            className="h-14 w-14 shrink-0"
            onOpen={() => {
              if (onSlipImageOpen) onSlipImageOpen(slipUrl);
              else window.open(slipUrl, "_blank", "noopener,noreferrer");
            }}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <time className="text-[11px] font-medium tabular-nums text-slate-500" dateTime={o.created_at}>
                {timeStr}
              </time>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-tight",
                  posSalesStatusPillClass(o.status),
                )}
              >
                {statusLabelTh[o.status]}
              </span>
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-px font-mono text-[10px] text-slate-600">
                #{o.id}
              </span>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-right text-lg font-black tabular-nums text-emerald-700">
                ฿{o.total_amount.toLocaleString()}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onEdit(o)}
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไขออเดอร์ #${o.id}`}
                  title="แก้ไข"
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(o.id)}
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ลบออเดอร์ #${o.id}`}
                  title="ลบ"
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-slate-900">{itemsLine || "—"}</p>
          <p className="truncate text-[11px] leading-tight text-slate-600">
            <span className="text-slate-400">ลูกค้า / โต๊ะ</span> · {o.customer_name || "—"} · {o.table_no || "—"}
          </p>
          <p className="mt-0.5">
            <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", orderChannel.className)}>
              {orderChannel.label}
            </span>
          </p>
          {o.note?.trim() ? (
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600">{o.note}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-2 border-t border-slate-100 pt-2">
        <p className="mb-1 hidden text-[10px] font-medium text-slate-400 sm:block">สถานะ</p>
        <PosOrderStatusIconStrip orderId={o.id} current={o.status} onSelect={(s) => onStatusChange(o.id, s)} />
      </div>
    </article>
  );
}

type HistoryProps = {
  orders: PosOrder[];
  categories?: PosCategory[];
  menuItems?: PosMenuItem[];
  costCategories?: PosCostCategory[];
  costEntries?: PosCostEntry[];
  onCostsChanged?: () => void | Promise<void>;
  /** เปิดแท็บรายจ่ายเมื่อมาจาก URL เก่า `?fin=costs` */
  initialDetailPanel?: FinanceDetailPanel;
  onOrderStatusChange: (
    id: number,
    status: PosOrder["status"],
    extra?: { member_phone?: string },
  ) => void;
  onOrderUpdate: (
    id: number,
    patch: Partial<
      Pick<
        PosOrder,
        "customer_name" | "table_no" | "note" | "status" | "payment_slip_url" | "member_phone" | "items" | "created_at"
      >
    >,
  ) => void | Promise<void>;
  onOrderDelete: (id: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  /** เปิดสลิปด้วย AppImageLightbox จาก @/components/app-templates */
  onSlipImageOpen?: (imageUrl: string) => void;
};

/** หน้าการเงิน — กรอง กราฟ + แถบประวัติ/รายรับ · รายจ่าย */
export function BuildingPosSalesHistoryPanel({
  orders,
  onOrderStatusChange,
  onOrderUpdate,
  onOrderDelete,
  onRefresh,
  refreshing = false,
  onSlipImageOpen,
  categories = [],
  menuItems = [],
  costCategories = [],
  costEntries = [],
  onCostsChanged,
  initialDetailPanel = "history",
}: HistoryProps) {
  const [detailPanel, setDetailPanel] = useState<FinanceDetailPanel>(initialDetailPanel);
  const [financeRange, setFinanceRange] = useState<BuildingPosFinanceRange>("MONTH");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [categoryCompareOpen, setCategoryCompareOpen] = useState(true);
  const [tableCompareOpen, setTableCompareOpen] = useState(true);
  const [sparkRevenueCost, setSparkRevenueCost] = useState<AppRevenueCostBucket[]>([]);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [sparkErr, setSparkErr] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<PosOrder | null>(null);
  const [editCustomer, setEditCustomer] = useState("");
  const [editTable, setEditTable] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editStatus, setEditStatus] = useState<PosOrder["status"]>("NEW");
  const [editItems, setEditItems] = useState<PosOrder["items"]>([]);
  const [editAddMenuId, setEditAddMenuId] = useState("");
  const [editSlipUrl, setEditSlipUrl] = useState("");
  const [editSlipBusy, setEditSlipBusy] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editErr, setEditErr] = useState<string | null>(null);
  const editGalleryRef = useRef<HTMLInputElement>(null);
  const {
    openCamera: openEditSlipCamera,
    cameraInputRef: editCameraInputRef,
    cameraModal: editSlipCameraModal,
  } = useAppCameraCapture({ title: "ถ่ายรูปสลิป" });

  useEffect(() => {
    setDetailPanel(initialDetailPanel);
  }, [initialDetailPanel]);

  function isoToDatetimeLocalBangkok(iso: string): string {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "";
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Bangkok",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .formatToParts(d)
        .map((p) => [p.type, p.value]),
    );
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  }

  function datetimeLocalBangkokToIso(local: string): string {
    const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return new Date(local).toISOString();
    return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+07:00`).toISOString();
  }

  function openOrderEdit(o: PosOrder) {
    setEditOrder(o);
    setEditCustomer(o.customer_name ?? "");
    setEditTable(o.table_no ?? "");
    setEditPhone((o.member_phone ?? "").replace(/\D/g, "").slice(0, 20));
    setEditCreatedAt(isoToDatetimeLocalBangkok(o.created_at));
    setEditNote(o.note ?? "");
    setEditStatus(o.status);
    setEditItems(
      (o.items ?? []).map((it) => ({
        menu_item_id: it.menu_item_id,
        name: it.name,
        price: it.price,
        qty: it.qty,
        note: it.note ?? "",
        kitchen_department_id: it.kitchen_department_id,
        kitchen_status: it.kitchen_status,
        serve_status: it.serve_status,
      })),
    );
    setEditAddMenuId("");
    setEditSlipUrl(o.payment_slip_url?.trim() ?? "");
    setEditErr(null);
  }

  const editItemsTotal = useMemo(
    () => editItems.reduce((s, it) => s + it.price * it.qty, 0),
    [editItems],
  );

  const activeMenuForEdit = useMemo(
    () => menuItems.filter((m) => m.is_active !== false),
    [menuItems],
  );

  async function uploadEditSlip(file: File) {
    setEditSlipBusy(true);
    setEditErr(null);
    try {
      const prepared = await prepareBuildingPosSlipImageFile(file);
      const url = await uploadBuildingPosSessionImage(prepared);
      setEditSlipUrl(url);
    } catch (err) {
      setEditErr(err instanceof Error ? err.message : "อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setEditSlipBusy(false);
    }
  }

  async function onPickEditSlip(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await uploadEditSlip(file);
  }

  async function submitOrderEdit() {
    if (!editOrder) return;
    if (editItems.length === 0) {
      setEditErr("ต้องมีเมนูอย่างน้อย 1 รายการ");
      return;
    }
    setEditBusy(true);
    setEditErr(null);
    try {
      const createdIso = editCreatedAt.trim()
        ? datetimeLocalBangkokToIso(editCreatedAt.trim())
        : editOrder.created_at;
      await onOrderUpdate(editOrder.id, {
        customer_name: editCustomer.trim(),
        table_no: editTable.trim(),
        member_phone: editPhone.trim() || "",
        note: editNote.trim(),
        status: editStatus,
        payment_slip_url: editSlipUrl.trim() || "",
        created_at: createdIso,
        items: editItems.map((it) => ({
          menu_item_id: it.menu_item_id,
          name: it.name,
          price: it.price,
          qty: it.qty,
          note: it.note ?? "",
        })),
      });
      setEditOrder(null);
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setEditBusy(false);
    }
  }

  const todayKey = useMemo(() => bangkokTodayKey(), []);

  const fallbackBangkokYear = useMemo(() => {
    const y = Number(todayKey.slice(0, 4));
    return Number.isFinite(y) ? y : new Date().getFullYear();
  }, [todayKey]);

  const sparkCalendar = useMemo(
    () => sparkParamsFromFinanceRange(financeRange, dateFrom, dateTo, todayKey, fallbackBangkokYear),
    [financeRange, dateFrom, dateTo, todayKey, fallbackBangkokYear],
  );

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("year", String(sparkCalendar.year));
    params.set("month", sparkCalendar.month === "all" ? "all" : String(sparkCalendar.month));
    params.set("day", sparkCalendar.day === "all" ? "all" : String(sparkCalendar.day));

    let cancelled = false;
    setSparkLoading(true);
    setSparkErr(null);
    void (async () => {
      try {
        const res = await fetch(`/api/building-pos/session/sales-spark?${params}`, {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await res.json().catch(() => ({}))) as {
          revenueCost?: AppRevenueCostBucket[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "โหลดกราฟไม่สำเร็จ");
        if (!cancelled) setSparkRevenueCost(data.revenueCost ?? []);
      } catch (e) {
        if (!cancelled) {
          setSparkErr(e instanceof Error ? e.message : "โหลดกราฟไม่สำเร็จ");
          setSparkRevenueCost([]);
        }
      } finally {
        if (!cancelled) setSparkLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sparkCalendar.year, sparkCalendar.month, sparkCalendar.day]);

  const { periodTotalRevenue, periodTotalCost } = useMemo(() => {
    let rev = 0;
    let cost = 0;
    for (const b of sparkRevenueCost) {
      rev += b.revenue;
      cost += b.cost;
    }
    return { periodTotalRevenue: rev, periodTotalCost: cost };
  }, [sparkRevenueCost]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        dateKeyInFinanceRange(
          bangkokDateKeyFromIso(o.created_at),
          financeRange,
          todayKey,
          dateFrom.trim(),
          dateTo.trim(),
        ) && matchesSearch(o, search),
    );
  }, [orders, financeRange, todayKey, dateFrom, dateTo, search]);

  const periodCostEntries = useMemo(
    () =>
      costEntries.filter((e) =>
        dateKeyInFinanceRange(
          bangkokDateKeyFromIso(e.spent_at),
          financeRange,
          todayKey,
          dateFrom.trim(),
          dateTo.trim(),
        ),
      ),
    [costEntries, financeRange, todayKey, dateFrom, dateTo],
  );

  const paidForChart = useMemo(() => {
    return filteredOrders.filter((o) => o.status === "PAID");
  }, [filteredOrders]);

  const chartBuckets = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const o of paidForChart) {
      const k = orderDateKeyBangkok(o.created_at);
      byDay.set(k, (byDay.get(k) ?? 0) + o.total_amount);
    }
    const keys = Array.from(byDay.keys()).sort();
    const maxBars = 36;
    const slice = keys.length > maxBars ? keys.slice(-maxBars) : keys;
    const maxAmt = slice.reduce((m, k) => Math.max(m, byDay.get(k) ?? 0), 1);
    return slice.map((k) => ({
      key: k,
      label: formatChartLabel(k),
      amount: byDay.get(k) ?? 0,
      pct: Math.round(((byDay.get(k) ?? 0) / maxAmt) * 100),
    }));
  }, [paidForChart]);

  const menuItemToCategoryId = useMemo(() => {
    const m = new Map<number, number>();
    menuItems.forEach((x) => m.set(x.id, x.category_id));
    return m;
  }, [menuItems]);

  const categoryIdToName = useMemo(() => {
    const m = new Map<number, string>();
    categories.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [categories]);

  const categoryCompareBuckets = useMemo(() => {
    const totals = new Map<string, number>();
    for (const o of paidForChart) {
      for (const it of o.items) {
        const catId = menuItemToCategoryId.get(it.menu_item_id);
        const label =
          catId != null ? (categoryIdToName.get(catId)?.trim() || `หมวด #${catId}`) : "ไม่ระบุหมวด (เมนูถูกลบ/ไม่พบ)";
        const line = it.price * it.qty;
        totals.set(label, (totals.get(label) ?? 0) + line);
      }
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return entriesToColumnBuckets(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [paidForChart, menuItemToCategoryId, categoryIdToName]);

  const tableCompareBuckets = useMemo(() => {
    const totals = new Map<string, number>();
    for (const o of paidForChart) {
      const key = o.table_no.trim() || "ไม่ระบุโต๊ะ";
      totals.set(key, (totals.get(key) ?? 0) + o.total_amount);
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return entriesToColumnBuckets(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [paidForChart]);

  const filtersActive = useMemo(() => {
    return financeRange !== "MONTH" || search.trim().length > 0;
  }, [financeRange, search]);

  const periodLabel = useMemo(() => {
    if (financeRange === "TODAY") return "วันนี้";
    if (financeRange === "MONTH") return "เดือนนี้";
    if (financeRange === "YEAR") return "ปีนี้";
    const start = dateFrom.trim() || dateTo.trim();
    const end = dateTo.trim() || dateFrom.trim();
    if (start && end && start !== end) return `${start} ถึง ${end}`;
    if (start) return `วันที่ ${start}`;
    return "กำหนดเอง";
  }, [financeRange, dateFrom, dateTo]);

  function selectFinanceRange(next: BuildingPosFinanceRange) {
    setFinanceRange(next);
    if (next !== "CUSTOM") {
      setDateFrom("");
      setDateTo("");
    }
  }

  function resetFinanceFilters() {
    setFinanceRange("MONTH");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }

  return (
    <div className={buildingPosContentStackClass}>
      <section aria-label="สรุปการเงินช่วงที่กรอง">
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
          <li className={cn(buildingPosStatCardEmeraldClass, "p-3 sm:p-4")}>
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">รายรับ</p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-emerald-700 sm:text-3xl">
              ฿{periodTotalRevenue.toLocaleString()}
            </p>
          </li>
          <li className={cn(buildingPosStatCardIndigoClass, "p-3 sm:p-4")}>
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">รายจ่าย</p>
            <p className="mt-2 text-left text-2xl font-black tabular-nums text-rose-600 sm:text-3xl">
              ฿{periodTotalCost.toLocaleString()}
            </p>
          </li>
          <li className={cn(buildingPosStatCardVioletClass, "col-span-2 p-3 sm:col-span-1 sm:p-4")}>
            <p className="text-left text-[10px] font-black uppercase tracking-widest text-[#66638c]">สุทธิ</p>
            <p
              className={cn(
                "mt-2 text-left text-2xl font-black tabular-nums sm:text-3xl",
                periodTotalRevenue - periodTotalCost >= 0 ? "text-[#1e1b4b]" : "text-rose-800",
              )}
            >
              ฿{(periodTotalRevenue - periodTotalCost).toLocaleString()}
            </p>
          </li>
        </ul>
      </section>

      <AppDashboardSection tone="violet" className="rounded-[1.25rem]">
        <AppSectionHeader
          tone="violet"
          title="การเงิน"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                aria-expanded={filterOpen}
                aria-controls="building-pos-sales-filter-panel"
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                title={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] items-center justify-center gap-1.5 px-3 text-xs font-black text-[#4d47b6]",
                  filterOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90 ring-2 ring-[#5b61ff]/20",
                  filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
                )}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                  <path d="M4 5h16l-5.5 7.2V19l-5 2v-8.8L4 5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
                {filtersActive ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#5b61ff]" aria-hidden />
                ) : null}
              </button>
              <button
                type="button"
                onClick={() => setChartsOpen((o) => !o)}
                aria-expanded={chartsOpen}
                aria-controls="building-pos-sales-charts"
                aria-label={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                title={chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "inline-flex min-h-[40px] items-center justify-center px-3 text-xs font-black text-[#4d47b6]",
                  chartsOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90",
                )}
              >
                {chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
              </button>
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  aria-busy={refreshing}
                  aria-label="รีเฟรชข้อมูลรายงาน"
                  title="รีเฟรช"
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-0 px-0 sm:min-w-0 sm:gap-1.5 sm:px-4",
                    "border-[#dcd8f0] bg-white/80 text-[#4d47b6] disabled:opacity-50",
                  )}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className={cn("h-5 w-5 shrink-0", refreshing && "animate-spin")}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.25}
                    aria-hidden
                  >
                    <path d="M21 12a9 9 0 11-3.05-6.65M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="hidden sm:inline">{refreshing ? "กำลังรีเฟรช…" : "รีเฟรช"}</span>
                </button>
              ) : null}
            </div>
          }
        />

        <div
          id="building-pos-sales-filter-panel"
          className={cn("mt-4 space-y-3", filterOpen ? "block" : "hidden")}
        >
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองช่วงเวลาการเงิน">
            {(
              [
                { key: "TODAY" as const, label: "วันนี้" },
                { key: "MONTH" as const, label: "เดือนนี้" },
                { key: "YEAR" as const, label: "ปีนี้" },
                { key: "CUSTOM" as const, label: "กำหนดเอง" },
              ] as const
            ).map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => selectFinanceRange(chip.key)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center justify-center",
                  financeRange === chip.key ? buildingPosChipActiveClass : buildingPosChipIdleClass,
                )}
                aria-pressed={financeRange === chip.key}
              >
                {chip.label}
              </button>
            ))}
          </div>
          {financeRange === "CUSTOM" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ตั้งแต่วันที่</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label="ตั้งแต่วันที่ กรุงเทพ"
                  className={cn(buildingPosFieldClass, "mt-1")}
                />
              </label>
              <label className="min-w-0">
                <span className="text-xs font-bold text-[#4d47b6]">ถึงวันที่</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label="ถึงวันที่ กรุงเทพ"
                  className={cn(buildingPosFieldClass, "mt-1")}
                />
              </label>
            </div>
          ) : null}
          <div className={cn("grid gap-3", filtersActive ? "sm:grid-cols-12" : undefined)}>
            <label className={cn("min-w-0", filtersActive ? "sm:col-span-9" : undefined)}>
              <span className="sr-only">ค้นหาชื่อลูกค้า โต๊ะ เมนู หรือหมายเหตุ</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อลูกค้า โต๊ะ เมนู หรือหมายเหตุ…"
                aria-label="ค้นหาชื่อลูกค้า โต๊ะ เมนู หรือหมายเหตุ"
                inputMode="search"
                className={cn(buildingPosFieldClass, "mt-0")}
              />
            </label>
            {filtersActive ? (
              <div className="flex items-stretch sm:col-span-3">
                <button
                  type="button"
                  onClick={() => resetFinanceFilters()}
                  className={cn(
                    appTemplateOutlineButtonClass,
                    "inline-flex h-11 w-full min-h-[44px] items-center justify-center rounded-2xl px-3 text-sm font-black text-[#4d47b6]",
                  )}
                  aria-label="รีเซ็ตตัวกรองเป็นเดือนนี้"
                >
                  รีเซ็ต · เดือนนี้
                </button>
              </div>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-[#66638c]">กำลังดู: {periodLabel}</p>
        </div>

          {chartsOpen ? (
            <div id="building-pos-sales-charts" className="space-y-4">
              <p className="text-sm font-black text-[#1e1b4b]">รายรับเทียบรายจ่าย</p>
              {sparkLoading ? (
                <div className={cn("h-40 animate-pulse rounded-[1.25rem]", buildingPosPulseWashClass)} aria-hidden />
              ) : sparkErr ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{sparkErr}</p>
              ) : (
                <AppSparkChartPanel className="w-full min-w-0">
                  <AppRevenueCostColumnChart
                    className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                    compact
                    title=""
                    subtitle=""
                    buckets={sparkRevenueCost}
                    emptyText="ไม่มีข้อมูลรายรับหรือรายจ่ายในช่วงที่กรอง"
                    formatTitle={(b) =>
                      `${b.label}: รายรับ ฿${b.revenue.toLocaleString()} · รายจ่าย ฿${b.cost.toLocaleString()}`
                    }
                  />
                </AppSparkChartPanel>
              )}

              <p className="text-sm font-black text-[#1e1b4b]">ยอดขาย</p>
              <AppSparkChartPanel className="w-full min-w-0">
                <AppColumnBarSparkChart
                  className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                  variant="brand"
                  compact
                  buckets={chartBuckets}
                  title=""
                  emptyText="ไม่มีข้อมูลยอดขายในช่วงที่เลือก"
                  formatTitle={(b) => `${b.label}: ฿${b.amount.toLocaleString()}`}
                />
              </AppSparkChartPanel>

              <div className="space-y-3 border-t border-[#ecebff] pt-4">
                <p className="text-sm font-black text-[#1e1b4b]">สรุปเปรียบเทียบ</p>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
                  <div className="rounded-[1.25rem] border border-white/55 bg-white/40 p-3 ring-1 ring-inset ring-white/40 sm:p-4">
                    <button
                      type="button"
                      onClick={() => setCategoryCompareOpen((o) => !o)}
                      aria-expanded={categoryCompareOpen}
                      aria-controls="building-pos-compare-category"
                      className="flex w-full min-h-[40px] items-center justify-between gap-2 text-left"
                    >
                      <span className="text-sm font-black text-[#1e1b4b]">ยอดตามหมวด</span>
                      <span
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "inline-flex min-h-[36px] shrink-0 items-center rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                          categoryCompareOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90",
                        )}
                      >
                        {categoryCompareOpen ? "ย่อ" : "ขยาย"}
                      </span>
                    </button>
                    {categoryCompareOpen ? (
                      <div id="building-pos-compare-category" className="mt-3">
                        <AppColumnBarSparkChart
                          className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                          variant="brand"
                          compact
                          buckets={categoryCompareBuckets}
                          title=""
                          emptyText="ไม่มีออเดอร์ชำระแล้วในช่วงที่เลือก"
                          formatTitle={(b) => `${b.label}: ฿${b.amount.toLocaleString()}`}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-[#66638c]">ย่อไว้ — กดขยายเพื่อดูกราฟ</p>
                    )}
                  </div>

                  <div className="rounded-[1.25rem] border border-white/55 bg-white/40 p-3 ring-1 ring-inset ring-white/40 sm:p-4">
                    <button
                      type="button"
                      onClick={() => setTableCompareOpen((o) => !o)}
                      aria-expanded={tableCompareOpen}
                      aria-controls="building-pos-compare-table"
                      className="flex w-full min-h-[40px] items-center justify-between gap-2 text-left"
                    >
                      <span className="text-sm font-black text-[#1e1b4b]">ยอดตามโต๊ะ</span>
                      <span
                        className={cn(
                          appTemplateOutlineButtonClass,
                          "inline-flex min-h-[36px] shrink-0 items-center rounded-xl px-3 text-xs font-black text-[#4d47b6]",
                          tableCompareOpen && "border-[#5b61ff]/45 bg-[#ecebff]/90",
                        )}
                      >
                        {tableCompareOpen ? "ย่อ" : "ขยาย"}
                      </span>
                    </button>
                    {tableCompareOpen ? (
                      <div id="building-pos-compare-table" className="mt-3">
                        <AppColumnBarSparkChart
                          className="flex min-h-0 w-full min-w-0 flex-1 flex-col"
                          variant="brand"
                          compact
                          buckets={tableCompareBuckets}
                          title=""
                          emptyText="ไม่มีออเดอร์ชำระแล้วในช่วงที่เลือก"
                          formatTitle={(b) => `${b.label}: ฿${b.amount.toLocaleString()}`}
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs font-semibold text-[#66638c]">ย่อไว้ — กดขยายเพื่อดูกราฟ</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

        <div className="mt-4 space-y-4 border-t border-[#ecebff] pt-4">
          <nav className={buildingPosFinanceSubTabShellClass} aria-label="เมนูการเงิน">
          <div className="flex w-full min-w-0 gap-1" role="tablist">
            {FINANCE_DETAIL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={detailPanel === t.id}
                id={`building-pos-finance-tab-${t.id}`}
                aria-controls={`building-pos-finance-panel-${t.id}`}
                onClick={() => setDetailPanel(t.id)}
                className={cn(
                  "flex min-h-[44px] min-w-0 flex-1 items-center justify-center rounded-[1.25rem] px-2 py-2 text-center text-[11px] font-black leading-tight transition-all sm:px-3 sm:text-sm",
                  detailPanel === t.id
                    ? cn(buildingPosNavActiveClass, "ring-1 ring-white/55")
                    : cn("ring-1 ring-transparent", buildingPosNavIdleClass),
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-4">
          {detailPanel === "history" ? (
            <div
              id="building-pos-finance-panel-history"
              role="tabpanel"
              aria-labelledby="building-pos-finance-tab-history"
            >
              <AppSectionHeader tone="slate" title="ประวัติ / รายรับ" />
              <p className="mt-2 text-xs font-semibold text-[#66638c]">
                ตามช่วง · {periodLabel}
                {search.trim() ? ` · ค้นหา «${search.trim()}»` : ""}
              </p>
              {filteredOrders.length === 0 ? (
                <AppEmptyState className="mt-4">ไม่พบรายการตามเงื่อนไข</AppEmptyState>
              ) : (
                <div className={cn("mt-4", appDashboardHistoryListShellClass)}>
                  <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-0.5">
                    <HomeFinanceList as="ul" listRole="ประวัติรายรับ">
                      {filteredOrders.map((o) => (
                        <li key={o.id}>
                          <PosSalesHistoryCard
                            order={o}
                            onStatusChange={onOrderStatusChange}
                            onEdit={openOrderEdit}
                            onDelete={onOrderDelete}
                            onSlipImageOpen={onSlipImageOpen}
                          />
                        </li>
                      ))}
                    </HomeFinanceList>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {detailPanel === "expenses" ? (
            <div
              id="building-pos-finance-panel-expenses"
              role="tabpanel"
              aria-labelledby="building-pos-finance-tab-expenses"
            >
              <p className="mb-2 text-xs font-semibold text-[#66638c]">ต้นทุน · {periodLabel}</p>
              <BuildingPosCostsPanel
                embedded
                costCategories={costCategories}
                costEntries={periodCostEntries}
                emptyWhenFilteredMessage="ยังไม่มีรายจ่ายในช่วงนี้ — กด «+ เพิ่มรายจ่าย»"
                onChanged={() => void onCostsChanged?.()}
              />
            </div>
          ) : null}
        </div>
      </div>
      </AppDashboardSection>

      <FormModal
        open={editOrder != null}
        onClose={() => {
          if (!editBusy) setEditOrder(null);
        }}
        title={editOrder ? `แก้ไขออเดอร์ #${editOrder.id}` : "แก้ไขออเดอร์"}
        description="แก้ลูกค้า · โต๊ะ · เมนู · วันที่ · สถานะ และสลิป"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={() => setEditOrder(null)}
            onSubmit={() => void submitOrderEdit()}
            submitLabel={editBusy ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={editBusy || editSlipBusy}
            loading={editBusy}
          />
        }
      >
        <div className="space-y-3">
          {editErr ? <p className="text-sm font-semibold text-rose-600">{editErr}</p> : null}
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">ชื่อลูกค้า</span>
            <input
              value={editCustomer}
              onChange={(e) => setEditCustomer(e.target.value)}
              className={cn(buildingPosFieldClass, "mt-1")}
              autoComplete="name"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">โต๊ะ</span>
              <input
                value={editTable}
                onChange={(e) => setEditTable(e.target.value)}
                className={cn(buildingPosFieldClass, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 20))}
                className={cn(buildingPosFieldClass, "mt-1")}
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">วัน–เวลาออเดอร์</span>
            <input
              type="datetime-local"
              value={editCreatedAt}
              onChange={(e) => setEditCreatedAt(e.target.value)}
              className={cn(buildingPosFieldClass, "mt-1")}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">สถานะ</span>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as PosOrder["status"])}
              className={cn(buildingPosSelectFieldClass, "mt-1")}
            >
              {POS_ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabelTh[s]}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-[#4d47b6]">เมนูอาหาร</p>
              <p className="text-xs font-black tabular-nums text-emerald-700">
                รวม ฿{editItemsTotal.toLocaleString("th-TH")}
              </p>
            </div>
            <ul className="mt-2 space-y-2">
              {editItems.map((it, idx) => (
                <li
                  key={`${it.menu_item_id}-${idx}`}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-white/50 bg-white/70 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1e1b4b]">{it.name}</p>
                    <p className="text-[11px] font-medium text-[#66638c]">
                      ฿{it.price.toLocaleString("th-TH")} / รายการ
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white text-lg font-black text-[#4d47b6]"
                      aria-label={`ลดจำนวน ${it.name}`}
                      onClick={() =>
                        setEditItems((prev) =>
                          prev.flatMap((row, i) => {
                            if (i !== idx) return [row];
                            if (row.qty <= 1) return [];
                            return [{ ...row, qty: row.qty - 1 }];
                          }),
                        )
                      }
                    >
                      −
                    </button>
                    <span className="min-w-[2rem] text-center text-sm font-black tabular-nums text-[#1e1b4b]">
                      {it.qty}
                    </span>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/60 bg-white text-lg font-black text-[#4d47b6]"
                      aria-label={`เพิ่มจำนวน ${it.name}`}
                      onClick={() =>
                        setEditItems((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, qty: Math.min(100, row.qty + 1) } : row)),
                        )
                      }
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบเมนู ${it.name}`}
                    title="ลบเมนู"
                    onClick={() => setEditItems((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#4d47b6]">เพิ่มเมนู</span>
                <select
                  value={editAddMenuId}
                  onChange={(e) => setEditAddMenuId(e.target.value)}
                  className={cn(buildingPosSelectFieldClass, "mt-1")}
                >
                  <option value="">— เลือกเมนู —</option>
                  {activeMenuForEdit.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.name} · ฿{m.price.toLocaleString("th-TH")}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={cn(appTemplateOutlineButtonClass, "rounded-xl px-3 py-2 text-xs font-bold")}
                disabled={!editAddMenuId}
                onClick={() => {
                  const id = Number(editAddMenuId);
                  const m = activeMenuForEdit.find((x) => x.id === id);
                  if (!m) return;
                  setEditItems((prev) => {
                    const exist = prev.findIndex((x) => x.menu_item_id === m.id);
                    if (exist >= 0) {
                      return prev.map((row, i) =>
                        i === exist ? { ...row, qty: Math.min(100, row.qty + 1) } : row,
                      );
                    }
                    return [
                      ...prev,
                      {
                        menu_item_id: m.id,
                        name: m.name,
                        price: m.price,
                        qty: 1,
                        note: "",
                        kitchen_department_id: m.kitchen_department_id ?? null,
                      },
                    ];
                  });
                  setEditAddMenuId("");
                }}
              >
                เพิ่ม
              </button>
            </div>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-[#4d47b6]">หมายเหตุ</span>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={2}
              className={cn(buildingPosFieldClass, "mt-1 min-h-[4rem] py-2")}
            />
          </label>
          <div>
            <p className="text-xs font-bold text-[#4d47b6]">สลิปชำระ (ไม่บังคับ)</p>
            <AppGalleryCameraFileInputs
              galleryInputRef={editGalleryRef}
              cameraInputRef={editCameraInputRef}
              onChange={(e) => void onPickEditSlip(e)}
            />
            <div className="mt-2">
              <AppImagePickCameraButtons
                onPickGallery={() => editGalleryRef.current?.click()}
                onPickCamera={() => openEditSlipCamera((file) => void uploadEditSlip(file))}
                disabled={editBusy || editSlipBusy}
                busy={editSlipBusy}
              />
            </div>
            {editSlipCameraModal}
            {editSlipUrl ? (
              <div className="mt-2 flex flex-wrap items-end gap-3">
                <AppImageThumb
                  src={editSlipUrl}
                  alt="สลิปออเดอร์"
                  onOpen={() => {
                    if (onSlipImageOpen) onSlipImageOpen(editSlipUrl);
                  }}
                  className="h-20 w-20"
                />
                <button
                  type="button"
                  onClick={() => setEditSlipUrl("")}
                  className={cn(appTemplateOutlineButtonClass, "rounded-xl px-3 py-2 text-xs font-bold")}
                >
                  ลบสลิป
                </button>
              </div>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#66638c]">ยังไม่มีสลิป — อัปโหลดหรือถ่ายใหม่ได้</p>
            )}
          </div>
        </div>
      </FormModal>
    </div>
  );
}

function formatChartLabel(isoDateKey: string): string {
  const p = isoDateKey.split("-").map(Number);
  const d = p[2] ?? 0;
  const m = p[1] ?? 0;
  return `${d}/${m}`;
}
