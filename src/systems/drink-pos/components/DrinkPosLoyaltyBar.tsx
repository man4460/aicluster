"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import type { DrinkPosMemberDto } from "@/systems/drink-pos/lib/member-service";
import { lsFieldClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type Props = {
  member: DrinkPosMemberDto | null;
  onMemberChange: (m: DrinkPosMemberDto | null) => void;
  redeemMode: boolean;
  onRedeemModeChange: (v: boolean) => void;
  /** บนหน้าสมาชิกแล้ว — ไม่แสดงลิงก์กลับ hub */
  hideMembersLink?: boolean;
};

export function DrinkPosLoyaltyBar({
  member,
  onMemberChange,
  redeemMode,
  onRedeemModeChange,
  hideMembersLink = false,
}: Props) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const lookup = useCallback(async () => {
    if (!isLoyaltyPhoneSearchReady(phone)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/drink-pos/members/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const j = (await res.json().catch(() => ({}))) as { member?: DrinkPosMemberDto; error?: string };
      if (!res.ok) throw new Error(j.error ?? "ค้นหาไม่สำเร็จ");
      if (!j.member) throw new Error("ไม่พบสมาชิก");
      onMemberChange(j.member);
      setPhone(j.member.phone);
    } catch (e) {
      onMemberChange(null);
      setErr(e instanceof Error ? e.message : "ค้นหาไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [phone, onMemberChange]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void lookup();
  };

  return (
    <div className="rounded-[2rem] border border-white/55 bg-gradient-to-br from-white/55 via-amber-50/20 to-violet-50/15 p-4 backdrop-blur-xl ring-1 ring-inset ring-white/50 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-left text-xs font-bold text-[#4d47b6]">สะสมแต้ม (ซื้อ 10 แก้ว ฟรี 1 แก้ว)</p>
        {hideMembersLink ? null : (
          <Link
            href="/dashboard/drink-pos/members"
            className={cn(appTemplateOutlineButtonClass, "shrink-0 rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]")}
          >
            QR / ลิงก์ลูกค้า
          </Link>
        )}
      </div>
      <form onSubmit={onSubmit} className="mt-2 flex items-stretch gap-2">
        <input
          type="tel"
          suppressHydrationWarning
          className={cn(lsFieldClass, "min-w-0 flex-1")}
          placeholder="เบอร์ 10 หลัก หรือ 4 หลักท้าย"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <DrinkPosButton
          type="submit"
          disabled={busy || !isLoyaltyPhoneSearchReady(phone)}
          className="app-btn-primary min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold"
        >
          {busy ? "…" : "ค้นหา"}
        </DrinkPosButton>
      </form>
      {err ? <p className="mt-2 text-left text-sm text-rose-600">{err}</p> : null}
      {member ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-left">
          <div>
            <p className="text-sm font-black text-[#1e1b4b]">
              {member.customerName || "สมาชิก"} · {member.phone}
            </p>
            <p className="text-xs text-[#66638c]">
              แต้ม {member.currentStamps}/{member.stampsPerReward}
              {member.readyToRedeem ? " · พร้อมแลกฟรี" : ""}
            </p>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs font-bold text-[#4d47b6]">
            <input
              type="checkbox"
              checked={redeemMode}
              disabled={!member.readyToRedeem}
              onChange={(e) => onRedeemModeChange(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            แลก{member.rewardTitle}
          </label>
        </div>
      ) : null}
    </div>
  );
}
