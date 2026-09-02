"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, Plus } from "lucide-react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppImageLightbox,
  AppImageThumb,
  AppSectionHeader,
  appTemplateOutlineButtonClass,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
} from "@/components/app-templates";
import { FormModal } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { formatBangkokDateTimeLong } from "@/lib/time/bangkok";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import type { ClubEventFinanceDto } from "@/systems/club-event/lib/mappers";
import { CLUB_EVENT_FINANCE_TYPE_LABELS } from "@/systems/club-event/lib/mappers";
import {
  clubEventFieldClass,
  clubEventFilterChipClass,
  clubEventFixedBottomActionClass,
  clubEventPanelClass,
  clubEventRowCardClass,
} from "@/systems/club-event/lib/ui-tokens";

export function ClubEventFinanceClient() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [filterOpen, setFilterOpen] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"" | "INCOME" | "EXPENSE">("");
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [rows, setRows] = useState<ClubEventFinanceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    type: "INCOME" as "INCOME" | "EXPENSE",
    category: "",
    amountBaht: "",
    transactedAt: new Date().toISOString().slice(0, 16),
    note: "",
    slipUrl: "" as string | null,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = typeFilter ? `?type=${typeFilter}` : "";
      const res = await fetch(`/api/club-event/session/finance${q}`);
      const data = (await res.json()) as {
        summary?: { income: number; expense: number; balance: number };
        transactions?: ClubEventFinanceDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "โหลดไม่สำเร็จ");
      setSummary(data.summary ?? { income: 0, expense: 0, balance: 0 });
      setRows(data.transactions ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [typeFilter, notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setForm({
      id: "",
      type: "INCOME",
      category: "",
      amountBaht: "",
      transactedAt: new Date().toISOString().slice(0, 16),
      note: "",
      slipUrl: null,
    });
    setModalOpen(true);
  };

  const openEdit = (row: ClubEventFinanceDto) => {
    setForm({
      id: row.id,
      type: row.type,
      category: row.category,
      amountBaht: String(row.amountBaht),
      transactedAt: row.transactedAt.slice(0, 16),
      note: row.note,
      slipUrl: row.slipUrl,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const amountBaht = Number(form.amountBaht);
    if (!form.category.trim() || !Number.isFinite(amountBaht) || amountBaht <= 0) {
      notice.error("กรอกหมวดและจำนวนเงิน");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type: form.type,
        category: form.category,
        amountBaht,
        transactedAt: new Date(form.transactedAt).toISOString(),
        note: form.note,
        slipUrl: form.slipUrl,
      };
      const res = await fetch(
        form.id ? `/api/club-event/session/finance/${form.id}` : "/api/club-event/session/finance",
        {
          method: form.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "บันทึกไม่สำเร็จ");
      setModalOpen(false);
      await load();
      notice.success("บันทึกแล้ว");
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("ลบรายการนี้?")) return;
    try {
      const res = await fetch(`/api/club-event/session/finance/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "ลบไม่สำเร็จ");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const uploadSlip = async (file: File) => {
    try {
      const prepared = await prepareImageFileForUpload(file);
      const formData = new FormData();
      formData.set("file", prepared);
      const res = await fetch("/api/club-event/session/images/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "อัปโหลดไม่สำเร็จ");
      setForm((f) => ({ ...f, slipUrl: data.imageUrl ?? null }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-3">
      {notice.popup}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={cn(clubEventPanelClass, "p-4")}>
          <p className="text-xs text-[#66638c]">รายรับ</p>
          <p className="text-lg font-black text-emerald-700">{summary.income.toLocaleString("th-TH")} ฿</p>
        </div>
        <div className={cn(clubEventPanelClass, "p-4")}>
          <p className="text-xs text-[#66638c]">รายจ่าย</p>
          <p className="text-lg font-black text-rose-600">{summary.expense.toLocaleString("th-TH")} ฿</p>
        </div>
        <div className={cn(clubEventPanelClass, "col-span-2 p-4 sm:col-span-1")}>
          <p className="text-xs text-[#66638c]">คงเหลือ</p>
          <p className="text-lg font-black text-[#1e1b4b]">{summary.balance.toLocaleString("th-TH")} ฿</p>
        </div>
      </div>

      <AppDashboardSection className={clubEventPanelClass}>
        <AppSectionHeader
          title="บัญชีรายรับ–รายจ่าย"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-expanded={filterOpen}
                aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
                className={cn(
                  appTemplateOutlineButtonClass,
                  "relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center sm:min-w-0 sm:px-3",
                  filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                )}
                onClick={() => setFilterOpen((o) => !o)}
              >
                <Filter className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              </button>
              <button type="button" className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center sm:min-w-0 sm:px-4" aria-label="เพิ่มรายการ" onClick={openCreate}>
                <Plus className="h-5 w-5 sm:hidden" aria-hidden />
                <span className="hidden sm:inline">+ เพิ่มรายการ</span>
              </button>
            </div>
          }
        />

        {filterOpen ? (
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
            {(["", "INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t || "all"}
                type="button"
                role="tab"
                aria-selected={typeFilter === t}
                className={cn("min-h-8 rounded-lg px-3 text-[11px] font-black sm:min-h-9 sm:text-xs", clubEventFilterChipClass(typeFilter === t))}
                onClick={() => setTypeFilter(t)}
              >
                {t === "" ? "ทั้งหมด" : CLUB_EVENT_FINANCE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : rows.length === 0 ? (
          <AppEmptyState tone="violet">ยังไม่มีรายการ</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className={clubEventRowCardClass}>
                <div className="min-w-0 flex-1">
                  <p className="font-black text-[#1e1b4b]">{row.category}</p>
                  <p className="text-sm text-[#66638c]">{formatBangkokDateTimeLong(row.transactedAt)}</p>
                  {row.note ? <p className="text-xs text-[#5f5a8a]">{row.note}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {row.slipUrl ? <AppImageThumb src={row.slipUrl} alt="สลิป" onOpen={() => lb.open(row.slipUrl!)} /> : null}
                  <p className={cn("text-base font-black", row.type === "INCOME" ? "text-emerald-700" : "text-rose-600")}>
                    {row.type === "EXPENSE" ? "-" : "+"}
                    {row.amountBaht.toLocaleString("th-TH")} ฿
                  </p>
                  <button type="button" className={assetRowEditIconButtonClass} aria-label={`แก้ไข ${row.category}`} onClick={() => openEdit(row)}>
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button type="button" className={assetRowRemoveIconButtonClass} aria-label={`ลบ ${row.category}`} onClick={() => void remove(row.id)}>
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={form.id ? "แก้ไขรายการ" : "เพิ่มรายการ"}
        footer={
          <div className={clubEventFixedBottomActionClass}>
            <button type="button" className="app-btn-primary w-full min-h-[48px] rounded-xl sm:w-auto sm:px-6" disabled={saving} onClick={() => void save()}>
              บันทึก
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["INCOME", "EXPENSE"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={cn("flex-1 min-h-10 rounded-xl text-sm font-black", clubEventFilterChipClass(form.type === t))}
                onClick={() => setForm({ ...form, type: t })}
              >
                {CLUB_EVENT_FINANCE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <input className={clubEventFieldClass} placeholder="หมวดหมู่" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className={clubEventFieldClass} placeholder="จำนวนเงิน (บาท)" inputMode="numeric" value={form.amountBaht} onChange={(e) => setForm({ ...form, amountBaht: e.target.value })} />
          <input type="datetime-local" className={clubEventFieldClass} value={form.transactedAt} onChange={(e) => setForm({ ...form, transactedAt: e.target.value })} />
          <textarea className={cn(clubEventFieldClass, "min-h-[80px]")} placeholder="หมายเหตุ" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <label className={cn(appTemplateOutlineButtonClass, "inline-flex cursor-pointer items-center gap-2")}>
            แนบสลิป
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadSlip(f); e.target.value = ""; }} />
          </label>
          {form.slipUrl ? <AppImageThumb src={form.slipUrl} alt="สลิป" onOpen={() => lb.open(form.slipUrl!)} /> : null}
        </div>
      </FormModal>
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="สลิป" />
    </div>
  );
}
