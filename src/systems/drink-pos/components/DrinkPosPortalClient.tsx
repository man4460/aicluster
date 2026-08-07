"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
  LoyaltyRewardMenuCard,
  LoyaltyRewardMenuGrid,
} from "@/components/app-templates";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import type {
  DrinkPosLoyaltyMemberDto,
  DrinkPosLoyaltyRewardDto,
} from "@/systems/drink-pos/lib/loyalty-rule";
import { useMounted } from "@/lib/use-mounted";

type ShopInfo = {
  displayName: string;
  rulePreview: string;
  loyaltyEnabled: boolean;
};

const inputClass =
  "w-full rounded-2xl border border-white/70 bg-white/60 py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#0000BF]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#0000BF]/15";

export function DrinkPosPortalClient({
  ownerId,
  trialSessionId,
}: {
  ownerId: string;
  trialSessionId?: string;
}) {
  const mounted = useMounted();
  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [phone, setPhone] = useState("");
  const [member, setMember] = useState<DrinkPosLoyaltyMemberDto | null>(null);
  const [rewards, setRewards] = useState<DrinkPosLoyaltyRewardDto[]>([]);
  const [rulePreview, setRulePreview] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneOk = useMemo(() => isLoyaltyPhoneSearchReady(phone) && phone.replace(/\D/g, "").length >= 9, [phone]);
  const shopName = shop?.displayName?.trim() || "ร้านเครื่องดื่ม";

  useEffect(() => {
    const q = trialSessionId
      ? `?ownerId=${ownerId}&t=${encodeURIComponent(trialSessionId)}`
      : `?ownerId=${ownerId}`;
    setShopLoading(true);
    void fetch(`/api/drink-pos/public/portal/info${q}`)
      .then((r) => r.json())
      .then((j: { shop?: ShopInfo; error?: string }) => {
        if (j.shop) setShop(j.shop);
        else setErr(j.error ?? "โหลดไม่สำเร็จ");
      })
      .catch(() => setErr("โหลดไม่สำเร็จ"))
      .finally(() => setShopLoading(false));
  }, [ownerId, trialSessionId]);

  const openCard = useCallback(async () => {
    if (!phoneOk) return;
    setBusy(true);
    setErr(null);
    try {
      const digits = phone.replace(/\D/g, "");
      const qs = new URLSearchParams({
        ownerId,
        phone: digits,
      });
      if (trialSessionId) qs.set("t", trialSessionId);
      const res = await fetch(`/api/drink-pos/public/loyalty?${qs.toString()}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as {
        enabled?: boolean;
        member?: DrinkPosLoyaltyMemberDto | null;
        rewards?: DrinkPosLoyaltyRewardDto[];
        rule_preview?: string;
        hint?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "เปิดการ์ดไม่สำเร็จ");
      if (json.enabled === false) throw new Error("ร้านยังไม่เปิดสะสมคะแนน");
      setMember(json.member ?? null);
      setRewards(Array.isArray(json.rewards) ? json.rewards : []);
      if (json.rule_preview) setRulePreview(json.rule_preview);
      if (!json.member && json.hint) setErr(json.hint);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เปิดการ์ดไม่สำเร็จ");
      setMember(null);
      setRewards([]);
    } finally {
      setBusy(false);
    }
  }, [ownerId, phone, phoneOk, trialSessionId]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void openCard();
  };

  if (!mounted) return null;

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">{shopName}</h1>
        </div>
        {shopLoading ? (
          <div className={appPublicCheckInGlassCardClass} aria-hidden>
            <div className="h-24 animate-pulse rounded-2xl bg-white/40" />
          </div>
        ) : null}
        {err && !member ? (
          <p className="text-center text-sm font-semibold text-rose-600">{err}</p>
        ) : null}

        {!member ? (
          <form onSubmit={onSubmit} className={appPublicCheckInGlassCardClass}>
            <p className="px-5 pt-5 text-left text-sm font-bold text-[#1e1b4b] sm:px-6">
              เบอร์โทรสะสมคะแนน
            </p>
            {shop?.rulePreview || rulePreview ? (
              <p className="px-5 text-left text-xs text-[#66638c] sm:px-6">
                {shop?.rulePreview || rulePreview}
              </p>
            ) : null}
            <div className="relative px-5 pb-5 pt-3 sm:px-6">
              <span
                className="pointer-events-none absolute left-8 top-[calc(50%-2px)] -translate-y-1/2 text-[#0000BF]"
                aria-hidden
              >
                📱
              </span>
              <input
                type="tel"
                suppressHydrationWarning
                className={inputClass}
                placeholder="0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="border-t border-white/50 px-5 pb-5 sm:px-6">
              <button
                type="submit"
                disabled={busy || !phoneOk}
                className="app-btn-primary min-h-[52px] w-full rounded-2xl text-base font-black"
              >
                {busy ? "กำลังค้นหา…" : "ดูคะแนน"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className={appPublicCheckInGlassCardClass}>
              <div className="space-y-2 px-5 py-5 sm:px-6">
                <p className="text-sm font-bold text-[#1e1b4b]">
                  {member.customer_name || "สมาชิก"} · {member.phone}
                </p>
                <p className="text-3xl font-black tabular-nums text-[#4d47b6]">
                  {member.points_balance.toLocaleString("th-TH")}
                  <span className="ml-1 text-base font-bold text-[#66638c]">คะแนน</span>
                </p>
                {rulePreview || shop?.rulePreview ? (
                  <p className="text-xs text-[#66638c]">{rulePreview || shop?.rulePreview}</p>
                ) : null}
                <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-950">
                  การแลกคะแนนต้องยืนยันกับพนักงานที่ร้าน — แจ้งเบอร์นี้ให้พนักงานแลกให้
                </p>
                {err ? <p className="text-sm font-semibold text-rose-600">{err}</p> : null}
              </div>
              {rewards.length > 0 ? (
                <div className="space-y-2 border-t border-white/50 px-5 py-4 sm:px-6">
                  <p className="text-[11px] font-bold text-[#4d47b6]">รายการแลก (แจ้งพนักงาน)</p>
                  <LoyaltyRewardMenuGrid>
                    {rewards.map((r) => (
                      <LoyaltyRewardMenuCard
                        key={r.id}
                        title={r.title}
                        pointsCost={r.points_cost}
                        imageUrl={r.image_url}
                        disabled={member.points_balance < r.points_cost}
                      />
                    ))}
                  </LoyaltyRewardMenuGrid>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="w-full rounded-2xl border border-white/60 bg-white/70 py-3 text-sm font-bold text-[#4d47b6] backdrop-blur-md"
              onClick={() => {
                setMember(null);
                setRewards([]);
                setErr(null);
              }}
            >
              เปลี่ยนเบอร์
            </button>
          </div>
        )}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
