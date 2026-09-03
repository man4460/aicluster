"use client";

import { useState, type FormEvent } from "react";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { LaundryPortalSection } from "@/systems/laundry/components/LaundryPortalSection";
import { isTerminalLaundryOrderStatus } from "@/systems/laundry/laundry-order-status";
import {
  laundryCompactOutlineButtonClass,
  laundryPortalFieldClass,
  laundryPortalPrimaryBtnClass,
  laundryPortalSectionDividerClass,
} from "@/systems/laundry/lib/ui-tokens";

type LookupOrder = {
  order_id: number;
  customer_name: string;
  order_at: string;
  updated_at: string;
  status: string;
  status_label_th: string;
  service_type: string;
  package_name: string;
  final_price: number;
  tracking_token: string | null;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

export function LaundryPortalStatusLookup({
  ownerId,
  trialSessionId,
  className,
}: {
  ownerId: string;
  trialSessionId: string;
  className?: string;
}) {
  const notice = useAppNoticePopup();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<LookupOrder[] | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = phone.trim();
    if (trimmed.length < 9) {
      notice.warning("กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const t = trialSessionId && trialSessionId !== "prod" ? `&t=${encodeURIComponent(trialSessionId)}` : "";
      const res = await fetch(
        `/api/laundry/public/pickup-lookup?owner_id=${encodeURIComponent(ownerId)}&phone=${encodeURIComponent(trimmed)}${t}`,
      );
      const data = (await res.json()) as { ok?: boolean; orders?: LookupOrder[]; error?: string };
      if (!res.ok) {
        notice.error(data.error ?? "ค้นหาไม่สำเร็จ");
        setOrders([]);
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      notice.error("เชื่อมต่อไม่ได้");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LaundryPortalSection
      id="status"
      title="ติดตามสถานะ"
      titleId="laundry-portal-status-title"
      className={className}
      bodyClassName="space-y-5"
    >
      {notice.popup}
      <form
        onSubmit={(e) => void handleSearch(e)}
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <label className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-bold text-[#4d47b6]">เบอร์โทร</span>
          <input
            required
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0812345678"
            autoComplete="tel"
            className={laundryPortalFieldClass}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className={cn(laundryPortalPrimaryBtnClass, "sm:min-w-[8rem]")}
        >
          {loading ? "กำลังค้นหา…" : "ค้นหา"}
        </button>
      </form>

      {searched ?
        <div className={cn(laundryPortalSectionDividerClass, "space-y-0 pt-5")}>
          {orders == null || loading ?
            null
          : orders.length === 0 ?
            <p className="text-sm font-semibold text-[#66638c]">ไม่พบคำขอรับ-ส่งจากเบอร์นี้</p>
          : <ul className="divide-y divide-slate-200/80">
              {orders.map((row) => {
                const done = isTerminalLaundryOrderStatus(row.status);
                return (
                  <li key={row.order_id} className="flex flex-col gap-2 py-4 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#66638c]">
                        #{row.order_id}
                        {row.customer_name?.trim() ? ` · ${row.customer_name.trim()}` : ""}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-base font-black leading-snug",
                          done ? "text-slate-600" : "text-[#4d47b6]",
                        )}
                      >
                        {row.status_label_th}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[#66638c]">
                        {(row.package_name?.trim() || row.service_type?.trim() || "—") +
                          (row.final_price > 0 ? ` · ฿${row.final_price.toLocaleString("th-TH")}` : "")}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">อัปเดต {formatWhen(row.updated_at)}</p>
                    </div>
                    {row.tracking_token ?
                      <button
                        type="button"
                        className={cn(laundryCompactOutlineButtonClass, "shrink-0 self-start")}
                        onClick={() => {
                          const url = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(row.tracking_token!)}`;
                          void navigator.clipboard.writeText(url).then(
                            () => notice.success("คัดลอกลิงก์ติดตามแล้ว"),
                            () => notice.warning("คัดลอกลิงก์ไม่สำเร็จ"),
                          );
                        }}
                      >
                        คัดลอกลิงก์
                      </button>
                    : null}
                  </li>
                );
              })}
            </ul>
          }
        </div>
      : null}
    </LaundryPortalSection>
  );
}
