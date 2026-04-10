"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

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

function captureVideoToJpegFile(video: HTMLVideoElement): Promise<File | null> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return Promise.resolve(null);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(video, 0, 0, w, h);
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(
          new File([blob], `camera-${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          }),
        );
      },
      "image/jpeg",
      0.92,
    );
  });
}

export type AppCameraCaptureModalProps = {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  /** เมื่อ getUserMedia ไม่ได้ — ปิดโมดัลแล้วให้เปิด `<input type="file" capture>` */
  onRequestLegacyPicker?: () => void;
  className?: string;
};

/**
 * ถ่ายรูปจากกล้องจริงผ่าน getUserMedia (ใช้ได้บนเดสก์ท็อปและมือถือเมื่อเป็น HTTPS / localhost)
 */
export function AppCameraCaptureModal({
  open,
  onClose,
  onCapture,
  title = "ถ่ายรูปสลิป",
  onRequestLegacyPicker,
  className,
}: AppCameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  useEffect(() => {
    if (!open) {
      stopStream();
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);
    setReady(false);

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
              "ไม่ได้รับอนุญาตให้ใช้กล้อง — ตรวจสอบไอคอนล็อก/กล้องในแถบที่อยู่ หรือลองปุ่มด้านล่าง"
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

  const handleCapture = useCallback(() => {
    const v = videoRef.current;
    if (!v || !ready) return;
    void captureVideoToJpegFile(v).then((file) => {
      if (!file) return;
      stopStream();
      onCapture(file);
      onClose();
    });
  }, [onCapture, onClose, ready, stopStream]);

  useEffect(() => {
    if (!open) {
      setSecureHint("");
      return;
    }
    setSecureHint(
      typeof window !== "undefined" && !window.isSecureContext ?
        " ต้องใช้ HTTPS (หรือ localhost) เพื่อเปิดกล้อง"
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
      className={cn("fixed inset-0 z-[220] flex items-end justify-center sm:items-center sm:p-4", className)}
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
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-[#2e2a58]">{title}</h2>
          <p className="mt-1 text-xs text-[#66638c]">
            อนุญาตให้เบราว์เซอร์เข้าถึงกล้องเมื่อถูกถาม{secureHint}
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ?
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p>{error}</p>
              {onRequestLegacyPicker ?
                <button
                  type="button"
                  onClick={() => onRequestLegacyPicker()}
                  className="mt-3 w-full rounded-xl border border-emerald-600/50 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-950 touch-manipulation"
                >
                  เลือกรูป / เปิดกล้องแบบระบบ
                </button>
              : null}
            </div>
          : <video
              ref={videoRef}
              className="max-h-[min(55vh,420px)] w-full rounded-xl bg-black object-cover"
              playsInline
              muted
              autoPlay
            />
          }
        </div>
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 touch-manipulation"
          >
            ยกเลิก
          </button>
          {!error ?
            <button
              type="button"
              disabled={!ready}
              onClick={handleCapture}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white touch-manipulation disabled:cursor-not-allowed disabled:opacity-50"
            >
              บันทึกภาพนี้
            </button>
          : null}
        </div>
      </div>
    </div>
  );
}
