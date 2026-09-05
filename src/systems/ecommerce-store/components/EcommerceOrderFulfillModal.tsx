"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppImageLightbox,
  AppImageThumb,
  useAppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { ECOMMERCE_ORDER_STATUS_LABELS } from "@/lib/ecommerce/constants";
import {
  printEcommerceOrderReceipt,
  printEcommerceOrderTaxInvoice,
  printEcommerceShippingLabel,
  type EcommerceOrderPrintShop,
} from "@/systems/ecommerce-store/lib/ecommerce-order-print";
import {
  ecommerceStoreFieldClass,
  ecommerceStoreOutlineButtonClass,
} from "@/systems/ecommerce-store/lib/ui-tokens";
import { ecommerceOrderStatusBadgeClass } from "@/systems/ecommerce-store/components/ecommerce-ui-tokens";

export type EcommerceFulfillOrder = {
  id: string;
  referenceCode: string;
  trackingCode: string;
  courierTrackingNo?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  totalAmount: string;
  paymentSlipUrl: string | null;
  paymentMethod?: string | null;
  status: "PENDING_SLIP" | "VERIFYING" | "PREPARING" | "SHIPPED";
  createdAt?: string;
  items?: {
    id: string;
    productName: string;
    quantity: number;
    unitPriceBaht: string;
    imageUrl?: string | null;
  }[];
};

type Props = {
  open: boolean;
  order: EcommerceFulfillOrder | null;
  shop: EcommerceOrderPrintShop | null;
  busy?: boolean;
  onClose: () => void;
  onShip: (courierTrackingNo: string) => Promise<void> | void;
};

/** หัวข้อส่วน — flat ไม่ห่อกล่อง */
const sectionLabelClass = "text-xs font-bold text-[#4d47b6]";
const sectionDividerClass = "border-t border-slate-200/80 pt-3";

