"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import {
  AppPublicCheckInGlassPage,
  appPublicCheckInGlassCardClass,
} from "@/components/app-templates";
import { isLoyaltyPhoneSearchReady } from "@/lib/loyalty-stamp/member-qr";
import type { LoyaltyMemberDto } from "@/lib/loyalty-stamp/member-service";
import { useMounted } from "@/lib/use-mounted";
import { LoyaltyStampCardVisual } from "@/systems/loyalty-stamp/components/LoyaltyStampCardVisual";

type ShopInfo = {
  displayName: string;
  tagline: string | null;
  stampsPerReward: number;
  rewardTitle: string;
  rewardDescription: string | null;
  stampEmoji: string;
};

const inputClass =
  "w-full rounded-2xl border border-white/70 bg-white/60 py-3.5 pl-11 pr-4 text-sm font-semibold text-[#1e1b4b] shadow-[inset_0_1px_2px_rgba(30,27,75,0.06)] backdrop-blur-sm outline-none transition-all placeholder:text-[#a8a5cc] focus:border-[#5b61ff]/50 focus:bg-white/80 focus:ring-2 focus:ring-[#5b61ff]/15";

function PortalSkeleton() {
  return (
    <>
      <div className={appPublicCheckInGlassCardClass} aria-hidden>
        <div className="flex items-stretch gap-2 px-5 py-5 sm:px-6">
          <div className="h-[52px] min-w-0 flex-1 animate-pulse rounded-2xl bg-white/50" />
          <div className="h-[52px] w-[52px] shrink-0 animate-pulse rounded-2xl bg-white/50" />
        </div>
      </div>
      <div className={appPublicCheckInGlassCardClass} aria-hidden>
        <div className="space-y-3 px-5 py-5 sm:px-6">
          <div className="h-4 w-28 animate-pulse rounded bg-white/40" />
          <div className="h-12 animate-pulse rounded-2xl bg-white/50" />
        </div>
      </div>
    </>
  );
}

export function LoyaltyStampPortalClient({
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
  const [name, setName] = useState("");
  const [member, setMember] = useState<LoyaltyMemberDto | null>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const phoneOk = useMemo(() => isLoyaltyPhoneSearchReady(phone), [phone]);
  const shopName = shop?.displayName?.trim() || "สะสมแต้มดิจิทัล";

  useEffect(() => {
    const q = trialSessionId ? `?ownerId=${ownerId}&t=${encodeURIComponent(trialSessionId)}` : `?ownerId=${ownerId}`;
    setShopLoading(true);
    void fetch(`/api/loyalty-stamp/public/portal/info${q}`)
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
      const res = await fetch("/api/loyalty-stamp/public/portal/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          phone,
          customerName: name.trim() || null,
          trialSessionId,
        }),
      });
      const json = (await res.json()) as { member?: LoyaltyMemberDto; error?: string };
      if (!res.ok) throw new Error(json.error ?? "เปิดการ์ดไม่สำเร็จ");
      if (!json.member) throw new Error("ไม่พบข้อมูล");
      setMember(json.member);
      const img = await QRCode.toDataURL(json.member.qrPayload, { width: 200, margin: 1 });
      setQrImg(img);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "เปิดการ์ดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, [ownerId, phone, name, phoneOk, trialSessionId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!phoneOk) {
      setErr("กรอกเบอร์โทรอย่างน้อย 9 หลัก");
      return;
    }
    await openCard();
  }

  if (!mounted) return null;

  return (
    <AppPublicCheckInGlassPage>
      <div className="relative mx-auto max-w-md space-y-4">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-white/70 bg-gradient-to-br from-white/80 to-violet-100/60 shadow-[0_8px_24px_-8px_rgba(91,97,255,0.35)] backdrop-blur-xl ring-1 ring-inset ring-white/70">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7 text-[#5b61ff]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <path d="M8 9h8M8 13h5" strokeLinecap="round" />
              <circle cx="17" cy="9" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#1e1b4b]">{shopName}</h1>
          <p className="mt-1 text-sm text-[#6b6894]">
            {shop?.tagline?.trim() || "การ์ดสะสมแต้มดิจิทัล — ไม่ต้องโหลดแอป"}
          </p>
        </div>

        {shopLoading ? (
          <PortalSkeleton />
        ) : !member ? (
          <>
            <div className={appPublicCheckInGlassCardClass}>
              <div className="px-5 py-5 sm:px-6">
                <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
                  <div className="flex items-stretch gap-2">
                    <div className="relative min-w-0 flex-1">
                      {!phone ? (
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9490c0]">
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                        </span>
                      ) : null}
                      <input
                        id="ls-portal-phone"
                        type="tel"
                        suppressHydrationWarning
                        className={phone ? inputClass.replace("pl-11", "pl-4") : inputClass}
                        placeholder="0812345678 หรือ 4 หลักท้าย"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                        autoComplete="tel"
                      />
                    </div>
                    <button
                      type="submit"
                      suppressHydrationWarning
                      disabled={!phoneOk || busy}
                      aria-label={busy ? "กำลังเปิดการ์ด" : "เปิดการ์ดสะสมแต้ม"}
                      className="inline-flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-[#5b61ff]/30 bg-gradient-to-br from-[#5b61ff] to-[#6a63ff] text-white shadow-[0_12px_28px_-10px_rgba(91,97,255,0.65)] transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {busy ? (
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                          <rect x="4" y="5" width="16" height="14" rx="2" />
                          <path d="M8 9h8M8 13h5" strokeLinecap="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <label className="block text-left text-xs font-bold text-[#6b6894]" htmlFor="ls-portal-name">
                    ชื่อ (ไม่บังคับ)
                  </label>
                  <input
                    id="ls-portal-name"
                    type="text"
                    className={inputClass.replace("pl-11", "pl-4")}
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 100))}
                    placeholder="ชื่อเล่น"
                  />
                  {err ? <p className="text-left text-sm text-rose-600">{err}</p> : null}
                </form>
              </div>
            </div>
            <p className="text-center text-xs text-[#9490c0]">
              เบอร์ครบ 10 หลักลงทะเบียนใหม่ได้ · 4 หลักท้ายใช้เปิดการ์ดเดิม
            </p>
          </>
        ) : (
          <div className="space-y-4">
            <LoyaltyStampCardVisual
              shopName={shopName}
              stampEmoji={member.stampEmoji}
              slots={member.slots}
              stampsPerReward={member.stampsPerReward}
              currentStamps={member.currentStamps}
              rewardTitle={member.rewardTitle}
              rewardDescription={member.rewardDescription}
              customerLabel={`${member.customerName || "สมาชิก"} · ${member.phone}`}
              readyToRedeem={member.readyToRedeem}
            />
            {qrImg ? (
              <div className={appPublicCheckInGlassCardClass}>
                <div className="px-5 py-5 text-center sm:px-6">
                  <p className="text-left text-xs font-bold text-[#5b61ff]">QR ให้ร้านสแกนเพิ่มแต้ม</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrImg} alt="QR สมาชิก" className="mx-auto mt-3 h-48 w-48 rounded-2xl bg-white p-2" />
                  <p className="mt-2 text-left text-xs text-[#66638c]">แสดง QR นี้เมื่อซื้อที่ร้าน</p>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setMember(null);
                setQrImg(null);
                setErr(null);
              }}
              className="w-full rounded-2xl border border-white/70 bg-white/50 py-3 text-sm font-bold text-[#5b61ff] backdrop-blur-sm transition hover:bg-white/70"
            >
              เปลี่ยนเบอร์โทร
            </button>
          </div>
        )}
      </div>
    </AppPublicCheckInGlassPage>
  );
}
