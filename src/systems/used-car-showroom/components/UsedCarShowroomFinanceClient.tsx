"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppColumnBarSparkChart,
  AppEmptyState,
  AppLabeledImageThumb,
  AppImageLightbox,
  AppRevenueCostColumnChart,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { bangkokDateKey, bangkokMonthKey } from "@/lib/time/bangkok";
import { UsedCarShowroomPageSubNav } from "@/systems/used-car-showroom/components/UsedCarShowroomPageSubNav";
import { usedCarShowroomTonedRowCardClass } from "@/systems/used-car-showroom/lib/card-tones";
import type { UsedCarShopDto } from "@/systems/used-car-showroom/lib/mappers";
import {
  usedCarShowroomPageTitleIcon,
  usedCarShowroomPageTitleTone,
} from "@/systems/used-car-showroom/lib/page-menu-icons";
import {
  usedCarShowroomFieldClass,
  usedCarShowroomFilterChipClass,
  usedCarShowroomFilterChipShellClass,
  usedCarShowroomFinanceChartPanelClass,
  usedCarShowroomFinanceRangeChipClass,
  usedCarShowroomFinanceStatTailClass,
  usedCarShowroomFinanceStatsGridClass,
  usedCarShowroomIconButtonClass,
  usedCarShowroomOutlineButtonClass,
  usedCarShowroomPageStackClass,
  usedCarShowroomPrimaryButtonClass,
  usedCarShowroomStatInlineClass,
} from "@/systems/used-car-showroom/lib/ui-tokens";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type Entry = {
  id: string;
  kind: string;
  title: string;
  amountBaht: number;
  entryOn: string;
  slipImageUrl: string | null;
  categoryName: string | null;
  vehicleId: string | null;
};

type Category = { id: string; kind: string; name: string; systemKey: string | null };

type VehicleOption = { id: string; title: string; brand: string; model: string; year: number | null };

type RangeKey = "TODAY" | "MONTH" | "YEAR" | "CUSTOM";

function baht(n: number) {
  return `฿${n.toLocaleString("th-TH")}`;
}

function monthStart() {
  return `${bangkokMonthKey()}-01`;
}

function vehicleLabel(v: VehicleOption) {
  return v.title || [v.brand, v.model, v.year].filter(Boolean).join(" ");
}

