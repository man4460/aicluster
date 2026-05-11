"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  inventoryChipClass,
  inventoryInputClass,
  inventoryStatCardClass,
  INVENTORY_MOVEMENT_LABEL,
} from "@/systems/inventory/lib/inventory-ui";
import {
  fetchInventoryItems,
  fetchInventoryMovements,
  fetchInventoryWarehouses,
  formatDateTimeShort,
  inventoryFetchErrorMessage,
} from "@/systems/inventory/lib/inventory-client-data";
import {
  IconAdjust,
  IconArrowDown,
  IconArrowUp,
  IconSwap,
} from "@/systems/inventory/components/InventoryIcons";
import type {
  InventoryItemRow,
  InventoryMovementRow,
  InventoryMovementType,
  InventoryWarehouseRow,
} from "@/systems/inventory/components/types";

type FilterType = "all" | InventoryMovementType;

const ACTION_BUTTONS: {
  type: InventoryMovementType;
  label: string;
  icon: (p: { className?: string }) => React.ReactNode;
  toneClass: string;
}[] = [
  {
    type: "IN",
    label: "รับเข้า",
    icon: IconArrowDown,
    toneClass:
      "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:brightness-110",
  },
  {
    type: "OUT",
    label: "เบิกออก",
    icon: IconArrowUp,
    toneClass: "bg-gradient-to-br from-rose-500 to-rose-600 text-white hover:brightness-110",
  },
  {
    type: "TRANSFER",
    label: "โอน",
    icon: IconSwap,
    toneClass:
      "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:brightness-110",
  },
  {
    type: "ADJUST",
    label: "ปรับยอด",
    icon: IconAdjust,
    toneClass:
      "bg-gradient-to-br from-amber-500 to-orange-500 text-white hover:brightness-110",
  },
];

