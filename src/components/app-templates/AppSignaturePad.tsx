"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "./dashboard-tokens";

export type AppSignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toPngBlob: () => Promise<Blob | null>;
  toDataUrl: () => string | null;
};

export type AppSignaturePadProps = {
  className?: string;
  /** ความสูงพื้นที่วาด — ค่าเริ่มเหมาะแท็บเล็ต/มือถือ */
  height?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  onStrokeChange?: (hasStroke: boolean) => void;
};

/**
 * ลงชื่อด้วยนิ้ว / ปากกา (stylus) บน canvas — ใช้ตอนหักแพ็กหรือยืนยันใช้บริการ
 */
export const AppSignaturePad = forwardRef<AppSignaturePadHandle, AppSignaturePadProps>(
  function AppSignaturePad(
    {
      className,
      height = 168,
      disabled = false,
      label = "ลงชื่อลูกค้า",
      hint = "ใช้นิ้วหรือปากกา (เช่น Apple Pencil) เซ็นในกรอบ",
      onStrokeChange,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawingRef = useRef(false);
    const emptyRef = useRef(true);
    const [hasStroke, setHasStroke] = useState(false);

    const markStroke = useCallback(() => {
      if (!emptyRef.current) return;
      emptyRef.current = false;
      setHasStroke(true);
      onStrokeChange?.(true);
    }, [onStrokeChange]);

    const clear = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      emptyRef.current = true;
      setHasStroke(false);
      onStrokeChange?.(false);
    }, [onStrokeChange]);

    const syncCanvasSize = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      const cssW = Math.max(280, Math.floor(parent?.clientWidth || canvas.clientWidth || 320));
      const cssH = height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const prev = canvas.toDataURL("image/png");
      const hadInk = !emptyRef.current;
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1e1b4b";
      ctx.lineWidth = 2.4;
      if (hadInk) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, cssW, cssH);
        };
        img.src = prev;
      } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cssW, cssH);
      }
    }, [height]);

    useEffect(() => {
      syncCanvasSize();
      const onResize = () => syncCanvasSize();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [syncCanvasSize]);

    useImperativeHandle(
      ref,
      () => ({
        clear,
        isEmpty: () => emptyRef.current,
        toPngBlob: () =>
          new Promise((resolve) => {
            const canvas = canvasRef.current;
            if (!canvas || emptyRef.current) {
              resolve(null);
              return;
            }
            canvas.toBlob((b) => resolve(b), "image/png");
          }),
        toDataUrl: () => {
          const canvas = canvasRef.current;
          if (!canvas || emptyRef.current) return null;
          return canvas.toDataURL("image/png");
        },
      }),
      [clear],
    );

    function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      canvas.setPointerCapture(e.pointerId);
      drawingRef.current = true;
      const { x, y } = pointerPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      markStroke();
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (disabled || !drawingRef.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = pointerPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
      markStroke();
    }

    function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      try {
        canvasRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-black text-[#1e1b4b]">{label}</p>
            {hint ? <p className="mt-0.5 text-[11px] font-medium text-[#66638c]">{hint}</p> : null}
          </div>
          <button
            type="button"
            disabled={disabled || !hasStroke}
            onClick={clear}
            className={cn(
              appTemplateOutlineButtonClass,
              "min-h-[40px] shrink-0 px-3 text-xs font-bold disabled:opacity-40",
            )}
          >
            ล้างลายเซ็น
          </button>
        </div>
        <div
          className={cn(
            "overflow-hidden rounded-[1.25rem] border-2 border-dashed border-[#cfcaf0] bg-white shadow-inner",
            disabled && "opacity-60",
          )}
        >
          <canvas
            ref={canvasRef}
            className="touch-none block w-full cursor-crosshair"
            style={{ height }}
            aria-label={label}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
        {!hasStroke ? (
          <p className="text-[11px] font-semibold text-amber-800">ยังไม่ได้ลงชื่อ — กรุณาเซ็นในกรอบก่อนหักแพ็ก</p>
        ) : (
          <p className="text-[11px] font-semibold text-emerald-800">มีลายเซ็นแล้ว</p>
        )}
      </div>
    );
  },
);
