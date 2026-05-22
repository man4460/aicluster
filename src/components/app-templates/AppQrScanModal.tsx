"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { decodeQrFromVideoFrame } from "@/components/app-templates/decode-qr-from-video";

async function openCameraStream(): Promise<MediaStream> {
  const md = navigator.mediaDevices;
  if (!md?.getUserMedia) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับการเปิดกล้องจากหน้าเว็บ");
  }
  const candidates: MediaStreamConstraints[] = [
    { audio: false, video: { facingMode: { ideal: "environment" } } },
    { audio: false, video: { facingMode: "user" } },
    { audio: false, video: true },
  ];
  let last: unknown;
  for (const constraints of candidates) {
    try {
      return await md.getUserMedia(constraints);
    } catch (e) {
      last = e;
    }
  }
  throw last instanceof Error ? last : new Error("ไม่สามารถเปิดกล้องได้");
}

export type AppQrScanModalProps = {
  open: boolean;
  onClose: () => void;
  /** ได้ข้อความจาก QR แล้ว — โมดัลปิดอัตโนมัติ */
  onScan: (text: string) => void;
  title?: string;
  hint?: string;
  className?: string;
};

/**
 * สแกน QR จากกล้องอุปกรณ์ (มือถือ/เดสก์ท็อป HTTPS) — ใช้กับลูกค้ายื่น QR บนจอ
 */
export function AppQrScanModal({
  open,
  onClose,
  onScan,
  title = "สแกน QR",
  hint = "จ่อกล้องให้ตรง QR บนมือถือลูกค้า — ระบบจะอ่านอัตโนมัติ",
  className,
}: AppQrScanModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [secureHint, setSecureHint] = useState("");

  const stopStream = useCallback(() => {
    const s = streamRef.current;
    streamRef.current = null;
    s?.getTracks().forEach((t) => t.stop());
    const v = videoRef.current;
    if (v) v.srcObject = null;
    setReady(false);
  }, []);

  const finishScan = useCallback(
    (text: string) => {
      if (handledRef.current) return;
      handledRef.current = true;
      stopStream();
      onScan(text);
      onClose();
    },
    [onClose, onScan, stopStream],
  );

  useEffect(() => {
    if (!open) {
      handledRef.current = false;
      stopStream();
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);
    setReady(false);
    handledRef.current = false;

    void (async () => {
      try {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          throw new Error("ต้องเปิดผ่าน HTTPS หรือ localhost เพื่อใช้กล้อง");
        }
        const stream = await openCameraStream();
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
          if (!cancelled) setReady(true);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "ไม่สามารถเปิดกล้องได้";
          const friendly =
            /Permission|NotAllowed|denied/i.test(msg) ?
              "ไม่ได้รับอนุญาตให้ใช้กล้อง — ตรวจสอบการอนุญาตในเบราว์เซอร์"
            : msg;
          setError(friendly);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, stopStream]);

  useEffect(() => {
    if (!open || !ready || error) return;

    let raf = 0;
    let busy = false;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (busy || handledRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      busy = true;
      void decodeQrFromVideoFrame(video, canvas)
        .then((text) => {
          if (text && !handledRef.current) finishScan(text);
        })
        .finally(() => {
          busy = false;
        });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [open, ready, error, finishScan]);

  useEffect(() => {
    if (!open) return;
    setSecureHint(
      typeof window !== "undefined" && !window.isSecureContext ?
        " ต้องใช้ HTTPS (หรือ localhost)"
      : "",
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn("fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-4", className)}
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]"
        aria-label="ปิด"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[#2e2a58]">{title}</h2>
          <p className="mt-1 text-xs text-[#66638c]">
            {hint}
            {secureHint}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ?
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p>{error}</p>
            </div>
          : <div className="relative overflow-hidden rounded-[1.25rem] bg-black">
              <video
                ref={videoRef}
                className="aspect-[4/3] max-h-[min(55vh,420px)] w-full object-cover"
                playsInline
                muted
                autoPlay
              />
              <canvas ref={canvasRef} className="hidden" aria-hidden />
              <div
                className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/70 shadow-[inset_0_0_0_9999px_rgba(0,0,0,0.25)]"
                aria-hidden
              />
              {ready ?
                <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs font-bold text-white drop-shadow">
                  กำลังสแกน…
                </p>
              : null}
            </div>
          }
        </div>
        <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 touch-manipulation"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
