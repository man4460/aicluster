"use client";

import { FormModal } from "@/components/ui/FormModal";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import type { LaundryOrder } from "@/systems/laundry/laundry-service";
import {
  printLaundryOrderDocs,
  type LaundryPrintShopProfile,
} from "@/systems/laundry/lib/laundry-print-docs";
import { laundryPaymentCtaClass } from "@/systems/laundry/lib/ui-tokens";

export function LaundryOrderPrintModal({
  open,
  order,
  shop,
  onClose,
}: {
  open: boolean;
  order: LaundryOrder | null;
  shop: LaundryPrintShopProfile;
  onClose: () => void;
}) {
  if (!order) return null;
  const price = Math.max(0, Math.round(order.final_price ?? 0));

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="พิมพ์เอกสาร"
      footer={
        <div className="flex w-full flex-wrap gap-2">
          <button type="button" onClick={onClose} className={appTemplateOutlineButtonClass}>
            ปิด
          </button>
          {price > 0 ?
            <button
              type="button"
              className={laundryPaymentCtaClass}
              onClick={() =>
                printLaundryOrderDocs({ order, shop, receipt: true, workTicket: false })
              }
            >
              พิมพ์ใบเสร็จ
            </button>
          : null}
          <button
            type="button"
            className={laundryPaymentCtaClass}
            onClick={() => printLaundryOrderDocs({ order, shop, receipt: false, workTicket: true })}
          >
            พิมพ์สลิปงาน
          </button>
        </div>
      }
    >
      <p className="text-sm text-[#66638c]">
        {order.customer_name} · {order.service_type || order.package_name || "รายการซักผ้า"}
      </p>
    </FormModal>
  );
}
