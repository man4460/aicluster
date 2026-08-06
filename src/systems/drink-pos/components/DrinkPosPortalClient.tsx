"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import type { DrinkPosMemberDto } from "@/systems/drink-pos/lib/member-service";
import { useMounted } from "@/lib/use-mounted";
import { LoyaltyStampCardVisual } from "@/systems/loyalty-stamp/components/LoyaltyStampCardVisual";

type ShopInfo = {
  displayName: string;
  stampsPerReward: number;
  rewardTitle: string;
  stampEmoji: string;
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
  const [member, setMember] = useState<DrinkPosMemberDto | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneOk = useMemo(() => isLoyaltyPhoneSearchReady(phone), [phone]);
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
      const res = await fetch("/api/drink-pos/public/portal/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, phone, trialSessionId }),
      });
      const json = (await res.json()) as { member?: DrinkPosMemberDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "เปิดการ์ดไม่สำเร็จ");
      if (!json.member) throw new Error("ไม่พบข้อมูล");
      setMember(json.member);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เปิดการ์ดไม่สำเร็จ");
      setMember(null);
    } finally {
      setBusy(false);
    }
  }, [ownerId, phone, phoneOk, trialSessionId]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void openCard();
  };

  const slots = useMemo(() => {
    if (!member || !shop) return [];
    const n = Math.max(1, Math.min(shop.stampsPerReward, 30));
    return Array.from({ length: n }, (_, i) => i < member.currentStamps);
  }, [member, shop]);

  if (!mounted) return null;

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-4 text-center">
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">{shopName}</h1>
          <p className="mt-1 text-sm text-[#6b6894]">ตรวจสอบแต้มสะสม — ไม่ต้องโหลดแอป</p>
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
            กรอกเบอร์โทรเพื่อดูแต้ม
          </p>
          <p className="px-5 text-left text-xs text-[#66638c] sm:px-6">
            เบอร์ 10 หลัก หรือ 4 หลักท้าย (ถ้ามีสมาชิกแล้ว)
          </p>
          <div className="relative px-5 pb-5 pt-3 sm:px-6">
            <span className="pointer-events-none absolute left-8 top-[calc(50%-2px)] -translate-y-1/2 text-[#0000BF]" aria-hidden>
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
              {busy ? "กำลังค้นหา…" : "ดูแต้มของฉัน"}
            </button>
          </div>
        </form>
      ) : shop ? (
        <div className="space-y-3">
          <LoyaltyStampCardVisual
            shopName={shopName}
            stampEmoji={shop.stampEmoji}
            slots={slots}
            stampsPerReward={member.stampsPerReward}
            currentStamps={member.currentStamps}
            rewardTitle={member.rewardTitle}
            customerLabel={
              member.customerName
                ? `${member.customerName} · ${member.phone}`
                : member.phone
            }
            readyToRedeem={member.readyToRedeem}
          />
          <button
            type="button"
            className="w-full rounded-2xl border border-white/60 bg-white/70 py-3 text-sm font-bold text-[#4d47b6] backdrop-blur-md"
            onClick={() => {
              setMember(null);
              setErr(null);
            }}
          >
            เปลี่ยนเบอร์
          </button>
        </div>
      ) : null}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
