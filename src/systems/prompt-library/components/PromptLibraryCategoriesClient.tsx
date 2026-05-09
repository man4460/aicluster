"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";

type CategoryRow = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  sortOrder: number;
};

export function PromptLibraryCategoriesClient() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📁");
  const [color, setColor] = useState("#64748b");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/prompt-library/categories", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: CategoryRow[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  const openCreate = () => {
    setEditing(null);
    setName("");
    setIcon("📁");
    setColor("#64748b");
    setDescription("");
    setModalOpen(true);
  };

  const openEdit = (row: CategoryRow) => {
    setEditing(row);
    setName(row.name);
    setIcon(row.icon);
    setColor(row.color);
    setDescription(row.description ?? "");
    setModalOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      showToast("กรุณาระบุชื่อหมวด");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/prompt-library/categories/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            icon: icon.trim() || "📁",
            color: color.trim() || "#64748b",
            description: description.trim() || null,
          }),
        });
        if (!res.ok) {
          showToast("บันทึกไม่สำเร็จ");
          return;
        }
        showToast("อัปเดตหมวดแล้ว");
      } else {
        const res = await fetch("/api/prompt-library/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            icon: icon.trim() || "📁",
            color: color.trim() || "#64748b",
            description: description.trim() || null,
          }),
        });
        if (!res.ok) {
          showToast("สร้างไม่สำเร็จ");
          return;
        }
        showToast("เพิ่มหมวดแล้ว");
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: CategoryRow) => {
    if (!window.confirm(`ลบหมวด «${row.name}» ? คำสั่งในหมวดนี้จะไม่ถูกลบ แต่จะไม่มีหมวดแปะ`)) return;
    const res = await fetch(`/api/prompt-library/categories/${row.id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("ลบหมวดแล้ว");
      await load();
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(err.error ?? "ลบไม่ได้");
    }
  };

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[80] max-w-sm -translate-x-1/2 rounded-2xl border border-white/60 bg-[#1e1b4b]/92 px-4 py-2 text-center text-sm text-white shadow-lg sm:bottom-6"
        >
          {toast}
        </div>
      ) : null}

      <AppDashboardSection tone="slate">
        <AppSectionHeader
          tone="slate"
          title="หมวดหมู่"
          description="จัดกลุ่ม prompt — ชุดเริ่มต้นจะถูกสร้างอัตโนมัติเมื่อเปิดครั้งแรก"
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              onClick={openCreate}
              className="app-btn-primary min-h-[40px] min-w-[40px] rounded-xl px-2 sm:min-w-0 sm:px-4"
              aria-label="เพิ่มหมวดหมู่"
            >
              <span className="sm:hidden text-lg" aria-hidden>
                +
              </span>
              <span className="hidden sm:inline">+ เพิ่มหมวด</span>
            </button>
          }
        />

        {loading ? (
          <p className="mt-6 text-center text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {items.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/55 bg-white/75 px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg text-white shadow-sm"
                    style={{ backgroundColor: row.color }}
                    aria-hidden
                  >
                    {row.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold text-[#1e1b4b]">{row.name}</p>
                    {row.description ? <p className="truncate text-xs text-[#66638c]">{row.description}</p> : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className={assetRowEditIconButtonClass}
                    aria-label={`แก้ไขหมวด ${row.name}`}
                    title="แก้ไข"
                    onClick={() => openEdit(row)}
                  >
                    <IconRowEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={assetRowRemoveIconButtonClass}
                    aria-label={`ลบหมวด ${row.name}`}
                    title="ลบ"
                    onClick={() => void remove(row)}
                  >
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
        title={editing ? "แก้ไขหมวด" : "หมวดใหม่"}
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={() => setModalOpen(false)}
            onSubmit={save}
            submitLabel={editing ? "บันทึก" : "สร้าง"}
            loading={saving}
          />
        }
      >
        <div className="space-y-3 px-1 py-1">
          <div>
            <label className="text-xs font-semibold text-[#66638c]">ชื่อ *</label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#66638c]">ไอคอน</label>
              <input
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={icon}
                maxLength={12}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#66638c]">สี</label>
              <input
                type="color"
                className="mt-1 h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-1"
                value={color.length === 7 ? color : "#64748b"}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#66638c]">คำอธิบาย</label>
            <input
              className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-200 px-3 text-sm"
              value={description}
              maxLength={300}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </FormModal>
    </div>
  );
}
