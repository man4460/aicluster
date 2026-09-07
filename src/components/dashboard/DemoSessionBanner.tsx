"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

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
 * กล่องเดียวโทนแก้วขาวบนแถบม่วง — ไม่แยกชิปแดง/น้ำเงินตัดกัน
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
      className={cn(
        "hidden shrink-0 self-center lg:inline-flex",
        "h-8 items-center gap-0.5 rounded-full border border-white/30 bg-white/12 p-0.5",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-md",
      )}
      title="บัญชีทดลอง — ไม่ใช่บัญชีจริง · ข้อมูลเป็นตัวอย่าง"
    >
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-bold tracking-tight text-white/95">
        <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
          <span className="absolute inset-0 animate-ping rounded-full bg-amber-300/70" />
          <span className="relative m-auto h-1.5 w-1.5 rounded-full bg-amber-300 ring-1 ring-white/50" />
        </span>
        ทดลองใช้งาน
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => void exitToSignup()}
        className={cn(
          "inline-flex h-7 shrink-0 items-center justify-center rounded-full px-3",
          "bg-white text-[11px] font-black tracking-tight text-[#5b3ac2]",
          "shadow-sm transition-colors hover:bg-white/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          "active:scale-[0.98] disabled:opacity-60",
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
