"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { appDashboardBrandGradientFillClass } from "./dashboard-tokens";

function subscribeToClient() {
  return () => {};
}

/** โทนกล่องเดียว — สำเร็จ / ผิดพลาด / แจ้งเตือน / ยืนยันลบ */
export type AppNoticePopupTone = "success" | "error" | "warning" | "confirm";

export type AppNoticePopupProps = {
  open: boolean;
  onClose: () => void;
  /** ข้อความหลักใต้หัวข้อ (รองรับขึ้นบรรทัดใหม่ด้วย \\n) */
  message: string;
  /** หัวข้อสั้น — ค่าเริ่มตาม tone */
  title?: string;
  tone?: AppNoticePopupTone;
  /**
   * ปิดอัตโนมัติหลัง ms
   * - notice: ค่าเริ่ม 2400
   * - มี onConfirm (ยืนยัน): บังคับไม่ปิดเอง
   */
  autoCloseMs?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * มีค่า = โหมดยืนยัน (ยกเลิก + ปุ่มหลัก)
   * ไม่มี = โหมดแจ้งเตือน (ปุ่มเดียว)
   */
  onConfirm?: () => void;
};

const TONE_META: Record<
  AppNoticePopupTone,
  { title: string; bar: string; iconBtn: string; primaryBtn: string }
> = {
  success: {
    title: "สำเร็จ",
    bar: "bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899]",
    iconBtn: cn(
      "text-white shadow-[0_18px_40px_-18px_rgba(76,71,182,0.85)] ring-4 ring-white/70",
      appDashboardBrandGradientFillClass,
    ),
    primaryBtn: appDashboardBrandGradientFillClass,
  },
  error: {
    title: "ไม่สำเร็จ",
    bar: "bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400",
    iconBtn:
      "bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-[0_18px_40px_-18px_rgba(225,29,72,0.55)] ring-4 ring-white/70",
    primaryBtn: "bg-gradient-to-r from-rose-500 to-orange-400 hover:from-rose-600 hover:to-orange-500",
  },
  warning: {
    title: "แจ้งเตือน",
    bar: "bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400",
    iconBtn:
      "bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-[0_18px_40px_-18px_rgba(245,158,11,0.55)] ring-4 ring-white/70",
    primaryBtn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
  },
  confirm: {
    title: "ยืนยันการลบ",
    bar: "bg-gradient-to-r from-rose-600 via-[#8b5cf6] to-[#0000BF]",
    iconBtn:
      "bg-gradient-to-br from-rose-500 via-[#a855f7] to-[#0000BF] text-white shadow-[0_18px_40px_-18px_rgba(76,71,182,0.7)] ring-4 ring-white/70",
    primaryBtn: "bg-gradient-to-r from-rose-600 to-[#7c3aed] hover:from-rose-700 hover:to-[#6d28d9]",
  },
};

function ToneIcon({ tone }: { tone: AppNoticePopupTone }) {
  const cls = "h-8 w-8";
  if (tone === "success") return <CheckCircle2 className={cls} strokeWidth={2.25} />;
  if (tone === "error") return <XCircle className={cls} strokeWidth={2.25} />;
  if (tone === "warning") return <AlertTriangle className={cls} strokeWidth={2.25} />;
  return <Trash2 className={cls} strokeWidth={2.25} />;
}

/**
 * ป๊อปอัปกึ่งกลางจอ (template กลาง) — แจ้งสำเร็จ/ผิดพลาด/เตือน และยืนยันลบ
 * กล่องเดียวทั้งระบบ: glass + gradient แบรนด์
 */
