"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { shopQrTemplateCardClass } from "@/components/qr/shop-qr-template";
import { LoyaltyRewardMenuCard, LoyaltyRewardMenuGrid } from "@/components/app-templates";
import {
  isDrinkPosMemberPhoneReady,
  normalizeDrinkPosMemberPhone,
  type DrinkPosLoyaltyMemberDto,
  type DrinkPosLoyaltyRewardDto,
} from "@/systems/drink-pos/lib/loyalty-rule";

type Props = {
  ownerId: string;
  trialSessionId?: string;
  phone: string;
  hidePhoneInput?: boolean;
  onPhoneChange?: (digits: string) => void;
  customerName?: string;
  initialRewards?: DrinkPosLoyaltyRewardDto[];
  onRedeemed?: () => void;
  className?: string;
};

/** ลูกค้า — ดูคะแนน + รายการแลก (แลกจริงต้องผ่านพนักงาน) */
export function DrinkPosCustomerLoyaltyPanel({
  ownerId,
  trialSessionId,
  phone,
  hidePhoneInput = false,
  onPhoneChange,
  initialRewards = [],
  className,
}: Props) {
  const [member, setMember] = useState<DrinkPosLoyaltyMemberDto | null>(null);
  const [rewards, setRewards] = useState<DrinkPosLoyaltyRewardDto[]>(initialRewards);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setRewards(initialRewards);
  }, [initialRewards]);

  const lookup = useCallback(async () => {
    const digits = normalizeDrinkPosMemberPhone(phone);
    if (!isDrinkPosMemberPhoneReady(digits)) {
      setMember(null);
      setErr(null);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ ownerId, phone: digits });
      if (trialSessionId) params.set("t", trialSessionId);
      const res = await fetch(`/api/drink-pos/public/loyalty?${params}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        member?: DrinkPosLoyaltyMemberDto | null;
        rewards?: DrinkPosLoyaltyRewardDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "ดูคะแนนไม่สำเร็จ");
      setMember(j.member ?? null);
      if (Array.isArray(j.rewards) && j.rewards.length > 0) setRewards(j.rewards);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "ดูคะแนนไม่สำเร็จ");
      setMember(null);
    } finally {
      setBusy(false);
    }
  }, [ownerId, phone, trialSessionId]);

  useEffect(() => {
    const digits = normalizeDrinkPosMemberPhone(phone);
    if (!isDrinkPosMemberPhoneReady(digits)) {
      setMember(null);
      return;
    }
    const t = window.setTimeout(() => void lookup(), 450);
    return () => window.clearTimeout(t);
  }, [phone, lookup]);

  const phoneReady = isDrinkPosMemberPhoneReady(phone);

  return (
    <div className={cn(shopQrTemplateCardClass, "space-y-3 p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">คะแนนสะสม</p>
        {phoneReady ? (
          <p className="text-xs font-semibold tabular-nums text-slate-500">
            {normalizeDrinkPosMemberPhone(phone)}
          </p>
        ) : null}
      </div>

      <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
        การแลกคะแนนต้องยืนยันกับพนักงานที่ร้าน — แจ้งเบอร์นี้ให้พนักงานแลกให้
      </p>

      {!hidePhoneInput && onPhoneChange ? (
        <label className="block text-xs font-medium text-slate-600">
          เบอร์โทร
          <div className="mt-1 flex gap-2">
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums"
              placeholder="08xxxxxxxx"
              value={phone}
              onChange={(e) => onPhoneChange(normalizeDrinkPosMemberPhone(e.target.value))}
            />
            <button
              type="button"
              disabled={busy || !phoneReady}
              onClick={() => void lookup()}
              className="shrink-0 rounded-xl border border-violet-200 bg-white px-3 text-xs font-bold text-violet-800 disabled:opacity-40"
            >
              ดูคะแนน
            </button>
          </div>
        </label>
      ) : null}

      {!phoneReady ? (
        <p className="text-sm text-slate-600">กรอกเบอร์ที่หน้าข้อมูลก่อน</p>
      ) : member ? (
        <p className="text-2xl font-black tabular-nums text-[#4d47b6]">
          {member.points_balance.toLocaleString("th-TH")}
          <span className="ml-1 text-sm font-bold text-slate-500">คะแนน</span>
        </p>
      ) : (
        <p className="text-sm text-slate-600">ยังไม่มีคะแนนบนเบอร์นี้</p>
      )}

      {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}

      {rewards.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-violet-800">รายการแลก (แจ้งพนักงาน)</p>
          <LoyaltyRewardMenuGrid>
            {rewards.map((r) => (
              <LoyaltyRewardMenuCard
                key={r.id}
                title={r.title}
                pointsCost={r.points_cost}
                imageUrl={r.image_url}
                disabled={member == null || member.points_balance < r.points_cost}
              />
            ))}
          </LoyaltyRewardMenuGrid>
        </div>
      ) : null}
    </div>
  );
}
