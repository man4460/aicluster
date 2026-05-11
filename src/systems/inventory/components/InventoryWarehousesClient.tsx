"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  inventoryInputClass,
  inventoryPrimaryButtonClass,
  inventoryRowEditIconButtonClass,
  inventoryRowRemoveIconButtonClass,
} from "@/systems/inventory/lib/inventory-ui";
import {
  fetchInventoryCategories,
  fetchInventoryWarehouses,
  inventoryFetchErrorMessage,
} from "@/systems/inventory/lib/inventory-client-data";
import {
  IconEdit,
  IconPlus,
  IconTrash,
} from "@/systems/inventory/components/InventoryIcons";
import type {
  InventoryCategoryRow,
  InventoryWarehouseRow,
} from "@/systems/inventory/components/types";

type WhFormState = {
  open: boolean;
  mode: "create" | "edit";
  target: InventoryWarehouseRow | null;
  code: string;
  name: string;
  address: string;
  isActive: boolean;
  busy: boolean;
  error: string | null;
};

type CatFormState = {
  open: boolean;
  mode: "create" | "edit";
  target: InventoryCategoryRow | null;
  name: string;
  isActive: boolean;
  busy: boolean;
  error: string | null;
};

const emptyWh: WhFormState = {
  open: false,
  mode: "create",
  target: null,
  code: "",
  name: "",
  address: "",
  isActive: true,
  busy: false,
  error: null,
};

const emptyCat: CatFormState = {
  open: false,
  mode: "create",
  target: null,
  name: "",
  isActive: true,
  busy: false,
  error: null,
};

