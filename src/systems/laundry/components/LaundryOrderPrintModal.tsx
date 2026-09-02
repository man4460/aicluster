"use client";

import { useEffect, useState } from "react";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  printLaundryOrderDocs,
  type LaundryPrintShopProfile,
} from "@/systems/laundry/lib/laundry-print-docs";
import type { LaundryOrder } from "@/systems/laundry/laundry-service";
import { laundryCardSurfaceRadiusClass } from "@/systems/laundry/lib/ui-tokens";

type Props = {
  open: boolean;
  order: LaundryOrder | null;
  shop: LaundryPrintShopProfile | null;
  onClose: () => void;
};

export function LaundryOrderPrintModal({ open, order, shop, onClose }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [printWorkTicket, setPrintWorkTicket] = useState(true);

  useEffect(() => {
    if (!open || !order) {
      setError(null);
      setInfo(null);
      return;
    }
    setPrintReceipt(order.final_price > 0);
    setPrintWorkTicket(true);
    setError(null);
    setInfo(null);
  }, [open, order]);

  function onPrint() {
    if (!order) return;
    setError(null);
    setInfo(null);
    if (!printReceipt && !printWorkTicket) {
      setError("เลือกอย่างน้อยหนึ่งเอกสาร");
      return;
    }
    if (printReceipt && !(order.final_price > 0)) {
      setError("ออเดอร์นี้มียอด ฿0 — ไม่พิมพ์ใบเสร็จได้");
      return;
    }
    printLaundryOrderDocs({
      order,
      shop: shop ?? { displayName: "รับฝากซักผ้า", slipPaperSize: "SLIP_58" },
      receipt: printReceipt,
      workTicket: printWorkTicket,
    });
    setInfo(
      printReceipt && printWorkTicket
        ? "ส่งพิมพ์ใบเสร็จและสลิปงานแล้ว"
        : printWorkTicket
          ? "ส่งพิมพ์สลิปงานแล้ว"
          : "ส่งพิมพ์ใบเสร็จแล้ว",
    );
  }

  return (
    <FormModal
      open={open && Boolean(order)}
      onClose={onClose}
      title="พิมพ์สลิป"
      appearance="glass"
      glassTint="violet"
      size="md"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          cancelLabel="ปิด"
          onSubmit={onPrint}
          submitLabel="พิมพ์"
          submitDisabled={!order}
        />
      }
    >
      {order ?
        <div className="space-y-4">
          <div className={cn("border border-[#ecebff] bg-[#faf9ff]/90 px-3 py-3", laundryCardSurfaceRadiusClass)}>
            <p className="text-sm font-black text-[#1e1b4b]">#{order.id} · {orderLineLabel(order)}</p>
            <p className="mt-1 text-xs font-semibold text-[#66638c]">
              {order.customer_phone?.trim() || "—"}
              {order.customer_name?.trim() && order.customer_name.trim() !== "ลูกค้า" ?
                ` · ${order.customer_name.trim()}`
              : ""}
            </p>
            <p className="mt-2 text-sm font-black tabular-nums text-emerald-700">
              ฿{order.final_price.toLocaleString("th-TH")}
            </p>
          </div>

          <div className="space-y-2">
            <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                checked={printReceipt}
                disabled={!(order.final_price > 0)}
                onChange={(e) => setPrintReceipt(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-black text-[#1e1b4b]">ใบเสร็จรับเงิน</span>
                <span className="block text-[11px] font-semibold text-[#66638c]">
                  {order.final_price > 0 ? "มีราคา · ขนาดตามตั้งค่าร้าน" : "ยอด ฿0 — ไม่พิมพ์ใบเสร็จ"}
                </span>
              </span>
            </label>
            <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#5b61ff] focus:ring-[#5b61ff]"
                checked={printWorkTicket}
                onChange={(e) => setPrintWorkTicket(e.target.checked)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-black text-[#1e1b4b]">สลิปงาน (ติดถุง)</span>
                <span className="block text-[11px] font-semibold text-[#66638c]">แบบสลิปครัว POS · ไม่เน้นราคา</span>
              </span>
            </label>
          </div>

          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}
          {info ? <p className="text-sm font-semibold text-emerald-700">{info}</p> : null}
        </div>
      : null}
    </FormModal>
  );
}

function orderLineLabel(order: LaundryOrder) {
  const svc = order.service_type?.trim();
  if (svc) return svc;
  return order.package_name?.trim() || "บริการซักผ้า";
}
