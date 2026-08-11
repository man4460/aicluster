"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  AppDashboardSection,
  AppEmptyState,
  AppSectionHeader,
} from "@/components/app-templates";
import { appDashboardBrandGradientFillClass } from "@/components/app-templates/dashboard-tokens";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  VAULT_CATEGORIES,
  findVaultBrandPreset,
} from "@/systems/vault/lib/brand-presets";
import { VaultBrandAvatar } from "@/systems/vault/components/VaultBrandAvatar";
import {
  VaultEntryFormModal,
  type VaultEntrySubmitInput,
} from "@/systems/vault/components/VaultEntryFormModal";
import type { VaultEntry } from "@/systems/vault/components/types";

const inputClz =
  "min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#28254a] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";

type FilterCategory = "all" | "favorites" | string; // string = category key

const heroStatClass =
  "relative overflow-hidden flex flex-1 flex-col gap-1 rounded-[1.5rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/25 to-violet-100/15 px-4 py-4 shadow-sm backdrop-blur-xl ring-1 ring-inset ring-white/50 sm:px-5 sm:py-5";

export function VaultDashboardClient() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterCategory>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formTarget, setFormTarget] = useState<VaultEntry | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<VaultEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /** id → ข้อความรหัสจริง (decrypted) — ถ้าอยู่ใน Map = แสดงรหัสจริง */
  const [revealedPasswords, setRevealedPasswords] = useState<Map<number, string>>(new Map());
  const [revealingId, setRevealingId] = useState<number | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const loadEntries = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/vault/entries", { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { entries?: VaultEntry[]; error?: string };
      if (!res.ok) {
        setLoadError(j.error?.trim() || `โหลดรายการไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setEntries(j.entries ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "เชื่อมต่อล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const stats = useMemo(() => {
    const categories = new Set(entries.map((e) => e.category)).size;
    const recent = entries
      .filter((e) => e.lastUsedAt)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())[0];
    return {
      total: entries.length,
      categories,
      recentLabel: recent?.serviceName ?? "—",
      sharedCount: 0,
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === "favorites" && !e.isFavorite) return false;
      if (filter !== "all" && filter !== "favorites" && e.category !== filter) return false;
      if (!q) return true;
      return (
        e.serviceName.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        (e.websiteUrl ?? "").toLowerCase().includes(q) ||
        (e.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [entries, search, filter]);

  function openCreate() {
    setFormMode("create");
    setFormTarget(null);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(entry: VaultEntry) {
    setFormMode("edit");
    setFormTarget(entry);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(input: VaultEntrySubmitInput) {
    setFormBusy(true);
    setFormError(null);
    try {
      const isEdit = formMode === "edit" && formTarget;
      const url = isEdit ? `/api/vault/entries/${formTarget.id}` : "/api/vault/entries";
      const body: Record<string, unknown> = {
        serviceName: input.serviceName,
        username: input.username,
        websiteUrl: input.websiteUrl,
        category: input.category,
        brandKey: input.brandKey,
        note: input.note,
        isFavorite: input.isFavorite,
      };
      if (input.password) body.password = input.password;
      else if (!isEdit) {
        setFormError("กรอกรหัสผ่าน");
        return;
      }

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { entry?: VaultEntry; error?: string };
      if (!res.ok) {
        setFormError(j.error?.trim() || `บันทึกไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      if (isEdit && formTarget) {
        // หากเปลี่ยนรหัส — ลบ revealed cache เก่า
        if (input.password) {
          setRevealedPasswords((m) => {
            const next = new Map(m);
            next.delete(formTarget.id);
            return next;
          });
        }
        setEntries((arr) => arr.map((e) => (e.id === formTarget.id && j.entry ? j.entry : e)));
        setToast("บันทึกการแก้ไขแล้ว");
      } else if (j.entry) {
        setEntries((arr) => [j.entry!, ...arr]);
        setToast("เพิ่มบัญชีใหม่แล้ว");
      }
      setFormOpen(false);
    } finally {
      setFormBusy(false);
    }
  }

  async function toggleFavorite(entry: VaultEntry) {
    // optimistic update
    setEntries((arr) =>
      arr.map((e) => (e.id === entry.id ? { ...e, isFavorite: !e.isFavorite } : e)),
    );
    try {
      const res = await fetch(`/api/vault/entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !entry.isFavorite }),
      });
      if (!res.ok) {
        // revert
        setEntries((arr) =>
          arr.map((e) => (e.id === entry.id ? { ...e, isFavorite: entry.isFavorite } : e)),
        );
        setToast("บันทึกรายการโปรดไม่สำเร็จ");
      }
    } catch {
      setEntries((arr) =>
        arr.map((e) => (e.id === entry.id ? { ...e, isFavorite: entry.isFavorite } : e)),
      );
      setToast("บันทึกรายการโปรดไม่สำเร็จ");
    }
  }

  async function revealPassword(entry: VaultEntry) {
    if (revealedPasswords.has(entry.id)) {
      // ซ่อน
      setRevealedPasswords((m) => {
        const next = new Map(m);
        next.delete(entry.id);
        return next;
      });
      return;
    }
    setRevealingId(entry.id);
    try {
      const res = await fetch(`/api/vault/entries/${entry.id}/reveal`, { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { password?: string; error?: string };
      if (!res.ok || !j.password) {
        setToast(j.error?.trim() || "แสดงรหัสไม่สำเร็จ");
        return;
      }
      setRevealedPasswords((m) => {
        const next = new Map(m);
        next.set(entry.id, j.password!);
        return next;
      });
      // อัปเดต lastUsedAt ฝั่ง client (server ทำให้แล้ว)
      setEntries((arr) =>
        arr.map((e) => (e.id === entry.id ? { ...e, lastUsedAt: new Date().toISOString() } : e)),
      );
    } finally {
      setRevealingId(null);
    }
  }

  async function copyToClipboard(text: string, label: string, autoClear = false) {
    try {
      await navigator.clipboard.writeText(text);
      setToast(`คัดลอก${label}แล้ว`);
      if (autoClear) {
        setTimeout(() => {
          // best-effort clear (ทำงานเฉพาะหน้านี้ยัง focus อยู่)
          navigator.clipboard.writeText(" ").catch(() => null);
        }, 30_000);
      }
    } catch {
      setToast("คัดลอกไม่สำเร็จ — กรุณาคัดลอกด้วยมือ");
    }
  }

  async function handleReveal(entry: VaultEntry) {
    await revealPassword(entry);
  }

  async function handleCopyPassword(entry: VaultEntry) {
    const cached = revealedPasswords.get(entry.id);
    if (cached) {
      await copyToClipboard(cached, "รหัสผ่าน", true);
      return;
    }
    setRevealingId(entry.id);
    try {
      const res = await fetch(`/api/vault/entries/${entry.id}/reveal`, { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { password?: string; error?: string };
      if (!res.ok || !j.password) {
        setToast(j.error?.trim() || "คัดลอกรหัสไม่สำเร็จ");
        return;
      }
      await copyToClipboard(j.password, "รหัสผ่าน", true);
      setEntries((arr) =>
        arr.map((e) => (e.id === entry.id ? { ...e, lastUsedAt: new Date().toISOString() } : e)),
      );
    } finally {
      setRevealingId(null);
    }
  }

  function openDelete(entry: VaultEntry) {
    setDeleteTarget(entry);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/vault/entries/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setDeleteError(j.error?.trim() || `ลบไม่สำเร็จ (รหัส ${res.status})`);
        return;
      }
      setEntries((arr) => arr.filter((e) => e.id !== deleteTarget.id));
      setRevealedPasswords((m) => {
        const next = new Map(m);
        next.delete(deleteTarget.id);
        return next;
      });
      setDeleteTarget(null);
      setToast("ลบบัญชีแล้ว");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 top-4 z-[260] -translate-x-1/2 rounded-2xl border border-indigo-200 bg-white/95 px-4 py-2.5 text-sm font-bold text-indigo-900 shadow-xl backdrop-blur"
        >
          {toast}
        </div>
      ) : null}

      <AppDashboardSection>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4">
          <HeroStat label="รหัสผ่านทั้งหมด" value={stats.total} accent="from-[#4338ca] via-[#5b61ff] to-[#0d9488]" />
          <HeroStat label="ประเภท" value={stats.categories} accent="from-[#7c3aed] via-[#a855f7] to-[#c026d3]" />
          <HeroStat
            label="ใช้ล่าสุด"
            value={
              <span className="block truncate text-base sm:text-lg">{stats.recentLabel}</span>
            }
            accent="from-[#059669] via-[#10b981] to-[#14b8a6]"
          />
          <HeroStat label="แชร์ไว้" value={stats.sharedCount} accent="from-[#d97706] via-[#f59e0b] to-[#f97316]" />
        </div>
      </AppDashboardSection>

      {/* Search + actions + filter chips */}
      <AppDashboardSection>
        <AppSectionHeader
          title="คลังบัญชี"
          description={loading ? "กำลังโหลด…" : `${filteredEntries.length} จาก ${entries.length} รายการ`}
          className="flex flex-row items-start justify-between gap-3 sm:items-center"
          actionWrapClassName="shrink-0 self-start pt-0.5 sm:pt-0"
          action={
            <button
              type="button"
              suppressHydrationWarning
              onClick={openCreate}
              aria-label="เพิ่มบัญชี"
              className={cn(
                "inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl px-2 text-sm font-black text-white shadow-md transition hover:brightness-110 sm:min-w-0 sm:gap-1.5 sm:px-4",
                appDashboardBrandGradientFillClass,
              )}
            >
              <IconPlus className="h-5 w-5" />
              <span className="hidden sm:inline">เพิ่มบัญชี</span>
            </button>
          }
        />

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(inputClz, search ? "pl-3.5" : "pl-10")}
              placeholder="ค้นหา ชื่อบริการ / username / URL"
              aria-label="ค้นหาบัญชี"
              suppressHydrationWarning
            />
            {!search ? (
              <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            ) : null}
            {search ? (
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="ล้างคำค้นหา"
              >
                <IconX className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            ทั้งหมด
          </FilterChip>
          <FilterChip active={filter === "favorites"} onClick={() => setFilter("favorites")}>
            ⭐ รายการโปรด
          </FilterChip>
          {VAULT_CATEGORIES.map((c) => (
            <FilterChip key={c.key} active={filter === c.key} onClick={() => setFilter(c.key)}>
              {c.label}
            </FilterChip>
          ))}
        </div>

        {loadError ? (
          <div role="alert" className="mt-3 rounded-2xl border border-red-200/85 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800">
            {loadError}
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <AppEmptyState tone="slate">
              {entries.length === 0
                ? "ยังไม่มีบัญชี — กดปุ่ม «+ เพิ่มบัญชี» เพื่อเริ่มต้น"
                : "ไม่พบรายการที่ตรงกับการค้นหา/ตัวกรอง"}
            </AppEmptyState>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEntries.map((entry) => {
                const revealed = revealedPasswords.get(entry.id) ?? null;
                const isRevealing = revealingId === entry.id;
                return (
                  <li key={entry.id}>
                    <VaultEntryCard
                      entry={entry}
                      revealedPassword={revealed}
                      isRevealing={isRevealing}
                      onReveal={() => void handleReveal(entry)}
                      onCopyUsername={() => void copyToClipboard(entry.username, "ผู้ใช้")}
                      onCopyPassword={() => void handleCopyPassword(entry)}
                      onToggleFavorite={() => void toggleFavorite(entry)}
                      onEdit={() => openEdit(entry)}
                      onDelete={() => openDelete(entry)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </AppDashboardSection>

      <VaultEntryFormModal
        open={formOpen}
        mode={formMode}
        entry={formTarget}
        busy={formBusy}
        error={formError}
        onSubmit={handleSubmit}
        onClose={() => {
          if (formBusy) return;
          setFormOpen(false);
        }}
      />

      <FormModal
        open={!!deleteTarget}
        onClose={() => {
          if (deleteBusy) return;
          setDeleteTarget(null);
        }}
        title="ยืนยันลบบัญชี"
        size="sm"
        appearance="glass"
        glassTint="amber"
        footer={
          <FormModalFooterActions
            onCancel={() => setDeleteTarget(null)}
            onSubmit={confirmDelete}
            submitLabel={deleteBusy ? "กำลังลบ…" : "ลบบัญชี"}
            danger
            loading={deleteBusy}
          />
        }
      >
        <div className="space-y-3">
          {deleteError ? (
            <div role="alert" className="rounded-2xl border border-red-200/85 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800">
              {deleteError}
            </div>
          ) : null}
          <p className="text-sm text-[#3a3666]">
            ลบบัญชี{" "}
            <span className="font-bold text-[#1e1b4b]">
              &quot;{deleteTarget?.serviceName}&quot;
            </span>{" "}
            ของผู้ใช้{" "}
            <span className="font-mono text-xs text-slate-600">{deleteTarget?.username}</span>{" "}
            หรือไม่?
          </p>
          <p className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-3.5 py-2.5 text-xs leading-relaxed text-rose-800">
            ข้อมูลทั้งหมดจะถูกลบทันที — กู้คืนไม่ได้
          </p>
        </div>
      </FormModal>
    </div>
  );
}

function HeroStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={heroStatClass}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100/60 via-violet-200/40 to-transparent blur-xl"
      />
      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#66638c]">{label}</span>
      <div className={cn("bg-gradient-to-br bg-clip-text font-black tracking-tight text-transparent", accent, typeof value === "number" || typeof value === "string" ? "text-2xl sm:text-3xl" : "")}>
        {value}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold transition",
        active
          ? "border-indigo-500 bg-indigo-600 text-white shadow-md"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700",
      )}
    >
      {children}
    </button>
  );
}

function VaultEntryCard({
  entry,
  revealedPassword,
  isRevealing,
  onReveal,
  onCopyUsername,
  onCopyPassword,
  onToggleFavorite,
  onEdit,
  onDelete,
}: {
  entry: VaultEntry;
  revealedPassword: string | null;
  isRevealing: boolean;
  onReveal: () => void;
  onCopyUsername: () => void;
  onCopyPassword: () => void;
  onToggleFavorite: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const preset = findVaultBrandPreset(entry.brandKey);
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-white/60 bg-white/80 p-3.5 shadow-sm backdrop-blur transition hover:border-indigo-300 hover:shadow-md sm:p-4">
      {/* Header: avatar + name + favorite */}
      <div className="flex items-start gap-3">
        <VaultBrandAvatar brandKey={entry.brandKey} serviceName={entry.serviceName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-[#1e1b4b] sm:text-base">{entry.serviceName}</p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {preset.label}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={entry.isFavorite ? "เลิกปักหมุดรายการโปรด" : "ปักหมุดเป็นรายการโปรด"}
          className={cn(
            "shrink-0 rounded-xl border p-1.5 transition",
            entry.isFavorite
              ? "border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-300 hover:border-amber-300 hover:text-amber-400",
          )}
        >
          <IconStar className="h-4 w-4" filled={entry.isFavorite} />
        </button>
      </div>

      {/* Username row */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
        <span className="min-w-0 flex-1 truncate text-xs font-mono text-slate-700">{entry.username}</span>
        <RowIconBtn onClick={onCopyUsername} title="คัดลอกผู้ใช้">
          <IconCopy className="h-3.5 w-3.5" />
        </RowIconBtn>
      </div>

      {/* Password row */}
      <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-2.5 py-2">
        <span className="min-w-0 flex-1 truncate text-xs font-mono text-slate-700">
          {revealedPassword ? revealedPassword : "•".repeat(12)}
        </span>
        <RowIconBtn onClick={onReveal} title={revealedPassword ? "ซ่อนรหัส" : "แสดงรหัส"} loading={isRevealing && !revealedPassword}>
          {revealedPassword ? <IconEyeOff className="h-3.5 w-3.5" /> : <IconEye className="h-3.5 w-3.5" />}
        </RowIconBtn>
        <RowIconBtn onClick={onCopyPassword} title="คัดลอกรหัสผ่าน" loading={isRevealing}>
          <IconCopy className="h-3.5 w-3.5" />
        </RowIconBtn>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
          {entry.lastUsedAt ? (
            <>
              <IconClock className="h-3 w-3" />
              <span>ใช้ล่าสุด {formatRelativeTh(entry.lastUsedAt)}</span>
            </>
          ) : (
            <span>ยังไม่เคยใช้งาน</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {entry.websiteUrl ? (
            <a
              href={entry.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-indigo-300 hover:text-indigo-700"
              aria-label={`เปิดเว็บไซต์ ${entry.serviceName}`}
              title="เปิดเว็บไซต์"
            >
              <IconExternal className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={onEdit}
            aria-label={`แก้ไข ${entry.serviceName}`}
            className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-indigo-300 hover:text-indigo-700"
            title="แก้ไข"
          >
            <IconEdit className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`ลบ ${entry.serviceName}`}
            className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-500 transition hover:bg-rose-100"
            title="ลบ"
          >
            <IconTrash className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function RowIconBtn({
  onClick,
  title,
  loading,
  children,
}: {
  onClick: () => void;
  title: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={loading}
      className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-50"
    >
      {loading ? <IconSpinner className="h-3.5 w-3.5 animate-spin" /> : children}
    </button>
  );
}

function formatRelativeTh(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "เมื่อสักครู่";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีก่อน`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชม.ก่อน`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} วันก่อน`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo} เดือนก่อน`;
  return `${Math.floor(mo / 12)} ปีก่อน`;
}

/* ============ icons ============ */

function IconPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
function IconSearch({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" strokeLinecap="round" />
    </svg>
  );
}
function IconX({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
    </svg>
  );
}
function IconStar({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01z" strokeLinejoin="round" />
    </svg>
  );
}
function IconCopy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IconEye({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function IconEyeOff({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.54 18.54 0 0 1 4.06-5.06" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 7 10 7a18.6 18.6 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <path d="M2 2l20 20" strokeLinecap="round" />
    </svg>
  );
}
function IconEdit({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" strokeLinejoin="round" />
    </svg>
  );
}
function IconTrash({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconExternal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" strokeLinecap="round" />
    </svg>
  );
}
function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}
function IconSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="40 60" strokeLinecap="round" />
    </svg>
  );
}
