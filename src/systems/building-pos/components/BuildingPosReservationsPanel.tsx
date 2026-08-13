"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { bangkokDateKey } from "@/lib/time/bangkok";
import type { BuildingPosPortalCartItem } from "@/lib/building-pos/portal-booking";
import {
  buildingPosChipActiveClass,
  buildingPosChipIdleClass,
  buildingPosListRowCardClass,
} from "@/systems/building-pos/components/building-pos-ui-tokens";

type ReservationRow = {
  id: string;
  customerName: string;
  phone: string;
  partySize: number;
  visitDateKey: string;
  visitTimeHm: string;
  items: BuildingPosPortalCartItem[];
  itemsTotalBaht: number;
  payDueBaht: number;
  amountPaidBaht: number;
  paymentSlipUrl: string | null;
  status: string;
  linkedOrderId: number | null;
  note: string | null;
};

const STATUS_FILTERS = [
  { id: "all", label: "ทั้งหมด" },
  { id: "SCHEDULED", label: "จอง" },
  { id: "ARRIVED", label: "มาแล้ว" },
  { id: "CANCELLED", label: "ยกเลิก" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "จองแล้ว",
  ARRIVED: "มาแล้ว",
  CANCELLED: "ยกเลิก",
  COMPLETED: "เสร็จสิ้น",
};

export function BuildingPosReservationsPanel() {
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["id"]>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const lb = useAppImageLightbox();
  const notice = useAppNoticePopup();

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const q = new URLSearchParams();
      if (statusFilter !== "all") q.set("status", statusFilter);
      const today = bangkokDateKey();
      q.set("date", today);
      const res = await fetch(`/api/building-pos/session/reservations?${q}`, {
        credentials: "include",
        cache: "no-store",
      });
      const j = (await res.json().catch(() => ({}))) as {
        reservations?: ReservationRow[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "โหลดไม่สำเร็จ");
      setRows(j.reservations ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (body: Record<string, unknown>) => {
    const id = String(body.id);
    setBusyId(id);
    try {
      const res = await fetch("/api/building-pos/session/reservations", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "อัปเดตไม่สำเร็จ");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "อัปเดตไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppDashboardSection className="!rounded-[1.25rem]">
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      <AppSectionHeader
        title="จองโต๊ะวันนี้"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            onClick={() => void load()}
            className={cn(appTemplateOutlineButtonClass, "min-h-10 min-w-10 rounded-xl px-3 text-sm font-bold")}
            aria-label="รีเฟรชการจอง"
          >
            รีเฟรช
          </button>
        }
      />

      <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="กรองสถานะจอง">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={statusFilter === f.id}
            className={statusFilter === f.id ? buildingPosChipActiveClass : buildingPosChipIdleClass}
            onClick={() => setStatusFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {err ? <p className="mt-3 text-sm font-semibold text-rose-600">{err}</p> : null}

      {loading ? (
        <p className="mt-4 text-sm font-semibold text-[#66638c]">กำลังโหลด…</p>
      ) : rows.length === 0 ? (
        <div className="mt-4">
          <AppEmptyState>ยังไม่มีการจองวันนี้</AppEmptyState>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.id} className={cn(buildingPosListRowCardClass, "flex flex-col gap-3 sm:flex-row sm:items-center")}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#1e1b4b]">
                  {r.customerName} · {r.partySize} คน
                </p>
                <p className="mt-0.5 text-xs font-semibold text-[#66638c]">
                  {r.visitTimeHm} · {r.phone} · {STATUS_LABEL[r.status] ?? r.status}
                  {r.linkedOrderId ? ` · ออเดอร์ #${r.linkedOrderId}` : ""}
                </p>
                {r.itemsTotalBaht > 0 ? (
                  <p className="mt-1 text-xs font-bold text-[#4d47b6]">
                    พรีออเดอร์ ฿{r.itemsTotalBaht.toLocaleString()}
                    {r.amountPaidBaht > 0 ? ` · ชำระแล้ว ฿${r.amountPaidBaht.toLocaleString()}` : ""}
                  </p>
                ) : null}
                {r.paymentSlipUrl ? (
                  <div className="mt-2">
                    <AppImageThumb
                      src={r.paymentSlipUrl}
                      alt="สลิป"
                      className="h-12 w-12"
                      onOpen={() => lb.open(r.paymentSlipUrl!)}
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {!r.linkedOrderId && r.status !== "CANCELLED" && r.items.length > 0 ? (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    className="app-btn-primary min-h-10 rounded-xl px-3 text-xs font-bold disabled:opacity-60"
                    onClick={() => void patch({ id: r.id, sendToKitchen: true })}
                  >
                    ส่งครัว
                  </button>
                ) : null}
                {r.status !== "CANCELLED" && r.status !== "COMPLETED" ? (
                  <button
                    type="button"
                    disabled={busyId === r.id}
                    className={cn(appTemplateOutlineButtonClass, "min-h-10 rounded-xl px-3 text-xs font-bold text-rose-600")}
                    onClick={() => {
                      void (async () => {
                        const ok = await notice.confirm(
                          `ยกเลิกจอง ${r.customerName} · ${r.visitTimeHm}?`,
                        );
                        if (ok) await patch({ id: r.id, status: "CANCELLED" });
                      })();
                    }}
                  >
                    ยกเลิก
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppDashboardSection>
  );
}
