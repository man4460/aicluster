"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { MEDIA_REGISTRY_ITEM_STATUS } from "@/systems/media-registry/lib/constants";

type ItemRow = {
  id: string;
  registerNo: string;
  mediaName: string;
  category: string;
  subjectGroup: string | null;
  gradeLevel: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  unit: string;
  pricePerUnit: string;
  totalPrice: string;
  mediaStatus: string;
  locationId: string | null;
  locationLabel: string | null;
  note: string | null;
};

type Loc = { id: string; locationDetail: string };

const inputCls =
  "w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm text-[#2e2a58] shadow-inner focus:border-[#4d47b6] focus:outline-none focus:ring-2 focus:ring-[#4d47b6]/30";

const statusOptions = Object.values(MEDIA_REGISTRY_ITEM_STATUS);

export function MediaRegistryItemsClient() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stFilter, setStFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: null as string | null,
    registerNo: "",
    mediaName: "",
    category: "",
    subjectGroup: "",
    gradeLevel: "",
    quantityTotal: "1",
    quantityAvailable: "1",
    unit: "ชุด",
    pricePerUnit: "0",
    mediaStatus: MEDIA_REGISTRY_ITEM_STATUS.AVAILABLE as string,
    locationId: "",
    note: "",
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (cat.trim()) params.set("category", cat.trim());
      if (stFilter.trim()) params.set("mediaStatus", stFilter.trim());
      const r = await fetch(`/api/media-registry/items?${params.toString()}`, { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setItems((j.items as ItemRow[]) ?? []);
      const lr = await fetch("/api/media-registry/locations", { cache: "no-store" });
      const lj = await lr.json();
      if (lr.ok) setLocs((lj.items as Loc[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [q, cat, stFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 320);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const filteredCount = items.length;

  const startCreate = () => {
    setForm({
      id: null,
      registerNo: "",
      mediaName: "",
      category: "",
      subjectGroup: "",
      gradeLevel: "",
      quantityTotal: "1",
      quantityAvailable: "1",
      unit: "ชุด",
      pricePerUnit: "0",
      mediaStatus: MEDIA_REGISTRY_ITEM_STATUS.AVAILABLE,
      locationId: "",
      note: "",
    });
    setModalOpen(true);
  };

  const startEdit = (it: ItemRow) => {
    setForm({
      id: it.id,
      registerNo: it.registerNo,
      mediaName: it.mediaName,
      category: it.category,
      subjectGroup: it.subjectGroup ?? "",
      gradeLevel: it.gradeLevel ?? "",
      quantityTotal: String(it.quantityTotal),
      quantityAvailable: String(it.quantityAvailable),
      unit: it.unit,
      pricePerUnit: it.pricePerUnit,
      mediaStatus: it.mediaStatus,
      locationId: it.locationId ?? "",
      note: it.note ?? "",
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.mediaName.trim() || !form.category.trim()) {
      alert("กรุณากรอกชื่อสื่อและหมวด");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        mediaName: form.mediaName.trim(),
        category: form.category.trim(),
        subjectGroup: form.subjectGroup.trim() || null,
        gradeLevel: form.gradeLevel.trim() || null,
        quantityTotal: Number(form.quantityTotal) || 0,
        quantityAvailable: Number(form.quantityAvailable) || 0,
        unit: form.unit.trim() || "ชุด",
        pricePerUnit: form.pricePerUnit,
        mediaStatus: form.mediaStatus,
        locationId: form.locationId || null,
        note: form.note.trim() || null,
      };
      if (form.id) {
        if (form.registerNo.trim()) body.registerNo = form.registerNo.trim();
        const r = await fetch(`/api/media-registry/items/${form.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(j?.error ?? "บันทึกไม่สำเร็จ");
          return;
        }
      } else {
        if (form.registerNo.trim()) body.registerNo = form.registerNo.trim();
        const r = await fetch("/api/media-registry/items", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          alert(j?.error ?? "สร้างไม่สำเร็จ");
          return;
        }
      }
      setModalOpen(false);
      setFilterOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (it: ItemRow) => {
    if (!confirm(`ลบทะเบียน ${it.registerNo}?`)) return;
    const r = await fetch(`/api/media-registry/items/${it.id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j?.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await refresh();
  };

  const filterActive = useMemo(() => Boolean(q.trim() || cat.trim() || stFilter.trim()), [q, cat, stFilter]);

  return (
    <>
      <AppDashboardSection tone="violet">
        <AppSectionHeader
          tone="violet"
          title="ทะเบียนสื่อ"
          description={`${loading ? "…" : `${filteredCount} รายการ`} · ค้นหาและกรองสถานะ`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className={cn(
                  "sm:hidden min-h-[40px] min-w-[40px] rounded-xl border border-white/55 bg-white/75 px-2 text-[#4d47b6] shadow-inner",
                  filterActive && "ring-2 ring-[#4d47b6]/35",
                )}
                aria-label="เปิดตัวกรอง"
                onClick={() => setFilterOpen(true)}
              >
                ⛭
              </button>
              <button
                type="button"
                className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-2 sm:min-w-0 sm:px-4"
                aria-label="เพิ่มรายการสื่อ"
                onClick={startCreate}
              >
                <span className="hidden sm:inline">+ เพิ่มสื่อ</span>
                <span className="sm:hidden text-lg" aria-hidden>
                  +
                </span>
              </button>
            </div>
          }
        />

        <div className="mt-3 hidden gap-3 sm:grid sm:grid-cols-3">
          <input
            className={inputCls}
            placeholder="ค้นหา ชื่อ / เลขทะเบียน / หมวด"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className={inputCls}
            placeholder="หมวด (ตรง)"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          />
          <select
            className={inputCls}
            value={stFilter}
            onChange={(e) => setStFilter(e.target.value)}
          >
            <option value="">ทุกสถานะสื่อ</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState className="mt-4">ยังไม่มีทะเบียน — กด «เพิ่มสื่อ» หรือปรับตัวกรอง</AppEmptyState>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="flex gap-2 rounded-[1.25rem] border border-white/55 bg-white/75 px-3 py-2.5 sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#2e2a58]">
                    <span className="text-xs text-[#4d47b6]">{it.registerNo}</span> · {it.mediaName}
                  </p>
                  <p className="mt-0.5 text-xs text-[#66638c]">
                    {it.category} · คงเหลือ {it.quantityAvailable}/{it.quantityTotal} {it.unit} · {it.mediaStatus}
                  </p>
                  {it.locationLabel ? (
                    <p className="mt-0.5 text-xs text-[#5f5a8a]">ที่เก็บ: {it.locationLabel}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไข ${it.mediaName}`}
                    title="แก้ไข"
                    onClick={() => startEdit(it)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบ ${it.registerNo}`}
                    title="ลบ"
                    onClick={() => void remove(it)}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      {filterOpen ? (
        <div className="fixed inset-0 z-[200] sm:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#1e1b4b]/40"
            aria-label="ปิดตัวกรอง"
            onClick={() => setFilterOpen(false)}
          />
          <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] max-h-[70vh] overflow-y-auto rounded-[2rem] border border-white/55 bg-white/95 p-4 shadow-xl backdrop-blur-xl">
            <p className="font-bold text-[#2e2a58]">กรองข้อมูล</p>
            <div className="mt-3 space-y-3">
              <input
                className={inputCls}
                placeholder="ค้นหา"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <input className={inputCls} placeholder="หมวด" value={cat} onChange={(e) => setCat(e.target.value)} />
              <select className={inputCls} value={stFilter} onChange={(e) => setStFilter(e.target.value)}>
                <option value="">ทุกสถานะ</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="app-btn-primary w-full rounded-xl py-2.5 font-semibold"
                onClick={() => {
                  void refresh();
                  setFilterOpen(false);
                }}
              >
                ใช้ตัวกรอง
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "แก้ไขสื่อ" : "เพิ่มสื่อ"}
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={() => void submit()}
            submitLabel={submitting ? "กำลังบันทึก…" : "บันทึก"}
            submitDisabled={submitting}
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">เลขทะเบียน (ว่าง = สร้างอัตโนมัติ)</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={form.registerNo}
              onChange={(e) => setForm((f) => ({ ...f, registerNo: e.target.value }))}
              disabled={Boolean(form.id)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">ชื่อสื่อ *</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={form.mediaName}
              onChange={(e) => setForm((f) => ({ ...f, mediaName: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">หมวด *</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">สถานะสื่อ</span>
            <select
              className={cn(inputCls, "mt-1")}
              value={form.mediaStatus}
              onChange={(e) => setForm((f) => ({ ...f, mediaStatus: e.target.value }))}
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">จำนวนรวม</span>
            <input
              className={cn(inputCls, "mt-1")}
              type="number"
              min={0}
              value={form.quantityTotal}
              onChange={(e) => setForm((f) => ({ ...f, quantityTotal: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">คงเหลือ</span>
            <input
              className={cn(inputCls, "mt-1")}
              type="number"
              min={0}
              value={form.quantityAvailable}
              onChange={(e) => setForm((f) => ({ ...f, quantityAvailable: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">หน่วย</span>
            <input
              className={cn(inputCls, "mt-1")}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-[#66638c]">ราคาต่อหน่วย (บาท)</span>
            <input
              className={cn(inputCls, "mt-1")}
              type="number"
              min={0}
              step="0.01"
              value={form.pricePerUnit}
              onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">ที่เก็บ</span>
            <select
              className={cn(inputCls, "mt-1")}
              value={form.locationId}
              onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
            >
              <option value="">— ไม่ระบุ —</option>
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.locationDetail}
                </option>
              ))}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold text-[#66638c]">หมายเหตุ</span>
            <textarea
              className={cn(inputCls, "mt-1 min-h-[72px]")}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>
      </FormModal>
    </>
  );
}
