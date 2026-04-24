"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

async function postLogout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

function LogoutDoorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-[1.125rem] w-[1.125rem]", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.85}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H12"
      />
    </svg>
  );
}

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await postLogout();
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleLogout}
      disabled={pending}
      className={cn(
        "app-btn-soft rounded-xl px-3 py-1.5 text-sm font-medium disabled:opacity-60",
        className,
      )}
    >
      {pending ? "กำลังออก..." : "ออกจากระบบ"}
    </button>
  );
}

/** ปุ่มไอคอนออกจากระบบ — ใช้ใน header แถบบน */
export function LogoutIconButton({ className }: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    try {
      await postLogout();
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      suppressHydrationWarning
      onClick={handleLogout}
      disabled={pending}
      title={pending ? "กำลังออกจากระบบ…" : "ออกจากระบบ"}
      aria-label={pending ? "กำลังออกจากระบบ" : "ออกจากระบบ"}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/65 bg-white/75 text-[#58547f] shadow-sm transition hover:border-red-200/80 hover:bg-red-50/90 hover:text-red-700 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 touch-manipulation",
        className,
      )}
    >
      {pending ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        <LogoutDoorIcon />
      )}
    </button>
  );
}
