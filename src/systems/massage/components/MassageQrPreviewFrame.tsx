"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Accent = "customer" | "staff";

/** กรอบไล่สีชั้นเดียว (p-[2px]) + พื้นในโปร่ง — ไม่ซ้อน shell/inner ซ้ำ */
function previewGradientBorder(accent: Accent) {
  return accent === "staff" ?
      "bg-gradient-to-br from-[#6366f1] via-[#a855f7] to-[#f472b6]"
    : "bg-gradient-to-br from-emerald-400 via-[#2dd4bf] to-[#6366f1]";
}

function previewLabelGradient(accent: Accent) {
  return accent === "staff" ?
      "from-[#5b61ff] via-[#a855f7] to-[#ec4899]"
    : "from-emerald-600 via-teal-600 to-[#4d47b6]";
}

export function MassageQrPreviewFrame({
  className,
  accent = "customer",
  children,
}: {
  className?: string;
  accent?: Accent;
  children: ReactNode;
}) {
  const glowB =
    accent === "staff" ?
      "bg-fuchsia-400/14"
    : "bg-teal-300/18";

  return (
    <div className={cn("mt-8 min-w-0", className)}>
      <div className="mb-4 flex flex-col items-center gap-1 text-center">
        <span
          className={cn(
            "bg-gradient-to-r bg-clip-text text-[11px] font-black uppercase tracking-[0.22em] text-transparent",
            previewLabelGradient(accent),
          )}
        >
          {accent === "staff" ? "โปสเตอร์ · พิมพ์ / ติดป้าย" : "ตัวอย่างโปสเตอร์"}
        </span>
        <span className="max-w-md text-xs font-medium leading-snug text-[#8b87ad]">
          {accent === "staff" ?
            "ออกแบบให้พนักงานใช้บนมือถือเป็นหลัก — สแกน QR หรือเปิดลิงก์ · โปสเตอร์ด้านล่างสำหรับติดป้าย"
          : "สำหรับวางที่ร้าน — ลูกค้าสแกนเข้าพอร์ทัล"}
        </span>
      </div>

      <div
        className={cn(
          "rounded-[2rem] p-[2px] shadow-[0_24px_60px_-36px_rgba(91,97,255,0.38)] sm:rounded-[2rem]",
          previewGradientBorder(accent),
        )}
      >
        <div className="relative overflow-hidden rounded-[1.25rem] bg-white/35 px-4 py-6 backdrop-blur-md sm:rounded-[2rem] sm:px-7 sm:py-8">
          <div
            className="pointer-events-none absolute -left-20 top-[22%] h-44 w-44 -translate-y-1/2 rounded-full bg-[#5b61ff]/14 blur-3xl"
            aria-hidden
          />
          <div
            className={cn(
              "pointer-events-none absolute -right-16 bottom-[-18%] h-40 w-40 rounded-full blur-3xl",
              glowB,
            )}
            aria-hidden
          />
          <div className="relative z-[1] flex w-full flex-col items-center justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