export function AppNoticePopup({
  open,
  onClose,
  message,
  title,
  tone = "success",
  autoCloseMs,
  confirmLabel,
  cancelLabel = "ยกเลิก",
  onConfirm,
}: AppNoticePopupProps) {
  const isClient = useSyncExternalStore(subscribeToClient, () => true, () => false);
  const isConfirmMode = typeof onConfirm === "function";
  const meta = TONE_META[tone];
  const heading = title ?? meta.title;
  const primaryLabel = confirmLabel ?? (isConfirmMode ? "ลบ" : "ตกลง");
  const resolvedAutoClose =
    isConfirmMode ? 0 : autoCloseMs === undefined ? 2400 : autoCloseMs;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || resolvedAutoClose <= 0) return;
    const id = window.setTimeout(onClose, resolvedAutoClose);
    return () => window.clearTimeout(id);
  }, [open, resolvedAutoClose, onClose, message]);

  if (!open || !isClient) return null;

  const iconWrap: ReactNode = (
    <span
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-[1.35rem]",
        meta.iconBtn,
      )}
      aria-hidden
    >
      <ToneIcon tone={tone} />
    </span>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[6px] transition-opacity"
        aria-label="ปิดการแจ้งเตือน"
        onClick={onClose}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-notice-popup-title"
        aria-describedby="app-notice-popup-desc"
        className={cn(
          "relative z-10 w-full max-w-[22rem] overflow-hidden rounded-[2rem] border border-white/55",
          "bg-gradient-to-br from-white/95 via-[#f5f3ff]/92 to-[#fdf2f8]/88",
          "p-6 shadow-[0_28px_80px_-28px_rgba(30,27,75,0.55)] backdrop-blur-2xl",
          "animate-in fade-in zoom-in-95 duration-300",
        )}
      >
        <div
          className={cn("pointer-events-none absolute inset-x-8 top-3 h-1 rounded-full", meta.bar)}
          aria-hidden
        />

        <div className="flex flex-col items-center pt-3 text-center">
          {iconWrap}
          <h2
            id="app-notice-popup-title"
            className="mt-4 text-xl font-black tracking-tight text-[#1e1b4b]"
          >
            {heading}
          </h2>
          <p
            id="app-notice-popup-desc"
            className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-[#5f5a8a]"
          >
            {message}
          </p>

          {isConfirmMode ? (
            <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#c4b5fd]/80 bg-white/85 px-4 text-sm font-black text-[#4d47b6] shadow-sm transition hover:bg-violet-50 active:scale-[0.99]"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm?.();
                }}
                className={cn(
                  "inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 text-sm font-black text-white shadow-md transition active:scale-[0.99]",
                  meta.primaryBtn,
                )}
              >
                {primaryLabel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl px-5 text-sm font-black text-white shadow-md transition active:scale-[0.99]",
                meta.primaryBtn,
              )}
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type NoticeOnlyState = {
  kind: "notice";
  message: string;
  tone: AppNoticePopupTone;
  title?: string;
  confirmLabel?: string;
};

type ConfirmState = {
  kind: "confirm";
  message: string;
  tone: AppNoticePopupTone;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type DialogState = NoticeOnlyState | ConfirmState | null;

export type UseAppNoticePopupOptions = {
  /** ค่าเริ่มโทนยืนยัน (มักเป็นลบ) */
  defaultConfirmTone?: AppNoticePopupTone;
  defaultConfirmTitle?: string;
  defaultConfirmLabel?: string;
};

/**
 * Hook กลาง — แจ้งเตือน + ยืนยันลบ ผ่าน AppNoticePopup กล่องเดียว
 *
 * @example
 * const notice = useAppNoticePopup();
 * // ...
 * {notice.popup}
 * await notice.confirm(`ลบ "${name}" ใช่หรือไม่?`);
 * notice.success("บันทึกเรียบร้อยแล้ว");
 */
export function useAppNoticePopup(options: UseAppNoticePopupOptions = {}) {
  const {
    defaultConfirmTone = "confirm",
    defaultConfirmTitle = "ยืนยันการลบ",
    defaultConfirmLabel = "ลบ",
  } = options;

  const [state, setState] = useState<DialogState>(null);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const clearResolve = useCallback((ok: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(ok);
  }, []);

  const close = useCallback(() => {
    clearResolve(false);
    setState(null);
  }, [clearResolve]);

  const show = useCallback(
    (
      message: string,
      tone: AppNoticePopupTone = "success",
      opts?: { title?: string; confirmLabel?: string },
    ) => {
      clearResolve(false);
      setState({
        kind: "notice",
        message,
        tone,
        title: opts?.title,
        confirmLabel: opts?.confirmLabel,
      });
    },
    [clearResolve],
  );

  const success = useCallback(
    (message: string, opts?: { title?: string }) => show(message, "success", opts),
    [show],
  );

  const error = useCallback(
    (message: string, opts?: { title?: string }) => show(message, "error", opts),
    [show],
  );

  const warning = useCallback(
    (message: string, opts?: { title?: string }) => show(message, "warning", opts),
    [show],
  );

  const confirm = useCallback(
    (
      message: string,
      opts?: {
        title?: string;
        confirmLabel?: string;
        cancelLabel?: string;
        tone?: AppNoticePopupTone;
      },
    ) =>
      new Promise<boolean>((resolve) => {
        clearResolve(false);
        resolveRef.current = resolve;
        setState({
          kind: "confirm",
          message,
          tone: opts?.tone ?? defaultConfirmTone,
          title: opts?.title ?? defaultConfirmTitle,
          confirmLabel: opts?.confirmLabel ?? defaultConfirmLabel,
          cancelLabel: opts?.cancelLabel,
        });
      }),
    [clearResolve, defaultConfirmLabel, defaultConfirmTitle, defaultConfirmTone],
  );

  const onConfirm = useCallback(() => {
    clearResolve(true);
    setState(null);
  }, [clearResolve]);

  const popup = (
    <AppNoticePopup
      open={Boolean(state)}
      message={state?.message ?? ""}
      tone={state?.tone ?? "success"}
      title={state?.title}
      confirmLabel={state?.confirmLabel}
      cancelLabel={state && state.kind === "confirm" ? state.cancelLabel : undefined}
      onClose={close}
      onConfirm={state?.kind === "confirm" ? onConfirm : undefined}
    />
  );

  return {
    popup,
    show,
    success,
    error,
    warning,
    confirm,
    close,
  };
}
