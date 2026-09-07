"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  assetRowEditIconButtonClass,
  assetRowRemoveIconButtonClass,
  IconRowEdit,
  IconRowRemove,
} from "@/systems/asset/components/AssetRowActionIcons";
import { HomeFinanceOverviewSubNav } from "@/systems/home-finance/components/HomeFinancePageSubNav";
import {
  HomeFinanceCardIconAddButton,
  HomeFinanceRowIconCopyButton,
  HomeFinanceRowIconRevealButton,
} from "@/systems/home-finance/components/HomeFinanceCardHeaderActions";
import {
  homeFinanceCardIconTileClass,
  homeFinanceTonedRowCardClass,
} from "@/systems/home-finance/lib/card-tones";
import { IconHomeFinancePasswords } from "@/systems/home-finance/lib/page-menu-icons";
import { homeFinanceFieldClass } from "@/systems/home-finance/lib/ui-tokens";
import type { VaultEntry } from "@/systems/vault/components/types";

// re-export reveal icons for form field
function FormRevealIcon({ revealed }: { revealed: boolean }) {
  return revealed ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5" strokeLinecap="round" />
      <path
        d="M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 3.9M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

type FormState = {
  serviceName: string;
  username: string;
  password: string;
};

const emptyForm: FormState = { serviceName: "", username: "", password: "" };

export function HomeFinancePasswordsClient() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formTarget, setFormTarget] = useState<VaultEntry | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [revealed, setRevealed] = useState<Map<number, string>>(new Map());
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/vault/entries", { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as { entries?: VaultEntry[]; error?: string };
      if (!res.ok) {
        setError(j.error?.trim() || `โหลดไม่สำเร็จ (${res.status})`);
        return;
      }
      setEntries(j.entries ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "เชื่อมต่อล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.serviceName.toLowerCase().includes(q) ||
        e.username.toLowerCase().includes(q) ||
        (e.websiteUrl ?? "").toLowerCase().includes(q),
    );
  }, [entries, search]);

  function openCreate() {
    setFormMode("create");
    setFormTarget(null);
    setForm(emptyForm);
    setFormError(null);
    setShowPassword(false);
    setFormOpen(true);
  }

  function openEdit(entry: VaultEntry) {
    setFormMode("edit");
    setFormTarget(entry);
    setForm({ serviceName: entry.serviceName, username: entry.username, password: "" });
    setFormError(null);
    setShowPassword(false);
    setFormOpen(true);
  }

  async function saveForm() {
    const serviceName = form.serviceName.trim();
    const username = form.username.trim();
    if (!serviceName || !username) {
      setFormError("กรอกชื่อบริการและผู้ใช้");
      return;
    }
    if (formMode === "create" && !form.password) {
      setFormError("กรอกรหัสผ่าน");
      return;
    }
    setFormBusy(true);
    setFormError(null);
    try {
      const isEdit = formMode === "edit" && formTarget;
      const url = isEdit ? `/api/vault/entries/${formTarget.id}` : "/api/vault/entries";
      const body: Record<string, unknown> = { serviceName, username };
      if (form.password) body.password = form.password;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { entry?: VaultEntry; error?: string };
      if (!res.ok) {
        setFormError(j.error?.trim() || `บันทึกไม่สำเร็จ (${res.status})`);
        return;
      }
      if (isEdit && formTarget) {
        if (form.password) {
          setRevealed((m) => {
            const next = new Map(m);
            next.delete(formTarget.id);
            return next;
          });
        }
        setEntries((arr) => arr.map((e) => (e.id === formTarget.id && j.entry ? j.entry : e)));
        setToast("บันทึกแล้ว");
      } else if (j.entry) {
        setEntries((arr) => [j.entry!, ...arr]);
        setToast("เพิ่มแล้ว");
      }
      setFormOpen(false);
    } finally {
      setFormBusy(false);
    }
  }

  async function reveal(entry: VaultEntry) {
    if (revealed.has(entry.id)) {
      setRevealed((m) => {
        const next = new Map(m);
        next.delete(entry.id);
        return next;
      });
      return;
    }
    setBusyId(entry.id);
    try {
      const res = await fetch(`/api/vault/entries/${entry.id}/reveal`, { method: "POST" });
      const j = (await res.json().catch(() => ({}))) as { password?: string; error?: string };
      if (!res.ok || !j.password) {
        setToast(j.error?.trim() || "แสดงรหัสไม่สำเร็จ");
        return;
      }
      setRevealed((m) => new Map(m).set(entry.id, j.password!));
    } finally {
      setBusyId(null);
    }
  }

  async function copyPassword(entry: VaultEntry) {
    let pw = revealed.get(entry.id);
    if (!pw) {
      setBusyId(entry.id);
      try {
        const res = await fetch(`/api/vault/entries/${entry.id}/reveal`, { method: "POST" });
        const j = (await res.json().catch(() => ({}))) as { password?: string; error?: string };
        if (!res.ok || !j.password) {
          setToast(j.error?.trim() || "คัดลอกไม่สำเร็จ");
          return;
        }
        pw = j.password;
      } finally {
        setBusyId(null);
      }
    }
    try {
      await navigator.clipboard.writeText(pw);
      setToast("คัดลอกรหัสแล้ว");
    } catch {
      setToast("คัดลอกไม่สำเร็จ");
    }
  }

  async function remove(entry: VaultEntry) {
    if (!window.confirm(`ลบ «${entry.serviceName}» ?`)) return;
    setBusyId(entry.id);
    try {
      const res = await fetch(`/api/vault/entries/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setToast(j.error?.trim() || "ลบไม่สำเร็จ");
        return;
      }
      setEntries((arr) => arr.filter((e) => e.id !== entry.id));
      setRevealed((m) => {
        const next = new Map(m);
        next.delete(entry.id);
        return next;
      });
      setToast("ลบแล้ว");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {toast ? (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[260] -translate-x-1/2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-900 shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <HomeFinanceOverviewSubNav
        action={<HomeFinanceCardIconAddButton label="เพิ่มรหัสผ่าน" onClick={openCreate} />}
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="block min-w-0 flex-1 text-xs font-medium text-slate-600">
              ค้นหา
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(homeFinanceFieldClass, "mt-1")}
                placeholder="ชื่อบริการ / ผู้ใช้"
                aria-label="ค้นหารหัสผ่าน"
              />
            </label>
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">กำลังโหลด…</p>
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-[#66638c]">
              {entries.length === 0 ? "ยังไม่มีรหัสผ่าน — กดปุ่ม + เพื่อเพิ่ม" : "ไม่พบรายการที่ค้นหา"}
            </p>
          ) : (
            <ul className="space-y-2" aria-label="รายการรหัสผ่าน">
              {filtered.map((entry) => {
                const pw = revealed.get(entry.id);
                const busy = busyId === entry.id;
                return (
                  <li key={entry.id} className={homeFinanceTonedRowCardClass("indigo")}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className={homeFinanceCardIconTileClass("indigo")} aria-hidden>
                        <IconHomeFinancePasswords className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-bold text-[#1e1b4b]">{entry.serviceName}</p>
                        <p className="truncate font-mono text-xs text-[#66638c]">{entry.username}</p>
                        <p className="font-mono text-xs text-slate-700">{pw ?? "••••••••"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 self-start">
                      <HomeFinanceRowIconRevealButton
                        label={pw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                        revealed={Boolean(pw)}
                        disabled={busy}
                        onClick={() => void reveal(entry)}
                      />
                      <HomeFinanceRowIconCopyButton
                        label="คัดลอกรหัสผ่าน"
                        disabled={busy}
                        onClick={() => void copyPassword(entry)}
                      />
                      <button
                        type="button"
                        className={assetRowEditIconButtonClass}
                        aria-label={`แก้ไข ${entry.serviceName}`}
                        title="แก้ไข"
                        disabled={busy}
                        onClick={() => openEdit(entry)}
                      >
                        <IconRowEdit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={assetRowRemoveIconButtonClass}
                        aria-label={`ลบ ${entry.serviceName}`}
                        title="ลบ"
                        disabled={busy}
                        onClick={() => void remove(entry)}
                      >
                        <IconRowRemove className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </HomeFinanceOverviewSubNav>

      <FormModal
        open={formOpen}
        onClose={() => {
          if (formBusy) return;
          setFormOpen(false);
        }}
        title={formMode === "create" ? "เพิ่มรหัสผ่าน" : "แก้ไขรหัสผ่าน"}
        description={formMode === "edit" ? "เว้นช่องรหัสผ่านว่างหากไม่ต้องการเปลี่ยน" : undefined}
        size="sm"
        appearance="default"
        footer={
          <FormModalFooterActions
            onCancel={() => setFormOpen(false)}
            onSubmit={() => void saveForm()}
            submitLabel={formMode === "create" ? "บันทึก" : "บันทึกการแก้ไข"}
            submitDisabled={
              formBusy || !form.serviceName.trim() || !form.username.trim() || (formMode === "create" && !form.password)
            }
            loading={formBusy}
          />
        }
      >
        <div className="space-y-3">
          {formError ? (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {formError}
            </p>
          ) : null}
          <label className="block text-xs font-medium text-slate-600">
            ชื่อบริการ *
            <input
              value={form.serviceName}
              onChange={(e) => setForm((s) => ({ ...s, serviceName: e.target.value }))}
              className={cn(homeFinanceFieldClass, "mt-1")}
              placeholder="เช่น Google, ธนาคาร"
              maxLength={120}
              disabled={formBusy}
              autoFocus
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            ผู้ใช้ / อีเมล *
            <input
              value={form.username}
              onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
              className={cn(homeFinanceFieldClass, "mt-1")}
              placeholder="user@example.com"
              maxLength={255}
              disabled={formBusy}
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            {formMode === "create" ? "รหัสผ่าน *" : "รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)"}
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                className={cn(homeFinanceFieldClass, "pr-11 font-mono")}
                placeholder={formMode === "create" ? "รหัสผ่าน" : "••••••••"}
                autoComplete="new-password"
                disabled={formBusy}
              />
              <button
                type="button"
                className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[#4d47b6] hover:bg-slate-100"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                <FormRevealIcon revealed={showPassword} />
              </button>
            </div>
          </label>
        </div>
      </FormModal>
    </>
  );
}
