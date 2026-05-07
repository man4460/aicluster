"use client";

import { cn } from "@/lib/cn";
import { laundryDashboardCardDividerClasses } from "@/systems/laundry/laundry-dashboard-card-dividers";
import { laundryOrderCardToneClasses } from "@/systems/laundry/laundry-order-card-tone";
import { laundryOrderCardPackageLines } from "@/systems/laundry/laundry-order-package-lines";
import { isLaundryOrderFromCustomerPickupPortal } from "@/systems/laundry/laundry-customer-pickup-request";
import { laundryOrderStatusLabelTh, type LaundryOrder, type LaundryOrderStatus } from "@/systems/laundry/laundry-service";
import { LaundryOrderStatusIconStrip } from "@/systems/laundry/components/LaundryOrderStatusIconStrip";
import {
  LaundryIconEye,
  LaundryIconPencil,
  LaundryIconTrash,
  LaundryToolbarIconButton,
} from "@/systems/laundry/components/LaundryToolbarIconButton";

function isPlaceholderAddress(raw: string | null | undefined): boolean {
  const t = raw?.trim() ?? "";
  return t === "" || t === "-" || t === "–" || t === "—";
}

function isGenericCustomerName(raw: string | null | undefined): boolean {
  const t = raw?.trim() ?? "";
  return t === "" || t === "ลูกค้า";
}

