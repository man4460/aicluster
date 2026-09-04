"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAppNoticePopup } from "@/components/app-templates";
import { cn } from "@/lib/cn";
import { MODULE_MONTHLY_199_TOKEN_COST } from "@/lib/tokens/token-debt";

type Props = {
  moduleSlug: string;
  /** สิทธิ์ที่ได้หลังอัปเกรด — แสดงใน confirm */
  benefit?: string;
  className?: string;
  /** compact = ปุ่มอย่างเดียว · banner = กล่อง amber + ปุ่ม */
  variant?: "banner" | "button";
  buttonLabel?: string;
  onUpgraded?: () => void;
};

/**
 * ปุ่มอัปเกรดแพ็ก 199 ของโมดูลนี้ — ใช้ตอนโควตาเต็ม / ฟีเจอร์ล็อก
 * (ทำงานแม้ CTA แพ็ก 199 ในหน้า ระบบทั้งหมด จะถูกซ่อนชั่วคราว)
 */
export function ModuleMonthlyUpgradeCta({
  moduleSlug,
  benefit,
  className,
  variant = "banner",
  buttonLabel = "อัปเกรดเป็นแพ็กรายเดือน (199)",
  onUpgraded,
}: Props) {
  const router = useRouter();
  const notice = useAppNoticePopup();
  const [busy, setBusy] = useState(false);

  async function requestUpgrade() {
    const benefitLine = benefit ? `\n\nสิทธิ์หลังอัปเกรด: ${benefit}` : "";
    const ok = await notice.confirm(
      `อัปเกรดโมดูลนี้เป็นแพ็ก 199 / เดือน?\n\nหัก ${MODULE_MONTHLY_199_TOKEN_COST} โทเคนทันที${benefitLine}`,
      {
        title: "ยืนยันอัปเกรด",
        confirmLabel: "อัปเกรด",
        tone: "confirm",
      },
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch("/api/subscription/plan-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ target: "monthly199", moduleSlug }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        alreadyHad?: boolean;
        tokensCharged?: number;
      };
      if (!res.ok) {
        notice.error(data.error ?? "อัปเกรดไม่สำเร็จ", { title: "อัปเกรดไม่ได้" });
        return;
      }
      notice.success(
        data.alreadyHad
          ? "โมดูลนี้เป็นแพ็กรายเดือนอยู่แล้ว"
          : `อัปเกรดสำเร็จ — หัก ${data.tokensCharged ?? MODULE_MONTHLY_199_TOKEN_COST} โทเคน`,
        { title: "อัปเกรดแล้ว" },
      );
      onUpgraded?.();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const button = (
    <button
      type="button"
      disabled={busy}
      onClick={() => void requestUpgrade()}
      className={cn(
        "inline-flex min-h-[40px] items-center justify-center rounded-xl bg-gradient-to-r from-[#0000BF] via-[#8b5cf6] to-[#ec4899] px-4 py-2 text-sm font-bold text-white transition hover:brightness-95 disabled:opacity-50",
        variant === "button" && "w-full sm:w-auto",
      )}
    >
      {busy ? "กำลังอัปเกรด..." : buttonLabel}
    </button>
  );

  if (variant === "button") {
    return (
      <div className={className}>
        {notice.popup}
        {button}
      </div>
    );
  }

  return (
    <div
      role="status"
      className={cn(
        "space-y-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 sm:px-4",
        className,
      )}
    >
      {notice.popup}
      {benefit ? <p className="font-semibold leading-relaxed">{benefit}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {button}
        <Link
          href="/dashboard/plans"
          className="text-xs font-semibold text-[#4d47b6] underline-offset-2 hover:underline"
        >
          ไปหน้าแพ็กเกจ
        </Link>
      </div>
    </div>
  );
}
