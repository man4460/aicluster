"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { LoyaltyRewardMenuCard, LoyaltyRewardMenuGrid } from "@/components/app-templates";
import {
  isBuildingPosMemberPhoneReady,
  normalizeBuildingPosMemberPhone,
  type BuildingPosLoyaltyMemberDto,
  type BuildingPosLoyaltyRewardDto,
} from "@/systems/building-pos/lib/loyalty-rule";
import { shopQrTemplateCardClass } from "@/components/qr/shop-qr-template";

type Props = {
  ownerId: string;
  trialSessionId?: string;
  phone: string;
  /** ถ้า true — ไม่โชว์ช่องเบอร์ (กรอกที่หน้าข้อมูลแล้ว) */
  hidePhoneInput?: boolean;
  onPhoneChange?: (digits: string) => void;
  tableNo?: string;
  customerName?: string;
  customerSessionId?: string;
  initialRewards?: BuildingPosLoyaltyRewardDto[];
  onRedeemed?: () => void;
  className?: string;
};

/**
 * ลูกค้า QR — ดูคะแนน + รายการแลก (แลกจริงต้องผ่านพนักงาน)
 */
export function BuildingPosCustomerLoyaltyPanel({
  ownerId,
  trialSessionId,
  phone,
  hidePhoneInput = false,
  onPhoneChange,
  initialRewards = [],
  className,
}: Props) {
  const [member, setMember] = useState<BuildingPosLoyaltyMemberDto | null>(null);
  const [rewards, setRewards] = useState<BuildingPosLoyaltyRewardDto[]>(initialRewards);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setRewards(initialRewards);
  }, [initialRewards]);

  const lookup = useCallback(async () => {
    const digits = normalizeBuildingPosMemberPhone(phone);
    if (!isBuildingPosMemberPhoneReady(digits)) {
      setMember(null);
      setErr(null);
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const params = new URLSearchParams({
        ownerId,
        phone: digits,
      });
      if (trialSessionId) params.set("t", trialSessionId);
      const res = await fetch(`/api/building-pos/public/loyalty?${params}`, { cache: "no-store" });
      const j = (await res.json().catch(() => ({}))) as {
        member?: BuildingPosLoyaltyMemberDto | null;
        rewards?: BuildingPosLoyaltyRewardDto[];
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
    const digits = normalizeBuildingPosMemberPhone(phone);
    if (!isBuildingPosMemberPhoneReady(digits)) {
      setMember(null);
      return;
    }
    const t = window.setTimeout(() => void lookup(), 450);
    return () => window.clearTimeout(t);
  }, [phone, lookup]);

  const phoneReady = isBuildingPosMemberPhoneReady(phone);

  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-fuchsia-50/40 p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">คะแนนสะสม</p>
        {phoneReady ?
          <p className="text-xs font-semibold tabular-nums text-slate-500">
            {normalizeBuildingPosMemberPhone(phone)}
          </p>
        : null}
      </div>

      <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
        การแลกคะแนนต้องยืนยันกับพนักงานที่ร้าน — แจ้งเบอร์นี้ให้พนักงานแลกให้
      </p>

      {!hidePhoneInput && onPhoneChange ?
        <label className="block text-xs font-medium text-slate-600">
          เบอร์โทร
          <div className="mt-1 flex gap-2">
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              placeholder="08xxxxxxxx"
              value={phone}
              onChange={(e) => onPhoneChange(normalizeBuildingPosMemberPhone(e.target.value))}
            />
            <button
              type="button"
              disabled={busy || !phoneReady}
              onClick={() => void lookup()}
              className="shrink-0 rounded-xl border border-violet-200 bg-white px-3 text-xs font-bold text-violet-800 shadow-sm hover:bg-violet-50 disabled:opacity-40"
            >
              ดูคะแนน
            </button>
          </div>
        </label>
      : null}

      {!phoneReady ?
        <p className={cn(shopQrTemplateCardClass, "px-3 py-3 text-sm font-semibold text-slate-600")}>
          กรอกเบอร์ที่หน้าข้อมูล
        </p>
      : member ?
        <p className="rounded-xl bg-white/90 px-3 py-3 text-center text-lg font-black tabular-nums text-violet-700">
          {member.points_balance.toLocaleString("th-TH")} คะแนน
        </p>
      : busy ?
        <p className="rounded-xl bg-white/70 px-3 py-3 text-center text-sm font-semibold text-slate-500">กำลังโหลด…</p>
      : <p className="rounded-xl bg-white/90 px-3 py-3 text-center text-lg font-black tabular-nums text-slate-400">
          0 คะแนน
        </p>
      }

      {rewards.length > 0 ?
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
      : phoneReady ?
        <p className="text-sm font-semibold text-slate-500">ยังไม่มีรายการแลก</p>
      : null}

      {err ? <p className="text-xs font-semibold text-rose-700">{err}</p> : null}
    </div>
  );
}
