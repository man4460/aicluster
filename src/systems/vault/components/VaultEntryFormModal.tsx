"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";
import {
  VAULT_BRAND_PRESETS,
  VAULT_CATEGORIES,
  findVaultBrandPreset,
  guessVaultBrandKey,
} from "@/systems/vault/lib/brand-presets";
import { VaultBrandAvatar } from "@/systems/vault/components/VaultBrandAvatar";
import type { VaultEntry } from "@/systems/vault/components/types";

const inputClz =
  "min-h-[46px] w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#28254a] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200";

export type VaultEntrySubmitInput = {
  serviceName: string;
  username: string;
  password: string | null;
  websiteUrl: string | null;
  category: string | null;
  brandKey: string | null;
  note: string | null;
  isFavorite: boolean;
};

export function VaultEntryFormModal({
  open,
  mode,
  entry,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  entry: VaultEntry | null;
  busy: boolean;
  error: string | null;
  onSubmit: (input: VaultEntrySubmitInput) => void | Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    serviceName: "",
    username: "",
    password: "",
    websiteUrl: "",
    category: "",
    brandKey: "",
    note: "",
    isFavorite: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touchedBrand, setTouchedBrand] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowPassword(false);
      setTouchedBrand(false);
      return;
    }
    if (mode === "edit" && entry) {
      setForm({
        serviceName: entry.serviceName,
        username: entry.username,
        password: "",
        websiteUrl: entry.websiteUrl ?? "",
        category: entry.category ?? "",
        brandKey: entry.brandKey ?? "",
        note: entry.note ?? "",
        isFavorite: entry.isFavorite,
      });
      setTouchedBrand(true);
    } else {
      setForm({
        serviceName: "",
        username: "",
        password: "",
        websiteUrl: "",
        category: "",
        brandKey: "",
        note: "",
        isFavorite: false,
      });
    }
  }, [open, mode, entry]);

  // Auto-detect brand เมื่อผู้ใช้ยังไม่ได้เลือกเอง
  useEffect(() => {
    if (touchedBrand) return;
    const guessed = guessVaultBrandKey({
      serviceName: form.serviceName,
      websiteUrl: form.websiteUrl,
    });
    if (guessed && guessed !== form.brandKey) {
      setForm((s) => ({
        ...s,
        brandKey: guessed,
        category: s.category || (findVaultBrandPreset(guessed).category ?? ""),
      }));
    }
  }, [form.serviceName, form.websiteUrl, form.brandKey, touchedBrand]);

  const previewPreset = useMemo(() => findVaultBrandPreset(form.brandKey || null), [form.brandKey]);

  const submit = () => {
    const sn = form.serviceName.trim();
    const un = form.username.trim();
    if (!sn || !un) return;
    if (mode === "create" && !form.password) return;
    void onSubmit({
      serviceName: sn,
      username: un,
      password: form.password ? form.password : null,
      websiteUrl: form.websiteUrl.trim() || null,
      category: form.category || null,
      brandKey: form.brandKey || null,
      note: form.note.trim() || null,
      isFavorite: form.isFavorite,
    });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={mode === "create" ? "เพิ่มบัญชีใหม่" : "แก้ไขบัญชี"}
      description={
        mode === "create"
          ? "เก็บ username/password ของบริการต่าง ๆ — เข้ารหัสก่อนเก็บอัตโนมัติ"
          : "เว้นช่องรหัสผ่านไว้ว่างหากไม่ต้องการเปลี่ยน"
      }
      size="lg"
      appearance="glass"
      glassTint="violet"
      footer={
        <FormModalFooterActions
          onCancel={onClose}
          onSubmit={submit}
          submitLabel={mode === "create" ? "เพิ่มบัญชี" : "บันทึก"}
          submitDisabled={busy || !form.serviceName.trim() || !form.username.trim() || (mode === "create" && !form.password)}
          loading={busy}
        />
      }
    >
      <div className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-2xl border border-red-200/85 bg-red-50/90 px-3.5 py-2.5 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {/* Preview การ์ด — ให้ผู้ใช้เห็นว่าจะออกมาแบบไหน */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm backdrop-blur-sm">
          <VaultBrandAvatar brandKey={form.brandKey || null} serviceName={form.serviceName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-[#1e1b4b]">
              {form.serviceName || "ชื่อบริการ"}
            </p>
            <p className="truncate text-xs text-slate-600">{form.username || "username / อีเมล"}</p>
            {form.brandKey ? (
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                {previewPreset.label}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="ชื่อบริการ *">
            <input
              value={form.serviceName}
              onChange={(e) => setForm((s) => ({ ...s, serviceName: e.target.value }))}
              className={inputClz}
              placeholder="เช่น Google, Facebook"
              maxLength={120}
              required
              disabled={busy}
              autoFocus={mode === "create"}
            />
          </Field>
          <Field label="ผู้ใช้ / อีเมล *">
            <input
              value={form.username}
              onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
              className={inputClz}
              placeholder="user@example.com"
              maxLength={255}
              required
              disabled={busy}
            />
          </Field>
        </div>

        <Field label={mode === "create" ? "รหัสผ่าน *" : "รหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)"}>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              className={cn(inputClz, "pr-24 font-mono")}
              placeholder={mode === "create" ? "รหัสผ่านของบริการนี้" : "•••••••• (ไม่เปลี่ยน)"}
              autoComplete="new-password"
              required={mode === "create"}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? "ซ่อน" : "แสดง"}
            </button>
          </div>
        </Field>

        <Field label="URL เว็บไซต์ (ไม่บังคับ)">
          <input
            value={form.websiteUrl}
            onChange={(e) => setForm((s) => ({ ...s, websiteUrl: e.target.value }))}
            className={inputClz}
            placeholder="https://example.com"
            maxLength={500}
            disabled={busy}
            inputMode="url"
          />
        </Field>

        <Field label="หมวด">
          <div className="flex flex-wrap gap-1.5">
            <CategoryChip
              active={!form.category}
              onClick={() => setForm((s) => ({ ...s, category: "" }))}
              disabled={busy}
            >
              ไม่ระบุ
            </CategoryChip>
            {VAULT_CATEGORIES.map((c) => (
              <CategoryChip
                key={c.key}
                active={form.category === c.key}
                onClick={() => setForm((s) => ({ ...s, category: c.key }))}
                disabled={busy}
              >
                {c.label}
              </CategoryChip>
            ))}
          </div>
        </Field>

        <Field label="บริการยอดนิยม (เลือกเพื่อใส่ไอคอน/สี)">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {VAULT_BRAND_PRESETS.filter((p) => p.key !== "generic").map((p) => {
              const active = form.brandKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setTouchedBrand(true);
                    setForm((s) => ({
                      ...s,
                      brandKey: p.key,
                      category: s.category || p.category,
                    }));
                  }}
                  disabled={busy}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl border px-2 py-2 text-left text-xs font-bold transition",
                    active
                      ? "border-indigo-400 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300",
                  )}
                  aria-pressed={active}
                  aria-label={p.label}
                >
                  <VaultBrandAvatar brandKey={p.key} size="sm" />
                  <span className="truncate">{p.label}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setTouchedBrand(true);
                setForm((s) => ({ ...s, brandKey: "generic" }));
              }}
              disabled={busy}
              className={cn(
                "flex items-center gap-2 rounded-2xl border px-2 py-2 text-left text-xs font-bold transition",
                form.brandKey === "generic"
                  ? "border-indigo-400 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-200"
                  : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300",
              )}
            >
              <VaultBrandAvatar brandKey="generic" size="sm" />
              <span className="truncate">ไอคอนทั่วไป</span>
            </button>
          </div>
        </Field>

        <Field label="โน้ตเพิ่มเติม (ไม่บังคับ)">
          <textarea
            value={form.note}
            onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
            className={cn(inputClz, "min-h-[80px]")}
            placeholder="เช่น คำถามสำรอง / รหัสกู้คืน 2FA / เบอร์ติดต่อ"
            maxLength={8192}
            disabled={busy}
          />
        </Field>

        <label className="flex items-center gap-2 rounded-2xl border border-white/60 bg-white/60 px-3.5 py-3 text-sm font-medium text-[#3a3666] backdrop-blur-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-300"
            checked={form.isFavorite}
            onChange={(e) => setForm((s) => ({ ...s, isFavorite: e.target.checked }))}
            disabled={busy}
          />
          <span>ปักหมุดเป็นรายการโปรด — แสดงด้านบนสุดของรายการ</span>
        </label>
      </div>
    </FormModal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      {children}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-bold transition",
        active
          ? "border-indigo-400 bg-indigo-100 text-indigo-900 ring-1 ring-indigo-200"
          : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300",
      )}
    >
      {children}
    </button>
  );
}
