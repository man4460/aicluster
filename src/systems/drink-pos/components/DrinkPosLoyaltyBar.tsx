"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { appTemplateOutlineButtonClass } from "@/components/app-templates";
import { DrinkPosButton } from "@/systems/drink-pos/components/DrinkPosButton";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import type { DrinkPosMemberDto } from "@/systems/drink-pos/lib/member-service";
import { formatDrinkPosLoyaltyRule } from "@/systems/drink-pos/lib/loyalty-rule";
import { lsFieldClass } from "@/systems/loyalty-stamp/loyalty-stamp-ui-tokens";

type LoyaltyRule = {
  stampsPerReward: number;
  rewardTitle: string;
};

type Props = {
  member: DrinkPosMemberDto | null;
  onMemberChange: (m: DrinkPosMemberDto | null) => void;
  redeemMode: boolean;
  onRedeemModeChange: (v: boolean) => void;
  /** บนหน้าสมาชิกแล้ว — ไม่แสดงลิงก์กลับ hub */
  hideMembersLink?: boolean;
  /** ถ้าส่งมาแล้วไม่ต้องโหลดจาก profile API */
  loyaltyRule?: LoyaltyRule | null;
};

export function DrinkPosLoyaltyBar({
  member,
  onMemberChange,
  redeemMode,
  onRedeemModeChange,
  hideMembersLink = false,
  loyaltyRule: loyaltyRuleProp = null,
}: Props) {
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loadedRule, setLoadedRule] = useState<LoyaltyRule | null>(null);

  useEffect(() => {
    if (loyaltyRuleProp) {
      setLoadedRule(loyaltyRuleProp);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/drink-pos/profile", { credentials: "include" });
        const j = (await res.json().catch(() => ({}))) as {
          profile?: { stampsPerReward?: number; rewardTitle?: string };
        };
        if (cancelled || !res.ok || !j.profile) return;
        setLoadedRule({
          stampsPerReward: j.profile.stampsPerReward ?? 10,
          rewardTitle: j.profile.rewardTitle ?? "เครื่องดื่มฟรี 1 แก้ว",
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loyaltyRuleProp]);

  const ruleFromMember = member
    ? { stampsPerReward: member.stampsPerReward, rewardTitle: member.rewardTitle }
    : null;
  const rule = loyaltyRuleProp ?? loadedRule ?? ruleFromMember;
  const ruleLabel = rule
    ? formatDrinkPosLoyaltyRule(rule.stampsPerReward, rule.rewardTitle)
    : "สะสมแต้ม";

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
    <div className="rounded-xl border border-[#e8e6fc]/80 bg-gradient-to-br from-white/80 via-[#f5f3ff]/70 to-[#fdf2f8]/55 p-4 shadow-sm ring-1 ring-inset ring-white/55">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-left text-xs font-bold text-[#4d47b6]">สะสมแต้ม ({ruleLabel})</p>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {hideMembersLink ? null : (
            <Link
              href="/dashboard/drink-pos/members"
              className={cn(
                appTemplateOutlineButtonClass,
                "rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]",
              )}
            >
              QR / ลิงก์
            </Link>
          )}
          <Link
            href="/dashboard/drink-pos/settings"
            className={cn(
              appTemplateOutlineButtonClass,
              "rounded-xl px-3 py-1.5 text-[10px] font-black text-[#4d47b6]",
            )}
            aria-label="ตั้งค่าสะสมแต้ม"
          >
            ตั้งค่าแต้ม
          </Link>
        </div>
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
