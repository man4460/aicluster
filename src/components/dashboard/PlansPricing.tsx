"use client";

import type { SubscriptionTier, SubscriptionType } from "@/generated/prisma/enums";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import QRCode from "qrcode";
import {
  DAILY_LINE_PLAN_SUMMARY,
  MODULE_GROUP_TIER_NAME,
  PLAN_PRICES,
  PRICE_TO_TIER,
  TIER_SUBSCRIPTION_TOKEN_COST,
  buffetTierMaxGroup,
  computeBuffetSubscriptionTokenCharge,
  isBuffetTierOpenForPurchase,
  tierGroupBullets,
} from "@/lib/module-permissions";
import { FormModal, FormModalFooterActions } from "@/components/ui/FormModal";

type Props = {
  showUpgradeHint?: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionType: SubscriptionType;
  tokens: number;
};

type TopUpState = {
  planPrice: number;
  shortfallTokens: number;
  balance: number;
  amountBaht: number;
};

export function PlansPricing({
  showUpgradeHint,
  subscriptionTier,
  subscriptionType,
  tokens,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUp, setTopUp] = useState<TopUpState | null>(null);
  const [topUpOrderId, setTopUpOrderId] = useState<string | null>(null);
  const [topUpQr, setTopUpQr] = useState<string | null>(null);
  const [topUpQrImg, setTopUpQrImg] = useState<string | null>(null);
  const [topUpWaiting, setTopUpWaiting] = useState(false);
  const [topUpBusy, setTopUpBusy] = useState(false);
  const [topUpErr, setTopUpErr] = useState<string | null>(null);
  const [amountBahtInput, setAmountBahtInput] = useState("");

  const resetTopUpModal = useCallback(() => {
    setTopUpOrderId(null);
    setTopUpQr(null);
    setTopUpQrImg(null);
    setTopUpWaiting(false);
    setTopUpErr(null);
    setAmountBahtInput("");
  }, []);

  const closeTopUpModal = useCallback(() => {
    setTopUpOpen(false);
    setTopUp(null);
    resetTopUpModal();
  }, [resetTopUpModal]);

  async function selectPlan(price: number) {
    setErr(null);
    setLoading(price);
    try {
      const res = await fetch("/api/subscription/buffet/purchase-from-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountBaht: price }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        code?: string;
        balance?: number;
        requiredTokens?: number;
        error?: string;
      };

      if (res.ok && data.ok) {
        router.refresh();
        return;
      }

      if (res.status === 402 && data.code === "INSUFFICIENT_TOKENS") {
        const bal = data.balance ?? 0;
        const req = data.requiredTokens ?? 0;
        const short = Math.max(1, req - bal);
        setTopUp({
          planPrice: price,
          shortfallTokens: short,
          balance: bal,
          amountBaht: short,
        });
        setAmountBahtInput(String(short));
        setTopUpOpen(true);
        setTopUpOrderId(null);
        setTopUpQr(null);
        setTopUpQrImg(null);
        setTopUpWaiting(false);
        setTopUpErr(null);
        return;
      }

      setErr(data.error ?? "ดำเนินการไม่สำเร็จ");
    } finally {
      setLoading(null);
    }
  }

  async function createTopUpOrder() {
    const n = Number.parseInt(amountBahtInput.trim(), 10);
    if (!Number.isFinite(n) || n < 1 || n > 100_000) {
      setTopUpErr("กรอกยอดเติม 1–100000 บาท (1 บาท = 1 โทเคน)");
      return;
    }
    setTopUpBusy(true);
    setTopUpErr(null);
    try {
      const res = await fetch("/api/payments/melody/topup/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amountBaht: n }),
      });
      const data = (await res.json()) as { error?: string; orderId?: string; qrCodeContent?: string | null };
      if (!res.ok) {
        setTopUpErr(data.error ?? "สร้างคำสั่งเติมโทเคนไม่สำเร็จ");
        return;
      }
      setTopUpOrderId(data.orderId ?? null);
      setTopUpQr(data.qrCodeContent ?? null);
      setTopUpQrImg(null);
      setTopUpWaiting(Boolean(data.orderId));
    } finally {
      setTopUpBusy(false);
    }
  }

  const tryFinishAfterTopUp = useCallback(async () => {
    if (!topUp) return;
    const res = await fetch("/api/subscription/buffet/purchase-from-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ amountBaht: topUp.planPrice }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (res.ok && data.ok) {
      closeTopUpModal();
      router.refresh();
      return;
    }
    setTopUpErr(data.error ?? "โทเคนยังไม่พอหรือยังไม่เข้า — ลองอีกครั้งหลังชำระสำเร็จ");
  }, [topUp, router, closeTopUpModal]);

  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    let done = false;
    if (!topUpQr) {
      setTopUpQrImg(null);
      return;
    }
    (async () => {
      try {
        const dataUrl = await QRCode.toDataURL(topUpQr, { margin: 1, width: 260 });
        if (!done) setTopUpQrImg(dataUrl);
      } catch {
        if (!done) setTopUpQrImg(null);
      }
    })();
    return () => {
      done = true;
    };
  }, [topUpQr]);

  useEffect(() => {
    if (!topUpOrderId || !topUpWaiting) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/melody/status/${topUpOrderId}`, { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as { paid?: boolean; status?: string };
        if (!res.ok) return;
        if (data.paid || data.status === "PAID") {
          setTopUpWaiting(false);
          await tryFinishAfterTopUp();
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [topUpOrderId, topUpWaiting, tryFinishAfterTopUp]);

  async function simulateTopUpPay() {
    if (!topUpOrderId) return;
    setTopUpErr(null);
    const res = await fetch("/api/payments/melody/simulate-pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId: topUpOrderId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setTopUpErr(data.error ?? "จำลองชำระไม่สำเร็จ");
      return;
    }
    setTopUpWaiting(false);
    await tryFinishAfterTopUp();
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border border-[#d8d6ec] bg-[#faf9ff]/80 px-4 py-3 text-sm text-[#2e2a58]">
        <p className="font-semibold">โทเคนคงเหลือ</p>
        <p className="mt-1 tabular-nums text-lg font-bold text-[#0000BF]">{tokens.toLocaleString("th-TH")} โทเคน</p>
        <p className="mt-1 text-xs leading-relaxed text-[#66638c]">
          สมัครแพ็กเหมา: ถ้าโทเคนพอ ระบบหักทันที · ถ้าไม่พอจะเปิดหน้าต่างเติมโทเคน (ชำระแล้วลองสมัครอัตโนมัติ)
        </p>
      </div>

      {showUpgradeHint ? (
        <div
          className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-semibold">ต้องการสิทธิ์เพิ่ม?</p>
          <p className="mt-1 text-amber-900/90">
            โมดูลนี้อยู่นอกแพ็กเกจหรือกลุ่มที่คุณใช้ได้ — เลือกแพ็กเกจด้านล่างเพื่ออัปเกรดการเข้าถึงกลุ่มโมดูล
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col rounded-2xl border-2 border-[#0000BF]/20 bg-gradient-to-b from-indigo-50/90 to-white p-5 shadow-sm ring-1 ring-indigo-100/80">
          <p className="text-lg font-bold text-[#2e2a58]">{DAILY_LINE_PLAN_SUMMARY.title}</p>
          <p className="mt-1 text-xs text-slate-600">{DAILY_LINE_PLAN_SUMMARY.subtitle}</p>
          <ul className="mt-3 flex-1 space-y-1.5 text-xs leading-relaxed text-slate-600">
            {DAILY_LINE_PLAN_SUMMARY.lines.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
          {subscriptionType === "DAILY" ? (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-800">
              คุณใช้สายรายวันอยู่
            </p>
          ) : subscriptionType === "BUFFET" && subscriptionTier !== "NONE" ? (
            <p className="mt-4 text-center text-xs text-slate-600">
              คุณใช้แพ็กเหมารายเดือน — ปรับระดับได้จากการ์ดด้านข้าง (เปิดรับสมัครเฉพาะ 199 โทเคน)
            </p>
          ) : (
            <p className="mt-4 text-center text-xs text-slate-500">
              ต้องการรายเดือนเลือกการ์ด &quot;แพ็กเหมา&quot; ด้านข้าง · เปลี่ยนกลับมาสายรายวันติดต่อแอดมิน
            </p>
          )}
        </div>

        {PLAN_PRICES.map((price) => {
          const tier = PRICE_TO_TIER[price];
          const fullCost = TIER_SUBSCRIPTION_TOKEN_COST[tier];
          const maxG = buffetTierMaxGroup(tier);
          const packTierName = MODULE_GROUP_TIER_NAME[maxG] ?? "";
          const bullets = tierGroupBullets(tier);
          const tierOpen = isBuffetTierOpenForPurchase(tier);
          const charge = computeBuffetSubscriptionTokenCharge({
            targetTier: tier,
            currentTier: subscriptionTier,
            subscriptionType,
          });
          const canSelect = charge.ok && tierOpen;
          const enough = charge.ok && tokens >= charge.tokensToDeduct;
          const disabledReason = !tierOpen
            ? "ปิดจำหน่ายชั่วคราว — เปิดเฉพาะแพ็ก 199 โทเคน"
            : !charge.ok
              ? charge.error
              : null;

          return (
            <div
              key={price}
              className={cn(
                "flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
                tierOpen ? "border-slate-200" : "border-slate-200/80 bg-slate-50/80 opacity-90",
              )}
            >
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {fullCost}
                <span className="text-base font-normal text-slate-500"> โทเคน</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">
                แพ็กเหมา · กลุ่ม 1{maxG > 1 ? `–${maxG}` : ""}
                {packTierName ? ` (${packTierName})` : ""}
              </p>
              {!tierOpen ? (
                <p className="mt-2 text-xs font-medium text-amber-800">ปิดจำหน่ายชั่วคราว</p>
              ) : charge.ok ? (
                <>
                  <p
                    className={cn(
                      "mt-2 text-sm font-medium",
                      charge.tokensToDeduct < fullCost ? "text-emerald-700" : "text-slate-800",
                    )}
                  >
                    {charge.tokensToDeduct < fullCost
                      ? `อัปเกรด: หัก ${charge.tokensToDeduct} โทเคน (ส่วนต่าง)`
                      : `สมัคร: หัก ${charge.tokensToDeduct} โทเคน`}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs font-medium",
                      enough ? "text-emerald-700" : "text-amber-800",
                    )}
                  >
                    {enough ? "โทเคนของคุณพอ — กดแล้วสมัครทันที" : `โทเคนไม่พอ — ขาด ${charge.tokensToDeduct - tokens} โทเคน (จะเปิดเติมโทเคน)`}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-amber-800">{charge.error}</p>
              )}
              <ul className="mt-3 flex-1 space-y-1 text-xs text-slate-600">
                {bullets.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={loading === price || !canSelect}
                title={disabledReason ?? undefined}
                onClick={() => selectPlan(price)}
                className={cn(
                  "mt-4 w-full rounded-lg py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-55",
                  tierOpen
                    ? "bg-[#0000BF] text-white hover:bg-[#0000a3]"
                    : "border border-slate-300 bg-slate-100 text-slate-500",
                )}
              >
                {loading === price
                  ? "กำลังดำเนินการ..."
                  : !tierOpen
                    ? "ไม่เปิดรับสมัคร"
                    : enough
                      ? "สมัครด้วยโทเคน"
                      : "สมัคร / เติมโทเคน"}
              </button>
            </div>
          );
        })}
      </div>

      <FormModal
        open={topUpOpen}
        onClose={closeTopUpModal}
        title="เติมโทเคน"
        description={
          topUp ?
            `ต้องการอีกอย่างน้อย ${topUp.shortfallTokens} โทเคน (ยอดปัจจุบัน ${topUp.balance}) · 1 บาท = 1 โทเคน`
          : undefined
        }
        footer={
          <FormModalFooterActions
            onCancel={closeTopUpModal}
            submitLabel={topUpOrderId ? "ปิด" : "สร้าง QR ชำระ"}
            submitDisabled={topUpBusy}
            loading={topUpBusy}
            onSubmit={() => {
              if (topUpOrderId) closeTopUpModal();
              else void createTopUpOrder();
            }}
          />
        }
      >
        <div className="space-y-4 text-sm">
          {!topUpOrderId ? (
            <label className="block">
              <span className="text-xs font-semibold text-slate-600">ยอดเติม (บาท)</span>
              <input
                type="number"
                min={1}
                max={100_000}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 tabular-nums outline-none focus:border-[#4d47b6]/40 focus:ring-2 focus:ring-[#4d47b6]/15"
                value={amountBahtInput}
                onChange={(e) => setAmountBahtInput(e.target.value)}
              />
            </label>
          ) : null}
          {topUpErr ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {topUpErr}
            </p>
          ) : null}
          {topUpQr ? (
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              {topUpQrImg ? (
                <img src={topUpQrImg} alt="QR เติมโทเคน" className="mx-auto h-52 w-52 rounded-md" />
              ) : (
                <p className="text-center text-xs text-slate-500">กำลังสร้าง QR...</p>
              )}
              <p className="mt-2 text-center text-xs text-slate-600">
                {topUpWaiting ? "หลังชำระสำเร็จ ระบบจะลองสมัครแพ็กให้อัตโนมัติ" : "ชำระแล้ว"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {isDev && topUpOrderId ? (
                  <button
                    type="button"
                    onClick={() => void simulateTopUpPay()}
                    className="w-full rounded-lg border border-blue-300 bg-blue-50 py-2 text-xs font-semibold text-blue-900"
                  >
                    จำลองชำระสำเร็จ (dev)
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void tryFinishAfterTopUp()}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                >
                  ลองสมัครแพ็กอีกครั้ง (หลังเติมโทเคนแล้ว)
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </FormModal>

      {err ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
