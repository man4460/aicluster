"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  type PosCategory,
  type PosMenuItem,
  type PosOrder,
  uploadBuildingPosSessionImage,
  uploadBuildingPosStaffImage,
} from "@/systems/building-pos/building-pos-service";
import { prepareBuildingPosSlipImageFile } from "@/systems/building-pos/building-pos-slip-image";
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
  AppCompareBarList,
  type AppCompareBarRow,
  AppDashboardSection,
  AppEmptyState,
  AppGalleryCameraFileInputs,
  AppImagePickCameraButtons,
  AppImageThumb,
  AppSectionHeader,
  appDashboardHistoryListShellClass,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { shopQrTemplateGridPrimaryButtonClass } from "@/components/qr/shop-qr-template";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { HomeFinanceList } from "@/systems/home-finance/components/HomeFinanceUi";

type OpenOrderStatus = "NEW" | "PREPARING" | "SERVED";

function statusCountsForOpenOrders(list: PosOrder[]): Record<OpenOrderStatus, number> {
  const r: Record<OpenOrderStatus, number> = { NEW: 0, PREPARING: 0, SERVED: 0 };
  for (const o of list) {
    if (o.status === "NEW" || o.status === "PREPARING" || o.status === "SERVED") {
      r[o.status] += 1;
    }
  }
  return r;
}

/** สีการ์ดตามขั้นที่ต้องเร่งก่อน: มีออเดอร์ใหม่ → เหลือง, ไม่มีแต่กำลังทำ → ฟ้า, เหลือแต่เสิร์ฟ → เขียว */
function dominantOpenStatus(list: PosOrder[]): OpenOrderStatus {
  const c = statusCountsForOpenOrders(list);
  if (c.NEW > 0) return "NEW";
  if (c.PREPARING > 0) return "PREPARING";
  return "SERVED";
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
    stepLabel: "เสิร์ฟแล้ว — รอเก็บเงิน",
  },
};

const orderBlockTone: Record<OpenOrderStatus, string> = {
  NEW: "border-l-4 border-l-amber-500 bg-amber-50/40",
  PREPARING: "border-l-4 border-l-sky-500 bg-sky-50/35",
  SERVED: "border-l-4 border-l-emerald-500 bg-emerald-50/35",
};

const statusBadgeClass: Record<OpenOrderStatus, string> = {
  NEW: "bg-amber-100 text-amber-900 ring-amber-200/80",
  PREPARING: "bg-sky-100 text-sky-900 ring-sky-200/80",
  SERVED: "bg-emerald-100 text-emerald-900 ring-emerald-200/80",
};

function orderDateKeyBangkok(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
}

function orderPartsBangkok(iso: string): { y: number; m: number; d: number } {
  const key = orderDateKeyBangkok(iso);
  const [y, m, d] = key.split("-").map((x) => Number(x));
  return { y, m, d };
}

export const statusLabelTh: Record<PosOrder["status"], string> = {
  NEW: "ใหม่",
  PREPARING: "กำลังทำ",
  SERVED: "เสิร์ฟแล้ว",
  PAID: "ชำระแล้ว",
};

/** กรองแยกชั้น: ปี / เดือน / วัน — ช่องว่าง = ไม่ใช้เงื่อนไขนั้น (มีวันอย่างเดียว = วันที่นั้นของทุกเดือน) */
function matchesPeriod(iso: string, year: string, month: string, day: string): boolean {
  const { y, m, d } = orderPartsBangkok(iso);
  if (year) {
    const yN = Number(year);
    if (!Number.isFinite(yN) || y !== yN) return false;
  }
  if (month) {
    const mN = Number(month);
    if (!Number.isFinite(mN) || m !== mN) return false;
  }
  if (day) {
    const dN = Number(day);
    if (!Number.isFinite(dN) || d !== dN) return false;
  }
  return true;
}

