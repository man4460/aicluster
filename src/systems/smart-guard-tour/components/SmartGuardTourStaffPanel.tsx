"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";
import {
  AppEmptyState,
  AppImageThumb,
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
  smartGuardTourCardIconTileClass,
  smartGuardTourTonedRowCardClass,
} from "@/systems/smart-guard-tour/lib/card-tones";
import {
  smartGuardTourFieldClass,
  smartGuardTourFilterChipClass,
  smartGuardTourFilterChipShellClass,
  smartGuardTourOutlineButtonClass,
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

function IconFilterFunnel({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" strokeLinejoin="round" />
    </svg>
  );
}

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
  const countActive = rows.filter((r) => r.isActive).length;
  const countInactive = rows.length - countActive;

  const filtered = rows.filter((r) => {
    if (statusFilter === "active" && !r.isActive) return false;
    if (statusFilter === "inactive" && r.isActive) return false;
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      r.displayName.toLowerCase().includes(needle) || (r.phone ?? "").includes(needle)
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
      notice.success(data.softDeactivated ? "ปิดใช้งานแล้ว" : "ลบแล้ว");
      await load();
    } catch (e) {
      notice.error(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 space-y-3">
      {notice.popup}
      <AppImageLightbox src={lb.src} onClose={lb.close} alt="รูปพนักงาน" />

      <div className="flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black tracking-tight text-[#1e1b4b] sm:text-base">พนักงาน รปภ.</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-expanded={filterOpen}
            aria-controls="sgt-staff-filter"
            aria-label={filterOpen ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}
            title={filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}
            className={cn(
              smartGuardTourOutlineButtonClass,
              "relative min-w-[40px] sm:min-w-0",
              filterOpen && "border-[#0000BF]/45 bg-[#0000BF]/10 ring-2 ring-[#0000BF]/20",
              filtersActive && !filterOpen && "border-amber-300/80 bg-amber-50/90",
            )}
            onClick={() => setFilterOpen((o) => !o)}
          >
            <IconFilterFunnel className="h-4 w-4" />
            <span className="hidden sm:inline">{filterOpen ? "ซ่อนกรอง" : "แสดงกรอง"}</span>
            {filtersActive ? (
              <span
                className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] ring-2 ring-white"
                aria-hidden
              />
            ) : null}
          </button>
          <button
            type="button"
            aria-label="เพิ่มพนักงาน"
            className={cn(smartGuardTourPrimaryButtonClass, "min-w-[40px] sm:min-w-0")}
            onClick={openAdd}
          >
            <span className="sm:hidden" aria-hidden>
              +
            </span>
            <span className="hidden sm:inline">+ เพิ่มพนักงาน</span>
          </button>
        </div>
      </div>

      <div id="sgt-staff-filter" className={cn("space-y-2.5", filterOpen ? "block" : "hidden")}>
        <div className={smartGuardTourFilterChipShellClass} role="tablist" aria-label="กรองสถานะพนักงาน">
          {(
            [
              ["all", "ทั้งหมด", rows.length],
              ["active", "ใช้งาน", countActive],
              ["inactive", "ปิด", countInactive],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={statusFilter === key}
              className={smartGuardTourFilterChipClass(statusFilter === key)}
              onClick={() => setStatusFilter(key)}
            >
              {label} ({count})
            </button>
          ))}
        </div>
        <input
          className={smartGuardTourFieldClass}
          placeholder="ค้นหาชื่อหรือเบอร์"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="ค้นหาพนักงาน"
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
        <p className="text-xs font-bold tabular-nums text-[#2e2a58]">
          {filtersActive ? `${filtered.length}/${rows.length}` : rows.length} รายการ
        </p>
      </div>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm font-medium text-[#66638c]">กำลังโหลด…</p>
        ) : filtered.length === 0 ? (
          <AppEmptyState>
            {rows.length === 0 ? "ยังไม่มีพนักงาน" : "ไม่พบตามตัวกรอง"}
          </AppEmptyState>
        ) : (
          filtered.map((row) => {
            const tone = row.isActive ? "emerald" : "slate";
            return (
              <div key={row.id} className={smartGuardTourTonedRowCardClass(tone)}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {row.photoUrl ? (
                    <AppImageThumb
                      src={row.photoUrl}
                      alt={row.displayName}
                      className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
                      onOpen={() => lb.open(row.photoUrl!)}
                    />
                  ) : (
                    <span className={smartGuardTourCardIconTileClass(tone)} aria-hidden>
                      <Users className="h-5 w-5" strokeWidth={2.25} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="line-clamp-2 text-balance text-sm font-black text-[#1e1b4b]">
                      {row.displayName}
                    </p>
                    <p
                      className="truncate text-xs font-medium text-[#66638c]"
                      title={row.phone ?? undefined}
                    >
                      {row.phone || "ไม่มีเบอร์"}
                    </p>
                    <p className={cn("mt-0.5 text-[10px] font-bold", row.isActive ? "text-emerald-800/80" : "text-slate-600")}>
                      {row.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 self-start sm:self-center">
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
            );
          })
        )}
      </div>

      <FormModal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
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
              {form.photoUrl ? (
                <AppImageThumb
                  src={form.photoUrl}
                  alt="พรีวิว"
                  className="h-16 w-16"
                  onOpen={() => lb.open(form.photoUrl!)}
                />
              ) : (
                <span className={smartGuardTourCardIconTileClass("sky", "lg")} aria-hidden>
                  <Users className="h-6 w-6" strokeWidth={2.25} />
                </span>
              )}
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