export function LaundryOrderCard({
  order: o,
  tone,
  showStatusSelect,
  showOrderedAt,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  order: LaundryOrder;
  /** ใช้คั่นคอลัมน์ขวาให้เข้ากับพื้นหลังแผง (ม่วง vs เทา) */
  tone: "violet" | "slate";
  showStatusSelect: boolean;
  /** แสดงเวลารับงาน — แท็บการเงิน / ประวัติรายรับ */
  showOrderedAt?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (id: number, status: LaundryOrderStatus) => void | Promise<void>;
}) {
  const tc = laundryOrderCardToneClasses(o.status);
  const { main: pkgMain, sub: pkgSub } = laundryOrderCardPackageLines(o.package_name, o.service_type);
  const phoneDigits = o.customer_phone?.replace(/\D/g, "") ?? "";
  const showPhone = phoneDigits.length > 0;
  const custNameRaw = o.customer_name?.trim() ?? "";
  const showCustomerName = !isGenericCustomerName(custNameRaw);
  const showWeight = o.weight_kg > 0;
  const showItemCount = o.item_count > 0;
  const showSizeRow = showWeight || showItemCount;
  const pickupRaw = o.pickup_address?.trim() ?? "";
  const dropoffRaw = o.dropoff_address?.trim() ?? "";
  const showPickup = !isPlaceholderAddress(pickupRaw);
  const showDropoff = !isPlaceholderAddress(dropoffRaw);
  const showAddressBlock = showPickup || showDropoff;
  const { dividerStrong, dimHorizontalStripRidge } = laundryDashboardCardDividerClasses(tone);
  const metaMuted = tone === "violet" ? "text-[#5c5788]" : "text-slate-500";
  const addrClass = tone === "violet" ? "text-[#66638c]/95" : "text-slate-500";
  const fromCustomerPickup = isLaundryOrderFromCustomerPickupPortal(o.recorded_by_name);

  return (
    <article
      className={cn(
        "group/item relative flex w-full flex-col overflow-hidden rounded-lg border-2 p-2 text-left shadow-sm ring-1 transition-all duration-300 hover:shadow-md sm:rounded-2xl sm:p-4",
        tc.border,
        tc.bg,
        tc.ring,
        tc.hoverBorder,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-gradient-to-b opacity-85 transition-all duration-300 group-hover/item:w-1.5",
          tc.ribbonGradient,
        )}
      />

      <div className="relative flex gap-2 sm:gap-4">
        {/* ซ้าย: แพ็กเกจ · ขนาด · เบอร์ · ชื่อ · ที่อยู่ย่อ */}
        <div className="min-w-0 flex-1 space-y-1.5 pl-0.5 sm:space-y-2 sm:pl-1.5">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#66638c] sm:text-[10px] sm:tracking-[0.14em]">
              แพ็กเกจ
            </p>
            <p className="mt-0.5 truncate bg-gradient-to-r from-[#4338ca] to-[#6366f1] bg-clip-text text-sm font-bold leading-snug text-transparent sm:text-lg">
              {pkgMain}
            </p>
            {pkgSub ?
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#4d47b6]/90 sm:text-[11px]">{pkgSub}</p>
            : null}
            {fromCustomerPickup ?
              <p className="mt-1.5">
                <span
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold leading-tight sm:text-[10px]",
                    tone === "violet" ?
                      "border-sky-300/90 bg-sky-50 text-sky-950"
                    : "border-sky-200 bg-sky-50/95 text-sky-950",
                  )}
                  title="ลูกค้าส่งคำขอรับผ้าที่บ้านผ่านลิงก์ — ไม่ใช่การบันทึกในร้าน"
                >
                  <span aria-hidden className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span className="truncate">คำขอรับผ้าจากลูกค้า (QR)</span>
                </span>
              </p>
            : null}
          </div>

          {showSizeRow ?
            <p className="flex max-w-full flex-row flex-wrap items-baseline gap-x-1 gap-y-0.5 text-[10px] leading-snug sm:gap-x-1.5 sm:text-xs">
              <span className="text-[9px] font-bold uppercase tracking-wide text-[#66638c] sm:text-[10px]">ขนาด</span>
              {showWeight ?
                <span className="font-black tabular-nums text-[#2e2a58]">{o.weight_kg} กก.</span>
              : null}
              {showWeight && showItemCount ?
                <span className="text-[10px] font-semibold text-slate-400">·</span>
              : null}
              {showItemCount ?
                <span className="font-black tabular-nums text-[#2e2a58]">{o.item_count} ชิ้น</span>
              : null}
            </p>
          : null}

          {showPhone || showCustomerName ?
            <div className="space-y-px sm:space-y-0.5">
              {showPhone ?
                <p className="text-xs font-bold tabular-nums tracking-tight text-[#2e2a58] sm:text-sm">{o.customer_phone.trim()}</p>
              : null}
              {showCustomerName ?
                <p className={cn("truncate text-[10px] font-semibold sm:text-xs", metaMuted)}>{custNameRaw}</p>
              : null}
            </div>
          : null}

          {showOrderedAt ?
            <>
              <p className={cn("hidden text-[11px] tabular-nums sm:block", addrClass)}>
                {new Date(o.order_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
              </p>
              <p className={cn("text-[10px] tabular-nums sm:hidden", addrClass)}>
                {new Date(o.order_at).toLocaleString("th-TH", {
                  timeZone: "Asia/Bangkok",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </>
          : null}

          {showAddressBlock ?
            <div className={cn("space-y-px text-[10px] leading-snug sm:space-y-0.5 sm:text-[11px]", addrClass)}>
              {showPickup ?
                <p className="line-clamp-1 sm:line-clamp-2">
                  <span className="font-semibold text-[#4d47b6]/85">รับ</span> {pickupRaw}
                </p>
              : null}
              {showDropoff ?
                <p className="line-clamp-1 sm:line-clamp-2">
                  <span className="font-semibold text-[#4d47b6]/85">ส่ง</span> {dropoffRaw}
                </p>
              : null}
            </div>
          : null}
        </div>

        {/* ขวา: สถานะ · เลขที่ · ราคา · ปุ่ม */}
        <div className="flex min-w-[5.75rem] w-[30%] max-w-[8rem] shrink-0 flex-col pt-0.5 pl-2 sm:min-w-[9rem] sm:w-[9rem] sm:max-w-none sm:pl-3">
          <div className="flex flex-col items-end gap-0.5 pb-2 text-right sm:gap-1 sm:pb-3">
            <span className={cn("max-w-full truncate text-right text-[9px] sm:text-[10px]", tc.badge)}>
              {laundryOrderStatusLabelTh(o.status)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-[#66638c] sm:text-[10px]">#{o.id}</span>
            <p className="text-sm font-black tabular-nums text-emerald-700 sm:text-lg">
              ฿{o.final_price.toLocaleString("th-TH")}
            </p>
          </div>

          <div className="mt-auto flex flex-row flex-nowrap items-center justify-end gap-0.5 pt-2 sm:gap-1 sm:pt-3">
            <LaundryToolbarIconButton label="ดูข้อมูล" onClick={onView}>
              <LaundryIconEye />
            </LaundryToolbarIconButton>
            <LaundryToolbarIconButton label="แก้ไข" onClick={onEdit}>
              <LaundryIconPencil />
            </LaundryToolbarIconButton>
            <LaundryToolbarIconButton label="ลบรายการ" variant="danger" onClick={onDelete}>
              <LaundryIconTrash />
            </LaundryToolbarIconButton>
          </div>
        </div>
      </div>

      {showStatusSelect ?
        <div
          className={cn(
            "relative mt-3 rounded-b-lg border-t-2 pt-3 sm:mt-4 sm:pt-4",
            dividerStrong,
            dimHorizontalStripRidge,
          )}
        >
          <p className="mb-1.5 hidden text-[10px] font-bold uppercase tracking-[0.12em] text-[#66638c] sm:mb-2 sm:block">
            อัปเดตสถานะ
          </p>
          <LaundryOrderStatusIconStrip
            orderId={o.id}
            current={o.status}
            tone={tone}
            onSelect={(s) => void onStatusChange(o.id, s)}
          />
        </div>
      : null}
    </article>
  );
}
