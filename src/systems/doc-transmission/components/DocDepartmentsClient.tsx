"use client";

import { useCallback, useState } from "react";
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
import { docFieldClass, docListRowCardClass } from "@/systems/doc-transmission/doc-ui-tokens";

type Department = {
  id: number;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  isInternal: boolean;
  isActive: boolean;
  sortOrder: number;
};

type FormValues = {
  id?: number;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  isInternal: boolean;
  sortOrder: number;
};

const inputClass = docFieldClass;

function blank(): FormValues {
  return {
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    isInternal: true,
    sortOrder: 0,
  };
}

export function DocDepartmentsClient({ initial }: { initial: Department[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(blank());
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/doc-transmission/departments");
    const json = (await res.json().catch(() => null)) as { items?: Department[] } | null;
    if (res.ok && json?.items) setItems(json.items);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/doc-transmission/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          contactPerson: form.contactPerson.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "บันทึกไม่สำเร็จ");
      }
      setOpen(false);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [form, refresh]);

  const handleDelete = useCallback(
    async (d: Department) => {
      if (!confirm(`ปิดใช้งาน "${d.name}"?`)) return;
      try {
        const res = await fetch(`/api/doc-transmission/departments/${d.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("ปิดใช้งานไม่สำเร็จ");
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "ปิดใช้งานไม่สำเร็จ");
      }
    },
    [refresh],
  );

  return (
    <AppDashboardSection tone="violet">
      <AppSectionHeader
        tone="violet"
        title="หน่วยงาน / แผนก"
        description="ใช้ผูกกับเอกสาร — ทั้งภายในและภายนอกองค์กร"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <button
            type="button"
            aria-label="เพิ่มหน่วยงาน"
            onClick={() => {
              setForm(blank());
              setOpen(true);
            }}
            className="app-btn-primary inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2.5 py-2 text-sm font-semibold sm:min-h-0 sm:min-w-0 sm:px-4 sm:py-2.5"
          >
            <span className="sm:hidden">+</span>
            <span className="hidden sm:inline">+ เพิ่มหน่วยงาน</span>
          </button>
        }
      />

      <div className="space-y-2">
        {items.length === 0 ? (
          <AppEmptyState>ยังไม่มีหน่วยงาน — กดปุ่ม &quot;+ เพิ่มหน่วยงาน&quot; เพื่อเริ่มต้น</AppEmptyState>
        ) : (
          items.map((d) => (
            <article
              key={d.id}
              className={cn(
                docListRowCardClass,
                "flex flex-wrap items-center gap-2",
                !d.isActive && "border-rose-200/80 opacity-60",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#2e2a58]">
                  <span className="font-mono text-[#5b61ff]">{d.code}</span> · {d.name}
                </p>
                <p className="text-[11px] text-[#5f5a8a]">
                  {d.isInternal ? "ภายใน" : "ภายนอก"}
                  {d.contactPerson ? ` · ${d.contactPerson}` : ""}
                  {d.phone ? ` · ${d.phone}` : ""}
                  {d.email ? ` · ${d.email}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={`แก้ไข ${d.name}`}
                  title="แก้ไข"
                  onClick={() => {
                    setForm({
                      id: d.id,
                      code: d.code,
                      name: d.name,
                      contactPerson: d.contactPerson ?? "",
                      phone: d.phone ?? "",
                      email: d.email ?? "",
                      isInternal: d.isInternal,
                      sortOrder: d.sortOrder,
                    });
                    setOpen(true);
                  }}
                  className={assetRowEditIconButtonClass}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                {d.isActive ? (
                  <button
                    type="button"
                    aria-label={`ปิดใช้งาน ${d.name}`}
                    title="ปิดใช้งาน"
                    onClick={() => void handleDelete(d)}
                    className={assetRowRemoveIconButtonClass}
                  >
                    <IconRowRemove className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>

      <FormModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "แก้ไขหน่วยงาน" : "เพิ่มหน่วยงาน"}
        description="ตั้งรหัสและชื่อหน่วยงาน — ใช้ผูกกับเอกสาร"
        footer={
          <FormModalFooterActions
            submitLabel={form.id ? "บันทึกการแก้ไข" : "เพิ่ม"}
            loading={busy}
            submitDisabled={!form.code.trim() || !form.name.trim()}
            onCancel={() => setOpen(false)}
            onSubmit={handleSave}
          />
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
                รหัส
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                className={inputClass}
                placeholder="เช่น VIC-1"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
                ชื่อหน่วยงาน
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
                ผู้ประสาน
              </label>
              <input
                type="text"
                maxLength={120}
                value={form.contactPerson}
                onChange={(e) => setForm((p) => ({ ...p, contactPerson: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">
                โทรศัพท์
              </label>
              <input
                type="text"
                maxLength={40}
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[#66638c]">อีเมล</label>
            <input
              type="email"
              maxLength={160}
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#2e2a58]">
            <input
              type="checkbox"
              checked={form.isInternal}
              onChange={(e) => setForm((p) => ({ ...p, isInternal: e.target.checked }))}
              className="h-4 w-4"
            />
            หน่วยงานภายในองค์กร
          </label>
        </form>
      </FormModal>
    </AppDashboardSection>
  );
}