export function InventoryMovementsClient() {
  const [items, setItems] = useState<InventoryItemRow[]>([]);
  const [warehouses, setWarehouses] = useState<InventoryWarehouseRow[]>([]);
  const [movements, setMovements] = useState<InventoryMovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>("all");

  const [formType, setFormType] = useState<InventoryMovementType | null>(null);
  const [formItemId, setFormItemId] = useState<string>("");
  const [formFromWh, setFormFromWh] = useState<string>("");
  const [formToWh, setFormToWh] = useState<string>("");
  const [formQty, setFormQty] = useState("");
  const [formUnitCost, setFormUnitCost] = useState("");
  const [formReference, setFormReference] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetchInventoryItems(),
        fetchInventoryWarehouses(),
        fetchInventoryMovements(100),
      ]);
      if (r1.ok) setItems(r1.items);
      if (r2.ok) setWarehouses(r2.warehouses);
      if (!r3.ok) setError(r3.error);
      else setMovements(r3.movements);
    } catch (e) {
      setError(inventoryFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const activeWarehouses = useMemo(
    () => warehouses.filter((w) => w.isActive),
    [warehouses],
  );

  const activeItems = useMemo(
    () => items.filter((it) => it.isActive),
    [items],
  );

  const summary = useMemo(() => {
    const counts: Record<InventoryMovementType, number> = {
      IN: 0,
      OUT: 0,
      TRANSFER: 0,
      ADJUST: 0,
    };
    for (const m of movements) counts[m.type]++;
    return counts;
  }, [movements]);

  const filtered = useMemo(
    () => (filter === "all" ? movements : movements.filter((m) => m.type === filter)),
    [movements, filter],
  );

  function openForm(type: InventoryMovementType) {
    setFormType(type);
    setFormItemId("");
    setFormFromWh("");
    setFormToWh("");
    setFormQty("");
    setFormUnitCost("");
    setFormReference("");
    setFormNote("");
    setFormError(null);
  }

  function closeForm() {
    setFormType(null);
    setFormError(null);
  }

  const formValid = useMemo(() => {
    if (!formType) return false;
    if (!formItemId) return false;
    const qty = Number(formQty);
    if (!Number.isFinite(qty) || qty <= 0) return false;
    if (formType === "IN" && !formToWh) return false;
    if (formType === "OUT" && !formFromWh) return false;
    if (formType === "TRANSFER" && (!formFromWh || !formToWh || formFromWh === formToWh))
      return false;
    if (formType === "ADJUST" && !formFromWh && !formToWh) return false;
    return true;
  }, [formType, formItemId, formQty, formFromWh, formToWh]);

  async function submitForm() {
    if (!formType || !formValid) return;
    setFormBusy(true);
    setFormError(null);
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formType,
          itemId: Number(formItemId),
          fromWarehouseId: formFromWh ? Number(formFromWh) : null,
          toWarehouseId: formToWh ? Number(formToWh) : null,
          quantity: Math.trunc(Number(formQty)),
          unitCost: formUnitCost ? Number(formUnitCost) : null,
          reference: formReference.trim() || null,
          note: formNote.trim() || null,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setFormError(j.error?.trim() || `บันทึกไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      closeForm();
      await reload();
    } catch (e) {
      setFormError(inventoryFetchErrorMessage(e));
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <AppDashboardSection tone="violet" className="space-y-4">
        <AppSectionHeader
          title="การเคลื่อนไหวสต๊อก"
          tone="violet"
          description={
            <span>เลือกการกระทำที่ต้องการ — สต๊อกจะอัปเดตทันทีและถูกบันทึกไว้ในประวัติ</span>
          }
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {ACTION_BUTTONS.map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.type}
                type="button"
                suppressHydrationWarning
                onClick={() => openForm(btn.type)}
                className={cn(
                  "flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2.5 text-sm font-black tracking-tight shadow-md transition active:scale-[0.98] sm:flex-row sm:gap-2 sm:py-3.5",
                  btn.toneClass,
                )}
                aria-label={`${btn.label} สินค้า`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryStat tone="emerald" label="รับเข้า" value={summary.IN} />
          <SummaryStat tone="rose" label="เบิกออก" value={summary.OUT} />
          <SummaryStat tone="teal" label="โอน" value={summary.TRANSFER} />
          <SummaryStat tone="amber" label="ปรับยอด" value={summary.ADJUST} />
        </div>
      </AppDashboardSection>

      <AppDashboardSection className="space-y-3">
        <AppSectionHeader
          title="ประวัติเคลื่อนไหว"
          description={<span>100 รายการล่าสุด</span>}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setFilter("all")}
            className={inventoryChipClass(filter === "all")}
          >
            ทั้งหมด
          </button>
          {(["IN", "OUT", "TRANSFER", "ADJUST"] as const).map((t) => (
            <button
              key={t}
              type="button"
              suppressHydrationWarning
              onClick={() => setFilter(t)}
              className={inventoryChipClass(filter === t)}
            >
              {INVENTORY_MOVEMENT_LABEL[t].label}
            </button>
          ))}
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : filtered.length === 0 ? (
          <AppEmptyState tone="slate">
            ยังไม่มีรายการ — กดปุ่มด้านบนเพื่อเริ่มบันทึก
          </AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {filtered.map((m) => (
              <MovementRow key={m.id} m={m} />
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={Boolean(formType)}
        onClose={closeForm}
        title={formType ? `${INVENTORY_MOVEMENT_LABEL[formType].label} สินค้า` : ""}
        description={
          formType === "IN"
            ? "เพิ่มสต๊อกเข้าคลังปลายทาง"
            : formType === "OUT"
              ? "ลดสต๊อกจากคลังต้นทาง"
              : formType === "TRANSFER"
                ? "โอนสต๊อกระหว่างคลัง"
                : formType === "ADJUST"
                  ? "ปรับยอดสต๊อก (ตรวจนับ)"
                  : ""
        }
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={closeForm}
            onSubmit={submitForm}
            submitLabel="บันทึกการเคลื่อนไหว"
            submitDisabled={!formValid}
            loading={formBusy}
          />
        }
      >
        <div className="space-y-3">
          {formError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {formError}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">สินค้า *</span>
            <select
              suppressHydrationWarning
              value={formItemId}
              onChange={(e) => setFormItemId(e.target.value)}
              className={inventoryInputClass}
            >
              <option value="">— เลือกสินค้า —</option>
              {activeItems.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.sku} · {it.name}
                </option>
              ))}
            </select>
          </label>

          {(formType === "OUT" || formType === "TRANSFER" || formType === "ADJUST") ? (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">
                {formType === "TRANSFER"
                  ? "คลังต้นทาง *"
                  : formType === "ADJUST"
                    ? "คลังที่ลดยอด (ถ้ามี)"
                    : "คลังต้นทาง *"}
              </span>
              <select
                suppressHydrationWarning
                value={formFromWh}
                onChange={(e) => setFormFromWh(e.target.value)}
                className={inventoryInputClass}
              >
                <option value="">— เลือกคลัง —</option>
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} · {w.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {(formType === "IN" || formType === "TRANSFER" || formType === "ADJUST") ? (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">
                {formType === "TRANSFER"
                  ? "คลังปลายทาง *"
                  : formType === "ADJUST"
                    ? "คลังที่เพิ่มยอด (ถ้ามี)"
                    : "คลังปลายทาง *"}
              </span>
              <select
                suppressHydrationWarning
                value={formToWh}
                onChange={(e) => setFormToWh(e.target.value)}
                className={inventoryInputClass}
              >
                <option value="">— เลือกคลัง —</option>
                {activeWarehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} · {w.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">จำนวน *</span>
              <input
                suppressHydrationWarning
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={formQty}
                onChange={(e) => setFormQty(e.target.value)}
                placeholder="0"
                className={inventoryInputClass}
              />
            </label>
            {formType === "IN" ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">
                  ต้นทุน/หน่วย (ถ้ามี)
                </span>
                <input
                  suppressHydrationWarning
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.01}
                  value={formUnitCost}
                  onChange={(e) => setFormUnitCost(e.target.value)}
                  placeholder="0.00"
                  className={inventoryInputClass}
                />
              </label>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-slate-700">เลขอ้างอิง</span>
                <input
                  suppressHydrationWarning
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="เลขใบ / PO / เลขรอบ"
                  className={inventoryInputClass}
                  maxLength={120}
                />
              </label>
            )}
          </div>

          {formType === "IN" ? (
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-700">เลขอ้างอิง</span>
              <input
                suppressHydrationWarning
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
                placeholder="เลขใบ / PO / เลขรอบ"
                className={inventoryInputClass}
                maxLength={120}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">หมายเหตุ</span>
            <textarea
              suppressHydrationWarning
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={2}
              placeholder="เหตุผล / รายละเอียดเพิ่ม"
              className={inventoryInputClass}
              maxLength={2000}
            />
          </label>
        </div>
      </FormModal>
    </div>
  );
}

function SummaryStat({
  tone,
  label,
  value,
}: {
  tone: "teal" | "emerald" | "amber" | "rose";
  label: string;
  value: number;
}) {
  return (
    <div className={cn(inventoryStatCardClass(tone), "py-2.5")}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 text-xl font-black tabular-nums">{value.toLocaleString("th-TH")}</p>
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
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-white/65 bg-white/80 px-3 py-3 shadow-sm backdrop-blur">
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
            {m.reference ? <> · {m.reference}</> : null}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={cn(
            "text-base font-black tabular-nums",
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
