"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

function subscribeToClient() {
  return () => {};
}

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

export function DormCenteredModal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  titleId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: keyof typeof sizeClass;
  titleId?: string;
}) {
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const headingId = titleId ?? "dorm-centered-modal-title";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm"
        aria-label="ปิดหน้าต่าง"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
          sizeClass[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-2">
            <h2 id={headingId} className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
            {description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