/** จำนวนวันสูงสุดในเดือนที่เลือก (ใช้ปีจริงถ้ามี; ไม่มีปีแต่มีเดือน → ใช้ปีอธิกสุรทินเพื่อให้กุมภามี 29) */
function maxDayInMonthForFilter(yearStr: string, monthStr: string): number {
  const m = Number(monthStr);
  if (!monthStr || !Number.isFinite(m) || m < 1 || m > 12) return 31;
  const y =
    yearStr && Number.isFinite(Number(yearStr)) && Number(yearStr) >= 1900
      ? Number(yearStr)
      : 2024;
  return new Date(y, m, 0).getDate();
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

type OpenTablesProps = {
  orders: PosOrder[];
  menuImageById: Map<number, string>;
  onOrderStatusChange: (id: number, status: PosOrder["status"]) => void;
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
  const [slipCameraOpen, setSlipCameraOpen] = useState(false);

  const [tableModalKey, setTableModalKey] = useState<string | null>(null);
  const [tableModalView, setTableModalView] = useState<"details" | "bill">("details");
  const [billPdfBusy, setBillPdfBusy] = useState(false);
  const [billPrintedAt, setBillPrintedAt] = useState("");
  const [ppQrUrl, setPpQrUrl] = useState<string | null>(null);
  const [ppQrLoading, setPpQrLoading] = useState(false);
  const [ppConfigured, setPpConfigured] = useState(true);

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
      <AppDashboardSection tone="violet">
        <div className="border-b border-[#ecebff] pb-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 text-lg font-bold leading-snug text-[#2e2a58] pr-1">
              โต๊ะที่ลูกค้าสั่งอาหาร
            </h2>
            {headerAction ? <div className="shrink-0 pt-0.5">{headerAction}</div> : null}
          </div>
          <p className="mt-1 text-xs text-[#66638c]">
            แสดงเฉพาะออเดอร์ที่ยังไม่ชำระ — สีการ์ดบอกขั้นตอนหลัก (เหลือง = ใหม่, ฟ้า = กำลังทำ, เขียว = เสิร์ฟแล้ว) — พอชำระเงินแล้วโต๊ะจะหายจากที่นี่
          </p>
        </div>
        {activeByTable.length === 0 ? (
          <AppEmptyState tone="violet" className="mt-4 py-8 sm:py-8">
            ตอนนี้ไม่มีโต๊ะที่มีออเดอร์ค้าง
          </AppEmptyState>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {activeByTable.map(([tableKey, list]) => {
              const total = list.reduce((s, o) => s + o.total_amount, 0);
              const counts = statusCountsForOpenOrders(list);
              const dom = dominantOpenStatus(list);
              const tone = tableCardTone[dom];
              return (
                <li key={tableKey}>
                  <button
                    type="button"
                    onClick={() => setTableModalKey(tableKey)}
                    className={cn(
                      "flex h-full min-h-[148px] w-full flex-col rounded-2xl border-2 p-4 text-left shadow-sm transition hover:shadow-md",
                      tone.border,
                      tone.bg,
                      tone.hoverBorder,
                      tone.ring,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#66638c]">โต๊ะ</span>
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
                    <span className="mt-1 line-clamp-2 text-xl font-bold tabular-nums text-[#2e2a58]">{tableKey}</span>
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
                          เสิร์ฟแล้ว {counts.SERVED}
                        </span>
                      ) : null}
                    </div>
                    <span className="mt-1.5 text-[11px] text-[#66638c]">รวม {list.length} ออเดอร์</span>
                    <span className="mt-auto pt-2 text-sm font-semibold tabular-nums text-emerald-700">
                      ฿ {total.toLocaleString()}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={tableModalKey !== null}
        title={
          tableModalKey ?
            tableModalView === "details" ?
              `โต๊ะ ${tableModalKey} — รายละเอียด`
            : `โต๊ะ ${tableModalKey} — บิลชำระเงิน`
          : ""
        }
        description={
          tableModalView === "details" ?
            "แก้สถานะออเดอร์ — เปิดบิลพร้อมเพย์เมื่อต้องการพิมพ์หรือให้ลูกค้าสแกน QR"
          : "ให้ลูกค้าสแกนจ่าย — พิมพ์บิลหรือดาวน์โหลด PDF ได้จากปุ่มด้านล่าง"
        }
        onClose={() => setTableModalKey(null)}
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
                onClick={() => setTableModalKey(null)}
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
                  onClick={() => setTableModalKey(null)}
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
            <AppGalleryCameraFileInputs
              galleryInputRef={slipGalleryInputRef}
              cameraInputRef={slipCameraInputRef}
              onChange={onSlipFileChange}
            />
            {modalOrders.map((o) => {
              const st = o.status as OpenOrderStatus;
              const validSt = st === "NEW" || st === "PREPARING" || st === "SERVED" ? st : "NEW";
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
                  <ul className="mt-2 space-y-1.5 text-sm text-[#66638c]">
                    {o.items.map((it, idx) => (
                      <li key={`${o.id}-${idx}`} className="flex gap-2">
                        {menuImageById.get(it.menu_item_id) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={menuImageById.get(it.menu_item_id)!}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-md border border-[#e1e3ff] object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded-md border border-dashed border-[#d8d6ec] bg-white" />
                        )}
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
                  <label className="mt-2 block text-xs font-medium text-[#66638c]">
                    สถานะ
                    <select
                      className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
                      value={o.status}
                      onChange={(e) => onOrderStatusChange(o.id, e.target.value as PosOrder["status"])}
                    >
                      {(Object.keys(statusLabelTh) as PosOrder["status"][]).map((s) => (
                        <option key={s} value={s}>
                          {statusLabelTh[s]} ({s})
                        </option>
                      ))}
                    </select>
                  </label>
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
                  <p className="mt-1 text-right text-sm font-semibold tabular-nums text-slate-900">
                    รวม ฿{o.total_amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 px-3 py-4 text-center">
              <p className="text-xs font-medium text-slate-600">ยอดรวมทั้งหมด (บาท)</p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-[#0000BF]">
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

function entriesToBarRows(entries: [string, number][]): AppCompareBarRow[] {
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
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-200/80";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200/80";
  }
}

/** การ์ดรายการ — แบบประวัติรายรับ–รายจ่าย */
function PosSalesHistoryCard({
  order: o,
  onStatusChange,
  onSlipImageOpen,
}: {
  order: PosOrder;
  onStatusChange: (id: number, status: PosOrder["status"]) => void;
  onSlipImageOpen?: (imageUrl: string) => void;
}) {
  const timeStr = new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
  const itemsLine = o.items.map((i) => `${i.name}×${i.qty}`).join(", ");
  const slipUrl = o.payment_slip_url?.trim() ?? "";
  return (
    <article className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm transition hover:border-slate-300">
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
        <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
          ฿{o.total_amount.toLocaleString()}{" "}
          <span className="text-[11px] font-light text-slate-500">บาท</span>
        </span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-tight text-slate-900">{itemsLine || "—"}</p>
      <p className="truncate text-[11px] leading-tight text-slate-600">
        <span className="text-slate-400">ลูกค้า / โต๊ะ</span> · {o.customer_name || "—"} · {o.table_no || "—"}
      </p>
      {o.note?.trim() ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600">{o.note}</p>
      ) : null}
      {slipUrl ?
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/90 p-2">
          <AppImageThumb
            src={slipUrl}
            alt="สลิปโอน"
            onOpen={() => {
              if (onSlipImageOpen) onSlipImageOpen(slipUrl);
              else window.open(slipUrl, "_blank", "noopener,noreferrer");
            }}
          />
          <div className="min-w-0 text-[11px]">
            <p className="font-semibold text-slate-800">สลิปโอน</p>
            <button
              type="button"
              onClick={() => {
                if (onSlipImageOpen) onSlipImageOpen(slipUrl);
                else window.open(slipUrl, "_blank", "noopener,noreferrer");
              }}
              className="text-left text-[#0000BF] underline touch-manipulation"
            >
              เปิดดูเต็ม
            </button>
          </div>
        </div>
      : null}
      <div className="mt-2 border-t border-slate-100 pt-2">
        <label className="block text-[10px] font-medium text-slate-400">สถานะ</label>
        <select
          className="app-input mt-1 min-h-[44px] w-full touch-manipulation rounded-xl px-3 py-2 text-sm"
          value={o.status}
          onChange={(e) => onStatusChange(o.id, e.target.value as PosOrder["status"])}
        >
          {(Object.keys(statusLabelTh) as PosOrder["status"][]).map((s) => (
            <option key={s} value={s}>
              {statusLabelTh[s]} ({s})
            </option>
          ))}
        </select>
      </div>
    </article>
  );
}

type HistoryProps = {
  orders: PosOrder[];
  categories?: PosCategory[];
  menuItems?: PosMenuItem[];
  onOrderStatusChange: (id: number, status: PosOrder["status"]) => void;
  /** เปิดสลิปด้วย AppImageLightbox จาก @/components/app-templates */
  onSlipImageOpen?: (imageUrl: string) => void;
};

/** หน้ายอดขาย — กรอง กราฟ ประวัติ */
export function BuildingPosSalesHistoryPanel({
  orders,
  onOrderStatusChange,
  onSlipImageOpen,
  categories = [],
  menuItems = [],
}: HistoryProps) {
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterDay, setFilterDay] = useState("");
  const [search, setSearch] = useState("");

  const yearOptions = useMemo(() => {
    const ys = new Set<number>();
    const nowKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
    ys.add(Number(nowKey.slice(0, 4)));
    orders.forEach((o) => ys.add(orderPartsBangkok(o.created_at).y));
    return Array.from(ys).sort((a, b) => b - a);
  }, [orders]);

  const dayNumbers = useMemo(() => {
    const max = maxDayInMonthForFilter(filterYear, filterMonth);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (!filterDay) return;
    const max = maxDayInMonthForFilter(filterYear, filterMonth);
    if (Number(filterDay) > max) setFilterDay("");
  }, [filterYear, filterMonth, filterDay]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) =>
        matchesPeriod(o.created_at, filterYear, filterMonth, filterDay) && matchesSearch(o, search),
    );
  }, [orders, filterYear, filterMonth, filterDay, search]);

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

  const categoryCompareRows = useMemo(() => {
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
    return entriesToBarRows(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [paidForChart, menuItemToCategoryId, categoryIdToName]);

  const tableCompareRows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const o of paidForChart) {
      const key = o.table_no.trim() || "ไม่ระบุโต๊ะ";
      totals.set(key, (totals.get(key) ?? 0) + o.total_amount);
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    return entriesToBarRows(capLeaderboard(sorted, MAX_COMPARE_ROWS));
  }, [paidForChart]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <AppDashboardSection tone="violet">
        <div className="border-b border-[#ecebff] pb-3">
          <h2 className="text-lg font-bold text-[#2e2a58]">กรองประวัติและกราฟ</h2>
          <p className="mt-1 text-xs text-[#66638c]">
            เลือกปี เดือน วันได้ทีละช่อง — วันใช้ได้ทันที (ไม่บังคับเดือน: กรอง &quot;วันที่ N&quot; ทุกเดือน) ร่วมกับเดือน/ปีได้
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[#4d47b6]" id="pos-sales-filter-year-lbl">
              ปี
            </span>
            <select
              id="pos-sales-filter-year"
              aria-labelledby="pos-sales-filter-year-lbl"
              className="app-input min-h-[44px] w-full min-w-[7rem] cursor-pointer touch-manipulation rounded-xl px-3 py-2 text-sm sm:w-auto"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setFilterMonth("");
                setFilterDay("");
              }}
            >
              <option value="">ทั้งหมด</option>
              {yearOptions.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[#4d47b6]" id="pos-sales-filter-month-lbl">
              เดือน
            </span>
            <select
              id="pos-sales-filter-month"
              aria-labelledby="pos-sales-filter-month-lbl"
              className="app-input min-h-[44px] w-full min-w-[8rem] cursor-pointer touch-manipulation rounded-xl px-3 py-2 text-sm sm:w-auto"
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setFilterDay("");
              }}
            >
              <option value="">ทุกเดือน</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs font-medium text-[#4d47b6]" id="pos-sales-filter-day-lbl">
              วัน
            </span>
            <select
              id="pos-sales-filter-day"
              aria-labelledby="pos-sales-filter-day-lbl"
              className="app-input min-h-[44px] w-full min-w-[6rem] cursor-pointer touch-manipulation rounded-xl px-3 py-2 text-sm sm:w-auto"
              value={dayNumbers.includes(Number(filterDay)) ? filterDay : ""}
              onChange={(e) => setFilterDay(e.target.value)}
            >
              <option value="">ทุกวัน</option>
              {dayNumbers.map((d) => (
                <option key={d} value={String(d)}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <label className="min-w-0 flex-1 text-xs font-medium text-[#4d47b6] sm:min-w-[200px]">
            ค้นหา
            <input
              className="app-input mt-1 min-h-[44px] w-full rounded-xl px-3 py-2 text-sm touch-manipulation"
              placeholder="ชื่อลูกค้า, โต๊ะ, เมนู, หมายเหตุ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>

        <AppColumnBarSparkChart
          className="mt-6"
          variant="brand"
          buckets={chartBuckets}
          title="กราฟยอดขาย (ออเดอร์ชำระแล้ว)"
          subtitle={`แกนแนวตั้ง = ยอดเงินต่อวัน (เขตเวลาไทย) สูงสุด ${chartBuckets.length} วันล่าสุดในช่วงที่กรอง`}
          emptyText="ไม่มีข้อมูลยอดขายในช่วงที่เลือก"
          formatTitle={(b) => `${b.label}: ฿${b.amount.toLocaleString()}`}
        />

        <div className="mt-6 space-y-6 border-t border-[#ecebff] pt-6">
          <p className="text-xs font-medium text-[#4d47b6]">สรุปเปรียบเทียบ (ออเดอร์ชำระแล้วในช่วงที่กรอง)</p>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
            <AppCompareBarList
              variant="brand"
              title="ยอดตามหมวดหมู่"
              subtitle="รวมจากรายการในออเดอร์ (ราคา × จำนวน) ตามหมวดหมู่ของเมนู — ถ้าไม่พบเมนูจะไปหมวด &quot;ไม่ระบุหมวด&quot;"
              rows={categoryCompareRows}
              emptyText="ไม่มีรายการขายในช่วงที่เลือก"
              formatAmount={(a) => `฿ ${a.toLocaleString()}`}
            />
            <AppCompareBarList
              variant="brand"
              title="ยอดตามโต๊ะ"
              subtitle="รวมยอดออเดอร์ชำระแล้วต่อโต๊ะ (ใช้ยอดรวมของแต่ละออเดอร์)"
              rows={tableCompareRows}
              emptyText="ไม่มีออเดอร์ชำระแล้วในช่วงที่เลือก"
              formatAmount={(a) => `฿ ${a.toLocaleString()}`}
            />
          </div>
        </div>
      </AppDashboardSection>

      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="ประวัติการขาย"
          description={<>แสดง {filteredOrders.length} รายการจากทั้งหมด {orders.length} ออเดอร์</>}
        />
        {filteredOrders.length === 0 ? (
          <AppEmptyState>ไม่พบออเดอร์ตามเงื่อนไข</AppEmptyState>
        ) : (
          <div className={appDashboardHistoryListShellClass}>
            <div className="max-h-[min(70vh,40rem)] overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pr-0.5">
              <HomeFinanceList as="ul" listRole="ประวัติการขาย">
                {filteredOrders.map((o) => (
                  <li key={o.id}>
                    <PosSalesHistoryCard
                      order={o}
                      onStatusChange={onOrderStatusChange}
                      onSlipImageOpen={onSlipImageOpen}
                    />
                  </li>
                ))}
              </HomeFinanceList>
            </div>
          </div>
        )}
      </AppDashboardSection>
    </div>
  );
}

function formatChartLabel(isoDateKey: string): string {
  const p = isoDateKey.split("-").map(Number);
  const d = p[2] ?? 0;
  const m = p[1] ?? 0;
  return `${d}/${m}`;
}
