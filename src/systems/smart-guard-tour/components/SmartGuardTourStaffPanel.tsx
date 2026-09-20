"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppEmptyState,
  AppImageThumb,
  AppSectionHeader,
  prepareImageFileForUpload,
  useAppImageLightbox,
  useAppNoticePopup,
  AppImageLightbox,
} from "@/components/app-templates";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import { cn } from "@/lib/cn";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import {
  smartGuardTourFieldClass,
  smartGuardTourOutlineButtonClass,
  smartGuardTourPanelClass,
  smartGuardTourPrimaryButtonClass,
} from "@/systems/smart-guard-tour/lib/ui-tokens";

type StaffRow = {
  id: string;
  displayName: string;
  phone: string | null;
  photoUrl: string | null;
  isActive: boolean;
};

type FormState = {
  displayName: string;
  phone: string;
  photoUrl: string | null;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  displayName: "",
  phone: "",
  photoUrl: null,
  isActive: true,
});

export function SmartGuardTourStaffPanel() {
  const notice = useAppNoticePopup();
  const lb = useAppImageLightbox();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/smart-guard-tour/session/staff", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "โหลดไม่สำเร็จ");
      setRows((data.staff as StaffRow[]) ?? []);
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [notice]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtersActive = Boolean(q.trim()) || statusFilter !== "all";

  const filtered = rows.filter((r) => {
    if (statusFilter === "active" && !r.isActive) return false;
    if (statusFilter === "inactive" && r.isActive) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.displayName.toLowerCase().includes(needle) ||
      (r.phone ?? "").includes(needle)
    );
  });

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(row: StaffRow) {
    setEditingId(row.id);
    setForm({
      displayName: row.displayName,
      phone: row.phone ?? "",
      photoUrl: row.photoUrl,
      isActive: row.isActive,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function uploadPhoto(file: File) {
    setBusy(true);
    try {
      const prepared = await prepareImageFileForUpload(file);
      const fd = new FormData();
      fd.set("file", prepared);
      fd.set("kind", "images");
      const res = await fetch("/api/smart-guard-tour/session/upload", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = (await res.json()) as { imageUrl?: string; error?: string };
      if (!res.ok || !json.imageUrl) throw new Error(json.error ?? "อัปโหลดไม่สำเร็จ");
      setForm((f) => ({ ...f, photoUrl: json.imageUrl! }));
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!form.displayName.trim()) {
      notice.error("กรอกชื่อพนักงาน");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        displayName: form.displayName.trim(),
        phone: form.phone.trim() || null,
        photoUrl: form.photoUrl,
        isActive: form.isActive,
      };
      const res = await fetch(
        editingId
          ? `/api/smart-guard-tour/session/staff/${editingId}`
          : "/api/smart-guard-tour/session/staff",
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "บันทึกไม่สำเร็จ");
      notice.success(editingId ? "อัปเดตพนักงานแล้ว" : "เพิ่มพนักงานแล้ว");
      closeModal();
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function removeRow(row: StaffRow) {
    setBusy(true);
    try {
      const res = await fetch(`/api/smart-guard-tour/session/staff/${row.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบไม่สำเร็จ");
      notice.success(data.softDeactivated ? "ปิดใช้งานแล้ว (ซิงค์ไปเช็คอิน)" : "ลบแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn(smartGuardTourPanelClass, "p-4 sm:p-5")}>
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปพนักงาน" />
      <AppSectionHeader
        tone="violet"
        title="พนักงาน รปภ."
        description="ชื่อ · เบอร์ · รูป · สถานะ — เมื่อเปิดเชื่อมระบบจะซิงค์กับรายชื่อเช็คอิน"
        className="flex flex-row items-start justify-between gap-3 sm:items-center"
        actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
        action={
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              aria-expanded={filterOpen}
              aria-controls="sgt-staff-filter"
              aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
              className={cn(
                smartGuardTourOutlineButtonClass,
                "relative min-w-[40px] sm:min-w-0",
                filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10",
                filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
              )}
              onClick={() => setFilterOpen((o) => !o)}
            >
              <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
              <span className="sm:hidden">⚙</span>
              {filtersActive && !filterOpen ? (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden />
              ) : null}
            </button>
            <button
              type="button"
              aria-label="เพิ่มพนักงาน"
              className={cn(smartGuardTourPrimaryButtonClass, "min-w-[40px] sm:min-w-0")}
              onClick={openAdd}
            >
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">+ เพิ่มพนักงาน</span>
            </button>
          </div>
        }
      />

      <div
        id="sgt-staff-filter"
        className={cn("mt-3 space-y-2", filterOpen ? "block" : "hidden")}
      >
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="กรองสถานะ">
          {(
            [
              ["all", "ทั้งหมด"],
              ["active", "ใช้งาน"],
              ["inactive", "ปิด"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={statusFilter === key}
              className={cn(
                smartGuardTourOutlineButtonClass,
                statusFilter === key && "border-[#0000BF]/45 bg-[#0000BF]/10 text-[#4d47b6]",
              )}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className={smartGuardTourFieldClass}
          placeholder="ค้นหาชื่อหรือเบอร์"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {filtersActive ? (
          <button
            type="button"
            className={cn(smartGuardTourOutlineButtonClass, "text-xs")}
            onClick={() => {
              setQ("");
              setStatusFilter("all");
            }}
          >
            ล้างกรอง
          </button>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-[#66638c]">กำลังโหลด…</p>
        ) : filtered.length === 0 ? (
          <AppEmptyState>
            {rows.length === 0 ? "ยังไม่มีพนักงาน" : "ไม่พบรายการตามตัวกรอง"}
          </AppEmptyState>
        ) : (
          filtered.map((row) => (
            <div
              key={row.id}
              className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200/80 bg-slate-50/50 p-3"
            >
              <AppImageThumb
                src={row.photoUrl}
                alt={row.displayName}
                className="h-14 w-14 shrink-0"
                onOpen={() => row.photoUrl && lb.open(row.photoUrl)}
                emptyLabel="ไม่มีรูป"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#1e1b4b]">{row.displayName}</p>
                <p className="truncate text-xs text-[#66638c]" title={row.phone ?? undefined}>
                  {row.phone || "ไม่มีเบอร์"}
                </p>
                <p className="mt-0.5 text-[10px] font-bold text-[#5f5a8a]">
                  {row.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  className={assetRowEditIconButtonClass}
                  aria-label={`แก้ไข ${row.displayName}`}
                  title="แก้ไข"
                  onClick={() => openEdit(row)}
                >
                  <IconRowEdit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={assetRowRemoveIconButtonClass}
                  aria-label={`ลบ ${row.displayName}`}
                  title="ลบ / ปิดใช้งาน"
                  disabled={busy}
                  onClick={() => void removeRow(row)}
                >
                  <IconRowRemove className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
        description="เมื่อเปิดเชื่อมเช็คอิน — ชื่อ เบอร์ รูป สถานะจะซิงค์สองทาง"
        size="md"
        footer={
          <FormModalFooterActions
            onCancel={closeModal}
            onSubmit={() => void save()}
            submitLabel={editingId ? "บันทึก" : "เพิ่ม"}
            submitDisabled={!form.displayName.trim() || busy}
            loading={busy}
          />
        }
      >
        <div className="space-y-3">
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            ชื่อ
            <input
              className={smartGuardTourFieldClass}
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              disabled={busy}
            />
          </label>
          <label className="block space-y-1 text-xs font-bold text-[#4d47b6]">
            เบอร์โทร
            <input
              className={smartGuardTourFieldClass}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              disabled={busy}
              inputMode="tel"
            />
          </label>
          <div className="space-y-2">
            <p className="text-xs font-bold text-[#4d47b6]">รูปโปรไฟล์</p>
            <div className="flex items-center gap-3">
              <AppImageThumb
                src={form.photoUrl}
                alt="พรีวิว"
                className="h-16 w-16"
                onOpen={() => form.photoUrl && lb.open(form.photoUrl)}
                emptyLabel="ไม่มีรูป"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void uploadPhoto(f);
                }}
              />
              <button
                type="button"
                className={smartGuardTourOutlineButtonClass}
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                เลือกรูป
              </button>
              {form.photoUrl ? (
                <button
                  type="button"
                  className={smartGuardTourOutlineButtonClass}
                  disabled={busy}
                  onClick={() => setForm((f) => ({ ...f, photoUrl: null }))}
                >
                  ลบรูป
                </button>
              ) : null}
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#1e1b4b]">
            <input
              type="checkbox"
              checked={form.isActive}
              disabled={busy}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            ใช้งาน
          </label>
        </div>
      </FormModal>
    </div>
  );
}
