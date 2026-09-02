"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppEmptyState,
  appTemplateOutlineButtonClass,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { LaundryDashboardHeaderToolbar } from "@/systems/laundry/components/LaundryDashboardHeaderToolbar";
import { LaundryOrderCard } from "@/systems/laundry/components/LaundryOrderCard";
import { LaundryOrderPrintModal } from "@/systems/laundry/components/LaundryOrderPrintModal";
import { LaundryPaymentPanel } from "@/systems/laundry/components/LaundryPaymentPanel";
import { isLaundryOrderFromCustomerPickupPortal } from "@/systems/laundry/laundry-customer-pickup-request";
import { type LaundryPaymentMethod, laundryPaymentShowsSlipUpload } from "@/systems/laundry/lib/payment-method";
import { laundryOrderCardListGridClass } from "@/systems/laundry/laundry-dashboard-layout";
import {
  laundryDashboardSegmentBtnClass,
  laundryDashboardSegmentShellClass,
  laundryOffersTabSegmentShellClass,
  laundryPanelClass,
  laundryPanelDividerClass,
  laundryPanelSectionClass,
  laundryPaymentCtaClass,
  laundrySectionHeadingClass,
  laundrySubtitleClass,
} from "@/systems/laundry/lib/ui-tokens";
import type { LaundryOrder, LaundryOrderStatus, LaundryPackage, LaundryRepository } from "@/systems/laundry/laundry-service";
import { printLaundryOrderDocs } from "@/systems/laundry/lib/laundry-print-docs";
import { useLaundryShopPrintProfile } from "@/systems/laundry/lib/use-laundry-shop-print-profile";

type LaneTab = "pos" | "pickup";
type PackageFilter = "all" | "per_use" | "bulk";

