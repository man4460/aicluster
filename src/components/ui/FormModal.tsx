"use client";

import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * โมดัลฟอร์มมาตรฐานสำหรับแดชบอร์ด — เปิดจากปุ่ม กรอกใน popup ปิดด้วย ESC / คลิกพื้นหลัง
 */
export function FormModal({
  open,
  onClose,
  title,
  description,
  /** `id` ขององค์ประกอบในเนื้อหาโมดัล (เช่น หัวข้อรอง) — โปรแกรมอ่านหน้าจอจะอ่านต่อจากชื่อไดอะล็อก */
  ariaDescribedBy,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  ariaDescribedBy?: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const maxW =
    size === "sm" ? "max-w-md"
    : size === "lg" ? "max-w-2xl"
    : size === "xl" ? "max-w-4xl"
    : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity"
        aria-label="ปิดหน้าต่าง"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-slate-200/95 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.12)] sm:rounded-3xl sm:shadow-2xl",
          maxW,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id="form-modal-title" className="text-lg font-bold tracking-tight text-[#2e2a58]">
            {title}
          </h2>
          {description ? <p className="mt-1 text-sm leading-relaxed text-[#66638c]">{description}</p> : null}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-100 bg-[#faf9ff]/90 px-5 py-3 sm:rounded-b-3xl sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** แถบปุ่มล่างมาตรฐาน — ใช้คู่กับ FormModal */
export function FormModalFooterActions({
  onCancel,
  cancelLabel = "ยกเลิก",
  onSubmit,
  submitLabel,
  submitDisabled,
  loading,
  danger,
}: {
  onCancel: () => void;
  cancelLabel?: string;
  onSubmit: () => void | Promise<void>;
  submitLabel: string;
  submitDisabled?: boolean;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={submitDisabled || loading}
        onClick={() => void onSubmit()}
        className={
          danger
            ? "rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
            : "app-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        }
      >
        {loading ? "กำลังบันทึก…" : submitLabel}
      </button>
    </div>
  );
}