export function InventoryWarehousesClient() {
  const [warehouses, setWarehouses] = useState<InventoryWarehouseRow[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [whForm, setWhForm] = useState<WhFormState>(emptyWh);
  const [catForm, setCatForm] = useState<CatFormState>(emptyCat);

  const [whDelete, setWhDelete] = useState<InventoryWarehouseRow | null>(null);
  const [whDeleteBusy, setWhDeleteBusy] = useState(false);
  const [whDeleteError, setWhDeleteError] = useState<string | null>(null);

  const [catDelete, setCatDelete] = useState<InventoryCategoryRow | null>(null);
  const [catDeleteBusy, setCatDeleteBusy] = useState(false);
  const [catDeleteError, setCatDeleteError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [r1, r2] = await Promise.all([fetchInventoryWarehouses(), fetchInventoryCategories()]);
      if (!r1.ok) setError(r1.error);
      else setWarehouses(r1.warehouses);
      if (r2.ok) setCategories(r2.categories);
    } catch (e) {
      setError(inventoryFetchErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openWhCreate() {
    setWhForm({ ...emptyWh, open: true });
  }
  function openWhEdit(wh: InventoryWarehouseRow) {
    setWhForm({
      open: true,
      mode: "edit",
      target: wh,
      code: wh.code,
      name: wh.name,
      address: wh.address ?? "",
      isActive: wh.isActive,
      busy: false,
      error: null,
    });
  }

  function openCatCreate() {
    setCatForm({ ...emptyCat, open: true });
  }
  function openCatEdit(c: InventoryCategoryRow) {
    setCatForm({
      open: true,
      mode: "edit",
      target: c,
      name: c.name,
      isActive: c.isActive,
      busy: false,
      error: null,
    });
  }

  async function submitWh() {
    if (!whForm.code.trim() || !whForm.name.trim()) {
      setWhForm((s) => ({ ...s, error: "กรอกรหัสและชื่อคลัง" }));
      return;
    }
    setWhForm((s) => ({ ...s, busy: true, error: null }));
    try {
      const url =
        whForm.mode === "create"
          ? "/api/inventory/warehouses"
          : `/api/inventory/warehouses/${whForm.target?.id}`;
      const method = whForm.mode === "create" ? "POST" : "PATCH";
      const body =
        whForm.mode === "create"
          ? {
              code: whForm.code.trim(),
              name: whForm.name.trim(),
              address: whForm.address.trim() || null,
            }
          : {
              code: whForm.code.trim(),
              name: whForm.name.trim(),
              address: whForm.address.trim() || null,
              isActive: whForm.isActive,
            };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setWhForm((s) => ({
          ...s,
          busy: false,
          error: j.error?.trim() || `บันทึกไม่สำเร็จ (รหัส ${res.status})`,
        }));
        return;
      }
      setWhForm(emptyWh);
      await reload();
    } catch (e) {
      setWhForm((s) => ({ ...s, busy: false, error: inventoryFetchErrorMessage(e) }));
    }
  }

  async function submitCat() {
    if (!catForm.name.trim()) {
      setCatForm((s) => ({ ...s, error: "กรอกชื่อหมวด" }));
      return;
    }
    setCatForm((s) => ({ ...s, busy: true, error: null }));
    try {
      const url =
        catForm.mode === "create"
          ? "/api/inventory/categories"
          : `/api/inventory/categories/${catForm.target?.id}`;
      const method = catForm.mode === "create" ? "POST" : "PATCH";
      const body =
        catForm.mode === "create"
          ? { name: catForm.name.trim() }
          : { name: catForm.name.trim(), isActive: catForm.isActive };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCatForm((s) => ({
          ...s,
          busy: false,
          error: j.error?.trim() || `บันทึกไม่สำเร็จ (รหัส ${res.status})`,
        }));
        return;
      }
      setCatForm(emptyCat);
      await reload();
    } catch (e) {
      setCatForm((s) => ({ ...s, busy: false, error: inventoryFetchErrorMessage(e) }));
    }
  }

  async function confirmWhDelete() {
    if (!whDelete) return;
    setWhDeleteBusy(true);
    setWhDeleteError(null);
    try {
      const res = await fetch(`/api/inventory/warehouses/${whDelete.id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setWhDeleteError(j.error?.trim() || `ลบไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setWhDelete(null);
      await reload();
    } catch (e) {
      setWhDeleteError(inventoryFetchErrorMessage(e));
    } finally {
      setWhDeleteBusy(false);
    }
  }

  async function confirmCatDelete() {
    if (!catDelete) return;
    setCatDeleteBusy(true);
    setCatDeleteError(null);
    try {
      const res = await fetch(`/api/inventory/categories/${catDelete.id}`, { method: "DELETE" });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setCatDeleteError(j.error?.trim() || `ลบไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setCatDelete(null);
      await reload();
    } catch (e) {
      setCatDeleteError(inventoryFetchErrorMessage(e));
    } finally {
      setCatDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
        >
          {error}
        </div>
      ) : null}

      <AppDashboardSection tone="violet" className="space-y-4">
        <AppSectionHeader
          title="คลัง / โกดัง"
          tone="violet"
          description={<span>ที่เก็บสินค้า — เพิ่มได้หลายแห่ง</span>}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              suppressHydrationWarning
              onClick={openWhCreate}
              aria-label="เพิ่มคลัง"
              className={inventoryPrimaryButtonClass}
            >
              <IconPlus className="h-5 w-5 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">+ เพิ่มคลัง</span>
            </button>
          }
        />
        {loading ? (
          <p className="text-center text-sm text-slate-500">กำลังโหลด…</p>
        ) : warehouses.length === 0 ? (
          <AppEmptyState tone="slate">
            ยังไม่มีคลัง — เริ่มเพิ่มคลังหลัก (เช่น «คลังหลัก»)
          </AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {warehouses.map((w) => (
              <li
                key={w.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2">
                    <span className="rounded-md bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                      {w.code}
                    </span>
                    {!w.isActive ? (
                      <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                        ปิดใช้งาน
                      </span>
                    ) : null}
                  </p>
                  <h3 className="mt-1 text-base font-black text-slate-900">{w.name}</h3>
                  {w.address ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{w.address}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => openWhEdit(w)}
                    className={inventoryRowEditIconButtonClass}
                    aria-label={`แก้ไข ${w.name}`}
                    title="แก้ไข"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setWhDeleteError(null);
                      setWhDelete(w);
                    }}
                    className={inventoryRowRemoveIconButtonClass}
                    aria-label={`ลบ ${w.name}`}
                    title="ลบ"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <AppDashboardSection className="space-y-3">
        <AppSectionHeader
          title="หมวดสินค้า"
          description={<span>แบ่งกลุ่มสินค้าให้กรองง่ายขึ้น</span>}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              suppressHydrationWarning
              onClick={openCatCreate}
              aria-label="เพิ่มหมวด"
              className={inventoryPrimaryButtonClass}
            >
              <IconPlus className="h-5 w-5 sm:hidden" aria-hidden />
              <span className="hidden sm:inline">+ เพิ่มหมวด</span>
            </button>
          }
        />
        {categories.length === 0 ? (
          <AppEmptyState tone="slate">ยังไม่มีหมวด — เพิ่มหมวดแรกได้เลย</AppEmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2.5 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                  {!c.isActive ? (
                    <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      ปิดใช้งาน
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => openCatEdit(c)}
                    className={inventoryRowEditIconButtonClass}
                    aria-label={`แก้ไข ${c.name}`}
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    suppressHydrationWarning
                    onClick={() => {
                      setCatDeleteError(null);
                      setCatDelete(c);
                    }}
                    className={inventoryRowRemoveIconButtonClass}
                    aria-label={`ลบ ${c.name}`}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppDashboardSection>

      <FormModal
        open={whForm.open}
        onClose={() => setWhForm(emptyWh)}
        title={whForm.mode === "create" ? "เพิ่มคลัง" : "แก้ไขคลัง"}
        description={whForm.mode === "edit" ? whForm.target?.name : "เพิ่มที่เก็บสินค้าใหม่"}
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => setWhForm(emptyWh)}
            onSubmit={submitWh}
            submitLabel={whForm.mode === "create" ? "บันทึก" : "บันทึกการแก้ไข"}
            loading={whForm.busy}
            submitDisabled={!whForm.code.trim() || !whForm.name.trim()}
          />
        }
      >
        <div className="space-y-3">
          {whForm.error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {whForm.error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">รหัสคลัง *</span>
            <input
              suppressHydrationWarning
              value={whForm.code}
              onChange={(e) => setWhForm((s) => ({ ...s, code: e.target.value }))}
              placeholder="เช่น MAIN, BR01"
              className={inventoryInputClass}
              maxLength={32}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">ชื่อคลัง *</span>
            <input
              suppressHydrationWarning
              value={whForm.name}
              onChange={(e) => setWhForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="คลังหลัก / สาขา 1"
              className={inventoryInputClass}
              maxLength={120}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">ที่อยู่</span>
            <input
              suppressHydrationWarning
              value={whForm.address}
              onChange={(e) => setWhForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="ที่อยู่ (ถ้ามี)"
              className={inventoryInputClass}
              maxLength={255}
            />
          </label>
          {whForm.mode === "edit" ? (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                suppressHydrationWarning
                checked={whForm.isActive}
                onChange={(e) => setWhForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              เปิดใช้งาน
            </label>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={catForm.open}
        onClose={() => setCatForm(emptyCat)}
        title={catForm.mode === "create" ? "เพิ่มหมวดสินค้า" : "แก้ไขหมวดสินค้า"}
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => setCatForm(emptyCat)}
            onSubmit={submitCat}
            submitLabel={catForm.mode === "create" ? "บันทึก" : "บันทึกการแก้ไข"}
            loading={catForm.busy}
            submitDisabled={!catForm.name.trim()}
          />
        }
      >
        <div className="space-y-3">
          {catForm.error ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {catForm.error}
            </p>
          ) : null}
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-slate-700">ชื่อหมวด *</span>
            <input
              suppressHydrationWarning
              value={catForm.name}
              onChange={(e) => setCatForm((s) => ({ ...s, name: e.target.value }))}
              placeholder="เช่น เครื่องดื่ม / ของใช้สำนักงาน"
              className={inventoryInputClass}
              maxLength={120}
            />
          </label>
          {catForm.mode === "edit" ? (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                suppressHydrationWarning
                checked={catForm.isActive}
                onChange={(e) => setCatForm((s) => ({ ...s, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              เปิดใช้งาน
            </label>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={Boolean(whDelete)}
        onClose={() => setWhDelete(null)}
        title="ยืนยันการลบคลัง"
        description={whDelete?.name ?? ""}
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => setWhDelete(null)}
            onSubmit={confirmWhDelete}
            submitLabel="ลบคลัง"
            danger
            loading={whDeleteBusy}
          />
        }
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            ลบ <strong>{whDelete?.name}</strong> ออกจากระบบ — สต๊อกในคลังนี้และประวัติเคลื่อนไหวที่
            เกี่ยวข้องจะถูกลบไปด้วย
          </p>
          {whDeleteError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {whDeleteError}
            </p>
          ) : null}
        </div>
      </FormModal>

      <FormModal
        open={Boolean(catDelete)}
        onClose={() => setCatDelete(null)}
        title="ยืนยันการลบหมวด"
        description={catDelete?.name ?? ""}
        size="sm"
        footer={
          <FormModalFooterActions
            onCancel={() => setCatDelete(null)}
            onSubmit={confirmCatDelete}
            submitLabel="ลบหมวด"
            danger
            loading={catDeleteBusy}
          />
        }
      >
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            ลบหมวด <strong>{catDelete?.name}</strong> — สินค้าที่ใช้หมวดนี้จะถูกตั้งเป็น
            «ไม่ระบุหมวด»
          </p>
          {catDeleteError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
              {catDeleteError}
            </p>
          ) : null}
        </div>
      </FormModal>
    </div>
  );
}