function priceHint(pkg: LaundryPackage): string {
  if ((pkg.total_sessions ?? 1) > 1) {
    return `฿${pkg.base_price.toLocaleString("th-TH")} · ${pkg.total_sessions} ครั้ง`;
  }
  const tiers = pkg.basket_tiers?.filter((t) => t.label.trim()) ?? [];
  if (tiers.length) {
    const prices = tiers.map((t) => t.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? `฿${min.toLocaleString("th-TH")}` : `฿${min.toLocaleString("th-TH")} – ฿${max.toLocaleString("th-TH")}`;
  }
  return `฿${pkg.base_price.toLocaleString("th-TH")}`;
}

function packageKind(pkg: LaundryPackage): "per_use" | "bulk" {
  return (pkg.total_sessions ?? 1) > 1 ? "bulk" : "per_use";
}

function IconCheck(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={props.className} aria-hidden>
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LaundryOrdersPosClient({
  orders,
  packages,
  repo,
  recorderDisplayName,
  loading,
  refreshing,
  onRefresh,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onSaved,
  fixedLane,
  shopLabel,
  logoUrl,
}: {
  orders: LaundryOrder[];
  packages: LaundryPackage[];
  repo: LaundryRepository;
  recorderDisplayName: string;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  onViewOrder: (o: LaundryOrder) => void;
  onEditOrder: (o: LaundryOrder) => void;
  onDeleteOrder: (o: LaundryOrder) => void | Promise<void>;
  onStatusChange: (id: number, status: LaundryOrderStatus) => void | Promise<void>;
  onSaved: () => void | Promise<void>;
  /** ล็อกโหมด — ใช้จากเมนูย่อยแดชบอร์ด */
  fixedLane?: "pos" | "pickup";
  shopLabel?: string;
  logoUrl?: string | null;
}) {
  const { profile: shopPrint } = useLaundryShopPrintProfile({ shopLabel, logoUrl });
  const [printOrder, setPrintOrder] = useState<LaundryOrder | null>(null);
  const [printAfterSave, setPrintAfterSave] = useState(true);
  const [laneState, setLaneState] = useState<LaneTab>("pos");
  const lane = fixedLane ?? laneState;
  const [pkgFilter, setPkgFilter] = useState<PackageFilter>("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tierIndex, setTierIndex] = useState<number | null>(null);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<LaundryPaymentMethod>("CASH");
  const [slipUrl, setSlipUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [mobileCheckoutOpen, setMobileCheckoutOpen] = useState(false);

  const activePackages = useMemo(() => packages.filter((p) => p.is_active), [packages]);

  const filteredPackages = useMemo(() => {
    if (pkgFilter === "all") return activePackages;
    if (pkgFilter === "per_use") return activePackages.filter((p) => packageKind(p) === "per_use");
    return activePackages.filter((p) => packageKind(p) === "bulk");
  }, [activePackages, pkgFilter]);

  const selectedPkg = useMemo(
    () => (selectedId != null ? activePackages.find((p) => p.id === selectedId) ?? null : null),
    [activePackages, selectedId],
  );

  const tiers = selectedPkg?.basket_tiers?.filter((t) => t.label.trim()) ?? [];
  const isBulkSelected = selectedPkg != null && packageKind(selectedPkg) === "bulk";

  const resolvedPrice = useMemo(() => {
    if (!selectedPkg || isBulkSelected) return 0;
    if (tiers.length && tierIndex != null && tiers[tierIndex]) return tiers[tierIndex].price;
    return selectedPkg.base_price;
  }, [selectedPkg, tierIndex, tiers, isBulkSelected]);

  const walkInOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          !isLaundryOrderFromCustomerPickupPortal(o.recorded_by_name) &&
          o.status !== "COMPLETED" &&
          o.status !== "CANCELLED",
      ),
    [orders],
  );

  const pickupOrders = useMemo(() => {
    const rows = orders.filter(
      (o) =>
        isLaundryOrderFromCustomerPickupPortal(o.recorded_by_name) &&
        o.status !== "COMPLETED" &&
        o.status !== "CANCELLED",
    );
    return [...rows].sort((a, b) => {
      const aPending = a.status === "PENDING_PICKUP" ? 0 : 1;
      const bPending = b.status === "PENDING_PICKUP" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return new Date(b.order_at).getTime() - new Date(a.order_at).getTime();
    });
  }, [orders]);

  const resetSelection = useCallback(() => {
    setSelectedId(null);
    setTierIndex(null);
    setCustomerPhone("");
    setCustomerName("");
    setNote("");
    setPaymentMethod("CASH");
    setSlipUrl(null);
    setFormErr("");
  }, []);

  function selectPackage(p: LaundryPackage) {
    setSelectedId(p.id);
    const list = p.basket_tiers?.filter((t) => t.label.trim()) ?? [];
    setTierIndex(list.length > 0 ? 0 : null);
    setFormErr("");
  }

  async function submitWalkInOrder() {
    setFormErr("");
    if (!selectedPkg) {
      setFormErr("เลือกแพ็กเกจก่อน");
      return;
    }
    if (isBulkSelected) {
      setFormErr("แพ็กเหมาซัก — ขายที่แท็บ «สมาชิกแพ็ก» แล้วหักครั้งตอนรับผ้า");
      return;
    }
    const tier = tiers.length && tierIndex != null ? tiers[tierIndex] : null;
    const needsSlip = laundryPaymentShowsSlipUpload(paymentMethod, resolvedPrice);
    if (needsSlip && !slipUrl) {
      setFormErr("อัปโหลดสลิปก่อนบันทึก");
      return;
    }

    setSubmitting(true);
    try {
      const receiptImageUrl =
        paymentMethod === "CASH" || paymentMethod === "CREDIT_CARD" ? undefined : slipUrl ?? undefined;
      const created = await repo.createOrder({
        customer_name: customerName.trim() || "ลูกค้า",
        customer_phone: customerPhone.trim(),
        pickup_address: "หน้าร้าน",
        dropoff_address: "หน้าร้าน",
        service_type: tier ? `${selectedPkg.name} (${tier.label})` : selectedPkg.name,
        package_id: selectedPkg.id,
        package_name: selectedPkg.name,
        weight_kg: 0,
        item_count: 0,
        final_price: resolvedPrice,
        note: note.trim(),
        recorded_by_name: recorderDisplayName,
        status: "PICKED_UP",
        payment_method: paymentMethod,
        ...(receiptImageUrl ? { receipt_image_url: receiptImageUrl } : {}),
      });
      if (printAfterSave) {
        printLaundryOrderDocs({
          order: created,
          shop: shopPrint,
          receipt: created.final_price > 0,
          workTicket: true,
        });
      }
      resetSelection();
      setMobileCheckoutOpen(false);
      await onSaved();
    } catch (e) {
      setFormErr(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  const checkoutPanel = (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="rounded-2xl border border-[#ecebff] bg-gradient-to-br from-[#faf9ff] to-white p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">รายการที่เลือก</p>
        {selectedPkg ?
          <div className="mt-2 space-y-1">
            <p className="text-sm font-black text-[#1e1b4b]">{selectedPkg.name}</p>
            {isBulkSelected ?
              <p className="text-xs font-semibold text-amber-800">
                แพ็กเหมา {selectedPkg.total_sessions} ครั้ง — ขายที่แท็บ «สมาชิกแพ็ก»
              </p>
            : <>
                {tiers.length > 0 && tierIndex != null && tiers[tierIndex] ?
                  <p className="text-xs text-[#66638c]">{tiers[tierIndex].label}</p>
                : null}
                <p className="text-lg font-black tabular-nums text-[#4d47b6]">
                  ฿{resolvedPrice.toLocaleString("th-TH")}
                </p>
              </>
            }
          </div>
        : <p className="mt-2 text-sm text-[#66638c]">แตะการ์ดแพ็กเกจด้านขวา</p>}
      </div>

      {!isBulkSelected && selectedPkg ?
        <>
          <label className="block text-xs font-bold text-[#4d47b6]">
            เบอร์โทร
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              inputMode="tel"
              placeholder="0812345678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            ชื่อลูกค้า
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              placeholder="เช่น คุณสมชาย"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </label>
          <label className="block text-xs font-bold text-[#4d47b6]">
            หมายเหตุ
            <input
              className="app-input mt-1 w-full rounded-xl px-3 py-2.5 text-sm"
              placeholder="เช่น รีดด่วน"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          {resolvedPrice > 0 ?
            <LaundryPaymentPanel
              amountBaht={resolvedPrice}
              method={paymentMethod}
              slipUrl={slipUrl}
              onMethodChange={setPaymentMethod}
              onSlipUrlChange={setSlipUrl}
              disabled={submitting}
            />
          : null}

          {formErr ?
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{formErr}</p>
          : null}

          <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
              checked={printAfterSave}
              onChange={(e) => setPrintAfterSave(e.target.checked)}
            />
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#1e1b4b]">พิมพ์สลิปหลังบันทึก</span>
              <span className="block text-[11px] font-semibold text-[#66638c]">
                ใบเสร็จ{resolvedPrice > 0 ? "" : " (ข้ามถ้ายอด ฿0)"} + สลิปงาน · ขนาดตามตั้งค่าร้าน
              </span>
            </span>
          </label>

          <button
            type="button"
            disabled={submitting || !selectedPkg}
            onClick={() => void submitWalkInOrder()}
            className={cn(laundryPaymentCtaClass, "w-full justify-center disabled:opacity-60")}
          >
            {submitting ? "กำลังบันทึก…" : "บันทึกรับผ้าหน้าร้าน"}
          </button>
        </>
      : null}
    </div>
  );

  const packageGrid = (
    <div className="min-h-0 flex-1 space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="กรองประเภทแพ็ก">
        {(
          [
            { id: "all" as const, label: "ทั้งหมด" },
            { id: "per_use" as const, label: "รายครั้ง" },
            { id: "bulk" as const, label: "เหมาซัก" },
          ] as const
        ).map((chip) => (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={pkgFilter === chip.id}
            onClick={() => setPkgFilter(chip.id)}
            className={laundryDashboardSegmentBtnClass(pkgFilter === chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filteredPackages.length === 0 ?
        <AppEmptyState tone="violet">ยังไม่มีแพ็กในหมวดนี้ — ไปแท็บ «แพ็กเกจ» เพื่อเพิ่ม</AppEmptyState>
      : <div className="grid max-h-[min(58vh,560px)] grid-cols-2 gap-2 overflow-y-auto pb-1 sm:grid-cols-3 sm:gap-3 lg:max-h-none lg:overflow-visible xl:grid-cols-4">
          {filteredPackages.map((p) => {
            const selected = selectedId === p.id;
            const kind = packageKind(p);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPackage(p)}
                className={cn(
                  "relative flex flex-col overflow-hidden rounded-lg border text-left transition-all",
                  selected ?
                    "border-indigo-400 bg-indigo-50/80 ring-1 ring-indigo-200"
                  : "border-slate-200/90 bg-white shadow-sm hover:border-indigo-200",
                )}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-sky-50 to-indigo-100">
                  {p.image_url ?
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                  : <div className="flex h-full items-center justify-center text-indigo-300">
                      <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
                        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" strokeLinecap="round" />
                        <rect x="6" y="6" width="12" height="12" rx="2" />
                      </svg>
                    </div>
                  }
                  {selected ?
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-600/20">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
                        <IconCheck className="h-4 w-4" />
                      </div>
                    </div>
                  : null}
                  <span
                    className={cn(
                      "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] font-black",
                      kind === "bulk" ? "bg-amber-100 text-amber-900" : "bg-white/90 text-indigo-700",
                    )}
                  >
                    {kind === "bulk" ? "เหมา" : "รายครั้ง"}
                  </span>
                </div>
                <div className="space-y-0.5 p-2.5 sm:p-3">
                  <p className="line-clamp-2 text-xs font-black text-[#2e2a58] sm:text-sm">{p.name}</p>
                  <p className="text-[11px] font-bold text-indigo-600 sm:text-xs">{priceHint(p)}</p>
                </div>
              </button>
            );
          })}
        </div>
      }

      {selectedPkg && tiers.length > 0 && !isBulkSelected ?
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">ขนาดตะกร้า</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tiers.map((t, i) => (
              <button
                key={`${t.label}-${i}`}
                type="button"
                onClick={() => setTierIndex(i)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-xs font-bold transition-all",
                  tierIndex === i ?
                    "border-indigo-400 bg-white text-indigo-700 ring-1 ring-indigo-200"
                  : "border-transparent bg-white/70 text-[#2e2a58] hover:border-indigo-200",
                )}
              >
                <span className="block">{t.label}</span>
                <span className="text-[11px] font-black text-indigo-600">฿{t.price.toLocaleString("th-TH")}</span>
              </button>
            ))}
          </div>
        </div>
      : null}
    </div>
  );

  const headerTitle =
    fixedLane === "pickup" ? "คิวสั่งออนไลน์" : fixedLane === "pos" ? "ออเดอร์หน้าร้าน" : "ออเดอร์";
  const headerDesc =
    fixedLane === "pickup" ? "คำขอจากลิงก์ลูกค้า" : fixedLane === "pos" ? "เลือกแพ็ก · ชำระเงิน" : undefined;

  return (
    <div className={cn(laundryPanelClass, "min-w-0")}>
      <div className={laundryPanelSectionClass}>
        <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-3">
          <div className="min-w-0 shrink">
            <h2 className="truncate text-base font-bold text-[#1e1b4b] sm:text-lg">{headerTitle}</h2>
            {headerDesc ?
              <p className={laundrySubtitleClass}>{headerDesc}</p>
            : null}
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            {fixedLane ? <LaundryDashboardHeaderToolbar /> : null}
            <button
              type="button"
              onClick={() => void onRefresh()}
              disabled={refreshing}
              aria-busy={refreshing}
              aria-label={refreshing ? "กำลังรีเฟรชออเดอร์" : "รีเฟรชออเดอร์"}
              title="รีเฟรช"
              className={cn(
                appTemplateOutlineButtonClass,
                "inline-flex h-7 w-7 min-h-7 min-w-7 shrink-0 items-center justify-center p-0 sm:h-8 sm:w-8 sm:min-h-8 sm:min-w-8",
              )}
            >
              <svg
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                aria-hidden
              >
                <path d="M20 11a8 8 0 1 0 2.3 5.6M20 4v7h-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

      {!fixedLane ?
        <div className={cn(laundryOffersTabSegmentShellClass, "mt-3 w-full")}>
          <div className={cn(laundryDashboardSegmentShellClass, "w-full")} role="tablist" aria-label="ประเภทออเดอร์">
            <button
              type="button"
              role="tab"
              aria-selected={lane === "pos"}
              onClick={() => setLaneState("pos")}
              className={cn(laundryDashboardSegmentBtnClass(lane === "pos"), "flex-1 sm:flex-initial sm:px-4")}
            >
              หน้าร้าน (POS)
              {walkInOrders.length > 0 ?
                <span className="ml-1 rounded-full bg-indigo-600/15 px-1.5 py-0.5 text-[10px] tabular-nums">{walkInOrders.length}</span>
              : null}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={lane === "pickup"}
              onClick={() => setLaneState("pickup")}
              className={cn(laundryDashboardSegmentBtnClass(lane === "pickup"), "flex-1 sm:flex-initial sm:px-4")}
            >
              คิวรับที่บ้าน
              {pickupOrders.length > 0 ?
                <span className="ml-1 rounded-full bg-sky-600/15 px-1.5 py-0.5 text-[10px] tabular-nums text-sky-900">
                  {pickupOrders.length}
                </span>
              : null}
            </button>
          </div>
        </div>
      : null}
      </div>

      {lane === "pos" ?
        <div className={cn(laundryPanelSectionClass, laundryPanelDividerClass)}>
          <div className="grid min-h-0 gap-0 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] lg:divide-x lg:divide-slate-200/80">
            <aside className="hidden min-h-0 flex-col p-4 lg:flex lg:max-h-[calc(100vh-18rem)] lg:overflow-y-auto">
              <p className={cn(laundrySectionHeadingClass, "mb-3")}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                รับผ้าหน้าร้าน
              </p>
              {checkoutPanel}
            </aside>

            <section className="min-w-0 p-4">
              <p className={cn(laundrySectionHeadingClass, "mb-3 lg:hidden")}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
                เลือกแพ็กเกจ
              </p>
              {packageGrid}
            </section>
          </div>

          {/* มือถือ — แถบล่างเมื่อเลือกแพ็กแล้ว */}
          {selectedPkg && !isBulkSelected ?
            <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 px-3 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileCheckoutOpen(true)}
                className={cn(
                  laundryPaymentCtaClass,
                  "flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 shadow-lg",
                )}
              >
                <span className="truncate text-left text-sm font-bold">{selectedPkg.name}</span>
                <span className="shrink-0 font-black tabular-nums">฿{resolvedPrice.toLocaleString("th-TH")} →</span>
              </button>
            </div>
          : null}

          <div className={cn("space-y-3", laundryPanelDividerClass, "border-t pt-4")}>
            <h3 className={laundrySectionHeadingClass}>
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              </svg>
              งานหน้าร้านค้าง ({walkInOrders.length})
            </h3>
            {loading ?
              <p className="text-xs text-[#66638c]">กำลังโหลด…</p>
            : walkInOrders.length === 0 ?
              <AppEmptyState tone="violet">ยังไม่มีงานหน้าร้านค้าง — รับผ้าจาก POS ด้านบน</AppEmptyState>
            : <ul className={laundryOrderCardListGridClass}>
                {walkInOrders.map((o) => (
                  <li key={o.id} className="min-h-0 min-w-0">
                    <LaundryOrderCard
                      order={o}
                      tone="violet"
                      showStatusSelect
                      onView={() => onViewOrder(o)}
                      onEdit={() => onEditOrder(o)}
                      onDelete={() => void onDeleteOrder(o)}
                      onPrint={() => setPrintOrder(o)}
                      onStatusChange={onStatusChange}
                    />
                  </li>
                ))}
              </ul>
            }
          </div>
        </div>
      : null}

      {lane === "pickup" ?
        <div className={cn(laundryPanelSectionClass, laundryPanelDividerClass)}>
          {loading ?
            <p className="text-xs text-[#66638c]">กำลังโหลด…</p>
          : pickupOrders.length === 0 ?
            <AppEmptyState tone="violet">ไม่มีคิวรับที่บ้านค้าง — แชร์ลิงก์ลูกค้าใน ตั้งค่า → ลิงก์ QR</AppEmptyState>
          : <ul className={laundryOrderCardListGridClass}>
              {pickupOrders.map((o) => (
                <li key={o.id} className="min-h-0 min-w-0">
                  <LaundryOrderCard
                    order={o}
                    tone="slate"
                    showStatusSelect
                    showOrderedAt
                    onView={() => onViewOrder(o)}
                    onEdit={() => onEditOrder(o)}
                    onDelete={() => void onDeleteOrder(o)}
                    onPrint={() => setPrintOrder(o)}
                    onStatusChange={onStatusChange}
                  />
                </li>
              ))}
            </ul>
          }
        </div>
      : null}

      <LaundryOrderPrintModal
        open={Boolean(printOrder)}
        order={printOrder}
        shop={shopPrint}
        onClose={() => setPrintOrder(null)}
      />

      <FormModal
        open={mobileCheckoutOpen}
        onClose={() => setMobileCheckoutOpen(false)}
        title="รับผ้าหน้าร้าน"
        size="lg"
        mobileCentered
        footer={
          <div className="flex w-full gap-2">
            <button type="button" onClick={() => setMobileCheckoutOpen(false)} className={appTemplateOutlineButtonClass}>
              ปิด
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void submitWalkInOrder()}
              className={cn(laundryPaymentCtaClass, "flex-1 justify-center disabled:opacity-60")}
            >
              {submitting ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        }
      >
        {checkoutPanel}
      </FormModal>
    </div>
  );
}
