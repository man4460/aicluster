"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

function subscribeToClient() {
  return () => {};
}

/**
 * โมดัลฟอร์มมาตรฐานสำหรับแดชบอร์ด — เปิดจากปุ่ม กรอกใน popup ปิดด้วย ESC / คลิกพื้นหลัง
 * เรนเดอร์ผ่าน portal ที่ document.body เพื่อไม่ให้ ancestor ที่มี backdrop-filter ทำให้ fixed คลุมแค่การ์ด (เช่น ลานล้างใน app-surface)
 */
export function FormModal({
  open,
  onClose,
  title,
  description,
  /** `id` ขององค์ประกอบในเนื้อหาโมดัล (เช่น หัวข้อรอง) — โปรแกรมอ่านหน้าจอจะอ่านต่อจากชื่อไดอะล็อก */
  ariaDescribedBy,
  size = "md",
  /** โทนแผง — `glass` = กระจกโปร่ง (ใช้กับป๊อปอัป QR ฯลฯ) */
  appearance = "default",
  /** เมื่อ `appearance="glass"` — ไล่สีเงา/ไฮไลต์ของแผง */
  glassTint = "violet",
  /** โหมดมือถือให้อยู่กลางจอและเว้นขอบเล็กน้อย */
  mobileCentered = false,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  ariaDescribedBy?: string;
  size?: "sm" | "md" | "lg" | "xl";
  appearance?: "default" | "glass";
  glassTint?: "violet" | "amber";
  mobileCentered?: boolean;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false);

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
  if (!isClient) return null;

  const maxW =
    size === "sm" ? "max-w-md"
    : size === "lg" ? "max-w-2xl"
    : size === "xl" ? "max-w-4xl"
    : "max-w-lg";

  const isGlass = appearance === "glass";

  const glassPanel = cn(
    "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-10",
    maxW,
    mobileCentered ? "rounded-[2rem]" : "rounded-t-[2.5rem] sm:rounded-[2rem]",
    glassTint === "amber" ?
      "border border-white/50 bg-gradient-to-br from-white/50 via-amber-50/35 to-orange-100/22 shadow-[0_28px_80px_-18px_rgba(217,119,6,0.38)] backdrop-blur-2xl ring-1 ring-inset ring-white/55"
    : "border border-white/50 bg-gradient-to-br from-white/50 via-indigo-50/35 to-violet-200/22 shadow-[0_28px_80px_-18px_rgba(91,97,255,0.4)] backdrop-blur-2xl ring-1 ring-inset ring-white/55",
  );

  const defaultPanel = cn(
    "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden border border-white/20 bg-white/95 shadow-2xl backdrop-blur-2xl transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-10 sm:border-slate-200/50 sm:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]",
    mobileCentered ? "rounded-[2rem]" : "rounded-t-[2.5rem] sm:rounded-[2rem]",
    maxW,
  );

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[200] flex justify-center",
        mobileCentered ? "items-center p-3 sm:p-4" : "items-end sm:items-center sm:p-4",
      )}
      role="presentation"
    >
      <button
        type="button"
        className={cn(
          "absolute inset-0 transition-all duration-500 ease-out",
          isGlass ? "bg-slate-900/40 backdrop-blur-xl" : "bg-slate-900/60 backdrop-blur-md",
        )}
        aria-label="ปิดหน้าต่าง"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
        className={isGlass ? glassPanel : defaultPanel}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={cn(
            "relative shrink-0 px-6 py-5 sm:px-8",
            isGlass ?
              "border-b border-white/40 bg-gradient-to-b from-white/40 via-white/25 to-white/10 backdrop-blur-xl"
            : "border-b border-slate-100/60 bg-gradient-to-b from-white to-slate-50/50",
          )}
        >
          <h2 id="form-modal-title" className="text-xl font-black tracking-tight text-[#1e1b4b]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
              {description}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:right-6 sm:top-6",
              isGlass ?
                "bg-white/45 text-slate-500 ring-1 ring-white/60 backdrop-blur-md hover:bg-white/65 hover:text-slate-700"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600",
            )}
            aria-label="ปิด"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8",
            isGlass && "bg-white/[0.07]",
          )}
        >
          {children}
        </div>
        {footer ? (
          <div
            className={cn(
              "shrink-0 px-6 py-4 sm:px-8",
              isGlass ?
                "border-t border-white/40 bg-white/25 backdrop-blur-xl"
              : "border-t border-slate-100/60 bg-slate-50/80 backdrop-blur-xl",
            )}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
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
    <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] sm:flex-none sm:px-8"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        disabled={submitDisabled || loading}
        onClick={() => void onSubmit()}
        className={cn(
          "flex-1 rounded-2xl px-6 py-3 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-10",
          danger
            ? "bg-rose-600 shadow-rose-200 hover:bg-rose-700"
            : "bg-[#5b61ff] shadow-indigo-200 hover:bg-[#4d47b6]",
        )}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            กำลังบันทึก…
          </span>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