export function UsedCarShowroomFinanceClient({ initialShop }: { initialShop: UsedCarShopDto }) {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [tab, setTab] = useState<"income" | "expense">("income");
  const [filterOpen, setFilterOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [range, setRange] = useState<RangeKey>("MONTH");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(bangkokDateKey());
  const [q, setQ] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    amountBaht: "",
    categoryId: "",
    vehicleId: "",
    entryOn: bangkokDateKey(),
    slipImageUrl: "" as string | null,
  });
  const [busy, setBusy] = useState(false);

  const filtersActive = range !== "MONTH" || Boolean(q.trim()) || from !== monthStart() || to !== bangkokDateKey();

  const dateBounds = useMemo(() => {
    const today = bangkokDateKey();
    if (range === "TODAY") return { from: today, to: today };
    if (range === "MONTH") return { from: monthStart(), to: today };
    if (range === "YEAR") return { from: `${today.slice(0, 4)}-01-01`, to: today };
    return { from, to };
  }, [range, from, to]);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ from: dateBounds.from, to: dateBounds.to });
    const [ledgerRes, vehRes] = await Promise.all([
      fetch(`/api/used-car-showroom/session/ledger?${params}`, { credentials: "include" }),
      fetch("/api/used-car-showroom/session/vehicles", { credentials: "include" }),
    ]);
    const data = await ledgerRes.json();
    if (!ledgerRes.ok) {
      notice.error(data.error || "โหลดการเงินไม่สำเร็จ");
      return;
    }
    setEntries(Array.isArray(data.entries) ? data.entries : []);
    setCategories(Array.isArray(data.categories) ? data.categories : []);
    if (vehRes.ok) {
      const vehData = await vehRes.json();
      setVehicles(Array.isArray(vehData.vehicles) ? vehData.vehicles : []);
    }
  }, [dateBounds.from, dateBounds.to, notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === form.categoryId) ?? null,
    [categories, form.categoryId],
  );

  const requiresCommissionVehicle = useMemo(() => {
    if (tab !== "expense") return false;
    if (selectedCategory?.systemKey === "COMMISSION") return true;
    if ((selectedCategory?.name ?? "").includes("ค่าคอม")) return true;
    return form.title.includes("ค่าคอม");
  }, [tab, selectedCategory, form.title]);

  const filtered = useMemo(() => {
    const kind = tab === "income" ? "INCOME" : "EXPENSE";
    return entries.filter((e) => {
      if (e.kind !== kind) return false;
      if (!q.trim()) return true;
      return e.title.toLowerCase().includes(q.trim().toLowerCase());
    });
  }, [entries, tab, q]);

  const incomeTotal = entries.filter((e) => e.kind === "INCOME").reduce((s, e) => s + e.amountBaht, 0);
  const expenseTotal = entries.filter((e) => e.kind === "EXPENSE").reduce((s, e) => s + e.amountBaht, 0);
  const net = incomeTotal - expenseTotal;

  const revenueCostBuckets = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const e of entries) {
      const cur = map.get(e.entryOn) ?? { income: 0, expense: 0 };
      if (e.kind === "INCOME") cur.income += e.amountBaht;
      else cur.expense += e.amountBaht;
      map.set(e.entryOn, cur);
    }
    const rows = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const maxVal = Math.max(1, ...rows.flatMap(([, v]) => [v.income, v.expense]));
    return rows.map(([date, v]) => ({
      key: date,
      label: date.slice(5),
      revenue: v.income,
      cost: v.expense,
      revenuePct: Math.round((v.income / maxVal) * 100),
      costPct: Math.round((v.expense / maxVal) * 100),
    }));
  }, [entries]);

  const incomeSparkBuckets = useMemo(() => {
    const maxVal = Math.max(1, ...revenueCostBuckets.map((b) => b.revenue));
    return revenueCostBuckets.map((b) => ({
      key: b.key,
      label: b.label,
      amount: b.revenue,
      pct: Math.round((b.revenue / maxVal) * 100),
    }));
  }, [revenueCostBuckets]);

  async function saveEntry() {
    const amount = Math.round(Number(form.amountBaht) || 0);
    if (!form.title.trim() || amount <= 0) {
      notice.error("กรอกหัวข้อและยอด");
      return;
    }
    if (requiresCommissionVehicle && !form.vehicleId) {
      notice.error("ค่าคอมต้องเลือกผูกรถก่อนบันทึก");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/used-car-showroom/session/ledger", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: tab === "income" ? "INCOME" : "EXPENSE",
          title: form.title,
          amountBaht: amount,
          categoryId: form.categoryId || null,
          vehicleId: form.vehicleId || null,
          entryOn: form.entryOn,
          slipImageUrl: form.slipImageUrl || null,
          ...(requiresCommissionVehicle ? { systemKey: "COMMISSION" } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notice.error(data.error || "บันทึกไม่สำเร็จ");
        return;
      }
      setAddOpen(false);
      setForm({ title: "", amountBaht: "", categoryId: "", vehicleId: "", entryOn: bangkokDateKey(), slipImageUrl: null });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(id: string, title: string) {
    const ok = await notice.confirm(`ลบรายการ «${title}» ใช่หรือไม่?`);
    if (!ok) return;
    const res = await fetch(`/api/used-car-showroom/session/ledger?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      notice.error("ลบไม่สำเร็จ");
      return;
    }
    await load();
  }

  async function onSlip(file: File) {
    const prepared = await prepareImageFileForUpload(file);
    const fd = new FormData();
    fd.set("file", prepared);
    const res = await fetch("/api/used-car-showroom/session/upload", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (!res.ok) {
      notice.error(data.error || "อัปโหลดสลิปไม่สำเร็จ");
      return;
    }
    setForm((f) => ({ ...f, slipImageUrl: data.imageUrl ?? data.url ?? null }));
  }

  return (
    <div className={usedCarShowroomPageStackClass}>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
      <UsedCarShowroomPageSubNav
        title="การเงิน"
        titleIcon={usedCarShowroomPageTitleIcon("finance")}
        titleTone={usedCarShowroomPageTitleTone("finance")}
        items={[
          { key: "income", label: "รายรับ" },
          { key: "expense", label: "รายจ่าย" },
        ]}
        activeKey={tab}
        onSelect={(k) => setTab(k as "income" | "expense")}
        ariaLabel="แท็บการเงิน"
        action={
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={cn(usedCarShowroomOutlineButtonClass, filterOpen && "ring-2 ring-[#5b61ff]/20")}
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((o) => !o)}
            >
              {filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
              {filtersActive && !filterOpen ? (
                <span className="ml-1 inline-block h-2 w-2 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </button>
            <button type="button" className={usedCarShowroomOutlineButtonClass} onClick={() => setChartsOpen((o) => !o)}>
              {chartsOpen ? "ซ่อนกราฟ" : "แสดงกราฟ"}
            </button>
            <button type="button" className={usedCarShowroomPrimaryButtonClass} onClick={() => setAddOpen(true)}>
              + {tab === "income" ? "รายรับ" : "รายจ่าย"}
            </button>
            <button type="button" className={usedCarShowroomIconButtonClass} aria-label="รีเฟรช" onClick={() => void load()}>
              ↻
            </button>
          </div>
        }
      >
        <p className="mb-3 text-xs text-[#66638c]">{initialShop.displayName}</p>
        <div className={usedCarShowroomFinanceStatsGridClass}>
          <div className={cn(usedCarShowroomStatInlineClass, "border-l-[3px] border-l-emerald-500 bg-emerald-50/50")}>
            <span className="text-[10px] font-bold uppercase text-emerald-800/80">รายรับ</span>
            <span className="text-lg font-black tabular-nums text-emerald-700">{baht(incomeTotal)}</span>
          </div>
          <div className={cn(usedCarShowroomStatInlineClass, "border-l-[3px] border-l-rose-500 bg-rose-50/45")}>
            <span className="text-[10px] font-bold uppercase text-rose-800/80">รายจ่าย</span>
            <span className="text-lg font-black tabular-nums text-rose-600">{baht(expenseTotal)}</span>
          </div>
          <div className={cn(usedCarShowroomStatInlineClass, usedCarShowroomFinanceStatTailClass, "border-l-[3px] border-l-slate-400")}>
            <span className="text-[10px] font-bold uppercase text-[#66638c]">สุทธิ</span>
            <span className={cn("text-lg font-black tabular-nums", net < 0 ? "text-rose-800" : "text-[#1e1b4b]")}>{baht(net)}</span>
          </div>
        </div>

        <div id="ucs-finance-filter" className={cn("mt-3 space-y-3", filterOpen ? "block" : "hidden")}>
          <div className={usedCarShowroomFilterChipShellClass} role="group" aria-label="กรองช่วงเวลาการเงิน">
            {(
              [
                ["TODAY", "วันนี้"],
                ["MONTH", "เดือนนี้"],
                ["YEAR", "ปีนี้"],
                ["CUSTOM", "กำหนดเอง"],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" className={usedCarShowroomFinanceRangeChipClass(range === k)} aria-pressed={range === k} onClick={() => setRange(k)}>
                {label}
              </button>
            ))}
          </div>
          {range === "CUSTOM" ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="text-xs font-bold text-[#4d47b6]">
                จาก
                <input type="date" className={usedCarShowroomFieldClass} value={from} onChange={(e) => setFrom(e.target.value)} />
              </label>
              <label className="text-xs font-bold text-[#4d47b6]">
                ถึง
                <input type="date" className={usedCarShowroomFieldClass} value={to} onChange={(e) => setTo(e.target.value)} />
              </label>
            </div>
          ) : null}
          <input className={usedCarShowroomFieldClass} placeholder="ค้นหาหัวข้อ" value={q} onChange={(e) => setQ(e.target.value)} />
          {filtersActive ? (
            <button
              type="button"
              className={usedCarShowroomOutlineButtonClass}
              onClick={() => {
                setRange("MONTH");
                setFrom(monthStart());
                setTo(bangkokDateKey());
                setQ("");
              }}
            >
              รีเซ็ต · เดือนนี้
            </button>
          ) : null}
        </div>

        {chartsOpen ? (
          <div className={cn(usedCarShowroomFinanceChartPanelClass, "mt-3 space-y-3")}>
            <AppRevenueCostColumnChart
              className="flex min-h-0 flex-1 flex-col"
              compact
              buckets={revenueCostBuckets}
              emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
            />
            <AppColumnBarSparkChart
              className="flex min-h-0 flex-1 flex-col"
              compact
              variant="brand"
              buckets={incomeSparkBuckets}
              emptyText="ไม่มีข้อมูลในช่วงที่เลือก"
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-2 border-t border-slate-200/80 pt-4">
          {filtered.length === 0 ? (
            <AppEmptyState>{tab === "income" ? "ยังไม่มีรายรับ" : "ยังไม่มีรายจ่าย"}</AppEmptyState>
          ) : (
            filtered.map((e) => (
              <div key={e.id} className={usedCarShowroomTonedRowCardClass(e.kind === "INCOME" ? "emerald" : "rose")}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {e.slipImageUrl ? (
                    <AppLabeledImageThumb src={e.slipImageUrl} kind="slip" alt={e.title} onOpen={() => lb.open(e.slipImageUrl!)} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#1e1b4b]">{e.title}</p>
                    <p className="text-xs text-[#66638c]">
                      {e.entryOn} · {e.categoryName ?? "ไม่มีหมวด"}
                      {e.vehicleId ? " · ผูกรถ" : ""}
                    </p>
                  </div>
                  <p className={cn("shrink-0 text-lg font-black tabular-nums", e.kind === "INCOME" ? "text-emerald-700" : "text-rose-600")}>
                    {baht(e.amountBaht)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${e.title}`} title="แก้ไข" onClick={() => notice.show("แก้รายการ: ลบแล้วสร้างใหม่ใน MVP", "warning")}>
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${e.title}`} title="ลบ" onClick={() => void removeEntry(e.id, e.title)}>
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className={cn(usedCarShowroomFilterChipShellClass, "mt-3")}>
          {categories
            .filter((c) => c.kind === (tab === "income" ? "INCOME" : "EXPENSE"))
            .map((c) => (
              <span key={c.id} className={usedCarShowroomFilterChipClass(false)}>
                {c.name}
              </span>
            ))}
        </div>
      </UsedCarShowroomPageSubNav>

      <FormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={tab === "income" ? "เพิ่มรายรับ" : "เพิ่มรายจ่าย"}
        size="md"
        mobileCentered
        footer={
          <FormModalFooterActions onCancel={() => setAddOpen(false)} onSubmit={() => void saveEntry()} submitLabel="บันทึก" loading={busy} />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            หมวด
            <select className={usedCarShowroomFieldClass} value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              <option value="">—</option>
              {categories
                .filter((c) => c.kind === (tab === "income" ? "INCOME" : "EXPENSE"))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            หัวข้อ
            <input className={usedCarShowroomFieldClass} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            จำนวนเงิน
            <input className={usedCarShowroomFieldClass} value={form.amountBaht} onChange={(e) => setForm((f) => ({ ...f, amountBaht: e.target.value }))} />
          </label>
          {tab === "expense" ? (
            <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
              ผูกรถ{requiresCommissionVehicle ? " (บังคับ — ค่าคอม)" : " (ไม่บังคับ)"}
              <select
                className={usedCarShowroomFieldClass}
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                required={requiresCommissionVehicle}
              >
                <option value="">— เลือกรถ —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {vehicleLabel(v)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            วันที่
            <input type="date" className={usedCarShowroomFieldClass} value={form.entryOn} onChange={(e) => setForm((f) => ({ ...f, entryOn: e.target.value }))} />
          </label>
          <div>
            <p className="mb-1 text-xs font-bold text-[#4d47b6]">สลิป (ไม่บังคับ)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onSlip(f);
              }}
            />
            {form.slipImageUrl ? (
              <AppLabeledImageThumb className="mt-2 h-20 w-20" src={form.slipImageUrl} kind="slip" alt="สลิป" onOpen={() => lb.open(form.slipImageUrl!)} />
            ) : null}
          </div>
        </div>
      </FormModal>
    </div>
  );
}