export function EcommerceOrderFulfillModal({
  open,
  order,
  shop,
  busy,
  onClose,
  onShip,
}: Props) {
  const lb = useAppImageLightbox();
  const [courierNo, setCourierNo] = useState("");
  const [packed, setPacked] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !order) {
      setCourierNo("");
      setPacked(false);
      setErr(null);
      setInfo(null);
      return;
    }
    setCourierNo(order.courierTrackingNo?.trim() || "");
    setPacked(Boolean(order.courierTrackingNo?.trim()));
    setErr(null);
    setInfo(null);
  }, [open, order]);

  const amount = useMemo(() => Number(order?.totalAmount ?? 0), [order?.totalAmount]);
  const items = order?.items ?? [];

  function printOrder() {
    if (!order) return null;
    return {
      referenceCode: order.referenceCode,
      trackingCode: order.trackingCode,
      courierTrackingNo: courierNo.trim() || order.courierTrackingNo,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      items: items.map((it) => ({
        productName: it.productName,
        quantity: it.quantity,
        unitPriceBaht: it.unitPriceBaht,
      })),
    };
  }

  async function confirmShip() {
    if (!order) return;
    const tracking = courierNo.trim();
    if (tracking.length < 4) {
      setErr("กรอกเลขพัสดุขนส่งอย่างน้อย 4 ตัวอักษร");
      return;
    }
    if (!packed && order.status !== "SHIPPED") {
      setErr("ติ๊กยืนยันว่าแพ็คใส่กล่องเรียบร้อยแล้ว");
      return;
    }
    setErr(null);
    await onShip(tracking);
  }

  return (
    <>
      <FormModal
        open={open && Boolean(order)}
        onClose={onClose}
        title="จัดของ · แพ็ค · จัดส่ง"
        appearance="default"
        size="lg"
        mobileCentered
        footer={
          <FormModalFooterActions
            onCancel={onClose}
            cancelLabel="ปิด"
            onSubmit={() => void confirmShip()}
            submitLabel={
              busy
                ? "กำลังบันทึก…"
                : order?.status === "SHIPPED"
                  ? "บันทึกเลขพัสดุ"
                  : "จัดส่งแล้ว"
            }
            submitDisabled={busy || !order}
          />
        }
      >
        {order ? (
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3">
              {order.paymentSlipUrl ? (
                <AppImageThumb
                  src={order.paymentSlipUrl}
                  alt={`สลิป ${order.referenceCode}`}
                  onOpen={() => lb.open(order.paymentSlipUrl!)}
                  className="h-16 w-16 shrink-0"
                />
              ) : items[0]?.imageUrl ? (
                <AppImageThumb
                  src={items[0].imageUrl}
                  alt={items[0].productName}
                  onOpen={() => lb.open(items[0].imageUrl!)}
                  className="h-16 w-16 shrink-0"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 text-sm font-black text-[#4d47b6]">
                  {order.referenceCode.slice(-4)}
                </span>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-base font-black text-[#1e1b4b]">{order.referenceCode}</p>
                  <span className={ecommerceOrderStatusBadgeClass(order.status)}>
                    {ECOMMERCE_ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#2e2a58]">{order.customerName}</p>
                <p className="text-xs font-semibold text-[#66638c]">
                  โทร. {order.customerPhone} · ติดตามร้าน {order.trackingCode}
                </p>
                <p className="text-lg font-black tabular-nums text-emerald-700">
                  ฿{amount.toLocaleString("th-TH")}
                </p>
              </div>
            </div>

            <div className={cn(sectionDividerClass, "space-y-1.5")}>
              <p className={sectionLabelClass}>ที่อยู่จัดส่ง</p>
              <p className="whitespace-pre-wrap text-sm font-semibold text-[#1e1b4b]">
                {order.customerAddress?.trim() || "— ลูกค้าไม่ได้ระบุที่อยู่ —"}
              </p>
            </div>

            <div className={cn(sectionDividerClass, "space-y-2")}>
              <p className={sectionLabelClass}>รายการสินค้า</p>
              <ul className="divide-y divide-slate-200/80">
                {items.length === 0 ? (
                  <li className="py-1 text-sm text-[#66638c]">ไม่มีรายการสินค้า</li>
                ) : (
                  items.map((it) => (
                    <li key={it.id} className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0">
                      {it.imageUrl ? (
                        <AppImageThumb
                          src={it.imageUrl}
                          alt={it.productName}
                          onOpen={() => lb.open(it.imageUrl!)}
                          className="h-11 w-11 shrink-0"
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50 text-[10px] font-bold text-slate-500">
                          —
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#1e1b4b]">{it.productName}</p>
                        <p className="text-[11px] font-semibold text-[#66638c]">
                          × {it.quantity} · ฿{Number(it.unitPriceBaht).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className={cn(sectionDividerClass, "space-y-2")}>
              <p className={sectionLabelClass}>พิมพ์เอกสาร</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={ecommerceStoreOutlineButtonClass}
                  onClick={() => {
                    const data = printOrder();
                    if (!data) return;
                    printEcommerceShippingLabel(data, shop);
                    setInfo("ส่งพิมพ์ฉลากแล้ว");
                  }}
                >
                  พิมพ์ฉลาก
                </button>
                <button
                  type="button"
                  className={ecommerceStoreOutlineButtonClass}
                  onClick={() => {
                    const data = printOrder();
                    if (!data) return;
                    printEcommerceOrderReceipt(data, shop);
                    setInfo("ส่งพิมพ์สลิป/ใบเสร็จแล้ว");
                  }}
                >
                  พิมพ์สลิป
                </button>
                <button
                  type="button"
                  className={ecommerceStoreOutlineButtonClass}
                  onClick={() => {
                    const data = printOrder();
                    if (!data) return;
                    printEcommerceOrderTaxInvoice(data, shop);
                    setInfo("ส่งพิมพ์ใบกำกับภาษีแล้ว");
                  }}
                >
                  พิมพ์ใบกำกับ
                </button>
              </div>
            </div>

            <label
              className={cn(
                sectionDividerClass,
                "flex items-start gap-2 text-sm font-semibold text-[#1e1b4b]",
              )}
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={packed}
                onChange={(e) => setPacked(e.target.checked)}
              />
              <span>แพ็คใส่กล่องเรียบร้อยแล้ว พร้อมติดฉลากและจัดส่ง</span>
            </label>

            <div className={cn(sectionDividerClass, "space-y-1.5")}>
              <label className="block space-y-1.5">
                <span className={sectionLabelClass}>เลขพัสดุขนส่ง</span>
                <input
                  className={cn(ecommerceStoreFieldClass, "min-h-[44px]")}
                  value={courierNo}
                  onChange={(e) => setCourierNo(e.target.value)}
                  placeholder="เช่น Kerry / Flash / ไปรษณีย์"
                  autoComplete="off"
                  disabled={busy}
                />
              </label>
              <p className="text-[11px] font-medium text-[#66638c]">
                กรอกเลขพัสดุจากบริษัทขนส่ง แล้วกด «จัดส่งแล้ว»
              </p>
            </div>

            {err ? <p className="text-sm font-semibold text-rose-700">{err}</p> : null}
            {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}

            <p className={cn("text-[11px] text-[#66638c]", busy && "opacity-60")}>
              ลำดับแนะนำ: ดูข้อมูล → พิมพ์ฉลาก/สลิป/ใบกำกับ → แพ็คกล่อง → กรอกเลขพัสดุ → จัดส่ง
            </p>
          </div>
        ) : null}
      </FormModal>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปออเดอร์" />
    </>
  );
}
