"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

const chipClass =
  "inline-flex h-6 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-black leading-none tracking-tight text-white shadow-sm sm:px-2 sm:text-[11px]";

function useDemoLoginNext() {
  const pathname = usePathname() || "/dashboard";
  const nextQ = encodeURIComponent(pathname.startsWith("/") ? pathname : "/dashboard");
  return `/login?next=${nextQ}`;
}

async function postDemoExit(next: string): Promise<void> {
  const fd = new FormData();
  fd.set("next", next);
  await fetch("/api/auth/demo/exit", {
    method: "POST",
    body: fd,
    credentials: "include",
    redirect: "manual",
  });
}

/**
 * ชิปในแถบหัว — เฉพาะ lg+ (มือถือย้ายไปเมนูบัญชี เพื่อไม่แย่งที่ยอดโทเคน)
 */
export function DemoSessionBanner() {
  const loginNext = useDemoLoginNext();
  const [pending, setPending] = useState(false);

  async function exitToSignup() {
    if (pending) return;
    setPending(true);
    try {
      await postDemoExit(loginNext);
      window.location.assign(loginNext);
    } catch {
      setPending(false);
    }
  }

  return (
    <div
      role="status"
      className="hidden h-6 shrink-0 items-center gap-1.5 self-center sm:gap-2 lg:flex"
      title="บัญชีทดลอง — ไม่ใช่บัญชีจริง · ข้อมูลเป็นตัวอย่าง"
    >
      <span className={cn(chipClass, "bg-red-600 ring-1 ring-red-950/25")}>โหมดทดลอง</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => void exitToSignup()}
        className={cn(
          chipClass,
          "bg-[#0000BF] ring-1 ring-[#00008a]/40 transition-all duration-200 ease-out disabled:opacity-60",
          "hover:-translate-y-0.5 hover:scale-105 hover:bg-[#1a1aff] hover:shadow-[0_6px_16px_-4px_rgba(0,0,191,0.75)] hover:ring-2 hover:ring-white/70",
          "focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/80 active:translate-y-0 active:scale-95",
        )}
        title="ออกจากบัญชีทดลอง แล้วไปหน้าเข้าสู่ระบบ / สมัครสมาชิก"
        suppressHydrationWarning
      >
        {pending ? "…" : "สมัครสมาชิก"}
      </button>
    </div>
  );
}

/**
 * บล็อกในเมนูบัญชีมือถือ — สัญลักษณ์/ข้อความว่าเป็นบัญชีทดลอง + ปุ่มสมัครที่ใช้งานได้
 * (ไม่ใช้ form+ปิดเมนูพร้อมกัน — จะยกเลิกการส่งฟอร์ม)
 */
export function DemoSessionAccountMenuItem({ onNavigate }: { onNavigate?: () => void }) {
  const loginNext = useDemoLoginNext();
  const [pending, setPending] = useState(false);

  async function exitToSignup() {
    if (pending) return;
    setPending(true);
    try {
      await postDemoExit(loginNext);
      onNavigate?.();
      window.location.assign(loginNext);
    } catch {
      setPending(false);
    }
  }

  return (
    <div className="mb-1 space-y-1 border-b border-slate-200/80 px-0.5 pb-1.5">
      <p
        className="rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-snug text-amber-950 ring-1 ring-amber-200/80"
        role="note"
      >
        <span className="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white" aria-hidden>
          !
        </span>
        บัญชีนี้เป็น<strong>บัญชีทดลอง</strong>สำหรับดูตัวอย่างระบบ —{" "}
        <strong>ไม่ใช่บัญชีจริง</strong>ของคุณ
      </p>
      <button
        type="button"
        role="menuitem"
        disabled={pending}
        onClick={() => void exitToSignup()}
        className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-[#0000BF] transition-colors hover:bg-[#5b61ff]/10 disabled:opacity-60"
        title="ออกจากบัญชีทดลอง แล้วไปหน้าเข้าสู่ระบบ / สมัครสมาชิก"
        suppressHydrationWarning
      >
        <span className="text-lg" aria-hidden>
          ✨
        </span>
        {pending ? "กำลังไปหน้าสมัคร…" : "สมัครสมาชิก"}
      </button>
    </div>
  );
}
