"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import { assetFieldClass, assetListRowCardClass } from "@/systems/asset/asset-ui-tokens";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type Row = {
  id: number;
  code: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  isActive: boolean;
};

const inputCls = assetFieldClass;

export function AssetSuppliersClient() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    id: null as number | null,
    code: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    taxId: "",
    isActive: true,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/asset/suppliers", { cache: "no-store" });
      const j = await r.json();
      if (r.ok) setItems((j.items as Row[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startCreate = () => {
    setForm({
      id: null,
      code: "",
      name: "",
      contactPerson: "",
      phone: "",
      email: "",
      address: "",
      taxId: "",
      isActive: true,
    });
    setModalOpen(true);
  };

  const startEdit = (it: Row) => {
    setForm({
      id: it.id,
      code: it.code,
      name: it.name,
      contactPerson: it.contactPerson ?? "",
      phone: it.phone ?? "",
      email: it.email ?? "",
      address: it.address ?? "",
      taxId: it.taxId ?? "",
      isActive: it.isActive,
    });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      alert("กรุณากรอกรหัสและชื่อ");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        code: form.code.trim(),
        name: form.name.trim(),
        contactPerson: form.contactPerson.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        taxId: form.taxId.trim() || null,
        isActive: form.isActive,
      };
      if (form.id) body.id = form.id;
      const r = await fetch("/api/asset/suppliers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        alert(j?.error ?? "บันทึกไม่สำเร็จ");
        return;
      }
      setModalOpen(false);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (it: Row) => {
    if (!confirm(`ปิดการใช้งานผู้ขาย "${it.name}"?`)) return;
    const r = await fetch(`/api/asset/suppliers/${it.id}`, { method: "DELETE" });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j?.error ?? "ลบไม่สำเร็จ");
      return;
    }
    await refresh();
  };

  return (
    <AppDashboardSection tone="slate">
      <AppSectionHeader
        tone="slate"
        title="ผู้ขาย/ผู้จัดจำหน่าย"
        description="ข้อมูลผู้ขายสำหรับผูกกับทรัพย์สิน"
        action={
          <button
            type="button"
            onClick={startCreate}
            className="app-btn-primary inline-flex min-h-[40px] items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold sm:min-h-0"
          >
            + เพิ่มผู้ขาย
          </button>
        }
      />
      <div className="mt-4">
        {loading ? (
          <p className="py-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : items.length === 0 ? (
          <AppEmptyState>ยังไม่มีผู้ขาย</AppEmptyState>
        ) : (
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className={cn(assetListRowCardClass, "flex flex-wrap items-center justify-between gap-3")}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[#66638c]">{it.code}</span>
                    {!it.isActive ? (
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                        ปิดใช้
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-sm font-bold text-[#2e2a58]">{it.name}</p>
                  <p className="text-[11px] text-[#66638c]">
                    {[it.contactPerson, it.phone, it.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(it)}
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขผู้ขาย ${it.name}`}
                    title="แก้ไข"
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  {it.isActive ? (
                    <button
                      type="button"
                      onClick={() => remove(it)}
                      className={assetRowRemoveIconButtonClass}
                      aria-label={`ปิดการใช้งานผู้ขาย ${it.name}`}
                      title="ปิดการใช้งาน"
                    >
                      <IconRowRemove className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={() => (submitting ? null : setModalOpen(false))}
        title={form.id ? "แก้ไขผู้ขาย" : "เพิ่มผู้ขาย"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={submit}
            submitLabel="บันทึก"
            loading={submitting}
            submitDisabled={!form.code.trim() || !form.name.trim()}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="รหัส *">
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className={inputCls}
              placeholder="SUP-001"
            />
          </Field>
          <Field label="ชื่อบริษัท/ผู้ขาย *">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="ผู้ติดต่อ">
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="โทรศัพท์">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="อีเมล">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="เลขผู้เสียภาษี">
            <input
              type="text"
              value={form.taxId}
              onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="ที่อยู่">
              <textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className={cn(inputCls, "min-h-[60px]")}
                rows={2}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#66638c] sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            เปิดใช้งาน
          </label>
        </div>
      </FormModal>
    </AppDashboardSection>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-[#66638c]">{label}</span>
      {children}
    </label>
  );
}
