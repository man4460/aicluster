"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import {
  inventoryStatCardClass,
  INVENTORY_MOVEMENT_LABEL,
} from "@/systems/inventory/lib/inventory-ui";
import {
  fetchInventoryItems,
  fetchInventoryMovements,
  fetchInventoryWarehouses,
  formatDateTimeShort,
  formatThb,
  inventoryFetchErrorMessage,
} from "@/systems/inventory/lib/inventory-client-data";
import {
  IconAlert,
  IconBox,
  IconCash,
  IconRefresh,
  IconWarehouse,
} from "@/systems/inventory/components/InventoryIcons";
import type {
  InventoryItemRow,
  InventoryMovementRow,
  InventoryWarehouseRow,
} from "@/systems/inventory/components/types";

function isSameBangkokDay(iso: string): boolean {
  const ts = new Date(iso);
  if (Number.isNaN(ts.getTime())) return false;
  const now = new Date();
  const tzOffsetMs = 7 * 60 * 60 * 1000;
  const a = new Date(ts.getTime() + tzOffsetMs);
  const b = new Date(now.getTime() + tzOffsetMs);
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function InventoryDashboardClient() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [warehouses, setWarehouses] = useState<InventoryWarehouseRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetchInventoryItems(),
        fetchInventoryWarehouses(),
        fetchInventoryMovements(20),
      ]);
      if (!r1.ok) setError(r1.error);
      else setItems(r1.items);
      if (r2.ok) setWarehouses(r2.warehouses);
      if (r3.ok) setMovements(r3.movements);
    } catch (e) {
      setError(inventoryFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const stats = useMemo(() => {
    const totalItems = items.filter((it) => it.isActive).length;
    const totalValue = items.reduce((acc, it) => acc + it.totalStock * it.costPrice, 0);
    const lowStockItems = items.filter(
      (it) => it.isActive && it.minStock > 0 && it.totalStock < it.minStock,
    );
    const todayMovements = movements.filter((m) => isSameBangkokDay(m.createdAt));
    return {
      totalItems,
      totalValue,
      lowStockCount: lowStockItems.length,
      todayCount: todayMovements.length,
      lowStockItems,
    };
  }, [items, movements]);

  const activeWarehouses = useMemo(
    () => warehouses.filter((w) => w.isActive).length,
    [warehouses],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className="space-y-4">
        <AppSectionHeader
          title="ภาพรวมคลังสต๊อก"
          tone="violet"
          description={
            <span>
              สรุปจำนวนสินค้า มูลค่าตามทุน ของใกล้หมด และเคลื่อนไหววันนี้ (เขตเวลากรุงเทพ)
            </span>
          }
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => void reload()}
              aria-label="รีเฟรชข้อมูลภาพรวมคลัง"
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-teal-200 bg-white/85 px-2 text-emerald-800 hover:bg-emerald-50 sm:min-w-0 sm:px-4"
              disabled={loading}
              aria-busy={loading}
              title="รีเฟรช"
            >
              <IconRefresh className={cn("h-5 w-5", loading && "animate-spin", "sm:mr-1.5")} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HeroStat
            tone="teal"
            icon={<IconBox className="h-5 w-5" />}
            label="สินค้าทั้งหมด"
            value={stats.totalItems.toLocaleString("th-TH")}
            suffix="รายการ"
          />
          <HeroStat
            tone="emerald"
            icon={<IconCash className="h-5 w-5" />}
            label="มูลค่าตามทุน"
            value={formatThb(stats.totalValue)}
            suffix="บาท"
          />
          <HeroStat
            tone="amber"
            icon={<IconAlert className="h-5 w-5" />}
            label="ของใกล้หมด"
            value={stats.lowStockCount.toLocaleString("th-TH")}
            suffix="รายการ"
            emphasis={stats.lowStockCount > 0}
          />
          <HeroStat
            tone="teal"
            icon={<IconWarehouse className="h-5 w-5" />}
            label="คลังที่ใช้งาน"
            value={activeWarehouses.toLocaleString("th-TH")}
            suffix="แห่ง"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            {error}
          </div>
        ) : null}
      </AppDashboardSection>

      <AppDashboardSection className="space-y-3">
        <AppSectionHeader
          title="ของใกล้หมด"
          description={
            <span>สต๊อกรวมต่ำกว่าจุดสั่งซื้อ — รีบเติมเพื่อไม่ให้ขาด</span>
          }
          action={
            <Link
              href="/dashboard/inventory/items"
              className="text-xs font-bold text-emerald-700 underline-offset-4 hover:text-emerald-900 hover:underline"
            >
              จัดการสินค้า →
            </Link>
          }
        />
        {stats.lowStockItems.length === 0 ? (
          <AppEmptyState tone="slate">
            ยังไม่มีสินค้าใกล้หมด — ทุกอย่างปกติดี
          </AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {stats.lowStockItems.slice(0, 12).map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-amber-900">{it.name}</p>
                  <p className="text-xs text-amber-700">
                    SKU {it.sku} · {it.categoryName ?? "ไม่มีหมวด"}
                  </p>
                </div>
                <div className="shrink-0 rounded-xl bg-white px-2.5 py-1 text-right">
                  <p className="text-[10px] font-bold uppercase text-amber-700">คงเหลือ</p>
                  <p className="text-base font-black text-rose-700">
                    {it.totalStock}
                    <span className="ml-0.5 text-[10px] font-bold text-slate-500">
                      / {it.minStock} {it.unit}
                    </span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <AppDashboardSection className="space-y-3">
        <AppSectionHeader
          title="เคลื่อนไหวล่าสุด"
          description={<span>20 รายการล่าสุด</span>}
          action={
            <Link
              href="/dashboard/inventory/movements"
              className="text-xs font-bold text-emerald-700 underline-offset-4 hover:text-emerald-900 hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          }
        />
        {movements.length === 0 ? (
          <AppEmptyState tone="slate">
            ยังไม่มีการเคลื่อนไหว — เริ่มที่ «รับเข้า» สินค้าใหม่
          </AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {movements.slice(0, 10).map((m) => (
              <MovementRow key={m.id} m={m} />
            ))}
          </ul>
        )}
      </AppDashboardSection>
    </div>
  );
}

function HeroStat({
  tone,
  icon,
  label,
  value,
  suffix,
  emphasis,
}: {
  tone: "teal" | "emerald" | "amber" | "rose";
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  emphasis?: boolean;
}) {
  return (
    <div className={inventoryStatCardClass(tone)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{label}</p>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/55 ring-1 ring-white/60">
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-black tracking-tight sm:text-3xl",
          emphasis && "text-rose-700",
        )}
      >
        {value}
        {suffix ? <span className="ml-1 text-xs font-bold opacity-70">{suffix}</span> : null}
      </p>
    </div>
  );
}

function MovementRow({ m }: { m: InventoryMovementRow }) {
  const meta = INVENTORY_MOVEMENT_LABEL[m.type];
  const direction =
    m.type === "TRANSFER"
      ? `${m.fromWarehouseName ?? "—"} → ${m.toWarehouseName ?? "—"}`
      : m.type === "IN"
        ? `เข้า ${m.toWarehouseName ?? "—"}`
        : m.type === "OUT"
          ? `ออกจาก ${m.fromWarehouseName ?? "—"}`
          : `ปรับ ${m.fromWarehouseName ?? m.toWarehouseName ?? "—"}`;
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-white/65 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
            meta.toneClass,
          )}
        >
          {meta.label}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{m.itemName}</p>
          <p className="truncate text-xs text-slate-500">
            SKU {m.itemSku} · {direction}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-black tabular-nums",
            m.type === "OUT" || (m.type === "ADJUST" && !m.toWarehouseId)
              ? "text-rose-700"
              : "text-emerald-700",
          )}
        >
          {m.type === "OUT" || (m.type === "ADJUST" && !m.toWarehouseId) ? "-" : "+"}
          {m.quantity.toLocaleString("th-TH")}
        </p>
        <p className="text-[10px] text-slate-500">{formatDateTimeShort(m.createdAt)}</p>
      </div>
    </li>
  );
}
